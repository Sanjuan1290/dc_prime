import { db } from "../db/connect.js";
import { safeCreateAuditLog } from "../utils/createAuditLog.js";
import { getClientIp } from "../utils/getClientIp.js";
import { ensureVoucherTable } from "../utils/vouchers.js";

const isMissing = (value) => value === undefined || value === null || value === "";

const allowedVoucherStatuses = [
  "generated",
  "printed",
  "signed",
  "released",
  "voided",
];

const voucherFields = `
  v.*,
  generator.full_name AS generated_by_name
`;

const voucherJoins = `
  FROM vouchers v
  LEFT JOIN users generator ON generator.id = v.generated_by
`;

export const getVouchers = async (req, res) => {
  const { search, voucher_type, status, payee_type, source_type } = req.query;

  await ensureVoucherTable();

  const conditions = [];
  const params = [];

  if (!isMissing(search)) {
    const searchTerm = `%${search}%`;
    conditions.push(`
      (
        v.voucher_no LIKE ?
        OR v.payee_name LIKE ?
        OR v.source_type LIKE ?
        OR v.voucher_type LIKE ?
        OR v.status LIKE ?
      )
    `);
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (!isMissing(voucher_type) && voucher_type !== "all") {
    conditions.push("v.voucher_type = ?");
    params.push(voucher_type);
  }

  if (!isMissing(status) && status !== "all") {
    conditions.push("v.status = ?");
    params.push(status);
  }

  if (!isMissing(payee_type) && payee_type !== "all") {
    conditions.push("v.payee_type = ?");
    params.push(payee_type);
  }

  if (!isMissing(source_type) && source_type !== "all") {
    conditions.push("v.source_type = ?");
    params.push(source_type);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query(
    `
    SELECT ${voucherFields}
    ${voucherJoins}
    ${whereClause}
    ORDER BY v.id DESC
    `,
    params,
  );

  res.status(200).json({
    message: "Vouchers fetched successfully",
    vouchers: rows,
    data: rows,
  });
};

export const getVoucher = async (req, res) => {
  const { id } = req.params;

  await ensureVoucherTable();

  const [rows] = await db.query(
    `
    SELECT ${voucherFields}
    ${voucherJoins}
    WHERE v.id = ?
    LIMIT 1
    `,
    [id],
  );

  if (!rows[0]) {
    return res.status(404).json({ message: "Voucher not found" });
  }

  return res.status(200).json({
    message: "Voucher fetched successfully",
    voucher: rows[0],
    data: rows[0],
  });
};

export const updateVoucherStatus = async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!allowedVoucherStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid voucher status" });
  }

  await ensureVoucherTable();

  const timestampField = {
    printed: "printed_at",
    signed: "signed_at",
    released: "released_at",
    voided: "voided_at",
  }[status];

  const [result] = await db.query(
    `
    UPDATE vouchers
    SET
      status = ?,
      remarks = COALESCE(?, remarks)
      ${timestampField ? `, ${timestampField} = COALESCE(${timestampField}, NOW())` : ""}
    WHERE id = ?
    `,
    [status, remarks || null, id],
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: "Voucher not found" });
  }

  await safeCreateAuditLog({
    userId: req.user.id,
    action: "update",
    module: "Vouchers",
    description: `Updated voucher ${id} to ${status}`,
    ipAddress: getClientIp(req),
  });

  return res.status(200).json({
    message: "Voucher status updated successfully",
    data: {
      voucherId: Number(id),
      status,
    },
  });
};
