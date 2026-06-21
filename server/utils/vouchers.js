import { db } from "../db/connect.js";
import { buildVoucherNumber } from "./formulas/referenceFormulas.js";
import { toMoney } from "./money.js";

const DEFAULT_VOUCHER_PREFIX = "VCH";

const isMissing = (value) => value === undefined || value === null || value === "";

const nullableValue = (value) => (isMissing(value) ? null : value);

export const ensureVoucherTable = async (connectionOrDb = db) => {
  await connectionOrDb.query(`
    CREATE TABLE IF NOT EXISTS vouchers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      voucher_no VARCHAR(50) NOT NULL UNIQUE,
      voucher_type ENUM(
        'commission_release',
        'cash_advance',
        'refund',
        'payment_receipt',
        'cash_advance_deduction'
      ) NOT NULL,
      source_type VARCHAR(80) NOT NULL,
      source_id INT NOT NULL,
      payee_type ENUM('seller', 'client', 'company', 'other') NOT NULL DEFAULT 'other',
      payee_id INT NULL,
      payee_name VARCHAR(255) NOT NULL,
      amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
      status ENUM('generated', 'printed', 'signed', 'released', 'voided') NOT NULL DEFAULT 'generated',
      generated_by INT NULL,
      printed_at DATETIME NULL,
      signed_at DATETIME NULL,
      released_at DATETIME NULL,
      voided_at DATETIME NULL,
      remarks TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_vouchers_source (source_type, source_id, voucher_type),
      KEY idx_vouchers_type_status (voucher_type, status),
      KEY idx_vouchers_payee (payee_type, payee_id)
    )
  `);
};

export const getVoucherPrefix = async (connectionOrDb = db) => {
  const [rows] = await connectionOrDb
    .query(
      `
      SELECT setting_value
      FROM system_formula_settings
      WHERE setting_key = 'voucher.prefix'
      LIMIT 1
      `,
    )
    .catch(() => [[]]);

  return rows[0]?.setting_value || DEFAULT_VOUCHER_PREFIX;
};

const generateUniqueVoucherNumber = async (connectionOrDb = db) => {
  const prefix = await getVoucherPrefix(connectionOrDb);
  const todayPrefix = buildVoucherNumber({
    prefix,
    sequence: 0,
  }).replace(/-0000$/, "");

  const [rows] = await connectionOrDb.query(
    `
    SELECT voucher_no
    FROM vouchers
    WHERE voucher_no LIKE ?
    ORDER BY voucher_no DESC
    LIMIT 1
    `,
    [`${todayPrefix}-%`],
  );

  const latestSequence = Number(
    String(rows[0]?.voucher_no || "").split("-").pop() || 0,
  );

  return buildVoucherNumber({
    prefix,
    sequence: latestSequence + 1,
  });
};

export const createVoucherForSource = async ({
  connection,
  voucherType,
  sourceType,
  sourceId,
  payeeType = "other",
  payeeId = null,
  payeeName,
  amount,
  generatedBy = null,
  remarks = null,
}) => {
  const connectionOrDb = connection || db;

  if (isMissing(voucherType) || isMissing(sourceType) || isMissing(sourceId)) {
    return null;
  }

  await ensureVoucherTable(connectionOrDb);

  const [existingRows] = await connectionOrDb.query(
    `
    SELECT *
    FROM vouchers
    WHERE source_type = ?
      AND source_id = ?
      AND voucher_type = ?
    LIMIT 1
    `,
    [sourceType, sourceId, voucherType],
  );

  if (existingRows[0]) {
    return existingRows[0];
  }

  const voucherNo = await generateUniqueVoucherNumber(connectionOrDb);

  const [result] = await connectionOrDb.query(
    `
    INSERT INTO vouchers (
      voucher_no,
      voucher_type,
      source_type,
      source_id,
      payee_type,
      payee_id,
      payee_name,
      amount,
      status,
      generated_by,
      remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'generated', ?, ?)
    `,
    [
      voucherNo,
      voucherType,
      sourceType,
      sourceId,
      payeeType,
      nullableValue(payeeId),
      payeeName || "Unspecified Payee",
      toMoney(amount),
      nullableValue(generatedBy),
      nullableValue(remarks),
    ],
  );

  const [createdRows] = await connectionOrDb.query(
    `
    SELECT *
    FROM vouchers
    WHERE id = ?
    LIMIT 1
    `,
    [result.insertId],
  );

  return createdRows[0] || null;
};
