ALTER TABLE listings
MODIFY COLUMN status ENUM(
  'available',
  'reserved',
  'active',
  'hold',
  'sold',
  'inactive',
  'superseded'
) NOT NULL DEFAULT 'available';

CREATE TABLE IF NOT EXISTS listing_unit_aliases (
  id INT NOT NULL AUTO_INCREMENT,
  listing_id INT NOT NULL,
  alias_unit_id VARCHAR(255) NOT NULL,
  alias_type ENUM('old_unit_id', 'survey_id', 'marketing_id', 'other') NOT NULL DEFAULT 'old_unit_id',
  notes VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_listing_unit_alias (listing_id, alias_unit_id),
  KEY idx_listing_unit_alias_lookup (alias_unit_id),
  CONSTRAINT fk_listing_unit_alias_listing
    FOREIGN KEY (listing_id) REFERENCES listings(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS listing_unit_lineage (
  id INT NOT NULL AUTO_INCREMENT,
  parent_listing_id INT NOT NULL,
  child_listing_id INT NOT NULL,
  relationship_type ENUM('split', 'merge', 'renumbered', 'resurveyed') NOT NULL DEFAULT 'renumbered',
  notes VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_listing_lineage_pair (parent_listing_id, child_listing_id),
  KEY idx_listing_lineage_parent (parent_listing_id),
  KEY idx_listing_lineage_child (child_listing_id),
  CONSTRAINT fk_listing_lineage_parent
    FOREIGN KEY (parent_listing_id) REFERENCES listings(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_listing_lineage_child
    FOREIGN KEY (child_listing_id) REFERENCES listings(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
