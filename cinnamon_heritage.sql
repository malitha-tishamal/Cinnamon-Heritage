-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: May 01, 2026 at 05:34 PM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cinnamon_heritage`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admin_users`
--

INSERT INTO `admin_users` (`id`, `username`, `password`, `email`, `created_at`) VALUES
(1, 'Malitha Tishamal', '$2a$10$ftkUL8WFWBb9BkjR4Y/Szer9KHqvgQOJax.eb.6eI4JUczpV3sdpG', 'malithatishamal@gmail.com', '2026-04-25 10:17:05');

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `phone`, `subject`, `message`, `is_read`, `created_at`) VALUES
(1, 'Test User', 'test@example.com', '+94 77 111 2222', 'Test Message', 'This is a test message from the automated test script.', 1, '2026-04-25 10:39:54');

-- --------------------------------------------------------

--
-- Table structure for table `delivery_rates`
--

DROP TABLE IF EXISTS `delivery_rates`;
CREATE TABLE IF NOT EXISTS `delivery_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `province` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `district` (`district`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `delivery_rates`
--

INSERT INTO `delivery_rates` (`id`, `province`, `district`, `rate`, `created_at`) VALUES
(1, 'Western', 'Colombo', 300.00, '2026-04-25 13:04:04'),
(2, 'Western', 'Gampaha', 350.00, '2026-04-25 13:04:04'),
(3, 'Western', 'Kalutara', 350.00, '2026-04-25 13:04:04'),
(4, 'Central', 'Kandy', 450.00, '2026-04-25 13:04:04'),
(5, 'Central', 'Matale', 450.00, '2026-04-25 13:04:04'),
(6, 'Central', 'Nuwara Eliya', 500.00, '2026-04-25 13:04:04'),
(7, 'Southern', 'Galle', 400.00, '2026-04-25 13:04:04'),
(8, 'Southern', 'Matara', 400.00, '2026-04-25 13:04:04'),
(9, 'Southern', 'Hambantota', 450.00, '2026-04-25 13:04:04'),
(10, 'Northern', 'Jaffna', 600.00, '2026-04-25 13:04:04'),
(11, 'Northern', 'Kilinochchi', 600.00, '2026-04-25 13:04:04'),
(12, 'Northern', 'Mannar', 600.00, '2026-04-25 13:04:04'),
(13, 'Northern', 'Vavuniya', 550.00, '2026-04-25 13:04:04'),
(14, 'Northern', 'Mullaitivu', 600.00, '2026-04-25 13:04:04'),
(15, 'Eastern', 'Trincomalee', 550.00, '2026-04-25 13:04:04'),
(16, 'Eastern', 'Batticaloa', 550.00, '2026-04-25 13:04:04'),
(17, 'Eastern', 'Ampara', 550.00, '2026-04-25 13:04:04'),
(18, 'North Western', 'Kurunegala', 400.00, '2026-04-25 13:04:04'),
(19, 'North Western', 'Puttalam', 450.00, '2026-04-25 13:04:04'),
(20, 'North Central', 'Anuradhapura', 500.00, '2026-04-25 13:04:04'),
(21, 'North Central', 'Polonnaruwa', 500.00, '2026-04-25 13:04:04'),
(22, 'Uva', 'Badulla', 550.00, '2026-04-25 13:04:04'),
(23, 'Uva', 'Moneragala', 550.00, '2026-04-25 13:04:04'),
(24, 'Sabaragamuwa', 'Ratnapura', 450.00, '2026-04-25 13:04:04'),
(25, 'Sabaragamuwa', 'Kegalle', 400.00, '2026-04-25 13:04:04');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(100) NOT NULL,
  `customer_email` varchar(100) NOT NULL,
  `customer_phone` varchar(30) NOT NULL,
  `shipping_address` text NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `discount_total` decimal(10,2) NOT NULL,
  `delivery_charge` decimal(10,2) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_method` varchar(50) DEFAULT 'COD',
  `district` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `product_name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `process_steps`
--

DROP TABLE IF EXISTS `process_steps`;
CREATE TABLE IF NOT EXISTS `process_steps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `step_number` varchar(5) NOT NULL,
  `title` varchar(100) NOT NULL,
  `short_desc` varchar(255) DEFAULT NULL,
  `full_desc` text,
  `image_url` varchar(500) DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `process_steps`
--

INSERT INTO `process_steps` (`id`, `step_number`, `title`, `short_desc`, `full_desc`, `image_url`, `display_order`, `is_active`, `updated_at`) VALUES
(1, '01', 'Harvesting', 'Skilled workers hand-select mature stems at peak age for the finest bark quality.', 'Hand-selected mature stems are harvested from our cinnamon bushes. Our workers carefully select branches of the highest quality, ensuring the perfect balance of age and thickness for premium Ceylon cinnamon production.', 'images/step1_harvest.png', 1, 1, '2026-04-25 10:12:47'),
(2, '02', 'Washing', 'Harvested bark is rigorously washed on stainless steel tables to ensure purity.', 'Before processing, the quills are thoroughly washed on top of stone or stainless steel tables with clean water. This rigorous industrial cleaning process ensures there is no residual soil or exterior contamination.', 'images/step2_wash.png', 2, 1, '2026-04-25 10:12:47'),
(3, '03', 'Peeling', 'Expert peelers use traditional brass rods and precision knives to extract inner bark.', 'After removing the outer bark, highly trained peelers loosen the inner bark with specialized brass rods. They then carefully ease the bark off using precision stainless steel knives, showcasing incredible artisan skill combined with industrial efficiency.', 'images/step3_peel.png', 3, 1, '2026-04-25 10:12:47'),
(4, '04', 'Drying', 'Quills are shade-dried on coir racks, then finished in precision mechanical dryers.', 'The delicately curled quills are initially dried on coir rope racks in shaded areas to preserve essential oils. Finally, they are finished using modern mechanical dryers to lock in deep colors and intense aromas perfectly.', 'images/step4_dry.png', 4, 1, '2026-04-25 10:12:47'),
(5, '05', 'Packing', 'Each quill is graded to strict standards and hygienically sealed for export.', 'Quills are strictly graded according to standard thickness and appearance thresholds. Following this, they are hygienically sealed and packed into specialized containers, guaranteeing ultimate freshness and quality upon arrival.', 'images/step5_pack.png', 5, 1, '2026-04-25 10:12:47');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `short_desc` varchar(255) DEFAULT NULL,
  `full_desc` text,
  `image_url` varchar(500) DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `price` decimal(10,2) DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `stock_quantity` int DEFAULT '100',
  `delivery_charge` decimal(10,2) DEFAULT '350.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `title`, `short_desc`, `full_desc`, `image_url`, `display_order`, `is_active`, `updated_at`, `price`, `discount`, `stock_quantity`, `delivery_charge`) VALUES
(1, 'Cinnamon Sticks (C5 Grade)', 'Premium 100% Ceylon Cinnamon Sticks. Perfect for daily use, retail, and bulk export.', 'Crafted with tradition. Premium Grade C5 Ceylon Cinnamon Sticks. 100% Natural, hand harvested from the Heritage Lands of Sri Lanka. 100g Pack.', 'images/WhatsApp Image 2026-04-25 at 4.41.59 PM.jpeg', 1, 1, '2026-05-01 14:45:44', 2500.00, 100.00, 5, 500.00),
(2, 'Cinnamon Powder', '100% Pure Ceylon Cinnamon Powder. Premium quality, rich aroma and flavor.', 'Experience the true taste and aroma of 100% Pure Ceylon Cinnamon powder, sourced from the finest cinnamon gardens in Sri Lanka. Perfect for cooking & baking. 100g Pack.', 'images/WhatsApp Image 2026-04-25 at 4.43.01 PM.jpeg', 2, 1, '2026-04-25 12:30:05', 1200.00, 50.00, 100, 350.00),
(3, 'Pure Cinnamon Leaf Oil', 'Pure Ceylon Leaf Oil. Steam distilled, pure & unadulterated.', 'Premium leaf oil extracted from the finest Ceylon Cinnamon leaves through steam distillation, preserving its natural purity. Perfect for Aromatherapy and Skincare. 30ml Bottle.', 'images/WhatsApp Image 2026-04-25 at 4.42.30 PM.jpeg', 3, 1, '2026-05-01 17:20:41', 2000.00, 0.00, 30, 350.00);

-- --------------------------------------------------------

--
-- Table structure for table `site_content`
--

DROP TABLE IF EXISTS `site_content`;
CREATE TABLE IF NOT EXISTS `site_content` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_name` varchar(50) NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `field_value` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_section_field` (`section_name`,`field_name`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `site_content`
--

INSERT INTO `site_content` (`id`, `section_name`, `field_name`, `field_value`, `updated_at`) VALUES
(1, 'hero', 'title', 'PURE CEYLON CINNAMON', '2026-05-01 15:35:12'),
(2, 'hero', 'subtitle', 'From our Family Estates in Galle Unanwitiya to the World .Hand Crafted, Sustainably Grown and Certified Authentic Ceylon Cinnamon Since 1982.', '2026-05-01 14:43:18'),
(3, 'hero', 'cta_text', 'Discover Our Heritage', '2026-04-25 10:12:47'),
(4, 'about', 'title', 'From Our Own Estate', '2026-04-25 10:12:47'),
(5, 'about', 'text', 'Nestled in the lush hillsides of Galle Unanwitiya, our family-owned estate spans over 15 acres of prime cinnamon-growing land. The southern coast of Sri Lanka ÔÇö known globally as \"Cinnamon Country\" ÔÇö provides the perfect tropical climate, rich laterite soils and monsoon rains that give Ceylon cinnamon its world-renowned delicate flavour and aroma. Three generations of our family have nurtured these lands using sustainable, organic farming methods passed down through the decades.', '2026-04-25 10:12:47'),
(6, 'factory', 'title', 'Our Facility', '2026-04-25 10:12:47'),
(7, 'factory', 'text', 'Our state-of-the-art processing facility combines centuries-old Sri Lankan craftsmanship with modern food-grade technology. Every workstation features hygienic stainless steel surfaces, and our advanced mechanical dryers are calibrated to preserve the delicate essential oils that make Ceylon cinnamon exceptional. Over 50 skilled local artisans work alongside quality-control specialists to ensure every batch meets international export standards including ISO 22000 and HACCP certification.', '2026-04-25 10:12:47'),
(8, 'quality', 'title', 'QUALITY ASSURANCE', '2026-04-25 10:12:47'),
(9, 'quality', 'text', 'Every batch of Cinnamon Heritage products undergoes rigorous laboratory testing for purity, moisture content and coumarin levels. We hold ISO 22000, HACCP and Sri Lanka Standards Institution certifications. Our sustainable farming practices protect the environment, empower our local community and guarantee that our cinnamon reaches you 100% natural ÔÇö free of additives, preservatives and artificial colouring.', '2026-04-25 10:12:47'),
(10, 'contact', 'title', 'Contact Us', '2026-04-25 10:12:47'),
(11, 'contact', 'subtitle', 'Whether you are a wholesaler, retailer or artisan brand looking for authentic Ceylon cinnamon, we would love to hear from you. Reach out to discuss bulk orders, private labelling or any enquiries about our products.', '2026-04-25 10:12:47'),
(12, 'contact', 'address', 'Galle Unanwitiya, Sri Lanka', '2026-04-25 10:12:47'),
(13, 'contact', 'phone', '+94 77 123 4567', '2026-04-25 10:12:47'),
(14, 'contact', 'email', 'info@cinnamonheritage.com', '2026-04-25 10:12:47'),
(15, 'contact', 'whatsapp', '94771234567', '2026-04-25 10:12:47');

-- --------------------------------------------------------

--
-- Table structure for table `site_settings`
--

DROP TABLE IF EXISTS `site_settings`;
CREATE TABLE IF NOT EXISTS `site_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `site_settings`
--

INSERT INTO `site_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('cod_enabled', '1', '2026-04-25 13:04:04'),
('default_delivery_charge', '350.00', '2026-04-25 13:04:04'),
('low_stock_threshold', '10', '2026-04-25 13:04:04'),
('online_pay_enabled', '0', '2026-04-25 13:04:04');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
