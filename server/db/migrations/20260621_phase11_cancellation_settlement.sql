ALTER TABLE client_units
  ADD COLUMN cancellation_date DATE NULL,
  ADD COLUMN cancellation_result ENUM(
    'refunded',
    'partial_refund',
    'forfeited',
    'no_refund',
    'pending_settlement'
  ) NULL,
  ADD COLUMN total_paid_by_client DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN refund_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN forfeited_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN cancellation_reason TEXT NULL,
  ADD COLUMN cancellation_approved_by INT NULL,
  ADD COLUMN settlement_date DATE NULL,
  ADD COLUMN cancellation_remarks TEXT NULL,
  ADD COLUMN cleared_for_resale_at DATETIME NULL,
  ADD COLUMN cleared_for_resale_by INT NULL;

ALTER TABLE client_units
  ADD KEY idx_client_units_cancellation_result (cancellation_result),
  ADD KEY idx_client_units_cleared_for_resale_at (cleared_for_resale_at);
