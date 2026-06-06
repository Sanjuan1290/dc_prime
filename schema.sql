-- USERS
CREATE TABLE users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(50) NOT NULL DEFAULT 'personnel',
  status         VARCHAR(50) NOT NULL DEFAULT 'active',
  last_login     DATETIME NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CLIENTS
CREATE TABLE clients (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  full_name             VARCHAR(255) NOT NULL,
  spouse_co_owner_name  VARCHAR(255) NULL,
  email                 VARCHAR(255) NULL,
  contact_no            VARCHAR(50) NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- PROJECTS
CREATE TABLE projects (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(255) NOT NULL,
  location            VARCHAR(255) NULL,
  administrator       VARCHAR(255) NULL,
  tax_declaration_no  VARCHAR(255) NULL,
  pin                 VARCHAR(255) NULL,
  status              VARCHAR(50) NOT NULL DEFAULT 'active',
  ended_at            DATE NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- LISTINGS
CREATE TABLE listings (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  project_id          INT NOT NULL,
  cadastral_lot_no    VARCHAR(255) NULL,
  unit_id             VARCHAR(255) NOT NULL,
  lot_type            VARCHAR(100) NULL,
  promo_discount      DECIMAL(15,2) NOT NULL DEFAULT 0,
  downpayment         DECIMAL(15,2) NOT NULL DEFAULT 0,
  reservation_fee     DECIMAL(15,2) NOT NULL DEFAULT 0,
  price_per_sqm       DECIMAL(15,2) NOT NULL DEFAULT 0,
  lot_area_sqm        DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_selling_price   DECIMAL(15,2) NOT NULL DEFAULT 0,
  legal_misc_fee      DECIMAL(15,2) NOT NULL DEFAULT 0,
  status              VARCHAR(50) NOT NULL DEFAULT 'available',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_listings_project
    FOREIGN KEY (project_id) REFERENCES projects(id),

  CONSTRAINT uq_listing_project_unit
    UNIQUE (project_id, unit_id)
);

-- CLIENT_UNITS
CREATE TABLE client_units (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  client_id         INT NOT NULL,
  listing_id        INT NOT NULL,
  assigned_user_id  INT NULL,
  status            VARCHAR(50) NOT NULL DEFAULT 'active',
  balance           DECIMAL(15,2) NOT NULL DEFAULT 0,
  due_day           TINYINT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_client_units_client
    FOREIGN KEY (client_id) REFERENCES clients(id),

  CONSTRAINT fk_client_units_listing
    FOREIGN KEY (listing_id) REFERENCES listings(id),

  CONSTRAINT fk_client_units_assigned_user
    FOREIGN KEY (assigned_user_id) REFERENCES users(id),

  CONSTRAINT chk_due_day
    CHECK (due_day BETWEEN 1 AND 31)
);

-- PAYMENTS
CREATE TABLE payments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  client_unit_id  INT NOT NULL,
  amount          DECIMAL(15,2) NOT NULL,
  payment_type    VARCHAR(100) NULL,
  payment_method  VARCHAR(100) NULL,
  payment_date    DATE NOT NULL DEFAULT (CURRENT_DATE),
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_payments_client_unit
    FOREIGN KEY (client_unit_id) REFERENCES client_units(id)
);

-- DOCUMENTS
CREATE TABLE documents (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  description  VARCHAR(255) NULL,
  is_required  BOOLEAN NOT NULL DEFAULT FALSE,
  status       VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CLIENT_DOCUMENT_LIST
CREATE TABLE client_document_list (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  client_unit_id  INT NOT NULL,
  document_id     INT NOT NULL,
  file_url        VARCHAR(500) NULL,
  status          VARCHAR(50) NOT NULL DEFAULT 'not_submitted',
  reviewed_by     INT NULL,
  reviewed_at     DATETIME NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_client_documents_client_unit
    FOREIGN KEY (client_unit_id) REFERENCES client_units(id),

  CONSTRAINT fk_client_documents_document
    FOREIGN KEY (document_id) REFERENCES documents(id),

  CONSTRAINT fk_client_documents_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users(id),

  CONSTRAINT uq_client_document
    UNIQUE (client_unit_id, document_id)
);

-- ACCREDITED_SELLERS
CREATE TABLE accredited_sellers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NULL,
  manager     VARCHAR(255) NULL,
  contact_no  VARCHAR(50) NULL,
  status      VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- COMMISSIONS
CREATE TABLE commissions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  client_unit_id  INT NOT NULL,
  seller_id       INT NULL,
  amount          DECIMAL(15,2) NOT NULL DEFAULT 0,
  status          VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_commissions_client_unit
    FOREIGN KEY (client_unit_id) REFERENCES client_units(id),

  CONSTRAINT fk_commissions_seller
    FOREIGN KEY (seller_id) REFERENCES accredited_sellers(id)
);

-- EMPLOYEES
CREATE TABLE employees (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(255) NOT NULL,
  position        VARCHAR(255) NULL,
  monthly_salary  DECIMAL(15,2) NOT NULL DEFAULT 0,
  status          VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- REST_DAYS
CREATE TABLE rest_days (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  employee_id  INT NOT NULL,
  day_name     VARCHAR(20) NOT NULL,
  is_rest_day  BOOLEAN NOT NULL DEFAULT TRUE,

  CONSTRAINT fk_rest_days_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id),

  CONSTRAINT uq_employee_rest_day
    UNIQUE (employee_id, day_name)
);

-- ATTENDANCE
CREATE TABLE attendance (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  employee_id        INT NOT NULL,
  attendance_date    DATE NOT NULL,
  time_in            TIME NULL,
  time_out           TIME NULL,
  schedule_time_in   TIME NULL,
  schedule_time_out  TIME NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_attendance_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id),

  CONSTRAINT uq_employee_attendance_date
    UNIQUE (employee_id, attendance_date)
);