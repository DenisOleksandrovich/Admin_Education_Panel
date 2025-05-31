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
-- Table structure for table `submissions`
--

DROP TABLE IF EXISTS `submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submissions` (
  `submission_id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `upload_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) DEFAULT NULL,
  `grade` int DEFAULT NULL,
  `grade_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`submission_id`),
  KEY `assignment_id` (`assignment_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`assignment_id`),
  CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submissions`
--

LOCK TABLES `submissions` WRITE;
/*!40000 ALTER TABLE `submissions` DISABLE KEYS */;
INSERT INTO `submissions` VALUES (1,1,1,'https://example.com/submissions/assignment1_student1.pdf','2025-04-01 07:00:00','Прийнято',9,'2025-05-17 12:21:01'),(2,2,5,'https://example.com/submissions/assignment2_student5.pdf','2025-04-02 10:45:00','Прийнято',8,'2025-05-18 09:19:47'),(3,3,12,'https://example.com/submissions/assignment3_student12.pdf','2025-04-03 15:30:00','Протерміновано',7,'2025-04-05 08:00:00'),(4,4,9,'https://example.com/submissions/assignment4_student9.pdf','2025-04-04 13:10:00','Очікує перевірки',NULL,NULL),(5,5,3,'https://example.com/submissions/assignment5_student3.pdf','2025-04-05 05:00:00','Потребує доопрацювання',3,'2025-05-18 10:25:26'),(6,6,1,'https://example.com/submissions/assignment6_student18.pdf','2025-04-06 09:00:00','Очікує перевірки',NULL,NULL),(7,7,7,'https://example.com/submissions/assignment7_student7.pdf','2025-04-07 14:25:00','Перевірено',6,'2025-04-08 07:30:00'),(8,8,1,'https://example.com/submissions/assignment8_student14.pdf','2025-04-08 12:45:00','На перевірці',6,'2025-05-19 10:11:11'),(9,9,6,'https://example.com/submissions/assignment9_student6.pdf','2025-04-09 16:00:00','Очікує перевірки',NULL,NULL),(10,10,2,'https://example.com/submissions/assignment10_student2.pdf','2025-04-10 08:20:00','Перевірено',8,'2025-04-11 05:30:00'),(11,4,1,'submissionFile-1744999746211-759958894.json','2025-04-18 18:09:06','На перевірці',NULL,NULL),(12,4,20,'FFFFFF667.com','2025-04-30 22:29:48','На перевірці',NULL,NULL),(13,6,21,'llllll.com','2025-05-11 10:05:14','На перевірці',NULL,NULL),(14,6,23,'Jjjjj9654.com','2025-05-11 12:30:48','Прийнято',9,'2025-05-20 10:53:46'),(15,9,3,'https://docs.google.com/document/d/1_MZ9-VjUIXLzZ1k4rKV1HNALfGsJQsWZfWwAvMbDVJY/edit?usp=sharing','2025-05-20 09:00:30','Прийнято',9,'2025-05-30 21:12:09'),(16,9,5,'submissionFile-1747809717041-478691468.pdf','2025-05-21 06:41:57','На перевірці',NULL,NULL),(17,3,5,'https://docs.google.com/document/d/1_MZ9-VjUIXLzZ1k4rKV1HNALfGsJQsWZfWwAvMbDVJY/edit?usp=sharing','2025-05-20 11:21:48','Пізня здача',NULL,NULL),(18,8,5,'https://docs.google.com/document/d/1_MZ9-VjUIXLzZ1k4rKV1HNALfGsJQsWZfWwAvMbDVJY/edit?usp=sharing','2025-05-20 13:21:59','На перевірці',NULL,NULL),(19,6,5,'https://docs.google.com/document/d/1EOVPnqgIudAPM5KGJ1hb3YhWKXCPhXHewBGGSbcoCL4/edit?usp=drive_link','2025-05-20 13:33:22','Відхилено',2,'2025-05-20 13:47:27'),(20,6,15,'https://docs.google.com/presentation/d/1BR172K77BW0BjhZtQqsxxQ_nsreQ6dCTuCoc6Wm1J-k/edit?usp=sharing','2025-05-20 14:01:10','Пізня здача',NULL,NULL),(21,6,8,'https://docs.google.com/document/d/1113ALWZjvD7xblxTCRdB4ucSpAi5CKAWnA0rLg_EriA/edit?usp=sharing','2025-05-20 14:08:27','Прийнято',7,'2025-05-24 08:01:59'),(22,6,4,'https://docs.google.com/document/d/1113ALWZjvD7xblxTCRdB4ucSpAi5CKAWnA0rLg_EriA/edit?usp=sharing','2025-05-20 14:16:56','Потребує доопрацювання',5,'2025-05-20 14:18:21'),(23,6,3,'https://docs.google.com/document/d/1113ALWZjvD7xblxTCRdB4ucSpAi5CKAWnA0rLg_EriA/edit?usp=drive_link','2025-05-21 06:29:49','Пізня здача',NULL,NULL),(24,17,5,'https://docs.google.com/document/d/18c1fJzuxzrJYHOZ0orNc6EL6fu6JSdW2wGhR4Xrpmm8/edit?usp=sharing','2025-05-21 06:40:33','Пізня здача',NULL,NULL);
/*!40000 ALTER TABLE `submissions` ENABLE KEYS */;
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
