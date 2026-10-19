-- Add new columns to products
ALTER TABLE products ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN stock_quantity INT DEFAULT 100;
ALTER TABLE products ADD COLUMN delivery_charge DECIMAL(10,2) DEFAULT 350.00;

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  shipping_address TEXT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_total DECIMAL(10,2) NOT NULL,
  delivery_charge DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  product_name VARCHAR(100) NOT NULL
);

-- Clear existing products and insert new ones based on the user's images
TRUNCATE TABLE products;

INSERT INTO products (title, short_desc, full_desc, image_url, display_order, price, discount, stock_quantity, delivery_charge) VALUES
('Cinnamon Sticks (C5 Grade)', 'Premium 100% Ceylon Cinnamon Sticks. Perfect for daily use, retail, and bulk export.', 'Crafted with tradition. Premium Grade C5 Ceylon Cinnamon Sticks. 100% Natural, hand harvested from the Heritage Lands of Sri Lanka. 100g Pack.', 'images/product1_quills.png', 1, 1500.00, 100.00, 50, 350.00),
('Cinnamon Powder', '100% Pure Ceylon Cinnamon Powder. Premium quality, rich aroma and flavor.', 'Experience the true taste and aroma of 100% Pure Ceylon Cinnamon powder, sourced from the finest cinnamon gardens in Sri Lanka. Perfect for cooking & baking. 100g Pack.', 'images/cinnamon_spices.jpg', 2, 1200.00, 50.00, 100, 350.00),
('Pure Cinnamon Leaf Oil', 'Pure Ceylon Leaf Oil. Steam distilled, pure & unadulterated.', 'Premium leaf oil extracted from the finest Ceylon Cinnamon leaves through steam distillation, preserving its natural purity. Perfect for Aromatherapy and Skincare. 30ml Bottle.', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80', 3, 2500.00, 0.00, 30, 350.00);
