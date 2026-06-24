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
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accredited_sellers`
--

LOCK TABLES `accredited_sellers` WRITE;
/*!40000 ALTER TABLE `accredited_sellers` DISABLE KEYS */;
INSERT INTO `accredited_sellers` VALUES (1,3,'Prime North BNM','prime.north.bnm@test.com','09010000001','broker_network_manager',NULL,1,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',8.00,8.00,8.00,1.00,NULL,NULL,NULL,1,'2026-06-22 17:13:31'),(2,4,'Prime North Broker One','prime.north.broker1@test.com','09010000002','broker',1,1,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,8.00,5.00,1.00,NULL,NULL,NULL,1,'2026-06-22 17:13:31'),(3,5,'Prime North Broker Two','prime.north.broker2@test.com','09010000003','broker',1,1,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,8.00,5.00,1.00,NULL,NULL,NULL,1,'2026-06-22 17:13:31'),(4,6,'Prime North Manager One','prime.north.manager1@test.com','09010000004','manager',2,1,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,8.00,5.00,1.00,NULL,NULL,NULL,1,'2026-06-22 17:13:31'),(5,7,'Prime North Manager Two','prime.north.manager2@test.com','09010000005','manager',3,1,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,8.00,5.00,1.00,NULL,NULL,NULL,1,'2026-06-22 17:13:31'),(6,8,'Prime North Agent One','prime.north.agent1@test.com','09010000006','agent',4,1,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,8.00,5.00,0.00,5.00,NULL,NULL,1,'2026-06-22 17:13:31'),(7,9,'Prime North Agent Two','prime.north.agent2@test.com','09010000007','agent',4,1,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,8.00,5.00,0.00,5.00,NULL,NULL,1,'2026-06-22 17:13:31'),(8,10,'Prime North Agent Three','prime.north.agent3@test.com','09010000008','agent',5,1,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,8.00,5.00,0.00,5.00,NULL,NULL,1,'2026-06-22 17:13:31'),(9,11,'Prime North Agent Four','prime.north.agent4@test.com','09010000009','agent',5,1,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,8.00,5.00,0.00,5.00,NULL,NULL,1,'2026-06-22 17:13:31'),(10,12,'Cavite Realty BNM','cavite.realty.bnm@test.com','09020000001','broker_network_manager',NULL,2,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:16:54',8.00,8.00,8.00,1.00,NULL,NULL,NULL,1,'2026-06-22 17:16:54'),(11,13,'Cavite Realty Broker One','cavite.realty.broker1@test.com','09020000002','broker',10,2,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:16:54',7.00,8.00,7.00,1.00,NULL,NULL,NULL,1,'2026-06-22 17:16:54'),(12,14,'Cavite Realty Broker Two','cavite.realty.broker2@test.com','09020000003','broker',10,2,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:16:54',7.00,8.00,7.00,1.00,NULL,NULL,NULL,1,'2026-06-22 17:16:54'),(13,15,'Cavite Realty Manager One','cavite.realty.manager1@test.com','09020000004','manager',11,2,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:16:54',6.00,8.00,6.00,1.00,NULL,NULL,NULL,1,'2026-06-22 17:16:54'),(14,16,'Cavite Realty Manager Two','cavite.realty.manager2@test.com','09020000005','manager',12,2,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:16:54',6.00,8.00,6.00,1.00,NULL,NULL,NULL,1,'2026-06-22 17:16:54'),(15,17,'Cavite Realty Agent One','cavite.realty.agent1@test.com','09020000006','agent',13,2,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:16:54',5.00,8.00,5.00,0.00,5.00,NULL,NULL,1,'2026-06-22 17:16:54'),(16,18,'Cavite Realty Agent Two','cavite.realty.agent2@test.com','09020000007','agent',13,2,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:16:54',5.00,8.00,5.00,0.00,5.00,NULL,NULL,1,'2026-06-22 17:16:54'),(17,19,'Cavite Realty Agent Three','cavite.realty.agent3@test.com','09020000008','agent',14,2,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:16:54',5.00,8.00,5.00,0.00,5.00,NULL,NULL,1,'2026-06-22 17:16:54'),(18,20,'Cavite Realty Agent Four','cavite.realty.agent4@test.com','09020000009','agent',14,2,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:16:54',5.00,8.00,5.00,0.00,5.00,NULL,NULL,1,'2026-06-22 17:16:54'),(19,21,'D&C Inhouse BNM','inhouse.bnm@test.com','09030000001','broker_network_manager',NULL,3,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',7.50,7.50,7.50,0.75,NULL,NULL,NULL,1,'2026-06-22 17:13:31'),(20,22,'D&C Inhouse Broker One','inhouse.broker1@test.com','09030000002','broker',19,3,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,7.50,5.00,0.75,NULL,NULL,NULL,1,'2026-06-22 17:13:31'),(21,23,'D&C Inhouse Broker Two','inhouse.broker2@test.com','09030000003','broker',19,3,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,7.50,5.00,0.75,NULL,NULL,NULL,1,'2026-06-22 17:13:31'),(22,24,'D&C Inhouse Manager One','inhouse.manager1@test.com','09030000004','manager',20,3,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,7.50,5.00,1.00,NULL,NULL,NULL,1,'2026-06-22 17:13:31'),(23,25,'D&C Inhouse Manager Two','inhouse.manager2@test.com','09030000005','manager',21,3,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,7.50,5.00,1.00,NULL,NULL,NULL,1,'2026-06-22 17:13:31'),(24,26,'D&C Inhouse Agent One','inhouse.agent1@test.com','09030000006','agent',22,3,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,7.50,5.00,0.00,5.00,NULL,NULL,1,'2026-06-22 17:13:31'),(25,27,'D&C Inhouse Agent Two','inhouse.agent2@test.com','09030000007','agent',22,3,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,7.50,5.00,0.00,5.00,NULL,NULL,1,'2026-06-22 17:13:31'),(26,28,'D&C Inhouse Agent Three','inhouse.agent3@test.com','09030000008','agent',23,3,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,7.50,5.00,0.00,5.00,NULL,NULL,1,'2026-06-22 17:13:31'),(27,29,'D&C Inhouse Agent Four','inhouse.agent4@test.com','09030000009','agent',23,3,NULL,'active','2026-06-22','2026-06-22 09:13:31','2026-06-22 09:13:31',5.00,7.50,5.00,0.00,5.00,NULL,NULL,1,'2026-06-22 17:13:31');
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
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'reset_seed','Database','Reset database while keeping documents and projects. Seeded users, seller groups, clients, and sample listings.','127.0.0.1','2026-06-22 09:13:31'),(2,1,'update','Seller Groups','Updated seller group Cavite Realty Partners','127.0.0.1','2026-06-22 09:16:54'),(3,3,'login','Auth','Prime North BNM logged in','::1','2026-06-22 09:17:04'),(4,1,'login','Auth','Super Admin logged in','::1','2026-06-22 09:17:27'),(5,1,'delete','Document Templates','Deleted document template sample temp 2','127.0.0.1','2026-06-22 09:17:48'),(6,1,'delete','Document Templates','Deleted document template sample temp 1','127.0.0.1','2026-06-22 09:17:49'),(7,1,'update','Buyer Profile','Updated buyer profile for Katrina Mendoza','127.0.0.1','2026-06-22 09:23:06'),(8,1,'update','Buyer Profile','Updated co-buyers for Katrina Mendoza','127.0.0.1','2026-06-22 09:23:06'),(9,1,'update','Buyer Profile','Updated employment details for Katrina Mendoza','127.0.0.1','2026-06-22 09:23:06'),(10,1,'update','Buyer Profile','Updated buyer profile for Katrina Mendoza','127.0.0.1','2026-06-22 09:23:07'),(11,1,'reserve','Client Units','Reserved LA-0009 for Katrina Mendoza','127.0.0.1','2026-06-22 09:35:48'),(12,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-22 09:35:54'),(13,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-22 09:35:54'),(14,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-22 09:35:54'),(15,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-22 09:35:54'),(16,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-22 09:36:56'),(17,1,'update','Payments','Updated payment 1','127.0.0.1','2026-06-22 09:36:59'),(18,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-22 09:41:56'),(19,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-22 09:42:06'),(20,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-22 09:42:33'),(21,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-22 09:43:23'),(22,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-22 09:44:15'),(23,1,'reserve','Client Units','Reserved LA-0005 for Katrina Mendoza','127.0.0.1','2026-06-22 10:20:20'),(24,1,'print','Client Forms','Printed statement_of_account for client unit 2','127.0.0.1','2026-06-22 10:20:24'),(25,1,'print','Client Forms','Printed statement_of_account for client unit 2','127.0.0.1','2026-06-22 10:20:24'),(26,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-22 10:20:42'),(27,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-22 10:20:42'),(28,1,'start_cancellation','Client Units','Started cancellation review for client unit 2: cacel','127.0.0.1','2026-06-22 10:21:59'),(29,1,'approve_cancellation_settlement','Client Units','Approved cancellation settlement for client unit 2: refund 0, discontinued 0','127.0.0.1','2026-06-22 10:22:17'),(30,1,'clear_for_resale','Client Units','Cleared client unit 2 listing for resale','127.0.0.1','2026-06-22 10:22:29'),(31,1,'update','Client Units','Updated client unit 2','127.0.0.1','2026-06-22 10:22:51');
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
) ENGINE=InnoDB AUTO_INCREMENT=188 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_document_list`
--

LOCK TABLES `client_document_list` WRITE;
/*!40000 ALTER TABLE `client_document_list` DISABLE KEYS */;
INSERT INTO `client_document_list` VALUES (1,1,2,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-22 09:35:48'),(2,1,3,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-22 09:35:48'),(3,1,4,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-22 09:35:48'),(4,1,5,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-22 09:35:48'),(5,1,6,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-22 09:35:48'),(6,1,7,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-22 09:35:48'),(7,1,8,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-22 09:35:48'),(8,1,9,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-22 09:35:48'),(9,1,1,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-22 09:35:48'),(178,2,1,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:20:20'),(179,2,2,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:20:20'),(180,2,3,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:20:20'),(181,2,4,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:20:20'),(182,2,5,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:20:20'),(183,2,6,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:20:20'),(184,2,7,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:20:20'),(185,2,8,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:20:20'),(186,2,9,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:20:20');
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
INSERT INTO `client_employment_details` VALUES (1,6,NULL,'principal','employed_private',NULL,'D&C Prime','Indang, Cavite','4016','Real Estate','Manager',45000.00,'2026-06-22 09:23:06','2026-06-22 09:23:06');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_unit_cancellation_settlements`
--

LOCK TABLES `client_unit_cancellation_settlements` WRITE;
/*!40000 ALTER TABLE `client_unit_cancellation_settlements` DISABLE KEYS */;
INSERT INTO `client_unit_cancellation_settlements` VALUES (1,2,6,5,0.00,0.00,0.00,'discontinued','settled','cacel',NULL,1,'2026-06-22 18:22:17',NULL,NULL,1,'2026-06-22 18:22:29','2026-06-22 10:21:59','2026-06-22 10:22:29');
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_unit_form_prints`
--

LOCK TABLES `client_unit_form_prints` WRITE;
/*!40000 ALTER TABLE `client_unit_form_prints` DISABLE KEYS */;
INSERT INTO `client_unit_form_prints` VALUES (1,1,'statement_of_account',1,'2026-06-22 17:35:54',NULL),(2,1,'statement_of_account',1,'2026-06-22 17:35:54',NULL),(3,1,'offer_to_buy_buyers_profile',1,'2026-06-22 17:35:54',NULL),(4,1,'offer_to_buy_buyers_profile',1,'2026-06-22 17:35:54',NULL),(5,2,'statement_of_account',1,'2026-06-22 18:20:24',NULL),(6,2,'statement_of_account',1,'2026-06-22 18:20:24',NULL),(7,1,'statement_of_account',1,'2026-06-22 18:20:42',NULL),(8,1,'statement_of_account',1,'2026-06-22 18:20:42',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_units`
--

LOCK TABLES `client_units` WRITE;
/*!40000 ALTER TABLE `client_units` DISABLE KEYS */;
INSERT INTO `client_units` VALUES (1,6,9,1,25,'active','installment','single',761176.04,22,'2026-06-22','2026-06-22',1144000.00,50000.00,293200.00,30.00,3,0.00,0.00,293200.00,0.00,800800.00,36,11.50,19811.98,'pending_profile',NULL,NULL,NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:44:15','distributed',200000.00,NULL,'apply_to_next_due','none',NULL,NULL,0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,3,'D&C Inhouse Sellers',7.50,5.00,0.75,0.75,1.00,'[object Object]',NULL,NULL),(2,6,5,1,25,'closed','installment','single',500500.00,22,'2026-06-22','2026-06-22',715000.00,50000.00,164500.00,30.00,3,0.00,0.00,164500.00,0.00,500500.00,36,11.50,9909.29,'pending_profile',NULL,NULL,NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:51','distributed',200000.00,NULL,'apply_to_next_due','settled','2026-06-22','discontinued',0.00,0.00,0.00,'cacel',1,'2026-06-22',NULL,'2026-06-22 18:22:29',1,3,'D&C Inhouse Sellers',7.50,5.00,0.75,0.75,1.00,'[object Object]',NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (1,'Juan Dela Cruz',NULL,'single','1996-01-15','Cavite','Filipino','male','single','juan.delacruz@test.com','09170000001',NULL,'123-456-789-000','complete','General Trias, Cavite','General Trias, Cavite','4107','General Trias, Cavite','4107','REGION 4A',6,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(2,'Maria Santos',NULL,'single','1998-04-22','Cavite','Filipino','female','single','maria.santos@test.com','09170000002',NULL,'123-456-789-001','complete','Naic, Cavite','Naic, Cavite','4110','Naic, Cavite','4110','REGION 4A',7,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(3,'Pedro Reyes',NULL,'spouses','1992-07-09','Cavite','Filipino','male','married','pedro.reyes@test.com','09170000003',NULL,'123-456-789-002','incomplete','Tanza, Cavite','Tanza, Cavite','4108','Tanza, Cavite','4108','REGION 4A',15,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(4,'Anna Cruz',NULL,'single','1999-10-31','Cavite','Filipino','female','single','anna.cruz@test.com','09170000004',NULL,'123-456-789-003','incomplete','Bailen, Cavite','Bailen, Cavite','4124','Bailen, Cavite','4124','REGION 4A',16,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(5,'Roberto Lim and Co.',NULL,'and_account','1990-03-12','Cavite','Filipino','male','married','roberto.lim@test.com','09170000005',NULL,'123-456-789-004','complete','Maragondon, Cavite','Maragondon, Cavite','4112','Maragondon, Cavite','4112','REGION 4A',24,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(6,'Katrina Mendoza',NULL,'single','2000-11-05','Cavite','Filipino','female','single','katrina.mendoza@test.com','09170000006',NULL,'123-456-789-005','complete','Indang, Cavite','Indang, Cavite','4122','Indang, Cavite','4122','REGION 4A',25,'2026-06-22 09:13:31','2026-06-22 09:13:31');
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
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_releases`
--

LOCK TABLES `commission_releases` WRITE;
/*!40000 ALTER TABLE `commission_releases` DISABLE KEYS */;
INSERT INTO `commission_releases` VALUES (1,1,'1st_release',20.00,20.00,20.00,10400.00,0.00,10400.00,'eligible',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:42:06'),(2,1,'2nd_release',40.00,20.00,40.00,10400.00,0.00,10400.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(3,1,'3rd_release',60.00,20.00,60.00,10400.00,0.00,10400.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(4,1,'4th_release',75.00,15.00,75.00,7800.00,0.00,7800.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(5,1,'retention',NULL,25.00,100.00,13000.00,0.00,13000.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(6,2,'1st_release',20.00,20.00,20.00,1560.00,0.00,1560.00,'eligible',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:42:06'),(7,2,'2nd_release',40.00,20.00,40.00,1560.00,0.00,1560.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(8,2,'3rd_release',60.00,20.00,60.00,1560.00,0.00,1560.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(9,2,'4th_release',75.00,15.00,75.00,1170.00,0.00,1170.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(10,2,'retention',NULL,25.00,100.00,1950.00,0.00,1950.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(11,3,'1st_release',20.00,20.00,20.00,2080.00,0.00,2080.00,'eligible',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:42:06'),(12,3,'2nd_release',40.00,20.00,40.00,2080.00,0.00,2080.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(13,3,'3rd_release',60.00,20.00,60.00,2080.00,0.00,2080.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(14,3,'4th_release',75.00,15.00,75.00,1560.00,0.00,1560.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(15,3,'retention',NULL,25.00,100.00,2600.00,0.00,2600.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(16,4,'1st_release',20.00,20.00,20.00,1560.00,0.00,1560.00,'eligible',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:42:06'),(17,4,'2nd_release',40.00,20.00,40.00,1560.00,0.00,1560.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(18,4,'3rd_release',60.00,20.00,60.00,1560.00,0.00,1560.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(19,4,'4th_release',75.00,15.00,75.00,1170.00,0.00,1170.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(20,4,'retention',NULL,25.00,100.00,1950.00,0.00,1950.00,'pending',NULL,NULL,NULL,'2026-06-22 09:35:48','2026-06-22 09:35:48'),(21,5,'1st_release',20.00,20.00,20.00,6500.00,0.00,6500.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(22,5,'2nd_release',40.00,20.00,40.00,6500.00,0.00,6500.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(23,5,'3rd_release',60.00,20.00,60.00,6500.00,0.00,6500.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(24,5,'4th_release',75.00,15.00,75.00,4875.00,0.00,4875.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(25,5,'retention',NULL,25.00,100.00,8125.00,0.00,8125.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(26,6,'1st_release',20.00,20.00,20.00,975.00,0.00,975.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(27,6,'2nd_release',40.00,20.00,40.00,975.00,0.00,975.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(28,6,'3rd_release',60.00,20.00,60.00,975.00,0.00,975.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(29,6,'4th_release',75.00,15.00,75.00,731.25,0.00,731.25,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(30,6,'retention',NULL,25.00,100.00,1218.75,0.00,1218.75,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(31,7,'1st_release',20.00,20.00,20.00,1300.00,0.00,1300.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(32,7,'2nd_release',40.00,20.00,40.00,1300.00,0.00,1300.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(33,7,'3rd_release',60.00,20.00,60.00,1300.00,0.00,1300.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(34,7,'4th_release',75.00,15.00,75.00,975.00,0.00,975.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(35,7,'retention',NULL,25.00,100.00,1625.00,0.00,1625.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(36,8,'1st_release',20.00,20.00,20.00,975.00,0.00,975.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(37,8,'2nd_release',40.00,20.00,40.00,975.00,0.00,975.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(38,8,'3rd_release',60.00,20.00,60.00,975.00,0.00,975.00,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(39,8,'4th_release',75.00,15.00,75.00,731.25,0.00,731.25,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17'),(40,8,'retention',NULL,25.00,100.00,1218.75,0.00,1218.75,'cancelled',NULL,NULL,NULL,'2026-06-22 10:20:20','2026-06-22 10:22:17');
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_role_defaults`
--

LOCK TABLES `commission_role_defaults` WRITE;
/*!40000 ALTER TABLE `commission_role_defaults` DISABLE KEYS */;
INSERT INTO `commission_role_defaults` VALUES (1,'bnm_pool_rate','Broker Network Manager Pool Rate','broker_network_manager','pool',8.00,1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(2,'broker_pool_rate','Broker Pool Rate','broker','pool',5.00,1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(3,'manager_personal_rate','Manager Personal Rate','manager','personal',5.00,1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(4,'agent_personal_rate','Agent Personal Rate','agent','personal',5.00,1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(5,'direct_to_developer_rate','Direct to Developer Rate','agent','direct_to_developer',5.00,1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(6,'bnm_override_rate','BNM Override Rate','broker_network_manager','override',1.00,1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(7,'broker_override_rate','Broker Override Rate','broker','override',1.00,1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(8,'manager_override_rate','Manager Override Rate','manager','override',1.00,1,'2026-06-22 09:13:31','2026-06-22 09:13:31');
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commissions`
--

LOCK TABLES `commissions` WRITE;
/*!40000 ALTER TABLE `commissions` DISABLE KEYS */;
INSERT INTO `commissions` VALUES (1,1,25,'agent',5.00,1040000.00,52000.00,'main',NULL,'distributed',0.00,NULL,NULL,NULL,0.00,'active','Auto-generated hierarchy commission from reservation of LA-0009','2026-06-22 09:35:48','2026-06-22 09:35:48',NULL),(2,1,20,'broker',0.75,1040000.00,7800.00,'override',1,'distributed',0.00,NULL,NULL,'broker allocation for agent sale',0.00,'active','Auto-generated hierarchy commission from reservation of LA-0009','2026-06-22 09:35:48','2026-06-22 09:35:48',NULL),(3,1,22,'manager',1.00,1040000.00,10400.00,'override',1,'distributed',0.00,NULL,NULL,'manager allocation for agent sale',0.00,'active','Auto-generated hierarchy commission from reservation of LA-0009','2026-06-22 09:35:48','2026-06-22 09:35:48',NULL),(4,1,19,'broker_network_manager',0.75,1040000.00,7800.00,'override',1,'distributed',0.00,NULL,NULL,'broker network manager allocation for agent sale',0.00,'active','Auto-generated hierarchy commission from reservation of LA-0009','2026-06-22 09:35:48','2026-06-22 09:35:48',NULL),(5,2,25,'agent',5.00,650000.00,32500.00,'main',NULL,'distributed',0.00,NULL,NULL,NULL,0.00,'cancelled','Auto-generated hierarchy commission from reservation of LA-0005','2026-06-22 10:20:20','2026-06-22 10:22:17',NULL),(6,2,20,'broker',0.75,650000.00,4875.00,'override',5,'distributed',0.00,NULL,NULL,'broker allocation for agent sale',0.00,'cancelled','Auto-generated hierarchy commission from reservation of LA-0005','2026-06-22 10:20:20','2026-06-22 10:22:17',NULL),(7,2,22,'manager',1.00,650000.00,6500.00,'override',5,'distributed',0.00,NULL,NULL,'manager allocation for agent sale',0.00,'cancelled','Auto-generated hierarchy commission from reservation of LA-0005','2026-06-22 10:20:20','2026-06-22 10:22:17',NULL),(8,2,19,'broker_network_manager',0.75,650000.00,4875.00,'override',5,'distributed',0.00,NULL,NULL,'broker network manager allocation for agent sale',0.00,'cancelled','Auto-generated hierarchy commission from reservation of LA-0005','2026-06-22 10:20:20','2026-06-22 10:22:17',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_template_items`
--

LOCK TABLES `document_template_items` WRITE;
/*!40000 ALTER TABLE `document_template_items` DISABLE KEYS */;
INSERT INTO `document_template_items` VALUES (10,9,3,1,'active',4,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(11,8,3,1,'active',4,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(12,7,3,1,'active',4,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(13,6,3,1,'active',4,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(14,5,3,1,'active',4,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(15,4,3,1,'active',4,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(16,3,3,1,'active',4,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(17,9,4,1,'active',5,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(18,8,4,1,'active',5,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(19,7,4,1,'active',5,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(20,6,4,1,'active',5,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(21,5,4,1,'active',5,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(22,4,4,1,'active',5,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(23,3,4,1,'active',5,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(24,9,5,1,'active',6,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(25,8,5,1,'active',6,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(26,7,5,1,'active',6,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(27,6,5,1,'active',6,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(28,5,5,1,'active',6,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(29,4,5,1,'active',6,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(30,3,5,1,'active',6,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(31,9,6,1,'active',7,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(32,8,6,1,'active',7,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(33,7,6,1,'active',7,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(34,6,6,1,'active',7,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(35,5,6,1,'active',7,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(36,4,6,1,'active',7,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(37,3,6,1,'active',7,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(38,9,7,1,'active',8,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(39,8,7,1,'active',8,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(40,7,7,1,'active',8,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(41,6,7,1,'active',8,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(42,5,7,1,'active',8,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(43,4,7,1,'active',8,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(44,3,7,1,'active',8,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(45,9,8,1,'active',9,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(46,8,8,1,'active',9,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(47,7,8,1,'active',9,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(48,6,8,1,'active',9,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(49,5,8,1,'active',9,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(50,4,8,1,'active',9,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(51,3,8,1,'active',9,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(52,9,9,1,'active',11,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(53,8,9,1,'active',11,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(54,7,9,1,'active',11,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(55,6,9,1,'active',11,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(56,5,9,1,'active',11,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(57,4,9,1,'active',11,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(58,3,9,1,'active',11,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(59,9,10,1,'active',1,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(60,8,10,1,'active',1,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(61,7,10,1,'active',1,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(62,6,10,1,'active',1,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(63,5,10,1,'active',1,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(64,4,10,1,'active',1,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(65,3,10,1,'active',1,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(66,9,11,1,'active',2,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(67,8,11,1,'active',2,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(68,7,11,1,'active',2,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(69,6,11,1,'active',2,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(70,5,11,1,'active',2,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(71,4,11,1,'active',2,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(72,3,11,1,'active',2,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(73,9,12,1,'active',3,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(74,8,12,1,'active',3,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(75,7,12,1,'active',3,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(76,6,12,1,'active',3,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(77,5,12,1,'active',3,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(78,4,12,1,'active',3,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(79,3,12,1,'active',3,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(80,9,13,1,'active',10,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(81,8,13,1,'active',10,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(82,7,13,1,'active',10,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(83,6,13,1,'active',10,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(84,5,13,1,'active',10,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(85,4,13,1,'active',10,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(86,3,13,1,'active',10,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(87,8,14,1,'active',14,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(88,6,14,1,'active',14,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(89,8,15,1,'active',15,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(90,7,15,1,'active',14,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(91,9,16,1,'active',12,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(92,8,16,1,'active',12,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(93,7,16,1,'active',12,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(94,6,16,1,'active',12,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(95,5,16,1,'active',12,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(96,4,16,1,'active',12,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(97,3,16,1,'active',12,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(98,9,17,1,'active',13,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(99,8,17,1,'active',13,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(100,7,17,1,'active',13,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(101,6,17,1,'active',13,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(102,5,17,1,'active',13,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(103,4,17,1,'active',13,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(104,3,17,1,'active',13,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(105,4,18,1,'active',14,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(106,5,19,1,'active',14,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(107,5,20,1,'active',15,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(108,5,21,1,'active',16,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(109,9,22,1,'active',14,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(110,8,23,1,'active',16,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(111,6,23,1,'active',15,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(112,8,24,1,'active',17,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(113,7,24,1,'active',15,'2026-06-22 03:04:35','2026-06-22 03:04:35');
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_templates`
--

LOCK TABLES `document_templates` WRITE;
/*!40000 ALTER TABLE `document_templates` DISABLE KEYS */;
INSERT INTO `document_templates` VALUES (3,'Standard Buyer Checklist','Default checklist for regular buyer accounts','active',1,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(4,'Single Buyer Checklist','Checklist for single buyers','active',1,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(5,'Married Buyer Checklist','Checklist for married buyers','active',1,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(6,'OFW Buyer Checklist','Checklist for OFW buyers','active',1,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(7,'Representative Checklist','Checklist for buyers represented by another person','active',1,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(8,'OFW Representative Checklist','Checklist for OFW buyers with representative','active',1,'2026-06-22 03:04:35','2026-06-22 03:04:35'),(9,'Buyer With Children But Not Married Checklist','Checklist for buyer with children but not married','active',1,'2026-06-22 03:04:35','2026-06-22 03:04:35');
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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (1,'client registration form seller\'s copy',NULL,0,1,'active','2026-06-17 03:40:37','2026-06-17 03:40:37'),(2,'client registration form administrator copy',NULL,0,1,'active','2026-06-17 03:40:41','2026-06-17 03:40:41'),(3,'intent to buy','Intent to buy document',1,0,'active','2026-06-17 03:40:54','2026-06-22 03:04:35'),(4,'offer to buy & buyer\'s profile','Offer to buy and buyer profile document',1,1,'active','2026-06-17 03:41:00','2026-06-22 03:04:35'),(5,'reservation agreement','Reservation agreement document',1,0,'active','2026-06-17 03:41:04','2026-06-22 03:04:35'),(6,'deed of sale','Deed of sale document',1,0,'active','2026-06-17 03:41:09','2026-06-22 03:04:35'),(7,'contract to sell','Contract to sell document',1,0,'active','2026-06-17 03:41:15','2026-06-22 03:04:35'),(8,'buyer counselling and acknowledgement form','Buyer counselling and acknowledgement form',1,1,'active','2026-06-17 03:41:20','2026-06-22 03:04:35'),(9,'buyer acknowledgement form','Buyer acknowledgement form',1,1,'active','2026-06-17 03:41:33','2026-06-22 03:04:35'),(10,'Client Registration Form - Seller\'s Copy','Client registration form seller copy',1,1,'active','2026-06-22 03:04:35','2026-06-22 03:04:35'),(11,'Client Registration Form - Administrator Copy','Client registration form administrator copy',1,1,'active','2026-06-22 03:04:35','2026-06-22 03:04:35'),(12,'Buyer\'s Information Form','Buyer information form',1,1,'active','2026-06-22 03:04:35','2026-06-22 03:04:35'),(13,'Voluntary Cancellation and Waiver of Rights','Cancellation and waiver of rights form',1,0,'active','2026-06-22 03:04:35','2026-06-22 03:04:35'),(14,'SPA to Process Title (for Company)','Required for OFW or company processing title',1,1,'active','2026-06-22 03:04:35','2026-06-22 03:04:35'),(15,'SPA Authorization to Sign (for Representative)','Required if buyer has representative signing documents',1,1,'active','2026-06-22 03:04:35','2026-06-22 03:04:35'),(16,'Two valid Government-issued IDs with 3 specimen signatures','Required government IDs with specimen signatures',1,1,'active','2026-06-22 03:04:35','2026-06-22 03:04:35'),(17,'TIN No. / TIN ID','Tax identification number or TIN ID',1,1,'active','2026-06-22 03:04:35','2026-06-22 03:04:35'),(18,'PSA Birth Certificate (Single)','PSA document for single buyer',1,1,'active','2026-06-22 03:04:35','2026-06-22 03:04:35'),(19,'Marriage Certificate','Required for married clients',1,1,'active','2026-06-22 03:04:35','2026-06-22 03:04:35'),(20,'Valid ID of Spouse with 3 specimen signatures','Required spouse ID with specimen signatures',1,1,'active','2026-06-22 03:04:35','2026-06-22 03:04:35'),(21,'Spouse Signature when required','Spouse signature requirement when applicable',1,1,'active','2026-06-22 03:04:35','2026-06-22 03:04:35'),(22,'CENOMAR if buyer has kids but not married','Certificate of no marriage record when applicable',1,1,'active','2026-06-22 03:04:35','2026-06-22 03:04:35'),(23,'Passport ID','Required for OFW or representative cases',1,1,'active','2026-06-22 03:04:35','2026-06-22 03:04:35'),(24,'Valid IDs of both Principal and Representative','Required IDs for principal and representative',1,1,'active','2026-06-22 03:04:35','2026-06-22 03:04:35');
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
) ENGINE=InnoDB AUTO_INCREMENT=217 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_document_requirements`
--

LOCK TABLES `listing_document_requirements` WRITE;
/*!40000 ALTER TABLE `listing_document_requirements` DISABLE KEYS */;
INSERT INTO `listing_document_requirements` VALUES (1,1,1,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(2,2,1,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(3,3,1,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(4,4,1,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(5,5,1,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(6,6,1,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(7,7,1,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(8,8,1,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(9,9,1,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(10,10,1,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(11,11,1,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(12,12,1,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(13,1,2,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(14,2,2,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(15,3,2,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(16,4,2,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(17,5,2,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(18,6,2,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(19,7,2,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(20,8,2,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(21,9,2,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(22,10,2,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(23,11,2,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(24,12,2,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(25,1,3,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(26,2,3,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(27,3,3,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(28,4,3,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(29,5,3,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(30,6,3,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(31,7,3,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(32,8,3,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(33,9,3,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(34,10,3,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(35,11,3,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(36,12,3,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(37,1,4,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(38,2,4,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(39,3,4,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(40,4,4,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(41,5,4,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(42,6,4,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(43,7,4,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(44,8,4,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(45,9,4,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(46,10,4,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(47,11,4,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(48,12,4,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(49,1,5,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(50,2,5,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(51,3,5,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(52,4,5,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(53,5,5,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(54,6,5,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(55,7,5,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(56,8,5,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(57,9,5,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(58,10,5,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(59,11,5,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(60,12,5,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(61,1,6,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(62,2,6,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(63,3,6,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(64,4,6,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(65,5,6,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(66,6,6,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(67,7,6,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(68,8,6,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(69,9,6,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(70,10,6,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(71,11,6,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(72,12,6,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(73,1,7,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(74,2,7,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(75,3,7,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(76,4,7,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(77,5,7,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(78,6,7,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(79,7,7,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(80,8,7,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(81,9,7,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(82,10,7,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(83,11,7,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(84,12,7,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(85,1,8,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(86,2,8,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(87,3,8,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(88,4,8,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(89,5,8,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(90,6,8,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(91,7,8,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(92,8,8,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(93,9,8,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(94,10,8,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(95,11,8,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(96,12,8,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(97,1,9,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(98,2,9,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(99,3,9,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(100,4,9,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(101,5,9,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(102,6,9,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(103,7,9,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(104,8,9,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(105,9,9,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(106,10,9,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(107,11,9,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(108,12,9,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(109,13,2,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(110,14,2,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(111,15,2,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(112,16,2,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(113,17,2,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(114,18,2,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(115,19,2,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(116,20,2,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(117,21,2,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(118,22,2,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(119,23,2,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(120,24,2,1,'active',1,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(121,13,4,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(122,14,4,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(123,15,4,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(124,16,4,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(125,17,4,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(126,18,4,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(127,19,4,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(128,20,4,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(129,21,4,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(130,22,4,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(131,23,4,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(132,24,4,1,'active',2,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(133,13,6,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(134,14,6,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(135,15,6,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(136,16,6,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(137,17,6,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(138,18,6,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(139,19,6,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(140,20,6,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(141,21,6,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(142,22,6,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(143,23,6,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(144,24,6,1,'active',3,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(145,13,8,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(146,14,8,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(147,15,8,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(148,16,8,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(149,17,8,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(150,18,8,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(151,19,8,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(152,20,8,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(153,21,8,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(154,22,8,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(155,23,8,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(156,24,8,1,'active',4,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(157,13,9,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(158,14,9,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(159,15,9,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(160,16,9,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(161,17,9,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(162,18,9,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(163,19,9,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(164,20,9,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(165,21,9,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(166,22,9,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(167,23,9,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(168,24,9,1,'active',5,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(169,13,1,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(170,14,1,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(171,15,1,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(172,16,1,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(173,17,1,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(174,18,1,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(175,19,1,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(176,20,1,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(177,21,1,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(178,22,1,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(179,23,1,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(180,24,1,1,'active',6,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(181,13,3,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(182,14,3,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(183,15,3,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(184,16,3,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(185,17,3,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(186,18,3,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(187,19,3,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(188,20,3,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(189,21,3,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(190,22,3,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(191,23,3,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(192,24,3,1,'active',7,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(193,13,5,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(194,14,5,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(195,15,5,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(196,16,5,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(197,17,5,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(198,18,5,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(199,19,5,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(200,20,5,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(201,21,5,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(202,22,5,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(203,23,5,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(204,24,5,1,'active',8,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(205,13,7,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(206,14,7,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(207,15,7,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(208,16,7,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(209,17,7,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(210,18,7,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(211,19,7,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(212,20,7,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(213,21,7,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(214,22,7,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(215,23,7,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31'),(216,24,7,1,'active',9,'project_default','2026-06-22 09:13:31','2026-06-22 09:13:31');
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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listings`
--

LOCK TABLES `listings` WRITE;
/*!40000 ALTER TABLE `listings` DISABLE KEYS */;
INSERT INTO `listings` (`id`, `project_id`, `cadastral_lot_no`, `unit_id`, `block_no`, `lot_no`, `orientation`, `lot_type`, `reservation_fee`, `price_per_sqm`, `lot_area_sqm`, `legal_misc_rate`, `annual_interest_rate`, `status`, `created_at`, `updated_at`) VALUES (1,1,'1306','LA-0001',NULL,NULL,'North-East Facing','inner',50000.00,2600.00,150.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(2,1,'1306','LA-0002',NULL,NULL,'South-East Facing','inner',50000.00,2600.00,180.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(3,1,'1306','LA-0003',NULL,NULL,'North-West Facing','inner',50000.00,2600.00,200.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(4,1,'1306','LA-0004',NULL,NULL,'South-West Facing','end',50000.00,2600.00,220.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(5,1,'1306','LA-0005',NULL,NULL,'North-East Facing','corner',50000.00,2600.00,250.00,10.00,11.500,'sold','2026-06-22 09:13:31','2026-06-22 10:22:51'),(6,1,'1306','LA-0006',NULL,NULL,'South-East Facing','inner',50000.00,2600.00,300.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(7,1,'1306','LA-0007',NULL,NULL,'North-West Facing','inner',50000.00,2600.00,330.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(8,1,'1306','LA-0008',NULL,NULL,'South-West Facing','end',50000.00,2600.00,360.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(9,1,'1306','LA-0009',NULL,NULL,'North-East Facing','inner',50000.00,2600.00,400.00,10.00,11.500,'sold','2026-06-22 09:13:31','2026-06-22 09:41:56'),(10,1,'1306','LA-0010',NULL,NULL,'South-East Facing','corner',50000.00,2600.00,450.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(11,1,'1306','LA-0011',NULL,NULL,'North-West Facing','inner',50000.00,2600.00,500.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(12,1,'1306','LA-0012',NULL,NULL,'South-West Facing','end',50000.00,2600.00,600.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(13,2,'2006','PE-0001',NULL,NULL,'North-East Facing','inner',50000.00,2800.00,150.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(14,2,'2006','PE-0002',NULL,NULL,'South-East Facing','inner',50000.00,2800.00,180.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(15,2,'2006','PE-0003',NULL,NULL,'North-West Facing','inner',50000.00,2800.00,200.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(16,2,'2006','PE-0004',NULL,NULL,'South-West Facing','end',50000.00,2800.00,220.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(17,2,'2006','PE-0005',NULL,NULL,'North-East Facing','corner',50000.00,2800.00,250.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(18,2,'2006','PE-0006',NULL,NULL,'South-East Facing','inner',50000.00,2800.00,300.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(19,2,'2006','PE-0007',NULL,NULL,'North-West Facing','inner',50000.00,2800.00,330.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(20,2,'2006','PE-0008',NULL,NULL,'South-West Facing','end',50000.00,2800.00,360.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(21,2,'2006','PE-0009',NULL,NULL,'North-East Facing','inner',50000.00,2800.00,400.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(22,2,'2006','PE-0010',NULL,NULL,'South-East Facing','corner',50000.00,2800.00,450.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(23,2,'2006','PE-0011',NULL,NULL,'North-West Facing','inner',50000.00,2800.00,500.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31'),(24,2,'2006','PE-0012',NULL,NULL,'South-West Facing','end',50000.00,2800.00,600.00,10.00,11.500,'available','2026-06-22 09:13:31','2026-06-22 09:13:31');
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
) ENGINE=InnoDB AUTO_INCREMENT=3673 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_schedules`
--

LOCK TABLES `payment_schedules` WRITE;
/*!40000 ALTER TABLE `payment_schedules` DISABLE KEYS */;
INSERT INTO `payment_schedules` VALUES (3457,1,'2026-06-22','Reservation Fee','reservation',50000.00,0.00,0.00,50000.00,50000.00,0.00,0.00,'2026-06-22','CASH-20260622-CU0001-0001 (50000.00)','paid',1094000.00,1,'2026-06-22 10:20:42','2026-06-22 10:20:42','[{\"payment_id\":1,\"reference_id\":\"CASH-20260622-CU0001-0001\",\"applied_amount\":50000,\"payment_date\":\"2026-06-22\",\"payment_type\":\"reservation\"}]'),(3458,1,'2026-06-22','1st Downpayment','downpayment',97733.33,0.00,0.00,97733.33,97733.33,0.00,0.00,'2026-06-22','CASH-20260622-CU0001-0002 (97733.33)','paid',996266.67,2,'2026-06-22 10:20:42','2026-06-22 10:20:42','[{\"payment_id\":2,\"reference_id\":\"CASH-20260622-CU0001-0002\",\"applied_amount\":97733.33,\"payment_date\":\"2026-06-22\",\"payment_type\":\"downpayment\"}]'),(3459,1,'2026-07-22','2nd Downpayment','downpayment',97733.33,0.00,0.00,97733.33,97733.33,0.00,0.00,'2026-06-22','CASH-20260622-CU0001-0003 (97733.33)','advance',898533.34,3,'2026-06-22 10:20:42','2026-06-22 10:20:42','[{\"payment_id\":3,\"reference_id\":\"CASH-20260622-CU0001-0003\",\"applied_amount\":97733.33,\"payment_date\":\"2026-06-22\",\"payment_type\":\"downpayment\"}]'),(3460,1,'2026-08-22','3rd Downpayment','downpayment',97733.34,0.00,0.00,97733.34,97733.34,0.00,0.00,'2026-06-22','CASH-20260622-CU0001-0004 (97733.34)','advance',800800.00,4,'2026-06-22 10:20:42','2026-06-22 10:20:42','[{\"payment_id\":4,\"reference_id\":\"CASH-20260622-CU0001-0004\",\"applied_amount\":97733.34,\"payment_date\":\"2026-06-22\",\"payment_type\":\"downpayment\"}]'),(3461,1,'2026-09-22','1st Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,19811.98,0.00,0.00,'2026-06-22','uoytuiyhgjgfjyttuy65yr (19811.98)','advance',780988.02,5,'2026-06-22 10:20:42','2026-06-22 10:20:42','[{\"payment_id\":5,\"reference_id\":\"uoytuiyhgjgfjyttuy65yr\",\"applied_amount\":19811.98,\"payment_date\":\"2026-06-22\",\"payment_type\":\"monthly\"}]'),(3462,1,'2026-10-22','2nd Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,19811.98,0.00,0.00,'2026-06-22','CASH-20260622-CU0001-0005 (19811.98)','advance',761176.04,6,'2026-06-22 10:20:42','2026-06-22 10:20:42','[{\"payment_id\":6,\"reference_id\":\"CASH-20260622-CU0001-0005\",\"applied_amount\":19811.98,\"payment_date\":\"2026-06-22\",\"payment_type\":\"monthly\"}]'),(3463,1,'2026-11-22','3rd Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,7,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3464,1,'2026-12-22','4th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,8,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3465,1,'2027-01-22','5th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,9,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3466,1,'2027-02-22','6th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,10,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3467,1,'2027-03-22','7th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,11,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3468,1,'2027-04-22','8th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,12,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3469,1,'2027-05-22','9th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,13,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3470,1,'2027-06-22','10th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,14,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3471,1,'2027-07-22','11th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,15,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3472,1,'2027-08-22','12th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,16,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3473,1,'2027-09-22','13th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,17,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3474,1,'2027-10-22','14th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,18,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3475,1,'2027-11-22','15th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,19,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3476,1,'2027-12-22','16th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,20,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3477,1,'2028-01-22','17th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,21,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3478,1,'2028-02-22','18th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,22,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3479,1,'2028-03-22','19th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,23,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3480,1,'2028-04-22','20th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,24,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3481,1,'2028-05-22','21st Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,25,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3482,1,'2028-06-22','22nd Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,26,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3483,1,'2028-07-22','23rd Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,27,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3484,1,'2028-08-22','24th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,28,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3485,1,'2028-09-22','25th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,29,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3486,1,'2028-10-22','26th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,30,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3487,1,'2028-11-22','27th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,31,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3488,1,'2028-12-22','28th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,32,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3489,1,'2029-01-22','29th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,33,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3490,1,'2029-02-22','30th Monthly Payment','monthly',19811.98,0.00,0.00,19811.98,0.00,0.00,19811.98,NULL,NULL,'not_due',761176.04,34,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3491,1,'2029-03-22','31st Monthly Payment','monthly',6440.60,0.00,0.00,6440.60,0.00,0.00,6440.60,NULL,NULL,'not_due',761176.04,35,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3492,1,'2029-08-22','Balloon Payment','balloon',200000.00,0.00,0.00,200000.00,0.00,0.00,200000.00,NULL,NULL,'not_due',761176.04,36,'2026-06-22 10:20:42','2026-06-22 10:20:42','[]'),(3637,2,'2026-06-22','Reservation Fee','reservation',50000.00,0.00,0.00,50000.00,0.00,0.00,50000.00,NULL,NULL,'due',715000.00,1,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3638,2,'2026-06-22','1st Downpayment','downpayment',54833.33,0.00,0.00,54833.33,0.00,0.00,54833.33,NULL,NULL,'due',715000.00,2,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3639,2,'2026-07-22','2nd Downpayment','downpayment',54833.33,0.00,0.00,54833.33,0.00,0.00,54833.33,NULL,NULL,'not_due',715000.00,3,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3640,2,'2026-08-22','3rd Downpayment','downpayment',54833.34,0.00,0.00,54833.34,0.00,0.00,54833.34,NULL,NULL,'not_due',715000.00,4,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3641,2,'2026-09-22','1st Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,5,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3642,2,'2026-10-22','2nd Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,6,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3643,2,'2026-11-22','3rd Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,7,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3644,2,'2026-12-22','4th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,8,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3645,2,'2027-01-22','5th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,9,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3646,2,'2027-02-22','6th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,10,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3647,2,'2027-03-22','7th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,11,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3648,2,'2027-04-22','8th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,12,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3649,2,'2027-05-22','9th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,13,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3650,2,'2027-06-22','10th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,14,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3651,2,'2027-07-22','11th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,15,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3652,2,'2027-08-22','12th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,16,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3653,2,'2027-09-22','13th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,17,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3654,2,'2027-10-22','14th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,18,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3655,2,'2027-11-22','15th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,19,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3656,2,'2027-12-22','16th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,20,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3657,2,'2028-01-22','17th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,21,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3658,2,'2028-02-22','18th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,22,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3659,2,'2028-03-22','19th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,23,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3660,2,'2028-04-22','20th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,24,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3661,2,'2028-05-22','21st Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,25,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3662,2,'2028-06-22','22nd Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,26,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3663,2,'2028-07-22','23rd Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,27,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3664,2,'2028-08-22','24th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,28,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3665,2,'2028-09-22','25th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,29,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3666,2,'2028-10-22','26th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,30,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3667,2,'2028-11-22','27th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,31,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3668,2,'2028-12-22','28th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,32,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3669,2,'2029-01-22','29th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,33,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3670,2,'2029-02-22','30th Monthly Payment','monthly',9909.29,0.00,0.00,9909.29,0.00,0.00,9909.29,NULL,NULL,'not_due',715000.00,34,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3671,2,'2029-03-22','31st Monthly Payment','monthly',3221.30,0.00,0.00,3221.30,0.00,0.00,3221.30,NULL,NULL,'not_due',715000.00,35,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]'),(3672,2,'2029-08-22','Balloon Payment','balloon',200000.00,0.00,0.00,200000.00,0.00,0.00,200000.00,NULL,NULL,'not_due',715000.00,36,'2026-06-22 10:33:11','2026-06-22 10:33:11','[]');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,50000.00,'reservation','cash','CASH-20260622-CU0001-0001','2026-06-22','verified',1,'2026-06-22 17:37:00','2026-06-22 09:36:56','2026-06-22 09:36:59',NULL,NULL),(2,1,97733.33,'downpayment','cash','CASH-20260622-CU0001-0002','2026-06-22','verified',1,'2026-06-22 17:41:57','2026-06-22 09:41:56','2026-06-22 09:41:56',NULL,NULL),(3,1,97733.33,'downpayment','cash','CASH-20260622-CU0001-0003','2026-06-22','verified',1,'2026-06-22 17:42:06','2026-06-22 09:42:06','2026-06-22 09:42:06',NULL,NULL),(4,1,97733.34,'downpayment','cash','CASH-20260622-CU0001-0004','2026-06-22','verified',1,'2026-06-22 17:42:34','2026-06-22 09:42:33','2026-06-22 09:42:33',NULL,NULL),(5,1,19811.98,'monthly','bank_transfer','uoytuiyhgjgfjyttuy65yr','2026-06-22','verified',1,'2026-06-22 17:43:23','2026-06-22 09:43:23','2026-06-22 09:43:23',NULL,NULL),(6,1,19811.98,'monthly','cash','CASH-20260622-CU0001-0005','2026-06-22','verified',1,'2026-06-22 17:44:16','2026-06-22 09:44:15','2026-06-22 09:44:15',NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_cadastral_lots`
--

LOCK TABLES `project_cadastral_lots` WRITE;
/*!40000 ALTER TABLE `project_cadastral_lots` DISABLE KEYS */;
INSERT INTO `project_cadastral_lots` VALUES (1,1,'1306','active','2026-06-22 01:14:15','2026-06-22 01:16:40'),(3,1,'1307','active','2026-06-22 01:16:40','2026-06-22 01:16:40'),(4,2,'2006','active','2026-06-22 01:16:55','2026-06-22 01:16:55');
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
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_document_requirements`
--

LOCK TABLES `project_document_requirements` WRITE;
/*!40000 ALTER TABLE `project_document_requirements` DISABLE KEYS */;
INSERT INTO `project_document_requirements` VALUES (19,1,1,1,'active',1,'2026-06-22 01:16:40','2026-06-22 01:16:40'),(20,1,2,1,'active',2,'2026-06-22 01:16:40','2026-06-22 01:16:40'),(21,1,3,1,'active',3,'2026-06-22 01:16:40','2026-06-22 01:16:40'),(22,1,4,1,'active',4,'2026-06-22 01:16:40','2026-06-22 01:16:40'),(23,1,5,1,'active',5,'2026-06-22 01:16:40','2026-06-22 01:16:40'),(24,1,6,1,'active',6,'2026-06-22 01:16:40','2026-06-22 01:16:40'),(25,1,7,1,'active',7,'2026-06-22 01:16:40','2026-06-22 01:16:40'),(26,1,8,1,'active',8,'2026-06-22 01:16:40','2026-06-22 01:16:40'),(27,1,9,1,'active',9,'2026-06-22 01:16:40','2026-06-22 01:16:40'),(28,2,2,1,'active',1,'2026-06-22 01:16:55','2026-06-22 01:16:55'),(29,2,4,1,'active',2,'2026-06-22 01:16:55','2026-06-22 01:16:55'),(30,2,6,1,'active',3,'2026-06-22 01:16:55','2026-06-22 01:16:55'),(31,2,8,1,'active',4,'2026-06-22 01:16:55','2026-06-22 01:16:55'),(32,2,9,1,'active',5,'2026-06-22 01:16:55','2026-06-22 01:16:55'),(33,2,1,1,'active',6,'2026-06-22 01:16:55','2026-06-22 01:16:55'),(34,2,3,1,'active',7,'2026-06-22 01:16:55','2026-06-22 01:16:55'),(35,2,5,1,'active',8,'2026-06-22 01:16:55','2026-06-22 01:16:55'),(36,2,7,1,'active',9,'2026-06-22 01:16:55','2026-06-22 01:16:55');
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
INSERT INTO `projects` VALUES (1,'Bailen','Bailen, Cavite','LA','IMELDA B. VILLALOBOS','AA-06-0005-00105','022-06-0005-003-04','active',NULL,NULL,'2026-06-17 03:45:11','2026-06-17 03:45:11'),(2,'Maragondon','Maragondon, Cavite','PE','LINDA A. VILLMOAR','AA-23-0235-00105','032-26-0311-023-02','active',NULL,NULL,'2026-06-17 03:47:08','2026-06-22 09:17:48');
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
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seller_group_members`
--

LOCK TABLES `seller_group_members` WRITE;
/*!40000 ALTER TABLE `seller_group_members` DISABLE KEYS */;
INSERT INTO `seller_group_members` VALUES (1,1,1,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(2,1,2,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(3,1,3,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(4,1,4,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(5,1,5,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(6,1,6,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(7,1,7,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(8,1,8,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(9,1,9,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(10,2,10,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(11,2,11,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(12,2,12,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(13,2,13,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(14,2,14,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(15,2,15,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(16,2,16,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(17,2,17,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(18,2,18,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(19,3,19,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(20,3,20,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(21,3,21,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(22,3,22,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(23,3,23,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(24,3,24,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(25,3,25,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(26,3,26,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(27,3,27,'active','2026-06-22 17:13:31',NULL,'2026-06-22 09:13:31','2026-06-22 09:13:31');
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seller_group_rate_distributions`
--

LOCK TABLES `seller_group_rate_distributions` WRITE;
/*!40000 ALTER TABLE `seller_group_rate_distributions` DISABLE KEYS */;
INSERT INTO `seller_group_rate_distributions` VALUES (1,1,'broker_network_manager',8.00,8.00,'approved','Seed role rate for Prime North Group.',1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(2,1,'broker',5.00,5.00,'approved','Seed role rate for Prime North Group.',1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(3,1,'manager',5.00,5.00,'approved','Seed role rate for Prime North Group.',1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(4,1,'agent',5.00,5.00,'approved','Seed role rate for Prime North Group.',1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(5,2,'broker_network_manager',8.00,8.00,'approved','Editable rate for BNM personal sale.',1,'2026-06-22 09:13:31','2026-06-22 09:16:54'),(6,2,'broker',7.00,7.00,'approved','Editable broker personal sale rate.',1,'2026-06-22 09:13:31','2026-06-22 09:16:54'),(7,2,'manager',6.00,6.00,'approved','Editable manager personal sale rate.',1,'2026-06-22 09:13:31','2026-06-22 09:16:54'),(8,2,'agent',5.00,5.00,'approved','Editable agent personal sale rate.',1,'2026-06-22 09:13:31','2026-06-22 09:16:54'),(9,3,'broker_network_manager',7.50,7.50,'approved','Seed role rate for D&C Inhouse Sellers.',1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(10,3,'broker',5.00,5.00,'approved','Seed role rate for D&C Inhouse Sellers.',1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(11,3,'manager',5.00,5.00,'approved','Seed role rate for D&C Inhouse Sellers.',1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(12,3,'agent',5.00,5.00,'approved','Seed role rate for D&C Inhouse Sellers.',1,'2026-06-22 09:13:31','2026-06-22 09:13:31');
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
INSERT INTO `seller_groups` VALUES (1,'Prime North Group','PRIME_NORTH',8.00,5.00,1.00,1.00,1.00,'{\"agent\": 5.00, \"broker\": 1.00, \"manager\": 1.00, \"broker_network_manager\": 1.00}','{\"broker\": 2.00, \"manager\": 5.00, \"broker_network_manager\": 1.00}','{\"broker\": 5.00, \"broker_network_manager\": 3.00}','{\"broker_network_manager\": 8.00}','custom_sale_type_splits',1,'active','Seed group. Agent sale total = 8%.',1,1,'2026-06-22 09:13:31','2026-06-22 09:13:31'),(2,'Cavite Realty Partners','CAVITE_REALTY',8.00,5.00,1.00,1.00,1.00,'{\"agent\": 5, \"broker\": 1, \"manager\": 1, \"broker_network_manager\": 1}','{\"broker\": 1, \"manager\": 6, \"broker_network_manager\": 1}','{\"broker\": 7, \"broker_network_manager\": 1}','{\"broker_network_manager\": 8}','custom_sale_type_splits',10,'active','Seed group. Agent sale total = 10%.',1,1,'2026-06-22 09:13:31','2026-06-22 09:16:54'),(3,'D&C Inhouse Sellers','DC_INHOUSE',7.50,5.00,0.75,0.75,1.00,'{\"agent\": 5.00, \"broker\": 0.75, \"manager\": 1.00, \"broker_network_manager\": 0.75}','{\"broker\": 1.75, \"manager\": 5.00, \"broker_network_manager\": 0.75}','{\"broker\": 5.00, \"broker_network_manager\": 2.50}','{\"broker_network_manager\": 7.50}','custom_sale_type_splits',19,'active','Seed group. Agent sale total = 7.5%.',1,1,'2026-06-22 09:13:31','2026-06-22 09:13:31');
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
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'company_name','D&C Prime Realty','2026-06-17 03:39:38','2026-06-17 03:39:38'),(2,'company_email','admin@gmail.com','2026-06-17 03:39:38','2026-06-17 03:39:38'),(3,'company_contact','09545648674','2026-06-17 03:39:38','2026-06-17 03:39:38'),(4,'company_address','Indang, Cavite','2026-06-17 03:39:38','2026-06-17 03:39:38'),(5,'system_status','active','2026-06-17 03:39:38','2026-06-17 03:39:38'),(6,'reservation_contact_name','Admin','2026-06-17 03:39:38','2026-06-17 03:39:38'),(7,'reservation_contact_email','admin@gmail.com','2026-06-17 03:39:38','2026-06-17 03:39:38'),(8,'reservation_contact_no','0980988987','2026-06-17 03:39:38','2026-06-17 05:33:29'),(9,'commission_release_days','7,22','2026-06-17 05:20:48','2026-06-17 05:33:10');
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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','superadmin@gmail.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','super_admin','active',0,'2026-06-22 17:17:27',NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:17:27'),(2,'Admin User','admin@dcprime.test','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','admin','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(3,'Prime North BNM','prime.north.bnm@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker_network_manager','active',0,'2026-06-22 17:17:04',NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:17:04'),(4,'Prime North Broker One','prime.north.broker1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(5,'Prime North Broker Two','prime.north.broker2@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(6,'Prime North Manager One','prime.north.manager1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(7,'Prime North Manager Two','prime.north.manager2@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(8,'Prime North Agent One','prime.north.agent1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(9,'Prime North Agent Two','prime.north.agent2@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(10,'Prime North Agent Three','prime.north.agent3@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(11,'Prime North Agent Four','prime.north.agent4@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(12,'Cavite Realty BNM','cavite.realty.bnm@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker_network_manager','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(13,'Cavite Realty Broker One','cavite.realty.broker1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(14,'Cavite Realty Broker Two','cavite.realty.broker2@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(15,'Cavite Realty Manager One','cavite.realty.manager1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(16,'Cavite Realty Manager Two','cavite.realty.manager2@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(17,'Cavite Realty Agent One','cavite.realty.agent1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(18,'Cavite Realty Agent Two','cavite.realty.agent2@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(19,'Cavite Realty Agent Three','cavite.realty.agent3@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(20,'Cavite Realty Agent Four','cavite.realty.agent4@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(21,'D&C Inhouse BNM','inhouse.bnm@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker_network_manager','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(22,'D&C Inhouse Broker One','inhouse.broker1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(23,'D&C Inhouse Broker Two','inhouse.broker2@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(24,'D&C Inhouse Manager One','inhouse.manager1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(25,'D&C Inhouse Manager Two','inhouse.manager2@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(26,'D&C Inhouse Agent One','inhouse.agent1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(27,'D&C Inhouse Agent Two','inhouse.agent2@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(28,'D&C Inhouse Agent Three','inhouse.agent3@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31'),(29,'D&C Inhouse Agent Four','inhouse.agent4@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-22 17:13:31','2026-06-22 09:13:31','2026-06-22 09:13:31');
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

-- Dump completed on 2026-06-24  9:43:41
