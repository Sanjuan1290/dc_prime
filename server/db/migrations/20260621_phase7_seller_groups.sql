CREATE TABLE IF NOT EXISTS seller_groups (
  id INT NOT NULL AUTO_INCREMENT,
  group_name VARCHAR(150) NOT NULL,
  group_type ENUM('external_realty','broker_group','independent_broker','in_house_sales_team','referral_partner','direct_developer') NOT NULL,
  pool_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  group_head_id INT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  remarks TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_seller_groups_group_head_id (group_head_id),
  KEY idx_seller_groups_status (status),
  CONSTRAINT fk_seller_groups_group_head
    FOREIGN KEY (group_head_id) REFERENCES accredited_sellers (id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS seller_group_members (
  id INT NOT NULL AUTO_INCREMENT,
  seller_group_id INT NOT NULL,
  seller_id INT NOT NULL,
  role_in_group VARCHAR(100) NULL,
  joined_at DATE NULL,
  left_at DATE NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_seller_group_members_group_id (seller_group_id),
  KEY idx_seller_group_members_seller_id (seller_id),
  KEY idx_seller_group_members_status (status),
  KEY idx_seller_group_members_seller_status (seller_id, status),
  CONSTRAINT fk_seller_group_members_group
    FOREIGN KEY (seller_group_id) REFERENCES seller_groups (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_seller_group_members_seller
    FOREIGN KEY (seller_id) REFERENCES accredited_sellers (id)
    ON DELETE CASCADE
);

ALTER TABLE client_units
  ADD COLUMN seller_group_id INT NULL AFTER seller_id,
  ADD COLUMN seller_group_pool_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER seller_group_id,
  ADD KEY idx_client_units_seller_group_id (seller_group_id);
