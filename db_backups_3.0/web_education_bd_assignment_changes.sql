-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: web_education_bd
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
-- Table structure for table `assignment_changes`
--

DROP TABLE IF EXISTS `assignment_changes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignment_changes` (
  `change_id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `changed_by` int DEFAULT NULL,
  `changed_by_account_id` int DEFAULT NULL,
  `change_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `change_description` text NOT NULL,
  PRIMARY KEY (`change_id`),
  KEY `assignment_id` (`assignment_id`),
  KEY `assignment_changes_ibfk_2` (`changed_by`),
  KEY `assignment_changes_ibfk_account` (`changed_by_account_id`),
  CONSTRAINT `assignment_changes_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`assignment_id`) ON DELETE CASCADE,
  CONSTRAINT `assignment_changes_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `supervisors` (`supervisor_id`) ON DELETE SET NULL,
  CONSTRAINT `assignment_changes_ibfk_account` FOREIGN KEY (`changed_by_account_id`) REFERENCES `accounts` (`account_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_changes`
--

LOCK TABLES `assignment_changes` WRITE;
/*!40000 ALTER TABLE `assignment_changes` DISABLE KEYS */;
INSERT INTO `assignment_changes` VALUES (1,16,1,NULL,'2025-04-16 19:21:46','Створено нове завдання \"test1\"'),(2,17,1,NULL,'2025-04-17 20:02:17','Створено нове завдання \"Tesssst\"'),(3,18,1,NULL,'2025-04-18 21:07:29','Створено нове завдання \"Tesssst44444.com\"'),(5,18,NULL,52,'2025-05-12 15:33:52','Оновлено деталі завдання \"Тестування редагування\". Дедлайн змінено на 27.04.2025, 05:00:00.'),(6,18,NULL,52,'2025-05-12 15:34:20','Оновлено деталі завдання \"Тестування редагування\". Дедлайн змінено на 27.06.2025, 05:00:00.'),(7,9,NULL,52,'2025-05-24 14:57:42','Оновлено деталі завдання \"Логічне проектування обраного модуля: інтерфейс користувача, діаграма класів 1\". Дедлайн змінено на 01.06.2025, 00:01:00.'),(8,9,NULL,52,'2025-05-24 15:02:03','Оновлено деталі завдання \"Логічне проектування обраного модуля: інтерфейс користувача, діаграма класів\". Дедлайн змінено на 31.05.2025, 00:05:00.'),(9,9,NULL,52,'2025-05-24 15:43:50','Оновлено деталі завдання \"Логічне проектування обраного модуля: інтерфейс користувача, діаграма класів\". Дедлайн змінено на 01.06.2025, 00:07:00.');
/*!40000 ALTER TABLE `assignment_changes` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-31 12:51:01
