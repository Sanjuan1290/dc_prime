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
);
