import { db } from "../db/connect.js";
import { safeCreateAuditLog } from "../utils/createAuditLog.js";
import { getClientIp } from "../utils/getClientIp.js";

const requestRoles = [
  "broker_network_manager",
  "broker",
  "manager",
  "agent",
  "admin",
  "super_admin",
];

const verifyRoles = ["admin", "super_admin"];

const allowedStatuses = [
  "not_requested",
  "requested",
  "submitted",
  "verified",
  "rejected",
  "waived",
  "cancelled",
];

const allowedDocumentTypes = [
  "Certificate of Employment",
  "Payslip",
  "Income Tax Return",
  "Bank Statement",
  "Business Permit",
  "DTI Registration",
  "SEC Registration",
  "Proof of Remittance",
  "Pension Proof",
  "Barangay Business Clearance",
  "Other Supporting Income Document",
];

const isMissing = (value) => value === undefined || value === null || value === "";
const nullableValue = (value) => (isMissing(value) ? null : value);

export const ensureProofIncomeRequestsTable = async (connectionOrDb = db) => {
  await connectionOrDb.query(`
    CREATE TABLE IF NOT EXISTS proof_income_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      client_unit_id INT NULL,
      document_type VARCHAR(120) NOT NULL,
      status ENUM(
        'not_requested',
        'requested',
        'submitted',
        'verified',
        'rejected',
        'waived',
        'cancelled'
      ) NOT NULL DEFAULT 'requested',
      requested_by INT NULL,
      requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      submitted_at DATETIME NULL,
      verified_by INT NULL,
      verified_at DATETIME NULL,
      admin_remarks TEXT NULL,
      requester_remarks TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_proof_income_client (client_id),
      KEY idx_proof_income_status (status)
    )
  `);
};

const proofIncomeFields = `
  pir.*,
  client.full_name AS client_name,
  listing.unit_id,
  project.name AS project_name,
  requester.full_name AS requested_by_name,
  verifier.full_name AS verified_by_name
`;

const proofIncomeJoins = `
  FROM proof_income_requests pir
  INNER JOIN clients client ON client.id = pir.client_id
  LEFT JOIN client_units cu ON cu.id = pir.client_unit_id
  LEFT JOIN listings listing ON listing.id = cu.listing_id
  LEFT JOIN projects project ON project.id = listing.project_id
  LEFT JOIN users requester ON requester.id = pir.requested_by
  LEFT JOIN users verifier ON verifier.id = pir.verified_by
`;

export const getProofIncomeRequests = async (req, res) => {
  const { clientId } = req.params;
  const { status } = req.query;

  await ensureProofIncomeRequestsTable();

  const conditions = [];
  const params = [];

  if (!isMissing(clientId)) {
    conditions.push("pir.client_id = ?");
    params.push(clientId);
  }

  if (!isMissing(status) && status !== "all") {
    conditions.push("pir.status = ?");
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query(
    `
    SELECT ${proofIncomeFields}
    ${proofIncomeJoins}
    ${whereClause}
    ORDER BY pir.id DESC
    `,
    params,
  );

  return res.status(200).json({
    message: "Proof of income requests fetched successfully",
    proofIncomeRequests: rows,
    data: rows,
    documentTypes: allowedDocumentTypes,
  });
};

export const createProofIncomeRequest = async (req, res) => {
  const { clientId } = req.params;
  const { client_unit_id, document_type, requester_remarks } = req.body;

  if (!requestRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "You cannot request proof of income." });
  }

  if (!allowedDocumentTypes.includes(document_type)) {
    return res.status(400).json({ message: "Invalid proof of income document type" });
  }

  await ensureProofIncomeRequestsTable();

  const [clientRows] = await db.query(
    `SELECT id FROM clients WHERE id = ? LIMIT 1`,
    [clientId],
  );

  if (!clientRows[0]) {
    return res.status(404).json({ message: "Client not found" });
  }

  const [result] = await db.query(
    `
    INSERT INTO proof_income_requests (
      client_id,
      client_unit_id,
      document_type,
      status,
      requested_by,
      requester_remarks
    ) VALUES (?, ?, ?, 'requested', ?, ?)
    `,
    [
      clientId,
      nullableValue(client_unit_id),
      document_type,
      req.user.id,
      nullableValue(requester_remarks),
    ],
  );

  await safeCreateAuditLog({
    userId: req.user.id,
    action: "create",
    module: "Proof of Income Requests",
    description: `Requested ${document_type} for client ${clientId}`,
    ipAddress: getClientIp(req),
  });

  return res.status(201).json({
    message: "Proof of income request created successfully",
    data: {
      proofIncomeRequestId: result.insertId,
    },
  });
};

export const updateProofIncomeRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status, admin_remarks } = req.body;

  if (!verifyRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Only admin can verify proof requests." });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid proof request status" });
  }

  await ensureProofIncomeRequestsTable();

  const [result] = await db.query(
    `
    UPDATE proof_income_requests
    SET
      status = ?,
      admin_remarks = COALESCE(?, admin_remarks),
      submitted_at = CASE WHEN ? = 'submitted' THEN COALESCE(submitted_at, NOW()) ELSE submitted_at END,
      verified_by = CASE WHEN ? IN ('verified', 'rejected', 'waived') THEN ? ELSE verified_by END,
      verified_at = CASE WHEN ? IN ('verified', 'rejected', 'waived') THEN COALESCE(verified_at, NOW()) ELSE verified_at END
    WHERE id = ?
    `,
    [
      status,
      nullableValue(admin_remarks),
      status,
      status,
      req.user.id,
      status,
      id,
    ],
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: "Proof of income request not found" });
  }

  await safeCreateAuditLog({
    userId: req.user.id,
    action: "update",
    module: "Proof of Income Requests",
    description: `Updated proof request ${id} to ${status}`,
    ipAddress: getClientIp(req),
  });

  return res.status(200).json({
    message: "Proof of income request updated successfully",
    data: {
      proofIncomeRequestId: Number(id),
      status,
    },
  });
};
