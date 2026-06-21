import { roundMoney, safeNumber, toMoney } from "./money.js";

const addMonths = (date, months) => {
  const result = new Date(date);
  const day = result.getDate();

  result.setMonth(result.getMonth() + months);

  if (result.getDate() < day) {
    result.setDate(0);
  }

  return result;
};

const formatDateOnly = (value) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const ordinal = (value) => {
  const number = Number(value);
  if (number >= 11 && number <= 13) return `${number}th`;

  switch (number % 10) {
    case 1:
      return `${number}st`;
    case 2:
      return `${number}nd`;
    case 3:
      return `${number}rd`;
    default:
      return `${number}th`;
  }
};

export const ensurePaymentScheduleTable = async (connectionOrDb) => {
  await connectionOrDb.query(`
    CREATE TABLE IF NOT EXISTS payment_schedules (
      id INT NOT NULL AUTO_INCREMENT,
      client_unit_id INT NOT NULL,
      due_date DATE NULL,
      description VARCHAR(150) NOT NULL,
      schedule_type ENUM('reservation','downpayment','monthly','balloon','legal_misc','penalty','other') NOT NULL DEFAULT 'monthly',
      principal_due DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      interest_due DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      penalty_due DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      total_due DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      advance_applied DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      date_paid DATE NULL,
      reference_no VARCHAR(150) NULL,
      status ENUM('not_due','due','partial','paid','paid_ahead','past_due','waived') NOT NULL DEFAULT 'not_due',
      running_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_payment_schedules_client_unit_id (client_unit_id),
      KEY idx_payment_schedules_due_date (due_date),
      KEY idx_payment_schedules_status (status),
      CONSTRAINT fk_payment_schedules_client_unit
        FOREIGN KEY (client_unit_id) REFERENCES client_units (id)
        ON DELETE CASCADE
    )
  `);
};

const buildBaseRows = (unit) => {
  const totalContractPrice = toMoney(
    unit.offer_purchase_price || unit.total_contract_price,
  );
  const reservationFee = toMoney(
    unit.reservation_fee_amount || unit.listing_reservation_fee,
  );
  const downpayment = toMoney(
    unit.downpayment_net_amount || unit.downpayment_amount,
  );
  const downpaymentGives = Math.max(Number(unit.downpayment_gives || 3), 1);
  const deferredCash = toMoney(unit.deferred_cash_amount);
  const terms = Math.max(Number(unit.payment_terms_months || 0), 0);
  const monthly = toMoney(unit.monthly_amortization);
  const startingDate = unit.starting_date || unit.created_at;
  const firstDueDate = unit.due_date || unit.starting_date || unit.created_at;
  const rows = [];

  const pushRow = (dueDate, description, amount, scheduleType) => {
    const totalDue = toMoney(amount);
    if (totalDue <= 0) return;

    rows.push({
      due_date: formatDateOnly(dueDate),
      description,
      schedule_type: scheduleType,
      principal_due: totalDue,
      interest_due: 0,
      penalty_due: 0,
      total_due: totalDue,
      amount_paid: 0,
      advance_applied: 0,
      balance: totalDue,
      date_paid: null,
      reference_no: null,
      status: "not_due",
      running_balance: totalContractPrice,
      sort_order: rows.length + 1,
    });
  };

  pushRow(startingDate, "Reservation Fee", reservationFee, "reservation");

  if (unit.mode_of_payment === "cash") {
    pushRow(
      firstDueDate,
      "Deferred Cash",
      deferredCash || Math.max(totalContractPrice - reservationFee, 0),
      "other",
    );
    return { rows, totalContractPrice };
  }

  if (downpayment > 0) {
    const perDownpayment = roundMoney(downpayment / downpaymentGives);
    const first = new Date(firstDueDate);

    for (let index = 1; index <= downpaymentGives; index += 1) {
      const dueDate = addMonths(first, index - 1);
      const amount =
        index === downpaymentGives
          ? roundMoney(downpayment - perDownpayment * (downpaymentGives - 1))
          : perDownpayment;

      pushRow(dueDate, `${ordinal(index)} Downpayment`, amount, "downpayment");
    }
  }

  const monthlyStart = addMonths(
    new Date(firstDueDate),
    downpayment > 0 ? downpaymentGives : 0,
  );

  let remainingMonthlyTotal = roundMoney(
    Math.max(totalContractPrice - reservationFee - downpayment - deferredCash, 0),
  );

  for (let index = 1; index <= terms; index += 1) {
    const dueDate = addMonths(monthlyStart, index - 1);
    const amount =
      index === terms ? roundMoney(remainingMonthlyTotal) : monthly;

    pushRow(dueDate, `${ordinal(index)} Monthly Payment`, amount, "monthly");
    remainingMonthlyTotal = roundMoney(remainingMonthlyTotal - amount);
  }

  return { rows, totalContractPrice };
};

const compareDate = (left, right) => {
  if (!left || !right) return 0;
  return String(left).localeCompare(String(right));
};

const applyPaymentsToRows = ({ rows, payments, totalContractPrice }) => {
  let runningBalance = totalContractPrice;
  let advanceCredit = 0;

  for (const payment of payments) {
    let remainingPayment = toMoney(payment.amount);
    const paymentDate = formatDateOnly(payment.payment_date);
    const reference =
      payment.reference_id ||
      payment.payment_method ||
      payment.payment_type ||
      `Payment #${payment.id}`;

    for (const row of rows) {
      if (remainingPayment <= 0) break;
      if (row.balance <= 0) continue;

      const applied = roundMoney(Math.min(row.balance, remainingPayment));
      row.amount_paid = roundMoney(row.amount_paid + applied);
      row.balance = roundMoney(row.total_due - row.amount_paid);
      row.date_paid = row.balance <= 0 ? paymentDate : row.date_paid;
      row.reference_no = reference;
      row.status =
        row.balance <= 0
          ? compareDate(paymentDate, row.due_date) < 0
            ? "paid_ahead"
            : "paid"
          : "partial";

      remainingPayment = roundMoney(remainingPayment - applied);
      runningBalance = roundMoney(Math.max(runningBalance - applied, 0));
      row.running_balance = runningBalance;
    }

    if (remainingPayment > 0) {
      advanceCredit = roundMoney(advanceCredit + remainingPayment);
      runningBalance = roundMoney(Math.max(runningBalance - remainingPayment, 0));
    }
  }

  const today = formatDateOnly(new Date());
  let latestRunningBalance = totalContractPrice;

  for (const row of rows) {
    if (row.amount_paid > 0) {
      latestRunningBalance = row.running_balance;
      continue;
    }

    row.running_balance = latestRunningBalance;
    row.status = row.due_date && row.due_date < today ? "past_due" : "not_due";
  }

  return { rows, advanceCredit };
};

export const rebuildPaymentScheduleForClientUnit = async (
  connectionOrDb,
  clientUnitId,
) => {
  await ensurePaymentScheduleTable(connectionOrDb);

  const [unitRows] = await connectionOrDb.query(
    `
    SELECT
      cu.*,
      l.total_contract_price,
      l.reservation_fee AS listing_reservation_fee
    FROM client_units cu
    INNER JOIN listings l ON l.id = cu.listing_id
    WHERE cu.id = ?
    LIMIT 1
    `,
    [clientUnitId],
  );

  const unit = unitRows[0];
  if (!unit) return null;

  const [payments] = await connectionOrDb.query(
    `
    SELECT id, amount, payment_type, payment_method, reference_id, payment_date
    FROM payments
    WHERE client_unit_id = ?
      AND status = 'verified'
    ORDER BY payment_date ASC, id ASC
    `,
    [clientUnitId],
  );

  const { rows, totalContractPrice } = buildBaseRows(unit);
  const allocation = applyPaymentsToRows({
    rows,
    payments,
    totalContractPrice,
  });

  await connectionOrDb.query(
    `DELETE FROM payment_schedules WHERE client_unit_id = ?`,
    [clientUnitId],
  );

  if (allocation.rows.length > 0) {
    const values = allocation.rows.map((row) => [
      clientUnitId,
      row.due_date,
      row.description,
      row.schedule_type,
      row.principal_due,
      row.interest_due,
      row.penalty_due,
      row.total_due,
      row.amount_paid,
      row.advance_applied,
      row.balance,
      row.date_paid,
      row.reference_no,
      row.status,
      row.running_balance,
      row.sort_order,
    ]);

    await connectionOrDb.query(
      `
      INSERT INTO payment_schedules (
        client_unit_id,
        due_date,
        description,
        schedule_type,
        principal_due,
        interest_due,
        penalty_due,
        total_due,
        amount_paid,
        advance_applied,
        balance,
        date_paid,
        reference_no,
        status,
        running_balance,
        sort_order
      ) VALUES ?
      `,
      [values],
    );
  }

  return {
    rowCount: allocation.rows.length,
    advanceCredit: allocation.advanceCredit,
  };
};
