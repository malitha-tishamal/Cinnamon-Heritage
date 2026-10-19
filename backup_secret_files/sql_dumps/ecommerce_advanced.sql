-- Add delivery rates table
CREATE TABLE IF NOT EXISTS delivery_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    province VARCHAR(100),
    district VARCHAR(100) UNIQUE,
    rate DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add site settings table
CREATE TABLE IF NOT EXISTS site_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default delivery rates for Sri Lanka
INSERT IGNORE INTO delivery_rates (province, district, rate) VALUES 
('Western', 'Colombo', 300.00),
('Western', 'Gampaha', 350.00),
('Western', 'Kalutara', 350.00),
('Central', 'Kandy', 450.00),
('Central', 'Matale', 450.00),
('Central', 'Nuwara Eliya', 500.00),
('Southern', 'Galle', 400.00),
('Southern', 'Matara', 400.00),
('Southern', 'Hambantota', 450.00),
('Northern', 'Jaffna', 600.00),
('Northern', 'Kilinochchi', 600.00),
('Northern', 'Mannar', 600.00),
('Northern', 'Vavuniya', 550.00),
('Northern', 'Mullaitivu', 600.00),
('Eastern', 'Trincomalee', 550.00),
('Eastern', 'Batticaloa', 550.00),
('Eastern', 'Ampara', 550.00),
('North Western', 'Kurunegala', 400.00),
('North Western', 'Puttalam', 450.00),
('North Central', 'Anuradhapura', 500.00),
('North Central', 'Polonnaruwa', 500.00),
('Uva', 'Badulla', 550.00),
('Uva', 'Moneragala', 550.00),
('Sabaragamuwa', 'Ratnapura', 450.00),
('Sabaragamuwa', 'Kegalle', 400.00);

-- Insert default settings
INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES 
('cod_enabled', '1'),
('online_pay_enabled', '0'),
('low_stock_threshold', '10'),
('default_delivery_charge', '350.00');

-- Add payment_method to orders table if not exists
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'COD';
ALTER TABLE orders ADD COLUMN district VARCHAR(100);
ALTER TABLE orders ADD COLUMN province VARCHAR(100);
