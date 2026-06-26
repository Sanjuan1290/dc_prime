-- Run this once after backing up the database.
-- Adds admin-controlled email logs and Cloudinary fields.

CREATE TABLE IF NOT EXISTS email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NULL,
  client_unit_id INT NULL,
  sent_to VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message_type ENUM('payment_due','missing_documents','past_due','custom') NOT NULL,
  message_body TEXT NOT NULL,
  status ENUM('sent','failed') NOT NULL DEFAULT 'sent',
  error_message TEXT NULL,
  sent_by INT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_email_logs_client_unit (client_unit_id),
  KEY idx_email_logs_client (client_id),
  KEY idx_email_logs_type_status (message_type, status),
  KEY idx_email_logs_sent_at (sent_at),
  CONSTRAINT fk_email_logs_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_email_logs_client_unit FOREIGN KEY (client_unit_id) REFERENCES client_units(id) ON DELETE SET NULL,
  CONSTRAINT fk_email_logs_sent_by FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE client_document_list
  MODIFY storage_provider ENUM('cloudinary','google_drive','local') DEFAULT 'cloudinary';

ALTER TABLE client_document_list
  ADD COLUMN cloudinary_asset_id VARCHAR(255) NULL AFTER storage_provider,
  ADD COLUMN cloudinary_public_id VARCHAR(500) NULL AFTER cloudinary_asset_id,
  ADD COLUMN cloudinary_folder VARCHAR(500) NULL AFTER cloudinary_public_id,
  ADD COLUMN cloudinary_resource_type VARCHAR(50) NULL AFTER cloudinary_folder,
  ADD COLUMN cloudinary_secure_url TEXT NULL AFTER cloudinary_resource_type,
  ADD COLUMN original_file_name VARCHAR(255) NULL AFTER file_name;

CREATE INDEX idx_client_document_list_cloudinary_public_id
  ON client_document_list (cloudinary_public_id(191));

ALTER TABLE client_units
  ADD COLUMN soa_cloudinary_public_id VARCHAR(500) NULL AFTER soa_drive_file_id,
  ADD COLUMN soa_cloudinary_secure_url TEXT NULL AFTER soa_cloudinary_public_id;
