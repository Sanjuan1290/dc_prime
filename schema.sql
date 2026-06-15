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
INSERT INTO `accredited_sellers` VALUES (1,3,'Rowena M. Cortez','rowena.cortez.bnm@test.com','09000000001','broker_network_manager',NULL,NULL,'active','2026-06-14','2026-06-14 06:48:38','2026-06-14 06:48:38',8.00,8.00,NULL,NULL,NULL,NULL,NULL,1,'2026-06-14 14:48:38'),(2,4,'Broker One Under Rowena','broker.one@test.com','09000000002','broker',1,NULL,'active','2026-06-14','2026-06-14 06:48:38','2026-06-14 06:48:38',7.00,7.00,NULL,NULL,NULL,NULL,NULL,1,'2026-06-14 14:48:38'),(3,5,'Manager One A','manager.one.a@test.com','09000000003','manager',2,NULL,'active','2026-06-14','2026-06-14 06:48:38','2026-06-14 08:41:52',6.00,NULL,6.00,NULL,NULL,NULL,NULL,4,'2026-06-14 16:41:52'),(4,6,'Agent One A1','agent.one.a1@test.com','09000000004','agent',3,NULL,'active','2026-06-14','2026-06-14 06:48:38','2026-06-14 08:42:08',5.00,NULL,5.00,NULL,5.00,NULL,NULL,5,'2026-06-14 16:42:08'),(5,7,'Broker Two Independent','broker.two@test.com','09000000005','broker',NULL,NULL,'active','2026-06-14','2026-06-14 06:48:38','2026-06-14 06:48:38',7.00,7.00,NULL,NULL,NULL,NULL,NULL,1,'2026-06-14 14:48:38'),(6,8,'Manager Two A','manager.two.a@test.com','09000000006','manager',5,NULL,'active','2026-06-13','2026-06-14 06:48:38','2026-06-14 07:46:15',6.00,NULL,6.00,NULL,NULL,NULL,NULL,2,'2026-06-14 15:46:15'),(7,9,'Agent Two A1','agent.two.a1@test.com','09000000007','agent',6,NULL,'active','2026-06-13','2026-06-14 06:48:38','2026-06-14 07:45:34',5.00,NULL,5.00,NULL,5.00,NULL,NULL,2,'2026-06-14 15:45:34');
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
) ENGINE=InnoDB AUTO_INCREMENT=190 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'update','Projects','Updated project Maragondon','127.0.0.1','2026-06-14 06:56:50'),(2,1,'update','Projects','Updated project Bailen','127.0.0.1','2026-06-14 06:57:00'),(3,1,'reset','Listing Documents','Reset listing documents for PE-1005 to project defaults','127.0.0.1','2026-06-14 06:57:19'),(4,3,'login','Auth','Rowena M. Cortez logged in','::1','2026-06-14 07:00:08'),(5,4,'login','Auth','Broker One Under Rowena logged in','::1','2026-06-14 07:01:26'),(6,5,'login','Auth','Manager One A logged in','::1','2026-06-14 07:02:57'),(7,6,'login','Auth','Agent One A1 logged in','::1','2026-06-14 07:03:45'),(8,2,'login','Auth','Admin logged in','::1','2026-06-14 07:06:13'),(9,4,'login','Auth','Broker One Under Rowena logged in','::1','2026-06-14 07:15:20'),(10,1,'login','Auth','Super Admin logged in','::1','2026-06-14 07:15:36'),(11,1,'update','Settings','Updated system settings','127.0.0.1','2026-06-14 07:16:06'),(12,4,'login','Auth','Broker One Under Rowena logged in','::1','2026-06-14 07:16:14'),(13,1,'login','Auth','Super Admin logged in','::1','2026-06-14 07:23:09'),(14,1,'update','Settings','Updated system settings','127.0.0.1','2026-06-14 07:23:31'),(15,3,'login','Auth','Rowena M. Cortez logged in','::1','2026-06-14 07:24:03'),(16,1,'login','Auth','Super Admin logged in','::1','2026-06-14 07:34:51'),(17,2,'login','Auth','Admin logged in','::1','2026-06-14 07:36:04'),(18,2,'create','Clients','Created client robert','127.0.0.1','2026-06-14 07:39:39'),(19,2,'update','Users','Updated user 9 and linked seller profile 7','127.0.0.1','2026-06-14 07:45:34'),(20,2,'update','Users','Updated user 8 and linked seller profile 6','127.0.0.1','2026-06-14 07:46:15'),(21,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-14 07:50:15'),(22,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-14 07:50:15'),(23,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-14 07:50:15'),(24,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-14 07:50:16'),(25,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-14 07:50:16'),(26,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-14 07:50:16'),(27,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-14 07:50:16'),(28,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-14 07:50:16'),(29,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-14 07:50:16'),(30,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-14 07:50:16'),(31,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-14 07:50:16'),(32,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-14 07:50:16'),(33,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-14 07:50:16'),(34,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-14 07:50:16'),(35,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-14 07:50:16'),(36,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-14 08:04:50'),(37,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-14 08:04:50'),(38,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-14 08:04:50'),(39,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-14 08:04:50'),(40,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-14 08:04:53'),(41,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-14 08:04:53'),(42,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-14 08:04:53'),(43,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-14 08:04:53'),(44,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-14 08:06:41'),(45,2,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-14 08:06:41'),(46,2,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-14 08:06:41'),(47,2,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-14 08:06:41'),(48,2,'reserve','Client Units','Reserved LA-1007 for robert','127.0.0.1','2026-06-14 08:17:42'),(49,2,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-14 08:17:49'),(50,2,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-14 08:17:49'),(51,2,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-14 08:17:50'),(52,2,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-14 08:17:50'),(53,2,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-14 08:17:50'),(54,2,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-14 08:17:51'),(55,2,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-14 08:17:51'),(56,2,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-14 08:17:51'),(57,2,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-14 08:17:52'),(58,2,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-14 08:17:52'),(59,2,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 08:19:24'),(60,2,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 08:19:24'),(61,2,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-14 08:20:28'),(62,2,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-14 08:20:54'),(63,2,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-14 08:20:54'),(64,2,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 08:22:01'),(65,2,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 08:22:01'),(66,2,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-14 08:22:15'),(67,2,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-14 08:22:22'),(68,2,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-14 08:22:22'),(69,2,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-14 08:31:15'),(70,2,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 08:31:19'),(71,2,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 08:31:19'),(72,2,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 08:31:23'),(73,2,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 08:31:23'),(74,3,'login','Auth','Rowena M. Cortez logged in','::1','2026-06-14 08:41:02'),(75,4,'login','Auth','Broker One Under Rowena logged in','::1','2026-06-14 08:41:25'),(76,5,'login','Auth','Manager One A logged in','::1','2026-06-14 08:42:01'),(77,1,'login','Auth','Super Admin logged in','::1','2026-06-14 08:42:44'),(78,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 08:49:52'),(79,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 08:49:52'),(80,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:10:58'),(81,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:10:58'),(82,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:11:24'),(83,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:11:24'),(84,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:11:40'),(85,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:11:40'),(86,1,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-14 09:11:50'),(87,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:11:52'),(88,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:11:52'),(89,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:11:53'),(90,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:11:53'),(91,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:11:56'),(92,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:11:56'),(93,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:12:03'),(94,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:12:03'),(95,1,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-14 09:12:11'),(96,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:12:22'),(97,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:12:22'),(98,1,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-14 09:12:31'),(99,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:12:32'),(100,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:12:32'),(101,1,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-14 09:12:42'),(102,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:12:45'),(103,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:12:45'),(104,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:12:46'),(105,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:12:46'),(106,1,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-14 09:12:55'),(107,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:12:56'),(108,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:12:56'),(109,1,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-14 09:13:02'),(110,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:13:11'),(111,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:13:11'),(112,1,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-14 09:15:18'),(113,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:15:19'),(114,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:15:19'),(115,1,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-14 09:16:34'),(116,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-14 09:16:39'),(117,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-14 09:16:39'),(118,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:16:42'),(119,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:16:42'),(120,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:16:50'),(121,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:16:50'),(122,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:16:51'),(123,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:16:51'),(124,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:16:52'),(125,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:16:52'),(126,1,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-14 09:16:55'),(127,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:16:56'),(128,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:16:56'),(129,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:16:57'),(130,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:16:57'),(131,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:17:26'),(132,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:17:26'),(133,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:17:27'),(134,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-14 09:17:27'),(135,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-14 09:18:39'),(136,1,'update','Payments','Updated payment 2','127.0.0.1','2026-06-14 09:18:42'),(137,3,'login','Auth','Rowena M. Cortez logged in','::1','2026-06-14 09:23:10'),(138,1,'login','Auth','Super Admin logged in','::1','2026-06-14 09:25:17'),(139,1,'login','Auth','Super Admin logged in','::ffff:127.0.0.1','2026-06-14 09:42:45'),(140,3,'login','Auth','Rowena M. Cortez logged in','::1','2026-06-14 09:53:47'),(141,6,'login','Auth','Agent One A1 logged in','::1','2026-06-14 09:54:32'),(142,1,'login','Auth','Super Admin logged in','::1','2026-06-14 09:55:23'),(143,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-14 10:07:50'),(144,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-14 10:07:50'),(145,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 02:38:04'),(146,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 02:38:04'),(147,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 02:41:03'),(148,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 02:41:03'),(149,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 03:20:43'),(150,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 03:20:43'),(151,1,'update','Clients','Updated client robert','127.0.0.1','2026-06-15 03:21:10'),(152,1,'update','Clients','Updated client robert','127.0.0.1','2026-06-15 03:21:31'),(153,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 03:25:45'),(154,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 03:25:45'),(155,1,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 03:26:56'),(156,1,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 03:26:56'),(157,1,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 03:26:56'),(158,1,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 03:26:56'),(159,1,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 03:27:03'),(160,1,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 03:27:03'),(161,1,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 03:27:03'),(162,1,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 03:27:03'),(163,1,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 03:27:09'),(164,1,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 03:27:09'),(165,1,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 03:27:09'),(166,1,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 03:27:09'),(167,1,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 03:27:11'),(168,1,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 03:27:11'),(169,1,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 03:27:12'),(170,1,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 03:27:12'),(171,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 03:27:16'),(172,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 03:27:16'),(173,1,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 03:27:28'),(174,1,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-15 03:27:28'),(175,1,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-15 03:27:28'),(176,1,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-15 03:27:28'),(177,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 03:27:29'),(178,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-15 03:27:29'),(179,3,'login','Auth','Rowena M. Cortez logged in','::1','2026-06-15 03:49:51'),(180,1,'login','Auth','Super Admin logged in','::1','2026-06-15 03:50:27'),(181,1,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-15 04:11:10'),(182,1,'restore','Commission Releases','Restored cancelled release 1','127.0.0.1','2026-06-15 04:12:42'),(183,1,'cancel','Commission Releases','Cancelled release 1','127.0.0.1','2026-06-15 04:12:57'),(184,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 04:49:18'),(185,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 04:49:18'),(186,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-15 04:51:55'),(187,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 04:52:02'),(188,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-15 04:52:02'),(189,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-15 04:53:33');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_buyers`
--

LOCK TABLES `client_buyers` WRITE;
/*!40000 ALTER TABLE `client_buyers` DISABLE KEYS */;
INSERT INTO `client_buyers` VALUES (5,1,'spouse','san juan','2002-03-03','imus','Filipino','male','single','GEN TRI','4107','Paliparan','4114','09054563453','0987654654','nick@gmail.com','6784-5435-7654-00000','2026-06-15 03:27:28','2026-06-15 03:27:28');
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
) ENGINE=InnoDB AUTO_INCREMENT=418 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_document_list`
--

LOCK TABLES `client_document_list` WRITE;
/*!40000 ALTER TABLE `client_document_list` DISABLE KEYS */;
INSERT INTO `client_document_list` VALUES (1,1,1,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-14 08:22:15','2026-06-14 08:22:15'),(2,1,2,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-14 08:22:15','2026-06-14 08:22:15'),(3,1,3,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-14 08:22:15','2026-06-14 08:22:15'),(4,1,4,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-14 08:22:15','2026-06-14 08:22:15'),(5,1,5,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-14 08:22:15','2026-06-14 08:22:15'),(6,1,8,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-14 08:22:15','2026-06-14 08:22:15'),(7,1,9,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-14 08:22:15','2026-06-14 08:22:15'),(8,1,10,0,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-14 08:22:15','2026-06-14 08:22:15');
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_employment_details`
--

LOCK TABLES `client_employment_details` WRITE;
/*!40000 ALTER TABLE `client_employment_details` DISABLE KEYS */;
INSERT INTO `client_employment_details` VALUES (12,1,NULL,'principal','employed_private',NULL,'dcprime','Indang, Cavite','4122','real estate','IT',40000.00,'2026-06-15 03:27:28','2026-06-15 03:27:28'),(13,1,5,'co_buyer','employed_private',NULL,'TASKUS','Paliparang, Cavite','4114','Technology','IT',28000.00,'2026-06-15 03:27:28','2026-06-15 03:27:28');
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
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_unit_form_prints`
--

LOCK TABLES `client_unit_form_prints` WRITE;
/*!40000 ALTER TABLE `client_unit_form_prints` DISABLE KEYS */;
INSERT INTO `client_unit_form_prints` VALUES (1,1,'statement_of_account',2,'2026-06-14 16:19:24',NULL),(2,1,'statement_of_account',2,'2026-06-14 16:19:24',NULL),(3,1,'offer_to_buy_buyers_profile',2,'2026-06-14 16:20:54',NULL),(4,1,'offer_to_buy_buyers_profile',2,'2026-06-14 16:20:54',NULL),(5,1,'statement_of_account',2,'2026-06-14 16:22:01',NULL),(6,1,'statement_of_account',2,'2026-06-14 16:22:01',NULL),(7,1,'statement_of_account',2,'2026-06-14 16:31:19',NULL),(8,1,'statement_of_account',2,'2026-06-14 16:31:19',NULL),(9,1,'statement_of_account',2,'2026-06-14 16:31:23',NULL),(10,1,'statement_of_account',2,'2026-06-14 16:31:23',NULL),(11,1,'statement_of_account',1,'2026-06-14 16:49:52',NULL),(12,1,'statement_of_account',1,'2026-06-14 16:49:52',NULL),(13,1,'statement_of_account',1,'2026-06-14 17:10:58',NULL),(14,1,'statement_of_account',1,'2026-06-14 17:10:58',NULL),(15,1,'statement_of_account',1,'2026-06-14 17:11:24',NULL),(16,1,'statement_of_account',1,'2026-06-14 17:11:24',NULL),(17,1,'statement_of_account',1,'2026-06-14 17:11:40',NULL),(18,1,'statement_of_account',1,'2026-06-14 17:11:40',NULL),(19,1,'statement_of_account',1,'2026-06-14 17:11:52',NULL),(20,1,'statement_of_account',1,'2026-06-14 17:11:52',NULL),(21,1,'statement_of_account',1,'2026-06-14 17:11:53',NULL),(22,1,'statement_of_account',1,'2026-06-14 17:11:53',NULL),(23,1,'statement_of_account',1,'2026-06-14 17:11:56',NULL),(24,1,'statement_of_account',1,'2026-06-14 17:11:56',NULL),(25,1,'statement_of_account',1,'2026-06-14 17:12:03',NULL),(26,1,'statement_of_account',1,'2026-06-14 17:12:03',NULL),(27,1,'statement_of_account',1,'2026-06-14 17:12:22',NULL),(28,1,'statement_of_account',1,'2026-06-14 17:12:22',NULL),(29,1,'statement_of_account',1,'2026-06-14 17:12:32',NULL),(30,1,'statement_of_account',1,'2026-06-14 17:12:32',NULL),(31,1,'statement_of_account',1,'2026-06-14 17:12:45',NULL),(32,1,'statement_of_account',1,'2026-06-14 17:12:45',NULL),(33,1,'statement_of_account',1,'2026-06-14 17:12:46',NULL),(34,1,'statement_of_account',1,'2026-06-14 17:12:46',NULL),(35,1,'statement_of_account',1,'2026-06-14 17:12:56',NULL),(36,1,'statement_of_account',1,'2026-06-14 17:12:56',NULL),(37,1,'statement_of_account',1,'2026-06-14 17:13:11',NULL),(38,1,'statement_of_account',1,'2026-06-14 17:13:11',NULL),(39,1,'statement_of_account',1,'2026-06-14 17:15:19',NULL),(40,1,'statement_of_account',1,'2026-06-14 17:15:19',NULL),(41,1,'offer_to_buy_buyers_profile',1,'2026-06-14 17:16:39',NULL),(42,1,'offer_to_buy_buyers_profile',1,'2026-06-14 17:16:39',NULL),(43,1,'statement_of_account',1,'2026-06-14 17:16:42',NULL),(44,1,'statement_of_account',1,'2026-06-14 17:16:42',NULL),(45,1,'statement_of_account',1,'2026-06-14 17:16:50',NULL),(46,1,'statement_of_account',1,'2026-06-14 17:16:50',NULL),(47,1,'statement_of_account',1,'2026-06-14 17:16:51',NULL),(48,1,'statement_of_account',1,'2026-06-14 17:16:51',NULL),(49,1,'statement_of_account',1,'2026-06-14 17:16:52',NULL),(50,1,'statement_of_account',1,'2026-06-14 17:16:52',NULL),(51,1,'statement_of_account',1,'2026-06-14 17:16:56',NULL),(52,1,'statement_of_account',1,'2026-06-14 17:16:56',NULL),(53,1,'statement_of_account',1,'2026-06-14 17:16:57',NULL),(54,1,'statement_of_account',1,'2026-06-14 17:16:57',NULL),(55,1,'statement_of_account',1,'2026-06-14 17:17:26',NULL),(56,1,'statement_of_account',1,'2026-06-14 17:17:26',NULL),(57,1,'statement_of_account',1,'2026-06-14 17:17:27',NULL),(58,1,'statement_of_account',1,'2026-06-14 17:17:27',NULL),(59,1,'offer_to_buy_buyers_profile',1,'2026-06-14 18:07:50',NULL),(60,1,'offer_to_buy_buyers_profile',1,'2026-06-14 18:07:50',NULL),(61,1,'offer_to_buy_buyers_profile',1,'2026-06-15 10:38:04',NULL),(62,1,'offer_to_buy_buyers_profile',1,'2026-06-15 10:38:04',NULL),(63,1,'offer_to_buy_buyers_profile',1,'2026-06-15 10:41:03',NULL),(64,1,'offer_to_buy_buyers_profile',1,'2026-06-15 10:41:03',NULL),(65,1,'statement_of_account',1,'2026-06-15 11:20:43',NULL),(66,1,'statement_of_account',1,'2026-06-15 11:20:43',NULL),(67,1,'offer_to_buy_buyers_profile',1,'2026-06-15 11:25:45',NULL),(68,1,'offer_to_buy_buyers_profile',1,'2026-06-15 11:25:45',NULL),(69,1,'offer_to_buy_buyers_profile',1,'2026-06-15 11:27:16',NULL),(70,1,'offer_to_buy_buyers_profile',1,'2026-06-15 11:27:16',NULL),(71,1,'offer_to_buy_buyers_profile',1,'2026-06-15 11:27:29',NULL),(72,1,'offer_to_buy_buyers_profile',1,'2026-06-15 11:27:29',NULL),(73,1,'statement_of_account',1,'2026-06-15 12:49:18',NULL),(74,1,'statement_of_account',1,'2026-06-15 12:49:18',NULL),(75,1,'statement_of_account',1,'2026-06-15 12:52:02',NULL),(76,1,'statement_of_account',1,'2026-06-15 12:52:02',NULL);
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
INSERT INTO `client_units` VALUES (1,1,7,2,4,'active','installment',651500.00,18,'2026-06-14','2026-06-18',1039500.00,50000.00,0.00,0.00,989500.00,36,6.00,29135.28,'pending_profile',NULL,NULL,NULL,NULL,NULL,'2026-06-14 08:17:42','2026-06-15 04:53:33','distributed');
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
INSERT INTO `clients` VALUES (1,'robert',NULL,'spouses','2005-01-11','imus','Filipino','male','single','robertrenbysanjuan@gmail.com','09876598765','0905456754','3456-5678-5679-0000','complete','GEN TRI','GEN TRI','4107',NULL,NULL,'REGION 4A',7,'2026-06-14 07:39:39','2026-06-15 03:27:28');
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
INSERT INTO `commission_releases` VALUES (21,5,'1st_release',20.00,20.00,20.00,9450.00,0.00,9450.00,'eligible',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(22,5,'2nd_release',40.00,20.00,40.00,9450.00,0.00,9450.00,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(23,5,'3rd_release',60.00,20.00,60.00,9450.00,0.00,9450.00,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(24,5,'4th_release',75.00,15.00,75.00,7087.50,0.00,7087.50,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(25,5,'retention',NULL,25.00,100.00,11812.50,0.00,11812.50,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(26,6,'1st_release',20.00,20.00,20.00,1890.00,0.00,1890.00,'eligible',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(27,6,'2nd_release',40.00,20.00,40.00,1890.00,0.00,1890.00,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(28,6,'3rd_release',60.00,20.00,60.00,1890.00,0.00,1890.00,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(29,6,'4th_release',75.00,15.00,75.00,1417.50,0.00,1417.50,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(30,6,'retention',NULL,25.00,100.00,2362.50,0.00,2362.50,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(31,7,'1st_release',20.00,20.00,20.00,1890.00,0.00,1890.00,'eligible',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(32,7,'2nd_release',40.00,20.00,40.00,1890.00,0.00,1890.00,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(33,7,'3rd_release',60.00,20.00,60.00,1890.00,0.00,1890.00,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(34,7,'4th_release',75.00,15.00,75.00,1417.50,0.00,1417.50,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(35,7,'retention',NULL,25.00,100.00,2362.50,0.00,2362.50,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(36,8,'1st_release',20.00,20.00,20.00,1890.00,0.00,1890.00,'eligible',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(37,8,'2nd_release',40.00,20.00,40.00,1890.00,0.00,1890.00,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(38,8,'3rd_release',60.00,20.00,60.00,1890.00,0.00,1890.00,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(39,8,'4th_release',75.00,15.00,75.00,1417.50,0.00,1417.50,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10'),(40,8,'retention',NULL,25.00,100.00,2362.50,0.00,2362.50,'pending',NULL,NULL,NULL,'2026-06-15 04:11:10','2026-06-15 04:11:10');
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
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_role_defaults`
--

LOCK TABLES `commission_role_defaults` WRITE;
/*!40000 ALTER TABLE `commission_role_defaults` DISABLE KEYS */;
INSERT INTO `commission_role_defaults` VALUES (1,'bnm_pool_rate','Broker Network Manager Pool Rate','broker_network_manager','pool',8.00,1,'2026-06-14 06:48:38','2026-06-14 06:48:38'),(2,'broker_pool_rate','Broker Pool Rate','broker','pool',7.00,1,'2026-06-14 06:48:38','2026-06-14 06:48:38');
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
INSERT INTO `commissions` VALUES (5,1,4,'agent',5.00,945000.00,47250.00,'main',NULL,'distributed',0.00,NULL,NULL,NULL,47250.00,0.00,'active','Auto-generated hierarchy commission from reservation of LA-1007','2026-06-15 04:11:10','2026-06-15 04:11:10'),(6,1,3,'manager',1.00,945000.00,9450.00,'override',5,'distributed',0.00,NULL,NULL,'Manager residual release milestone',9450.00,0.00,'active','Auto-generated hierarchy commission from reservation of LA-1007','2026-06-15 04:11:10','2026-06-15 04:11:10'),(7,1,2,'broker',1.00,945000.00,9450.00,'override',5,'distributed',0.00,NULL,NULL,'Broker residual release milestone',9450.00,0.00,'active','Auto-generated hierarchy commission from reservation of LA-1007','2026-06-15 04:11:10','2026-06-15 04:11:10'),(8,1,1,'broker_network_manager',1.00,945000.00,9450.00,'override',5,'distributed',0.00,NULL,NULL,'Broker Network Manager residual release milestone',9450.00,0.00,'active','Auto-generated hierarchy commission from reservation of LA-1007','2026-06-15 04:11:10','2026-06-15 04:11:10');
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_template_items`
--

LOCK TABLES `document_template_items` WRITE;
/*!40000 ALTER TABLE `document_template_items` DISABLE KEYS */;
INSERT INTO `document_template_items` VALUES (1,1,1,1,'active',1,'2026-06-14 06:48:38','2026-06-14 06:48:38'),(2,1,2,1,'active',2,'2026-06-14 06:48:38','2026-06-14 06:48:38'),(3,1,3,1,'active',3,'2026-06-14 06:48:38','2026-06-14 06:48:38'),(4,1,4,1,'active',4,'2026-06-14 06:48:38','2026-06-14 06:48:38'),(5,1,5,1,'active',5,'2026-06-14 06:48:38','2026-06-14 06:48:38'),(6,1,8,1,'active',6,'2026-06-14 06:48:38','2026-06-14 06:48:38'),(7,1,9,1,'active',7,'2026-06-14 06:48:38','2026-06-14 06:48:38'),(8,1,10,0,'active',8,'2026-06-14 06:48:38','2026-06-14 06:48:38'),(9,2,6,1,'active',1,'2026-06-14 06:48:38','2026-06-14 06:48:38'),(10,2,7,0,'active',2,'2026-06-14 06:48:38','2026-06-14 06:48:38'),(11,2,8,1,'active',3,'2026-06-14 06:48:38','2026-06-14 06:48:38'),(12,2,9,1,'active',4,'2026-06-14 06:48:38','2026-06-14 06:48:38');
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
INSERT INTO `document_templates` VALUES (1,'Default Buyer Requirements','Standard buyer/client checklist used for most project reservations.','active',1,'2026-06-14 06:48:38','2026-06-14 06:48:38'),(2,'Legal and Closing Requirements','Additional documents normally needed for contract, title, and closing stages.','active',1,'2026-06-14 06:48:38','2026-06-14 06:48:38');
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (1,'Client Registration Form - Seller Copy','Seller copy of the buyer registration form.',0,1,'active','2026-06-14 06:48:38','2026-06-14 06:48:38'),(2,'Client Registration Form - Administrator Copy','Administrator copy of the buyer registration form.',0,1,'active','2026-06-14 06:48:38','2026-06-14 06:48:38'),(3,'Intent to Buy','Signed statement showing buyer intent to purchase the selected unit.',0,1,'active','2026-06-14 06:48:38','2026-06-14 06:48:38'),(4,'Offer to Buy and Buyer Profile','Offer to buy form with buyer personal/profile information.',0,1,'active','2026-06-14 06:48:38','2026-06-14 06:48:38'),(5,'Reservation Agreement','Signed reservation agreement for the selected unit.',0,1,'active','2026-06-14 06:48:38','2026-06-14 06:48:38'),(6,'Contract to Sell','Contract to sell document after reservation and payment terms are finalized.',0,1,'active','2026-06-14 06:48:38','2026-06-14 06:48:38'),(7,'Deed of Absolute Sale','Final deed used after full payment or closing requirements.',0,1,'active','2026-06-14 06:48:38','2026-06-14 06:48:38'),(8,'Valid Government IDs','Clear copies of valid government-issued IDs.',0,1,'active','2026-06-14 06:48:38','2026-06-14 06:48:38'),(9,'TIN ID or BIR TIN Verification','Tax identification document or TIN verification record.',0,1,'active','2026-06-14 06:48:38','2026-06-14 06:48:38'),(10,'Marriage Certificate or CENOMAR','Marriage certificate for married buyers or CENOMAR for single buyers when required.',0,1,'active','2026-06-14 06:48:38','2026-06-14 06:48:38');
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
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_document_requirements`
--

LOCK TABLES `listing_document_requirements` WRITE;
/*!40000 ALTER TABLE `listing_document_requirements` DISABLE KEYS */;
INSERT INTO `listing_document_requirements` VALUES (16,15,1,1,'active',1,'project_default','2026-06-14 06:57:19','2026-06-14 06:57:19'),(17,15,2,1,'active',2,'project_default','2026-06-14 06:57:19','2026-06-14 06:57:19'),(18,15,3,1,'active',3,'project_default','2026-06-14 06:57:19','2026-06-14 06:57:19'),(19,15,4,1,'active',4,'project_default','2026-06-14 06:57:19','2026-06-14 06:57:19'),(20,15,5,1,'active',5,'project_default','2026-06-14 06:57:19','2026-06-14 06:57:19'),(21,15,8,1,'active',6,'project_default','2026-06-14 06:57:19','2026-06-14 06:57:19'),(22,15,9,1,'active',7,'project_default','2026-06-14 06:57:19','2026-06-14 06:57:19'),(23,15,10,0,'active',8,'project_default','2026-06-14 06:57:19','2026-06-14 06:57:19'),(31,7,1,1,'active',1,'project_default','2026-06-14 08:18:03','2026-06-14 08:18:03'),(32,7,2,1,'active',2,'project_default','2026-06-14 08:18:03','2026-06-14 08:18:03'),(33,7,3,1,'active',3,'project_default','2026-06-14 08:18:03','2026-06-14 08:18:03'),(34,7,4,1,'active',4,'project_default','2026-06-14 08:18:03','2026-06-14 08:18:03'),(35,7,5,1,'active',5,'project_default','2026-06-14 08:18:03','2026-06-14 08:18:03'),(36,7,8,1,'active',6,'project_default','2026-06-14 08:18:03','2026-06-14 08:18:03'),(37,7,9,1,'active',7,'project_default','2026-06-14 08:18:03','2026-06-14 08:18:03'),(38,7,10,0,'active',8,'project_default','2026-06-14 08:18:03','2026-06-14 08:18:03'),(39,13,1,1,'active',1,'project_default','2026-06-15 01:49:21','2026-06-15 01:49:21'),(40,13,2,1,'active',2,'project_default','2026-06-15 01:49:21','2026-06-15 01:49:21'),(41,13,3,1,'active',3,'project_default','2026-06-15 01:49:21','2026-06-15 01:49:21'),(42,13,4,1,'active',4,'project_default','2026-06-15 01:49:21','2026-06-15 01:49:21'),(43,13,5,1,'active',5,'project_default','2026-06-15 01:49:21','2026-06-15 01:49:21'),(44,13,8,1,'active',6,'project_default','2026-06-15 01:49:21','2026-06-15 01:49:21'),(45,13,9,1,'active',7,'project_default','2026-06-15 01:49:21','2026-06-15 01:49:21'),(46,13,10,0,'active',8,'project_default','2026-06-15 01:49:21','2026-06-15 01:49:21');
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listings`
--

LOCK TABLES `listings` WRITE;
/*!40000 ALTER TABLE `listings` DISABLE KEYS */;
INSERT INTO `listings` (`id`, `project_id`, `cadastral_lot_no`, `unit_id`, `lot_type`, `reservation_fee`, `price_per_sqm`, `lot_area_sqm`, `legal_misc_rate`, `status`, `created_at`, `updated_at`) VALUES (1,1,'1306','LA-1001','inner',50000.00,2600.00,300.00,10.00,'available','2026-06-14 06:55:11','2026-06-14 06:55:11'),(2,1,'1306','LA-1002','inner',50000.00,2600.00,300.00,10.00,'available','2026-06-14 06:55:11','2026-06-14 06:55:11'),(3,1,'1306','LA-1003','corner',50000.00,2700.00,350.00,10.00,'available','2026-06-14 06:55:11','2026-06-14 06:55:11'),(4,1,'1306','LA-1004','end',50000.00,2600.00,300.00,10.00,'available','2026-06-14 06:55:11','2026-06-14 06:55:11'),(5,1,'1306','LA-1005','inner',50000.00,2500.00,400.00,10.00,'available','2026-06-14 06:55:11','2026-06-14 06:55:11'),(6,1,'1307','LA-1006','inner',50000.00,2600.00,300.00,10.00,'available','2026-06-14 06:55:11','2026-06-14 06:55:11'),(7,1,'1307','LA-1007','corner',50000.00,2700.00,350.00,10.00,'active','2026-06-14 06:55:11','2026-06-14 09:18:42'),(8,1,'1307','LA-1008','end',50000.00,2600.00,300.00,10.00,'available','2026-06-14 06:55:11','2026-06-14 06:55:11'),(9,1,'1307','LA-1009','inner',50000.00,2500.00,450.00,10.00,'available','2026-06-14 06:55:11','2026-06-14 06:55:11'),(10,1,'1307','LA-1010','corner',50000.00,2700.00,500.00,10.00,'available','2026-06-14 06:55:11','2026-06-14 06:55:11'),(11,2,'2201','PE-1001','inner',50000.00,2200.00,300.00,10.00,'available','2026-06-14 06:55:11','2026-06-14 06:55:11'),(12,2,'2201','PE-1002','corner',50000.00,2300.00,350.00,10.00,'available','2026-06-14 06:55:11','2026-06-14 06:55:11'),(13,2,'2201','PE-1003','end',50000.00,2200.00,300.00,10.00,'available','2026-06-14 06:55:11','2026-06-14 06:55:11'),(14,2,'2202','PE-1004','inner',50000.00,2100.00,400.00,10.00,'available','2026-06-14 06:55:11','2026-06-14 06:55:11'),(15,2,'2202','PE-1005','corner',50000.00,2300.00,500.00,10.00,'available','2026-06-14 06:55:11','2026-06-14 06:55:11');
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
INSERT INTO `payments` VALUES (1,1,50000.00,'reservation_fee','bank_transfer','iujthygrfvd657456tg','2026-06-14','verified',2,'2026-06-14 16:20:29','2026-06-14 08:20:28','2026-06-14 08:20:28'),(2,1,250000.00,'downpayment','gcash','lkjhgfjikjhgtgh','2026-06-13','verified',1,'2026-06-14 17:18:42','2026-06-14 09:18:39','2026-06-14 09:18:42'),(3,1,68000.00,'monthly','cash',NULL,'2026-06-15','verified',1,'2026-06-15 12:51:56','2026-06-15 04:51:55','2026-06-15 04:51:55'),(4,1,20000.00,'downpayment','cash',NULL,'2026-06-15','verified',1,'2026-06-15 12:53:33','2026-06-15 04:53:33','2026-06-15 04:53:33');
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_document_requirements`
--

LOCK TABLES `project_document_requirements` WRITE;
/*!40000 ALTER TABLE `project_document_requirements` DISABLE KEYS */;
INSERT INTO `project_document_requirements` VALUES (1,2,1,1,'active',1,'2026-06-14 06:56:50','2026-06-14 06:56:50'),(2,2,2,1,'active',2,'2026-06-14 06:56:50','2026-06-14 06:56:50'),(3,2,3,1,'active',3,'2026-06-14 06:56:50','2026-06-14 06:56:50'),(4,2,4,1,'active',4,'2026-06-14 06:56:50','2026-06-14 06:56:50'),(5,2,5,1,'active',5,'2026-06-14 06:56:50','2026-06-14 06:56:50'),(6,2,8,1,'active',6,'2026-06-14 06:56:50','2026-06-14 06:56:50'),(7,2,9,1,'active',7,'2026-06-14 06:56:50','2026-06-14 06:56:50'),(8,2,10,0,'active',8,'2026-06-14 06:56:50','2026-06-14 06:56:50'),(9,1,1,1,'active',1,'2026-06-14 06:56:59','2026-06-14 06:56:59'),(10,1,2,1,'active',2,'2026-06-14 06:56:59','2026-06-14 06:56:59'),(11,1,3,1,'active',3,'2026-06-14 06:56:59','2026-06-14 06:56:59'),(12,1,4,1,'active',4,'2026-06-14 06:56:59','2026-06-14 06:56:59'),(13,1,5,1,'active',5,'2026-06-14 06:56:59','2026-06-14 06:56:59'),(14,1,8,1,'active',6,'2026-06-14 06:56:59','2026-06-14 06:56:59'),(15,1,9,1,'active',7,'2026-06-14 06:56:59','2026-06-14 06:56:59'),(16,1,10,0,'active',8,'2026-06-14 06:56:59','2026-06-14 06:56:59');
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
INSERT INTO `projects` VALUES (1,'Bailen','Bailen, Cavite','LA','IMELDA B. VILLALOBOS','AA-06-0005-00105','022-06-0005-003-04','active',1,NULL,'2026-06-14 06:53:24','2026-06-14 06:56:59'),(2,'Maragondon','Maragondon, Cavite','PE','SANTOS S. VILLAMOR','AA-06-0125-02105','023-05-0025-013-04','active',1,NULL,'2026-06-14 06:53:24','2026-06-14 06:56:50');
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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'company_name','D&C Prime Realty','2026-06-14 06:48:38','2026-06-14 06:48:38'),(2,'company_email','dcprime@gmail.com','2026-06-14 06:48:38','2026-06-14 06:48:38'),(3,'company_contact','09436532220','2026-06-14 06:48:38','2026-06-14 07:23:31'),(4,'company_address','Indang, Cavite','2026-06-14 06:48:38','2026-06-14 06:48:38'),(5,'system_status','active','2026-06-14 06:48:38','2026-06-14 06:48:38'),(6,'reservation_contact_name','Admin','2026-06-14 07:14:28','2026-06-14 07:14:28'),(7,'reservation_contact_email','admin@gmail.com','2026-06-14 07:14:28','2026-06-14 07:14:28'),(8,'reservation_contact_no','09055432543','2026-06-14 07:14:28','2026-06-14 07:16:06');
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
INSERT INTO `users` VALUES (1,'Super Admin','superadmin@gmail.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','super_admin','active',0,'2026-06-15 11:50:27',NULL,'2026-06-14 14:48:38','2026-06-14 06:48:38','2026-06-15 03:50:27'),(2,'Admin','admin@gmail.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','admin','active',0,'2026-06-14 15:36:04',NULL,'2026-06-14 14:48:38','2026-06-14 06:48:38','2026-06-14 07:36:04'),(3,'Rowena M. Cortez','rowena.cortez.bnm@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker_network_manager','active',0,'2026-06-15 11:49:51',NULL,'2026-06-14 14:48:38','2026-06-14 06:48:38','2026-06-15 03:49:51'),(4,'Broker One Under Rowena','broker.one@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,'2026-06-14 16:41:25',NULL,'2026-06-14 14:48:38','2026-06-14 06:48:38','2026-06-14 08:41:25'),(5,'Manager One A','manager.one.a@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,'2026-06-14 16:42:01',NULL,'2026-06-14 14:48:38','2026-06-14 06:48:38','2026-06-14 08:42:01'),(6,'Agent One A1','agent.one.a1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,'2026-06-14 17:54:32',NULL,'2026-06-14 14:48:38','2026-06-14 06:48:38','2026-06-14 09:54:32'),(7,'Broker Two Independent','broker.two@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,NULL,NULL,'2026-06-14 14:48:38','2026-06-14 06:48:38','2026-06-14 06:48:38'),(8,'Manager Two A','manager.two.a@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-14 14:48:38','2026-06-14 06:48:38','2026-06-14 06:48:38'),(9,'Agent Two A1','agent.two.a1@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-14 14:48:38','2026-06-14 06:48:38','2026-06-14 06:48:38');
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

-- Dump completed on 2026-06-15 13:01:45
