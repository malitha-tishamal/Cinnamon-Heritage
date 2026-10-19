-- Footer Management Database Tables for Cinnamon Heritage
-- This file creates all necessary tables for dynamic footer management

-- --------------------------------------------------------

--
-- Table structure for table `footer_settings`
--

DROP TABLE IF EXISTS `footer_settings`;
CREATE TABLE IF NOT EXISTS `footer_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump data for table `footer_settings`
--

INSERT INTO `footer_settings` (`setting_key`, `setting_value`) VALUES
('footer_title', 'CINNAMON HERITAGE'),
('footer_description', 'Premium Ceylon Cinnamon straight from our family estate in Galle, Sri Lanka. Discover authentic cinnamon, essential oils and unforgettable experiences inspired by Sri Lankan heritage.'),
('footer_copyright', '© 2026 CINNAMON HERITAGE. ALL RIGHTS RESERVED.'),
('footer_certifications', '100% Organic • Pure Ceylon • ISO 22000 • HACCP'),
('developer_name', 'Malitha Tishamal'),
('developer_website', 'https://www.malithatishamal.42web.io'),
('developer_linkedin', 'https://linkedin.com/in/malithatishamal');

-- --------------------------------------------------------

--
-- Table structure for table `footer_contact`
--

DROP TABLE IF EXISTS `footer_contact`;
CREATE TABLE IF NOT EXISTS `footer_contact` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_type` varchar(50) NOT NULL,
  `contact_value` varchar(255) NOT NULL,
  `icon_class` varchar(100) DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump data for table `footer_contact`
--

INSERT INTO `footer_contact` (`contact_type`, `contact_value`, `icon_class`, `display_order`, `is_active`) VALUES
('address', 'Galle, Sri Lanka', 'bi-geo-alt', 1, 1),
('phone', '+94 77 123 4567', 'bi-telephone', 2, 1),
('email', 'info@cinnamonheritage.com', 'bi-envelope', 3, 1);

-- --------------------------------------------------------

--
-- Table structure for table `footer_links`
--

DROP TABLE IF EXISTS `footer_links`;
CREATE TABLE IF NOT EXISTS `footer_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `link_title` varchar(100) NOT NULL,
  `link_url` varchar(500) NOT NULL,
  `link_type` enum('internal','external') DEFAULT 'internal',
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump data for table `footer_links`
--

INSERT INTO `footer_links` (`link_title`, `link_url`, `link_type`, `display_order`, `is_active`) VALUES
('Our Heritage', '#heritage', 'internal', 1, 1),
('Ceylon Cinnamon', '#ceylon-cinnamon', 'internal', 2, 1),
('Products', '#products', 'internal', 3, 1),
('Essential Oils', '#essential-oils', 'internal', 4, 1),
('B2B Partnerships', '#b2b', 'internal', 5, 1),
('Our Process', '#process', 'internal', 6, 1),
('Quality & Responsibility', '#quality', 'internal', 7, 1),
('Cinnamon Experience', '#experience', 'internal', 8, 1),
('Contact', '#contact', 'internal', 9, 1);

-- --------------------------------------------------------

--
-- Table structure for table `policy_links`
--

DROP TABLE IF EXISTS `policy_links`;
CREATE TABLE IF NOT EXISTS `policy_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `policy_title` varchar(100) NOT NULL,
  `policy_url` varchar(500) NOT NULL,
  `policy_type` enum('internal','external') DEFAULT 'internal',
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump data for table `policy_links`
--

INSERT INTO `policy_links` (`policy_title`, `policy_url`, `policy_type`, `display_order`, `is_active`) VALUES
('Privacy Policy', '#privacy', 'internal', 1, 1),
('Terms & Conditions', '#terms', 'internal', 2, 1),
('Shipping Policy', '#shipping', 'internal', 3, 1),
('Returns & Refunds', '#returns', 'internal', 4, 1),
('Essential-Oil Safety', '#safety', 'internal', 5, 1),
('Product Disclaimer', '#disclaimer', 'internal', 6, 1);

-- --------------------------------------------------------

--
-- Table structure for table `social_media_links`
--

DROP TABLE IF EXISTS `social_media_links`;
CREATE TABLE IF NOT EXISTS `social_media_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `platform_name` varchar(50) NOT NULL,
  `platform_url` varchar(500) DEFAULT NULL,
  `icon_class` varchar(100) NOT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump data for table `social_media_links`
--

INSERT INTO `social_media_links` (`platform_name`, `platform_url`, `icon_class`, `display_order`, `is_active`) VALUES
('Facebook', 'https://facebook.com/cinnamonheritage', 'bi-facebook', 1, 1),
('Instagram', 'https://instagram.com/cinnamonheritage', 'bi-instagram', 2, 1),
('LinkedIn', 'https://linkedin.com/company/cinnamonheritage', 'bi-linkedin', 3, 1),
('TikTok', 'https://tiktok.com/@cinnamonheritage', 'bi-tiktok', 4, 1),
('YouTube', 'https://youtube.com/@cinnamonheritage', 'bi-youtube', 5, 1),
('X (Twitter)', 'https://twitter.com/cinnamonheritage', 'bi-twitter-x', 6, 1);
