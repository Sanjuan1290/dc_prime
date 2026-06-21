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
  KEY idx_proof_income_status (status),
  CONSTRAINT fk_proof_income_client
    FOREIGN KEY (client_id) REFERENCES clients (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_proof_income_client_unit
    FOREIGN KEY (client_unit_id) REFERENCES client_units (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_proof_income_requested_by
    FOREIGN KEY (requested_by) REFERENCES users (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_proof_income_verified_by
    FOREIGN KEY (verified_by) REFERENCES users (id)
    ON DELETE SET NULL
);
