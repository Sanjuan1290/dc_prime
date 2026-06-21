ALTER TABLE payments
  ADD UNIQUE KEY uq_payments_reference_id (reference_id);

-- MySQL permits multiple NULL values in a UNIQUE key, so non-cash/manual
-- references remain backward-compatible. If this key already exists, skip it.
