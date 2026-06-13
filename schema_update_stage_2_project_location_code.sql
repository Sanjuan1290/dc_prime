-- Stage 2: Project location codes for listing unit ID prefixes.
-- Safe to run more than once. No tables or data are dropped/truncated.

SET @project_location_code_column_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'projects'
    AND COLUMN_NAME = 'location_code'
);

SET @project_location_code_column_sql := IF(
  @project_location_code_column_exists = 0,
  'ALTER TABLE projects ADD COLUMN location_code VARCHAR(10) NOT NULL DEFAULT '''' AFTER location',
  'SELECT ''projects.location_code already exists'' AS message'
);

PREPARE project_location_code_column_stmt FROM @project_location_code_column_sql;
EXECUTE project_location_code_column_stmt;
DEALLOCATE PREPARE project_location_code_column_stmt;

UPDATE projects
SET location_code = CASE
  WHEN id = 1 THEN 'LA'
  WHEN id = 2 THEN 'PE'
  ELSE location_code
END
WHERE id IN (1, 2)
  AND COALESCE(location_code, '') = '';

SET @project_location_code_index_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'projects'
    AND INDEX_NAME = 'idx_projects_location_code'
);

SET @project_location_code_index_sql := IF(
  @project_location_code_index_exists = 0,
  'CREATE INDEX idx_projects_location_code ON projects (location_code)',
  'SELECT ''idx_projects_location_code already exists'' AS message'
);

PREPARE project_location_code_index_stmt FROM @project_location_code_index_sql;
EXECUTE project_location_code_index_stmt;
DEALLOCATE PREPARE project_location_code_index_stmt;
