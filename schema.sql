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
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_accredited_sellers_user` (`user_id`),
  KEY `fk_accredited_sellers_parent` (`parent_seller_id`),
  CONSTRAINT `fk_accredited_sellers_parent` FOREIGN KEY (`parent_seller_id`) REFERENCES `accredited_sellers` (`id`),
  CONSTRAINT `fk_accredited_sellers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accredited_sellers`
--

LOCK TABLES `accredited_sellers` WRITE;
/*!40000 ALTER TABLE `accredited_sellers` DISABLE KEYS */;
INSERT INTO `accredited_sellers` VALUES (1,NULL,'PARROCHO, JOSEPH E.',NULL,NULL,'broker_network_manager',NULL,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(2,NULL,'HERNANDEZ, JULIE ANN D.',NULL,NULL,'broker',1,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(3,NULL,'RIOJA, KIRSTEN JHOYCE A.',NULL,'09941603497','manager',2,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(4,NULL,'NEPOMUCENO, ERWIN','phproperty13@gmail.com','0991-995-8155','agent',3,'active','2026-06-06 13:12:07','2026-06-06 13:12:07');
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
  `time_in` time DEFAULT NULL,
  `time_out` time DEFAULT NULL,
  `schedule_time_in` time DEFAULT NULL,
  `schedule_time_out` time DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_attendance_date` (`employee_id`,`attendance_date`),
  CONSTRAINT `fk_attendance_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,1,'2026-06-06','08:00:00','17:00:00','08:00:00','17:00:00','2026-06-06 13:12:07','2026-06-06 13:12:07'),(2,2,'2026-06-06','08:15:00','17:05:00','08:00:00','17:00:00','2026-06-06 13:12:07','2026-06-06 13:12:07');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'create','Projects','Created sample projects','127.0.0.1','2026-06-06 13:12:07'),(2,1,'create','Listings','Created sample listings','127.0.0.1','2026-06-06 13:12:07'),(3,1,'create','Clients','Created sample clients','127.0.0.1','2026-06-06 13:12:07'),(4,1,'reserve','Client Units','Reserved LA-0416 and LA-0506 for sample clients','127.0.0.1','2026-06-06 13:12:07'),(5,1,'payment','Payments','Created sample payment records','127.0.0.1','2026-06-06 13:12:07'),(6,1,'document_check','Documents','Created sample client document checklists','127.0.0.1','2026-06-06 13:12:07'),(7,1,'create','Commissions','Created sample commission records','127.0.0.1','2026-06-06 13:12:07');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_document_list`
--

LOCK TABLES `client_document_list` WRITE;
/*!40000 ALTER TABLE `client_document_list` DISABLE KEYS */;
INSERT INTO `client_document_list` VALUES (1,1,1,NULL,'submitted',1,'2026-06-06 21:12:07','2026-06-06 13:12:07','2026-06-06 13:12:07'),(2,1,2,NULL,'submitted',1,'2026-06-06 21:12:07','2026-06-06 13:12:07','2026-06-06 13:12:07'),(3,1,3,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(4,1,4,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(5,1,5,NULL,'submitted',1,'2026-06-06 21:12:07','2026-06-06 13:12:07','2026-06-06 13:12:07'),(6,1,6,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(7,1,7,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(8,1,8,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(9,1,9,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(10,1,10,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(11,1,11,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(12,1,12,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(13,1,13,NULL,'submitted',1,'2026-06-06 21:12:07','2026-06-06 13:12:07','2026-06-06 13:12:07'),(14,1,14,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(15,1,15,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(16,1,16,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(17,1,17,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(18,1,18,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(19,1,19,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(20,1,20,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(32,2,1,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(33,2,2,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(34,2,3,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(35,2,4,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(36,2,5,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(37,2,6,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(38,2,7,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(39,2,8,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(40,2,9,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(41,2,10,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(42,2,11,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(43,2,12,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(44,2,13,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(45,2,14,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(46,2,15,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(47,2,16,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(48,2,17,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(49,2,18,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(50,2,19,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(51,2,20,NULL,'not_submitted',NULL,NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07');
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
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `due_day` tinyint DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_client_units_client` (`client_id`),
  KEY `fk_client_units_listing` (`listing_id`),
  KEY `fk_client_units_assigned_user` (`assigned_user_id`),
  CONSTRAINT `fk_client_units_assigned_user` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_client_units_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `fk_client_units_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`),
  CONSTRAINT `chk_due_day` CHECK ((`due_day` between 1 and 31))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_units`
--

LOCK TABLES `client_units` WRITE;
/*!40000 ALTER TABLE `client_units` DISABLE KEYS */;
INSERT INTO `client_units` VALUES (1,1,3,1,'active',932000.00,28,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(2,2,2,1,'reserved',4117500.00,15,'2026-06-06 13:12:07','2026-06-06 13:12:07');
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
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (1,'AHMED, SARAH NACINO',NULL,'msx.sarah0929@gmail.com','0969-129-1596','BIÑAN LAGUNA','2026-06-06 13:12:07','2026-06-06 13:12:07'),(2,'ALAMER, JAZZIE',NULL,'alamermarkchristopher21@gmail.com','0927-437-5425','GEN. TRI CAVITE','2026-06-06 13:12:07','2026-06-06 13:12:07');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
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
  `rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `released_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_commissions_client_unit` (`client_unit_id`),
  KEY `fk_commissions_seller` (`seller_id`),
  CONSTRAINT `fk_commissions_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`),
  CONSTRAINT `fk_commissions_seller` FOREIGN KEY (`seller_id`) REFERENCES `accredited_sellers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commissions`
--

LOCK TABLES `commissions` WRITE;
/*!40000 ALTER TABLE `commissions` DISABLE KEYS */;
INSERT INTO `commissions` VALUES (1,1,4,5.00,50000.00,20000.00,'payable','2026-06-06 13:12:07','2026-06-06 13:12:07'),(2,2,4,5.00,205875.00,0.00,'pending','2026-06-06 13:12:07','2026-06-06 13:12:07');
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
INSERT INTO `documents` VALUES (1,'Client Registration Form - Seller\'s Copy','Seller copy of the client registration form',1,0,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(2,'Client Registration Form - Administrator Copy','Administrator copy of the client registration form',1,0,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(3,'Intent to Buy','Client intent to buy document',1,0,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(4,'Offer to Buy & Buyer\'s Profile','Offer to buy form with buyer profile',1,0,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(5,'Reservation Agreement','Agreement for unit reservation',1,0,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(6,'Deed of Sale','Document used after sale completion',0,0,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(7,'Contract to Sell','Contract document before full ownership transfer',0,0,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(8,'Buyer Counselling and Acknowledgement Form','Buyer counselling acknowledgement',1,0,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(9,'Voluntary Cancellation and Waiver of Rights','Cancellation and waiver document',0,0,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(10,'Buyer Acknowledgement Form','Buyer acknowledgement document',1,0,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(11,'SPA to Process Title (for Company)','Special power of attorney for title processing',0,0,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(12,'SPA Authorization to Sign (for Representative)','Authorization to sign for representative',0,0,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(13,'Two valid Government-issued IDs (with 3 specimen signatures)','Valid IDs with specimen signatures',1,1,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(14,'TIN No. / TIN ID','Tax identification document',1,1,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(15,'PSA (Single)','PSA certificate for single buyer',0,1,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(16,'Marriage Certificate','Marriage certificate if applicable',0,1,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(17,'Valid ID of Spouse (when required)','Spouse valid ID when required',0,1,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(18,'CENOMAR (if the buyer has kids but not married)','CENOMAR when applicable',0,1,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(19,'Passport ID','Passport identification',0,1,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(20,'Valid IDs of both Principal and Representative','IDs for principal and representative',0,1,'active','2026-06-06 13:12:07','2026-06-06 13:12:07');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'JUAN DELA CRUZ','Admin Staff',25000.00,'active','2026-06-06 13:12:07','2026-06-06 13:12:07'),(2,'MARIA SANTOS','Treasury Staff',28000.00,'active','2026-06-06 13:12:07','2026-06-06 13:12:07');
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
  `promo_discount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `downpayment` decimal(15,2) NOT NULL DEFAULT '0.00',
  `reservation_fee` decimal(15,2) NOT NULL DEFAULT '0.00',
  `price_per_sqm` decimal(15,2) NOT NULL DEFAULT '0.00',
  `lot_area_sqm` decimal(10,2) NOT NULL DEFAULT '0.00',
  `net_selling_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `legal_misc_fee` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` varchar(50) NOT NULL DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_listing_project_unit` (`project_id`,`unit_id`),
  CONSTRAINT `fk_listings_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listings`
--

LOCK TABLES `listings` WRITE;
/*!40000 ALTER TABLE `listings` DISABLE KEYS */;
INSERT INTO `listings` VALUES (1,1,'CAD-LA-0505','LA-0505','Residential',0.00,300000.00,10000.00,2500.00,1200.00,3000000.00,300000.00,'available','2026-06-06 13:12:07','2026-06-06 13:12:07'),(2,1,'CAD-LA-0506','LA-0506','Residential',0.00,411750.00,10000.00,2500.00,1647.00,4117500.00,411750.00,'reserved','2026-06-06 13:12:07','2026-06-06 13:12:07'),(3,1,'CAD-LA-0416','LA-0416','Residential',0.00,100000.00,10000.00,2500.00,400.00,1000000.00,100000.00,'reserved','2026-06-06 13:12:07','2026-06-06 13:12:07'),(4,2,'CAD-BP-0001','BP-0001','Residential',0.00,50000.00,10000.00,2000.00,100.00,200000.00,20000.00,'available','2026-06-06 13:12:07','2026-06-06 13:12:07');
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
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_payments_client_unit` (`client_unit_id`),
  CONSTRAINT `fk_payments_client_unit` FOREIGN KEY (`client_unit_id`) REFERENCES `client_units` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,10000.00,'reservation_fee','cash','2026-06-01','2026-06-06 13:12:07','2026-06-06 13:12:07'),(2,1,58000.00,'downpayment','bank_transfer','2026-06-05','2026-06-06 13:12:07','2026-06-06 13:12:07'),(3,2,10000.00,'reservation_fee','gcash','2026-06-06','2026-06-06 13:12:07','2026-06-06 13:12:07');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'Luntiang Aguinaldo','Gen. Emilio Aguinaldo, Cavite','Christopher Prime','TD-001-2026','PIN-001-2026','active',NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07'),(2,'Bailen Project','Bailen, Cavite','Christopher Prime','TD-002-2026','PIN-002-2026','active',NULL,'2026-06-06 13:12:07','2026-06-06 13:12:07');
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
INSERT INTO `rest_days` VALUES (1,1,'Sunday',1),(2,2,'Saturday',1);
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
INSERT INTO `settings` VALUES (1,'company_name','D&C Prime Realty','2026-06-06 13:12:07','2026-06-06 13:12:07'),(2,'company_email','admin@gmail.com','2026-06-06 13:12:07','2026-06-06 13:12:07'),(3,'company_contact','09123456789','2026-06-06 13:12:07','2026-06-06 13:12:07'),(4,'company_address','Cavite, Philippines','2026-06-06 13:12:07','2026-06-06 13:12:07'),(5,'default_reservation_fee','10000','2026-06-06 13:12:07','2026-06-06 13:12:07'),(6,'default_commission_rate','5','2026-06-06 13:12:07','2026-06-06 13:12:07'),(7,'system_status','active','2026-06-06 13:12:07','2026-06-06 13:12:07');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'christopher prime','admin@gmail.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','admin','active','2026-06-06 20:23:24','2026-06-06 08:02:00','2026-06-06 12:23:24'),(3,'Maria Treasury','treasury@gmail.com','$2b$10$NctIePlPkOKirDJpOSR5PemQyFQydpwRSK2uE2oTj5e1dmbpPwGGy','personnel','active',NULL,'2026-06-06 13:12:06','2026-06-06 13:12:06');
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

-- Dump completed on 2026-06-06 21:12:32
