CREATE TABLE IF NOT EXISTS system_formula_settings (
  id INT NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  label VARCHAR(150) NOT NULL,
  formula_text TEXT NOT NULL,
  description TEXT NULL,
  value_type ENUM('number','percentage','currency','days','text','boolean','json') NOT NULL DEFAULT 'text',
  setting_value TEXT NULL,
  default_value TEXT NULL,
  is_editable BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_system_formula_settings_key (setting_key),
  KEY idx_system_formula_settings_category (category),
  KEY idx_system_formula_settings_sort_order (sort_order)
);

-- Formula Center seed data is defined once in server/utils/formulaSettings.js.
-- GET /api/v1/settings/formulas and PATCH /api/v1/settings/formulas/:settingKey
-- safely create this table when needed and upsert all 44 default formula rows
-- without overwriting existing configured values.
