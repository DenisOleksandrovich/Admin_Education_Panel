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
-- Table structure for table `study_groups`
--

DROP TABLE IF EXISTS `study_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_groups` (
  `study_group_id` int NOT NULL AUTO_INCREMENT,
  `group_name` varchar(50) NOT NULL,
  `specialty` varchar(100) DEFAULT NULL,
  `course` int DEFAULT NULL,
  PRIMARY KEY (`study_group_id`),
  UNIQUE KEY `group_name` (`group_name`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `study_groups`
--

LOCK TABLES `study_groups` WRITE;
/*!40000 ALTER TABLE `study_groups` DISABLE KEYS */;
INSERT INTO `study_groups` VALUES (1,'АС-21-1','Інжинерія програмного забезпечення',4),(2,'АС-21-2','Інжинерія програмного забезпечення',4),(3,'АС-21-3','Інжинерія програмного забезпечення',4),(4,'АС-21-4','Інжинерія програмного забезпечення',4),(5,'АС-21-5','Інжинерія програмного забезпечення',4),(6,'АС-21-6','Інжинерія програмного забезпечення',4),(7,'АС-22-1','Інжинерія програмного забезпечення',3),(8,'АС-22-2','Інжинерія програмного забезпечення',3),(9,'АС-22-3','Інжинерія програмного забезпечення',3),(10,'АС-22-4','Інжинерія програмного забезпечення',3),(11,'АС-22-5','Інжинерія програмного забезпечення',3),(12,'АС-22-6','Інжинерія програмного забезпечення',3),(13,'АС-23-1','Інжинерія програмного забезпечення',2),(14,'АС-23-2','Інжинерія програмного забезпечення',2),(15,'АС-23-3','Інжинерія програмного забезпечення',2),(16,'АС-23-4','Інжинерія програмного забезпечення',2),(17,'АС-23-5','Інжинерія програмного забезпечення',2),(18,'АС-23-6','Інжинерія програмного забезпечення',2),(19,'АС-24-1','Інжинерія програмного забезпечення',1),(20,'АС-24-2','Інжинерія програмного забезпечення',1),(21,'АС-24-3','Інжинерія програмного забезпечення',1),(22,'АС-24-4','Інжинерія програмного забезпечення',1),(23,'АС-24-5','Інжинерія програмного забезпечення',1),(24,'АС-24-6','Інжинерія програмного забезпечення',1);
/*!40000 ALTER TABLE `study_groups` ENABLE KEYS */;
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
