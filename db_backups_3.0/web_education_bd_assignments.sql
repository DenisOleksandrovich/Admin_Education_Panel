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
  `posted_by_supervisor_id` int DEFAULT NULL,
  `posted_by_admin_id` int DEFAULT NULL,
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
  KEY `fk_assignment_supervisor` (`posted_by_supervisor_id`),
  KEY `fk_assignment_admin` (`posted_by_admin_id`),
  CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`posted_by`) REFERENCES `supervisors` (`supervisor_id`),
  CONSTRAINT `fk_assignment_admin` FOREIGN KEY (`posted_by_admin_id`) REFERENCES `accounts` (`account_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_assignment_supervisor` FOREIGN KEY (`posted_by_supervisor_id`) REFERENCES `supervisors` (`supervisor_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
INSERT INTO `assignments` VALUES (1,'Вибір теми та узгодження з керівником','Вибір теми дипломної роботи та узгодження з керівником','Протерміновано',NULL,NULL,1,'2025-01-03 12:58:14','2025-04-16 18:47:34','2025-04-05 00:00:01','Звітне',1,1,1,1,1),(2,'Критичний аналіз існуючих рішень','Проведення критичного аналізу існуючих рішень','Протерміновано',NULL,NULL,1,'2025-01-09 12:58:14','2025-04-16 18:47:34','2025-04-09 00:00:01','Практичне',1,1,1,1,1),(3,'Специфікація функціональних вимог до програмної системи','Розробка специфікації функціональних вимог до програмної системи','Протерміновано',NULL,NULL,2,'2025-01-19 12:58:14','2025-05-14 14:07:02','2025-04-19 00:00:01','Практичне',1,1,1,1,1),(4,'Специфікація нефункціональних вимог до програмної системи','Розробка специфікації нефункціональних вимог до програмної системи','Протерміновано',NULL,NULL,2,'2025-02-03 12:58:14','2025-05-14 14:07:02','2025-05-03 00:00:01','Практичне',1,1,1,1,1),(5,'Функціональна декомпозиція системи з виділенням модулів','Розбиття системи на модулі з функціональною декомпозицією','Протерміновано',NULL,NULL,4,'2025-02-03 12:58:14','2025-05-14 14:07:02','2025-05-09 00:00:01','Практичне',1,1,1,1,1),(6,'Динаміка процесів у системі','Аналіз динаміки процесів у системі','Протерміновано',NULL,NULL,1,'2025-02-03 12:58:14','2025-05-19 12:59:13','2025-05-19 00:00:01','Практичне',1,1,1,1,1),(7,'Розробка ER-моделі системи','Створення ER-моделі системи','Протерміновано',NULL,NULL,7,'2025-02-03 12:58:14','2025-05-21 00:10:18','2025-05-21 00:00:01','Практичне',1,1,1,1,1),(8,'Логічне проектування обраного модуля: структури даних, алгоритми','Розробка логічного проектування для структур даних та алгоритмів обраного модуля','Протерміновано',NULL,NULL,1,'2025-03-03 12:58:14','2025-05-23 00:10:19','2025-05-23 00:00:01','Практичне',1,1,1,1,1),(9,'Логічне проектування обраного модуля: інтерфейс користувача, діаграма класів','Розробка інтерфейсу користувача та діаграми класів для обраного модуля ','Опубліковано',NULL,NULL,9,'2025-03-03 12:58:14','2025-05-24 15:43:50','2025-06-01 00:07:00','practice',1,1,1,1,1),(10,'Програмна реалізація обраного модуля','Реалізація програмного коду обраного модуля','Протерміновано',NULL,NULL,6,'2025-03-03 12:58:14','2025-05-29 19:10:44','2025-05-27 00:00:01','Практичне',1,1,1,1,1),(11,'Тестування обраного модуля','Проведення тестування функціональності обраного модуля','Протерміновано',NULL,NULL,12,'2025-03-03 12:58:14','2025-05-29 19:10:44','2025-05-29 00:00:01','Практичне',1,1,1,1,1),(12,'Повністю оформлена пояснювальна записка','Підготовка та оформлення пояснювальної записки до дипломної роботи','Опубліковано',NULL,NULL,5,'2025-03-03 12:58:14','2025-05-14 14:07:02','2025-06-01 00:00:01','Звітне',1,1,1,1,1),(16,'test1','test1','Протерміновано',NULL,NULL,16,'2025-04-16 19:21:46','2025-05-14 14:07:02','2025-05-11 03:00:00','Звітне',1,1,1,1,1),(17,'Tesssst','Tesssst','Протерміновано',NULL,NULL,4,'2025-04-17 20:02:17','2025-05-14 14:07:02','2025-04-26 03:00:00','Практичне',1,1,1,1,1),(18,'Тестування редагування','Tesssst44444.com','Опубліковано',NULL,NULL,3,'2025-04-18 21:07:29','2025-05-14 14:07:02','2025-06-27 05:00:00','theory',1,1,1,1,1);
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `chk_poster_type_before_insert` BEFORE INSERT ON `assignments` FOR EACH ROW BEGIN
    -- Проверяем, не установлены ли оба поля одновременно
    IF NEW.posted_by_supervisor_id IS NOT NULL AND NEW.posted_by_admin_id IS NOT NULL THEN
        -- Если оба установлены, генерируем ошибку
        SIGNAL SQLSTATE '45000' -- '45000' - общий код для пользовательских ошибок
        SET MESSAGE_TEXT = 'Assignment cannot have both a supervisor and an admin as poster.';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_after_assignment_insert` AFTER INSERT ON `assignments` FOR EACH ROW BEGIN
  DECLARE new_event_id INT;

  -- Создаём событие дедлайна
  INSERT INTO events (
    supervisor_id, 
    event_name, 
    event_date, 
    event_description, 
    venue, 
    event_type, 
    duration
  )
  VALUES (
    NEW.posted_by, 
    CONCAT('Дедлайн: ', NEW.title),
    NEW.deadline,
    CONCAT('Закінчується строк здачі завдання: "', NEW.title, '"'),
    NULL,
    'Дедлайн',
    0
  );

  SET new_event_id = LAST_INSERT_ID();

  -- Привязываем событие к заданию (правильное имя таблицы!)
  INSERT INTO event_assignments (event_id, assignment_id)
  VALUES (new_event_id, NEW.assignment_id);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `chk_poster_type_before_update` BEFORE UPDATE ON `assignments` FOR EACH ROW BEGIN
    -- Проверяем, не установлены ли оба поля одновременно в обновляемой записи
    IF NEW.posted_by_supervisor_id IS NOT NULL AND NEW.posted_by_admin_id IS NOT NULL THEN
        -- Если оба установлены, генерируем ошибку
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Assignment cannot have both a supervisor and an admin as poster.';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-31 12:50:59
