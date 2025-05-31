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
-- Table structure for table `submission_versions`
--

DROP TABLE IF EXISTS `submission_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submission_versions` (
  `version_id` int NOT NULL AUTO_INCREMENT,
  `submission_id` int DEFAULT NULL,
  `file_name` varchar(5555) DEFAULT NULL,
  `major_version` int NOT NULL DEFAULT '1',
  `minor_version` int NOT NULL DEFAULT '0',
  `upload_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`version_id`),
  KEY `submission_id` (`submission_id`),
  CONSTRAINT `submission_versions_ibfk_1` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`submission_id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submission_versions`
--

LOCK TABLES `submission_versions` WRITE;
/*!40000 ALTER TABLE `submission_versions` DISABLE KEYS */;
INSERT INTO `submission_versions` VALUES (1,11,'submissionFile-1744999746211-759958894.json',1,0,'2025-04-18 18:09:06'),(2,12,'FFFFFF667.com',1,0,'2025-04-30 22:29:48'),(3,13,'llllll.com',1,0,'2025-05-11 10:05:14'),(4,14,'Jjjjj9654.com',1,0,'2025-05-11 12:30:48'),(5,1,'https://example.com/submissions/assignment1_student1.pdf',1,0,'2025-04-01 07:00:00'),(6,2,'https://example.com/submissions/assignment2_student5.pdf',1,0,'2025-04-02 10:45:00'),(7,3,'https://example.com/submissions/assignment3_student12.pdf',1,0,'2025-04-03 15:30:00'),(8,4,'https://example.com/submissions/assignment4_student9.pdf',1,0,'2025-04-04 13:10:00'),(9,5,'https://example.com/submissions/assignment5_student3.pdf',1,0,'2025-04-05 05:00:00'),(10,6,'https://example.com/submissions/assignment6_student18.pdf',1,0,'2025-04-06 09:00:00'),(11,7,'https://example.com/submissions/assignment7_student7.pdf',1,0,'2025-04-07 14:25:00'),(12,8,'https://example.com/submissions/assignment8_student14.pdf',1,0,'2025-04-08 12:45:00'),(13,9,'https://example.com/submissions/assignment9_student6.pdf',1,0,'2025-04-09 16:00:00'),(14,10,'https://example.com/submissions/assignment10_student2.pdf',1,0,'2025-04-10 08:20:00'),(20,15,'https://docs.google.com/document/d/10BC_L2cxIn-oGWblw1750S2_3Wm2Hy6_wrAkHUqf7DM/edit?usp=drive_link',1,0,'2025-05-19 13:48:33'),(22,15,'https://docs.google.com/document/d/1EOVPnqgIudAPM5KGJ1hb3YhWKXCPhXHewBGGSbcoCL4/edit?usp=sharing',2,0,'2025-05-20 08:58:38'),(23,15,'https://docs.google.com/document/d/1_MZ9-VjUIXLzZ1k4rKV1HNALfGsJQsWZfWwAvMbDVJY/edit?usp=sharing',2,1,'2025-05-20 09:00:30'),(24,16,'https://docs.google.com/document/d/1_MZ9-VjUIXLzZ1k4rKV1HNALfGsJQsWZfWwAvMbDVJY/edit?usp=sharing',1,0,'2025-05-20 11:21:14'),(25,17,'https://docs.google.com/document/d/1_MZ9-VjUIXLzZ1k4rKV1HNALfGsJQsWZfWwAvMbDVJY/edit?usp=sharing',1,0,'2025-05-20 11:21:48'),(26,18,'https://docs.google.com/document/d/1_MZ9-VjUIXLzZ1k4rKV1HNALfGsJQsWZfWwAvMbDVJY/edit?usp=sharing',1,0,'2025-05-20 13:13:47'),(27,18,'https://docs.google.com/document/d/1_MZ9-VjUIXLzZ1k4rKV1HNALfGsJQsWZfWwAvMbDVJY/edit?usp',1,1,'2025-05-20 13:21:51'),(28,18,'https://docs.google.com/document/d/1_MZ9-VjUIXLzZ1k4rKV1HNALfGsJQsWZfWwAvMbDVJY/edit?usp=sharing',1,2,'2025-05-20 13:21:59'),(29,19,'external-link.com',1,0,'2025-05-20 13:30:11'),(30,19,'https://docs.google.com/document/d/1EOVPnqgIudAPM5KGJ1hb3YhWKXCPhXHewBGGSbcoCL4/edit?usp=drive_link',2,0,'2025-05-20 13:33:22'),(31,20,'https://docs.google.com/presentation/d/1BR172K77BW0BjhZtQqsxxQ_nsreQ6dCTuCoc6Wm1J-k/edit?usp=sharing',1,0,'2025-05-20 14:01:10'),(32,21,'https://docs.google.com/document/d/1113ALWZjvD7xblxTCRdB4ucSpAi5CKAWnA0rLg_EriA/edit?usp=sharing',1,0,'2025-05-20 14:08:27'),(33,22,'https://docs.google.com/document/d/1113ALWZjvD7xblxTCRdB4ucSpAi5CKAWnA0rLg_EriA/edit?usp=sharing',1,0,'2025-05-20 14:16:56'),(34,23,'https://docs.google.com/document/d/1113ALWZjvD7xblxTCRdB4ucSpAi5CKAWnA0rLg_EriA/edit?usp=drive_link',1,0,'2025-05-21 06:29:49'),(35,24,'https://docs.google.com/document/d/1113ALWZjvD7xblxTCRdB4ucSpAi5CKAWnA0rLg_EriA/edit?usp=drive_link',1,0,'2025-05-21 06:39:43'),(36,24,'https://docs.google.com/document/d/18c1fJzuxzrJYHOZ0orNc6EL6fu6JSdW2wGhR4Xrpmm8/edit?usp=sharing',2,0,'2025-05-21 06:40:33'),(37,16,'https://docs.google.com/document/d/18c1fJzuxzrJYHOZ0orNc6EL6fu6JSdW2wGhR4Xrpmm8/edit?usp=sharing',1,1,'2025-05-21 06:41:31'),(38,16,'submissionFile-1747809717041-478691468.pdf',2,0,'2025-05-21 06:41:57');
/*!40000 ALTER TABLE `submission_versions` ENABLE KEYS */;
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
