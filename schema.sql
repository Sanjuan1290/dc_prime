-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: dc_prime_db
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accredited_sellers`
--

DROP TABLE IF EXISTS `accredited_sellers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accredited_sellers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `contact_no` varchar(50) DEFAULT NULL,
  `seller_role` enum('broker_network_manager','broker','manager','agent') NOT NULL DEFAULT 'agent',
  `parent_seller_id` int DEFAULT NULL,
  `seller_group_id` int DEFAULT NULL,
  `custom_reports_under` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `accreditation_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `commission_rate` decimal(5,2) DEFAULT NULL,
  `commission_pool_rate` decimal(5,2) DEFAULT NULL,
  `personal_commission_rate` decimal(5,2) DEFAULT NULL,
  `override_commission_rate` decimal(5,2) DEFAULT NULL,
  `direct_to_developer_rate` decimal(5,2) DEFAULT NULL,
  `residual_commission_rate` decimal(5,2) DEFAULT NULL,
  `max_downline_rate` decimal(5,2) DEFAULT NULL,
  `rate_set_by` int DEFAULT NULL,
  `rate_updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_accredited_sellers_role_parent` (`seller_role`,`parent_seller_id`),
  KEY `idx_accredited_sellers_rate_set_by` (`rate_set_by`),
  KEY `idx_accredited_sellers_user_id` (`user_id`),
  KEY `idx_accredited_sellers_parent_status` (`parent_seller_id`,`status`),
  KEY `idx_accredited_sellers_group` (`seller_group_id`),
  CONSTRAINT `fk_accredited_sellers_group` FOREIGN KEY (`seller_group_id`) REFERENCES `seller_groups` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_accredited_sellers_parent` FOREIGN KEY (`parent_seller_id`) REFERENCES `accredited_sellers` (`id`),
  CONSTRAINT `fk_accredited_sellers_rate_set_by` FOREIGN KEY (`rate_set_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_accredited_sellers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accredited_sellers`
--

LOCK TABLES `accredited_sellers` WRITE;
/*!40000 ALTER TABLE `accredited_sellers` DISABLE KEYS */;
INSERT INTO `accredited_sellers` VALUES (1,13,'Prime External BNM','external.bnm@test.com',NULL,'broker_network_manager',NULL,1,NULL,'active','2026-06-04','2026-06-26 05:42:41','2026-06-26 05:43:53',8.00,8.00,8.00,NULL,NULL,NULL,NULL,1,'2026-06-26 13:43:53'),(2,15,'Prime External Broker Two','external.broker2@test.com',NULL,'broker',1,1,NULL,'active',NULL,'2026-06-26 05:42:57','2026-06-26 05:43:53',7.00,7.00,7.00,NULL,NULL,NULL,NULL,1,'2026-06-26 13:43:53'),(3,14,'Josep','external.broker1@test.com',NULL,'manager',NULL,3,NULL,'active','2026-06-25','2026-06-26 05:43:23','2026-06-26 06:31:14',6.00,8.00,6.00,1.00,NULL,NULL,NULL,1,'2026-06-26 14:31:14'),(4,10,'Cavite Realty Broker Two','cavite.realty.broker2@test.com',NULL,'broker',1,1,NULL,'active','2026-06-19','2026-06-26 05:44:19','2026-06-26 05:44:19',7.00,7.00,7.00,NULL,NULL,NULL,NULL,1,'2026-06-26 13:44:19'),(5,9,'Cavite Realty Broker One','cavite.realty.broker1@test.com',NULL,'broker',NULL,3,NULL,'active','2026-06-01','2026-06-26 05:44:53','2026-06-26 06:31:14',7.00,8.00,7.00,1.00,NULL,NULL,NULL,1,'2026-06-26 14:31:14'),(6,8,'Cavite Realty BNM','cavite.realty.bnm@test.com',NULL,'broker_network_manager',NULL,3,NULL,'active','2026-06-07','2026-06-26 05:45:04','2026-06-26 06:31:14',8.00,8.00,8.00,1.00,NULL,NULL,NULL,1,'2026-06-26 14:31:14'),(7,11,'Cavite Realty Manager One','cavite.realty.manager1@test.com','098765454','manager',5,3,NULL,'active','2026-06-18','2026-06-26 05:58:03','2026-06-26 06:31:14',6.00,8.00,6.00,1.00,NULL,NULL,NULL,1,'2026-06-26 14:31:14'),(8,16,'Prime External Manager One','external.manager1@test.com',NULL,'manager',2,1,NULL,'active','2026-06-08','2026-06-26 06:02:26','2026-06-26 06:02:26',6.00,NULL,6.00,NULL,NULL,NULL,NULL,1,'2026-06-26 14:02:26'),(9,17,'Prime External Agent One','external.agent1@test.com',NULL,'agent',8,1,NULL,'active','2026-06-02','2026-06-26 06:02:34','2026-06-26 06:02:34',5.00,NULL,5.00,NULL,5.00,NULL,NULL,1,'2026-06-26 14:02:34'),(10,12,'Cavite Realty Agent One','cavite.realty.agent1@test.com',NULL,'agent',7,3,NULL,'active','2026-06-16','2026-06-26 06:03:02','2026-06-26 06:31:14',5.00,8.00,5.00,0.00,5.00,NULL,NULL,1,'2026-06-26 14:31:14');
/*!40000 ALTER TABLE `accredited_sellers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `attendance_date` date NOT NULL,
  `day_status` varchar(50) NOT NULL DEFAULT 'present',
  `time_in` time DEFAULT NULL,
  `time_out` time DEFAULT NULL,
  `schedule_time_in` time DEFAULT NULL,
  `schedule_time_out` time DEFAULT NULL,
  `break_minutes` int NOT NULL DEFAULT '60',
  `is_double_pay` tinyint(1) NOT NULL DEFAULT '0',
  `double_pay_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_attendance_date` (`employee_id`,`attendance_date`),
  KEY `idx_attendance_is_double_pay` (`is_double_pay`),
  CONSTRAINT `fk_attendance_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `module` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_audit_logs_user` (`user_id`),
  CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'create','Projects','Created project Bailen Project','127.0.0.1','2026-06-26 05:13:21'),(2,1,'create','Documents','Created document CLIENT REGISTRATION FORM (Seller\'s Copy)','127.0.0.1','2026-06-26 05:14:02'),(3,1,'create','Documents','Created document CLIENT REGISTRATION FORM (Administrator Copy)','127.0.0.1','2026-06-26 05:14:14'),(4,1,'create','Documents','Created document BUYER\'S INFORMATION FORM','127.0.0.1','2026-06-26 05:14:23'),(5,1,'create','Documents','Created document INTENT TO BUY','127.0.0.1','2026-06-26 05:14:30'),(6,1,'create','Documents','Created document OFFER TO BUT & BUYER\'S PROFILE','127.0.0.1','2026-06-26 05:14:42'),(7,1,'create','Documents','Created document RESERVATION AGREEMENT','127.0.0.1','2026-06-26 05:14:48'),(8,1,'create','Documents','Created document DEED OF SALE','127.0.0.1','2026-06-26 05:14:53'),(9,1,'create','Documents','Created document CONTRACT TO SELL','127.0.0.1','2026-06-26 05:15:00'),(10,1,'create','Documents','Created document BUYER COUNSELLING AND ACKNOWLEDGEMENT FORM','127.0.0.1','2026-06-26 05:15:13'),(11,1,'create','Documents','Created document VOLUNTARY CANCELLATION AND WAIVER OF RIGHTS','127.0.0.1','2026-06-26 05:15:23'),(12,1,'create','Documents','Created document BUYER ACKNOWLEDGEMENT FORM','127.0.0.1','2026-06-26 05:15:33'),(13,1,'create','Documents','Created document SPA to Process Title (for Company)','127.0.0.1','2026-06-26 05:15:48'),(14,1,'create','Documents','Created document SPA Authorization to Sign (for Representative)','127.0.0.1','2026-06-26 05:16:05'),(15,1,'create','Documents','Created document Two valid Government-issued ID\'s (w/ 3 specimen signatures)','127.0.0.1','2026-06-26 05:16:29'),(16,1,'create','Documents','Created document TIN No. / TIN ID','127.0.0.1','2026-06-26 05:16:37'),(17,1,'create','Documents','Created document PSA (Single)','127.0.0.1','2026-06-26 05:16:44'),(18,1,'create','Documents','Created document Marriage Certificate','127.0.0.1','2026-06-26 05:16:59'),(19,1,'create','Documents','Created document Valid ID of Spouse (w/ 3 specimen signatures)','127.0.0.1','2026-06-26 05:17:23'),(20,1,'create','Documents','Created document Spouse\'s Signature (when required)','127.0.0.1','2026-06-26 05:17:34'),(21,1,'create','Documents','Created document CENOMAR (if the buyer has kids but not married)','127.0.0.1','2026-06-26 05:17:47'),(22,1,'create','Documents','Created document Passport ID','127.0.0.1','2026-06-26 05:17:53'),(23,1,'create','Documents','Created document Valid ID\'s of both Principal and Representative','127.0.0.1','2026-06-26 05:18:06'),(24,1,'create','Document Templates','Created document template LIST OF DOCUMENTS','127.0.0.1','2026-06-26 05:21:21'),(25,1,'create','Document Templates','Created document template FOR OFW\'s','127.0.0.1','2026-06-26 05:21:38'),(26,1,'create','Document Templates','Created document template Required for Submission','127.0.0.1','2026-06-26 05:22:18'),(27,1,'create','Document Templates','Created document template Required for Submission(For Married Client\'s)','127.0.0.1','2026-06-26 05:23:06'),(28,1,'create','Document Templates','Created document template Required for Submission(For OFW\'s or Representative)','127.0.0.1','2026-06-26 05:23:30'),(29,1,'create','Projects','Created project Maragondon Project','127.0.0.1','2026-06-26 05:25:36'),(30,1,'update','Projects','Updated project Bailen Project','127.0.0.1','2026-06-26 05:25:52'),(31,1,'create','Listings','Created listing LA-0818','127.0.0.1','2026-06-26 05:29:50'),(32,1,'create','Listings','Created listing LA-0104','127.0.0.1','2026-06-26 05:31:02'),(33,1,'create','Seller Groups','Created seller group R.Cortez Realty','127.0.0.1','2026-06-26 05:40:54'),(34,1,'create','Seller Groups','Created seller group Josep Team','127.0.0.1','2026-06-26 05:42:17'),(35,1,'update','Users','Updated user 13, seller 1, and group inheritance','127.0.0.1','2026-06-26 05:42:41'),(36,1,'update','Users','Updated user 15, seller 2, and group inheritance','127.0.0.1','2026-06-26 05:42:57'),(37,1,'update','Users','Updated user 14, seller 3, and group inheritance','127.0.0.1','2026-06-26 05:43:23'),(38,1,'update','Users','Updated user 15, seller 2, and group inheritance','127.0.0.1','2026-06-26 05:43:48'),(39,1,'update','Users','Updated user 13, seller 1, and group inheritance','127.0.0.1','2026-06-26 05:43:53'),(40,1,'update','Users','Updated user 10, seller 4, and group inheritance','127.0.0.1','2026-06-26 05:44:19'),(41,1,'create','Seller Groups','Created seller group Cavite Group','127.0.0.1','2026-06-26 05:44:42'),(42,1,'update','Users','Updated user 9, seller 5, and group inheritance','127.0.0.1','2026-06-26 05:44:53'),(43,1,'update','Users','Updated user 8, seller 6, and group inheritance','127.0.0.1','2026-06-26 05:45:04'),(44,1,'update','Seller Groups','Updated seller group Josep Team','127.0.0.1','2026-06-26 05:47:23'),(45,1,'update','Users','Updated user 11, seller 7, and group inheritance','127.0.0.1','2026-06-26 05:58:03'),(46,1,'update','Users','Updated user 14, seller 3, and group inheritance','127.0.0.1','2026-06-26 05:58:49'),(47,1,'update','Users','Updated user 16, seller 8, and group inheritance','127.0.0.1','2026-06-26 06:02:26'),(48,1,'update','Users','Updated user 17, seller 9, and group inheritance','127.0.0.1','2026-06-26 06:02:34'),(49,1,'update','Users','Updated user 12, seller 10, and group inheritance','127.0.0.1','2026-06-26 06:03:02'),(50,1,'update','Seller Groups','Updated seller group Cavite Group','127.0.0.1','2026-06-26 06:17:13'),(51,1,'update','Seller Groups','Updated seller group Josep Team','127.0.0.1','2026-06-26 06:17:31'),(52,1,'delete','Seller Groups','Removed seller group Josep Team','127.0.0.1','2026-06-26 06:17:47'),(53,1,'update','Users','Updated user 8, seller 6, and group inheritance','127.0.0.1','2026-06-26 06:18:35'),(54,1,'create','Clients','Created client Robert ','127.0.0.1','2026-06-26 06:19:34'),(55,1,'update','Buyer Profile','Updated buyer profile for Robert Renby C. San Juan','127.0.0.1','2026-06-26 06:22:45'),(56,1,'update','Buyer Profile','Updated co-buyers for Robert Renby C. San Juan','127.0.0.1','2026-06-26 06:22:45'),(57,1,'update','Buyer Profile','Updated employment details for Robert Renby C. San Juan','127.0.0.1','2026-06-26 06:22:45'),(58,1,'update','Buyer Profile','Updated buyer profile for Robert Renby C. San Juan','127.0.0.1','2026-06-26 06:22:45'),(59,1,'update','Seller Groups','Updated seller group Cavite Group','127.0.0.1','2026-06-26 06:31:14');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_advance_deductions`
--

DROP TABLE IF EXISTS `cash_advance_deductions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_advance_deductions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cash_advance_id` int NOT NULL,
  `commission_release_id` int NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `created_by` int DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cash_advance_deductions_advance_id` (`cash_advance_id`),
  KEY `idx_cash_advance_deductions_release_id` (`commission_release_id`),
  KEY `fk_cash_advance_deductions_created_by` (`created_by`),
  CONSTRAINT `fk_cash_advance_deductions_advance` FOREIGN KEY (`cash_advance_id`) REFERENCES `cash_advances` (`id`),
  CONSTRAINT `fk_cash_advance_deductions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_cash_advance_deductions_release` FOREIGN KEY (`commission_release_id`) REFERENCES `commission_releases` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_advance_deductions`
--

LOCK TABLES `cash_advance_deductions` WRITE;
/*!40000 ALTER TABLE `cash_advance_deductions` DISABLE KEYS */;
/*!40000 ALTER TABLE `cash_advance_deductions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_advances`
--

DROP TABLE IF EXISTS `cash_advances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_advances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seller_id` int NOT NULL,
  `client_unit_id` int DEFAULT NULL,
  `commission_id` int DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `remaining_balance` decimal(15,2) NOT NULL,
  `status` enum('pending','approved','partially_deducted','deducted','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `requested_at` datetime DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `deducted_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cash_advances_seller_id` (`seller_id`),
  KEY `idx_cash_advances_client_unit_id` (`client_unit_id`),
  KEY `idx_cash_advances_commission_id` (`commission_id`),
  KEY `idx_cash_advances_status` (`status`),
  KEY `fk_cash_advances_approved_by` (`approved_by`),
  KEY `idx_cash_advances_deducted_at` (`deducted_at`),
  KEY `idx_cash_advances_rejected_at` (`rejected_at`),
  KEY `idx_cash_advances_cancelled_at` (`cancelled_at`),
  CONSTRAINT `fk_cash_advances_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_cash_advances_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`),
  CONSTRAINT `fk_cash_advances_commission` FOREIGN KEY (`commission_id`) REFERENCES `commissions` (`id`),
  CONSTRAINT `fk_cash_advances_seller` FOREIGN KEY (`seller_id`) REFERENCES `accredited_sellers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_advances`
--

LOCK TABLES `cash_advances` WRITE;
/*!40000 ALTER TABLE `cash_advances` DISABLE KEYS */;
/*!40000 ALTER TABLE `cash_advances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_buyers`
--

DROP TABLE IF EXISTS `client_buyers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_buyers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `client_unit_id` int DEFAULT NULL,
  `buyer_role` enum('spouse','second_buyer') NOT NULL DEFAULT 'spouse',
  `full_name` varchar(255) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `place_of_birth` varchar(255) DEFAULT NULL,
  `citizenship` varchar(100) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `civil_status` enum('single','married','separated','annulled_divorced','widower') DEFAULT NULL,
  `present_address` varchar(500) DEFAULT NULL,
  `present_zip_code` varchar(20) DEFAULT NULL,
  `permanent_address` varchar(500) DEFAULT NULL,
  `permanent_zip_code` varchar(20) DEFAULT NULL,
  `mobile_no` varchar(50) DEFAULT NULL,
  `residence_phone_no` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `tin` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_client_buyers_client_id` (`client_id`),
  KEY `idx_client_buyers_client_unit_id` (`client_unit_id`),
  CONSTRAINT `fk_client_buyers_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_client_buyers_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_buyers`
--

LOCK TABLES `client_buyers` WRITE;
/*!40000 ALTER TABLE `client_buyers` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_buyers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_document_list`
--

DROP TABLE IF EXISTS `client_document_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_document_list` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_unit_id` int NOT NULL,
  `document_id` int NOT NULL,
  `is_required` tinyint(1) DEFAULT NULL,
  `requirement_source` varchar(50) DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `storage_provider` enum('cloudinary','google_drive','local') DEFAULT 'cloudinary',
  `cloudinary_asset_id` varchar(255) DEFAULT NULL,
  `cloudinary_public_id` varchar(500) DEFAULT NULL,
  `cloudinary_folder` varchar(500) DEFAULT NULL,
  `cloudinary_resource_type` varchar(50) DEFAULT NULL,
  `cloudinary_secure_url` text,
  `drive_file_id` varchar(255) DEFAULT NULL,
  `drive_folder_id` varchar(255) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `original_file_name` varchar(255) DEFAULT NULL,
  `mime_type` varchar(150) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `web_view_link` text,
  `uploaded_at` datetime DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'not_submitted',
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_client_document` (`client_unit_id`,`document_id`),
  KEY `fk_client_documents_document` (`document_id`),
  KEY `fk_client_documents_reviewer` (`reviewed_by`),
  KEY `idx_client_document_list_drive_file_id` (`drive_file_id`),
  KEY `idx_client_document_list_uploaded_by` (`uploaded_by`),
  KEY `idx_client_document_list_is_required` (`is_required`),
  CONSTRAINT `fk_client_document_list_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_client_documents_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`),
  CONSTRAINT `fk_client_documents_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`),
  CONSTRAINT `fk_client_documents_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_document_list`
--

LOCK TABLES `client_document_list` WRITE;
/*!40000 ALTER TABLE `client_document_list` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_document_list` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_employment_details`
--

DROP TABLE IF EXISTS `client_employment_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_employment_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `client_buyer_id` int DEFAULT NULL,
  `person_type` enum('principal','co_buyer') NOT NULL DEFAULT 'principal',
  `employment_status` enum('employed_private','employed_government','employed_ngo','self_employed_business','self_employed_professional','ofw_immigrant','other') DEFAULT NULL,
  `employment_status_other` varchar(255) DEFAULT NULL,
  `employer_business_name` varchar(255) DEFAULT NULL,
  `employer_business_address` varchar(500) DEFAULT NULL,
  `employer_zip_code` varchar(20) DEFAULT NULL,
  `nature_of_work_business` varchar(255) DEFAULT NULL,
  `occupation_position_title` varchar(255) DEFAULT NULL,
  `monthly_income` decimal(15,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_client_employment_details_client_id` (`client_id`),
  KEY `idx_client_employment_details_client_buyer_id` (`client_buyer_id`),
  CONSTRAINT `fk_client_employment_details_buyer` FOREIGN KEY (`client_buyer_id`) REFERENCES `client_buyers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_client_employment_details_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_employment_details`
--

LOCK TABLES `client_employment_details` WRITE;
/*!40000 ALTER TABLE `client_employment_details` DISABLE KEYS */;
INSERT INTO `client_employment_details` VALUES (1,1,NULL,'principal','employed_private',NULL,'D&C Prime Realty','Unit D, Mia\'s Commercial Building, Indang, 4122 Cavite','4102','Real Estate ','IT',50000.00,'2026-06-26 06:22:45','2026-06-26 06:22:45');
/*!40000 ALTER TABLE `client_employment_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_unit_cancellation_settlements`
--

DROP TABLE IF EXISTS `client_unit_cancellation_settlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_unit_cancellation_settlements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_unit_id` int NOT NULL,
  `client_id` int NOT NULL,
  `listing_id` int NOT NULL,
  `total_paid_snapshot` decimal(15,2) NOT NULL DEFAULT '0.00',
  `refund_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discontinued_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `settlement_result` enum('pending_settlement','full_refund','partial_refund','discontinued') NOT NULL DEFAULT 'pending_settlement',
  `settlement_status` enum('draft','pending_review','approved_for_refund','refund_released','approved_as_discontinued','settled','voided') NOT NULL DEFAULT 'draft',
  `reason` text,
  `remarks` text,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `refund_released_by` int DEFAULT NULL,
  `refund_released_at` datetime DEFAULT NULL,
  `cleared_for_resale_by` int DEFAULT NULL,
  `cleared_for_resale_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cancellation_settlement_client_unit_status` (`client_unit_id`,`settlement_status`),
  KEY `idx_cancellation_settlements_client_unit` (`client_unit_id`),
  KEY `idx_cancellation_settlements_listing` (`listing_id`),
  KEY `idx_cancellation_settlements_result` (`settlement_result`),
  KEY `idx_cancellation_settlements_status` (`settlement_status`),
  KEY `idx_cancellation_settlements_approved_at` (`approved_at`),
  KEY `fk_cancellation_settlements_client` (`client_id`),
  KEY `fk_cancellation_settlements_approved_by` (`approved_by`),
  KEY `fk_cancellation_settlements_refund_released_by` (`refund_released_by`),
  KEY `fk_cancellation_settlements_cleared_for_resale_by` (`cleared_for_resale_by`),
  CONSTRAINT `fk_cancellation_settlements_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cancellation_settlements_cleared_for_resale_by` FOREIGN KEY (`cleared_for_resale_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cancellation_settlements_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cancellation_settlements_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cancellation_settlements_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cancellation_settlements_refund_released_by` FOREIGN KEY (`refund_released_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_unit_cancellation_settlements`
--

LOCK TABLES `client_unit_cancellation_settlements` WRITE;
/*!40000 ALTER TABLE `client_unit_cancellation_settlements` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_unit_cancellation_settlements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_unit_form_prints`
--

DROP TABLE IF EXISTS `client_unit_form_prints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_unit_form_prints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_unit_id` int NOT NULL,
  `form_type` enum('offer_to_buy_buyers_profile','statement_of_account') NOT NULL DEFAULT 'offer_to_buy_buyers_profile',
  `printed_by` int DEFAULT NULL,
  `printed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_client_unit_form_prints_client_unit_id` (`client_unit_id`),
  KEY `idx_client_unit_form_prints_printed_by` (`printed_by`),
  CONSTRAINT `fk_client_unit_form_prints_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_client_unit_form_prints_printed_by` FOREIGN KEY (`printed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_unit_form_prints`
--

LOCK TABLES `client_unit_form_prints` WRITE;
/*!40000 ALTER TABLE `client_unit_form_prints` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_unit_form_prints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_units`
--

DROP TABLE IF EXISTS `client_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `listing_id` int NOT NULL,
  `assigned_user_id` int DEFAULT NULL,
  `seller_id` int DEFAULT NULL,
  `status` enum('reserved','active','past_due','pending_cancellation','cancelled','fully_paid','closed') NOT NULL DEFAULT 'reserved',
  `mode_of_payment` enum('cash','installment') NOT NULL DEFAULT 'installment',
  `buyer_type` enum('single','spouses','and_account') NOT NULL DEFAULT 'single',
  `balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `due_day` tinyint DEFAULT NULL,
  `starting_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `offer_purchase_price` decimal(15,2) DEFAULT NULL,
  `reservation_fee_amount` decimal(15,2) DEFAULT NULL,
  `downpayment_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `downpayment_percent` decimal(5,2) NOT NULL DEFAULT '30.00',
  `downpayment_gives` int NOT NULL DEFAULT '3',
  `downpayment_discount_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `downpayment_discount_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `downpayment_net_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `deferred_cash_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `offer_balance_amount` decimal(15,2) DEFAULT NULL,
  `payment_terms_months` int DEFAULT NULL,
  `interest_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `monthly_amortization` decimal(15,2) DEFAULT NULL,
  `contract_processing_status` enum('pending_profile','profile_complete','docs_complete','ready_for_contract','contract_signed') NOT NULL DEFAULT 'pending_profile',
  `last_doc_reminder_at` datetime DEFAULT NULL,
  `last_payment_reminder_at` datetime DEFAULT NULL,
  `soa_drive_file_id` varchar(255) DEFAULT NULL,
  `soa_cloudinary_public_id` varchar(500) DEFAULT NULL,
  `soa_cloudinary_secure_url` text,
  `soa_file_name` varchar(255) DEFAULT NULL,
  `soa_generated_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sale_type` varchar(50) NOT NULL DEFAULT 'distributed',
  `balloon_payment_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `balloon_due_date` date DEFAULT NULL,
  `offset_policy` enum('apply_to_next_due','apply_to_principal','hold_as_credit') NOT NULL DEFAULT 'apply_to_next_due',
  `cancellation_status` enum('none','pending_settlement','approved_for_refund','refund_released','approved_as_discontinued','settled','voided') NOT NULL DEFAULT 'none',
  `cancellation_date` date DEFAULT NULL,
  `cancellation_result` enum('pending_settlement','full_refund','partial_refund','discontinued') DEFAULT NULL,
  `total_paid_by_client` decimal(15,2) NOT NULL DEFAULT '0.00',
  `refund_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discontinued_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `cancellation_reason` text,
  `cancellation_approved_by` int DEFAULT NULL,
  `settlement_date` date DEFAULT NULL,
  `cancellation_remarks` text,
  `cleared_for_resale_at` datetime DEFAULT NULL,
  `cleared_for_resale_by` int DEFAULT NULL,
  `seller_group_id` int DEFAULT NULL,
  `seller_group_name_snapshot` varchar(255) DEFAULT NULL,
  `seller_group_pool_rate_snapshot` decimal(5,2) DEFAULT NULL,
  `seller_group_closing_rate_snapshot` decimal(5,2) DEFAULT NULL,
  `seller_group_bnm_override_snapshot` decimal(5,2) DEFAULT NULL,
  `seller_group_broker_override_snapshot` decimal(5,2) DEFAULT NULL,
  `seller_group_manager_override_snapshot` decimal(5,2) DEFAULT NULL,
  `seller_group_rate_snapshot_json` text,
  `refund_released_by` int DEFAULT NULL,
  `refund_released_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_client_units_client` (`client_id`),
  KEY `fk_client_units_listing` (`listing_id`),
  KEY `fk_client_units_assigned_user` (`assigned_user_id`),
  KEY `idx_client_units_due_date` (`due_date`),
  KEY `idx_client_units_starting_date` (`starting_date`),
  KEY `idx_client_units_payment_terms` (`mode_of_payment`,`payment_terms_months`),
  KEY `idx_client_units_contract_processing_status` (`contract_processing_status`),
  KEY `idx_client_units_seller_id` (`seller_id`),
  KEY `idx_client_units_sale_type` (`sale_type`),
  KEY `idx_client_units_balloon_due_date` (`balloon_due_date`),
  KEY `idx_client_units_status` (`status`),
  KEY `idx_client_units_cancellation_status` (`cancellation_status`),
  KEY `idx_client_units_cancellation_result` (`cancellation_result`),
  KEY `fk_client_units_cancellation_approved_by` (`cancellation_approved_by`),
  KEY `fk_client_units_cleared_for_resale_by` (`cleared_for_resale_by`),
  KEY `idx_client_units_seller_group_id` (`seller_group_id`),
  KEY `idx_client_units_cleared_for_resale` (`cleared_for_resale_at`),
  KEY `fk_client_units_refund_released_by` (`refund_released_by`),
  CONSTRAINT `fk_client_units_assigned_user` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_client_units_cancellation_approved_by` FOREIGN KEY (`cancellation_approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_client_units_cleared_for_resale_by` FOREIGN KEY (`cleared_for_resale_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_client_units_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `fk_client_units_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`),
  CONSTRAINT `fk_client_units_refund_released_by` FOREIGN KEY (`refund_released_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_client_units_seller` FOREIGN KEY (`seller_id`) REFERENCES `accredited_sellers` (`id`),
  CONSTRAINT `fk_client_units_seller_group` FOREIGN KEY (`seller_group_id`) REFERENCES `seller_groups` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_due_day` CHECK ((`due_day` between 1 and 31))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_units`
--

LOCK TABLES `client_units` WRITE;
/*!40000 ALTER TABLE `client_units` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `spouse_co_owner_name` varchar(255) DEFAULT NULL,
  `buyer_type` enum('single','spouses','and_account') NOT NULL DEFAULT 'single',
  `birth_date` date DEFAULT NULL,
  `place_of_birth` varchar(255) DEFAULT NULL,
  `citizenship` varchar(100) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `civil_status` enum('single','married','separated','annulled_divorced','widower') DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `contact_no` varchar(50) DEFAULT NULL,
  `residence_phone_no` varchar(50) DEFAULT NULL,
  `tin` varchar(50) DEFAULT NULL,
  `profile_status` enum('incomplete','complete') NOT NULL DEFAULT 'incomplete',
  `address` varchar(255) DEFAULT NULL,
  `present_address` varchar(500) DEFAULT NULL,
  `present_zip_code` varchar(20) DEFAULT NULL,
  `permanent_address` varchar(500) DEFAULT NULL,
  `permanent_zip_code` varchar(20) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `default_seller_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_clients_default_seller` (`default_seller_id`),
  CONSTRAINT `fk_clients_default_seller` FOREIGN KEY (`default_seller_id`) REFERENCES `accredited_sellers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (1,'Robert Renby C. San Juan',NULL,'single','2005-01-18','imus','Filipino','male','single','robertrenbysanjuan@gmail.com','09876547654','09876547654','768-675-454','complete','blk 70 lot44 cremona st.','blk 70 lot44 cremona st.','4107','b70 l44 cremona st. cluster 5, bella vista, brgy. santiago, general trias, cavite','4107',NULL,10,'2026-06-26 06:19:34','2026-06-26 06:22:45');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commission_releases`
--

DROP TABLE IF EXISTS `commission_releases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commission_releases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `commission_id` int NOT NULL,
  `release_stage` varchar(50) NOT NULL,
  `trigger_payment_percent` decimal(5,2) DEFAULT NULL,
  `release_percent` decimal(5,2) NOT NULL,
  `cumulative_release_percent` decimal(5,2) DEFAULT NULL,
  `gross_release_amount` decimal(12,2) NOT NULL,
  `cash_advance_deduction` decimal(12,2) DEFAULT '0.00',
  `net_release_amount` decimal(12,2) NOT NULL,
  `status` enum('pending','eligible','released','cancelled','on_hold') NOT NULL DEFAULT 'pending',
  `released_at` datetime DEFAULT NULL,
  `released_by` int DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_commission_releases_commission_id` (`commission_id`),
  KEY `idx_commission_releases_status` (`status`),
  KEY `fk_commission_releases_released_by` (`released_by`),
  CONSTRAINT `fk_commission_releases_commission` FOREIGN KEY (`commission_id`) REFERENCES `commissions` (`id`),
  CONSTRAINT `fk_commission_releases_released_by` FOREIGN KEY (`released_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_releases`
--

LOCK TABLES `commission_releases` WRITE;
/*!40000 ALTER TABLE `commission_releases` DISABLE KEYS */;
/*!40000 ALTER TABLE `commission_releases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commission_role_defaults`
--

DROP TABLE IF EXISTS `commission_role_defaults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commission_role_defaults` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `label` varchar(150) NOT NULL,
  `role` varchar(50) NOT NULL,
  `rate_type` varchar(50) NOT NULL,
  `default_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_commission_role_defaults_setting_key` (`setting_key`),
  KEY `idx_commission_role_defaults_role` (`role`),
  KEY `idx_commission_role_defaults_updated_by` (`updated_by`),
  CONSTRAINT `fk_commission_role_defaults_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_role_defaults`
--

LOCK TABLES `commission_role_defaults` WRITE;
/*!40000 ALTER TABLE `commission_role_defaults` DISABLE KEYS */;
/*!40000 ALTER TABLE `commission_role_defaults` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commissions`
--

DROP TABLE IF EXISTS `commissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_unit_id` int NOT NULL,
  `seller_id` int DEFAULT NULL,
  `commission_role` varchar(50) NOT NULL DEFAULT 'agent',
  `rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `commission_base` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gross_commission` decimal(12,2) NOT NULL DEFAULT '0.00',
  `source_type` enum('main','override') NOT NULL DEFAULT 'main',
  `parent_commission_id` int DEFAULT NULL,
  `sale_type` enum('distributed','direct','direct_to_developer') NOT NULL DEFAULT 'distributed',
  `cash_kaliwaan_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `cash_kaliwaan_date` date DEFAULT NULL,
  `cash_kaliwaan_notes` text,
  `override_notes` text,
  `released_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','partially_released','released','cancelled','on_hold') NOT NULL DEFAULT 'active',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `amount` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_commissions_client_unit` (`client_unit_id`),
  KEY `idx_commissions_seller` (`seller_id`),
  KEY `idx_commissions_source_type` (`source_type`),
  KEY `idx_commissions_status` (`status`),
  KEY `idx_commissions_parent` (`parent_commission_id`),
  KEY `idx_commissions_seller_id` (`seller_id`),
  KEY `idx_commissions_sale_type` (`sale_type`),
  CONSTRAINT `fk_commissions_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`),
  CONSTRAINT `fk_commissions_parent` FOREIGN KEY (`parent_commission_id`) REFERENCES `commissions` (`id`),
  CONSTRAINT `fk_commissions_seller` FOREIGN KEY (`seller_id`) REFERENCES `accredited_sellers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commissions`
--

LOCK TABLES `commissions` WRITE;
/*!40000 ALTER TABLE `commissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `commissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_template_items`
--

DROP TABLE IF EXISTS `document_template_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_template_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_id` int NOT NULL,
  `document_id` int NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_template_item` (`template_id`,`document_id`),
  KEY `idx_document_template_items_template_id` (`template_id`),
  KEY `idx_document_template_items_document_id` (`document_id`),
  KEY `idx_document_template_items_status` (`status`),
  CONSTRAINT `fk_document_template_items_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`),
  CONSTRAINT `fk_document_template_items_template` FOREIGN KEY (`template_id`) REFERENCES `document_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_template_items`
--

LOCK TABLES `document_template_items` WRITE;
/*!40000 ALTER TABLE `document_template_items` DISABLE KEYS */;
INSERT INTO `document_template_items` VALUES (1,1,1,1,'active',1,'2026-06-26 05:21:21','2026-06-26 05:21:21'),(2,1,2,1,'active',2,'2026-06-26 05:21:21','2026-06-26 05:21:21'),(3,1,3,1,'active',3,'2026-06-26 05:21:21','2026-06-26 05:21:21'),(4,1,4,1,'active',4,'2026-06-26 05:21:21','2026-06-26 05:21:21'),(5,1,5,1,'active',5,'2026-06-26 05:21:21','2026-06-26 05:21:21'),(6,1,6,1,'active',6,'2026-06-26 05:21:21','2026-06-26 05:21:21'),(7,1,7,1,'active',7,'2026-06-26 05:21:21','2026-06-26 05:21:21'),(8,1,8,1,'active',8,'2026-06-26 05:21:21','2026-06-26 05:21:21'),(9,1,9,1,'active',9,'2026-06-26 05:21:21','2026-06-26 05:21:21'),(10,1,10,1,'active',10,'2026-06-26 05:21:21','2026-06-26 05:21:21'),(11,1,11,1,'active',11,'2026-06-26 05:21:21','2026-06-26 05:21:21'),(12,2,12,1,'active',1,'2026-06-26 05:21:38','2026-06-26 05:21:38'),(13,2,13,1,'active',2,'2026-06-26 05:21:38','2026-06-26 05:21:38'),(14,3,14,1,'active',1,'2026-06-26 05:22:18','2026-06-26 05:22:18'),(15,3,15,1,'active',2,'2026-06-26 05:22:18','2026-06-26 05:22:18'),(16,3,16,1,'active',3,'2026-06-26 05:22:18','2026-06-26 05:22:18'),(17,4,17,1,'active',1,'2026-06-26 05:23:06','2026-06-26 05:23:06'),(18,4,18,1,'active',2,'2026-06-26 05:23:06','2026-06-26 05:23:06'),(19,4,19,1,'active',3,'2026-06-26 05:23:06','2026-06-26 05:23:06'),(20,4,20,1,'active',4,'2026-06-26 05:23:06','2026-06-26 05:23:06'),(21,5,21,1,'active',1,'2026-06-26 05:23:30','2026-06-26 05:23:30'),(22,5,22,1,'active',2,'2026-06-26 05:23:30','2026-06-26 05:23:30');
/*!40000 ALTER TABLE `document_template_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_templates`
--

DROP TABLE IF EXISTS `document_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_templates_name` (`name`),
  KEY `idx_document_templates_status` (`status`),
  KEY `idx_document_templates_created_by` (`created_by`),
  CONSTRAINT `fk_document_templates_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_templates`
--

LOCK TABLES `document_templates` WRITE;
/*!40000 ALTER TABLE `document_templates` DISABLE KEYS */;
INSERT INTO `document_templates` VALUES (1,'LIST OF DOCUMENTS',NULL,'active',1,'2026-06-26 05:21:21','2026-06-26 05:21:21'),(2,'FOR OFW\'s',NULL,'active',1,'2026-06-26 05:21:38','2026-06-26 05:21:38'),(3,'Required for Submission',NULL,'active',1,'2026-06-26 05:22:18','2026-06-26 05:22:18'),(4,'Required for Submission(For Married Client\'s)',NULL,'active',1,'2026-06-26 05:23:06','2026-06-26 05:23:06'),(5,'Required for Submission(For OFW\'s or Representative)',NULL,'active',1,'2026-06-26 05:23:30','2026-06-26 05:23:30');
/*!40000 ALTER TABLE `document_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '0',
  `can_reuse` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (1,'CLIENT REGISTRATION FORM (Seller\'s Copy)',NULL,0,1,'active','2026-06-26 05:14:02','2026-06-26 05:14:02'),(2,'CLIENT REGISTRATION FORM (Administrator Copy)',NULL,0,1,'active','2026-06-26 05:14:14','2026-06-26 05:14:14'),(3,'BUYER\'S INFORMATION FORM',NULL,0,1,'active','2026-06-26 05:14:23','2026-06-26 05:14:23'),(4,'INTENT TO BUY',NULL,0,1,'active','2026-06-26 05:14:30','2026-06-26 05:14:30'),(5,'OFFER TO BUT & BUYER\'S PROFILE',NULL,0,1,'active','2026-06-26 05:14:42','2026-06-26 05:14:42'),(6,'RESERVATION AGREEMENT',NULL,0,1,'active','2026-06-26 05:14:48','2026-06-26 05:14:48'),(7,'DEED OF SALE',NULL,0,1,'active','2026-06-26 05:14:53','2026-06-26 05:14:53'),(8,'CONTRACT TO SELL',NULL,0,1,'active','2026-06-26 05:15:00','2026-06-26 05:15:00'),(9,'BUYER COUNSELLING AND ACKNOWLEDGEMENT FORM',NULL,0,1,'active','2026-06-26 05:15:13','2026-06-26 05:15:13'),(10,'VOLUNTARY CANCELLATION AND WAIVER OF RIGHTS',NULL,0,1,'active','2026-06-26 05:15:23','2026-06-26 05:15:23'),(11,'BUYER ACKNOWLEDGEMENT FORM',NULL,0,1,'active','2026-06-26 05:15:33','2026-06-26 05:15:33'),(12,'SPA to Process Title (for Company)',NULL,0,1,'active','2026-06-26 05:15:48','2026-06-26 05:15:48'),(13,'SPA Authorization to Sign (for Representative)',NULL,0,1,'active','2026-06-26 05:16:05','2026-06-26 05:16:05'),(14,'Two valid Government-issued ID\'s (w/ 3 specimen signatures)',NULL,0,1,'active','2026-06-26 05:16:29','2026-06-26 05:16:29'),(15,'TIN No. / TIN ID',NULL,0,1,'active','2026-06-26 05:16:37','2026-06-26 05:16:37'),(16,'PSA (Single)',NULL,0,1,'active','2026-06-26 05:16:44','2026-06-26 05:16:44'),(17,'Marriage Certificate',NULL,0,1,'active','2026-06-26 05:16:59','2026-06-26 05:16:59'),(18,'Valid ID of Spouse (w/ 3 specimen signatures)',NULL,0,1,'active','2026-06-26 05:17:23','2026-06-26 05:17:23'),(19,'Spouse\'s Signature (when required)',NULL,0,1,'active','2026-06-26 05:17:34','2026-06-26 05:17:34'),(20,'CENOMAR (if the buyer has kids but not married)',NULL,0,1,'active','2026-06-26 05:17:47','2026-06-26 05:17:47'),(21,'Passport ID',NULL,0,1,'active','2026-06-26 05:17:53','2026-06-26 05:17:53'),(22,'Valid ID\'s of both Principal and Representative',NULL,0,1,'active','2026-06-26 05:18:06','2026-06-26 05:18:06');
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_logs`
--

DROP TABLE IF EXISTS `email_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int DEFAULT NULL,
  `client_unit_id` int DEFAULT NULL,
  `sent_to` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message_type` enum('payment_due','missing_documents','past_due','custom') NOT NULL,
  `message_body` text NOT NULL,
  `status` enum('sent','failed') NOT NULL DEFAULT 'sent',
  `error_message` text,
  `sent_by` int DEFAULT NULL,
  `sent_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_logs_client_unit` (`client_unit_id`),
  KEY `idx_email_logs_client` (`client_id`),
  KEY `idx_email_logs_type_status` (`message_type`,`status`),
  KEY `idx_email_logs_sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_logs`
--

LOCK TABLES `email_logs` WRITE;
/*!40000 ALTER TABLE `email_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `position` varchar(255) DEFAULT NULL,
  `monthly_salary` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listing_document_requirements`
--

DROP TABLE IF EXISTS `listing_document_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listing_document_requirements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `listing_id` int NOT NULL,
  `document_id` int NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `sort_order` int NOT NULL DEFAULT '0',
  `source` varchar(50) NOT NULL DEFAULT 'project_default',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_listing_document_requirement` (`listing_id`,`document_id`),
  KEY `idx_listing_document_requirements_listing_id` (`listing_id`),
  KEY `idx_listing_document_requirements_document_id` (`document_id`),
  CONSTRAINT `fk_listing_document_requirements_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_listing_document_requirements_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_document_requirements`
--

LOCK TABLES `listing_document_requirements` WRITE;
/*!40000 ALTER TABLE `listing_document_requirements` DISABLE KEYS */;
INSERT INTO `listing_document_requirements` VALUES (1,1,14,1,'active',1,'listing_override','2026-06-26 05:29:50','2026-06-26 05:29:50'),(2,1,15,1,'active',2,'listing_override','2026-06-26 05:29:50','2026-06-26 05:29:50'),(3,1,16,1,'active',3,'listing_override','2026-06-26 05:29:50','2026-06-26 05:29:50'),(4,1,1,1,'active',4,'listing_override','2026-06-26 05:29:50','2026-06-26 05:29:50'),(5,1,2,1,'active',5,'listing_override','2026-06-26 05:29:50','2026-06-26 05:29:50'),(6,1,3,1,'active',6,'listing_override','2026-06-26 05:29:50','2026-06-26 05:29:50'),(7,1,4,1,'active',7,'listing_override','2026-06-26 05:29:50','2026-06-26 05:29:50'),(8,1,5,1,'active',8,'listing_override','2026-06-26 05:29:50','2026-06-26 05:29:50'),(9,1,6,1,'active',9,'listing_override','2026-06-26 05:29:50','2026-06-26 05:29:50'),(10,1,7,1,'active',10,'listing_override','2026-06-26 05:29:50','2026-06-26 05:29:50'),(11,1,8,1,'active',11,'listing_override','2026-06-26 05:29:50','2026-06-26 05:29:50'),(12,1,9,1,'active',12,'listing_override','2026-06-26 05:29:50','2026-06-26 05:29:50'),(13,1,10,1,'active',13,'listing_override','2026-06-26 05:29:50','2026-06-26 05:29:50'),(14,1,11,1,'active',14,'listing_override','2026-06-26 05:29:50','2026-06-26 05:29:50'),(15,2,14,1,'active',1,'project_default','2026-06-26 05:31:02','2026-06-26 05:31:02'),(16,2,15,1,'active',2,'project_default','2026-06-26 05:31:02','2026-06-26 05:31:02'),(17,2,16,1,'active',3,'project_default','2026-06-26 05:31:02','2026-06-26 05:31:02'),(18,2,1,1,'active',4,'project_default','2026-06-26 05:31:02','2026-06-26 05:31:02'),(19,2,2,1,'active',5,'project_default','2026-06-26 05:31:02','2026-06-26 05:31:02'),(20,2,3,1,'active',6,'project_default','2026-06-26 05:31:02','2026-06-26 05:31:02'),(21,2,4,1,'active',7,'project_default','2026-06-26 05:31:02','2026-06-26 05:31:02'),(22,2,5,1,'active',8,'project_default','2026-06-26 05:31:02','2026-06-26 05:31:02'),(23,2,6,1,'active',9,'project_default','2026-06-26 05:31:02','2026-06-26 05:31:02'),(24,2,7,1,'active',10,'project_default','2026-06-26 05:31:02','2026-06-26 05:31:02'),(25,2,8,1,'active',11,'project_default','2026-06-26 05:31:02','2026-06-26 05:31:02'),(26,2,9,1,'active',12,'project_default','2026-06-26 05:31:02','2026-06-26 05:31:02'),(27,2,10,1,'active',13,'project_default','2026-06-26 05:31:02','2026-06-26 05:31:02'),(28,2,11,1,'active',14,'project_default','2026-06-26 05:31:02','2026-06-26 05:31:02');
/*!40000 ALTER TABLE `listing_document_requirements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listing_unit_aliases`
--

DROP TABLE IF EXISTS `listing_unit_aliases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listing_unit_aliases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `listing_id` int NOT NULL,
  `alias_unit_id` varchar(255) NOT NULL,
  `alias_type` enum('old_unit_id','survey_id','marketing_id','other') NOT NULL DEFAULT 'old_unit_id',
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_listing_unit_alias` (`listing_id`,`alias_unit_id`),
  KEY `idx_listing_unit_alias_lookup` (`alias_unit_id`),
  KEY `idx_listing_unit_aliases_alias_unit` (`alias_unit_id`),
  CONSTRAINT `fk_listing_unit_alias_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_unit_aliases`
--

LOCK TABLES `listing_unit_aliases` WRITE;
/*!40000 ALTER TABLE `listing_unit_aliases` DISABLE KEYS */;
/*!40000 ALTER TABLE `listing_unit_aliases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listing_unit_history`
--

DROP TABLE IF EXISTS `listing_unit_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listing_unit_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `listing_id` int NOT NULL,
  `old_unit_id` varchar(100) NOT NULL,
  `new_unit_id` varchar(100) NOT NULL,
  `reason` enum('renumbering','geography_adjustment','correction','phase_revision','admin_correction') NOT NULL DEFAULT 'admin_correction',
  `effective_date` date DEFAULT NULL,
  `changed_by` int DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_listing_unit_history_listing` (`listing_id`),
  KEY `idx_listing_unit_history_old_unit` (`old_unit_id`),
  KEY `idx_listing_unit_history_new_unit` (`new_unit_id`),
  KEY `idx_listing_unit_history_reason` (`reason`),
  KEY `fk_listing_unit_history_changed_by` (`changed_by`),
  CONSTRAINT `fk_listing_unit_history_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_listing_unit_history_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_unit_history`
--

LOCK TABLES `listing_unit_history` WRITE;
/*!40000 ALTER TABLE `listing_unit_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `listing_unit_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listing_unit_lineage`
--

DROP TABLE IF EXISTS `listing_unit_lineage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listing_unit_lineage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_listing_id` int NOT NULL,
  `child_listing_id` int NOT NULL,
  `relationship_type` enum('split','merge','renumbered','resurveyed') NOT NULL DEFAULT 'renumbered',
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_listing_lineage_pair` (`parent_listing_id`,`child_listing_id`),
  KEY `idx_listing_lineage_parent` (`parent_listing_id`),
  KEY `idx_listing_lineage_child` (`child_listing_id`),
  CONSTRAINT `fk_listing_lineage_child` FOREIGN KEY (`child_listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_listing_lineage_parent` FOREIGN KEY (`parent_listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_unit_lineage`
--

LOCK TABLES `listing_unit_lineage` WRITE;
/*!40000 ALTER TABLE `listing_unit_lineage` DISABLE KEYS */;
/*!40000 ALTER TABLE `listing_unit_lineage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listings`
--

DROP TABLE IF EXISTS `listings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `cadastral_lot_no` varchar(255) DEFAULT NULL,
  `unit_id` varchar(255) NOT NULL,
  `block_no` varchar(50) DEFAULT NULL,
  `lot_no` varchar(50) DEFAULT NULL,
  `orientation` varchar(100) DEFAULT NULL,
  `lot_type` varchar(100) DEFAULT NULL,
  `reservation_fee` decimal(15,2) NOT NULL DEFAULT '0.00',
  `price_per_sqm` decimal(15,2) NOT NULL DEFAULT '0.00',
  `lot_area_sqm` decimal(10,2) NOT NULL DEFAULT '0.00',
  `net_selling_price` decimal(15,2) GENERATED ALWAYS AS ((`lot_area_sqm` * `price_per_sqm`)) VIRTUAL,
  `legal_misc_rate` decimal(5,2) NOT NULL DEFAULT '10.00',
  `annual_interest_rate` decimal(7,3) NOT NULL DEFAULT '0.000',
  `legal_misc_fee` decimal(15,2) GENERATED ALWAYS AS (((`lot_area_sqm` * `price_per_sqm`) * (`legal_misc_rate` / 100))) VIRTUAL,
  `total_contract_price` decimal(15,2) GENERATED ALWAYS AS (((`lot_area_sqm` * `price_per_sqm`) + ((`lot_area_sqm` * `price_per_sqm`) * (`legal_misc_rate` / 100)))) VIRTUAL,
  `status` enum('available','reserved','sold','pending_cancellation') NOT NULL DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_listing_project_unit` (`project_id`,`unit_id`),
  KEY `idx_listings_status` (`status`),
  KEY `idx_listings_project_price_list_sort` (`project_id`,`block_no`,`lot_no`,`unit_id`),
  CONSTRAINT `fk_listings_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listings`
--

LOCK TABLES `listings` WRITE;
/*!40000 ALTER TABLE `listings` DISABLE KEYS */;
INSERT INTO `listings` (`id`, `project_id`, `cadastral_lot_no`, `unit_id`, `block_no`, `lot_no`, `orientation`, `lot_type`, `reservation_fee`, `price_per_sqm`, `lot_area_sqm`, `legal_misc_rate`, `annual_interest_rate`, `status`, `created_at`, `updated_at`) VALUES (1,1,'1314','LA-0818',NULL,NULL,NULL,'inner',50000.00,1000.00,300.00,10.00,0.000,'available','2026-06-26 05:29:50','2026-06-26 05:29:50'),(2,1,'1306','LA-0104',NULL,NULL,NULL,'corner',50000.00,1000.00,446.00,10.00,11.500,'available','2026-06-26 05:31:02','2026-06-26 05:31:02');
/*!40000 ALTER TABLE `listings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_schedules`
--

DROP TABLE IF EXISTS `payment_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_unit_id` int NOT NULL,
  `due_date` date DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `schedule_type` enum('reservation','downpayment','monthly','balloon','legal_misc','penalty','other') NOT NULL DEFAULT 'monthly',
  `principal_due` decimal(15,2) NOT NULL DEFAULT '0.00',
  `interest_due` decimal(15,2) NOT NULL DEFAULT '0.00',
  `penalty_due` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_due` decimal(15,2) NOT NULL DEFAULT '0.00',
  `amount_paid` decimal(15,2) NOT NULL DEFAULT '0.00',
  `advance_applied` decimal(15,2) NOT NULL DEFAULT '0.00',
  `balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `date_paid` date DEFAULT NULL,
  `reference_no` varchar(150) DEFAULT NULL,
  `status` enum('not_due','due','partial','paid','advance','offset','past_due','waived') NOT NULL DEFAULT 'not_due',
  `running_balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reference_details` text,
  PRIMARY KEY (`id`),
  KEY `idx_payment_schedules_client_unit` (`client_unit_id`),
  KEY `idx_payment_schedules_due_date` (`due_date`),
  KEY `idx_payment_schedules_status` (`status`),
  KEY `idx_payment_schedules_type` (`schedule_type`),
  CONSTRAINT `fk_payment_schedules_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_schedules`
--

LOCK TABLES `payment_schedules` WRITE;
/*!40000 ALTER TABLE `payment_schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_unit_id` int NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_type` varchar(100) DEFAULT NULL,
  `payment_method` varchar(100) DEFAULT NULL,
  `reference_id` varchar(100) DEFAULT NULL,
  `payment_date` date NOT NULL DEFAULT (curdate()),
  `status` enum('pending','verified','rejected','voided') NOT NULL DEFAULT 'pending',
  `verified_by` int DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reference_no` varchar(150) DEFAULT NULL,
  `remarks` text,
  PRIMARY KEY (`id`),
  KEY `fk_payments_client_unit` (`client_unit_id`),
  KEY `fk_payments_verified_by` (`verified_by`),
  KEY `idx_payments_reference_id` (`reference_id`),
  CONSTRAINT `fk_payments_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`),
  CONSTRAINT `fk_payments_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_cadastral_lots`
--

DROP TABLE IF EXISTS `project_cadastral_lots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_cadastral_lots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `cadastral_lot_no` varchar(100) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_project_cadastral_lot` (`project_id`,`cadastral_lot_no`),
  KEY `idx_project_cadastral_lots_project` (`project_id`),
  KEY `idx_project_cadastral_lots_status` (`status`),
  CONSTRAINT `fk_project_cadastral_lots_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_cadastral_lots`
--

LOCK TABLES `project_cadastral_lots` WRITE;
/*!40000 ALTER TABLE `project_cadastral_lots` DISABLE KEYS */;
INSERT INTO `project_cadastral_lots` VALUES (1,1,'1306','active','2026-06-26 05:13:21','2026-06-26 05:25:52'),(2,1,'1314','active','2026-06-26 05:13:21','2026-06-26 05:25:52'),(3,2,'2222','active','2026-06-26 05:25:35','2026-06-26 05:25:35'),(4,2,'3333','active','2026-06-26 05:25:35','2026-06-26 05:25:35');
/*!40000 ALTER TABLE `project_cadastral_lots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_document_requirements`
--

DROP TABLE IF EXISTS `project_document_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_document_requirements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `document_id` int NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_project_document_requirement` (`project_id`,`document_id`),
  KEY `idx_project_document_requirements_project_id` (`project_id`),
  KEY `idx_project_document_requirements_document_id` (`document_id`),
  CONSTRAINT `fk_project_document_requirements_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_project_document_requirements_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_document_requirements`
--

LOCK TABLES `project_document_requirements` WRITE;
/*!40000 ALTER TABLE `project_document_requirements` DISABLE KEYS */;
INSERT INTO `project_document_requirements` VALUES (1,2,14,1,'active',1,'2026-06-26 05:25:35','2026-06-26 05:25:35'),(2,2,15,1,'active',2,'2026-06-26 05:25:35','2026-06-26 05:25:35'),(3,2,16,1,'active',3,'2026-06-26 05:25:35','2026-06-26 05:25:35'),(4,2,1,1,'active',4,'2026-06-26 05:25:35','2026-06-26 05:25:35'),(5,2,2,1,'active',5,'2026-06-26 05:25:35','2026-06-26 05:25:35'),(6,2,3,1,'active',6,'2026-06-26 05:25:35','2026-06-26 05:25:35'),(7,2,4,1,'active',7,'2026-06-26 05:25:35','2026-06-26 05:25:35'),(8,2,5,1,'active',8,'2026-06-26 05:25:35','2026-06-26 05:25:35'),(9,2,6,1,'active',9,'2026-06-26 05:25:35','2026-06-26 05:25:35'),(10,2,7,1,'active',10,'2026-06-26 05:25:35','2026-06-26 05:25:35'),(11,2,8,1,'active',11,'2026-06-26 05:25:35','2026-06-26 05:25:35'),(12,2,9,1,'active',12,'2026-06-26 05:25:35','2026-06-26 05:25:35'),(13,2,10,1,'active',13,'2026-06-26 05:25:35','2026-06-26 05:25:35'),(14,2,11,1,'active',14,'2026-06-26 05:25:35','2026-06-26 05:25:35'),(15,1,14,1,'active',1,'2026-06-26 05:25:52','2026-06-26 05:25:52'),(16,1,15,1,'active',2,'2026-06-26 05:25:52','2026-06-26 05:25:52'),(17,1,16,1,'active',3,'2026-06-26 05:25:52','2026-06-26 05:25:52'),(18,1,1,1,'active',4,'2026-06-26 05:25:52','2026-06-26 05:25:52'),(19,1,2,1,'active',5,'2026-06-26 05:25:52','2026-06-26 05:25:52'),(20,1,3,1,'active',6,'2026-06-26 05:25:52','2026-06-26 05:25:52'),(21,1,4,1,'active',7,'2026-06-26 05:25:52','2026-06-26 05:25:52'),(22,1,5,1,'active',8,'2026-06-26 05:25:52','2026-06-26 05:25:52'),(23,1,6,1,'active',9,'2026-06-26 05:25:52','2026-06-26 05:25:52'),(24,1,7,1,'active',10,'2026-06-26 05:25:52','2026-06-26 05:25:52'),(25,1,8,1,'active',11,'2026-06-26 05:25:52','2026-06-26 05:25:52'),(26,1,9,1,'active',12,'2026-06-26 05:25:52','2026-06-26 05:25:52'),(27,1,10,1,'active',13,'2026-06-26 05:25:52','2026-06-26 05:25:52'),(28,1,11,1,'active',14,'2026-06-26 05:25:52','2026-06-26 05:25:52');
/*!40000 ALTER TABLE `project_document_requirements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `location_code` varchar(10) NOT NULL DEFAULT '',
  `administrator` varchar(255) DEFAULT NULL,
  `tax_declaration_no` varchar(255) DEFAULT NULL,
  `pin` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `document_template_id` int DEFAULT NULL,
  `ended_at` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_projects_location_code` (`location_code`),
  KEY `idx_projects_document_template_id` (`document_template_id`),
  CONSTRAINT `fk_projects_document_template` FOREIGN KEY (`document_template_id`) REFERENCES `document_templates` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'Bailen Project','Bailen, Cavite','LA','IMELDA B. VILLALOBOS','AA-06-0005-00105','022-06-0005-003-04','active',1,NULL,'2026-06-26 05:13:21','2026-06-26 05:25:52'),(2,'Maragondon Project','Maragondon, Cavite','PE','SANTOS A. VILLAMOR','AA-03-2105-00102','011-02-0003-003-04','active',3,NULL,'2026-06-26 05:25:35','2026-06-26 05:25:35');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proof_income_requests`
--

DROP TABLE IF EXISTS `proof_income_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proof_income_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_unit_id` int NOT NULL,
  `client_id` int NOT NULL,
  `listing_id` int NOT NULL,
  `requested_by_seller_id` int DEFAULT NULL,
  `requested_by_user_id` int DEFAULT NULL,
  `request_message` text,
  `status` enum('pending','sent','submitted','reviewed','cancelled') NOT NULL DEFAULT 'pending',
  `email_status` enum('not_sent','sent','failed','missing_email') NOT NULL DEFAULT 'not_sent',
  `email_error` text,
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` datetime DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `resolved_by` int DEFAULT NULL,
  `admin_notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_proof_income_client_unit` (`client_unit_id`),
  KEY `idx_proof_income_client` (`client_id`),
  KEY `idx_proof_income_listing` (`listing_id`),
  KEY `idx_proof_income_status` (`status`),
  KEY `idx_proof_income_requested_by_seller` (`requested_by_seller_id`),
  KEY `idx_proof_income_requested_by_user` (`requested_by_user_id`),
  KEY `idx_proof_income_resolved_by` (`resolved_by`),
  CONSTRAINT `fk_proof_income_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_proof_income_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_proof_income_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_proof_income_requested_by_seller` FOREIGN KEY (`requested_by_seller_id`) REFERENCES `accredited_sellers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_proof_income_requested_by_user` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_proof_income_resolved_by` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proof_income_requests`
--

LOCK TABLES `proof_income_requests` WRITE;
/*!40000 ALTER TABLE `proof_income_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `proof_income_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rest_days`
--

DROP TABLE IF EXISTS `rest_days`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rest_days` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `day_name` varchar(20) NOT NULL,
  `is_rest_day` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_rest_day` (`employee_id`,`day_name`),
  CONSTRAINT `fk_rest_days_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rest_days`
--

LOCK TABLES `rest_days` WRITE;
/*!40000 ALTER TABLE `rest_days` DISABLE KEYS */;
/*!40000 ALTER TABLE `rest_days` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seller_group_members`
--

DROP TABLE IF EXISTS `seller_group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seller_group_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seller_group_id` int NOT NULL,
  `seller_id` int NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_seller_group_members_group` (`seller_group_id`),
  KEY `idx_seller_group_members_seller` (`seller_id`),
  KEY `idx_seller_group_members_status` (`status`),
  CONSTRAINT `fk_seller_group_members_group` FOREIGN KEY (`seller_group_id`) REFERENCES `seller_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_seller_group_members_seller` FOREIGN KEY (`seller_id`) REFERENCES `accredited_sellers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seller_group_members`
--

LOCK TABLES `seller_group_members` WRITE;
/*!40000 ALTER TABLE `seller_group_members` DISABLE KEYS */;
INSERT INTO `seller_group_members` VALUES (1,1,1,'active','2026-06-26 13:42:41',NULL,'2026-06-26 05:42:41','2026-06-26 05:42:41'),(2,1,2,'active','2026-06-26 13:42:57',NULL,'2026-06-26 05:42:57','2026-06-26 05:42:57'),(4,1,4,'active','2026-06-26 13:44:19',NULL,'2026-06-26 05:44:19','2026-06-26 05:44:19'),(5,3,5,'active','2026-06-26 13:44:53',NULL,'2026-06-26 05:44:53','2026-06-26 05:44:53'),(6,3,6,'inactive','2026-06-26 13:45:04','2026-06-26 14:17:31','2026-06-26 05:45:04','2026-06-26 06:17:31'),(7,3,7,'active','2026-06-26 13:58:03',NULL,'2026-06-26 05:58:03','2026-06-26 05:58:03'),(8,3,3,'active','2026-06-26 13:58:49',NULL,'2026-06-26 05:58:49','2026-06-26 05:58:49'),(9,1,8,'active','2026-06-26 14:02:26',NULL,'2026-06-26 06:02:26','2026-06-26 06:02:26'),(10,1,9,'active','2026-06-26 14:02:34',NULL,'2026-06-26 06:02:34','2026-06-26 06:02:34'),(11,3,10,'active','2026-06-26 14:03:02',NULL,'2026-06-26 06:03:02','2026-06-26 06:03:02'),(13,3,6,'active','2026-06-26 14:18:35',NULL,'2026-06-26 06:18:35','2026-06-26 06:18:35');
/*!40000 ALTER TABLE `seller_group_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seller_group_rate_distributions`
--

DROP TABLE IF EXISTS `seller_group_rate_distributions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seller_group_rate_distributions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seller_group_id` int NOT NULL,
  `seller_role` enum('broker_network_manager','broker','manager','agent') NOT NULL,
  `requested_rate` decimal(5,2) DEFAULT NULL,
  `approved_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `status` enum('draft','submitted','approved','rejected') NOT NULL DEFAULT 'approved',
  `remarks` text,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_seller_group_role` (`seller_group_id`,`seller_role`),
  KEY `idx_seller_group_rate_role` (`seller_role`),
  KEY `idx_seller_group_rate_status` (`status`),
  KEY `fk_seller_group_rate_updated_by` (`updated_by`),
  CONSTRAINT `fk_seller_group_rate_group` FOREIGN KEY (`seller_group_id`) REFERENCES `seller_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_seller_group_rate_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seller_group_rate_distributions`
--

LOCK TABLES `seller_group_rate_distributions` WRITE;
/*!40000 ALTER TABLE `seller_group_rate_distributions` DISABLE KEYS */;
INSERT INTO `seller_group_rate_distributions` VALUES (1,1,'broker_network_manager',8.00,8.00,'approved','Editable rate for BNM personal sale.',1,'2026-06-26 05:40:54','2026-06-26 05:40:54'),(2,1,'broker',7.00,7.00,'approved','Editable broker personal sale rate.',1,'2026-06-26 05:40:54','2026-06-26 05:40:54'),(3,1,'manager',6.00,6.00,'approved','Editable manager personal sale rate.',1,'2026-06-26 05:40:54','2026-06-26 05:40:54'),(4,1,'agent',5.00,5.00,'approved','Editable agent personal sale rate.',1,'2026-06-26 05:40:54','2026-06-26 05:40:54'),(9,3,'broker_network_manager',8.00,8.00,'approved','Editable rate for BNM personal sale.',1,'2026-06-26 05:44:42','2026-06-26 06:31:14'),(10,3,'broker',7.00,7.00,'approved','Editable broker personal sale rate.',1,'2026-06-26 05:44:42','2026-06-26 06:31:14'),(11,3,'manager',6.00,6.00,'approved','Editable manager personal sale rate.',1,'2026-06-26 05:44:42','2026-06-26 06:31:14'),(12,3,'agent',5.00,5.00,'approved','Editable agent personal sale rate.',1,'2026-06-26 05:44:42','2026-06-26 06:31:14');
/*!40000 ALTER TABLE `seller_group_rate_distributions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seller_groups`
--

DROP TABLE IF EXISTS `seller_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seller_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_name` varchar(255) NOT NULL,
  `group_code` varchar(80) DEFAULT NULL,
  `pool_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `closing_seller_rate` decimal(5,2) NOT NULL DEFAULT '5.00',
  `bnm_override_rate` decimal(5,2) NOT NULL DEFAULT '1.00',
  `broker_override_rate` decimal(5,2) NOT NULL DEFAULT '1.00',
  `manager_override_rate` decimal(5,2) NOT NULL DEFAULT '1.00',
  `agent_sale_split_json` json DEFAULT NULL,
  `manager_sale_split_json` json DEFAULT NULL,
  `broker_sale_split_json` json DEFAULT NULL,
  `bnm_sale_split_json` json DEFAULT NULL,
  `rollover_policy` enum('roll_up_to_nearest_upline','custom_sale_type_splits') NOT NULL DEFAULT 'custom_sale_type_splits',
  `group_head_seller_id` int DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `notes` text,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_seller_groups_name` (`group_name`),
  UNIQUE KEY `uq_seller_groups_code` (`group_code`),
  KEY `idx_seller_groups_status` (`status`),
  KEY `idx_seller_groups_head` (`group_head_seller_id`),
  KEY `fk_seller_groups_created_by` (`created_by`),
  KEY `fk_seller_groups_updated_by` (`updated_by`),
  KEY `idx_seller_groups_rollover_policy` (`rollover_policy`),
  CONSTRAINT `fk_seller_groups_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_seller_groups_head` FOREIGN KEY (`group_head_seller_id`) REFERENCES `accredited_sellers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_seller_groups_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seller_groups`
--

LOCK TABLES `seller_groups` WRITE;
/*!40000 ALTER TABLE `seller_groups` DISABLE KEYS */;
INSERT INTO `seller_groups` VALUES (1,'R.Cortez Realty','1',8.00,5.00,1.00,1.00,1.00,'{\"agent\": 5, \"broker\": 1, \"manager\": 1, \"broker_network_manager\": 1}','{\"broker\": 1, \"manager\": 6, \"broker_network_manager\": 1}','{\"broker\": 7, \"broker_network_manager\": 1}','{\"broker_network_manager\": 8}','custom_sale_type_splits',NULL,'active',NULL,1,1,'2026-06-26 05:40:54','2026-06-26 05:40:54'),(3,'Cavite Group',NULL,8.00,5.00,1.00,1.00,1.00,'{\"agent\": 5, \"broker\": 1, \"manager\": 1, \"broker_network_manager\": 1}','{\"broker\": 1, \"manager\": 6, \"broker_network_manager\": 1}','{\"broker\": 7, \"broker_network_manager\": 1}','{\"broker_network_manager\": 8}','custom_sale_type_splits',6,'active',NULL,1,1,'2026-06-26 05:44:42','2026-06-26 06:17:13');
/*!40000 ALTER TABLE `seller_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'personnel',
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  `last_login` datetime DEFAULT NULL,
  `temp_password_sent_at` datetime DEFAULT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`status`),
  KEY `idx_users_must_change_password` (`must_change_password`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','superadmin@gmail.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','super_admin','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(2,'Admin User','admin@dcprime.test','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','admin','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(3,'D&C Inhouse BNM','inhouse.bnm@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker_network_manager','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(4,'D&C Inhouse Broker One','inhouse.broker1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(5,'D&C Inhouse Broker Two','inhouse.broker2@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(6,'D&C Inhouse Manager One','inhouse.manager1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(7,'D&C Inhouse Agent One','inhouse.agent1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(8,'Cavite Realty BNM','cavite.realty.bnm@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker_network_manager','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(9,'Cavite Realty Broker One','cavite.realty.broker1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(10,'Cavite Realty Broker Two','cavite.realty.broker2@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(11,'Cavite Realty Manager One','cavite.realty.manager1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(12,'Cavite Realty Agent One','cavite.realty.agent1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(13,'Prime External BNM','external.bnm@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker_network_manager','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(14,'Josep','external.broker1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:58:49'),(15,'Prime External Broker Two','external.broker2@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(16,'Prime External Manager One','external.manager1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20'),(17,'Prime External Agent One','external.agent1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-26 13:09:20','2026-06-26 05:09:20','2026-06-26 05:09:20');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-26 14:32:50
