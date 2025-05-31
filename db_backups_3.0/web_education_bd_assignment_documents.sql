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
-- Table structure for table `assignment_documents`
--

DROP TABLE IF EXISTS `assignment_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignment_documents` (
  `assignment_id` int NOT NULL,
  `document_url` varchar(500) NOT NULL COMMENT 'Посилання на документ або файл',
  KEY `fk_assignment_id` (`assignment_id`),
  CONSTRAINT `assignment_documents_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`assignment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_documents`
--

LOCK TABLES `assignment_documents` WRITE;
/*!40000 ALTER TABLE `assignment_documents` DISABLE KEYS */;
INSERT INTO `assignment_documents` VALUES (1,'https://edu.op.edu.ua/mod/assign/view.php?id=19504'),(2,'https://edu.op.edu.ua/mod/assign/view.php?id=19505'),(3,'https://edu.op.edu.ua/mod/assign/view.php?id=19506'),(4,'https://edu.op.edu.ua/mod/assign/view.php?id=19507'),(5,'https://edu.op.edu.ua/mod/assign/view.php?id=19508'),(6,'https://edu.op.edu.ua/mod/assign/view.php?id=19509'),(7,'https://edu.op.edu.ua/mod/assign/view.php?id=19510'),(8,'https://edu.op.edu.ua/mod/assign/view.php?id=19511'),(10,'https://edu.op.edu.ua/mod/assign/view.php?id=19513'),(11,'https://edu.op.edu.ua/mod/assign/view.php?id=19514'),(12,'https://edu.op.edu.ua/mod/assign/view.php?id=19515'),(16,'test1.com'),(18,'Tesssst44444.com'),(9,'https://edu.op.edu.ua/mod/assign/view.php?id=19512'),(9,'https://edu.op.edu.ua/mod/assign/view.php?id=19514');
/*!40000 ALTER TABLE `assignment_documents` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-31 12:50:58
