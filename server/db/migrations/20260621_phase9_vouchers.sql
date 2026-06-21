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
  KEY idx_vouchers_payee (payee_type, payee_id),
  CONSTRAINT fk_vouchers_generated_by
    FOREIGN KEY (generated_by) REFERENCES users (id)
    ON DELETE SET NULL
);
