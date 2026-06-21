import { db } from "../db/connect.js";
import { safeCreateAuditLog } from "../utils/createAuditLog.js";
import { getClientIp } from "../utils/getClientIp.js";
import {
  formulaSettingsSeed,
  validateFormulaSettingValue,
} from "../utils/formulaSettings.js";

const defaultSettingsMap = {
  company_name: "D&C Prime Realty",
  company_email: "admin@gmail.com",
  company_contact: "09000000000",
  company_address: "",
  system_status: "active",
  reservation_contact_name: "Admin",
  reservation_contact_email: "admin@gmail.com",
  reservation_contact_no: "09000000000",
  commission_release_days: "7,22",
};

const allowedSettingKeys = [
  "company_name",
  "company_email",
  "company_contact",
  "company_address",
  "system_status",
  "reservation_contact_name",
  "reservation_contact_email",
  "reservation_contact_no",
  "commission_release_days",
];

const withDefaultSettings = (settingsMap) => {
  return Object.entries(defaultSettingsMap).reduce(
    (result, [key, defaultValue]) => {
      const currentValue = result[key];

      if (
        currentValue === undefined ||
        currentValue === null ||
        String(currentValue).trim() === ""
      ) {
        result[key] = defaultValue;
      }

      return result;
    },
    { ...settingsMap },
  );
};

const hasOwn = (object, key) => {
  return Object.prototype.hasOwnProperty.call(object, key);
};

const isPlainObject = (value) => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const normalizeSettingValue = (value) => {
  if (value === null) return null;
  return String(value);
};

const normalizeRole = (role) => {
  return String(role || "").trim().toLowerCase();
};

const validateSettingKey = (key) => {
  if (!allowedSettingKeys.includes(key)) {
    return {
      isValid: false,
      message: `Unknown setting key: ${key}`,
    };
  }

  return {
    isValid: true,
  };
};

const parseCommissionReleaseDays = (value) => {
  const days = String(value || "")
    .split(",")
    .map((day) => Number(String(day).trim()))
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 31);

  return Array.from(new Set(days)).sort((a, b) => a - b);
};

const validateSettingValue = (key, value) => {
  if (key !== "commission_release_days") {
    return {
      isValid: true,
    };
  }

  const releaseDays = parseCommissionReleaseDays(value);

  if (!releaseDays.length) {
    return {
      isValid: false,
      message:
        "Commission release days must contain at least one valid day from 1 to 31.",
    };
  }

  if (releaseDays.length > 10) {
    return {
      isValid: false,
      message: "Commission release days can contain up to 10 days only.",
    };
  }

  return {
    isValid: true,
    normalizedValue: releaseDays.join(","),
  };
};

const canEditProtectedSetting = (userRole, key) => {
  if (key !== "commission_release_days") return true;
  return normalizeRole(userRole) === "super_admin";
};

const ensureFormulaSettingsTable = async (connectionOrDb = db) => {
  await connectionOrDb.query(`
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
    )
  `);
};

const seedFormulaSettings = async (connectionOrDb = db) => {
  await ensureFormulaSettingsTable(connectionOrDb);

  const placeholders = formulaSettingsSeed
    .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .join(", ");

  const params = formulaSettingsSeed.flatMap((setting) => [
    setting.setting_key,
    setting.category,
    setting.label,
    setting.formula_text,
    setting.description,
    setting.value_type,
    setting.setting_value,
    setting.default_value,
    setting.is_editable ? 1 : 0,
    setting.sort_order,
  ]);

  await connectionOrDb.query(
    `
    INSERT INTO system_formula_settings (
      setting_key,
      category,
      label,
      formula_text,
      description,
      value_type,
      setting_value,
      default_value,
      is_editable,
      sort_order
    ) VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE
      category = VALUES(category),
      label = VALUES(label),
      formula_text = VALUES(formula_text),
      description = VALUES(description),
      value_type = VALUES(value_type),
      setting_value = COALESCE(system_formula_settings.setting_value, VALUES(setting_value)),
      default_value = VALUES(default_value),
      is_editable = VALUES(is_editable),
      sort_order = VALUES(sort_order)
    `,
    params,
  );
};

export const settingsRowsToObject = (rows) => {
  return rows.reduce((settingsMap, row) => {
    settingsMap[row.setting_key] = row.setting_value;
    return settingsMap;
  }, {});
};

const upsertSettings = async (settingsEntries) => {
  if (!settingsEntries.length) return;

  const placeholders = settingsEntries.map(() => "(?, ?)").join(", ");
  const params = settingsEntries.flatMap(([key, value]) => [
    key,
    normalizeSettingValue(value),
  ]);

  await db.query(
    `
    INSERT INTO settings (
      setting_key,
      setting_value
    ) VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE
      setting_value = VALUES(setting_value)
    `,
    params,
  );
};

export const getSettings = async (req, res) => {
  const [settings] = await db.query(
    `
    SELECT
      id,
      setting_key,
      setting_value,
      created_at,
      updated_at
    FROM settings
    ORDER BY id ASC
    `,
  );

  res.status(200).json({
    settings,
    settingsMap: withDefaultSettings(settingsRowsToObject(settings)),
  });
};

export const getSetting = async (req, res) => {
  const { key } = req.params;

  const keyValidation = validateSettingKey(key);

  if (!keyValidation.isValid) {
    return res.status(400).json({
      message: keyValidation.message,
    });
  }

  const [rows] = await db.query(
    `
    SELECT
      id,
      setting_key,
      setting_value,
      created_at,
      updated_at
    FROM settings
    WHERE setting_key = ?
    LIMIT 1
    `,
    [key],
  );

  const setting = rows[0];

  if (!setting) {
    const defaultValue = defaultSettingsMap[key];

    if (defaultValue !== undefined) {
      return res.status(200).json({
        setting: {
          id: null,
          setting_key: key,
          setting_value: defaultValue,
          created_at: null,
          updated_at: null,
        },
      });
    }

    return res.status(404).json({
      message: "Setting not found",
    });
  }

  res.status(200).json({
    setting,
  });
};

export const updateSettings = async (req, res) => {
  if (!isPlainObject(req.body) || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      message: "Settings body is required",
    });
  }

  const settingsEntries = Object.entries(req.body);
  const normalizedEntries = [];

  for (const [key, value] of settingsEntries) {
    const keyValidation = validateSettingKey(key);

    if (!keyValidation.isValid) {
      return res.status(400).json({
        message: keyValidation.message,
      });
    }

    if (!canEditProtectedSetting(req.user?.role, key)) {
      return res.status(403).json({
        message:
          "Only Super Admin can update commission release days. Admin accounts can view this setting only.",
        currentRole: req.user?.role || null,
      });
    }

    const valueValidation = validateSettingValue(key, value);

    if (!valueValidation.isValid) {
      return res.status(400).json({
        message: valueValidation.message,
      });
    }

    normalizedEntries.push([key, valueValidation.normalizedValue ?? value]);
  }

  await upsertSettings(normalizedEntries);

  await safeCreateAuditLog({
    userId: req.user?.id,
    action: "update",
    module: "Settings",
    description: "Updated system settings",
    ipAddress: getClientIp(req),
  });

  res.status(200).json({
    message: "Settings updated successfully",
  });
};

export const updateSetting = async (req, res) => {
  const { key } = req.params;

  const keyValidation = validateSettingKey(key);

  if (!keyValidation.isValid) {
    return res.status(400).json({
      message: keyValidation.message,
    });
  }

  if (!isPlainObject(req.body) || !hasOwn(req.body, "setting_value")) {
    return res.status(400).json({
      message: "Setting value is required",
    });
  }

  if (!canEditProtectedSetting(req.user?.role, key)) {
    return res.status(403).json({
      message:
        "Only Super Admin can update commission release days. Admin accounts can view this setting only.",
      currentRole: req.user?.role || null,
    });
  }

  const valueValidation = validateSettingValue(key, req.body.setting_value);

  if (!valueValidation.isValid) {
    return res.status(400).json({
      message: valueValidation.message,
    });
  }

  await upsertSettings([
    [key, valueValidation.normalizedValue ?? req.body.setting_value],
  ]);

  await safeCreateAuditLog({
    userId: req.user?.id,
    action: "update",
    module: "Settings",
    description: `Updated setting ${key}`,
    ipAddress: getClientIp(req),
  });

  res.status(200).json({
    message: "Setting updated successfully",
  });
};

export const getFormulaSettings = async (_req, res) => {
  await seedFormulaSettings();

  const [formulas] = await db.query(
    `
    SELECT
      id,
      setting_key,
      category,
      label,
      formula_text,
      description,
      value_type,
      setting_value,
      default_value,
      is_editable,
      sort_order,
      created_at,
      updated_at
    FROM system_formula_settings
    ORDER BY sort_order ASC, id ASC
    `,
  );

  const grouped = formulas.reduce((result, formula) => {
    if (!result[formula.category]) result[formula.category] = [];
    result[formula.category].push(formula);
    return result;
  }, {});

  res.status(200).json({
    formulas,
    grouped,
  });
};

export const updateFormulaSetting = async (req, res) => {
  const { settingKey } = req.params;

  if (!isPlainObject(req.body) || !hasOwn(req.body, "setting_value")) {
    return res.status(400).json({
      message: "Formula setting value is required",
    });
  }

  await seedFormulaSettings();

  const [rows] = await db.query(
    `
    SELECT
      setting_key,
      label,
      value_type,
      is_editable
    FROM system_formula_settings
    WHERE setting_key = ?
    LIMIT 1
    `,
    [settingKey],
  );

  const formulaSetting = rows[0];

  if (!formulaSetting) {
    return res.status(404).json({
      message: "Formula setting not found",
    });
  }

  if (!formulaSetting.is_editable) {
    return res.status(403).json({
      message: "This formula value is informational and cannot be edited.",
    });
  }

  const valueValidation = validateFormulaSettingValue(
    formulaSetting.value_type,
    req.body.setting_value,
  );

  if (!valueValidation.isValid) {
    return res.status(400).json({
      message: valueValidation.message,
    });
  }

  await db.query(
    `
    UPDATE system_formula_settings
    SET setting_value = ?
    WHERE setting_key = ?
    `,
    [valueValidation.normalizedValue, settingKey],
  );

  await safeCreateAuditLog({
    userId: req.user?.id,
    action: "update",
    module: "Formula Center",
    description: `Updated formula setting ${formulaSetting.label}`,
    ipAddress: getClientIp(req),
  });

  res.status(200).json({
    message: "Formula setting updated successfully",
  });
};
