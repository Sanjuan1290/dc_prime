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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accredited_sellers`
--

LOCK TABLES `accredited_sellers` WRITE;
/*!40000 ALTER TABLE `accredited_sellers` DISABLE KEYS */;
INSERT INTO `accredited_sellers` VALUES (1,2,'Rowena BNM','rowena.bnm@test.com','09000000001','broker_network_manager',NULL,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',8.00,8.00,NULL,NULL,NULL,NULL,NULL,1,'2026-06-17 11:56:46'),(2,3,'Broker Alpha','broker.alpha@test.com','09000000002','broker',1,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',7.00,7.00,NULL,NULL,NULL,NULL,NULL,1,'2026-06-17 11:56:46'),(3,4,'Broker Bravo','broker.bravo@test.com','09000000003','broker',1,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',7.00,7.00,NULL,NULL,NULL,NULL,NULL,1,'2026-06-17 11:56:46'),(4,5,'Manager Alpha One','manager.alpha.one@test.com','09000000004','manager',2,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',6.00,NULL,6.00,1.00,NULL,NULL,NULL,1,'2026-06-17 11:56:46'),(5,6,'Manager Alpha Two','manager.alpha.two@test.com','09000000005','manager',2,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',6.00,NULL,6.00,1.00,NULL,NULL,NULL,1,'2026-06-17 11:56:46'),(6,7,'Manager Bravo One','manager.bravo.one@test.com','09000000006','manager',3,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',6.00,NULL,6.00,1.00,NULL,NULL,NULL,1,'2026-06-17 11:56:46'),(7,8,'Manager Bravo Two','manager.bravo.two@test.com','09000000007','manager',3,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',6.00,NULL,6.00,1.00,NULL,NULL,NULL,1,'2026-06-17 11:56:46'),(8,9,'Agent A1 One','agent.a1.one@test.com','09000000008','agent',4,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',5.00,NULL,5.00,1.00,5.00,NULL,NULL,1,'2026-06-17 11:56:46'),(9,10,'Agent A1 Two','agent.a1.two@test.com','09000000009','agent',4,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',5.00,NULL,5.00,1.00,5.00,NULL,NULL,1,'2026-06-17 11:56:46'),(10,11,'Agent A2 One','agent.a2.one@test.com','09000000010','agent',5,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',5.00,NULL,5.00,1.00,5.00,NULL,NULL,1,'2026-06-17 11:56:46'),(11,12,'Agent A2 Two','agent.a2.two@test.com','09000000011','agent',5,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',5.00,NULL,5.00,1.00,5.00,NULL,NULL,1,'2026-06-17 11:56:46'),(12,13,'Agent B1 One','agent.b1.one@test.com','09000000012','agent',6,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',5.00,NULL,5.00,1.00,5.00,NULL,NULL,1,'2026-06-17 11:56:46'),(13,14,'Agent B1 Two','agent.b1.two@test.com','09000000013','agent',6,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',5.00,NULL,5.00,1.00,5.00,NULL,NULL,1,'2026-06-17 11:56:46'),(14,15,'Agent B2 One','agent.b2.one@test.com','09000000014','agent',7,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',5.00,NULL,5.00,1.00,5.00,NULL,NULL,1,'2026-06-17 11:56:46'),(15,16,'Agent B2 Two','agent.b2.two@test.com','09000000015','agent',7,NULL,'active','2026-06-17','2026-06-17 03:56:46','2026-06-17 03:56:46',5.00,NULL,5.00,1.00,5.00,NULL,NULL,1,'2026-06-17 11:56:46');
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
) ENGINE=InnoDB AUTO_INCREMENT=204 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'update','Settings','Updated system settings','127.0.0.1','2026-06-17 03:39:38'),(2,1,'create','Documents','Created document client registration form seller\'s copy','127.0.0.1','2026-06-17 03:40:37'),(3,1,'create','Documents','Created document client registration form administrator copy','127.0.0.1','2026-06-17 03:40:41'),(4,1,'create','Documents','Created document intent to buy','127.0.0.1','2026-06-17 03:40:54'),(5,1,'create','Documents','Created document offer to buy & buyer\'s profile','127.0.0.1','2026-06-17 03:41:00'),(6,1,'create','Documents','Created document reservation agreement','127.0.0.1','2026-06-17 03:41:04'),(7,1,'create','Documents','Created document deed of sale','127.0.0.1','2026-06-17 03:41:09'),(8,1,'create','Documents','Created document contract to sell','127.0.0.1','2026-06-17 03:41:15'),(9,1,'create','Documents','Created document buyer counselling and acknowledgement form','127.0.0.1','2026-06-17 03:41:20'),(10,1,'create','Documents','Created document buyer acknowledgement form','127.0.0.1','2026-06-17 03:41:33'),(11,1,'create','Projects','Created project Bailen','127.0.0.1','2026-06-17 03:45:11'),(12,1,'create','Document Templates','Created document template sample temp 1','127.0.0.1','2026-06-17 03:45:30'),(13,1,'create','Document Templates','Created document template sample temp 2','127.0.0.1','2026-06-17 03:45:45'),(14,1,'create','Projects','Created project Maragondon','127.0.0.1','2026-06-17 03:47:08'),(15,1,'create','Listings','Created listing LA-204','127.0.0.1','2026-06-17 03:49:30'),(16,1,'update','Listing Documents','Updated listing document requirements for LA-204','127.0.0.1','2026-06-17 03:49:51'),(17,1,'update','Listing Documents','Updated listing document requirements for LA-204','127.0.0.1','2026-06-17 03:49:52'),(18,1,'update','Listing Documents','Updated listing document requirements for LA-204','127.0.0.1','2026-06-17 03:49:52'),(19,1,'update','Listing Documents','Updated listing document requirements for LA-204','127.0.0.1','2026-06-17 03:49:53'),(20,1,'update','Listings','Updated listing LA-204','127.0.0.1','2026-06-17 03:50:04'),(21,1,'update','Listing Documents','Updated listing document requirements for LA-204','127.0.0.1','2026-06-17 03:50:12'),(22,1,'create','Users','Created user robert san juan','127.0.0.1','2026-06-17 03:51:25'),(23,2,'login','Auth','robert san juan logged in','::1','2026-06-17 03:51:55'),(24,1,'login','Auth','Super Admin logged in','::1','2026-06-17 03:52:25'),(25,2,'login','Auth','robert san juan logged in','::1','2026-06-17 03:52:42'),(26,2,'change_password','Auth','robert san juan changed password','::1','2026-06-17 03:52:56'),(27,2,'login','Auth','robert san juan logged in','::1','2026-06-17 03:54:04'),(28,4,'login','Auth','Broker Bravo logged in','::1','2026-06-17 03:57:24'),(29,3,'login','Auth','Broker Alpha logged in','::1','2026-06-17 03:57:50'),(30,3,'login','Auth','Broker Alpha logged in','::1','2026-06-17 03:58:06'),(31,1,'login','Auth','Super Admin logged in','::1','2026-06-17 04:01:36'),(32,1,'create','Clients','Created client robert','127.0.0.1','2026-06-17 04:05:56'),(33,1,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-17 04:07:16'),(34,1,'update','Buyer Profile','Updated co-buyers for robert','127.0.0.1','2026-06-17 04:07:16'),(35,1,'update','Buyer Profile','Updated employment details for robert','127.0.0.1','2026-06-17 04:07:16'),(36,1,'update','Buyer Profile','Updated buyer profile for robert','127.0.0.1','2026-06-17 04:07:16'),(37,1,'reserve','Client Units','Reserved LA-204 for robert','127.0.0.1','2026-06-17 04:25:30'),(38,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-17 04:25:39'),(39,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-17 04:25:39'),(40,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-17 04:25:39'),(41,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-17 04:25:39'),(42,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-17 04:28:21'),(43,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-17 04:28:41'),(44,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-17 04:29:12'),(45,1,'update','Payments','Updated payment 3','127.0.0.1','2026-06-17 04:29:18'),(46,1,'update','Payments','Updated payment 2','127.0.0.1','2026-06-17 04:29:23'),(47,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-17 04:29:59'),(48,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-17 04:30:27'),(49,1,'hold','Commission Releases','Put release 5 on hold','127.0.0.1','2026-06-17 04:32:55'),(50,1,'unhold','Commission Releases','Restored release 5','127.0.0.1','2026-06-17 04:32:56'),(51,1,'create','Users','Created user admin','127.0.0.1','2026-06-17 04:33:32'),(52,17,'login','Auth','admin logged in','::1','2026-06-17 04:33:56'),(53,17,'change_password','Auth','admin changed password','::1','2026-06-17 04:34:03'),(54,17,'hold','Commission Releases','Put release 10 on hold','127.0.0.1','2026-06-17 04:34:14'),(55,17,'unhold','Commission Releases','Restored release 10','127.0.0.1','2026-06-17 04:34:15'),(56,1,'login','Auth','Super Admin logged in','::1','2026-06-17 04:34:31'),(57,1,'reset','Listing Documents','Reset listing documents for LA-204 to project defaults','127.0.0.1','2026-06-17 04:35:16'),(58,1,'update','Listing Documents','Updated listing document requirements for LA-204','127.0.0.1','2026-06-17 04:35:23'),(59,1,'update','Listing Documents','Updated listing document requirements for LA-204','127.0.0.1','2026-06-17 04:35:35'),(60,1,'update','Listing Documents','Updated listing document requirements for LA-204','127.0.0.1','2026-06-17 04:35:43'),(61,1,'update','Listing Documents','Updated listing document requirements for LA-204','127.0.0.1','2026-06-17 04:35:55'),(62,1,'update','Listing Documents','Updated listing document requirements for LA-204','127.0.0.1','2026-06-17 04:36:04'),(63,1,'hold','Commission Releases','Put release 5 on hold','127.0.0.1','2026-06-17 04:36:16'),(64,1,'unhold','Commission Releases','Restored release 5','127.0.0.1','2026-06-17 04:36:16'),(65,1,'reset','Listing Documents','Reset listing documents for LA-204 to project defaults','127.0.0.1','2026-06-17 04:36:39'),(66,1,'update','Listing Documents','Updated listing document requirements for LA-204','127.0.0.1','2026-06-17 04:36:40'),(67,1,'create','Cash Advances','Created cash advance for Agent A1 One','127.0.0.1','2026-06-17 04:40:13'),(68,1,'approve','Cash Advances','Approved cash advance 1','127.0.0.1','2026-06-17 04:40:22'),(69,1,'deduct','Cash Advances','Automatically deducted cash advance 1','127.0.0.1','2026-06-17 04:40:47'),(70,1,'create','Cash Advances','Created cash advance for Agent A1 One','127.0.0.1','2026-06-17 04:41:43'),(71,1,'approve','Cash Advances','Approved cash advance 2','127.0.0.1','2026-06-17 04:41:44'),(72,1,'deduct','Cash Advances','Automatically deducted cash advance 2','127.0.0.1','2026-06-17 04:41:44'),(73,2,'login','Auth','Rowena BNM logged in','::1','2026-06-17 04:44:24'),(74,17,'login','Auth','admin logged in','::1','2026-06-17 04:45:36'),(75,17,'release','Commission Releases','Marked release 1 as released','127.0.0.1','2026-06-17 04:48:33'),(76,1,'login','Auth','Super Admin logged in','::1','2026-06-17 05:02:02'),(77,1,'retention_eligible','Commission Releases','Marked retention eligible for client unit 1','127.0.0.1','2026-06-17 05:03:12'),(78,1,'release','Commission Releases','Marked release 5 as released','127.0.0.1','2026-06-17 05:03:22'),(79,1,'release','Commission Releases','Marked release 2 as released','127.0.0.1','2026-06-17 05:03:28'),(80,1,'release','Commission Releases','Marked release 3 as released','127.0.0.1','2026-06-17 05:03:29'),(81,1,'release','Commission Releases','Marked release 4 as released','127.0.0.1','2026-06-17 05:03:29'),(82,1,'update','Listing Documents','Updated listing document requirements for LA-204','127.0.0.1','2026-06-17 05:05:06'),(83,1,'login','Auth','Super Admin logged in','::1','2026-06-17 05:23:05'),(84,1,'update','Settings','Updated system settings','127.0.0.1','2026-06-17 05:32:50'),(85,1,'update','Settings','Updated system settings','127.0.0.1','2026-06-17 05:33:10'),(86,1,'update','Settings','Updated system settings','127.0.0.1','2026-06-17 05:33:29'),(87,2,'login','Auth','Rowena BNM logged in','::1','2026-06-17 05:33:37'),(88,17,'login','Auth','admin logged in','::1','2026-06-17 05:34:01'),(89,17,'update','Settings','Updated system settings','127.0.0.1','2026-06-17 05:35:29'),(90,17,'create','Cash Advances','Created cash advance for Rowena BNM','127.0.0.1','2026-06-17 05:55:01'),(91,1,'login','Auth','Super Admin logged in','::1','2026-06-17 05:55:22'),(92,1,'reject','Cash Advances','Rejected cash advance 3','127.0.0.1','2026-06-17 05:55:53'),(93,1,'update','Listings','Updated listing LA-202','127.0.0.1','2026-06-17 06:12:09'),(94,1,'update','Listings','Updated listing LA-206 | Old Unit IDs: LA-204','127.0.0.1','2026-06-17 06:12:26'),(95,1,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-17 06:13:25'),(96,1,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-17 06:13:26'),(97,1,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-17 06:13:27'),(98,1,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-17 06:13:27'),(99,1,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-17 06:13:29'),(100,1,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-17 06:13:30'),(101,1,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-17 06:13:30'),(102,1,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-17 06:13:30'),(103,1,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-17 06:13:31'),(104,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-17 06:13:45'),(105,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-17 06:13:45'),(106,1,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-17 06:17:18'),(107,1,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-17 06:17:18'),(108,1,'create','Client Documents','Created listing-based document checklist for client unit 1','127.0.0.1','2026-06-17 06:17:19'),(109,1,'create','Listings','Created listing LA-0203','127.0.0.1','2026-06-17 06:22:24'),(110,1,'update','Listings','Updated listing LA-0203','127.0.0.1','2026-06-17 06:27:30'),(111,2,'login','Auth','Rowena BNM logged in','::1','2026-06-17 06:55:34'),(112,1,'login','Auth','Super Admin logged in','::1','2026-06-17 06:56:22'),(113,2,'login','Auth','Rowena BNM logged in','::1','2026-06-17 06:59:46'),(114,1,'login','Auth','Super Admin logged in','::1','2026-06-17 07:00:02'),(115,1,'create','Listings','Created listing PE-111','127.0.0.1','2026-06-17 07:46:51'),(116,1,'delete','Listings','Deleted listing PE-111','127.0.0.1','2026-06-17 07:47:00'),(117,1,'update','Listings','Updated listing LA-0203','127.0.0.1','2026-06-17 08:16:08'),(118,1,'update','Listings','Updated listing LA-0203','127.0.0.1','2026-06-17 08:31:33'),(119,1,'update','Listings','Updated listing LA-206 | Old Unit IDs: LA-204, LA-202','127.0.0.1','2026-06-17 08:31:55'),(120,1,'update','Listings','Updated listing LA-206 | Old Unit IDs: LA-204, LA-202','127.0.0.1','2026-06-17 08:32:07'),(121,1,'update','Listings','Updated listing LA-0203','127.0.0.1','2026-06-17 08:32:26'),(122,1,'update','Listings','Updated listing LA-0203','127.0.0.1','2026-06-17 08:32:53'),(123,1,'update','Listings','Updated listing LA-0203','127.0.0.1','2026-06-17 08:33:04'),(124,1,'login','Auth','Super Admin logged in','::1','2026-06-19 01:29:30'),(125,1,'update','Settings','Updated system settings','127.0.0.1','2026-06-19 01:33:49'),(126,2,'login','Auth','Rowena BNM logged in','::1','2026-06-19 01:33:54'),(127,1,'login','Auth','Super Admin logged in','::1','2026-06-19 01:34:06'),(128,1,'update','Listings','Updated listing LA-0203','127.0.0.1','2026-06-19 01:34:27'),(129,1,'update','Listings','Updated listing LA-0203','127.0.0.1','2026-06-19 01:35:14'),(130,17,'login','Auth','admin logged in','::1','2026-06-19 01:36:26'),(131,17,'update','Settings','Updated system settings','127.0.0.1','2026-06-19 01:36:42'),(132,5,'login','Auth','Manager Alpha One logged in','::1','2026-06-19 01:46:45'),(133,1,'login','Auth','Super Admin logged in','::1','2026-06-19 01:47:56'),(134,1,'login','Auth','Super Admin logged in','::1','2026-06-19 01:54:31'),(135,1,'login','Auth','Super Admin logged in','::1','2026-06-19 03:59:58'),(136,1,'login','Auth','Super Admin logged in','::1','2026-06-19 04:12:05'),(137,1,'login','Auth','Super Admin logged in','::1','2026-06-19 07:16:33'),(138,1,'login','Auth','Super Admin logged in','::1','2026-06-19 07:47:49'),(139,1,'login','Auth','Super Admin logged in','::1','2026-06-19 07:48:29'),(140,1,'login','Auth','Super Admin logged in','::1','2026-06-19 08:08:18'),(141,1,'login','Auth','Super Admin logged in','::1','2026-06-19 08:29:51'),(142,1,'login','Auth','Super Admin logged in','::1','2026-06-19 08:33:48'),(143,1,'login','Auth','Super Admin logged in','::1','2026-06-19 08:56:07'),(144,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-19 08:58:08'),(145,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-19 08:58:08'),(146,1,'login','Auth','Super Admin logged in','::1','2026-06-19 09:25:07'),(147,1,'login','Auth','Super Admin logged in','::1','2026-06-19 10:06:40'),(148,1,'login','Auth','Super Admin logged in','::1','2026-06-20 02:15:35'),(149,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-20 03:35:26'),(150,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-20 03:35:26'),(151,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-20 03:35:27'),(152,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-20 03:35:27'),(153,1,'login','Auth','Super Admin logged in','::1','2026-06-20 03:50:58'),(154,1,'login','Auth','Super Admin logged in','::1','2026-06-20 04:04:01'),(155,1,'create','Listings','Created listing LA-0204','127.0.0.1','2026-06-20 06:01:42'),(156,1,'create','Clients','Created client nick','127.0.0.1','2026-06-20 06:10:37'),(157,1,'update','Buyer Profile','Updated buyer profile for nick','127.0.0.1','2026-06-20 06:12:49'),(158,1,'update','Buyer Profile','Updated co-buyers for nick','127.0.0.1','2026-06-20 06:12:49'),(159,1,'update','Buyer Profile','Updated employment details for nick','127.0.0.1','2026-06-20 06:12:49'),(160,1,'update','Buyer Profile','Updated buyer profile for nick','127.0.0.1','2026-06-20 06:12:49'),(161,1,'update','Listings','Updated listing LA-0203','127.0.0.1','2026-06-20 06:14:53'),(162,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-20 06:23:19'),(163,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-20 06:23:19'),(164,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-20 06:23:19'),(165,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-20 06:23:19'),(166,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-20 06:23:58'),(167,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-20 06:23:58'),(168,1,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-20 06:26:52'),(169,1,'reserve','Client Units','Reserved LA-0203 for nick','127.0.0.1','2026-06-20 06:57:41'),(170,1,'payment','Payments','Added payment for client unit 2','127.0.0.1','2026-06-20 06:59:57'),(171,2,'login','Auth','Rowena BNM logged in','::1','2026-06-20 07:08:42'),(172,1,'login','Auth','Super Admin logged in','::1','2026-06-20 07:24:21'),(173,2,'login','Auth','Rowena BNM logged in','::1','2026-06-20 07:25:28'),(174,3,'login','Auth','Broker Alpha logged in','::1','2026-06-20 07:26:46'),(175,1,'login','Auth','Super Admin logged in','::1','2026-06-20 07:29:41'),(176,1,'create','Listings','Created listing LA-303','127.0.0.1','2026-06-20 08:22:54'),(177,1,'create','Clients','Created client RONRON','127.0.0.1','2026-06-20 08:25:55'),(178,1,'update','Buyer Profile','Updated buyer profile for RONRON','127.0.0.1','2026-06-20 08:27:37'),(179,1,'update','Buyer Profile','Updated co-buyers for RONRON','127.0.0.1','2026-06-20 08:27:37'),(180,1,'update','Buyer Profile','Updated employment details for RONRON','127.0.0.1','2026-06-20 08:27:37'),(181,1,'update','Buyer Profile','Updated buyer profile for RONRON','127.0.0.1','2026-06-20 08:27:37'),(182,1,'reserve','Client Units','Reserved LA-303 for RONRON','127.0.0.1','2026-06-20 08:30:15'),(183,1,'payment','Payments','Added payment for client unit 3','127.0.0.1','2026-06-20 08:30:59'),(184,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-20 08:31:33'),(185,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 1','127.0.0.1','2026-06-20 08:31:33'),(186,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-20 08:31:33'),(187,1,'print','Client Forms','Printed statement_of_account for client unit 1','','2026-06-20 08:31:33'),(188,1,'print','Client Forms','Printed statement_of_account for client unit 3','127.0.0.1','2026-06-20 08:31:35'),(189,1,'print','Client Forms','Printed statement_of_account for client unit 3','127.0.0.1','2026-06-20 08:31:35'),(190,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 3','127.0.0.1','2026-06-20 08:31:56'),(191,1,'print','Client Forms','Printed offer_to_buy_buyers_profile for client unit 3','127.0.0.1','2026-06-20 08:31:56'),(192,2,'login','Auth','Rowena BNM logged in','::1','2026-06-20 08:34:45'),(193,1,'login','Auth','Super Admin logged in','::1','2026-06-20 08:36:00'),(194,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-20 22:54:54'),(195,1,'print','Client Forms','Printed statement_of_account for client unit 1','127.0.0.1','2026-06-20 22:54:54'),(196,1,'payment','Payments','Added payment for client unit 3','127.0.0.1','2026-06-20 23:04:12'),(197,1,'update','Payments','Updated payment 8','127.0.0.1','2026-06-20 23:04:17'),(198,1,'print','Client Forms','Printed statement_of_account for client unit 3','127.0.0.1','2026-06-20 23:04:30'),(199,1,'print','Client Forms','Printed statement_of_account for client unit 3','127.0.0.1','2026-06-20 23:04:30'),(200,1,'update','Payments','Updated payment 8','127.0.0.1','2026-06-20 23:07:40'),(201,1,'payment','Payments','Added payment for client unit 3','127.0.0.1','2026-06-20 23:08:09'),(202,1,'payment','Payments','Added payment for client unit 3','127.0.0.1','2026-06-20 23:08:19'),(203,1,'payment','Payments','Added payment for client unit 3','127.0.0.1','2026-06-20 23:08:35');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_advance_deductions`
--

LOCK TABLES `cash_advance_deductions` WRITE;
/*!40000 ALTER TABLE `cash_advance_deductions` DISABLE KEYS */;
INSERT INTO `cash_advance_deductions` VALUES (1,1,1,2000.00,1,'Automatic deduction from Cash Advance #1','2026-06-17 04:40:47'),(2,2,1,2460.00,1,'Automatic deduction from Cash Advance #2','2026-06-17 04:41:44'),(3,2,2,4460.00,1,'Automatic deduction from Cash Advance #2','2026-06-17 04:41:44'),(4,2,3,4460.00,1,'Automatic deduction from Cash Advance #2','2026-06-17 04:41:44'),(5,2,4,3345.00,1,'Automatic deduction from Cash Advance #2','2026-06-17 04:41:44');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_advances`
--

LOCK TABLES `cash_advances` WRITE;
/*!40000 ALTER TABLE `cash_advances` DISABLE KEYS */;
INSERT INTO `cash_advances` VALUES (1,8,1,NULL,2000.00,0.00,'deducted','2026-06-17 12:40:13','2026-06-17 12:40:22',1,'2026-06-17 12:40:47',NULL,NULL,NULL,'2026-06-17 04:40:13','2026-06-17 04:40:47'),(2,8,1,NULL,14725.00,0.00,'deducted','2026-06-17 12:41:44','2026-06-17 12:41:44',1,'2026-06-17 12:41:44',NULL,NULL,NULL,'2026-06-17 04:41:43','2026-06-17 04:41:44'),(3,1,1,NULL,1000.00,1000.00,'rejected','2026-06-17 13:55:01',NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-17 05:55:01','2026-06-17 05:55:53');
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
INSERT INTO `client_buyers` VALUES (1,1,1,'second_buyer','nick sanjuan','2002-03-07','hongkong ','filipino','male','single','bella vista ','4107','bella vista ','4107','08876535454','09876565','nick@gmail.com','5453-435634-453-0000','2026-06-17 04:25:30','2026-06-17 04:25:30'),(2,3,3,'second_buyer','erson','1997-12-24','paliparan','filipino','male','single','dafsdf','1222',NULL,NULL,'09056543654','094534534','erson@gmail.com','34324-34234-2342','2026-06-20 08:30:15','2026-06-20 08:30:15');
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
) ENGINE=InnoDB AUTO_INCREMENT=143 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_document_list`
--

LOCK TABLES `client_document_list` WRITE;
/*!40000 ALTER TABLE `client_document_list` DISABLE KEYS */;
INSERT INTO `client_document_list` VALUES (1,1,2,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:25:30'),(2,1,3,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:25:30'),(3,1,4,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:25:30'),(4,1,5,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:25:30'),(5,1,6,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:25:30'),(6,1,7,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:25:30'),(7,1,8,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:25:30'),(8,1,9,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:25:30'),(9,1,1,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:25:30'),(125,2,1,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(126,2,2,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(127,2,3,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(128,2,4,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(129,2,5,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(130,2,6,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(131,2,7,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(132,2,8,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(133,2,9,1,'project_default',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(134,3,1,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 08:30:15','2026-06-20 08:30:15'),(135,3,2,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 08:30:15','2026-06-20 08:30:15'),(136,3,3,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 08:30:15','2026-06-20 08:30:15'),(137,3,4,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 08:30:15','2026-06-20 08:30:15'),(138,3,5,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 08:30:15','2026-06-20 08:30:15'),(139,3,6,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 08:30:15','2026-06-20 08:30:15'),(140,3,7,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 08:30:15','2026-06-20 08:30:15'),(141,3,8,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 08:30:15','2026-06-20 08:30:15'),(142,3,9,1,'listing_override',NULL,'google_drive',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'not_submitted',NULL,NULL,'2026-06-20 08:30:15','2026-06-20 08:30:15');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_employment_details`
--

LOCK TABLES `client_employment_details` WRITE;
/*!40000 ALTER TABLE `client_employment_details` DISABLE KEYS */;
INSERT INTO `client_employment_details` VALUES (1,1,NULL,'principal','employed_private',NULL,'dc prim','indang cavite',NULL,'it',NULL,16000.00,'2026-06-17 04:07:16','2026-06-17 04:07:16'),(2,1,1,'co_buyer','employed_private',NULL,'jobili','JoBILEY',NULL,'cook','cook',80000.00,'2026-06-17 04:25:30','2026-06-17 04:25:30'),(3,2,NULL,'principal','employed_private',NULL,'it','dfsads',NULL,'dasfs',NULL,60000.00,'2026-06-20 06:12:49','2026-06-20 06:12:49'),(4,3,NULL,'principal','employed_government',NULL,'gob','paliparan',NULL,'gob',NULL,60000.00,'2026-06-20 08:27:37','2026-06-20 08:27:37'),(5,3,2,'co_buyer','employed_private',NULL,'IT','paliparan',NULL,'IT',NULL,40000.01,'2026-06-20 08:30:15','2026-06-20 08:30:15');
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
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_unit_form_prints`
--

LOCK TABLES `client_unit_form_prints` WRITE;
/*!40000 ALTER TABLE `client_unit_form_prints` DISABLE KEYS */;
INSERT INTO `client_unit_form_prints` VALUES (1,1,'offer_to_buy_buyers_profile',1,'2026-06-17 12:25:39',NULL),(2,1,'offer_to_buy_buyers_profile',1,'2026-06-17 12:25:39',NULL),(3,1,'statement_of_account',1,'2026-06-17 12:25:39',NULL),(4,1,'statement_of_account',1,'2026-06-17 12:25:39',NULL),(5,1,'offer_to_buy_buyers_profile',1,'2026-06-17 14:13:45',NULL),(6,1,'offer_to_buy_buyers_profile',1,'2026-06-17 14:13:45',NULL),(7,1,'statement_of_account',1,'2026-06-19 16:58:08',NULL),(8,1,'statement_of_account',1,'2026-06-19 16:58:08',NULL),(9,1,'statement_of_account',1,'2026-06-20 11:35:26',NULL),(10,1,'statement_of_account',1,'2026-06-20 11:35:26',NULL),(11,1,'offer_to_buy_buyers_profile',1,'2026-06-20 11:35:27',NULL),(12,1,'offer_to_buy_buyers_profile',1,'2026-06-20 11:35:27',NULL),(13,1,'statement_of_account',1,'2026-06-20 14:23:19',NULL),(14,1,'statement_of_account',1,'2026-06-20 14:23:19',NULL),(15,1,'offer_to_buy_buyers_profile',1,'2026-06-20 14:23:19',NULL),(16,1,'offer_to_buy_buyers_profile',1,'2026-06-20 14:23:19',NULL),(17,1,'offer_to_buy_buyers_profile',1,'2026-06-20 14:23:58',NULL),(18,1,'offer_to_buy_buyers_profile',1,'2026-06-20 14:23:58',NULL),(19,1,'offer_to_buy_buyers_profile',1,'2026-06-20 16:31:33',NULL),(20,1,'offer_to_buy_buyers_profile',1,'2026-06-20 16:31:33',NULL),(21,1,'statement_of_account',1,'2026-06-20 16:31:33',NULL),(22,1,'statement_of_account',1,'2026-06-20 16:31:33',NULL),(23,3,'statement_of_account',1,'2026-06-20 16:31:35',NULL),(24,3,'statement_of_account',1,'2026-06-20 16:31:35',NULL),(25,3,'offer_to_buy_buyers_profile',1,'2026-06-20 16:31:56',NULL),(26,3,'offer_to_buy_buyers_profile',1,'2026-06-20 16:31:56',NULL),(27,1,'statement_of_account',1,'2026-06-21 06:54:54',NULL),(28,1,'statement_of_account',1,'2026-06-21 06:54:54',NULL),(29,3,'statement_of_account',1,'2026-06-21 07:04:30',NULL),(30,3,'statement_of_account',1,'2026-06-21 07:04:30',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_units`
--

LOCK TABLES `client_units` WRITE;
/*!40000 ALTER TABLE `client_units` DISABLE KEYS */;
INSERT INTO `client_units` VALUES (1,1,1,1,8,'fully_paid','installment','and_account',0.00,20,'2026-06-17','2026-06-20',490600.00,50000.00,23590.00,15.00,2,0.00,0.00,23590.00,0.00,417010.00,20,6.50,22205.78,'pending_profile',NULL,NULL,NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-20 06:26:52','distributed'),(2,2,2,1,9,'reserved','installment','single',560500.00,20,'2026-06-20','2026-06-20',610500.00,50000.00,41575.00,15.00,3,0.00,0.00,41575.00,0.00,518925.00,36,0.00,14414.58,'pending_profile',NULL,NULL,NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:59:57','distributed'),(3,3,6,1,1,'active','installment','and_account',231000.00,20,'2026-06-20','2026-06-20',330000.00,50000.00,49000.00,30.00,3,0.00,0.00,49000.00,0.00,231000.00,36,0.00,6416.67,'pending_profile',NULL,NULL,NULL,NULL,NULL,'2026-06-20 08:30:15','2026-06-20 23:08:35','distributed');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (1,'robert',NULL,'single','2005-01-18','imus','filipino','male','single','robertrenbysanjuan@gmail.com','09053535353',NULL,'5454-34343-6555-00000','complete','gen tri','gen tri','4107','bella vista ','4107','REGION 4A',8,'2026-06-17 04:05:56','2026-06-17 04:07:16'),(2,'nick',NULL,'single','2002-03-07','imus','filipino','male','single','nick@gmail.com','090433434','5687','n/a','complete','gen tri','gen tri','4102',NULL,NULL,'region 4a',9,'2026-06-20 06:10:37','2026-06-20 06:12:49'),(3,'RONRON',NULL,'single','1994-03-08','paliparan','filipino','male','single','ron@gmail.com','09023423423',NULL,'23423-234234-324-000','complete','gen tri','gen tri','3017',NULL,NULL,'region 4-A',1,'2026-06-20 08:25:55','2026-06-20 08:27:37');
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
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_releases`
--

LOCK TABLES `commission_releases` WRITE;
/*!40000 ALTER TABLE `commission_releases` DISABLE KEYS */;
INSERT INTO `commission_releases` VALUES (1,1,'1st_release',20.00,20.00,20.00,4460.00,4460.00,0.00,'released','2026-06-17 12:48:33',17,NULL,'2026-06-17 04:25:30','2026-06-17 04:48:33'),(2,1,'2nd_release',40.00,20.00,40.00,4460.00,4460.00,0.00,'released','2026-06-17 13:03:28',1,NULL,'2026-06-17 04:25:30','2026-06-17 05:03:28'),(3,1,'3rd_release',60.00,20.00,60.00,4460.00,4460.00,0.00,'released','2026-06-17 13:03:29',1,NULL,'2026-06-17 04:25:30','2026-06-17 05:03:29'),(4,1,'4th_release',75.00,15.00,75.00,3345.00,3345.00,0.00,'released','2026-06-17 13:03:29',1,NULL,'2026-06-17 04:25:30','2026-06-17 05:03:29'),(5,1,'retention',NULL,25.00,100.00,5575.00,0.00,5575.00,'released','2026-06-17 13:03:22',1,NULL,'2026-06-17 04:25:30','2026-06-17 05:03:22'),(6,2,'1st_release',20.00,20.00,20.00,892.00,0.00,892.00,'eligible',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:29:59'),(7,2,'2nd_release',40.00,20.00,40.00,892.00,0.00,892.00,'eligible',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:30:27'),(8,2,'3rd_release',60.00,20.00,60.00,892.00,0.00,892.00,'eligible',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:30:27'),(9,2,'4th_release',75.00,15.00,75.00,669.00,0.00,669.00,'eligible',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:30:27'),(10,2,'retention',NULL,25.00,100.00,1115.00,0.00,1115.00,'pending',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 06:12:09'),(11,3,'1st_release',20.00,20.00,20.00,892.00,0.00,892.00,'eligible',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:29:59'),(12,3,'2nd_release',40.00,20.00,40.00,892.00,0.00,892.00,'eligible',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:30:27'),(13,3,'3rd_release',60.00,20.00,60.00,892.00,0.00,892.00,'eligible',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:30:27'),(14,3,'4th_release',75.00,15.00,75.00,669.00,0.00,669.00,'eligible',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:30:27'),(15,3,'retention',NULL,25.00,100.00,1115.00,0.00,1115.00,'pending',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 06:12:09'),(16,4,'1st_release',20.00,20.00,20.00,892.00,0.00,892.00,'eligible',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:29:59'),(17,4,'2nd_release',40.00,20.00,40.00,892.00,0.00,892.00,'eligible',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:30:27'),(18,4,'3rd_release',60.00,20.00,60.00,892.00,0.00,892.00,'eligible',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:30:27'),(19,4,'4th_release',75.00,15.00,75.00,669.00,0.00,669.00,'eligible',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 04:30:27'),(20,4,'retention',NULL,25.00,100.00,1115.00,0.00,1115.00,'pending',NULL,NULL,NULL,'2026-06-17 04:25:30','2026-06-17 06:12:09'),(21,5,'1st_release',20.00,20.00,20.00,5550.00,0.00,5550.00,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(22,5,'2nd_release',40.00,20.00,40.00,5550.00,0.00,5550.00,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(23,5,'3rd_release',60.00,20.00,60.00,5550.00,0.00,5550.00,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(24,5,'4th_release',75.00,15.00,75.00,4162.50,0.00,4162.50,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(25,5,'retention',NULL,25.00,100.00,6937.50,0.00,6937.50,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(26,6,'1st_release',20.00,20.00,20.00,1110.00,0.00,1110.00,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(27,6,'2nd_release',40.00,20.00,40.00,1110.00,0.00,1110.00,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(28,6,'3rd_release',60.00,20.00,60.00,1110.00,0.00,1110.00,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(29,6,'4th_release',75.00,15.00,75.00,832.50,0.00,832.50,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(30,6,'retention',NULL,25.00,100.00,1387.50,0.00,1387.50,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(31,7,'1st_release',20.00,20.00,20.00,1110.00,0.00,1110.00,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(32,7,'2nd_release',40.00,20.00,40.00,1110.00,0.00,1110.00,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(33,7,'3rd_release',60.00,20.00,60.00,1110.00,0.00,1110.00,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(34,7,'4th_release',75.00,15.00,75.00,832.50,0.00,832.50,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(35,7,'retention',NULL,25.00,100.00,1387.50,0.00,1387.50,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(36,8,'1st_release',20.00,20.00,20.00,1110.00,0.00,1110.00,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(37,8,'2nd_release',40.00,20.00,40.00,1110.00,0.00,1110.00,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(38,8,'3rd_release',60.00,20.00,60.00,1110.00,0.00,1110.00,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(39,8,'4th_release',75.00,15.00,75.00,832.50,0.00,832.50,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(40,8,'retention',NULL,25.00,100.00,1387.50,0.00,1387.50,'pending',NULL,NULL,NULL,'2026-06-20 06:57:41','2026-06-20 06:57:41'),(41,9,'1st_release',20.00,20.00,20.00,4800.00,0.00,4800.00,'eligible',NULL,NULL,NULL,'2026-06-20 08:30:15','2026-06-20 23:08:09'),(42,9,'2nd_release',40.00,20.00,40.00,4800.00,0.00,4800.00,'pending',NULL,NULL,NULL,'2026-06-20 08:30:15','2026-06-20 23:07:40'),(43,9,'3rd_release',60.00,20.00,60.00,4800.00,0.00,4800.00,'pending',NULL,NULL,NULL,'2026-06-20 08:30:15','2026-06-20 08:30:15'),(44,9,'4th_release',75.00,15.00,75.00,3600.00,0.00,3600.00,'pending',NULL,NULL,NULL,'2026-06-20 08:30:15','2026-06-20 08:30:15'),(45,9,'retention',NULL,25.00,100.00,6000.00,0.00,6000.00,'pending',NULL,NULL,NULL,'2026-06-20 08:30:15','2026-06-20 08:30:15');
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
INSERT INTO `commission_role_defaults` VALUES (1,'bnm_pool_rate','Broker Network Manager Pool Rate','broker_network_manager','pool',8.00,1,'2026-06-17 03:56:46','2026-06-17 03:56:46'),(2,'broker_pool_rate','Broker Pool Rate','broker','pool',7.00,1,'2026-06-17 03:56:46','2026-06-17 03:56:46'),(3,'manager_personal_rate','Manager Personal Rate','manager','personal',6.00,1,'2026-06-17 03:56:46','2026-06-17 03:56:46'),(4,'agent_personal_rate','Agent Personal Rate','agent','personal',5.00,1,'2026-06-17 03:56:46','2026-06-17 03:56:46'),(5,'direct_to_developer_rate','Direct to Developer Rate','agent','direct_to_developer',5.00,1,'2026-06-17 03:56:46','2026-06-17 03:56:46'),(6,'agent_override_rate','Agent Override Rate','agent','override',1.00,1,'2026-06-17 03:56:46','2026-06-17 03:56:46'),(7,'manager_override_rate','Manager Override Rate','manager','override',1.00,1,'2026-06-17 03:56:46','2026-06-17 03:56:46'),(8,'broker_override_rate','Broker Override Rate','broker','override',1.00,1,'2026-06-17 03:56:46','2026-06-17 03:56:46');
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commissions`
--

LOCK TABLES `commissions` WRITE;
/*!40000 ALTER TABLE `commissions` DISABLE KEYS */;
INSERT INTO `commissions` VALUES (1,1,8,'agent',5.00,446000.00,22300.00,'main',NULL,'distributed',0.00,NULL,NULL,NULL,5575.00,'partially_released','Auto-generated hierarchy commission from reservation of LA-204','2026-06-17 04:25:30','2026-06-17 05:03:22',NULL),(2,1,4,'manager',1.00,446000.00,4460.00,'override',1,'distributed',0.00,NULL,NULL,'Manager residual release milestone',0.00,'active','Auto-generated hierarchy commission from reservation of LA-204','2026-06-17 04:25:30','2026-06-17 04:25:30',NULL),(3,1,2,'broker',1.00,446000.00,4460.00,'override',1,'distributed',0.00,NULL,NULL,'Broker residual release milestone',0.00,'active','Auto-generated hierarchy commission from reservation of LA-204','2026-06-17 04:25:30','2026-06-17 04:25:30',NULL),(4,1,1,'broker_network_manager',1.00,446000.00,4460.00,'override',1,'distributed',0.00,NULL,NULL,'Broker Network Manager residual release milestone',0.00,'active','Auto-generated hierarchy commission from reservation of LA-204','2026-06-17 04:25:30','2026-06-17 04:25:30',NULL),(5,2,9,'agent',5.00,555000.00,27750.00,'main',NULL,'distributed',0.00,NULL,NULL,NULL,0.00,'active','Auto-generated hierarchy commission from reservation of LA-0203','2026-06-20 06:57:41','2026-06-20 06:57:41',NULL),(6,2,4,'manager',1.00,555000.00,5550.00,'override',5,'distributed',0.00,NULL,NULL,'Manager residual release milestone',0.00,'active','Auto-generated hierarchy commission from reservation of LA-0203','2026-06-20 06:57:41','2026-06-20 06:57:41',NULL),(7,2,2,'broker',1.00,555000.00,5550.00,'override',5,'distributed',0.00,NULL,NULL,'Broker residual release milestone',0.00,'active','Auto-generated hierarchy commission from reservation of LA-0203','2026-06-20 06:57:41','2026-06-20 06:57:41',NULL),(8,2,1,'broker_network_manager',1.00,555000.00,5550.00,'override',5,'distributed',0.00,NULL,NULL,'Broker Network Manager residual release milestone',0.00,'active','Auto-generated hierarchy commission from reservation of LA-0203','2026-06-20 06:57:41','2026-06-20 06:57:41',NULL),(9,3,1,'broker_network_manager',8.00,300000.00,24000.00,'main',NULL,'distributed',0.00,NULL,NULL,NULL,0.00,'active','Auto-generated hierarchy commission from reservation of LA-303','2026-06-20 08:30:15','2026-06-20 08:30:15',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_template_items`
--

LOCK TABLES `document_template_items` WRITE;
/*!40000 ALTER TABLE `document_template_items` DISABLE KEYS */;
INSERT INTO `document_template_items` VALUES (1,1,1,1,'active',1,'2026-06-17 03:45:30','2026-06-17 03:45:30'),(2,1,3,1,'active',2,'2026-06-17 03:45:30','2026-06-17 03:45:30'),(3,1,5,1,'active',3,'2026-06-17 03:45:30','2026-06-17 03:45:30'),(4,1,7,1,'active',4,'2026-06-17 03:45:30','2026-06-17 03:45:30'),(5,2,2,1,'active',1,'2026-06-17 03:45:45','2026-06-17 03:45:45'),(6,2,4,1,'active',2,'2026-06-17 03:45:45','2026-06-17 03:45:45'),(7,2,6,1,'active',3,'2026-06-17 03:45:45','2026-06-17 03:45:45'),(8,2,8,1,'active',4,'2026-06-17 03:45:45','2026-06-17 03:45:45'),(9,2,9,1,'active',5,'2026-06-17 03:45:45','2026-06-17 03:45:45');
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
INSERT INTO `document_templates` VALUES (1,'sample temp 1',NULL,'active',1,'2026-06-17 03:45:30','2026-06-17 03:45:30'),(2,'sample temp 2',NULL,'active',1,'2026-06-17 03:45:45','2026-06-17 03:45:45');
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (1,'client registration form seller\'s copy',NULL,0,1,'active','2026-06-17 03:40:37','2026-06-17 03:40:37'),(2,'client registration form administrator copy',NULL,0,1,'active','2026-06-17 03:40:41','2026-06-17 03:40:41'),(3,'intent to buy',NULL,0,0,'active','2026-06-17 03:40:54','2026-06-17 03:40:54'),(4,'offer to buy & buyer\'s profile',NULL,0,1,'active','2026-06-17 03:41:00','2026-06-17 03:41:00'),(5,'reservation agreement',NULL,0,0,'active','2026-06-17 03:41:04','2026-06-17 03:41:04'),(6,'deed of sale',NULL,0,0,'active','2026-06-17 03:41:09','2026-06-17 03:41:09'),(7,'contract to sell',NULL,0,0,'active','2026-06-17 03:41:15','2026-06-17 03:41:15'),(8,'buyer counselling and acknowledgement form',NULL,0,1,'active','2026-06-17 03:41:20','2026-06-17 03:41:20'),(9,'buyer acknowledgement form',NULL,0,1,'active','2026-06-17 03:41:33','2026-06-17 03:41:33');
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
) ENGINE=InnoDB AUTO_INCREMENT=166 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_document_requirements`
--

LOCK TABLES `listing_document_requirements` WRITE;
/*!40000 ALTER TABLE `listing_document_requirements` DISABLE KEYS */;
INSERT INTO `listing_document_requirements` VALUES (132,1,9,0,'active',1,'listing_override','2026-06-17 05:05:06','2026-06-17 05:05:06'),(133,2,1,1,'active',1,'project_default','2026-06-17 06:22:24','2026-06-17 06:22:24'),(134,2,2,1,'active',2,'project_default','2026-06-17 06:22:24','2026-06-17 06:22:24'),(135,2,3,1,'active',3,'project_default','2026-06-17 06:22:24','2026-06-17 06:22:24'),(136,2,4,1,'active',4,'project_default','2026-06-17 06:22:24','2026-06-17 06:22:24'),(137,2,5,1,'active',5,'project_default','2026-06-17 06:22:24','2026-06-17 06:22:24'),(138,2,6,1,'active',6,'project_default','2026-06-17 06:22:24','2026-06-17 06:22:24'),(139,2,7,1,'active',7,'project_default','2026-06-17 06:22:24','2026-06-17 06:22:24'),(140,2,8,1,'active',8,'project_default','2026-06-17 06:22:24','2026-06-17 06:22:24'),(141,2,9,1,'active',9,'project_default','2026-06-17 06:22:24','2026-06-17 06:22:24'),(155,5,1,1,'active',1,'listing_override','2026-06-20 06:01:42','2026-06-20 06:01:42'),(156,5,3,1,'active',2,'listing_override','2026-06-20 06:01:42','2026-06-20 06:01:42'),(157,6,1,1,'active',1,'listing_override','2026-06-20 08:22:54','2026-06-20 08:22:54'),(158,6,2,1,'active',2,'listing_override','2026-06-20 08:22:54','2026-06-20 08:22:54'),(159,6,3,1,'active',3,'listing_override','2026-06-20 08:22:54','2026-06-20 08:22:54'),(160,6,4,1,'active',4,'listing_override','2026-06-20 08:22:54','2026-06-20 08:22:54'),(161,6,5,1,'active',5,'listing_override','2026-06-20 08:22:54','2026-06-20 08:22:54'),(162,6,6,1,'active',6,'listing_override','2026-06-20 08:22:54','2026-06-20 08:22:54'),(163,6,7,1,'active',7,'listing_override','2026-06-20 08:22:54','2026-06-20 08:22:54'),(164,6,8,1,'active',8,'listing_override','2026-06-20 08:22:54','2026-06-20 08:22:54'),(165,6,9,1,'active',9,'listing_override','2026-06-20 08:22:54','2026-06-20 08:22:54');
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
  CONSTRAINT `fk_listing_unit_alias_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_unit_aliases`
--

LOCK TABLES `listing_unit_aliases` WRITE;
/*!40000 ALTER TABLE `listing_unit_aliases` DISABLE KEYS */;
INSERT INTO `listing_unit_aliases` VALUES (6,1,'LA-204','old_unit_id',NULL,'2026-06-17 08:32:07'),(7,1,'LA-202','old_unit_id',NULL,'2026-06-17 08:32:07');
/*!40000 ALTER TABLE `listing_unit_aliases` ENABLE KEYS */;
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
  `lot_type` varchar(100) DEFAULT NULL,
  `reservation_fee` decimal(15,2) NOT NULL DEFAULT '0.00',
  `price_per_sqm` decimal(15,2) NOT NULL DEFAULT '0.00',
  `lot_area_sqm` decimal(10,2) NOT NULL DEFAULT '0.00',
  `net_selling_price` decimal(15,2) GENERATED ALWAYS AS ((`lot_area_sqm` * `price_per_sqm`)) VIRTUAL,
  `legal_misc_rate` decimal(5,2) NOT NULL DEFAULT '10.00',
  `legal_misc_fee` decimal(15,2) GENERATED ALWAYS AS (((`lot_area_sqm` * `price_per_sqm`) * (`legal_misc_rate` / 100))) VIRTUAL,
  `total_contract_price` decimal(15,2) GENERATED ALWAYS AS (((`lot_area_sqm` * `price_per_sqm`) + ((`lot_area_sqm` * `price_per_sqm`) * (`legal_misc_rate` / 100)))) VIRTUAL,
  `status` enum('available','reserved','active','hold','sold','inactive','superseded') NOT NULL DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_listing_project_unit` (`project_id`,`unit_id`),
  CONSTRAINT `fk_listings_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listings`
--

LOCK TABLES `listings` WRITE;
/*!40000 ALTER TABLE `listings` DISABLE KEYS */;
INSERT INTO `listings` (`id`, `project_id`, `cadastral_lot_no`, `unit_id`, `lot_type`, `reservation_fee`, `price_per_sqm`, `lot_area_sqm`, `legal_misc_rate`, `status`, `created_at`, `updated_at`) VALUES (1,1,'1306','LA-206','corner',50000.00,1000.00,446.00,10.00,'sold','2026-06-17 03:49:30','2026-06-17 08:32:07'),(2,1,'1306','LA-0203','inner',50000.00,555.00,1000.00,10.00,'reserved','2026-06-17 06:22:24','2026-06-20 06:57:41'),(5,1,'1306','LA-0204','inner',50000.00,300.00,565.00,10.00,'available','2026-06-20 06:01:42','2026-06-20 06:01:42'),(6,1,'1306','LA-303','corner',50000.00,1000.00,300.00,10.00,'active','2026-06-20 08:22:54','2026-06-20 23:08:09');
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,50000.00,'reservation','cash',NULL,'2026-06-17','verified',1,'2026-06-17 12:28:21','2026-06-17 04:28:21','2026-06-17 04:28:21'),(2,1,11795.00,'downpayment','cash',NULL,'2026-06-17','verified',1,'2026-06-17 12:29:24','2026-06-17 04:28:41','2026-06-17 04:29:23'),(3,1,11795.00,'downpayment','bank_transfer','ukyyuyyuu','2026-06-17','verified',1,'2026-06-17 12:29:18','2026-06-17 04:29:12','2026-06-17 04:29:18'),(4,1,80000.00,'monthly','check','gdfgdgdgdg','2026-06-17','verified',1,'2026-06-17 12:29:59','2026-06-17 04:29:59','2026-06-17 04:29:59'),(5,1,337010.00,'full_payment','check','gfddgh453ergth43','2026-06-17','verified',1,'2026-06-17 12:30:27','2026-06-17 04:30:27','2026-06-17 04:30:27'),(6,2,50000.00,'reservation','cash',NULL,'2026-06-20','verified',1,'2026-06-20 14:59:57','2026-06-20 06:59:57','2026-06-20 06:59:57'),(7,3,50000.00,'reservation','bank_transfer','writuerklu[0hwgntsuipjn','2026-06-20','verified',1,'2026-06-20 16:30:59','2026-06-20 08:30:59','2026-06-20 08:30:59'),(8,3,100000.00,'monthly','cash',NULL,'2026-06-21','rejected',NULL,NULL,'2026-06-20 23:04:12','2026-06-20 23:07:40'),(9,3,16333.33,'downpayment','cash',NULL,'2026-06-21','verified',1,'2026-06-21 07:08:09','2026-06-20 23:08:09','2026-06-20 23:08:09'),(10,3,16333.33,'downpayment','cash',NULL,'2026-06-21','verified',1,'2026-06-21 07:08:19','2026-06-20 23:08:19','2026-06-20 23:08:19'),(11,3,16333.34,'downpayment','cash',NULL,'2026-06-21','verified',1,'2026-06-21 07:08:36','2026-06-20 23:08:35','2026-06-20 23:08:35');
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_document_requirements`
--

LOCK TABLES `project_document_requirements` WRITE;
/*!40000 ALTER TABLE `project_document_requirements` DISABLE KEYS */;
INSERT INTO `project_document_requirements` VALUES (1,1,1,1,'active',1,'2026-06-17 03:45:11','2026-06-17 03:45:11'),(2,1,2,1,'active',2,'2026-06-17 03:45:11','2026-06-17 03:45:11'),(3,1,3,1,'active',3,'2026-06-17 03:45:11','2026-06-17 03:45:11'),(4,1,4,1,'active',4,'2026-06-17 03:45:11','2026-06-17 03:45:11'),(5,1,5,1,'active',5,'2026-06-17 03:45:11','2026-06-17 03:45:11'),(6,1,6,1,'active',6,'2026-06-17 03:45:11','2026-06-17 03:45:11'),(7,1,7,1,'active',7,'2026-06-17 03:45:11','2026-06-17 03:45:11'),(8,1,8,1,'active',8,'2026-06-17 03:45:11','2026-06-17 03:45:11'),(9,1,9,1,'active',9,'2026-06-17 03:45:11','2026-06-17 03:45:11'),(10,2,2,1,'active',1,'2026-06-17 03:47:08','2026-06-17 03:47:08'),(11,2,4,1,'active',2,'2026-06-17 03:47:08','2026-06-17 03:47:08'),(12,2,6,1,'active',3,'2026-06-17 03:47:08','2026-06-17 03:47:08'),(13,2,8,1,'active',4,'2026-06-17 03:47:08','2026-06-17 03:47:08'),(14,2,9,1,'active',5,'2026-06-17 03:47:08','2026-06-17 03:47:08'),(15,2,1,1,'active',6,'2026-06-17 03:47:08','2026-06-17 03:47:08'),(16,2,3,1,'active',7,'2026-06-17 03:47:08','2026-06-17 03:47:08'),(17,2,5,1,'active',8,'2026-06-17 03:47:08','2026-06-17 03:47:08'),(18,2,7,1,'active',9,'2026-06-17 03:47:08','2026-06-17 03:47:08');
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
INSERT INTO `projects` VALUES (1,'Bailen','Bailen, Cavite','LA','IMELDA B. VILLALOBOS','AA-06-0005-00105','022-06-0005-003-04','active',NULL,NULL,'2026-06-17 03:45:11','2026-06-17 03:45:11'),(2,'Maragondon','Maragondon, Cavite','PE','LINDA A. VILLMOAR','AA-23-0235-00105','032-26-0311-023-02','active',2,NULL,'2026-06-17 03:47:08','2026-06-17 03:47:08');
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
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'company_name','D&C Prime Realty','2026-06-17 03:39:38','2026-06-17 03:39:38'),(2,'company_email','admin@gmail.com','2026-06-17 03:39:38','2026-06-17 03:39:38'),(3,'company_contact','09545648674','2026-06-17 03:39:38','2026-06-17 03:39:38'),(4,'company_address','Indang, Cavite','2026-06-17 03:39:38','2026-06-17 03:39:38'),(5,'system_status','active','2026-06-17 03:39:38','2026-06-19 01:36:42'),(6,'reservation_contact_name','Admin','2026-06-17 03:39:38','2026-06-17 03:39:38'),(7,'reservation_contact_email','admin@gmail.com','2026-06-17 03:39:38','2026-06-17 03:39:38'),(8,'reservation_contact_no','0980988987','2026-06-17 03:39:38','2026-06-17 05:33:29'),(9,'commission_release_days','7,22','2026-06-17 05:20:48','2026-06-17 05:33:10');
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
INSERT INTO `users` VALUES (1,'Super Admin','superadmin@gmail.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','super_admin','active',0,'2026-06-20 16:36:00',NULL,'2026-06-17 11:56:46','2026-06-17 02:41:54','2026-06-20 08:36:00'),(2,'Rowena BNM','rowena.bnm@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker_network_manager','active',0,'2026-06-20 16:34:45',NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-20 08:34:45'),(3,'Broker Alpha','broker.alpha@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,'2026-06-20 15:26:46',NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-20 07:26:46'),(4,'Broker Bravo','broker.bravo@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','broker','active',0,'2026-06-17 11:57:24',NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-17 03:57:24'),(5,'Manager Alpha One','manager.alpha.one@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,'2026-06-19 09:46:45',NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-19 01:46:45'),(6,'Manager Alpha Two','manager.alpha.two@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-17 03:56:46'),(7,'Manager Bravo One','manager.bravo.one@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-17 03:56:46'),(8,'Manager Bravo Two','manager.bravo.two@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','manager','active',0,NULL,NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-17 03:56:46'),(9,'Agent A1 One','agent.a1.one@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-17 03:56:46'),(10,'Agent A1 Two','agent.a1.two@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-17 03:56:46'),(11,'Agent A2 One','agent.a2.one@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-17 03:56:46'),(12,'Agent A2 Two','agent.a2.two@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-17 03:56:46'),(13,'Agent B1 One','agent.b1.one@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-17 03:56:46'),(14,'Agent B1 Two','agent.b1.two@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-17 03:56:46'),(15,'Agent B2 One','agent.b2.one@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-17 03:56:46'),(16,'Agent B2 Two','agent.b2.two@test.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','agent','active',0,NULL,NULL,'2026-06-17 11:56:46','2026-06-17 03:56:46','2026-06-17 03:56:46'),(17,'admin','rrcsanjuan@pcu.edu.ph','$2b$10$dqnECSUdAzDXQv3T9.7F0OFDEv7pIEEwkBO9wKEJkJaAj4v0GDaKS','admin','active',0,'2026-06-19 09:36:26','2026-06-17 12:33:32','2026-06-17 12:34:03','2026-06-17 04:33:28','2026-06-19 01:36:26');
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

-- Dump completed on 2026-06-21  9:14:31
