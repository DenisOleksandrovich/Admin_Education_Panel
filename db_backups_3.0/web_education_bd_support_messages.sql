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
-- Table structure for table `support_messages`
--

DROP TABLE IF EXISTS `support_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_messages` (
  `message_id` int NOT NULL AUTO_INCREMENT,
  `sender_type` enum('user','admin') NOT NULL,
  `sender_id` int NOT NULL,
  `receiver_id` int DEFAULT NULL,
  `account_id` int NOT NULL,
  `message_text` text NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_read` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`message_id`),
  KEY `account_id` (`account_id`),
  CONSTRAINT `support_messages_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_messages`
--

LOCK TABLES `support_messages` WRITE;
/*!40000 ALTER TABLE `support_messages` DISABLE KEYS */;
INSERT INTO `support_messages` VALUES (1,'user',22,NULL,22,'Доброго вечора, з\'явилась проблема зі студентом 5','2025-05-11 16:45:16',1),(2,'admin',52,22,22,'test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test','2025-05-12 20:51:47',1),(3,'user',1,NULL,1,'Hi i have a problem','2025-05-13 13:18:52',1),(4,'user',1,NULL,1,'I need hel now','2025-05-13 13:25:13',1),(5,'admin',52,1,1,'hi what happened','2025-05-13 16:24:56',1),(6,'user',1,NULL,1,'nothing','2025-05-13 17:53:34',1),(7,'user',1,NULL,1,'thanks','2025-05-13 17:53:39',1),(8,'admin',52,1,1,'ok','2025-05-13 17:53:44',0),(9,'admin',52,1,1,'goodbye','2025-05-13 17:54:06',0),(10,'admin',52,1,1,'h','2025-05-13 18:07:03',0),(11,'user',6,NULL,6,'доброго вечора я маю проблему','2025-05-20 21:35:43',1),(12,'user',55,NULL,55,'Зареєструвався','2025-05-21 10:44:00',1),(13,'admin',52,55,55,'Вітаю вас','2025-05-23 16:47:58',0),(14,'admin',52,6,6,'Яку','2025-05-23 16:49:31',0),(15,'admin',52,6,6,'Роскажіть якомога детальніше','2025-05-23 16:49:48',0),(16,'user',34,NULL,34,'Hi i have a problem','2025-05-23 16:53:04',1),(17,'admin',52,34,34,'Hi what type of problem do you have','2025-05-23 16:53:29',0),(18,'user',34,NULL,34,'404','2025-05-23 16:53:45',1),(19,'admin',52,34,34,'OK','2025-05-23 16:54:24',0),(20,'user',20,NULL,20,'Дякую за увагу','2025-05-31 00:19:16',0);
/*!40000 ALTER TABLE `support_messages` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-31 12:50:59
