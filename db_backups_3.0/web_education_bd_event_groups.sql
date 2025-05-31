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
-- Table structure for table `event_groups`
--

DROP TABLE IF EXISTS `event_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_groups` (
  `event_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`event_id`,`group_id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `event_groups_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE,
  CONSTRAINT `event_groups_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `study_groups` (`study_group_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_groups`
--

LOCK TABLES `event_groups` WRITE;
/*!40000 ALTER TABLE `event_groups` DISABLE KEYS */;
INSERT INTO `event_groups` VALUES (1,1),(17,1),(43,1),(44,1),(46,1),(1,2),(18,2),(37,2),(46,2),(2,3),(18,3),(46,3),(3,4),(19,4),(46,4),(3,5),(20,5),(46,5),(4,6),(20,6),(45,6),(46,6),(5,7),(45,7),(46,7),(5,8),(43,8),(44,8),(45,8),(46,8),(6,9),(46,9),(7,10),(46,10),(7,11),(46,11),(8,12),(43,12),(44,12),(46,12),(9,13),(46,13),(9,14),(46,14),(10,15),(43,15),(44,15),(45,15),(46,15),(11,16),(46,16),(11,17),(43,17),(44,17),(46,17),(12,18),(46,18),(13,19),(46,19),(14,20),(46,20),(14,21),(46,21),(15,22),(43,22),(44,22),(46,22),(16,23),(46,23),(16,24),(46,24);
/*!40000 ALTER TABLE `event_groups` ENABLE KEYS */;
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
