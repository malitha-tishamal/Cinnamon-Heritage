// ============================================================
// Cinnamon Heritage — Supabase Client
// Replace YOUR_PROJECT_URL and YOUR_ANON_KEY with your values
// from: Supabase Dashboard → Settings → API
// ============================================================

const SUPABASE_URL     = 'https://vvcvvmageratqqdqahvt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ty8HcfBuG1W-RKtxkjFKDw_va_CAmoc';

// CDN version — works with plain HTML (no bundler needed)
const { createClient } = window.supabase ?? supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,       // Replaces express-session (stores JWT in localStorage)
    detectSessionInUrl: true
  }
});

// ============================================================
// AUTH HELPERS
// ============================================================

/** Login admin → replaces POST /api/auth/login */
async function authLogin(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };

  // Verify admin role
  const { data: profile, error: pErr } = await db
    .from('profiles')
    .select('role, username')
    .eq('id', data.user.id)
    .single();

  if (pErr || profile?.role !== 'admin') {
    await db.auth.signOut();
    return { success: false, error: 'Access denied. Admin accounts only.' };
  }
  return { success: true, username: profile.username };
}

/** Signup → replaces POST /api/auth/signup */
async function authSignup(username, email, password) {
  const { data, error } = await db.auth.signUp({
    email, password,
    options: { data: { username, role: 'admin' } }
  });
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Account created! Please confirm your email then log in.' };
}

/** Logout → replaces POST /api/auth/logout */
async function authLogout() {
  await db.auth.signOut();
  location.reload();
}

/** Check current auth session → replaces GET /api/auth/status */
async function authStatus() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return { isLoggedIn: false, username: null };

  const { data: profile } = await db
    .from('profiles')
    .select('username, role')
    .eq('id', session.user.id)
    .single();

  return {
    isLoggedIn: true,
    isAdmin: profile?.role === 'admin',
    username: profile?.username ?? session.user.email
  };
}

/** Forgot password → replaces POST /api/auth/forgot-password */
async function authForgotPassword(email) {
  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/admin.html'
  });
  if (error) return { success: false, error: error.message };
  return { success: true, message: 'Password reset email sent! Check your inbox.' };
}

// ============================================================
// CONTENT HELPERS
// ============================================================

/** GET all site content → replaces GET /api/content */
async function getContent() {
  const { data, error } = await db.from('site_content').select('*');
  if (error || !data) return null;
  const content = {};
  data.forEach(row => {
    if (!content[row.section_name]) content[row.section_name] = {};
    content[row.section_name][row.field_name] = row.field_value;
  });
  return content;
}

/** Upsert site content field → replaces PUT /api/admin/content */
async function saveContentField(section_name, field_name, field_value) {
  const { error } = await db.from('site_content').upsert(
    { section_name, field_name, field_value, updated_at: new Date().toISOString() },
    { onConflict: 'section_name,field_name' }
  );
  if (error) throw error;
}

// ============================================================
// PRODUCTS HELPERS
// ============================================================

/** GET active products → replaces GET /api/products */
async function getProducts() {
  const { data, error } = await db
    .from('products')
    .select('*, order_items(quantity)')
    .eq('is_active', true)
    .order('display_order');
  if (error) return [];
  return data.map(p => ({
    ...p,
    total_sales: p.order_items?.reduce((s, oi) => s + oi.quantity, 0) ?? 0,
    order_items: undefined
  }));
}

/** GET all products (admin) */
async function getProductsAdmin() {
  const { data, error } = await db
    .from('products')
    .select('*, order_items(quantity)')
    .order('display_order');
  if (error) return [];
  return data.map(p => ({
    ...p,
    total_sales: p.order_items?.reduce((s, oi) => s + oi.quantity, 0) ?? 0,
    order_items: undefined
  }));
}

/** GET single product by ID → replaces GET /api/products/:id */
async function getProduct(id) {
  const { data, error } = await db
    .from('products').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

/** UPDATE product → replaces PUT /api/admin/products/:id */
async function updateProduct(id, fields) {
  const { error } = await db
    .from('products')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** CREATE product → replaces POST /api/admin/products */
async function createProduct(fields) {
  const { data, error } = await db
    .from('products')
    .insert([fields])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** DELETE product → replaces DELETE /api/admin/products/:id */
async function deleteProductById(id) {
  const { error } = await db.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// IMAGE UPLOAD
// ============================================================

/** Upload image to Supabase Storage → replaces POST /api/admin/upload */
async function uploadImage(file, bucket = 'product-images') {
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const { error } = await db.storage.from(bucket).upload(fileName, file, { upsert: false });
  if (error) throw error;
  const { data } = db.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

// ============================================================
// PROCESS STEPS HELPERS
// ============================================================

/** GET active process steps → replaces GET /api/process */
async function getProcessSteps() {
  const { data, error } = await db
    .from('process_steps')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) return [];
  return data;
}

/** GET all process steps (admin) */
async function getProcessStepsAdmin() {
  const { data, error } = await db
    .from('process_steps')
    .select('*')
    .order('display_order');
  if (error) return [];
  return data;
}

/** UPDATE step → replaces PUT /api/admin/process/:id */
async function updateStep(id, fields) {
  const { error } = await db
    .from('process_steps')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** CREATE step → replaces POST /api/admin/process */
async function createStep(fields) {
  const { data, error } = await db
    .from('process_steps').insert([fields]).select().single();
  if (error) throw error;
  return data;
}

/** DELETE step → replaces DELETE /api/admin/process/:id */
async function deleteStepById(id) {
  const { error } = await db.from('process_steps').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// ORDERS HELPERS
// ============================================================

/** Place order (atomic) → replaces POST /api/orders */
async function placeOrder(orderData) {
  const { data, error } = await db.rpc('place_order', {
    p_customer_name:    orderData.customer_name,
    p_customer_email:   orderData.customer_email,
    p_customer_phone:   orderData.customer_phone,
    p_shipping_address: orderData.shipping_address,
    p_product_id:       orderData.product_id,
    p_quantity:         orderData.quantity,
    p_subtotal:         orderData.subtotal,
    p_discount_total:   orderData.discount_total,
    p_delivery_charge:  orderData.delivery_charge,
    p_total_amount:     orderData.total_amount,
    p_product_name:     orderData.product_name,
    p_unit_price:       orderData.unit_price,
    p_payment_method:   orderData.payment_method ?? 'COD',
    p_district:         orderData.district ?? null,
    p_province:         orderData.province ?? null,
    p_bank_reference:   orderData.bank_reference ?? null
  });
  if (error) throw error;
  return data; // { success: true, order_id: N } or { success: false, error: '...' }
}

/** GET all orders (admin) → replaces GET /api/admin/orders */
async function getOrders() {
  const { data, error } = await db
    .from('orders')
    .select(`*, order_items(product_name, quantity, unit_price)`)
    .order('created_at', { ascending: false });
  if (error) return [];
  // Flatten for compatibility with existing UI code
  return data.map(o => ({
    ...o,
    product_name:  o.order_items?.[0]?.product_name ?? '',
    item_quantity: o.order_items?.[0]?.quantity ?? 0,
    unit_price:    o.order_items?.[0]?.unit_price ?? 0
  }));
}

/** UPDATE order status → replaces PUT /api/admin/orders/:id/status */
async function updateOrderStatus(id, status) {
  const { error } = await db.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
}

/** DELETE order → replaces DELETE /api/admin/orders/:id */
async function deleteOrderById(id) {
  const { error } = await db.from('orders').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// CONTACT MESSAGES HELPERS
// ============================================================

/** Submit contact message → replaces POST /api/contact */
async function submitContact({ from_name, from_email, phone, subject, message }) {
  const { error } = await db.from('contact_messages').insert([{
    name: from_name, email: from_email, phone: phone || null,
    subject: subject || null, message
  }]);
  if (error) throw error;
}

/** GET all messages (admin) → replaces GET /api/admin/messages */
async function getMessages() {
  const { data, error } = await db
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

/** Mark message read → replaces PUT /api/admin/messages/:id/read */
async function markMessageRead(id) {
  const { error } = await db.from('contact_messages').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

/** DELETE message → replaces DELETE /api/admin/messages/:id */
async function deleteMessageById(id) {
  const { error } = await db.from('contact_messages').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// SETTINGS & DELIVERY RATES HELPERS
// ============================================================

/** GET settings → replaces GET /api/settings */
async function getSettings() {
  const { data, error } = await db.from('site_settings').select('*');
  if (error) return {};
  const s = {};
  data.forEach(r => s[r.setting_key] = r.setting_value);
  return s;
}

/** Upsert setting → replaces PUT /api/admin/settings */
async function saveSetting(key, value) {
  const { error } = await db.from('site_settings').upsert(
    { setting_key: key, setting_value: value, updated_at: new Date().toISOString() },
    { onConflict: 'setting_key' }
  );
  if (error) throw error;
}

/** GET delivery rates → replaces GET /api/delivery-rates */
async function getDeliveryRates() {
  const { data, error } = await db
    .from('delivery_rates')
    .select('*')
    .order('province')
    .order('district');
  if (error) return [];
  return data;
}

/** Update delivery rate → replaces PUT /api/admin/delivery-rates/:id */
async function updateDeliveryRateById(id, rate) {
  const { error } = await db
    .from('delivery_rates')
    .update({ rate: parseFloat(rate) })
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// ANALYTICS (ADMIN)
// ============================================================

/** Dashboard stats → replaces GET /api/admin/stats */
async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [
    msgResult, prodResult, stepsResult, ordersResult,
    todayResult, monthResult, totalResult, salesResult
  ] = await Promise.all([
    db.from('contact_messages').select('id, is_read'),
    db.from('products').select('id').eq('is_active', true),
    db.from('process_steps').select('id').eq('is_active', true),
    db.from('orders').select('id'),
    db.from('orders').select('total_amount').neq('status','Cancelled').gte('created_at', today),
    db.from('orders').select('total_amount').neq('status','Cancelled').gte('created_at', monthStart),
    db.from('orders').select('total_amount').neq('status','Cancelled'),
    db.from('v_product_sales').select('*')
  ]);

  const sum = rows => (rows ?? []).reduce((s, r) => s + Number(r.total_amount ?? 0), 0);

  return {
    totalMessages:  msgResult.data?.length ?? 0,
    unreadMessages: msgResult.data?.filter(m => !m.is_read).length ?? 0,
    totalProducts:  prodResult.data?.length ?? 0,
    totalSteps:     stepsResult.data?.length ?? 0,
    totalOrders:    ordersResult.data?.length ?? 0,
    earningsToday:  sum(todayResult.data),
    earningsMonth:  sum(monthResult.data),
    totalEarnings:  sum(totalResult.data),
    productSales:   salesResult.data ?? []
  };
}

/** Accounts analytics → replaces GET /api/admin/accounts */
async function getAccountsData() {
  const [daily, monthly, location, products, payRaw] = await Promise.all([
    db.from('v_daily_revenue').select('*'),
    db.from('v_monthly_revenue').select('*'),
    db.from('v_location_revenue').select('*'),
    db.from('v_product_sales').select('*'),
    db.from('orders').select('payment_method, total_amount').neq('status', 'Cancelled')
  ]);

  // Aggregate payment stats client-side
  const payMap = {};
  (payRaw.data ?? []).forEach(o => {
    const pm = o.payment_method;
    if (!payMap[pm]) payMap[pm] = { revenue: 0, orders: 0 };
    payMap[pm].revenue += Number(o.total_amount);
    payMap[pm].orders++;
  });

  return {
    dailyRevenue:  daily.data   ?? [],
    monthlyRevenue: monthly.data ?? [],
    locationStats: location.data ?? [],
    productStats:  (products.data ?? []).map(p => ({
      product_name: p.product_name,
      total_qty: p.total_qty,
      total_revenue: p.total_revenue
    })),
    paymentStats: Object.entries(payMap).map(([payment_method, v]) => ({ payment_method, ...v }))
  };
}
