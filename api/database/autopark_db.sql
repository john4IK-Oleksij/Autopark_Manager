-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Paź 19, 2026 at 03:13 PM
-- Wersja serwera: 10.4.32-MariaDB
-- Wersja PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `autopark_db`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `buses`
--

CREATE TABLE `buses` (
  `id` int(11) NOT NULL,
  `plate_number` varchar(15) NOT NULL,
  `model` varchar(80) NOT NULL,
  `seats` int(11) NOT NULL,
  `company_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `buses`
--

INSERT INTO `buses` (`id`, `plate_number`, `model`, `seats`, `company_id`) VALUES
(1, 'BH1234AA', 'Mercedes-Benz Sprinter', 20, 1),
(2, 'BH5678BB', 'Iveco Daily', 18, 1),
(3, 'BH9012CC', 'MAN Lion\'s Coach', 50, 2),
(4, 'BH3456DD', 'Mercedes-Benz Tourismo', 52, 3),
(5, 'BH7890EE', 'Setra S 515', 49, 2),
(6, 'BH1001AA', 'Mercedes-Benz Sprinter', 20, 1),
(7, 'BH1002AA', 'Iveco Daily', 18, 1),
(8, 'BH1003AA', 'MAN Lion Coach', 50, 1),
(9, 'BH2001BB', 'Ford Transit', 17, 2),
(10, 'BH2002BB', 'Mercedes-Benz Tourismo', 52, 2),
(11, 'BH2003BB', 'Setra S 515', 49, 2),
(12, 'BH3001CC', 'Volkswagen Crafter', 19, 3),
(13, 'BH3002CC', 'Iveco Crossway', 45, 3),
(14, 'BH3003CC', 'Mercedes-Benz Intouro', 48, 3),
(15, 'BH4001DD', 'Setra S 516', 51, 4),
(16, 'BH4002DD', 'Ford Transit', 17, 4),
(17, 'BH4003DD', 'Iveco Daily', 18, 4),
(18, 'BH5001EE', 'MAN Lion Coach', 50, 5),
(19, 'BH5002EE', 'Mercedes-Benz Sprinter', 20, 5),
(20, 'BH5003EE', 'Setra S 515', 49, 5),
(21, 'BH1004AA', 'Ford Transit', 17, 1),
(22, 'BH1005AA', 'Setra S 515', 49, 1),
(23, 'BH2004BB', 'Iveco Daily', 18, 2),
(24, 'BH2005BB', 'MAN Lion Coach', 50, 2),
(25, 'BH3002DD', 'Ford Transit', 17, 3),
(26, 'BH3003DD', 'Setra S 516', 51, 3),
(27, 'BH4004DD', 'Mercedes-Benz Sprinter', 20, 4),
(28, 'BH4005DD', 'Iveco Crossway', 45, 4),
(29, 'BH5004EE', 'Mercedes-Benz Tourismo', 52, 5),
(30, 'BH5005EE', 'Volkswagen Crafter', 19, 5),
(31, 'TEST-API-001', 'Test Bus', 40, 1);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `companies`
--

CREATE TABLE `companies` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `phone` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `phone`) VALUES
(1, 'Coastline Transport', '+380487001105'),
(2, 'Odesa Travel', '+380487001104'),
(3, 'Southern Express', '+380487001103'),
(4, 'Odesa Trans', '+380487001101'),
(5, 'Black Sea Bus', '+380487001102');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `drivers`
--

CREATE TABLE `drivers` (
  `id` int(11) NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `license_number` varchar(20) NOT NULL,
  `company_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `drivers`
--

INSERT INTO `drivers` (`id`, `full_name`, `phone`, `license_number`, `company_id`) VALUES
(1, 'Олександр Коваль', '+380670001101', 'UA100001', 1),
(2, 'Ірина Мельник', '+380670001102', 'UA100002', 2),
(3, 'Андрій Бондар', '+380670001103', 'UA100003', 3),
(4, 'Наталія Шевченко', '+380670001104', 'UA100004', 4),
(5, 'Максим Ткаченко', '+380670001105', 'UA100005', 5),
(12, 'Петро Іваненко', '+380670001106', 'UA100006', 1),
(13, 'Марія Савчук', '+380670001107', 'UA100007', 1),
(14, 'Ірина Ткачук', '+380670001108', 'UA100008', 2),
(15, 'Олена Кравець', '+380670001109', 'UA100009', 2),
(16, 'Віктор Бойко', '+380670001110', 'UA100010', 3),
(17, 'Тетяна Романюк', '+380670001111', 'UA100011', 3),
(18, 'Дмитро Поліщук', '+380670001112', 'UA100012', 4),
(19, 'Ірина Ткачук', '+380670001113', 'UA100013', 4),
(20, 'Роман Козак', '+380670001114', 'UA100014', 5),
(21, 'Анна Лисенко', '+380670001115', 'UA100015', 5),
(22, 'Ігор Петренко', '+380670001116', 'UA100016', 1),
(23, 'Світлана Климчук', '+380670001117', 'UA100017', 1),
(24, 'Василь Мороз', '+380670001118', 'UA100018', 2),
(25, 'Юлія Мороз', '+380670001119', 'UA100019', 2),
(26, 'Микола Савенко', '+380670001120', 'UA100020', 3),
(27, 'Оксана Левченко', '+380670001121', 'UA100021', 3),
(28, 'Павло Гриценко', '+380670001122', 'UA100022', 4),
(29, 'Алла Ковальчук', '+380670001123', 'UA100023', 4),
(30, 'Богдан Сидоренко', '+380670001124', 'UA100024', 5),
(31, 'Вікторія Марчук', '+380670001125', 'UA100025', 5);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `driver_routes`
--

CREATE TABLE `driver_routes` (
  `driver_id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `driver_routes`
--

INSERT INTO `driver_routes` (`driver_id`, `route_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 4),
(2, 5),
(2, 6),
(3, 7),
(3, 8),
(3, 9),
(4, 10),
(4, 11),
(4, 12),
(5, 13),
(5, 14),
(5, 15),
(12, 1),
(12, 2),
(12, 3),
(13, 1),
(13, 2),
(13, 3),
(14, 4),
(14, 5),
(14, 6),
(15, 4),
(15, 5),
(15, 6),
(16, 7),
(16, 8),
(16, 9),
(17, 7),
(17, 8),
(17, 9),
(18, 10),
(18, 11),
(18, 12),
(19, 10),
(19, 11),
(19, 12),
(20, 13),
(20, 14),
(20, 15),
(21, 13),
(21, 14),
(21, 15),
(22, 1),
(22, 2),
(22, 3),
(22, 18),
(23, 1),
(23, 2),
(23, 3),
(24, 4),
(24, 5),
(24, 6),
(25, 4),
(25, 5),
(25, 6),
(26, 7),
(26, 8),
(26, 9),
(27, 7),
(27, 8),
(27, 9),
(28, 10),
(28, 11),
(28, 12),
(29, 10),
(29, 11),
(29, 12),
(30, 13),
(30, 14),
(30, 15),
(31, 13),
(31, 14),
(31, 15);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `routes`
--

CREATE TABLE `routes` (
  `id` int(11) NOT NULL,
  `number` int(11) NOT NULL,
  `title` varchar(120) NOT NULL,
  `distance_km` int(11) NOT NULL,
  `company_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `routes`
--

INSERT INTO `routes` (`id`, `number`, `title`, `distance_km`, `company_id`) VALUES
(1, 101, 'Centrum - Tairova', 14, 1),
(2, 102, 'Центр — Черемушки', 18, 1),
(3, 103, 'Вокзал — Аркадія', 12, 1),
(4, 201, 'Центр — Селище Котовського', 22, 2),
(5, 202, 'Вокзал — Лузанівка', 16, 2),
(6, 203, 'Центр — Аеропорт', 10, 2),
(7, 301, 'Центр — Таїрова', 17, 3),
(8, 302, 'Аркадія — Черемушки', 15, 3),
(9, 303, 'Вокзал — Селище Котовського', 21, 3),
(10, 401, 'Центр — Лузанівка', 13, 4),
(11, 402, 'Аеропорт — Аркадія', 11, 4),
(12, 403, 'Центр — Черемушки', 14, 4),
(13, 501, 'Вокзал — Таїрова', 19, 5),
(14, 502, 'Центр — Аркадія', 9, 5),
(15, 503, 'Селище Котовського — Лузанівка', 12, 5),
(18, 800, 'Центр - Центр (кільцевий)', 35, 1);

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `buses`
--
ALTER TABLE `buses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plate_number` (`plate_number`),
  ADD KEY `company_id` (`company_id`);

--
-- Indeksy dla tabeli `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indeksy dla tabeli `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `license_number` (`license_number`),
  ADD KEY `company_id` (`company_id`);

--
-- Indeksy dla tabeli `driver_routes`
--
ALTER TABLE `driver_routes`
  ADD PRIMARY KEY (`driver_id`,`route_id`),
  ADD KEY `route_id` (`route_id`);

--
-- Indeksy dla tabeli `routes`
--
ALTER TABLE `routes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `number` (`number`),
  ADD KEY `company_id` (`company_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `buses`
--
ALTER TABLE `buses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `routes`
--
ALTER TABLE `routes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `buses`
--
ALTER TABLE `buses`
  ADD CONSTRAINT `buses_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `drivers`
--
ALTER TABLE `drivers`
  ADD CONSTRAINT `drivers_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);

--
-- Constraints for table `driver_routes`
--
ALTER TABLE `driver_routes`
  ADD CONSTRAINT `driver_routes_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `driver_routes_ibfk_2` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`);

--
-- Constraints for table `routes`
--
ALTER TABLE `routes`
  ADD CONSTRAINT `routes_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
