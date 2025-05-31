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
-- Table structure for table `assignment_coauthors`
--

DROP TABLE IF EXISTS `assignment_coauthors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignment_coauthors` (
  `assignment_coauthor_id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `supervisor_id` int NOT NULL,
  `coauthor_role` varchar(100) DEFAULT 'Співавтор' COMMENT 'Роль співавтора (наприклад, Основний автор, Співавтор, Редактор)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_coauthor_id`),
  UNIQUE KEY `unique_assignment_supervisor_role` (`assignment_id`,`supervisor_id`,`coauthor_role`) COMMENT 'Гарантує, що керівник не буде доданий двічі з тією ж роллю до одного завдання',
  KEY `fk_coauthor_supervisor` (`supervisor_id`),
  CONSTRAINT `fk_coauthor_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`assignment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_coauthor_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `supervisors` (`supervisor_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_coauthors`
--

LOCK TABLES `assignment_coauthors` WRITE;
/*!40000 ALTER TABLE `assignment_coauthors` DISABLE KEYS */;
INSERT INTO `assignment_coauthors` VALUES (1,1,1,'Основний автор','2025-01-04 08:00:00'),(2,1,2,'Співавтор','2025-01-05 09:00:00'),(3,2,1,'Основний автор','2025-01-10 08:00:00'),(4,3,2,'Основний автор','2025-01-20 08:00:00'),(5,3,4,'Співавтор','2025-01-21 09:00:00'),(6,3,7,'Редактор','2025-01-22 10:00:00'),(7,4,2,'Основний автор','2025-02-04 08:00:00'),(8,5,4,'Основний автор','2025-02-04 09:00:00'),(9,5,1,'Редактор','2025-02-05 10:00:00'),(10,6,1,'Основний автор','2025-02-04 10:00:00'),(11,6,5,'Співавтор','2025-02-05 11:00:00'),(12,7,7,'Основний автор','2025-02-04 11:00:00'),(13,7,9,'Співавтор','2025-02-05 12:00:00'),(14,8,1,'Основний автор','2025-03-04 08:00:00'),(17,10,6,'Основний автор','2025-03-04 10:00:00'),(18,10,3,'Співавтор','2025-03-05 09:00:00'),(19,10,5,'Редактор','2025-03-06 10:00:00'),(20,11,12,'Основний автор','2025-03-04 11:00:00'),(21,12,5,'Основний автор','2025-03-04 12:00:00'),(22,12,10,'Співавтор','2025-03-05 13:00:00'),(23,12,11,'Редактор','2025-03-06 14:00:00'),(24,16,16,'Основний автор','2025-04-17 07:00:00'),(25,16,15,'Співавтор','2025-04-18 08:00:00'),(26,17,4,'Основний автор','2025-04-18 09:00:00'),(27,18,3,'Основний автор','2025-04-19 07:00:00'),(28,18,8,'Редактор','2025-04-20 08:00:00'),(29,18,13,'Співавтор','2025-04-21 09:00:00'),(39,9,8,'Співавтор','2025-05-24 12:43:50'),(40,9,9,'Співавтор','2025-05-24 12:43:50'),(41,9,26,'Співавтор','2025-05-24 12:43:50');
/*!40000 ALTER TABLE `assignment_coauthors` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-31 12:51:00
