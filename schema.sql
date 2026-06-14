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
  `custom_reports_under` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `accreditation_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `commission_rate` decimal(5,2) DEFAULT NULL,
  `commission_pool_rate` decimal(5,2) DEFAULT NULL,
  `personal_commission_rate` decimal(5,2) DEFAULT NULL,
  `override_commission_rate` decimal(5,2) DEFAULT NULL,
  `residual_commission_rate` decimal(5,2) DEFAULT NULL,
  `max_downline_rate` decimal(5,2) DEFAULT NULL,
  `rate_set_by` int DEFAULT NULL,
  `rate_updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_accredited_sellers_role_parent` (`seller_role`,`parent_seller_id`),
  KEY `idx_accredited_sellers_rate_set_by` (`rate_set_by`),
  KEY `idx_accredited_sellers_user_id` (`user_id`),
  KEY `idx_accredited_sellers_parent_status` (`parent_seller_id`,`status`),
  CONSTRAINT `fk_accredited_sellers_parent` FOREIGN KEY (`parent_seller_id`) REFERENCES `accredited_sellers` (`id`),
  CONSTRAINT `fk_accredited_sellers_rate_set_by` FOREIGN KEY (`rate_set_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_accredited_sellers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accredited_sellers`
--

LOCK TABLES `accredited_sellers` WRITE;
/*!40000 ALTER TABLE `accredited_sellers` DISABLE KEYS */;
INSERT INTO `accredited_sellers` VALUES (1,NULL,'NEPOMUCENO, ERWIN','phproperty13@gmail.com','0991-995-8155','agent',2,NULL,'active','2025-06-05','2026-06-12 06:26:34','2026-06-13 08:16:49',5.00,NULL,5.00,NULL,NULL,NULL,NULL,NULL),(2,NULL,'PARROCHO, JOSEPH E.','joseph@gmail.com','09054467452','manager',NULL,NULL,'active','2025-07-22','2026-06-12 06:27:02','2026-06-13 08:16:49',7.00,NULL,7.00,NULL,NULL,NULL,NULL,NULL),(3,2,'rgagfgdf','add@gmail.com','0987654654','broker',NULL,NULL,'active','2026-06-23','2026-06-13 09:05:53','2026-06-13 09:05:53',8.00,2.00,8.00,NULL,NULL,NULL,1,'2026-06-13 17:05:53'),(4,3,'PARROCHO, JOSEPH E.','joseph@gmail.com','0987658765','manager',3,NULL,'active','2026-06-17','2026-06-13 09:07:02','2026-06-13 09:07:02',5.00,NULL,5.00,2.00,NULL,NULL,1,'2026-06-13 17:07:02');
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
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'create','Projects','Created project Bailen','::1','2026-06-12 06:23:49'),(2,1,'create','Projects','Created project Maragondon','::1','2026-06-12 06:24:05'),(3,1,'create','Listings','Created listing LA-1602','127.0.0.1','2026-06-12 06:25:11'),(4,1,'create','Listings','Created listing LA-0315','127.0.0.1','2026-06-12 06:25:50'),(5,1,'create','Accredited Sellers','Created accredited seller NEPOMUCENO, ERWIN','127.0.0.1','2026-06-12 06:26:34'),(6,1,'create','Accredited Sellers','Created accredited seller PARROCHO, JOSEPH E.','127.0.0.1','2026-06-12 06:27:02'),(7,1,'update','Accredited Sellers','Updated accredited seller NEPOMUCENO, ERWIN. Synced 0 open commission(s).','127.0.0.1','2026-06-12 06:27:08'),(8,1,'create','Clients','Created client AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-12 06:28:09'),(9,1,'reserve','Client Units','Reserved LA-1602 for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-12 06:31:49'),(10,1,'create','Documents','Created document client registration form seller\'s copy','127.0.0.1','2026-06-12 06:32:14'),(11,1,'create','Documents','Created document client registration form administrator copy','127.0.0.1','2026-06-12 06:32:16'),(12,1,'create','Documents','Created document intent to buy','127.0.0.1','2026-06-12 06:32:21'),(13,1,'create','Documents','Created document offer to buy & buyer\'s profile','127.0.0.1','2026-06-12 06:32:24'),(14,1,'create','Documents','Created document reservation agreement','127.0.0.1','2026-06-12 06:32:29'),(15,1,'create','Documents','Created document deed of sale','127.0.0.1','2026-06-12 06:32:36'),(16,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-12 06:33:05'),(17,1,'update','Payments','Updated payment 1','127.0.0.1','2026-06-12 06:33:13'),(18,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-12 06:35:08'),(19,1,'create','Client Documents','Created document checklist for client unit 1','127.0.0.1','2026-06-12 06:50:42'),(20,1,'document_check','Client Documents','Updated client document 1 to approved','127.0.0.1','2026-06-12 06:50:47'),(21,1,'document_check','Client Documents','Updated client document 1 to submitted','127.0.0.1','2026-06-12 06:50:48'),(22,1,'document_check','Client Documents','Updated client document 2 to submitted','127.0.0.1','2026-06-12 06:50:49'),(23,1,'document_check','Client Documents','Updated client document 2 to approved','127.0.0.1','2026-06-12 06:50:51'),(24,1,'document_check','Client Documents','Updated client document 3 to submitted','127.0.0.1','2026-06-12 06:50:57'),(25,1,'document_check','Client Documents','Updated client document 3 to approved','127.0.0.1','2026-06-12 06:51:03'),(26,1,'document_check','Client Documents','Updated client document 4 to approved','127.0.0.1','2026-06-12 06:51:06'),(27,1,'document_check','Client Documents','Updated client document 4 to not_submitted','127.0.0.1','2026-06-12 06:51:09'),(28,1,'document_check','Client Documents','Updated client document 3 to not_submitted','127.0.0.1','2026-06-12 06:51:10'),(29,1,'document_check','Client Documents','Updated client document 3 to submitted','127.0.0.1','2026-06-12 06:51:19'),(30,1,'document_check','Client Documents','Updated client document 4 to submitted','127.0.0.1','2026-06-12 06:51:20'),(31,1,'document_check','Client Documents','Updated client document 5 to submitted','127.0.0.1','2026-06-12 06:51:21'),(32,1,'document_check','Client Documents','Updated client document 6 to submitted','127.0.0.1','2026-06-12 06:51:22'),(33,1,'document_check','Client Documents','Updated client document 2 to rejected','127.0.0.1','2026-06-12 06:51:27'),(34,1,'document_check','Client Documents','Updated client document 2 to not_submitted','127.0.0.1','2026-06-12 06:51:30'),(35,1,'document_check','Client Documents','Updated client document 3 to not_submitted','127.0.0.1','2026-06-12 06:51:31'),(36,1,'document_check','Client Documents','Updated client document 4 to not_submitted','127.0.0.1','2026-06-12 06:51:32'),(37,1,'document_check','Client Documents','Updated client document 5 to not_submitted','127.0.0.1','2026-06-12 06:51:33'),(38,1,'document_check','Client Documents','Updated client document 6 to not_submitted','127.0.0.1','2026-06-12 06:51:34'),(39,1,'update','Accredited Sellers','Updated accredited seller PARROCHO, JOSEPH E.. Synced 0 open commission(s).','127.0.0.1','2026-06-12 07:19:06'),(40,1,'document_check','Client Documents','Updated client document 2 to submitted','127.0.0.1','2026-06-12 08:13:44'),(41,1,'document_check','Client Documents','Updated client document 2 to approved','127.0.0.1','2026-06-12 08:14:31'),(42,1,'release','Commission Releases','Marked release 1 as released','127.0.0.1','2026-06-12 08:22:44'),(43,1,'create','Cash Advances','Created cash advance for PARROCHO, JOSEPH E.','127.0.0.1','2026-06-12 08:31:40'),(44,1,'approve','Cash Advances','Approved cash advance 1','127.0.0.1','2026-06-12 08:31:41'),(45,1,'deduct','Commission Releases','Deducted 1000 cash advance from release 7','127.0.0.1','2026-06-12 08:32:09'),(46,1,'create','Cash Advances','Created cash advance for PARROCHO, JOSEPH E.','127.0.0.1','2026-06-12 08:33:17'),(47,1,'approve','Cash Advances','Approved cash advance 2','127.0.0.1','2026-06-12 08:33:18'),(48,1,'deduct','Commission Releases','Deducted 864 cash advance from release 7','127.0.0.1','2026-06-12 08:33:39'),(49,1,'deduct','Commission Releases','Deducted 1864 cash advance from release 8','127.0.0.1','2026-06-12 08:33:49'),(50,1,'deduct','Commission Releases','Deducted 272 cash advance from release 9','127.0.0.1','2026-06-12 08:33:53'),(51,1,'create','Cash Advances','Created cash advance for PARROCHO, JOSEPH E.','127.0.0.1','2026-06-12 08:41:51'),(52,1,'approve','Cash Advances','Approved cash advance 3','127.0.0.1','2026-06-12 08:41:54'),(53,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-12 08:48:52'),(54,1,'document_check','Client Documents','Updated client document 1 to approved','127.0.0.1','2026-06-12 09:15:55'),(55,1,'document_check','Client Documents','Updated client document 3 to submitted','127.0.0.1','2026-06-12 10:00:14'),(56,1,'document_check','Client Documents','Updated client document 4 to submitted','127.0.0.1','2026-06-12 10:00:18'),(57,1,'document_check','Client Documents','Updated client document 5 to submitted','127.0.0.1','2026-06-12 10:00:21'),(58,1,'document_check','Client Documents','Updated client document 6 to submitted','127.0.0.1','2026-06-12 10:00:23'),(59,1,'update','Settings','Updated system settings','127.0.0.1','2026-06-12 10:02:47'),(60,1,'update','Buyer Profile','Updated buyer profile for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:17'),(61,1,'update','Buyer Profile','Updated co-buyers for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:17'),(62,1,'update','Buyer Profile','Updated employment details for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:17'),(63,1,'update','Buyer Profile','Updated buyer profile for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:18'),(64,1,'update','Buyer Profile','Updated co-buyers for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:18'),(65,1,'update','Buyer Profile','Updated employment details for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:18'),(66,1,'update','Buyer Profile','Updated buyer profile for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:19'),(67,1,'update','Buyer Profile','Updated co-buyers for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:19'),(68,1,'update','Buyer Profile','Updated employment details for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:19'),(69,1,'update','Buyer Profile','Updated buyer profile for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:19'),(70,1,'update','Buyer Profile','Updated co-buyers for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:19'),(71,1,'update','Buyer Profile','Updated employment details for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:19'),(72,1,'update','Buyer Profile','Updated buyer profile for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:19'),(73,1,'update','Buyer Profile','Updated co-buyers for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:19'),(74,1,'update','Buyer Profile','Updated employment details for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:19'),(75,1,'update','Buyer Profile','Updated buyer profile for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:20'),(76,1,'update','Buyer Profile','Updated co-buyers for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:20'),(77,1,'update','Buyer Profile','Updated employment details for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:20'),(78,1,'update','Buyer Profile','Updated buyer profile for AQUINO, JAYMILYN BERNARDO','127.0.0.1','2026-06-13 06:48:20'),(79,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-13 07:09:05'),(80,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-13 07:09:05'),(81,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-13 07:09:45'),(82,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-13 07:09:45'),(83,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-13 07:10:57'),(84,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-13 07:10:57'),(85,1,'login','Auth','Admin User logged in','::1','2026-06-13 07:36:27'),(86,1,'hold','Commission Releases','Put release 5 on hold','127.0.0.1','2026-06-13 07:39:49'),(87,1,'unhold','Commission Releases','Restored release 5','127.0.0.1','2026-06-13 07:39:50'),(88,1,'hold','Commission Releases','Put release 5 on hold','127.0.0.1','2026-06-13 07:39:52'),(89,1,'hold','Commission Releases','Put release 10 on hold','127.0.0.1','2026-06-13 07:39:54'),(90,1,'unhold','Commission Releases','Restored release 5','127.0.0.1','2026-06-13 07:40:15'),(91,1,'unhold','Commission Releases','Restored release 10','127.0.0.1','2026-06-13 07:40:20'),(92,1,'hold','Commission Releases','Put release 10 on hold','127.0.0.1','2026-06-13 07:40:46'),(93,1,'unhold','Commission Releases','Restored release 10','127.0.0.1','2026-06-13 07:40:47'),(94,1,'release','Commission Releases','Marked release 5 as released','127.0.0.1','2026-06-13 07:41:19'),(95,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-13 08:04:44'),(96,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-13 08:04:44'),(97,1,'create','Users','Created user rgagfgdf and linked seller profile 3','127.0.0.1','2026-06-13 09:05:53'),(98,1,'create','Users','Created user PARROCHO, JOSEPH E. and linked seller profile 4','127.0.0.1','2026-06-13 09:07:02'),(99,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-13 09:09:28'),(100,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-13 09:09:28'),(101,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-13 09:09:31'),(102,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-13 09:09:31'),(103,1,'create','Client Documents','Created document checklist for client unit 1','127.0.0.1','2026-06-13 09:13:32'),(104,3,'login','Auth','PARROCHO, JOSEPH E. logged in','::1','2026-06-13 09:15:00'),(105,1,'login','Auth','Admin User logged in','::1','2026-06-13 09:15:21'),(106,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-13 09:16:22'),(107,1,'create','Users','Created user robert','127.0.0.1','2026-06-14 01:49:00'),(108,4,'login','Auth','robert logged in','::1','2026-06-14 01:49:33'),(109,4,'change_password','Auth','robert changed password','::1','2026-06-14 01:49:42'),(110,4,'login','Auth','robert logged in','::1','2026-06-14 01:49:56'),(111,1,'login','Auth','Admin User logged in','::1','2026-06-14 01:50:05');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_advance_deductions`
--

LOCK TABLES `cash_advance_deductions` WRITE;
/*!40000 ALTER TABLE `cash_advance_deductions` DISABLE KEYS */;
INSERT INTO `cash_advance_deductions` VALUES (1,1,7,1000.00,1,NULL,'2026-06-12 08:32:09'),(2,2,7,864.00,1,NULL,'2026-06-12 08:33:39'),(3,2,8,1864.00,1,NULL,'2026-06-12 08:33:49'),(4,2,9,272.00,1,NULL,'2026-06-12 08:33:53');
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
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cash_advances_seller_id` (`seller_id`),
  KEY `idx_cash_advances_client_unit_id` (`client_unit_id`),
  KEY `idx_cash_advances_commission_id` (`commission_id`),
  KEY `idx_cash_advances_status` (`status`),
  KEY `fk_cash_advances_approved_by` (`approved_by`),
  CONSTRAINT `fk_cash_advances_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_cash_advances_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`),
  CONSTRAINT `fk_cash_advances_commission` FOREIGN KEY (`commission_id`) REFERENCES `commissions` (`id`),
  CONSTRAINT `fk_cash_advances_seller` FOREIGN KEY (`seller_id`) REFERENCES `accredited_sellers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_advances`
--

LOCK TABLES `cash_advances` WRITE;
/*!40000 ALTER TABLE `cash_advances` DISABLE KEYS */;
INSERT INTO `cash_advances` VALUES (1,2,1,2,1000.00,0.00,'deducted','2026-06-12 00:00:00','2026-06-12 16:31:41',1,NULL,'2026-06-12 08:31:40','2026-06-12 08:32:09'),(2,2,1,2,3000.00,0.00,'deducted','2026-06-12 00:00:00','2026-06-12 16:33:18',1,NULL,'2026-06-12 08:33:17','2026-06-12 08:33:53'),(3,2,1,2,7000.00,7000.00,'approved','2026-06-12 00:00:00','2026-06-12 16:41:54',1,NULL,'2026-06-12 08:41:51','2026-06-12 08:41:54');
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
  CONSTRAINT `fk_client_buyers_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_buyers`
--

LOCK TABLES `client_buyers` WRITE;
/*!40000 ALTER TABLE `client_buyers` DISABLE KEYS */;
INSERT INTO `client_buyers` VALUES (2,1,'spouse','n/a',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-13 07:07:33','2026-06-13 07:07:33');
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
  `file_url` varchar(500) DEFAULT NULL,
  `storage_provider` enum('google_drive','local') DEFAULT 'google_drive',
  `drive_file_id` varchar(255) DEFAULT NULL,
  `drive_folder_id` varchar(255) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
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
  CONSTRAINT `fk_client_document_list_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_client_documents_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`),
  CONSTRAINT `fk_client_documents_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`),
  CONSTRAINT `fk_client_documents_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_document_list`
--

LOCK TABLES `client_document_list` WRITE;
/*!40000 ALTER TABLE `client_document_list` DISABLE KEYS */;
INSERT INTO `client_document_list` VALUES (1,1,1,NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'approved',1,'2026-06-12 17:15:55','2026-06-12 06:50:42','2026-06-12 09:15:55'),(2,1,2,NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'approved',1,'2026-06-12 16:14:31','2026-06-12 06:50:42','2026-06-12 08:14:31'),(3,1,3,NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'submitted',1,'2026-06-12 18:00:14','2026-06-12 06:50:42','2026-06-12 10:00:14'),(4,1,4,NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'submitted',1,'2026-06-12 18:00:18','2026-06-12 06:50:42','2026-06-12 10:00:18'),(5,1,5,NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'submitted',1,'2026-06-12 18:00:21','2026-06-12 06:50:42','2026-06-12 10:00:21'),(6,1,6,NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'submitted',1,'2026-06-12 18:00:23','2026-06-12 06:50:42','2026-06-12 10:00:23');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_employment_details`
--

LOCK TABLES `client_employment_details` WRITE;
/*!40000 ALTER TABLE `client_employment_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_employment_details` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_unit_form_prints`
--

LOCK TABLES `client_unit_form_prints` WRITE;
/*!40000 ALTER TABLE `client_unit_form_prints` DISABLE KEYS */;
INSERT INTO `client_unit_form_prints` VALUES (1,1,'statement_of_account',1,'2026-06-13 15:09:05',NULL),(2,1,'statement_of_account',1,'2026-06-13 15:09:05',NULL),(3,1,'offer_to_buy_buyers_profile',1,'2026-06-13 15:09:44',NULL),(4,1,'offer_to_buy_buyers_profile',1,'2026-06-13 15:09:45',NULL),(5,1,'offer_to_buy_buyers_profile',1,'2026-06-13 15:10:57',NULL),(6,1,'offer_to_buy_buyers_profile',1,'2026-06-13 15:10:57',NULL),(7,1,'statement_of_account',1,'2026-06-13 16:04:44',NULL),(8,1,'statement_of_account',1,'2026-06-13 16:04:44',NULL),(9,1,'statement_of_account',1,'2026-06-13 17:09:28',NULL),(10,1,'statement_of_account',1,'2026-06-13 17:09:28',NULL),(11,1,'offer_to_buy_buyers_profile',1,'2026-06-13 17:09:31',NULL),(12,1,'offer_to_buy_buyers_profile',1,'2026-06-13 17:09:31',NULL);
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
  `status` enum('reserved','active','cancelled','fully_paid','closed') NOT NULL DEFAULT 'reserved',
  `mode_of_payment` enum('cash','installment') NOT NULL DEFAULT 'installment',
  `balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `due_day` tinyint DEFAULT NULL,
  `starting_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `offer_purchase_price` decimal(15,2) DEFAULT NULL,
  `reservation_fee_amount` decimal(15,2) DEFAULT NULL,
  `downpayment_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `deferred_cash_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `offer_balance_amount` decimal(15,2) DEFAULT NULL,
  `payment_terms_months` int DEFAULT NULL,
  `interest_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `monthly_amortization` decimal(15,2) DEFAULT NULL,
  `contract_processing_status` enum('pending_profile','profile_complete','docs_complete','ready_for_contract','contract_signed') NOT NULL DEFAULT 'pending_profile',
  `last_doc_reminder_at` datetime DEFAULT NULL,
  `last_payment_reminder_at` datetime DEFAULT NULL,
  `soa_drive_file_id` varchar(255) DEFAULT NULL,
  `soa_file_name` varchar(255) DEFAULT NULL,
  `soa_generated_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_client_units_client` (`client_id`),
  KEY `fk_client_units_listing` (`listing_id`),
  KEY `fk_client_units_assigned_user` (`assigned_user_id`),
  KEY `idx_client_units_due_date` (`due_date`),
  KEY `idx_client_units_starting_date` (`starting_date`),
  KEY `idx_client_units_payment_terms` (`mode_of_payment`,`payment_terms_months`),
  KEY `idx_client_units_contract_processing_status` (`contract_processing_status`),
  KEY `idx_client_units_seller_id` (`seller_id`),
  CONSTRAINT `fk_client_units_assigned_user` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_client_units_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `fk_client_units_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`),
  CONSTRAINT `fk_client_units_seller` FOREIGN KEY (`seller_id`) REFERENCES `accredited_sellers` (`id`),
  CONSTRAINT `chk_due_day` CHECK ((`due_day` between 1 and 31))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_units`
--

LOCK TABLES `client_units` WRITE;
/*!40000 ALTER TABLE `client_units` DISABLE KEYS */;
INSERT INTO `client_units` VALUES (1,1,1,1,1,'fully_paid','installment',0.00,12,'2026-06-12',NULL,512600.00,50000.00,0.00,0.00,462600.00,36,0.00,12850.00,'pending_profile',NULL,NULL,NULL,NULL,NULL,'2026-06-12 06:31:49','2026-06-13 09:16:22');
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
INSERT INTO `clients` VALUES (1,'AQUINO, JAYMILYN BERNARDO','n/a','single',NULL,NULL,NULL,NULL,NULL,'jaymilynaquino011788@gmail.com','0997-419-7271',NULL,NULL,'incomplete','BACOOR, CAVITE','BACOOR, CAVITE',NULL,NULL,NULL,'REGION IV-A',1,'2026-06-12 06:28:09','2026-06-13 06:47:37');
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_releases`
--

LOCK TABLES `commission_releases` WRITE;
/*!40000 ALTER TABLE `commission_releases` DISABLE KEYS */;
INSERT INTO `commission_releases` VALUES (1,1,'1st_release',20.00,20.00,20.00,4660.00,0.00,4660.00,'released','2026-06-12 16:22:44',1,NULL,'2026-06-12 06:31:49','2026-06-12 08:22:44'),(2,1,'2nd_release',40.00,20.00,40.00,4660.00,0.00,4660.00,'eligible',NULL,NULL,NULL,'2026-06-12 06:31:49','2026-06-12 08:48:52'),(3,1,'3rd_release',60.00,20.00,60.00,4660.00,0.00,4660.00,'eligible',NULL,NULL,NULL,'2026-06-12 06:31:49','2026-06-12 08:48:52'),(4,1,'4th_release',75.00,15.00,75.00,3495.00,0.00,3495.00,'eligible',NULL,NULL,NULL,'2026-06-12 06:31:49','2026-06-12 08:48:52'),(5,1,'retention',NULL,25.00,100.00,5825.00,0.00,5825.00,'released','2026-06-13 15:41:19',1,NULL,'2026-06-12 06:31:49','2026-06-13 07:41:19'),(6,2,'1st_release',20.00,20.00,20.00,1864.00,0.00,1864.00,'eligible',NULL,NULL,NULL,'2026-06-12 06:31:49','2026-06-12 06:35:08'),(7,2,'2nd_release',40.00,20.00,40.00,1864.00,1864.00,0.00,'eligible',NULL,NULL,NULL,'2026-06-12 06:31:49','2026-06-12 08:48:52'),(8,2,'3rd_release',60.00,20.00,60.00,1864.00,1864.00,0.00,'eligible',NULL,NULL,NULL,'2026-06-12 06:31:49','2026-06-12 08:48:52'),(9,2,'4th_release',75.00,15.00,75.00,1398.00,272.00,1126.00,'eligible',NULL,NULL,NULL,'2026-06-12 06:31:49','2026-06-12 08:48:52'),(10,2,'retention',NULL,25.00,100.00,2330.00,0.00,2330.00,'eligible',NULL,NULL,NULL,'2026-06-12 06:31:49','2026-06-13 07:40:47');
/*!40000 ALTER TABLE `commission_releases` ENABLE KEYS */;
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
  `sale_type` enum('distributed','direct') NOT NULL DEFAULT 'distributed',
  `cash_kaliwaan_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `cash_kaliwaan_date` date DEFAULT NULL,
  `cash_kaliwaan_notes` text,
  `override_notes` text,
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `released_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','partially_released','released','cancelled','on_hold') NOT NULL DEFAULT 'active',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_commissions_client_unit` (`client_unit_id`),
  KEY `idx_commissions_seller` (`seller_id`),
  KEY `idx_commissions_source_type` (`source_type`),
  KEY `idx_commissions_status` (`status`),
  KEY `idx_commissions_parent` (`parent_commission_id`),
  KEY `idx_commissions_seller_id` (`seller_id`),
  CONSTRAINT `fk_commissions_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`),
  CONSTRAINT `fk_commissions_parent` FOREIGN KEY (`parent_commission_id`) REFERENCES `commissions` (`id`),
  CONSTRAINT `fk_commissions_seller` FOREIGN KEY (`seller_id`) REFERENCES `accredited_sellers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commissions`
--

LOCK TABLES `commissions` WRITE;
/*!40000 ALTER TABLE `commissions` DISABLE KEYS */;
INSERT INTO `commissions` VALUES (1,1,1,'agent',5.00,466000.00,23300.00,'main',NULL,'distributed',0.00,NULL,NULL,NULL,23300.00,10485.00,'partially_released','Auto-generated from reservation of LA-1602','2026-06-12 06:31:49','2026-06-13 07:41:19'),(2,1,2,'override',2.00,466000.00,9320.00,'override',1,'distributed',0.00,NULL,NULL,NULL,9320.00,0.00,'active','Optional override commission from reservation of LA-1602','2026-06-12 06:31:49','2026-06-12 06:31:49');
/*!40000 ALTER TABLE `commissions` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (1,'client registration form seller\'s copy',NULL,1,0,'active','2026-06-12 06:32:14','2026-06-12 06:32:14'),(2,'client registration form administrator copy',NULL,1,0,'active','2026-06-12 06:32:16','2026-06-12 06:32:16'),(3,'intent to buy',NULL,1,0,'active','2026-06-12 06:32:21','2026-06-12 06:32:21'),(4,'offer to buy & buyer\'s profile',NULL,1,0,'active','2026-06-12 06:32:24','2026-06-12 06:32:24'),(5,'reservation agreement',NULL,1,0,'active','2026-06-12 06:32:29','2026-06-12 06:32:29'),(6,'deed of sale',NULL,1,0,'active','2026-06-12 06:32:36','2026-06-12 06:32:36');
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
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
  `lot_type` varchar(100) DEFAULT NULL,
  `reservation_fee` decimal(15,2) NOT NULL DEFAULT '0.00',
  `price_per_sqm` decimal(15,2) NOT NULL DEFAULT '0.00',
  `lot_area_sqm` decimal(10,2) NOT NULL DEFAULT '0.00',
  `net_selling_price` decimal(15,2) GENERATED ALWAYS AS ((`lot_area_sqm` * `price_per_sqm`)) VIRTUAL,
  `legal_misc_rate` decimal(5,2) NOT NULL DEFAULT '10.00',
  `legal_misc_fee` decimal(15,2) GENERATED ALWAYS AS (((`lot_area_sqm` * `price_per_sqm`) * (`legal_misc_rate` / 100))) VIRTUAL,
  `total_contract_price` decimal(15,2) GENERATED ALWAYS AS (((`lot_area_sqm` * `price_per_sqm`) + ((`lot_area_sqm` * `price_per_sqm`) * (`legal_misc_rate` / 100)))) VIRTUAL,
  `status` enum('available','reserved','active','hold','sold','inactive') NOT NULL DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_listing_project_unit` (`project_id`,`unit_id`),
  CONSTRAINT `fk_listings_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listings`
--

LOCK TABLES `listings` WRITE;
/*!40000 ALTER TABLE `listings` DISABLE KEYS */;
INSERT INTO `listings` (`id`, `project_id`, `cadastral_lot_no`, `unit_id`, `lot_type`, `reservation_fee`, `price_per_sqm`, `lot_area_sqm`, `legal_misc_rate`, `status`, `created_at`, `updated_at`) VALUES (1,1,'1306','LA-1602','inner',50000.00,1000.00,466.00,10.00,'sold','2026-06-12 06:25:11','2026-06-12 08:48:52'),(2,1,'1306','LA-0315','inner',50000.00,1200.00,300.00,10.00,'available','2026-06-12 06:25:50','2026-06-12 06:25:50');
/*!40000 ALTER TABLE `listings` ENABLE KEYS */;
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
  `status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  `verified_by` int DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_payments_client_unit` (`client_unit_id`),
  KEY `fk_payments_verified_by` (`verified_by`),
  KEY `idx_payments_reference_id` (`reference_id`),
  CONSTRAINT `fk_payments_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`),
  CONSTRAINT `fk_payments_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,50000.00,'reservation_fee','cash',NULL,'2026-06-11','verified',1,'2026-06-12 14:33:13','2026-06-12 06:33:05','2026-06-12 06:33:13'),(2,1,150000.00,'downpayment','cash',NULL,'2026-06-12','verified',1,'2026-06-12 14:35:08','2026-06-12 06:35:08','2026-06-12 06:35:08'),(3,1,312600.00,'full_payment','cash',NULL,'2026-06-12','verified',1,'2026-06-12 16:48:52','2026-06-12 08:48:52','2026-06-12 08:48:52'),(4,1,50000.00,'monthly','bank_transfer','87654578','2026-06-13','verified',1,'2026-06-13 17:16:23','2026-06-13 09:16:22','2026-06-13 09:16:22');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
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
  `ended_at` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_projects_location_code` (`location_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'Bailen','Bailen, Cavite','LA','IMELDA B. VILLALOBOS','AA-06-0005-00105','022-06-0005-003-04','active',NULL,'2026-06-12 06:23:49','2026-06-13 06:04:57'),(2,'Maragondon','Maragondon, Cavite','PE','n/a','n/a','n/a','active',NULL,'2026-06-12 06:24:05','2026-06-13 06:04:57');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'company_name','D&C Prime Realty','2026-06-12 06:23:15','2026-06-12 06:23:15'),(2,'company_email','dcprime@gmail.com','2026-06-12 06:23:15','2026-06-12 06:23:15'),(3,'company_contact','09912698393','2026-06-12 06:23:15','2026-06-12 06:23:15'),(4,'company_address','Indang, Cavite','2026-06-12 06:23:15','2026-06-12 06:23:15'),(5,'default_reservation_fee','50000','2026-06-12 06:23:15','2026-06-12 06:23:15'),(6,'default_commission_rate','5','2026-06-12 06:23:15','2026-06-12 06:23:15'),(7,'system_status','active','2026-06-12 06:23:15','2026-06-12 06:23:15');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin User','admin@gmail.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','super_admin','active',0,'2026-06-14 09:50:05',NULL,NULL,'2026-06-12 06:23:15','2026-06-14 01:50:05'),(2,'rgagfgdf','add@gmail.com','$2b$10$0JYPbTn71VdT1LgF4zylWujx.JuoRZxVrjom.EczEsrn4mJGcxAyK','broker','active',0,NULL,NULL,NULL,'2026-06-13 09:05:53','2026-06-13 09:05:53'),(3,'PARROCHO, JOSEPH E.','joseph@gmail.com','$2b$10$589QjsTCKAZmsIrXBqUjZuWSNnvYYi3rikCPuvFENt8gDLEo1N.me','manager','active',0,'2026-06-13 17:15:00',NULL,NULL,'2026-06-13 09:07:02','2026-06-13 09:15:00'),(4,'robert','robertrenbysanjuan@gmail.com','$2b$10$KxBc/L6ZXZW9eashr9AIL.lfHr9P11m7.TACyvNw7x8rwebfqLlP2','admin','active',0,'2026-06-14 09:49:56','2026-06-14 09:49:00','2026-06-14 09:49:42','2026-06-14 01:48:57','2026-06-14 01:49:56');
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

-- Dump completed on 2026-06-14 10:03:48
