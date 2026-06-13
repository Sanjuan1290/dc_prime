-- Stage 3 reservation terms migration
-- Adds cash/installment offer fields to client_units without removing due_day.

DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_missing$$
CREATE PROCEDURE add_column_if_missing(
  IN p_table_name VARCHAR(64),
  IN p_column_name VARCHAR(64),
  IN p_column_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND COLUMN_NAME = p_column_name
  ) THEN
    SET @ddl = CONCAT(
      'ALTER TABLE `',
      p_table_name,
      '` ADD COLUMN `',
      p_column_name,
      '` ',
      p_column_definition
    );
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DROP PROCEDURE IF EXISTS add_index_if_missing$$
CREATE PROCEDURE add_index_if_missing(
  IN p_table_name VARCHAR(64),
  IN p_index_name VARCHAR(64),
  IN p_index_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND INDEX_NAME = p_index_name
  ) THEN
    SET @ddl = CONCAT(
      'ALTER TABLE `',
      p_table_name,
      '` ADD INDEX `',
      p_index_name,
      '` ',
      p_index_definition
    );
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DELIMITER ;

CALL add_column_if_missing('client_units', 'starting_date', 'DATE NULL AFTER `due_day`');
CALL add_column_if_missing('client_units', 'due_date', 'DATE NULL AFTER `starting_date`');
CALL add_column_if_missing('client_units', 'offer_purchase_price', 'DECIMAL(15,2) NULL AFTER `due_date`');
CALL add_column_if_missing('client_units', 'reservation_fee_amount', 'DECIMAL(15,2) NULL AFTER `offer_purchase_price`');
CALL add_column_if_missing('client_units', 'downpayment_amount', 'DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `reservation_fee_amount`');
CALL add_column_if_missing('client_units', 'deferred_cash_amount', 'DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `downpayment_amount`');
CALL add_column_if_missing('client_units', 'offer_balance_amount', 'DECIMAL(15,2) NULL AFTER `deferred_cash_amount`');
CALL add_column_if_missing('client_units', 'payment_terms_months', 'INT NULL AFTER `offer_balance_amount`');
CALL add_column_if_missing('client_units', 'interest_rate', 'DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER `payment_terms_months`');
CALL add_column_if_missing('client_units', 'monthly_amortization', 'DECIMAL(15,2) NULL AFTER `interest_rate`');
CALL add_column_if_missing(
  'client_units',
  'contract_processing_status',
  'ENUM(''pending_profile'',''profile_complete'',''docs_complete'',''ready_for_contract'',''contract_signed'') NOT NULL DEFAULT ''pending_profile'' AFTER `monthly_amortization`'
);

UPDATE client_units
SET starting_date = DATE(created_at)
WHERE id > 0
  AND starting_date IS NULL;

UPDATE client_units cu
INNER JOIN listings l ON l.id = cu.listing_id
SET cu.offer_purchase_price = COALESCE(
  NULLIF(l.total_contract_price, 0),
  COALESCE(l.net_selling_price, 0) + COALESCE(l.legal_misc_fee, 0),
  0
)
WHERE cu.id > 0
  AND cu.offer_purchase_price IS NULL;

UPDATE client_units cu
INNER JOIN listings l ON l.id = cu.listing_id
SET cu.reservation_fee_amount = COALESCE(l.reservation_fee, 0)
WHERE cu.id > 0
  AND cu.reservation_fee_amount IS NULL;

UPDATE client_units
SET payment_terms_months = 36
WHERE mode_of_payment = 'installment'
  AND id > 0
  AND payment_terms_months IS NULL;

UPDATE client_units
SET
  payment_terms_months = NULL,
  monthly_amortization = NULL,
  downpayment_amount = 0,
  interest_rate = 0
WHERE id > 0
  AND mode_of_payment = 'cash';

UPDATE client_units
SET offer_balance_amount = GREATEST(
  COALESCE(offer_purchase_price, 0)
    - COALESCE(reservation_fee_amount, 0)
    - COALESCE(downpayment_amount, 0)
    - COALESCE(deferred_cash_amount, 0),
  0
)
WHERE id > 0
  AND offer_balance_amount IS NULL;

UPDATE client_units
SET monthly_amortization = ROUND(
  (offer_balance_amount + (offer_balance_amount * (interest_rate / 100)))
    / payment_terms_months,
  2
)
WHERE mode_of_payment = 'installment'
  AND id > 0
  AND payment_terms_months IN (36, 60)
  AND monthly_amortization IS NULL;

UPDATE client_units
SET balance = COALESCE(offer_balance_amount, balance)
WHERE id > 0
  AND offer_balance_amount IS NOT NULL;

CALL add_index_if_missing('client_units', 'idx_client_units_due_date', '(`due_date`)');
CALL add_index_if_missing('client_units', 'idx_client_units_starting_date', '(`starting_date`)');
CALL add_index_if_missing('client_units', 'idx_client_units_payment_terms', '(`mode_of_payment`, `payment_terms_months`)');
CALL add_index_if_missing('client_units', 'idx_client_units_contract_processing_status', '(`contract_processing_status`)');

DROP PROCEDURE IF EXISTS add_column_if_missing;
DROP PROCEDURE IF EXISTS add_index_if_missing;
