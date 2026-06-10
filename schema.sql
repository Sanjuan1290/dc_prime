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
  `seller_role` enum('agent','broker','manager') NOT NULL DEFAULT 'agent',
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accredited_sellers`
--

LOCK TABLES `accredited_sellers` WRITE;
/*!40000 ALTER TABLE `accredited_sellers` DISABLE KEYS */;
INSERT INTO `accredited_sellers` VALUES (1,NULL,'NEPOMUCENO, ERWIN','erwin@gmail.com','0991-995-8155','agent',NULL,NULL,'active','2025-06-06','2026-06-10 03:42:10','2026-06-10 03:42:10',5.00);
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,1,'2026-06-10','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-10 05:13:24','2026-06-10 05:13:24'),(2,1,'2026-06-01','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-10 05:15:04','2026-06-10 05:16:41'),(3,1,'2026-06-02','rest_day',NULL,NULL,'09:00:00','18:00:00',60,'2026-06-10 05:15:07','2026-06-10 05:15:07'),(4,1,'2026-06-03','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-10 05:15:09','2026-06-10 05:15:09'),(5,1,'2026-06-04','rest_day',NULL,NULL,'09:00:00','18:00:00',60,'2026-06-10 05:15:11','2026-06-10 05:15:11'),(6,1,'2026-06-05','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-10 05:15:13','2026-06-10 05:15:13'),(7,1,'2026-06-06','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-10 05:15:15','2026-06-10 05:15:15'),(8,1,'2026-06-07','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-10 05:15:19','2026-06-10 05:15:19'),(9,1,'2026-06-08','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-10 05:15:20','2026-06-10 05:15:20'),(10,1,'2026-06-09','rest_day',NULL,NULL,'09:00:00','18:00:00',60,'2026-06-10 05:15:23','2026-06-10 05:15:23'),(11,1,'2026-06-11','rest_day',NULL,NULL,'09:00:00','18:00:00',60,'2026-06-10 05:15:26','2026-06-10 05:15:26'),(12,1,'2026-06-13','present','09:00:00','18:00:00','09:00:00','18:00:00',60,'2026-06-10 05:15:29','2026-06-10 05:17:59');
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
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'login','Auth','Admin User logged in','::1','2026-06-10 03:39:07'),(2,1,'create','Projects','Created project Bailen','::1','2026-06-10 03:40:00'),(3,1,'create','Listings','Created listing LA-0104','127.0.0.1','2026-06-10 03:41:10'),(4,1,'create','Accredited Sellers','Created accredited seller NEPOMUCENO, ERWIN','127.0.0.1','2026-06-10 03:42:10'),(5,1,'create','Clients','Created client SILVA, ISABEL LAYUG L.','127.0.0.1','2026-06-10 03:42:54'),(6,1,'update','Clients','Updated client SILVA, ISABEL LAYUG L.','127.0.0.1','2026-06-10 03:43:28'),(7,1,'reserve','Client Units','Reserved LA-0104 for SILVA, ISABEL LAYUG L.','127.0.0.1','2026-06-10 03:45:54'),(8,1,'create','Documents','Created document client registration form seller\'s copy','127.0.0.1','2026-06-10 03:46:31'),(9,1,'create','Documents','Created document client registration form administrator copy','127.0.0.1','2026-06-10 03:46:36'),(10,1,'create','Documents','Created document Marriage Certificate','127.0.0.1','2026-06-10 03:46:50'),(11,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-10 03:47:48'),(12,1,'update','Payments','Updated payment 1','127.0.0.1','2026-06-10 03:47:58'),(13,1,'create','Client Documents','Created document checklist for client unit 1','127.0.0.1','2026-06-10 03:48:10'),(14,1,'document_check','Client Documents','Applied reusable documents to client unit 1','127.0.0.1','2026-06-10 03:48:12'),(15,1,'document_check','Client Documents','Applied reusable documents to client unit 1','127.0.0.1','2026-06-10 03:48:12'),(16,1,'document_check','Client Documents','Applied reusable documents to client unit 1','127.0.0.1','2026-06-10 03:48:13'),(17,1,'document_check','Client Documents','Applied reusable documents to client unit 1','127.0.0.1','2026-06-10 03:48:13'),(18,1,'document_check','Client Documents','Applied reusable documents to client unit 1','127.0.0.1','2026-06-10 03:48:13'),(19,1,'document_check','Client Documents','Applied reusable documents to client unit 1','127.0.0.1','2026-06-10 03:48:13'),(20,1,'document_check','Client Documents','Applied reusable documents to client unit 1','127.0.0.1','2026-06-10 03:48:13'),(21,1,'document_check','Client Documents','Applied reusable documents to client unit 1','127.0.0.1','2026-06-10 03:48:14'),(22,1,'document_check','Client Documents','Applied reusable documents to client unit 1','127.0.0.1','2026-06-10 03:48:14'),(23,1,'document_check','Client Documents','Updated client document 3 to submitted','127.0.0.1','2026-06-10 03:48:15'),(24,1,'document_check','Client Documents','Updated client document 1 to submitted','127.0.0.1','2026-06-10 03:48:21'),(25,1,'document_check','Client Documents','Updated client document 2 to submitted','127.0.0.1','2026-06-10 03:48:26'),(26,1,'document_check','Client Documents','Updated client document 3 to not_submitted','127.0.0.1','2026-06-10 03:48:34'),(27,1,'document_check','Client Documents','Updated client document 3 to submitted','127.0.0.1','2026-06-10 03:48:36'),(28,1,'update','Documents','Updated document Marriage Certificate','127.0.0.1','2026-06-10 03:48:45'),(29,1,'document_check','Client Documents','Updated client document 3 to not_submitted','127.0.0.1','2026-06-10 03:48:56'),(30,1,'payment','Payments','Added payment for client unit 1','127.0.0.1','2026-06-10 03:49:19'),(31,1,'create','Employees','Created employee Robert Renby C. San Juan','::1','2026-06-10 05:12:42'),(32,1,'create','Attendance','Created default attendance for Robert Renby C. San Juan on 2026-06-10','127.0.0.1','2026-06-10 05:13:24'),(33,1,'create','Attendance','Generated today attendance for 2026-06-10','127.0.0.1','2026-06-10 05:13:40'),(34,1,'create','Attendance','Generated today attendance for 2026-06-10','127.0.0.1','2026-06-10 05:13:41'),(35,1,'create','Attendance','Generated today attendance for 2026-06-10','127.0.0.1','2026-06-10 05:13:41'),(36,1,'create','Attendance','Generated today attendance for 2026-06-10','127.0.0.1','2026-06-10 05:13:41'),(37,1,'create','Attendance','Created attendance for Robert Renby C. San Juan on 2026-06-01','127.0.0.1','2026-06-10 05:15:04'),(38,1,'create','Attendance','Created attendance for Robert Renby C. San Juan on 2026-06-02','127.0.0.1','2026-06-10 05:15:07'),(39,1,'create','Attendance','Created attendance for Robert Renby C. San Juan on 2026-06-03','127.0.0.1','2026-06-10 05:15:09'),(40,1,'create','Attendance','Created attendance for Robert Renby C. San Juan on 2026-06-04','127.0.0.1','2026-06-10 05:15:11'),(41,1,'create','Attendance','Created attendance for Robert Renby C. San Juan on 2026-06-05','127.0.0.1','2026-06-10 05:15:13'),(42,1,'create','Attendance','Created attendance for Robert Renby C. San Juan on 2026-06-06','127.0.0.1','2026-06-10 05:15:15'),(43,1,'create','Attendance','Created attendance for Robert Renby C. San Juan on 2026-06-07','127.0.0.1','2026-06-10 05:15:19'),(44,1,'create','Attendance','Created attendance for Robert Renby C. San Juan on 2026-06-08','127.0.0.1','2026-06-10 05:15:20'),(45,1,'create','Attendance','Created attendance for Robert Renby C. San Juan on 2026-06-09','127.0.0.1','2026-06-10 05:15:23'),(46,1,'create','Attendance','Created attendance for Robert Renby C. San Juan on 2026-06-11','127.0.0.1','2026-06-10 05:15:26'),(47,1,'create','Attendance','Created attendance for Robert Renby C. San Juan on 2026-06-13','127.0.0.1','2026-06-10 05:15:29'),(48,1,'update','Attendance','Updated attendance 2','127.0.0.1','2026-06-10 05:16:11'),(49,1,'update','Attendance','Updated attendance 2','127.0.0.1','2026-06-10 05:16:41'),(50,1,'update','Attendance','Updated attendance 12','127.0.0.1','2026-06-10 05:17:04'),(51,1,'update','Attendance','Updated attendance 12','127.0.0.1','2026-06-10 05:17:59'),(52,1,'create','Attendance','Created quick attendance for 1 employee(s) on 2026-06-10','127.0.0.1','2026-06-10 05:32:45'),(53,1,'create','Attendance','Created quick attendance for 1 employee(s) on 2026-06-10','127.0.0.1','2026-06-10 05:32:49'),(54,1,'create','Attendance','Created quick attendance for 1 employee(s) on 2026-06-10','127.0.0.1','2026-06-10 05:33:07'),(55,1,'create','Attendance','Created quick attendance for 1 employee(s) on 2026-06-10','127.0.0.1','2026-06-10 05:33:13'),(56,1,'create','Attendance','Created quick attendance for 1 employee(s) on 2026-06-10','127.0.0.1','2026-06-10 05:33:28'),(57,1,'create','Attendance','Generated today attendance for 2026-06-10','127.0.0.1','2026-06-10 05:33:47'),(58,1,'create','Attendance','Created quick attendance for 1 employee(s) on 2026-06-10','127.0.0.1','2026-06-10 05:34:22');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_document_list`
--

LOCK TABLES `client_document_list` WRITE;
/*!40000 ALTER TABLE `client_document_list` DISABLE KEYS */;
INSERT INTO `client_document_list` VALUES (1,1,1,NULL,'submitted',1,'2026-06-10 11:48:21','2026-06-10 03:48:10','2026-06-10 03:48:21'),(2,1,2,NULL,'submitted',1,'2026-06-10 11:48:26','2026-06-10 03:48:10','2026-06-10 03:48:26'),(3,1,3,NULL,'not_submitted',NULL,NULL,'2026-06-10 03:48:10','2026-06-10 03:48:56');
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
  `mode_of_payment` enum('cash','installment') NOT NULL DEFAULT 'installment',
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
INSERT INTO `client_units` VALUES (1,1,1,1,1,'active','installment',290600.00,10,'2026-06-10 03:45:54','2026-06-10 03:49:19');
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
INSERT INTO `clients` VALUES (1,'SILVA, ISABEL LAYUG L.','SILVA, EDWARD JAMES M.','johnmateosilva@gmail.com','0939-938-0205','GEN. TRI CAVITE','REGION IV-A',1,'2026-06-10 03:42:54','2026-06-10 03:42:54');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_releases`
--

LOCK TABLES `commission_releases` WRITE;
/*!40000 ALTER TABLE `commission_releases` DISABLE KEYS */;
INSERT INTO `commission_releases` VALUES (1,1,'1st_release',20.00,20.00,20.00,4460.00,0.00,4460.00,'eligible',NULL,NULL,NULL,'2026-06-10 03:45:54','2026-06-10 03:49:19'),(2,1,'2nd_release',40.00,20.00,40.00,4460.00,0.00,4460.00,'eligible',NULL,NULL,NULL,'2026-06-10 03:45:54','2026-06-10 03:49:19'),(3,1,'3rd_release',60.00,20.00,60.00,4460.00,0.00,4460.00,'pending',NULL,NULL,NULL,'2026-06-10 03:45:54','2026-06-10 03:45:54'),(4,1,'4th_release',75.00,15.00,75.00,3345.00,0.00,3345.00,'pending',NULL,NULL,NULL,'2026-06-10 03:45:54','2026-06-10 03:45:54'),(5,1,'retention',NULL,25.00,100.00,5575.00,0.00,5575.00,'pending',NULL,NULL,NULL,'2026-06-10 03:45:54','2026-06-10 03:45:54');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commissions`
--

LOCK TABLES `commissions` WRITE;
/*!40000 ALTER TABLE `commissions` DISABLE KEYS */;
INSERT INTO `commissions` VALUES (1,1,1,'agent',5.00,446000.00,22300.00,'main',NULL,'direct',0.00,NULL,NULL,NULL,22300.00,0.00,'active','Auto-generated from reservation of LA-0104','2026-06-10 03:45:54','2026-06-10 03:45:54');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (1,'client registration form seller\'s copy',NULL,1,0,'active','2026-06-10 03:46:31','2026-06-10 03:46:31'),(2,'client registration form administrator copy',NULL,1,0,'active','2026-06-10 03:46:36','2026-06-10 03:46:36'),(3,'Marriage Certificate',NULL,0,1,'active','2026-06-10 03:46:50','2026-06-10 03:48:45');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'Robert Renby C. San Juan','System/Web Developer',15000.00,'active','2026-06-10 05:12:42','2026-06-10 05:12:42');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listings`
--

LOCK TABLES `listings` WRITE;
/*!40000 ALTER TABLE `listings` DISABLE KEYS */;
INSERT INTO `listings` (`id`, `project_id`, `cadastral_lot_no`, `unit_id`, `lot_type`, `reservation_fee`, `price_per_sqm`, `lot_area_sqm`, `legal_misc_rate`, `status`, `created_at`, `updated_at`) VALUES (1,1,'1306','LA-0104','corner',50000.00,1000.00,446.00,10.00,'reserved','2026-06-10 03:41:10','2026-06-10 03:45:54');
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
  `status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  `verified_by` int DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_payments_client_unit` (`client_unit_id`),
  KEY `fk_payments_verified_by` (`verified_by`),
  CONSTRAINT `fk_payments_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`),
  CONSTRAINT `fk_payments_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,50000.00,'reservation_fee','cash','2026-06-09','verified',1,'2026-06-10 11:47:58','2026-06-10 03:47:48','2026-06-10 03:47:58'),(2,1,150000.00,'downpayment','check','2026-06-10','verified',1,'2026-06-10 11:49:20','2026-06-10 03:49:19','2026-06-10 03:49:19');
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
INSERT INTO `projects` VALUES (1,'Bailen','Bailen, Cavite','IMELDA B. VILLALOBOS','AA-06-0005-00105','022-06-0005-003-04','active',NULL,'2026-06-10 03:40:00','2026-06-10 03:40:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rest_days`
--

LOCK TABLES `rest_days` WRITE;
/*!40000 ALTER TABLE `rest_days` DISABLE KEYS */;
INSERT INTO `rest_days` VALUES (1,1,'Thursday',1),(2,1,'Tuesday',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'company_name','D&C Prime Realty','2026-06-10 03:29:25','2026-06-10 03:29:25'),(2,'company_email','dcprime@gmail.com','2026-06-10 03:29:25','2026-06-10 03:29:25'),(3,'company_contact','09912698393','2026-06-10 03:29:25','2026-06-10 03:29:25'),(4,'company_address','Indang, Cavite','2026-06-10 03:29:25','2026-06-10 03:29:25'),(5,'default_reservation_fee','10000','2026-06-10 03:29:25','2026-06-10 03:29:25'),(6,'default_commission_rate','5','2026-06-10 03:29:25','2026-06-10 03:29:25'),(7,'system_status','active','2026-06-10 03:29:25','2026-06-10 03:29:25');
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
INSERT INTO `users` VALUES (1,'Admin User','admin@gmail.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','admin','active','2026-06-10 11:39:07','2026-06-10 03:29:25','2026-06-10 03:39:07');
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

-- Dump completed on 2026-06-10 14:04:01
