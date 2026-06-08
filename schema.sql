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
  `seller_role` varchar(50) NOT NULL DEFAULT 'agent',
  `parent_seller_id` int DEFAULT NULL,
  `custom_reports_under` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `accreditation_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `commission_rate` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_accredited_sellers_user` (`user_id`),
  KEY `fk_accredited_sellers_parent` (`parent_seller_id`),
  CONSTRAINT `fk_accredited_sellers_parent` FOREIGN KEY (`parent_seller_id`) REFERENCES `accredited_sellers` (`id`),
  CONSTRAINT `fk_accredited_sellers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accredited_sellers`
--

LOCK TABLES `accredited_sellers` WRITE;
/*!40000 ALTER TABLE `accredited_sellers` DISABLE KEYS */;
INSERT INTO `accredited_sellers` VALUES (1,NULL,'SARTE, JOHN CHRISTOPHER','john@gmail.com','09054323454','broker',NULL,NULL,'active','2026-06-07','2026-06-07 07:58:49','2026-06-08 06:22:47',5.00),(2,NULL,'SERAPION, JESSELIN C.','jessecervantescaylar@gmail.com','09661668811','agent',1,NULL,'active',NULL,'2026-06-07 07:59:38','2026-06-08 04:57:53',5.00),(3,NULL,'LACAP, JOHN MENARD M.','menardlacap27@gmail.com','09162819362','agent',1,NULL,'active',NULL,'2026-06-07 08:00:30','2026-06-08 04:57:50',8.00);
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
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_attendance_date` (`employee_id`,`attendance_date`),
  CONSTRAINT `fk_attendance_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,1,'2026-06-06','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-07 04:12:58','2026-06-07 06:24:24'),(2,4,'2026-06-06','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-07 04:13:48','2026-06-07 06:24:08'),(3,3,'2026-06-06','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-07 04:14:08','2026-06-07 06:24:03'),(4,2,'2026-06-06','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-07 05:54:41','2026-06-07 06:23:55'),(5,4,'2026-06-07','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-07 06:24:52','2026-06-07 06:24:52'),(6,3,'2026-06-07','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-07 06:24:55','2026-06-07 06:24:55'),(7,2,'2026-06-07','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-07 06:24:56','2026-06-07 06:24:56'),(8,1,'2026-06-07','present','08:50:00','18:00:00','09:00:00','18:00:00',60,'2026-06-07 06:25:52','2026-06-07 06:25:52');
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
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'create','Employees','Created employee Robert Renby C. San Juan','::1','2026-06-07 04:08:07'),(2,1,'update','Employees','Updated employee Robert Renby C. San Juan','::1','2026-06-07 04:08:21'),(3,1,'create','Employees','Created employee Kirsten Rioja','::1','2026-06-07 04:10:02'),(4,1,'create','Employees','Created employee Pangalinan Jan Cyrille','::1','2026-06-07 04:11:10'),(5,1,'create','Employees','Created employee Rowena M. Cortez','::1','2026-06-07 04:11:56'),(6,1,'create','Attendance','Created attendance for Robert Renby C. San Juan on 2026-06-07','::1','2026-06-07 04:12:58'),(7,1,'create','Attendance','Created attendance for Rowena M. Cortez on 2026-06-07','::1','2026-06-07 04:13:48'),(8,1,'create','Attendance','Created attendance for Pangalinan Jan Cyrille on 2026-06-07','::1','2026-06-07 04:14:08'),(9,1,'update','Settings','Updated system settings','::1','2026-06-07 05:50:27'),(10,1,'update','Settings','Updated system settings','::1','2026-06-07 05:51:33'),(11,1,'create','Attendance','Created attendance for Kirsten Rioja on 2026-06-07','::1','2026-06-07 05:54:41'),(12,1,'create','Documents','Created document client registration form seller\'s copy','::1','2026-06-07 06:18:56'),(13,1,'create','Documents','Created document client registration form administrator copy','::1','2026-06-07 06:19:38'),(14,1,'create','Documents','Created document intent to buy','::1','2026-06-07 06:19:52'),(15,1,'create','Documents','Created document offer to buy & buyer\'s profile','::1','2026-06-07 06:20:04'),(16,1,'create','Documents','Created document reservation agreement','::1','2026-06-07 06:20:14'),(17,1,'create','Documents','Created document deed of sale','::1','2026-06-07 06:20:24'),(18,1,'create','Documents','Created document contract to sell','::1','2026-06-07 06:20:37'),(19,1,'create','Documents','Created document buyer counselling and acknowledgement form','::1','2026-06-07 06:20:50'),(20,1,'create','Documents','Created document voluntary cancellation and waiver of rights','::1','2026-06-07 06:21:03'),(21,1,'create','Documents','Created document buyer acknowledgement form','::1','2026-06-07 06:21:15'),(22,1,'create','Documents','Created document SPA to Process Title (for Company)','::1','2026-06-07 06:21:33'),(23,1,'create','Documents','Created document SPA Authorization to Sign (for Representative)','::1','2026-06-07 06:21:46'),(24,1,'create','Documents','Created document Two valid Government-issued ID\'s (w/ 3 specimen signatures)','::1','2026-06-07 06:21:58'),(25,1,'create','Documents','Created document TIN No. / TIN ID','::1','2026-06-07 06:22:09'),(26,1,'create','Documents','Created document PSA (Single)','::1','2026-06-07 06:22:21'),(27,1,'create','Documents','Created document Marriage Certificate','::1','2026-06-07 06:22:35'),(28,1,'create','Documents','Created document Valid ID of Spouse (when required)','::1','2026-06-07 06:22:46'),(29,1,'create','Documents','Created document CENOMAR (if the buyer has kids but not married)','::1','2026-06-07 06:22:57'),(30,1,'create','Documents','Created document Passport ID','::1','2026-06-07 06:23:09'),(31,1,'create','Documents','Created document Valid ID\'s of both Principal and Representative','::1','2026-06-07 06:23:22'),(32,1,'update','Attendance','Updated attendance 4','127.0.0.1','2026-06-07 06:23:55'),(33,1,'update','Attendance','Updated attendance 3','127.0.0.1','2026-06-07 06:24:03'),(34,1,'update','Attendance','Updated attendance 2','127.0.0.1','2026-06-07 06:24:08'),(35,1,'update','Attendance','Updated attendance 1','127.0.0.1','2026-06-07 06:24:24'),(36,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:24:32'),(37,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:24:33'),(38,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:24:33'),(39,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:24:34'),(40,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:24:34'),(41,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:24:34'),(42,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:24:34'),(43,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:24:34'),(44,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:24:35'),(45,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:24:35'),(46,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:24:35'),(47,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:24:40'),(48,1,'create','Attendance','Created default attendance for Rowena M. Cortez on 2026-06-07','127.0.0.1','2026-06-07 06:24:52'),(49,1,'create','Attendance','Created default attendance for Pangalinan Jan Cyrille on 2026-06-07','127.0.0.1','2026-06-07 06:24:55'),(50,1,'create','Attendance','Created default attendance for Kirsten Rioja on 2026-06-07','127.0.0.1','2026-06-07 06:24:56'),(51,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:25:06'),(52,1,'create','Attendance','Created attendance for Robert Renby C. San Juan on 2026-06-07','127.0.0.1','2026-06-07 06:25:52'),(53,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:26:03'),(54,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:26:04'),(55,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:26:40'),(56,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:26:40'),(57,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:26:40'),(58,1,'create','Attendance','Generated today attendance for 2026-06-07','127.0.0.1','2026-06-07 06:26:41'),(59,1,'create','Projects','Created project Bailen','::1','2026-06-07 06:31:58'),(60,1,'create','Listings','Created listing LA-0104','::1','2026-06-07 06:43:35'),(61,1,'create','Clients','Created client SILVA, ISABEL LAYUG L.','::1','2026-06-07 06:45:29'),(62,1,'reserve','Client Units','Reserved LA-0104 for SILVA, ISABEL LAYUG L.','::1','2026-06-07 06:45:48'),(63,1,'create','Client Documents','Created document checklist for client unit 1','::1','2026-06-07 06:45:53'),(64,1,'document_check','Client Documents','Applied reusable documents to client unit 1','::1','2026-06-07 06:45:56'),(65,1,'create','Client Documents','Created document checklist for client unit 1','::1','2026-06-07 06:46:23'),(66,1,'update','Clients','Updated client SILVA, ISABEL LAYUG L.','::1','2026-06-07 07:37:08'),(67,1,'create','Client Documents','Created document checklist for client unit 1','::1','2026-06-07 07:37:14'),(68,1,'payment','Payments','Added payment for client unit 1','::1','2026-06-07 07:38:15'),(69,1,'create','Accredited Sellers','Created accredited seller SARTE, JOHN CHRISTOPHER','127.0.0.1','2026-06-07 07:58:49'),(70,1,'create','Accredited Sellers','Created accredited seller SERAPION, JESSELIN C.','127.0.0.1','2026-06-07 07:59:38'),(71,1,'create','Accredited Sellers','Created accredited seller LACAP, JOHN MENARD M.','127.0.0.1','2026-06-07 08:00:30'),(72,1,'payment','Payments','Added payment for client unit 1','::1','2026-06-07 08:04:03'),(73,1,'update','Listings','Updated listing LA-0104','127.0.0.1','2026-06-07 08:08:26'),(74,1,'create','Client Documents','Created document checklist for client unit 1','::1','2026-06-07 08:11:57'),(75,1,'login','Auth','christopher prime logged in','::1','2026-06-08 01:19:18'),(76,1,'create','Client Documents','Created document checklist for client unit 1','::1','2026-06-08 01:26:27'),(77,1,'update','Clients','Updated client SILVA, ISABEL LAYUG L.','127.0.0.1','2026-06-08 01:34:51'),(78,1,'create','Listings','Created listing LA-0101','127.0.0.1','2026-06-08 02:41:36'),(79,1,'update','Listings','Updated listing LA-0101','127.0.0.1','2026-06-08 03:05:58'),(80,1,'create','Listings','Created listing LA-0102','127.0.0.1','2026-06-08 03:54:54'),(81,1,'update','Listings','Updated listing LA-0102','127.0.0.1','2026-06-08 03:55:13'),(82,1,'login','Auth','christopher prime logged in','::1','2026-06-08 04:09:01'),(83,1,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-08 04:48:19'),(84,1,'update','Accredited Sellers','Updated accredited seller LACAP, JOHN MENARD M.','127.0.0.1','2026-06-08 04:57:50'),(85,1,'update','Accredited Sellers','Updated accredited seller SERAPION, JESSELIN C.','127.0.0.1','2026-06-08 04:57:53'),(86,1,'update','Accredited Sellers','Updated accredited seller SARTE, JOHN CHRISTOPHER','127.0.0.1','2026-06-08 04:57:56'),(87,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-08 06:20:02'),(88,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-08 06:20:28'),(89,1,'update','Client Units','Updated client unit 1','127.0.0.1','2026-06-08 06:22:10'),(90,1,'update','Accredited Sellers','Updated accredited seller SARTE, JOHN CHRISTOPHER','127.0.0.1','2026-06-08 06:22:47'),(91,1,'update','Clients','Updated client SILVA, ISABEL LAYUG L.','127.0.0.1','2026-06-08 06:23:17');
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
  `status` varchar(50) NOT NULL DEFAULT 'not_submitted',
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_client_document` (`client_unit_id`,`document_id`),
  KEY `fk_client_documents_document` (`document_id`),
  KEY `fk_client_documents_reviewer` (`reviewed_by`),
  CONSTRAINT `fk_client_documents_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`),
  CONSTRAINT `fk_client_documents_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`),
  CONSTRAINT `fk_client_documents_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_document_list`
--

LOCK TABLES `client_document_list` WRITE;
/*!40000 ALTER TABLE `client_document_list` DISABLE KEYS */;
INSERT INTO `client_document_list` VALUES (1,1,1,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(2,1,2,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(3,1,3,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(4,1,4,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(5,1,5,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(6,1,6,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(7,1,7,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(8,1,8,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(9,1,9,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(10,1,10,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(11,1,11,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(12,1,12,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(13,1,13,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(14,1,14,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(15,1,15,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(16,1,16,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(17,1,17,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(18,1,18,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(19,1,19,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48'),(20,1,20,NULL,'not_submitted',NULL,NULL,'2026-06-07 06:45:48','2026-06-07 06:45:48');
/*!40000 ALTER TABLE `client_document_list` ENABLE KEYS */;
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
  `balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `due_day` tinyint DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_client_units_client` (`client_id`),
  KEY `fk_client_units_listing` (`listing_id`),
  KEY `fk_client_units_assigned_user` (`assigned_user_id`),
  KEY `fk_client_units_seller` (`seller_id`),
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
INSERT INTO `client_units` VALUES (1,1,1,1,1,'active',271900.00,28,'2026-06-07 06:45:48','2026-06-08 06:22:10');
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
  `email` varchar(255) DEFAULT NULL,
  `contact_no` varchar(50) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
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
INSERT INTO `clients` VALUES (1,'SILVA, ISABEL LAYUG L.','SILVA, EDWARD JAMES M.','johnmateosilva@gmail.com','0939-938-0205','GEN. TRI CAVITE ','REGION IV-A',1,'2026-06-07 06:45:29','2026-06-08 01:34:51');
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
INSERT INTO `documents` VALUES (1,'client registration form seller\'s copy','Seller-side copy of the client registration form used for internal sales records.',1,0,'active','2026-06-07 06:18:56','2026-06-07 06:18:56'),(2,'client registration form administrator copy','Administrator-side copy of the client registration form used for office filing and verification.',1,0,'active','2026-06-07 06:19:38','2026-06-07 06:19:38'),(3,'intent to buy','Document showing the buyer\'s intent to purchase a specific property or unit.',1,0,'active','2026-06-07 06:19:52','2026-06-07 06:19:52'),(4,'offer to buy & buyer\'s profile','Form containing the buyer\'s purchase offer and personal buyer profile details.',1,0,'active','2026-06-07 06:20:04','2026-06-07 06:20:04'),(5,'reservation agreement','Agreement confirming the reservation of a selected lot or unit after payment of reservation fee.',1,0,'active','2026-06-07 06:20:14','2026-06-07 06:20:14'),(6,'deed of sale','Legal document used to transfer ownership rights from seller to buyer after sale completion.',1,0,'active','2026-06-07 06:20:24','2026-06-07 06:20:24'),(7,'contract to sell','Agreement stating the terms, conditions, payment schedule, and obligations before full transfer of ownership.',1,0,'active','2026-06-07 06:20:37','2026-06-07 06:20:37'),(8,'buyer counselling and acknowledgement form','Form confirming that the buyer was informed about payment terms, policies, and purchase responsibilities.',1,0,'active','2026-06-07 06:20:50','2026-06-07 06:20:50'),(9,'voluntary cancellation and waiver of rights','Document used when the buyer voluntarily cancels the purchase and waives related rights or claims.',0,0,'active','2026-06-07 06:21:03','2026-06-07 06:21:03'),(10,'buyer acknowledgement form','Form confirming that the buyer acknowledges important project, payment, and documentation details.',1,0,'active','2026-06-07 06:21:15','2026-06-07 06:21:15'),(11,'SPA to Process Title (for Company)','Special Power of Attorney authorizing the company or representative to process title-related documents.',0,1,'active','2026-06-07 06:21:33','2026-06-07 06:21:33'),(12,'SPA Authorization to Sign (for Representative)','Special Power of Attorney authorizing a representative to sign documents on behalf of the principal buyer.',0,1,'active','2026-06-07 06:21:46','2026-06-07 06:21:46'),(13,'Two valid Government-issued ID\'s (w/ 3 specimen signatures)','Two government-issued identification cards with three specimen signatures for identity verification.',1,1,'active','2026-06-07 06:21:58','2026-06-07 06:21:58'),(14,'TIN No. / TIN ID','Tax Identification Number or TIN ID used for tax, legal, and ownership documentation.',1,1,'active','2026-06-07 06:22:09','2026-06-07 06:22:09'),(15,'PSA (Single)','PSA birth certificate or civil registry document required for single buyers when applicable.',0,1,'active','2026-06-07 06:22:21','2026-06-07 06:22:21'),(16,'Marriage Certificate','Marriage certificate required for married buyers or when spouse/co-owner verification is needed.',0,1,'active','2026-06-07 06:22:35','2026-06-07 06:22:35'),(17,'Valid ID of Spouse (when required)','Valid identification card of the spouse required for married buyers or spouse-involved transactions.',0,1,'active','2026-06-07 06:22:46','2026-06-07 06:22:46'),(18,'CENOMAR (if the buyer has kids but not married)','Certificate of No Marriage Record required when the buyer has children but is not legally married.',0,1,'active','2026-06-07 06:22:57','2026-06-07 06:22:57'),(19,'Passport ID','Passport identification used as a valid ID, especially for overseas or foreign-based buyers.',0,1,'active','2026-06-07 06:23:09','2026-06-07 06:23:09'),(20,'Valid ID\'s of both Principal and Representative','Valid IDs of both the principal buyer and authorized representative for representative-based transactions.',0,1,'active','2026-06-07 06:23:22','2026-06-07 06:23:22');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'Robert Renby C. San Juan','System Developer / IT',16000.00,'active','2026-06-07 04:08:07','2026-06-07 04:08:21'),(2,'Kirsten Rioja','Administrator',25000.00,'active','2026-06-07 04:10:02','2026-06-07 04:10:02'),(3,'Pangalinan Jan Cyrille','Media Management',18000.00,'active','2026-06-07 04:11:10','2026-06-07 04:11:10'),(4,'Rowena M. Cortez','Broker\'s Network',35000.00,'active','2026-06-07 04:11:56','2026-06-07 04:11:56');
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
  `status` enum('available','reserved','hold','sold','inactive') NOT NULL DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_listing_project_unit` (`project_id`,`unit_id`),
  CONSTRAINT `fk_listings_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listings`
--

LOCK TABLES `listings` WRITE;
/*!40000 ALTER TABLE `listings` DISABLE KEYS */;
INSERT INTO `listings` (`id`, `project_id`, `cadastral_lot_no`, `unit_id`, `lot_type`, `reservation_fee`, `price_per_sqm`, `lot_area_sqm`, `legal_misc_rate`, `status`, `created_at`, `updated_at`) VALUES (1,1,'1306','LA-0104','CORNER',10000.00,1000.00,529.00,10.00,'reserved','2026-06-07 06:43:35','2026-06-08 06:22:10'),(2,1,'1306','LA-0101','end',50000.00,2600.00,300.00,10.00,'available','2026-06-08 02:41:36','2026-06-08 03:05:58'),(3,1,'1306','LA-0102','inner',50000.00,2000.00,300.00,10.00,'available','2026-06-08 03:54:54','2026-06-08 03:55:13');
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
  `payment_date` date NOT NULL DEFAULT (curdate()),
  `status` enum('pending','verified','rejected') NOT NULL DEFAULT 'verified',
  `verified_by` int DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_payments_client_unit` (`client_unit_id`),
  KEY `fk_payments_verified_by` (`verified_by`),
  CONSTRAINT `fk_payments_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`),
  CONSTRAINT `fk_payments_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,10000.00,'reservation_fee','cash','2026-06-07','verified',NULL,NULL,'2026-06-07 07:38:15','2026-06-07 07:38:15'),(2,1,50000.00,'downpayment','cash','2026-06-07','verified',NULL,NULL,'2026-06-07 08:04:03','2026-06-07 08:04:03'),(3,1,50000.00,'downpayment','cash','2026-06-08','verified',1,'2026-06-08 14:20:02','2026-06-08 06:20:02','2026-06-08 06:20:02'),(4,1,200000.00,'downpayment','bank_transfer','2026-06-08','verified',1,'2026-06-08 14:20:29','2026-06-08 06:20:28','2026-06-08 06:20:28');
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
  `administrator` varchar(255) DEFAULT NULL,
  `tax_declaration_no` varchar(255) DEFAULT NULL,
  `pin` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `ended_at` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'Bailen','Bailen, Cavite','IMELDA B. VILLALOBOS','No. AA-06-0005-00105',' 022-06-0005-003-04','active',NULL,'2026-06-07 06:31:58','2026-06-07 06:31:58');
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rest_days`
--

LOCK TABLES `rest_days` WRITE;
/*!40000 ALTER TABLE `rest_days` DISABLE KEYS */;
INSERT INTO `rest_days` VALUES (3,1,'Tuesday',1),(4,1,'Thursday',1),(5,2,'Tuesday',1),(6,2,'Thursday',1),(7,3,'Tuesday',1),(8,3,'Thursday',1),(9,4,'Tuesday',1),(10,4,'Thursday',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'company_name','D&C Prime Realty','2026-06-07 05:50:27','2026-06-07 05:51:33'),(2,'company_email','dcprime@gmail.com','2026-06-07 05:50:27','2026-06-07 05:51:33'),(3,'company_contact','','2026-06-07 05:50:27','2026-06-07 05:50:27'),(4,'company_address','','2026-06-07 05:50:27','2026-06-07 05:50:27'),(5,'default_reservation_fee','10000','2026-06-07 05:50:27','2026-06-07 05:50:27'),(6,'default_commission_rate','5','2026-06-07 05:50:27','2026-06-07 05:50:27'),(7,'system_status','active','2026-06-07 05:50:27','2026-06-07 05:50:27');
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
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'christopher prime','admin@gmail.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','admin','active','2026-06-08 12:09:01','2026-06-07 04:02:25','2026-06-08 04:09:01');
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

-- Dump completed on 2026-06-08 14:24:58
