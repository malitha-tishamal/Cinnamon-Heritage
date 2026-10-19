-- Add bank_reference column to orders table
ALTER TABLE orders ADD COLUMN bank_reference VARCHAR(255) DEFAULT NULL AFTER province;

-- Add bank transfer settings
INSERT INTO site_settings (setting_key, setting_value) VALUES 
  ('bank_transfer_enabled', '1'),
  ('bank_name', 'Bank of Ceylon'),
  ('bank_branch', 'Galle Branch'),
  ('bank_acc_name', 'Cinnamon Heritage (Pvt) Ltd'),
  ('bank_acc_no', '8012345678')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
