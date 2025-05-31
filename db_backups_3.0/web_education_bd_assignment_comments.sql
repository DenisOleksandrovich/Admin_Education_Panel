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
-- Table structure for table `assignment_comments`
--

DROP TABLE IF EXISTS `assignment_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignment_comments` (
  `comment_id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `comment_text` text NOT NULL,
  `comment_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `student_id` int DEFAULT NULL,
  `supervisor_id` int DEFAULT NULL,
  `admin_id` int DEFAULT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `assignment_id` (`assignment_id`),
  KEY `student_id` (`student_id`),
  KEY `supervisor_id` (`supervisor_id`),
  KEY `fk_comment_admin` (`admin_id`),
  CONSTRAINT `assignment_comments_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`assignment_id`) ON DELETE CASCADE,
  CONSTRAINT `assignment_comments_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE SET NULL,
  CONSTRAINT `assignment_comments_ibfk_3` FOREIGN KEY (`supervisor_id`) REFERENCES `supervisors` (`supervisor_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_comment_admin` FOREIGN KEY (`admin_id`) REFERENCES `accounts` (`account_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_comments`
--

LOCK TABLES `assignment_comments` WRITE;
/*!40000 ALTER TABLE `assignment_comments` DISABLE KEYS */;
INSERT INTO `assignment_comments` VALUES (1,4,'Test','2025-04-17 00:15:03',1,NULL,NULL),(2,12,'TEst','2025-04-17 20:00:37',1,NULL,NULL),(3,18,'Tesssst44444','2025-04-18 21:07:50',1,NULL,NULL),(4,4,'fdddfdf','2025-05-11 13:02:06',21,NULL,NULL),(5,7,'Хмммм','2025-05-11 14:04:47',21,NULL,NULL),(6,8,'Цікаве завдання','2025-05-20 23:54:22',5,NULL,NULL),(7,9,'Вже було перероблено','2025-05-24 15:00:11',NULL,NULL,52),(8,9,'Перероблено вдруге','2025-05-24 15:02:30',NULL,NULL,52),(9,9,'Не зберіглося відео тестування функціоналу редагування','2025-05-24 15:44:44',NULL,NULL,52);
/*!40000 ALTER TABLE `assignment_comments` ENABLE KEYS */;
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
