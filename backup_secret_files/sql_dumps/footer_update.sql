-- Add footer settings
INSERT INTO site_settings (setting_key, setting_value) VALUES 
  ('footer_about', 'Premium Ceylon Cinnamon straight from our organic estates to your table. Experience the true taste of heritage.'),
  ('footer_address', 'Galle, Sri Lanka'),
  ('footer_phone', '+94 77 123 4567'),
  ('footer_email', 'info@cinnamonheritage.com'),
  ('social_facebook', 'https://facebook.com'),
  ('social_instagram', 'https://instagram.com'),
  ('social_twitter', 'https://twitter.com')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
