-- ============================================================
-- CINNAMON HERITAGE — Supabase Full Setup SQL
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles (extends Supabase Auth users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLE: site_content
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_content (
  id            BIGSERIAL PRIMARY KEY,
  section_name  TEXT NOT NULL,
  field_name    TEXT NOT NULL,
  field_value   TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (section_name, field_name)
);

-- ============================================================
-- TABLE: process_steps
-- ============================================================
CREATE TABLE IF NOT EXISTS public.process_steps (
  id            BIGSERIAL PRIMARY KEY,
  step_number   TEXT NOT NULL,
  title         TEXT NOT NULL,
  short_desc    TEXT,
  full_desc     TEXT,
  image_url     TEXT,
  display_order INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id              BIGSERIAL PRIMARY KEY,
  title           TEXT NOT NULL,
  short_desc      TEXT,
  full_desc       TEXT,
  image_url       TEXT,
  display_order   INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  price           NUMERIC(10,2) DEFAULT 0.00,
  discount        NUMERIC(10,2) DEFAULT 0.00,
  stock_quantity  INT DEFAULT 100,
  delivery_charge NUMERIC(10,2) DEFAULT 350.00,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id               BIGSERIAL PRIMARY KEY,
  customer_name    TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  subtotal         NUMERIC(10,2) NOT NULL,
  discount_total   NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_charge  NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount     NUMERIC(10,2) NOT NULL,
  status           TEXT NOT NULL DEFAULT 'Pending'
                   CHECK (status IN ('Pending','Processing','Shipped','Delivered','Cancelled')),
  payment_method   TEXT DEFAULT 'COD' CHECK (payment_method IN ('COD','Bank Transfer','Online')),
  district         TEXT,
  province         TEXT,
  bank_reference   TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id           BIGSERIAL PRIMARY KEY,
  order_id     BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id   BIGINT NOT NULL REFERENCES public.products(id),
  quantity     INT NOT NULL,
  unit_price   NUMERIC(10,2) NOT NULL,
  product_name TEXT NOT NULL
);

-- ============================================================
-- TABLE: contact_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  subject    TEXT,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: delivery_rates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.delivery_rates (
  id         BIGSERIAL PRIMARY KEY,
  province   TEXT,
  district   TEXT UNIQUE,
  rate       NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: site_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  setting_key   TEXT PRIMARY KEY,
  setting_value TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STORED PROCEDURE: place_order (atomic transaction)
-- ============================================================
CREATE OR REPLACE FUNCTION public.place_order(
  p_customer_name    TEXT,
  p_customer_email   TEXT,
  p_customer_phone   TEXT,
  p_shipping_address TEXT,
  p_product_id       BIGINT,
  p_quantity         INT,
  p_subtotal         NUMERIC,
  p_discount_total   NUMERIC,
  p_delivery_charge  NUMERIC,
  p_total_amount     NUMERIC,
  p_product_name     TEXT,
  p_unit_price       NUMERIC,
  p_payment_method   TEXT DEFAULT 'COD',
  p_district         TEXT DEFAULT NULL,
  p_province         TEXT DEFAULT NULL,
  p_bank_reference   TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_stock    INT;
  v_order_id BIGINT;
BEGIN
  SELECT stock_quantity INTO v_stock
  FROM public.products WHERE id = p_product_id FOR UPDATE;

  IF v_stock IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  IF v_stock < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock');
  END IF;

  INSERT INTO public.orders (
    customer_name, customer_email, customer_phone, shipping_address,
    subtotal, discount_total, delivery_charge, total_amount,
    payment_method, district, province, bank_reference
  ) VALUES (
    p_customer_name, p_customer_email, p_customer_phone, p_shipping_address,
    p_subtotal, p_discount_total, p_delivery_charge, p_total_amount,
    p_payment_method, p_district, p_province, p_bank_reference
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, product_name)
  VALUES (v_order_id, p_product_id, p_quantity, p_unit_price, p_product_name);

  UPDATE public.products
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_product_id;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$;

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_steps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_rates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: is_admin()
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;

CREATE POLICY "profiles_select_own"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- RLS POLICIES: site_content (public read, admin write)
-- ============================================================
DROP POLICY IF EXISTS "sc_select" ON public.site_content;
DROP POLICY IF EXISTS "sc_insert" ON public.site_content;
DROP POLICY IF EXISTS "sc_update" ON public.site_content;
DROP POLICY IF EXISTS "sc_delete" ON public.site_content;

CREATE POLICY "sc_select" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "sc_insert" ON public.site_content FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "sc_update" ON public.site_content FOR UPDATE USING (public.is_admin());
CREATE POLICY "sc_delete" ON public.site_content FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES: process_steps
-- ============================================================
DROP POLICY IF EXISTS "ps_select" ON public.process_steps;
DROP POLICY IF EXISTS "ps_insert" ON public.process_steps;
DROP POLICY IF EXISTS "ps_update" ON public.process_steps;
DROP POLICY IF EXISTS "ps_delete" ON public.process_steps;

CREATE POLICY "ps_select" ON public.process_steps FOR SELECT USING (true);
CREATE POLICY "ps_insert" ON public.process_steps FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "ps_update" ON public.process_steps FOR UPDATE USING (public.is_admin());
CREATE POLICY "ps_delete" ON public.process_steps FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES: products
-- ============================================================
DROP POLICY IF EXISTS "prod_select" ON public.products;
DROP POLICY IF EXISTS "prod_insert" ON public.products;
DROP POLICY IF EXISTS "prod_update" ON public.products;
DROP POLICY IF EXISTS "prod_delete" ON public.products;

CREATE POLICY "prod_select" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "prod_insert" ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "prod_update" ON public.products FOR UPDATE USING (public.is_admin());
CREATE POLICY "prod_delete" ON public.products FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES: orders (public insert, admin read/update/delete)
-- ============================================================
DROP POLICY IF EXISTS "ord_insert" ON public.orders;
DROP POLICY IF EXISTS "ord_select" ON public.orders;
DROP POLICY IF EXISTS "ord_update" ON public.orders;
DROP POLICY IF EXISTS "ord_delete" ON public.orders;

CREATE POLICY "ord_insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "ord_select" ON public.orders FOR SELECT USING (public.is_admin());
CREATE POLICY "ord_update" ON public.orders FOR UPDATE USING (public.is_admin());
CREATE POLICY "ord_delete" ON public.orders FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES: order_items
-- ============================================================
DROP POLICY IF EXISTS "oi_insert" ON public.order_items;
DROP POLICY IF EXISTS "oi_select" ON public.order_items;

CREATE POLICY "oi_insert" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "oi_select" ON public.order_items FOR SELECT USING (public.is_admin());

-- ============================================================
-- RLS POLICIES: contact_messages
-- ============================================================
DROP POLICY IF EXISTS "cm_insert" ON public.contact_messages;
DROP POLICY IF EXISTS "cm_select" ON public.contact_messages;
DROP POLICY IF EXISTS "cm_update" ON public.contact_messages;
DROP POLICY IF EXISTS "cm_delete" ON public.contact_messages;

CREATE POLICY "cm_insert" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "cm_select" ON public.contact_messages FOR SELECT USING (public.is_admin());
CREATE POLICY "cm_update" ON public.contact_messages FOR UPDATE USING (public.is_admin());
CREATE POLICY "cm_delete" ON public.contact_messages FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES: delivery_rates
-- ============================================================
DROP POLICY IF EXISTS "dr_select" ON public.delivery_rates;
DROP POLICY IF EXISTS "dr_update" ON public.delivery_rates;

CREATE POLICY "dr_select" ON public.delivery_rates FOR SELECT USING (true);
CREATE POLICY "dr_update" ON public.delivery_rates FOR UPDATE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES: site_settings
-- ============================================================
DROP POLICY IF EXISTS "ss_select" ON public.site_settings;
DROP POLICY IF EXISTS "ss_all"    ON public.site_settings;

CREATE POLICY "ss_select" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "ss_all"    ON public.site_settings FOR ALL USING (public.is_admin());

-- ============================================================
-- ANALYTICS VIEWS
-- ============================================================
CREATE OR REPLACE VIEW public.v_daily_revenue AS
SELECT
  DATE(created_at AT TIME ZONE 'Asia/Colombo') AS date,
  SUM(total_amount) AS revenue,
  COUNT(*) AS orders
FROM public.orders
WHERE created_at >= NOW() - INTERVAL '30 days' AND status != 'Cancelled'
GROUP BY DATE(created_at AT TIME ZONE 'Asia/Colombo')
ORDER BY date ASC;

CREATE OR REPLACE VIEW public.v_monthly_revenue AS
SELECT
  EXTRACT(MONTH FROM created_at AT TIME ZONE 'Asia/Colombo')::INT AS month,
  SUM(total_amount) AS revenue,
  COUNT(*) AS orders
FROM public.orders
WHERE EXTRACT(YEAR FROM created_at AT TIME ZONE 'Asia/Colombo') = EXTRACT(YEAR FROM NOW())
  AND status != 'Cancelled'
GROUP BY EXTRACT(MONTH FROM created_at AT TIME ZONE 'Asia/Colombo')
ORDER BY month ASC;

CREATE OR REPLACE VIEW public.v_product_sales AS
SELECT
  p.title AS product_name,
  p.stock_quantity,
  COALESCE(SUM(oi.quantity), 0) AS total_qty,
  COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue,
  COALESCE(SUM(oi.quantity), 0) AS sales
FROM public.products p
LEFT JOIN public.order_items oi ON p.id = oi.product_id
LEFT JOIN public.orders o ON oi.order_id = o.id AND o.status != 'Cancelled'
GROUP BY p.id, p.title, p.stock_quantity
ORDER BY total_revenue DESC;

CREATE OR REPLACE VIEW public.v_location_revenue AS
SELECT
  district,
  SUM(total_amount) AS revenue,
  COUNT(*) AS orders
FROM public.orders
WHERE status != 'Cancelled' AND district IS NOT NULL AND district != ''
GROUP BY district
ORDER BY revenue DESC
LIMIT 10;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('process-images', 'process-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "product_images_public_read"  ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "product_images_admin_write"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "product_images_admin_delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "process_images_public_read"  ON storage.objects FOR SELECT USING (bucket_id = 'process-images');
CREATE POLICY "process_images_admin_write"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'process-images' AND public.is_admin());
CREATE POLICY "site_assets_public_read"     ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');
CREATE POLICY "site_assets_admin_write"     ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'site-assets' AND public.is_admin());

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO public.site_content (section_name, field_name, field_value) VALUES
('hero', 'title', 'PURE CEYLON CINNAMON'),
('hero', 'subtitle', 'From our Family Estates in Galle Unanwitiya to the World. Hand Crafted, Sustainably Grown and Certified Authentic Ceylon Cinnamon Since 1982.'),
('hero', 'cta_text', 'Discover Our Heritage'),
('about', 'title', 'From Our Own Estate'),
('about', 'text', 'Nestled in the lush hillsides of Galle Unanwitiya, our family-owned estate spans over 15 acres of prime cinnamon-growing land. The southern coast of Sri Lanka — known globally as "Cinnamon Country" — provides the perfect tropical climate, rich laterite soils and monsoon rains that give Ceylon cinnamon its world-renowned delicate flavour and aroma. Three generations of our family have nurtured these lands using sustainable, organic farming methods passed down through the decades.'),
('factory', 'title', 'Our Facility'),
('factory', 'text', 'Our state-of-the-art processing facility combines centuries-old Sri Lankan craftsmanship with modern food-grade technology. Every workstation features hygienic stainless steel surfaces, and our advanced mechanical dryers are calibrated to preserve the delicate essential oils that make Ceylon cinnamon exceptional.'),
('quality', 'title', 'QUALITY ASSURANCE'),
('quality', 'text', 'Every batch of Cinnamon Heritage products undergoes rigorous laboratory testing for purity, moisture content and coumarin levels. We hold ISO 22000, HACCP and Sri Lanka Standards Institution certifications.'),
('contact', 'title', 'Contact Us'),
('contact', 'subtitle', 'Whether you are a wholesaler, retailer or artisan brand looking for authentic Ceylon cinnamon, we would love to hear from you.'),
('contact', 'address', 'Galle Unanwitiya, Sri Lanka'),
('contact', 'phone', '+94 77 123 4567'),
('contact', 'email', 'info@cinnamonheritage.com'),
('contact', 'whatsapp', '94771234567')
ON CONFLICT (section_name, field_name) DO UPDATE SET field_value = EXCLUDED.field_value;

INSERT INTO public.products (title, short_desc, full_desc, image_url, display_order, price, discount, stock_quantity, delivery_charge) VALUES
('Cinnamon Sticks (C5 Grade)', 'Premium 100% Ceylon Cinnamon Sticks. Perfect for daily use, retail, and bulk export.', 'Crafted with tradition. Premium Grade C5 Ceylon Cinnamon Sticks. 100% Natural, hand harvested from the Heritage Lands of Sri Lanka. 100g Pack.', 'images/WhatsApp Image 2026-04-25 at 4.41.59 PM.jpeg', 1, 2500.00, 100.00, 5, 500.00),
('Cinnamon Powder', '100% Pure Ceylon Cinnamon Powder. Premium quality, rich aroma and flavor.', 'Experience the true taste and aroma of 100% Pure Ceylon Cinnamon powder, sourced from the finest cinnamon gardens in Sri Lanka. Perfect for cooking & baking. 100g Pack.', 'images/WhatsApp Image 2026-04-25 at 4.43.01 PM.jpeg', 2, 1200.00, 50.00, 100, 350.00),
('Pure Cinnamon Leaf Oil', 'Pure Ceylon Leaf Oil. Steam distilled, pure & unadulterated.', 'Premium leaf oil extracted from the finest Ceylon Cinnamon leaves through steam distillation, preserving its natural purity. Perfect for Aromatherapy and Skincare. 30ml Bottle.', 'images/WhatsApp Image 2026-04-25 at 4.42.30 PM.jpeg', 3, 2000.00, 0.00, 30, 350.00);

INSERT INTO public.process_steps (step_number, title, short_desc, full_desc, image_url, display_order) VALUES
('01', 'Harvesting', 'Skilled workers hand-select mature stems at peak age for the finest bark quality.', 'Hand-selected mature stems are harvested from our cinnamon bushes. Our workers carefully select branches of the highest quality, ensuring the perfect balance of age and thickness for premium Ceylon cinnamon production.', 'images/step1_harvest.png', 1),
('02', 'Washing', 'Harvested bark is rigorously washed on stainless steel tables to ensure purity.', 'Before processing, the quills are thoroughly washed on top of stone or stainless steel tables with clean water. This rigorous industrial cleaning process ensures there is no residual soil or exterior contamination.', 'images/step2_wash.png', 2),
('03', 'Peeling', 'Expert peelers use traditional brass rods and precision knives to extract inner bark.', 'After removing the outer bark, highly trained peelers loosen the inner bark with specialized brass rods.', 'images/step3_peel.png', 3),
('04', 'Drying', 'Quills are shade-dried on coir racks, then finished in precision mechanical dryers.', 'The delicately curled quills are initially dried on coir rope racks in shaded areas to preserve essential oils.', 'images/step4_dry.png', 4),
('05', 'Packing', 'Each quill is graded to strict standards and hygienically sealed for export.', 'Quills are strictly graded according to standard thickness and appearance thresholds. Following this, they are hygienically sealed and packed into specialized containers.', 'images/step5_pack.png', 5);

INSERT INTO public.delivery_rates (province, district, rate) VALUES
('Western', 'Colombo', 300.00), ('Western', 'Gampaha', 350.00), ('Western', 'Kalutara', 350.00),
('Central', 'Kandy', 450.00), ('Central', 'Matale', 450.00), ('Central', 'Nuwara Eliya', 500.00),
('Southern', 'Galle', 400.00), ('Southern', 'Matara', 400.00), ('Southern', 'Hambantota', 450.00),
('Northern', 'Jaffna', 600.00), ('Northern', 'Kilinochchi', 600.00), ('Northern', 'Mannar', 600.00),
('Northern', 'Vavuniya', 550.00), ('Northern', 'Mullaitivu', 600.00),
('Eastern', 'Trincomalee', 550.00), ('Eastern', 'Batticaloa', 550.00), ('Eastern', 'Ampara', 550.00),
('North Western', 'Kurunegala', 400.00), ('North Western', 'Puttalam', 450.00),
('North Central', 'Anuradhapura', 500.00), ('North Central', 'Polonnaruwa', 500.00),
('Uva', 'Badulla', 550.00), ('Uva', 'Moneragala', 550.00),
('Sabaragamuwa', 'Ratnapura', 450.00), ('Sabaragamuwa', 'Kegalle', 400.00)
ON CONFLICT (district) DO NOTHING;

INSERT INTO public.site_settings (setting_key, setting_value) VALUES
('cod_enabled', '1'), ('default_delivery_charge', '350.00'),
('low_stock_threshold', '10'), ('online_pay_enabled', '0')
ON CONFLICT (setting_key) DO NOTHING;
