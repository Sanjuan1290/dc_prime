ALTER TABLE projects
  ADD COLUMN project_type ENUM('lot_only','house_and_lot','mixed') NOT NULL DEFAULT 'lot_only' AFTER location_code;

ALTER TABLE listings
  ADD COLUMN property_type ENUM('lot','house_and_lot','house_only') NOT NULL DEFAULT 'lot' AFTER lot_type,
  ADD COLUMN pricing_method ENUM('area_based','package_price','manual') NOT NULL DEFAULT 'area_based' AFTER property_type,
  ADD COLUMN house_model VARCHAR(150) NULL AFTER pricing_method,
  ADD COLUMN floor_area_sqm DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER house_model,
  ADD COLUMN bedrooms INT NOT NULL DEFAULT 0 AFTER floor_area_sqm,
  ADD COLUMN bathrooms INT NOT NULL DEFAULT 0 AFTER bedrooms,
  ADD COLUMN parking_slots INT NOT NULL DEFAULT 0 AFTER bathrooms,
  ADD COLUMN lot_price DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER parking_slots,
  ADD COLUMN house_price DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER lot_price,
  ADD COLUMN package_price DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER house_price,
  ADD COLUMN manual_net_selling_price DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER package_price;

-- MySQL versions before 8.0.29 may not support ADD COLUMN IF NOT EXISTS.
-- If a column already exists, skip that specific ADD COLUMN statement.
-- Runtime schema guards in the projects/listings controllers also add these
-- columns safely before queries use them.
