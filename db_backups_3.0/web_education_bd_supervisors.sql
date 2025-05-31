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
-- Table structure for table `supervisors`
--

DROP TABLE IF EXISTS `supervisors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supervisors` (
  `supervisor_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `department` varchar(100) NOT NULL,
  `avatar` varchar(555) DEFAULT NULL,
  `teacher_status` varchar(255) NOT NULL DEFAULT 'Доступний',
  `position` varchar(255) NOT NULL DEFAULT 'Професор',
  `specialization` varchar(555) DEFAULT NULL,
  PRIMARY KEY (`supervisor_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supervisors`
--

LOCK TABLES `supervisors` WRITE;
/*!40000 ALTER TABLE `supervisors` DISABLE KEYS */;
INSERT INTO `supervisors` VALUES (1,'Ковальчук Олександр Вікторович','kovalchuk@it.example.com','380501234567','ІТ','https://example.com/photos/kovalchuk.jpg','Доступний','Професор','Веб-розробка'),(2,'Петренко Марія Іванівна','petrenko@it.example.com','380501234568','ІТ','https://example.com/photos/petrenko.jpg','Доступний','Доцент','Мобільна розробка'),(3,'Іванов Віктор Степанович','ivanov@it.example.com','380501234569','ІТ','https://example.com/photos/ivanov.jpg','Обмежений','Професор','Кібербезпека'),(4,'Сидоренко Катерина Миколаївна','sydorenko@it.example.com','380501234570','ІТ','https://example.com/photos/sydorenko.jpg','Доступний','Доцент','Бази даних'),(5,'Марченко Дмитро Валерійович','marchenko@it.example.com','380501234571','ІТ','https://example.com/photos/marchenko.jpg','Обмежений','Доцент','Системна архітектура'),(6,'Романова Тетяна Олексіївна','romanova@it.example.com','380501234572','ІТ','https://example.com/photos/romanova.jpg','Не доступний','Професор','Інформаційна безпека'),(7,'Григоренко Андрій Павлович','hryhorenko@it.example.com','380501234573','ІТ','https://example.com/photos/hryhorenko.jpg','Доступний','Старший викладач','Розробка ПЗ'),(8,'Бондаренко Олена Геннадіївна','bondarenko@it.example.com','380501234574','ІТ','https://example.com/photos/bondarenko.jpg','Доступний','Доцент','UX/UI дизайн'),(9,'Коваленко Сергій Миколайович','kovalenko@it.example.com','380501234575','ІТ','https://example.com/photos/kovalenko.jpg','Доступний','Професор','Мережеві технології'),(10,'Литвиненко Оксана Петрівна','lytvynenko@it.example.com','380501234576','ІТ','https://example.com/photos/lytvynenko.jpg','Доступний','Доцент','Хмарні технології'),(11,'Бабенко Андрій Васильович','andriy_babenko@el.opu','+380631234577','Факультет ІТ','https://example.com/photos/babenko.jpg','Доступний','Доцент','Веб-сервіси'),(12,'Гончаренко Наталія Володимирівна','goncharenko@it.example.com','380501234578','ІТ','https://example.com/photos/goncharenko.jpg','Доступний','Доцент','Програмування на Python'),(13,'Соколова Інна Сергіївна','sokolova@it.example.com','380501234579','ІТ','https://example.com/photos/sokolova.jpg','Обмежений','Професор','JavaScript'),(14,'Мельник Вікторія Олександрівна','melnyk@it.example.com','380501234580','ІТ','https://example.com/photos/melnyk.jpg','Доступний','Доцент','Java'),(15,'Кравченко Олексій Юрійович','kravchenko@it.example.com','380501234581','ІТ','https://example.com/photos/kravchenko.jpg','Доступний','Професор','C#'),(16,'Турченко Володимир Олександрович','turchenko@it.example.com','380501234582','ІТ','https://example.com/photos/turchenko.jpg','Доступний','Доцент','PHP'),(17,'Старенко Лілія Миколаївна','starenko@it.example.com','380501234583','ІТ','https://example.com/photos/starenko.jpg','Доступний','Професор','Ruby on Rails'),(18,'Дорошенко Вадим Іванович','doroshenko@it.example.com','380501234584','ІТ','https://example.com/photos/doroshenko.jpg','Обмежений','Доцент','Scala'),(19,'Козак Олена Іванівна','kozak@it.example.com','380501234585','ІТ','https://example.com/photos/kozak.jpg','Доступний','Професор','Машинне навчання'),(20,'Руденко Павло Сергійович','rudnenko@it.example.com','380501234586','ІТ','https://example.com/photos/rudnenko.jpg','Доступний','Доцент','Data Science'),(21,'Назаренко Ірина Василівна','nazarenko@it.example.com','380501234587','ІТ','https://example.com/photos/nazarenko.jpg','Доступний','Професор','Big Data'),(22,'Левченко Олег Степанович','levchenko@it.example.com','380501234588','ІТ','https://example.com/photos/levchenko.jpg','Доступний','Доцент','DevOps'),(23,'Павленко Світлана Юріївна','pavlenko@it.example.com','380501234589','ІТ','https://example.com/photos/pavlenko.jpg','Обмежений','Професор','UI/UX'),(24,'Захарченко Михайло Олександрович','zaharchenko@it.example.com','380501234590','ІТ','https://example.com/photos/zaharchenko.jpg','Доступний','Доцент','Аналіз даних'),(25,'Іщенко Марія Дмитрівна','ishchenko@it.example.com','380501234591','ІТ','https://example.com/photos/ishchenko.jpg','Доступний','Професор','Мережеве адміністрування'),(26,'Куликов Сергій Олексійович','kulikov@it.example.com','380501234592','ІТ','https://example.com/photos/kulikov.jpg','Доступний','Доцент','Алгоритми та структури даних'),(27,'Федоренко Анна Василівна','fedorenko@it.example.com','380501234593','ІТ','https://example.com/photos/fedorenko.jpg','Обмежений','Професор','Інформаційні системи'),(28,'Бойко Олександр Миколайович','boyko@it.example.com','380501234594','ІТ','https://example.com/photos/boyko.jpg','Доступний','Доцент','Системне програмування'),(29,'Клименко Юрій Петрович','klimenko@it.example.com','380501234595','ІТ','https://example.com/photos/klimenko.jpg','Доступний','Професор','Архітектура ПЗ'),(30,'Сергієнко Дмитро Олександрович','sergienko@it.example.com','+380639930393','ІТ','https://example.com/photos/sergienko.jpg','Доступний','Доцент','Мікросервісна архітектура'),(31,'Макаренко Валентин Валентинович','makarenko.valya@stud.op.edu.ua','+380673340400','Факультет ІТ',NULL,'Доступний','Старший Викладач','ШІ');
/*!40000 ALTER TABLE `supervisors` ENABLE KEYS */;
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
