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
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `account_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('student','supervisor','admin') NOT NULL,
  `student_id` int DEFAULT NULL,
  `supervisor_id` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`account_id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_student_account` (`student_id`),
  KEY `fk_supervisor_account` (`supervisor_id`),
  CONSTRAINT `fk_student_account` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_supervisor_account` FOREIGN KEY (`supervisor_id`) REFERENCES `supervisors` (`supervisor_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES (1,'derusdenis47@gmail.com','$2b$10$jx7nHDPrFCqZCltGuwQ7tOPcuPw5YzIdRQyXs.67IIeH0rrxvZGTm','student',21,NULL,1,'2025-05-14 14:33:46','2025-04-23 14:39:15'),(2,'maluta.andrii@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',1,NULL,1,'2025-05-29 20:20:57','2025-04-23 14:39:15'),(3,'tkachenko.maria@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',2,NULL,1,NULL,'2025-04-23 14:39:15'),(4,'pavlenko.viktor@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',3,NULL,1,'2025-05-24 20:53:47','2025-04-23 14:39:15'),(5,'romanenko.natalia@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',4,NULL,1,'2025-05-20 17:16:30','2025-04-23 14:39:15'),(6,'petrov.kostyantyn@stud.op.edu.ua','$2b$10$/yKPX7Y47sSwBtUfbNd1jeXclb7UjUG1kv4GHUROy.LDPUnBOmrum','student',5,NULL,1,'2025-05-23 16:20:26','2025-04-23 14:39:15'),(7,'sydorova.anna@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',6,NULL,1,NULL,'2025-04-23 14:39:15'),(8,'ivanov.mykhailo@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',7,NULL,1,NULL,'2025-04-23 14:39:15'),(9,'kozlova.yekateryna@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',8,NULL,1,'2025-05-20 17:07:39','2025-04-23 14:39:15'),(10,'demchenko.oleg@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',9,NULL,1,NULL,'2025-04-23 14:39:15'),(11,'vasilenko.yuliya@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',10,NULL,0,'2025-04-28 14:32:31','2025-04-23 14:39:15'),(12,'kravchuk.oleksandr@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',11,NULL,1,NULL,'2025-04-23 14:39:15'),(13,'ostapenko.daryna@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',12,NULL,1,NULL,'2025-04-23 14:39:15'),(14,'hordiienko.ivan@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',13,NULL,1,NULL,'2025-04-23 14:39:15'),(15,'lysenko.tetiana@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',14,NULL,1,NULL,'2025-04-23 14:39:15'),(16,'didenko.roman@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',15,NULL,1,'2025-05-20 16:59:29','2025-04-23 14:39:15'),(17,'melnyk.oleksii@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',16,NULL,1,NULL,'2025-04-23 14:39:15'),(18,'bondar.svitlana@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',17,NULL,1,NULL,'2025-04-23 14:39:15'),(19,'shevchenko.artem@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',18,NULL,1,NULL,'2025-04-23 14:39:15'),(20,'polishchuk.iryna@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',19,NULL,1,'2025-05-31 00:18:20','2025-04-23 14:39:15'),(21,'savchenko.denis@stud.op.edu.ua','$2b$12$HYp.6exJudMA5.fQwoEW5OaFgUQ6FyJeR05uiG7GxPG54.9SNHRsu','student',20,NULL,1,NULL,'2025-04-23 14:39:15'),(22,'kovalchuk@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,1,1,'2025-05-21 09:24:51','2025-04-23 14:39:15'),(23,'petrenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,2,1,NULL,'2025-04-23 14:39:15'),(24,'ivanov@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,3,1,NULL,'2025-04-23 14:39:15'),(25,'sydorenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,4,1,NULL,'2025-04-23 14:39:15'),(26,'marchenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,5,1,NULL,'2025-04-23 14:39:15'),(27,'romanova@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,6,1,NULL,'2025-04-23 14:39:15'),(28,'hryhorenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,7,1,NULL,'2025-04-23 14:39:15'),(29,'bondarenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,8,1,NULL,'2025-04-23 14:39:15'),(30,'kovalenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,9,1,'2025-05-30 21:59:40','2025-04-23 14:39:15'),(31,'lytvynenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,10,1,NULL,'2025-04-23 14:39:15'),(32,'andriy_babenko@el.opu','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,11,1,NULL,'2025-04-23 14:39:15'),(33,'goncharenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,12,1,NULL,'2025-04-23 14:39:15'),(34,'sokolova@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,13,1,'2025-05-23 16:52:52','2025-04-23 14:39:15'),(35,'melnyk@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,14,1,NULL,'2025-04-23 14:39:15'),(36,'kravchenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,15,1,NULL,'2025-04-23 14:39:15'),(37,'turchenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,16,1,NULL,'2025-04-23 14:39:15'),(38,'starenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,17,1,NULL,'2025-04-23 14:39:15'),(39,'doroshenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,18,1,NULL,'2025-04-23 14:39:15'),(40,'kozak@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,19,1,NULL,'2025-04-23 14:39:15'),(41,'rudnenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,20,1,NULL,'2025-04-23 14:39:15'),(42,'nazarenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,21,1,NULL,'2025-04-23 14:39:15'),(43,'levchenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,22,1,NULL,'2025-04-23 14:39:15'),(44,'pavlenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,23,1,NULL,'2025-04-23 14:39:15'),(45,'zaharchenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,24,1,NULL,'2025-04-23 14:39:15'),(46,'ishchenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,25,1,NULL,'2025-04-23 14:39:15'),(47,'kulikov@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,26,1,NULL,'2025-04-23 14:39:15'),(48,'fedorenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,27,1,NULL,'2025-04-23 14:39:15'),(49,'boyko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,28,1,NULL,'2025-04-23 14:39:15'),(50,'klimenko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,29,1,NULL,'2025-04-23 14:39:15'),(51,'sergienko@it.example.com','$2b$12$7osvvdPL1yGOPolMzkCh/.ICT4Fl23d33DRSfmiDWpkeDUsO4bPk.','supervisor',NULL,30,1,'2025-04-26 16:00:08','2025-04-23 14:39:15'),(52,'admin12@gmail.com','$2b$10$bmHH3/WougzqMxWP6XYW3eDizfpa7ppH296kkKwzEB0ILloNifnra','admin',NULL,20,1,'2025-05-30 17:20:52','2025-04-23 14:39:15'),(54,'banderaa1938@gmail.com','$2b$10$B1yOSGawNPrAdWTvRNw0GOyOOgVwM10odwWOmbfZ8TYm952pk7m12','student',23,NULL,1,'2025-05-11 15:30:23','2025-05-11 15:29:53'),(55,'valentin_petrenko@gmail.com','$2b$10$bRIM3tRU6vz0ZvOVnoTI0OooQwkgPaPaQ7Mlijyu9fvclIi0jHLqK','student',24,NULL,1,'2025-05-21 10:43:35','2025-05-21 10:42:52'),(56,'oksanax1990@gmail.com','$2b$10$EDsWqJaqME73i8LPbBI0UuvRHSdDEfJbiub2AgPp293Fg.QfcSAeu','student',25,NULL,1,NULL,'2025-05-29 20:47:39'),(57,'mykola777@gmail.com','$2b$10$ELxCN2E6lYNVO7R325oxlO/NUmSzszN1L8zpTAddiJuYPKz1N3PTy','student',26,NULL,1,NULL,'2025-05-30 20:42:54'),(58,'makarenko.valya@stud.op.edu.ua','$2b$10$2AJp.gHw6hjKsHDeXHjtq.tBy7Ny3.MMQLCwj8UVR.ww2jkh/054W','supervisor',NULL,31,1,NULL,'2025-05-30 20:46:58'),(59,'karpenko.kariy@gmail.com','$2b$10$AoSrjhtYlZFUUFDHbxCydu.yVtLIAQgPuROseqKxxrMkve72G.pp6','admin',NULL,31,1,NULL,'2025-05-30 20:50:18');
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
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
