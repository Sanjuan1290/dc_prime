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
  CONSTRAINT `fk_accredited_sellers_parent` FOREIGN KEY (`parent_seller_id`) REFERENCES `accredited_sellers` (`id`),
  CONSTRAINT `fk_accredited_sellers_rate_set_by` FOREIGN KEY (`rate_set_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_accredited_sellers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accredited_sellers`
--

LOCK TABLES `accredited_sellers` WRITE;
/*!40000 ALTER TABLE `accredited_sellers` DISABLE KEYS */;
INSERT INTO `accredited_sellers` VALUES (1,3,'Rowena M. Cortez','rowena.cortez.bnm@test.com','09000000001','broker_network_manager',NULL,NULL,'active','2026-06-14','2026-06-15 06:34:15','2026-06-15 06:34:15',8.00,8.00,NULL,NULL,NULL,NULL,NULL,1,'2026-06-15 14:34:15'),(2,4,'Broker One Under Rowena','broker.one@test.com','09000000002','broker',1,NULL,'active','2026-06-14','2026-06-15 06:34:15','2026-06-15 06:34:15',7.00,7.00,NULL,NULL,NULL,NULL,NULL,1,'2026-06-15 14:34:15'),(3,5,'Manager One A','manager.one.a@test.com','09000000003','manager',2,NULL,'active','2026-06-14','2026-06-15 06:34:15','2026-06-15 06:34:15',6.00,NULL,6.00,NULL,NULL,NULL,NULL,1,'2026-06-15 14:34:15'),(4,6,'Agent One A1','agent.one.a1@test.com','09000000004','agent',3,NULL,'active','2026-06-14','2026-06-15 06:34:15','2026-06-15 06:34:15',5.00,NULL,5.00,NULL,5.00,NULL,NULL,1,'2026-06-15 14:34:15'),(5,7,'Broker Two Independent','broker.two@test.com','09000000005','broker',NULL,NULL,'active','2026-06-14','2026-06-15 06:34:15','2026-06-15 06:34:15',7.00,7.00,NULL,NULL,NULL,NULL,NULL,1,'2026-06-15 14:34:15'),(6,8,'Manager Two A','manager.two.a@test.com','09000000006','manager',5,NULL,'active','2026-06-13','2026-06-15 06:34:15','2026-06-15 06:34:15',6.00,NULL,6.00,NULL,NULL,NULL,NULL,1,'2026-06-15 14:34:15'),(7,9,'Agent Two A1','agent.two.a1@test.com','09000000007','agent',6,NULL,'active','2026-06-13','2026-06-15 06:34:15','2026-06-15 06:34:15',5.00,NULL,5.00,NULL,5.00,NULL,NULL,1,'2026-06-15 14:34:15');
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
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,3,'login','Auth','Rowena M. Cortez logged in','::1','2026-06-15 06:34:57'),(2,2,'login','Auth','Admin logged in','::1','2026-06-15 07:25:50'),(3,2,'update','Listings','Updated listing PE-1009','127.0.0.1','2026-06-15 07:42:47'),(4,2,'delete','Listings','Deleted listing PE-1009','127.0.0.1','2026-06-15 07:47:26'),(5,2,'create','Clients','Created client robert','127.0.0.1','2026-06-15 07:50:53'),(6,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:53:00'),(7,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 07:53:00'),(8,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 07:53:00'),(9,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:53:00'),(10,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:53:02'),(11,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 07:53:02'),(12,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 07:53:02'),(13,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:53:02'),(14,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:53:02'),(15,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 07:53:02'),(16,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 07:53:02'),(17,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:53:02'),(18,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:53:49'),(19,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 07:53:49'),(20,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 07:53:49'),(21,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:53:49'),(22,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:54:23'),(23,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 07:54:23'),(24,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 07:54:24'),(25,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:54:24'),(26,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:54:25'),(27,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 07:54:25'),(28,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 07:54:25'),(29,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:54:25'),(30,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:54:25'),(31,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 07:54:25'),(32,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 07:54:25'),(33,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:54:25'),(34,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:54:25'),(35,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 07:54:25'),(36,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 07:54:25'),(37,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:54:25'),(38,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:54:25'),(39,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 07:54:25'),(40,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 07:54:25'),(41,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 07:54:25'),(42,2,'update','Clients','Updated client robert','127.0.0.1','2026-06-15 07:54:48'),(43,2,'reserve','Client Units','Reserved LA-1001 for robert','127.0.0.1','2026-06-15 08:21:13'),(44,2,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-15 08:21:50'),(45,2,'update','Payments','Updated payment 1','127.0.0.1','2026-06-15 08:21:54'),(46,2,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-15 08:22:15'),(47,2,'create','Cash Advances','Created cash advance for Agent One A1','127.0.0.1','2026-06-15 08:25:02'),(48,1,'login','Auth','Super Admin logged in','::1','2026-06-15 08:25:15'),(49,1,'approve','Cash Advances','Approved cash advance 1','127.0.0.1','2026-06-15 08:25:28'),(50,1,'deduct','Cash Advances','Automatically deducted cash advance 1','127.0.0.1','2026-06-15 08:25:32'),(51,1,'create','Cash Advances','Created cash advance for Rowena M. Cortez','127.0.0.1','2026-06-15 08:27:21'),(52,1,'approve','Cash Advances','Approved cash advance 2','127.0.0.1','2026-06-15 08:27:22'),(53,1,'deduct','Cash Advances','Automatically deducted cash advance 2','127.0.0.1','2026-06-15 08:27:23'),(54,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 08:30:10'),(55,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 08:30:10'),(56,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 08:30:10'),(57,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 08:30:10'),(58,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 08:30:55'),(59,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 08:30:55'),(60,1,'update','Payments','Updated payment 1','127.0.0.1','2026-06-15 08:31:08'),(61,1,'update','Payments','Updated payment 2','127.0.0.1','2026-06-15 08:31:14'),(62,1,'update','Payments','Updated payment 2','127.0.0.1','2026-06-15 08:31:23'),(63,1,'update','Payments','Updated payment 1','127.0.0.1','2026-06-15 08:31:27'),(64,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 08:31:30'),(65,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 08:31:30'),(66,1,'update','Payments','Updated payment 2','127.0.0.1','2026-06-15 08:31:47'),(67,1,'update','Payments','Updated payment 2','127.0.0.1','2026-06-15 08:31:50'),(68,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 08:31:54'),(69,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 08:31:54'),(70,1,'update','Payments','Updated payment 1','127.0.0.1','2026-06-15 08:32:02'),(71,1,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 08:34:50'),(72,1,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 08:34:50'),(73,1,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 08:34:50'),(74,1,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 08:34:50'),(75,1,'update','Payments','Updated payment 2','127.0.0.1','2026-06-15 08:38:12'),(76,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 08:38:14'),(77,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 08:38:14'),(78,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 08:39:02'),(79,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 08:39:02'),(80,1,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-15 08:58:53'),(81,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 08:58:56'),(82,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 08:58:56'),(83,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 08:58:58'),(84,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 08:58:58');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_advance_deductions`
--

LOCK TABLES `cash_advance_deductions` WRITE;
/*!40000 ALTER TABLE `cash_advance_deductions` DISABLE KEYS */;
INSERT INTO `cash_advance_deductions` VALUES (1,1,1,3000.00,1,'Automatic deduction from Cash Advance #1','2026-06-15 08:25:32'),(2,2,16,500.00,1,'Automatic deduction from Cash Advance #2','2026-06-15 08:27:23');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_advances`
--

LOCK TABLES `cash_advances` WRITE;
/*!40000 ALTER TABLE `cash_advances` DISABLE KEYS */;
INSERT INTO `cash_advances` VALUES (1,4,1,NULL,3000.00,0.00,'deducted','2026-06-15 16:25:03','2026-06-15 16:25:28',1,'2026-06-15 16:25:32',NULL,NULL,NULL,'2026-06-15 08:25:02','2026-06-15 08:25:32'),(2,1,1,NULL,500.00,0.00,'deducted','2026-06-15 16:27:21','2026-06-15 16:27:22',1,'2026-06-15 16:27:23',NULL,NULL,NULL,'2026-06-15 08:27:21','2026-06-15 08:27:23');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_buyers`
--

LOCK TABLES `client_buyers` WRITE;
/*!40000 ALTER TABLE `client_buyers` DISABLE KEYS */;
INSERT INTO `client_buyers` VALUES (2,1,1,'spouse','nick','2002-03-07','honk kong','filipino','male','single','dgsdgd','3233','ggdg','3423','0965754656','435654654','fgdh@gmail.com','6536-45634-45634-0000','2026-06-15 08:58:53','2026-06-15 08:58:53');
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
  KEY `idx_client_document_list_is_required` (`is_required`),
  CONSTRAINT `fk_client_document_list_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_client_documents_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`),
  CONSTRAINT `fk_client_documents_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`),
  CONSTRAINT `fk_client_documents_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_document_list`
--

LOCK TABLES `client_document_list` WRITE;
/*!40000 ALTER TABLE `client_document_list` DISABLE KEYS */;
INSERT INTO `client_document_list` VALUES (1,1,1,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(2,1,2,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(3,1,3,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(4,1,4,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(5,1,5,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(6,1,6,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(7,1,7,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(8,1,8,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(9,1,9,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(10,1,10,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(11,1,11,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(12,1,12,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(13,1,13,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(14,1,14,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(15,1,15,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(16,1,16,0,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(17,1,17,0,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(18,1,18,0,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(19,1,19,0,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(20,1,20,0,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13');
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_employment_details`
--

LOCK TABLES `client_employment_details` WRITE;
/*!40000 ALTER TABLE `client_employment_details` DISABLE KEYS */;
INSERT INTO `client_employment_details` VALUES (7,1,NULL,'principal','employed_private',NULL,'dfadf','gdrrr34h',NULL,'dfa',NULL,43343.00,'2026-06-15 08:34:50','2026-06-15 08:34:50'),(8,1,2,'co_buyer','employed_private',NULL,'jolibbee','hongkong','2342','restaurant','cook',80000.00,'2026-06-15 08:58:53','2026-06-15 08:58:53');
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_unit_form_prints`
--

LOCK TABLES `client_unit_form_prints` WRITE;
/*!40000 ALTER TABLE `client_unit_form_prints` DISABLE KEYS */;
INSERT INTO `client_unit_form_prints` VALUES (1,1,'statement_of_account',1,'2026-06-15 16:30:10',NULL),(2,1,'statement_of_account',1,'2026-06-15 16:30:10',NULL),(3,1,'offer_to_buy_buyers_profile',1,'2026-06-15 16:30:10',NULL),(4,1,'offer_to_buy_buyers_profile',1,'2026-06-15 16:30:10',NULL),(5,1,'statement_of_account',1,'2026-06-15 16:30:55',NULL),(6,1,'statement_of_account',1,'2026-06-15 16:30:55',NULL),(7,1,'statement_of_account',1,'2026-06-15 16:31:30',NULL),(8,1,'statement_of_account',1,'2026-06-15 16:31:30',NULL),(9,1,'statement_of_account',1,'2026-06-15 16:31:54',NULL),(10,1,'statement_of_account',1,'2026-06-15 16:31:54',NULL),(11,1,'statement_of_account',1,'2026-06-15 16:38:14',NULL),(12,1,'statement_of_account',1,'2026-06-15 16:38:14',NULL),(13,1,'offer_to_buy_buyers_profile',1,'2026-06-15 16:39:02',NULL),(14,1,'offer_to_buy_buyers_profile',1,'2026-06-15 16:39:02',NULL),(15,1,'offer_to_buy_buyers_profile',1,'2026-06-15 16:58:56',NULL),(16,1,'offer_to_buy_buyers_profile',1,'2026-06-15 16:58:56',NULL),(17,1,'statement_of_account',1,'2026-06-15 16:58:58',NULL),(18,1,'statement_of_account',1,'2026-06-15 16:58:58',NULL);
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
  `soa_file_name` varchar(255) DEFAULT NULL,
  `soa_generated_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sale_type` varchar(50) NOT NULL DEFAULT 'distributed',
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
INSERT INTO `client_units` VALUES (1,1,1,2,4,'active','installment','spouses',616155.00,22,'2026-06-15','2026-06-22',858000.00,50000.00,191845.00,30.00,1,7.50,15555.00,191845.00,0.00,616155.00,36,0.00,17115.42,'pending_profile',NULL,NULL,NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:22:15','distributed');
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
INSERT INTO `clients` VALUES (1,'robert','nick','single','2005-01-12','imus ','Filipino','male','single','robertrenbysanjuan@gmail.com','09043434543',NULL,'456345-6546345-634-00','complete','GEN TRI','GEN TRI','4107',NULL,NULL,'REGION 4A',4,'2026-06-15 07:50:53','2026-06-15 08:34:50');
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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_releases`
--

LOCK TABLES `commission_releases` WRITE;
/*!40000 ALTER TABLE `commission_releases` DISABLE KEYS */;
INSERT INTO `commission_releases` VALUES (1,1,'1st_release',20.00,20.00,20.00,7800.00,3000.00,4800.00,'eligible',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:25:32'),(2,1,'2nd_release',40.00,20.00,40.00,7800.00,0.00,7800.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(3,1,'3rd_release',60.00,20.00,60.00,7800.00,0.00,7800.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(4,1,'4th_release',75.00,15.00,75.00,5850.00,0.00,5850.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(5,1,'retention',NULL,25.00,100.00,9750.00,0.00,9750.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(6,2,'1st_release',20.00,20.00,20.00,1560.00,0.00,1560.00,'eligible',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:22:15'),(7,2,'2nd_release',40.00,20.00,40.00,1560.00,0.00,1560.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(8,2,'3rd_release',60.00,20.00,60.00,1560.00,0.00,1560.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(9,2,'4th_release',75.00,15.00,75.00,1170.00,0.00,1170.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(10,2,'retention',NULL,25.00,100.00,1950.00,0.00,1950.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(11,3,'1st_release',20.00,20.00,20.00,1560.00,0.00,1560.00,'eligible',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:22:15'),(12,3,'2nd_release',40.00,20.00,40.00,1560.00,0.00,1560.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(13,3,'3rd_release',60.00,20.00,60.00,1560.00,0.00,1560.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(14,3,'4th_release',75.00,15.00,75.00,1170.00,0.00,1170.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(15,3,'retention',NULL,25.00,100.00,1950.00,0.00,1950.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(16,4,'1st_release',20.00,20.00,20.00,1560.00,500.00,1060.00,'eligible',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:27:23'),(17,4,'2nd_release',40.00,20.00,40.00,1560.00,0.00,1560.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(18,4,'3rd_release',60.00,20.00,60.00,1560.00,0.00,1560.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(19,4,'4th_release',75.00,15.00,75.00,1170.00,0.00,1170.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13'),(20,4,'retention',NULL,25.00,100.00,1950.00,0.00,1950.00,'pending',NULL,NULL,NULL,'2026-06-15 08:21:13','2026-06-15 08:21:13');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_role_defaults`
--

LOCK TABLES `commission_role_defaults` WRITE;
/*!40000 ALTER TABLE `commission_role_defaults` DISABLE KEYS */;
INSERT INTO `commission_role_defaults` VALUES (1,'bnm_pool_rate','Broker Network Manager Pool Rate','broker_network_manager','pool',8.00,1,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(2,'broker_pool_rate','Broker Pool Rate','broker','pool',7.00,1,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(3,'manager_personal_rate','Manager Personal Rate','manager','personal',6.00,1,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(4,'agent_personal_rate','Agent Personal Rate','agent','personal',5.00,1,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(5,'direct_to_developer_rate','Direct to Developer Rate','agent','direct_to_developer',5.00,1,'2026-06-15 06:34:15','2026-06-15 06:34:15');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commissions`
--

LOCK TABLES `commissions` WRITE;
/*!40000 ALTER TABLE `commissions` DISABLE KEYS */;
INSERT INTO `commissions` VALUES (1,1,4,'agent',5.00,780000.00,39000.00,'main',NULL,'distributed',0.00,NULL,NULL,NULL,0.00,'active','Auto-generated hierarchy commission from reservation of LA-1001','2026-06-15 08:21:13','2026-06-15 08:21:13'),(2,1,3,'manager',1.00,780000.00,7800.00,'override',1,'distributed',0.00,NULL,NULL,'Manager residual release milestone',0.00,'active','Auto-generated hierarchy commission from reservation of LA-1001','2026-06-15 08:21:13','2026-06-15 08:21:13'),(3,1,2,'broker',1.00,780000.00,7800.00,'override',1,'distributed',0.00,NULL,NULL,'Broker residual release milestone',0.00,'active','Auto-generated hierarchy commission from reservation of LA-1001','2026-06-15 08:21:13','2026-06-15 08:21:13'),(4,1,1,'broker_network_manager',1.00,780000.00,7800.00,'override',1,'distributed',0.00,NULL,NULL,'Broker Network Manager residual release milestone',0.00,'active','Auto-generated hierarchy commission from reservation of LA-1001','2026-06-15 08:21:13','2026-06-15 08:21:13');
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
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_template_items`
--

LOCK TABLES `document_template_items` WRITE;
/*!40000 ALTER TABLE `document_template_items` DISABLE KEYS */;
INSERT INTO `document_template_items` VALUES (1,1,1,1,'active',1,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(2,1,2,1,'active',2,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(3,1,3,1,'active',3,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(4,1,4,1,'active',4,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(5,1,5,1,'active',5,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(6,1,6,1,'active',6,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(7,1,7,1,'active',7,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(8,1,8,1,'active',8,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(9,1,9,1,'active',9,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(10,1,10,1,'active',10,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(11,1,11,1,'active',11,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(12,1,12,1,'active',12,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(13,1,13,1,'active',13,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(14,1,14,1,'active',14,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(15,1,15,1,'active',15,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(16,1,16,0,'active',16,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(17,1,17,0,'active',17,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(18,1,18,0,'active',18,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(19,1,19,0,'active',19,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(20,1,20,0,'active',20,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(32,2,6,1,'active',6,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(33,2,7,1,'active',7,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(34,2,8,1,'active',8,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(35,2,9,1,'active',9,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(36,2,10,1,'active',10,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(37,2,11,1,'active',11,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(38,2,12,1,'active',12,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(39,2,20,0,'active',20,'2026-06-15 06:34:15','2026-06-15 06:34:15');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_templates`
--

LOCK TABLES `document_templates` WRITE;
/*!40000 ALTER TABLE `document_templates` DISABLE KEYS */;
INSERT INTO `document_templates` VALUES (1,'Default Buyer Requirements','Standard buyer/client checklist used for most project reservations.','active',1,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(2,'Legal and Closing Requirements','Additional documents normally needed for contract, title, and closing stages.','active',1,'2026-06-15 06:34:15','2026-06-15 06:34:15');
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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (1,'Client Registration Form - Seller Copy','Seller copy of the buyer registration form.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(2,'Client Registration Form - Administrator Copy','Administrator copy of the buyer registration form.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(3,'Intent to Buy','Signed statement showing buyer intent to purchase the selected unit.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(4,'Offer to Buy and Buyer Profile','Offer to buy form with buyer personal/profile information.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(5,'Reservation Agreement','Signed reservation agreement for the selected unit.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(6,'Deed of Absolute Sale','Final deed used after full payment or closing requirements.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(7,'Contract to Sell','Contract to sell document after reservation and payment terms are finalized.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(8,'Counselling and Acknowledgement','Buyer counselling and acknowledgement form.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(9,'Cancellation Waiver','Cancellation waiver signed by buyer when applicable.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(10,'Buyer Acknowledgement','Buyer acknowledgement document.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(11,'SPA to Process Title','Special Power of Attorney to process title.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(12,'SPA Authorization to Sign','Special Power of Attorney authorizing representative to sign.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(13,'Two Valid Government IDs','Clear copies of two valid government-issued IDs.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(14,'TIN ID or BIR TIN Verification','Tax identification document or TIN verification record.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(15,'PSA Birth Certificate','PSA-issued birth certificate.',1,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(16,'Marriage Certificate','Marriage certificate for married buyers.',0,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(17,'Spouse Valid ID','Valid ID of spouse when applicable.',0,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(18,'CENOMAR','Certificate of No Marriage for single buyers when required.',0,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(19,'Passport','Passport copy when applicable.',0,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(20,'Principal and Representative IDs','IDs of principal buyer and representative when applicable.',0,1,'active','2026-06-15 06:34:15','2026-06-15 06:34:15');
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
) ENGINE=InnoDB AUTO_INCREMENT=201 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_document_requirements`
--

LOCK TABLES `listing_document_requirements` WRITE;
/*!40000 ALTER TABLE `listing_document_requirements` DISABLE KEYS */;
INSERT INTO `listing_document_requirements` VALUES (1,1,1,1,'active',1,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(2,1,2,1,'active',2,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(3,1,3,1,'active',3,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(4,1,4,1,'active',4,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(5,1,5,1,'active',5,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(6,1,6,1,'active',6,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(7,1,7,1,'active',7,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(8,1,8,1,'active',8,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(9,1,9,1,'active',9,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(10,1,10,1,'active',10,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(11,1,11,1,'active',11,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(12,1,12,1,'active',12,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(13,1,13,1,'active',13,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(14,1,14,1,'active',14,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(15,1,15,1,'active',15,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(16,1,16,0,'active',16,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(17,1,17,0,'active',17,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(18,1,18,0,'active',18,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(19,1,19,0,'active',19,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(20,1,20,0,'active',20,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(21,2,1,1,'active',1,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(22,2,2,1,'active',2,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(23,2,3,1,'active',3,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(24,2,4,1,'active',4,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(25,2,5,1,'active',5,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(26,2,6,1,'active',6,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(27,2,7,1,'active',7,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(28,2,8,1,'active',8,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(29,2,9,1,'active',9,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(30,2,10,1,'active',10,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(31,2,11,1,'active',11,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(32,2,12,1,'active',12,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(33,2,13,1,'active',13,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(34,2,14,1,'active',14,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(35,2,15,1,'active',15,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(36,2,16,0,'active',16,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(37,2,17,0,'active',17,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(38,2,18,0,'active',18,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(39,2,19,0,'active',19,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(40,2,20,0,'active',20,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(41,3,1,1,'active',1,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(42,3,2,1,'active',2,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(43,3,3,1,'active',3,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(44,3,4,1,'active',4,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(45,3,5,1,'active',5,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(46,3,6,1,'active',6,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(47,3,7,1,'active',7,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(48,3,8,1,'active',8,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(49,3,9,1,'active',9,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(50,3,10,1,'active',10,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(51,3,11,1,'active',11,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(52,3,12,1,'active',12,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(53,3,13,1,'active',13,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(54,3,14,1,'active',14,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(55,3,15,1,'active',15,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(56,3,16,0,'active',16,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(57,3,17,0,'active',17,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(58,3,18,0,'active',18,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(59,3,19,0,'active',19,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(60,3,20,0,'active',20,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(61,4,1,1,'active',1,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(62,4,2,1,'active',2,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(63,4,3,1,'active',3,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(64,4,4,1,'active',4,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(65,4,5,1,'active',5,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(66,4,6,1,'active',6,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(67,4,7,1,'active',7,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(68,4,8,1,'active',8,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(69,4,9,1,'active',9,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(70,4,10,1,'active',10,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(71,4,11,1,'active',11,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(72,4,12,1,'active',12,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(73,4,13,1,'active',13,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(74,4,14,1,'active',14,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(75,4,15,1,'active',15,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(76,4,16,0,'active',16,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(77,4,17,0,'active',17,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(78,4,18,0,'active',18,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(79,4,19,0,'active',19,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(80,4,20,0,'active',20,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(81,5,1,1,'active',1,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(82,5,2,1,'active',2,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(83,5,3,1,'active',3,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(84,5,4,1,'active',4,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(85,5,5,1,'active',5,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(86,5,6,1,'active',6,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(87,5,7,1,'active',7,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(88,5,8,1,'active',8,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(89,5,9,1,'active',9,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(90,5,10,1,'active',10,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(91,5,11,1,'active',11,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(92,5,12,1,'active',12,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(93,5,13,1,'active',13,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(94,5,14,1,'active',14,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(95,5,15,1,'active',15,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(96,5,16,0,'active',16,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(97,5,17,0,'active',17,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(98,5,18,0,'active',18,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(99,5,19,0,'active',19,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(100,5,20,0,'active',20,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(101,6,1,1,'active',1,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(102,6,2,1,'active',2,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(103,6,3,1,'active',3,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(104,6,4,1,'active',4,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(105,6,5,1,'active',5,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(106,6,6,1,'active',6,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(107,6,7,1,'active',7,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(108,6,8,1,'active',8,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(109,6,9,1,'active',9,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(110,6,10,1,'active',10,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(111,6,11,1,'active',11,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(112,6,12,1,'active',12,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(113,6,13,1,'active',13,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(114,6,14,1,'active',14,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(115,6,15,1,'active',15,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(116,6,16,0,'active',16,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(117,6,17,0,'active',17,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(118,6,18,0,'active',18,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(119,6,19,0,'active',19,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(120,6,20,0,'active',20,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(121,7,1,1,'active',1,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(122,7,2,1,'active',2,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(123,7,3,1,'active',3,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(124,7,4,1,'active',4,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(125,7,5,1,'active',5,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(126,7,6,1,'active',6,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(127,7,7,1,'active',7,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(128,7,8,1,'active',8,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(129,7,9,1,'active',9,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(130,7,10,1,'active',10,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(131,7,11,1,'active',11,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(132,7,12,1,'active',12,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(133,7,13,1,'active',13,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(134,7,14,1,'active',14,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(135,7,15,1,'active',15,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(136,7,16,0,'active',16,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(137,7,17,0,'active',17,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(138,7,18,0,'active',18,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(139,7,19,0,'active',19,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(140,7,20,0,'active',20,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(141,8,1,1,'active',1,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(142,8,2,1,'active',2,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(143,8,3,1,'active',3,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(144,8,4,1,'active',4,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(145,8,5,1,'active',5,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(146,8,6,1,'active',6,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(147,8,7,1,'active',7,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(148,8,8,1,'active',8,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(149,8,9,1,'active',9,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(150,8,10,1,'active',10,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(151,8,11,1,'active',11,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(152,8,12,1,'active',12,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(153,8,13,1,'active',13,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(154,8,14,1,'active',14,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(155,8,15,1,'active',15,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(156,8,16,0,'active',16,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(157,8,17,0,'active',17,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(158,8,18,0,'active',18,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(159,8,19,0,'active',19,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(160,8,20,0,'active',20,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(161,9,1,1,'active',1,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(162,9,2,1,'active',2,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(163,9,3,1,'active',3,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(164,9,4,1,'active',4,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(165,9,5,1,'active',5,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(166,9,6,1,'active',6,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(167,9,7,1,'active',7,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(168,9,8,1,'active',8,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(169,9,9,1,'active',9,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(170,9,10,1,'active',10,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(171,9,11,1,'active',11,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(172,9,12,1,'active',12,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(173,9,13,1,'active',13,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(174,9,14,1,'active',14,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(175,9,15,1,'active',15,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(176,9,16,0,'active',16,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(177,9,17,0,'active',17,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(178,9,18,0,'active',18,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(179,9,19,0,'active',19,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15'),(180,9,20,0,'active',20,'project_default','2026-06-15 06:34:15','2026-06-15 06:34:15');
/*!40000 ALTER TABLE `listing_document_requirements` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listings`
--

LOCK TABLES `listings` WRITE;
/*!40000 ALTER TABLE `listings` DISABLE KEYS */;
INSERT INTO `listings` (`id`, `project_id`, `cadastral_lot_no`, `unit_id`, `lot_type`, `reservation_fee`, `price_per_sqm`, `lot_area_sqm`, `legal_misc_rate`, `status`, `created_at`, `updated_at`) VALUES (1,1,'1306','LA-1001','inner',50000.00,2600.00,300.00,10.00,'active','2026-06-15 06:34:15','2026-06-15 08:22:15'),(2,1,'1306','LA-1002','inner',50000.00,2600.00,300.00,10.00,'available','2026-06-15 06:34:15','2026-06-15 06:34:15'),(3,1,'1306','LA-1003','corner',50000.00,2700.00,350.00,10.00,'available','2026-06-15 06:34:15','2026-06-15 06:34:15'),(4,1,'1306','LA-1004','end',50000.00,2600.00,300.00,10.00,'available','2026-06-15 06:34:15','2026-06-15 06:34:15'),(5,1,'1306','LA-1005','inner',50000.00,2500.00,400.00,10.00,'available','2026-06-15 06:34:15','2026-06-15 06:34:15'),(6,2,'2201','PE-1001','inner',50000.00,2200.00,300.00,10.00,'available','2026-06-15 06:34:15','2026-06-15 06:34:15'),(7,2,'2201','PE-1002','corner',50000.00,2300.00,350.00,10.00,'available','2026-06-15 06:34:15','2026-06-15 06:34:15'),(8,2,'2201','PE-1003','end',50000.00,2200.00,300.00,10.00,'available','2026-06-15 06:34:15','2026-06-15 06:34:15'),(9,2,'2202','PE-1004','inner',50000.00,2100.00,400.00,10.00,'available','2026-06-15 06:34:15','2026-06-15 06:34:15');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,50000.00,'reservation_fee','cash',NULL,'2026-06-15','verified',2,'2026-06-15 16:21:54','2026-06-15 08:21:50','2026-06-15 08:32:02'),(2,1,191845.00,'downpayment','bank_transfer','dfasdfsdfd','2026-06-15','verified',2,'2026-06-15 16:22:15','2026-06-15 08:22:15','2026-06-15 08:31:47');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_document_requirements`
--

LOCK TABLES `project_document_requirements` WRITE;
/*!40000 ALTER TABLE `project_document_requirements` DISABLE KEYS */;
INSERT INTO `project_document_requirements` VALUES (1,2,1,1,'active',1,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(2,1,1,1,'active',1,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(3,2,2,1,'active',2,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(4,1,2,1,'active',2,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(5,2,3,1,'active',3,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(6,1,3,1,'active',3,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(7,2,4,1,'active',4,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(8,1,4,1,'active',4,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(9,2,5,1,'active',5,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(10,1,5,1,'active',5,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(11,2,6,1,'active',6,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(12,1,6,1,'active',6,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(13,2,7,1,'active',7,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(14,1,7,1,'active',7,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(15,2,8,1,'active',8,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(16,1,8,1,'active',8,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(17,2,9,1,'active',9,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(18,1,9,1,'active',9,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(19,2,10,1,'active',10,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(20,1,10,1,'active',10,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(21,2,11,1,'active',11,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(22,1,11,1,'active',11,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(23,2,12,1,'active',12,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(24,1,12,1,'active',12,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(25,2,13,1,'active',13,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(26,1,13,1,'active',13,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(27,2,14,1,'active',14,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(28,1,14,1,'active',14,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(29,2,15,1,'active',15,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(30,1,15,1,'active',15,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(31,2,16,0,'active',16,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(32,1,16,0,'active',16,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(33,2,17,0,'active',17,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(34,1,17,0,'active',17,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(35,2,18,0,'active',18,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(36,1,18,0,'active',18,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(37,2,19,0,'active',19,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(38,1,19,0,'active',19,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(39,2,20,0,'active',20,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(40,1,20,0,'active',20,'2026-06-15 06:34:15','2026-06-15 06:34:15');
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
INSERT INTO `projects` VALUES (1,'Bailen','Bailen, Cavite','LA','IMELDA B. VILLALOBOS','AA-06-0005-00105','022-06-0005-003-04','active',1,NULL,'2026-06-15 06:34:15','2026-06-15 06:34:15'),(2,'Maragondon','Maragondon, Cavite','PE','SANTOS S. VILLAMOR','AA-06-0125-02105','023-05-0025-013-04','active',1,NULL,'2026-06-15 06:34:15','2026-06-15 06:34:15');
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
INSERT INTO `settings` VALUES (1,'company_name','D&C Prime Realty','2026-06-15 06:34:15','2026-06-15 06:34:15'),(2,'company_email','dcprime@gmail.com','2026-06-15 06:34:15','2026-06-15 06:34:15'),(3,'company_contact','09436532220','2026-06-15 06:34:15','2026-06-15 06:34:15'),(4,'company_address','Indang, Cavite','2026-06-15 06:34:15','2026-06-15 06:34:15'),(5,'system_status','active','2026-06-15 06:34:15','2026-06-15 06:34:15'),(6,'reservation_contact_name','Admin','2026-06-15 06:34:15','2026-06-15 06:34:15'),(7,'reservation_contact_email','admin@gmail.com','2026-06-15 06:34:15','2026-06-15 06:34:15'),(8,'reservation_contact_no','09055432543','2026-06-15 06:34:15','2026-06-15 06:34:15');
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','superadmin@gmail.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','super_admin','active',0,'2026-06-15 16:25:15',NULL,'2026-06-14 14:48:38','2026-06-13 22:48:38','2026-06-15 08:25:15'),(2,'Admin','admin@gmail.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','admin','active',0,'2026-06-15 15:25:50',NULL,'2026-06-14 14:48:38','2026-06-13 22:48:38','2026-06-15 07:25:50'),(3,'Rowena M. Cortez','rowena.cortez.bnm@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker_network_manager','active',0,'2026-06-15 14:34:57',NULL,'2026-06-14 14:48:38','2026-06-13 22:48:38','2026-06-15 06:34:57'),(4,'Broker One Under Rowena','broker.one@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,NULL,NULL,'2026-06-14 14:48:38','2026-06-13 22:48:38','2026-06-13 22:48:38'),(5,'Manager One A','manager.one.a@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-14 14:48:38','2026-06-13 22:48:38','2026-06-13 22:48:38'),(6,'Agent One A1','agent.one.a1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-14 14:48:38','2026-06-13 22:48:38','2026-06-13 22:48:38'),(7,'Broker Two Independent','broker.two@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,NULL,NULL,'2026-06-14 14:48:38','2026-06-13 22:48:38','2026-06-13 22:48:38'),(8,'Manager Two A','manager.two.a@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-14 14:48:38','2026-06-13 22:48:38','2026-06-13 22:48:38'),(9,'Agent Two A1','agent.two.a1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-14 14:48:38','2026-06-13 22:48:38','2026-06-13 22:48:38');
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

-- Dump completed on 2026-06-15 17:04:46
