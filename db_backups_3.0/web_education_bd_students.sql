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
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `student_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `student_card_number` varchar(50) NOT NULL,
  `department` varchar(100) NOT NULL,
  `study_group_id` int DEFAULT NULL,
  `phone` varchar(15) NOT NULL,
  `supervisor_id` int DEFAULT NULL,
  `total_progress` decimal(5,2) DEFAULT '0.00',
  `diploma_id` int DEFAULT NULL,
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `student_card_number` (`student_card_number`),
  KEY `study_group_id` (`study_group_id`),
  KEY `supervisor_id` (`supervisor_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`study_group_id`) REFERENCES `study_groups` (`study_group_id`),
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`supervisor_id`) REFERENCES `supervisors` (`supervisor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,'Андрій Малюта','maluta.andrii@stud.op.edu.ua','SCN001','Факультет ІТ',1,'+380501234567',1,95.00,1),(2,'Марія Ткаченко','tkachenko.maria@stud.op.edu.ua','SCN002','Факультет ІТ',2,'+380671234568',2,92.00,2),(3,'Віктор Павленко','pavlenko.viktor@stud.op.edu.ua','SCN003','Факультет ІТ',3,'+380931234567',25,88.00,3),(4,'Наталія Романенко','romanenko.natalia@stud.op.edu.ua','SCN004','Факультет ІТ',1,'+380991234570',1,85.00,4),(5,'Костянтин Петренко','petrov.kostyantyn@stud.op.edu.ua','SCN0051','Факультет ІТ',2,'+380661234572',2,62.00,5),(6,'Анна Сидорова','sydorova.anna@stud.op.edu.ua','SCN006','Факультет ІТ',3,'+380731234572',3,45.00,6),(7,'Михайло Іванов','ivanov.mykhailo@stud.op.edu.ua','SCN007','Факультет ІТ',1,'+380671234573',1,78.00,7),(8,'Єкатерина Козлова','kozlova.yekateryna@stud.op.edu.ua','SCN008','Факультет ІТ',2,'+380501234574',2,71.00,8),(9,'Олег Демченко','demchenko.oleg@stud.op.edu.ua','SCN009','Факультет ІТ',3,'+380931234575',3,89.00,9),(10,'Юлія Василенко','vasilenko.yuliya@stud.op.edu.ua','SCN010','Факультет ІТ',1,'+380661234576',1,93.00,10),(11,'Олександр Кравчук','kravchuk.oleksandr@stud.op.edu.ua','SCN011','Факультет ІТ',2,'+380991234577',2,77.00,11),(12,'Дарина Остапенко','ostapenko.daryna@stud.op.edu.ua','SCN012','Факультет ІТ',3,'+380731234578',3,68.00,12),(13,'Іван Гордієнко','hordiienko.ivan@stud.op.edu.ua','SCN013','Факультет ІТ',1,'+380671234579',1,55.00,13),(14,'Тетяна Лисенко','lysenko.tetiana@stud.op.edu.ua','SCN014','Факультет ІТ',2,'+380501234580',2,92.00,14),(15,'Роман Діденко','didenko.roman@stud.op.edu.ua','SCN015','Факультет ІТ',3,'+380931234581',3,84.00,15),(16,'Олексій Мельник','melnyk.oleksii@stud.op.edu.ua','SCN016','Факультет ІТ',1,'+380661234582',1,47.00,16),(17,'Світлана Бондар','bondar.svitlana@stud.op.edu.ua','SCN017','Факультет ІТ',2,'+380991234583',2,81.00,17),(18,'Артем Шевченко','shevchenko.artem@stud.op.edu.ua','SCN018','Факультет ІТ',3,'+380731234584',3,64.00,18),(19,'Ірина Поліщук','polishchuk.iryna@stud.op.edu.ua','SCN019','Факультет ІТ',5,'+380671234585',1,90.00,19),(20,'Денис Савченко','savchenko.denis@stud.op.edu.ua','SCN020','Факультет ІТ',2,'+380501234586',2,75.00,20),(21,'Derus Denis','derusdenis47@gmail.com','CP1499CP','IKS',10,'+380632469554',4,0.00,21),(23,'DERUS DENYS','banderaa1938@gmail.com','AS5645AB','IKS',4,'+380739930330',14,0.00,NULL),(24,'Валентин Петренко','valentin_petrenko@gmail.com','CP1277KK','Факультет ІТ',12,'+380739933474',9,0.00,NULL),(25,'Оксана Петриченко','oksanax1990@gmail.com','SCN0057','Факультет ІТ',17,'+80739930300',10,0.00,NULL),(26,'Микола Петренко','mykola777@gmail.com','SCN0055','Факультет ІТ',15,'+380739930300',5,0.00,NULL);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
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
