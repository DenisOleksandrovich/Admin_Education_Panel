CREATE DATABASE  IF NOT EXISTS `web_education_bd` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `web_education_bd`;
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
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS `assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `description` text,
  `status` enum('Черновик','Опубліковано','Протерміновано','Відмінено') DEFAULT 'Опубліковано',
  `posted_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Коли опубліковано',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Остання зміна',
  `deadline` datetime DEFAULT NULL COMMENT 'Дедлайн виконання',
  `type` varchar(500) NOT NULL,
  `allow_text` tinyint(1) DEFAULT '1',
  `allow_file` tinyint(1) DEFAULT '1',
  `allow_pdf` tinyint(1) DEFAULT '1',
  `allow_doc` tinyint(1) DEFAULT '1',
  `allow_zip` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`assignment_id`),
  KEY `posted_by` (`posted_by`),
  CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`posted_by`) REFERENCES `supervisors` (`supervisor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
INSERT INTO `assignments` VALUES (1,'Вибір теми та узгодження з керівником','Вибір теми дипломної роботи та узгодження з керівником','Протерміновано',1,'2025-01-03 12:58:14','2025-04-16 18:47:34','2025-04-05 00:00:01','Звітне',1,1,1,1,1),(2,'Критичний аналіз існуючих рішень','Проведення критичного аналізу існуючих рішень','Протерміновано',1,'2025-01-09 12:58:14','2025-04-16 18:47:34','2025-04-09 00:00:01','Практичне',1,1,1,1,1),(3,'Специфікація функціональних вимог до програмної системи','Розробка специфікації функціональних вимог до програмної системи','Опубліковано',1,'2025-01-19 12:58:14','2025-04-16 18:47:34','2025-04-19 00:00:01','Практичне',1,1,1,1,1),(4,'Специфікація нефункціональних вимог до програмної системи','Розробка специфікації нефункціональних вимог до програмної системи','Опубліковано',1,'2025-02-03 12:58:14','2025-04-16 18:47:34','2025-05-03 00:00:01','Практичне',1,1,1,1,1),(5,'Функціональна декомпозиція системи з виділенням модулів','Розбиття системи на модулі з функціональною декомпозицією','Опубліковано',1,'2025-02-03 12:58:14','2025-04-16 18:47:34','2025-05-09 00:00:01','Практичне',1,1,1,1,1),(6,'Динаміка процесів у системі','Аналіз динаміки процесів у системі','Опубліковано',1,'2025-02-03 12:58:14','2025-04-16 18:47:34','2025-05-19 00:00:01','Практичне',1,1,1,1,1),(7,'Розробка ER-моделі системи','Створення ER-моделі системи','Опубліковано',1,'2025-02-03 12:58:14','2025-04-16 18:47:34','2025-05-21 00:00:01','Практичне',1,1,1,1,1),(8,'Логічне проектування обраного модуля: структури даних, алгоритми','Розробка логічного проектування для структур даних та алгоритмів обраного модуля','Опубліковано',1,'2025-03-03 12:58:14','2025-04-16 18:47:34','2025-05-23 00:00:01','Практичне',1,1,1,1,1),(9,'Логічне проектування обраного модуля: інтерфейс користувача, діаграма класів','Розробка інтерфейсу користувача та діаграми класів для обраного модуля','Опубліковано',1,'2025-03-03 12:58:14','2025-04-16 18:47:34','2025-05-25 00:00:01','Практичне',1,1,1,1,1),(10,'Програмна реалізація обраного модуля','Реалізація програмного коду обраного модуля','Опубліковано',1,'2025-03-03 12:58:14','2025-04-16 18:47:34','2025-05-27 00:00:01','Практичне',1,1,1,1,1),(11,'Тестування обраного модуля','Проведення тестування функціональності обраного модуля','Опубліковано',1,'2025-03-03 12:58:14','2025-04-16 18:47:34','2025-05-29 00:00:01','Практичне',1,1,1,1,1),(12,'Повністю оформлена пояснювальна записка','Підготовка та оформлення пояснювальної записки до дипломної роботи','Опубліковано',1,'2025-03-03 12:58:14','2025-04-16 18:47:34','2025-06-01 00:00:01','Звітне',1,1,1,1,1),(16,'test1','test1','Опубліковано',1,'2025-04-16 19:21:46','2025-04-17 11:23:24','2025-05-11 03:00:00','Звітне',1,1,1,1,1);
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-17 16:52:37
