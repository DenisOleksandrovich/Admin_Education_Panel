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
-- Table structure for table `submission_comments`
--

DROP TABLE IF EXISTS `submission_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submission_comments` (
  `comment_id` int NOT NULL AUTO_INCREMENT,
  `submission_id` int DEFAULT NULL,
  `comment_text` text,
  `account_id` int DEFAULT NULL,
  `comment_date` datetime DEFAULT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `submission_id` (`submission_id`),
  CONSTRAINT `submission_comments_ibfk_1` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`submission_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submission_comments`
--

LOCK TABLES `submission_comments` WRITE;
/*!40000 ALTER TABLE `submission_comments` DISABLE KEYS */;
INSERT INTO `submission_comments` VALUES (1,13,'Зробив',NULL,'2025-05-11 13:56:11'),(2,13,'Ready',1,'2025-05-11 13:59:21'),(3,13,'Виправлено',1,'2025-05-11 14:04:21'),(4,13,'dfdfdfff',1,'2025-05-11 15:17:43'),(5,14,'Виконано',54,'2025-05-11 15:30:59'),(6,1,'Доволі непогано',22,'2025-05-17 13:16:37'),(7,2,'Гарно',22,'2025-05-18 11:27:02'),(8,2,'Але можна краще',22,'2025-05-18 11:27:48'),(9,2,'Щоб була мотивацыя покращуватись',22,'2025-05-18 11:54:20'),(10,2,'В наступний раз зроби краще',22,'2025-05-18 12:19:47'),(11,5,'Погано',22,'2025-05-18 13:25:26'),(12,15,'Зробив',4,'2025-05-19 16:53:26'),(13,15,'редагував',4,'2025-05-20 12:01:13'),(14,14,'Добре виконано',22,'2025-05-20 13:53:46'),(15,19,'Запіздно сдали і робота не відповідає вимогам',22,'2025-05-20 16:47:27'),(16,22,'Начебто виконала',5,'2025-05-20 17:17:18'),(17,22,'Доробити і виправлю оцінку',22,'2025-05-20 17:18:21'),(18,19,'Роботу відхилено тому я не можу перездати її',6,'2025-05-21 09:39:31'),(19,16,'Тому Що дедлайн ще не просрочений я може редагувати версію а не скидати нову',6,'2025-05-21 09:41:19'),(20,21,'Good',52,'2025-05-24 11:01:59'),(21,15,'Дуже гарно',30,'2025-05-31 00:12:10');
/*!40000 ALTER TABLE `submission_comments` ENABLE KEYS */;
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
