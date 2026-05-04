const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ============================================
// Middleware
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use(session({
  secret: 'cinnamon-heritage-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 } // 1 year (persistent session)
}));

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'images');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage: storage });

// ============================================
// MySQL Connection Pool
// Update these credentials for your MySQL server
// ============================================
const pool = mysql.createPool({
  host: 'mysql-tishamal.alwaysdata.net',
  user: 'tishamal',
  password: 'malitha23',  // Your MySQL password
  database: 'tishamal_pro01',
  waitForConnections: true,
  connectionLimit: 10
});

// ============================================
// Auth Middleware
// ============================================
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
}

// ============================================
// AUTH ROUTES
// ============================================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM admin_users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.isAdmin = true;
    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({ success: true, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check auth status
app.get('/api/auth/status', (req, res) => {
  res.json({
    isLoggedIn: !!(req.session && req.session.isAdmin),
    username: req.session ? req.session.username : null
  });
});

// Check if admin setup is needed
app.get('/api/auth/needs-setup', async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT COUNT(*) as count FROM admin_users');
    res.json({ needsSetup: existing[0].count === 0 });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Setup first admin (only works if no admins exist)
app.post('/api/auth/setup', async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT COUNT(*) as count FROM admin_users');
    if (existing[0].count > 0) {
      return res.status(400).json({ error: 'Admin already exists. Use login.' });
    }

    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.execute(
      'INSERT INTO admin_users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email || '']
    );

    res.json({ success: true, message: 'Admin account created successfully!' });
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Signup (General)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Check if email or username already exists
    const [existing] = await pool.execute('SELECT * FROM admin_users WHERE email = ? OR username = ?', [email, username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO admin_users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email]
    );

    res.json({ success: true, message: 'Account created successfully! Please login.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    // Simulate sending email
    res.json({ success: true, message: 'Password reset instructions have been sent to your email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// ============================================
// CONTENT ROUTES (Public)
// ============================================

// Get all site content
app.get('/api/content', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM site_content');
    const content = {};
    rows.forEach(row => {
      if (!content[row.section_name]) content[row.section_name] = {};
      content[row.section_name][row.field_name] = row.field_value;
    });
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all process steps
app.get('/api/process', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM process_steps WHERE is_active = 1 ORDER BY display_order'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all products with analytics
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, 
             COALESCE(SUM(oi.quantity), 0) as total_sales
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      WHERE p.is_active = 1 
      GROUP BY p.id
      ORDER BY p.display_order
    `);
    res.json(rows);
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single product with analytics
app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, 
             COALESCE(SUM(oi.quantity), 0) as total_sales
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [req.params.id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get delivery rates
app.get('/api/delivery-rates', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM delivery_rates ORDER BY province, district');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get site settings
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM site_settings');
    const settings = {};
    rows.forEach(r => settings[r.setting_key] = r.setting_value);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/orders', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { 
      customer_name, customer_email, customer_phone, shipping_address,
      product_id, quantity, subtotal, discount_total, delivery_charge, total_amount,
      product_name, unit_price, payment_method, district, province, bank_reference
    } = req.body;

    // Check stock
    const [pRows] = await connection.execute('SELECT stock_quantity FROM products WHERE id = ?', [product_id]);
    if (pRows.length === 0 || pRows[0].stock_quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    // 1. Create order
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (customer_name, customer_email, customer_phone, shipping_address, subtotal, discount_total, delivery_charge, total_amount, payment_method, district, province, bank_reference) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_name, customer_email, customer_phone, shipping_address, subtotal, discount_total, delivery_charge, total_amount, payment_method || 'COD', district || '', province || '', bank_reference || null]
    );

    const orderId = orderResult.insertId;

    // 2. Create order item
    await connection.execute(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, product_name) 
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, product_id, quantity, unit_price, product_name]
    );

    // 3. Update stock quantity
    await connection.execute(
      'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
      [quantity, product_id]
    );

    await connection.commit();
    res.json({ success: true, orderId, message: 'Order placed successfully!' });
  } catch (err) {
    await connection.rollback();
    console.error('Order error:', err);
    res.status(500).json({ error: err.message || 'Failed to place order' });
  } finally {
    connection.release();
  }
});

// ============================================
// CONTACT ROUTE (Public)
// ============================================
app.post('/api/contact', async (req, res) => {
  try {
    const { from_name, from_email, phone, subject, message } = req.body;

    if (!from_name || !from_email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    await pool.execute(
      'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
      [from_name, from_email, phone || null, subject || null, message]
    );

    res.json({ success: true, message: 'Message received successfully' });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// ADMIN ROUTES (Protected)
// ============================================

// Update site content
app.put('/api/admin/content', requireAuth, async (req, res) => {
  try {
    const { section_name, field_name, field_value } = req.body;
    // Explicit UPDATE then INSERT to handle missing unique keys gracefully
    const [updateResult] = await pool.execute(
      'UPDATE site_content SET field_value = ? WHERE section_name = ? AND field_name = ?',
      [field_value, section_name, field_name]
    );
    if (updateResult.affectedRows === 0) {
      await pool.execute(
        'INSERT INTO site_content (section_name, field_name, field_value) VALUES (?, ?, ?)',
        [section_name, field_name, field_value]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Content update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Image Upload Endpoint
app.post('/api/admin/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  // Return the relative path to the image
  const imageUrl = 'images/' + req.file.filename;
  res.json({ success: true, imageUrl });
});

// Update process step
app.put('/api/admin/process/:id', requireAuth, async (req, res) => {
  try {
    const { title, short_desc, full_desc, image_url, display_order, is_active } = req.body;
    await pool.execute(
      `UPDATE process_steps SET title=?, short_desc=?, full_desc=?, image_url=?, display_order=?, is_active=? WHERE id=?`,
      [title, short_desc, full_desc, image_url, display_order || 0, is_active !== undefined ? is_active : 1, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new process step
app.post('/api/admin/process', requireAuth, async (req, res) => {
  try {
    const { step_number, title, short_desc, full_desc, image_url, display_order } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO process_steps (step_number, title, short_desc, full_desc, image_url, display_order) VALUES (?, ?, ?, ?, ?, ?)`,
      [step_number, title, short_desc, full_desc, image_url, display_order || 0]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete process step
app.delete('/api/admin/process/:id', requireAuth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM process_steps WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product
app.put('/api/admin/products/:id', requireAuth, async (req, res) => {
  try {
    const { title, short_desc, full_desc, image_url, display_order, is_active, price, discount, stock_quantity, delivery_charge } = req.body;
    await pool.execute(
      `UPDATE products SET title=?, short_desc=?, full_desc=?, image_url=?, display_order=?, is_active=?, price=?, discount=?, stock_quantity=?, delivery_charge=? WHERE id=?`,
      [title, short_desc, full_desc, image_url, display_order || 0, is_active !== undefined ? is_active : 1, price || 0, discount || 0, stock_quantity || 0, delivery_charge || 0, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new product
app.post('/api/admin/products', requireAuth, async (req, res) => {
  try {
    const { title, short_desc, full_desc, image_url, display_order, price, discount, stock_quantity, delivery_charge } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO products (title, short_desc, full_desc, image_url, display_order, price, discount, stock_quantity, delivery_charge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, short_desc, full_desc, image_url, display_order || 0, price || 0, discount || 0, stock_quantity || 0, delivery_charge || 0]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product
app.delete('/api/admin/products/:id', requireAuth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all contact messages (admin)
app.get('/api/admin/messages', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark message as read
app.put('/api/admin/messages/:id/read', requireAuth, async (req, res) => {
  try {
    await pool.execute('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete message
app.delete('/api/admin/messages/:id', requireAuth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// ADMIN ORDER ROUTES (Protected)
// ============================================

// Get all orders
app.get('/api/admin/orders', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT o.*, oi.product_name, oi.quantity as item_quantity, oi.unit_price 
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status
app.put('/api/admin/orders/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete order
app.delete('/api/admin/orders/:id', requireAuth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update site setting
app.put('/api/admin/settings', requireAuth, async (req, res) => {
  try {
    const { setting_key, setting_value } = req.body;
    await pool.execute(
      'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [setting_key, setting_value, setting_value]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update delivery rate
app.put('/api/admin/delivery-rates/:id', requireAuth, async (req, res) => {
  try {
    const { rate } = req.body;
    await pool.execute('UPDATE delivery_rates SET rate = ? WHERE id = ?', [rate, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get dashboard stats with earnings
app.get('/api/admin/stats', requireAuth, async (req, res) => {
  try {
    const [messages] = await pool.execute('SELECT COUNT(*) as total, SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread FROM contact_messages');
    const [products] = await pool.execute('SELECT COUNT(*) as total FROM products WHERE is_active = 1');
    const [steps] = await pool.execute('SELECT COUNT(*) as total FROM process_steps WHERE is_active = 1');
    const [orders] = await pool.execute('SELECT COUNT(*) as total FROM orders');
    
    // Earnings
    const [earningsToday] = await pool.execute('SELECT SUM(total_amount) as total FROM orders WHERE DATE(created_at) = CURDATE() AND status != "Cancelled"');
    const [earningsMonth] = await pool.execute('SELECT SUM(total_amount) as total FROM orders WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND status != "Cancelled"');
    const [totalEarnings] = await pool.execute('SELECT SUM(total_amount) as total FROM orders WHERE status != "Cancelled"');

    // Product Sales
    const [productSales] = await pool.execute(`
      SELECT p.title, COALESCE(SUM(oi.quantity), 0) as sales, p.stock_quantity 
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.id
    `);

    res.json({
      totalMessages: messages[0].total,
      unreadMessages: messages[0].unread || 0,
      totalProducts: products[0].total,
      totalSteps: steps[0].total,
      totalOrders: orders[0].total,
      earningsToday: earningsToday[0].total || 0,
      earningsMonth: earningsMonth[0].total || 0,
      totalEarnings: totalEarnings[0].total || 0,
      productSales
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET Detailed Accounts Data
app.get('/api/admin/accounts', requireAuth, async (req, res) => {
  try {
    // 1. Revenue by Day (Last 30 days)
    const [dailyRevenue] = await pool.execute(`
      SELECT DATE(created_at) as date, SUM(total_amount) as revenue, COUNT(*) as orders
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND status != "Cancelled"
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // 2. Revenue by Month (Current Year)
    const [monthlyRevenue] = await pool.execute(`
      SELECT MONTH(created_at) as month, SUM(total_amount) as revenue, COUNT(*) as orders
      FROM orders
      WHERE YEAR(created_at) = YEAR(CURDATE()) AND status != "Cancelled"
      GROUP BY MONTH(created_at)
      ORDER BY month ASC
    `);

    // 3. Revenue by Payment Method
    const [paymentStats] = await pool.execute(`
      SELECT payment_method, SUM(total_amount) as revenue, COUNT(*) as orders
      FROM orders
      WHERE status != "Cancelled"
      GROUP BY payment_method
    `);

    // 4. Revenue by District
    const [locationStats] = await pool.execute(`
      SELECT district, SUM(total_amount) as revenue, COUNT(*) as orders
      FROM orders
      WHERE status != "Cancelled" AND district IS NOT NULL AND district != ""
      GROUP BY district
      ORDER BY revenue DESC
      LIMIT 10
    `);

    // 5. Best Selling Products (Revenue & Qty)
    const [productStats] = await pool.execute(`
      SELECT oi.product_name, SUM(oi.quantity) as total_qty, SUM(oi.quantity * oi.unit_price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != "Cancelled"
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_revenue DESC
    `);

    res.json({
      dailyRevenue,
      monthlyRevenue,
      paymentStats,
      locationStats,
      productStats
    });
  } catch (err) {
    console.error('Accounts API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// Serve admin page
// ============================================
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log(`\n🌿 Cinnamon Heritage Server Running!`);
  console.log(`   Website:  http://localhost:${PORT}`);
  console.log(`   Admin:    http://localhost:${PORT}/admin`);
  console.log(`\n   Make sure MySQL is running and database is set up.`);
  console.log(`   Run database.sql in MySQL first if you haven't.\n`);
});
