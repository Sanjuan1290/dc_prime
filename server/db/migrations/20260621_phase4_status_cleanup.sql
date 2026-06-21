UPDATE listings SET status = 'sold' WHERE status = 'active';
UPDATE listings SET status = 'inactive' WHERE status = 'hold';

ALTER TABLE listings
  MODIFY status ENUM('available','reserved','sold','pending_cancellation','cancelled','inactive','superseded') NOT NULL DEFAULT 'available';

ALTER TABLE client_units
  MODIFY status ENUM('reserved','active','past_due','pending_cancellation','cancelled','fully_paid','closed') NOT NULL DEFAULT 'reserved';

ALTER TABLE payments
  MODIFY status ENUM('pending','verified','rejected','voided') NOT NULL DEFAULT 'pending';

UPDATE commissions SET status = 'approved' WHERE status = 'active';

ALTER TABLE commissions
  MODIFY status ENUM('pending','approved','partially_released','released','cancelled','on_hold','active') NOT NULL DEFAULT 'pending';

ALTER TABLE commission_releases
  MODIFY status ENUM('pending','eligible','released','cancelled','on_hold') NOT NULL DEFAULT 'pending';

-- Voucher and cancellation statuses are introduced with their tables in later
-- migrations. Existing modules should continue to treat payment/listing/account
-- statuses as separate concepts.
