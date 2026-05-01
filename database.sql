-- ============================================
-- Cinnamon Heritage - Database Schema
-- Run this SQL in your MySQL server to create
-- the database and tables
-- ============================================

CREATE DATABASE IF NOT EXISTS cinnamon_heritage;
USE cinnamon_heritage;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Site content table (key-value store for all sections)
CREATE TABLE IF NOT EXISTS site_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_name VARCHAR(50) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  field_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_section_field (section_name, field_name)
);

-- Process steps table
CREATE TABLE IF NOT EXISTS process_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  step_number VARCHAR(5) NOT NULL,
  title VARCHAR(100) NOT NULL,
  short_desc VARCHAR(255),
  full_desc TEXT,
  image_url VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  short_desc VARCHAR(255),
  full_desc TEXT,
  image_url VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  subject VARCHAR(200),
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Default Data
-- ============================================

-- Default admin user (password: admin123 - CHANGE THIS!)
-- Password is bcrypt hash of 'admin123'
INSERT INTO admin_users (username, password, email) VALUES
('admin', '$2b$10$YourHashedPasswordHere', 'info@cinnamonheritage.com');

-- Hero section content
INSERT INTO site_content (section_name, field_name, field_value) VALUES
('hero', 'title', 'PURE CEYLON CINNAMON'),
('hero', 'subtitle', 'From our family estates in Galle Unanwitiya to the world — handcrafted, sustainably grown and certified authentic Ceylon cinnamon since 1982.'),
('hero', 'cta_text', 'Discover Our Heritage');

-- About section
INSERT INTO site_content (section_name, field_name, field_value) VALUES
('about', 'title', 'From Our Own Estate'),
('about', 'text', 'Nestled in the lush hillsides of Galle Unanwitiya, our family-owned estate spans over 15 acres of prime cinnamon-growing land. The southern coast of Sri Lanka — known globally as "Cinnamon Country" — provides the perfect tropical climate, rich laterite soils and monsoon rains that give Ceylon cinnamon its world-renowned delicate flavour and aroma. Three generations of our family have nurtured these lands using sustainable, organic farming methods passed down through the decades.');

-- Factory section
INSERT INTO site_content (section_name, field_name, field_value) VALUES
('factory', 'title', 'Our Facility'),
('factory', 'text', 'Our state-of-the-art processing facility combines centuries-old Sri Lankan craftsmanship with modern food-grade technology. Every workstation features hygienic stainless steel surfaces, and our advanced mechanical dryers are calibrated to preserve the delicate essential oils that make Ceylon cinnamon exceptional. Over 50 skilled local artisans work alongside quality-control specialists to ensure every batch meets international export standards including ISO 22000 and HACCP certification.');

-- Quality section
INSERT INTO site_content (section_name, field_name, field_value) VALUES
('quality', 'title', 'QUALITY ASSURANCE'),
('quality', 'text', 'Every batch of Cinnamon Heritage products undergoes rigorous laboratory testing for purity, moisture content and coumarin levels. We hold ISO 22000, HACCP and Sri Lanka Standards Institution certifications. Our sustainable farming practices protect the environment, empower our local community and guarantee that our cinnamon reaches you 100% natural — free of additives, preservatives and artificial colouring.');

-- Contact info
INSERT INTO site_content (section_name, field_name, field_value) VALUES
('contact', 'title', 'Contact Us'),
('contact', 'subtitle', 'Whether you are a wholesaler, retailer or artisan brand looking for authentic Ceylon cinnamon, we would love to hear from you. Reach out to discuss bulk orders, private labelling or any enquiries about our products.'),
('contact', 'address', 'Galle Unanwitiya, Sri Lanka'),
('contact', 'phone', '+94 77 123 4567'),
('contact', 'email', 'info@cinnamonheritage.com'),
('contact', 'whatsapp', '94771234567');

-- Process steps
INSERT INTO process_steps (step_number, title, short_desc, full_desc, image_url, display_order) VALUES
('01', 'Harvesting', 'Skilled workers hand-select mature stems at peak age for the finest bark quality.', 'Hand-selected mature stems are harvested from our cinnamon bushes. Our workers carefully select branches of the highest quality, ensuring the perfect balance of age and thickness for premium Ceylon cinnamon production.', 'images/step1_harvest.png', 1),
('02', 'Washing', 'Harvested bark is rigorously washed on stainless steel tables to ensure purity.', 'Before processing, the quills are thoroughly washed on top of stone or stainless steel tables with clean water. This rigorous industrial cleaning process ensures there is no residual soil or exterior contamination.', 'images/step2_wash.png', 2),
('03', 'Peeling', 'Expert peelers use traditional brass rods and precision knives to extract inner bark.', 'After removing the outer bark, highly trained peelers loosen the inner bark with specialized brass rods. They then carefully ease the bark off using precision stainless steel knives, showcasing incredible artisan skill combined with industrial efficiency.', 'images/step3_peel.png', 3),
('04', 'Drying', 'Quills are shade-dried on coir racks, then finished in precision mechanical dryers.', 'The delicately curled quills are initially dried on coir rope racks in shaded areas to preserve essential oils. Finally, they are finished using modern mechanical dryers to lock in deep colors and intense aromas perfectly.', 'images/step4_dry.png', 4),
('05', 'Packing', 'Each quill is graded to strict standards and hygienically sealed for export.', 'Quills are strictly graded according to standard thickness and appearance thresholds. Following this, they are hygienically sealed and packed into specialized containers, guaranteeing ultimate freshness and quality upon arrival.', 'images/step5_pack.png', 5);

-- Products
INSERT INTO products (title, short_desc, full_desc, image_url, display_order) VALUES
('Cinnamon Quills', 'Premium hand-rolled sticks graded C5 Special to H2, rich in aroma and flavour.', 'Our premium, hand-rolled Ceylon cinnamon quills. Carefully graded and cut to exact specifications. Perfect for culinary applications, brewing, and luxury garnishing.', 'images/product1_quills.png', 1),
('Cinnamon Powder', 'Stone-ground from select quills, preserving essential oils and natural sweetness.', 'Finely ground Ceylon cinnamon powder. Milled precisely to maintain its rich flavor profile and aromatic essential oils without burning during the grinding process.', 'images/cinnamon_spices.jpg', 2),
('Cinnamon Chips', 'Uniform bark chips perfect for artisan teas, tinctures and botanical blends.', 'Ceylon cinnamon bark chips neatly cut into uniform splints. Ideal for brewing robust artisan teas, crafting tinctures, and professional botanical extraction.', 'images/chips.jpg', 3),
('Cinnamon Oil', 'Steam-distilled pure essential oil with powerful aromatic and therapeutic properties.', 'Pure Ceylon cinnamon essential oil. Highly concentrated and extracted directly from our premium bark, delivering powerful aromatic and therapeutic properties.', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80', 4);
