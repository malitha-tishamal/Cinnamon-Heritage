// ============================================
// Admin Panel JavaScript
// ============================================

const API = '';  // Base URL (empty = same origin)

// ============================================
// AUTH
// ============================================
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      document.getElementById('adminUsername').textContent = data.username;
      document.getElementById('loginScreen').classList.add('d-none');
      document.getElementById('dashboardScreen').classList.remove('d-none');
      loadDashboard();
    } else {
      errorDiv.textContent = data.error || 'Login failed';
      errorDiv.classList.remove('d-none');
    }
  } catch (err) {
    errorDiv.textContent = 'Cannot connect to server. Make sure the server is running.';
    errorDiv.classList.remove('d-none');
  }
});

// Setup form
document.getElementById('adminSetupForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  try {
    const res = await fetch(`${API}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('setupUsername').value,
        password: document.getElementById('setupPassword').value,
        email: document.getElementById('setupEmail').value
      })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast('Admin account created! Please login.', 'success');
      document.getElementById('setupForm').classList.add('d-none');
      document.getElementById('loginForm').classList.remove('d-none');
    } else {
      showAdminToast(data.error, 'error');
    }
  } catch (err) {
    showAdminToast('Server error', 'error');
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async function() {
  await fetch(`${API}/api/auth/logout`, { method: 'POST' });
  location.reload();
});

// Check auth on load
(async function checkAuth() {
  try {
    const res = await fetch(`${API}/api/auth/status`);
    const data = await res.json();
    if (data.isLoggedIn) {
      document.getElementById('adminUsername').textContent = data.username;
      document.getElementById('loginScreen').classList.add('d-none');
      document.getElementById('dashboardScreen').classList.remove('d-none');
      loadDashboard();
    } else {
      const setupRes = await fetch(`${API}/api/auth/needs-setup`);
      if (setupRes.ok) {
        const setupData = await setupRes.json();
        if (setupData.needsSetup) {
          document.getElementById('setupForm').classList.remove('d-none');
          document.getElementById('loginForm').classList.add('d-none');
        }
      }
    }
  } catch (err) {
    console.log('Server not running');
  }
})();

// ============================================
// SIDEBAR NAVIGATION
// ============================================
document.querySelectorAll('.sidebar-nav li').forEach(function(li) {
  li.addEventListener('click', function() {
    // Update active state
    document.querySelectorAll('.sidebar-nav li').forEach(l => l.classList.remove('active'));
    this.classList.add('active');

    // Show correct section
    const section = this.dataset.section;
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('d-none'));
    document.getElementById('sec-' + section).classList.remove('d-none');

    // Load section data
    loadSection(section);
  });
});

// ============================================
// LOAD FUNCTIONS
// ============================================
async function loadDashboard() {
  try {
    // Load stats
    const statsRes = await fetch(`${API}/api/admin/stats`);
    const stats = await statsRes.json();
    
    document.getElementById('statMessages').textContent = stats.totalMessages;
    document.getElementById('statUnread').textContent = stats.unreadMessages;
    document.getElementById('statProducts').textContent = stats.totalProducts;
    document.getElementById('statSteps').textContent = stats.totalSteps;
    document.getElementById('statOrders').textContent = stats.totalOrders;
    
    document.getElementById('statEarningsToday').textContent = `LKR ${stats.earningsToday.toLocaleString()}`;
    document.getElementById('statEarningsMonth').textContent = `LKR ${stats.earningsMonth.toLocaleString()}`;
    document.getElementById('statTotalEarnings').textContent = `LKR ${stats.totalEarnings.toLocaleString()}`;

    // Update unread badge
    const badge = document.getElementById('unreadBadge');
    if (stats.unreadMessages > 0) {
      badge.textContent = stats.unreadMessages;
      badge.classList.remove('d-none');
    }

    // Load product performance
    let perfHtml = '';
    stats.productSales.forEach(p => {
      const isLowStock = p.stock_quantity <= (parseInt(siteSettings.low_stock_threshold) || 10);
      const stockBadge = p.stock_quantity <= 0 ? 
        '<span class="badge bg-danger">Out of Stock</span>' : 
        (isLowStock ? '<span class="badge bg-warning text-dark">Low Stock</span>' : '<span class="badge bg-success">Healthy</span>');
      
      perfHtml += `
        <tr>
          <td><span class="fw-medium">${p.title}</span></td>
          <td><span class="badge bg-light text-dark border">${p.sales} Sales</span></td>
          <td><span class="${isLowStock ? 'text-danger fw-bold' : ''}">${p.stock_quantity}</span></td>
          <td>${stockBadge}</td>
        </tr>`;
    });
    document.getElementById('productPerformance').innerHTML = perfHtml;

    // Load recent messages
    const msgRes = await fetch(`${API}/api/admin/messages`);
    const messages = await msgRes.json();
    const recent = messages.slice(0, 5);

    let html = '<table class="table table-hover mb-0"><thead><tr><th>Name</th><th>Subject</th><th>Date</th><th>Status</th></tr></thead><tbody>';
    recent.forEach(m => {
      const date = new Date(m.created_at).toLocaleDateString();
      const status = m.is_read ? '<span class="badge bg-secondary">Read</span>' : '<span class="badge bg-danger">New</span>';
      html += `<tr><td>${m.name}</td><td>${m.subject || '-'}</td><td>${date}</td><td>${status}</td></tr>`;
    });
    html += '</tbody></table>';
    if (recent.length === 0) html = '<p class="text-muted">No messages yet.</p>';
    document.getElementById('recentMessages').innerHTML = html;
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

let siteSettings = {};

async function loadSection(section) {
  try {
    if (section === 'dashboard') return loadDashboard();
    if (section === 'process') return loadProcessSteps();
    if (section === 'products') return loadProducts();
    if (section === 'orders') return loadOrders();
    if (section === 'messages') return loadMessages();
    if (section === 'settings') return loadSettings();
    if (section === 'accounts') return loadAccounts();

    // Load content sections
    const res = await fetch(`${API}/api/content`);
    const content = await res.json();

    if (section === 'hero' && content.hero) {
      document.getElementById('heroTitle').value = content.hero.title || '';
      document.getElementById('heroSubtitle').value = content.hero.subtitle || '';
      document.getElementById('heroCta').value = content.hero.cta_text || '';
    }
    if (section === 'about' && content.about) {
      document.getElementById('aboutTitle').value = content.about.title || '';
      document.getElementById('aboutText').value = content.about.text || '';
    }
    if (section === 'factory' && content.factory) {
      document.getElementById('factoryTitle').value = content.factory.title || '';
      document.getElementById('factoryText').value = content.factory.text || '';
    }
    if (section === 'quality' && content.quality) {
      document.getElementById('qualityTitle').value = content.quality.title || '';
      document.getElementById('qualityText').value = content.quality.text || '';
    }
    if (section === 'contact-info' && content.contact) {
      document.getElementById('contactAddress').value = content.contact.address || '';
      document.getElementById('contactPhone').value = content.contact.phone || '';
      document.getElementById('contactEmailAddr').value = content.contact.email || '';
      document.getElementById('contactWhatsapp').value = content.contact.whatsapp || '';
      document.getElementById('contactSubtitleText').value = content.contact.subtitle || '';
    }
  } catch (err) {
    console.error('Load error:', err);
  }
}

// ============================================
// SAVE CONTENT
// ============================================
async function saveContent(section) {
  try {
    let fields = {};

    if (section === 'hero') {
      fields = {
        title: document.getElementById('heroTitle').value,
        subtitle: document.getElementById('heroSubtitle').value,
        cta_text: document.getElementById('heroCta').value
      };
    } else if (section === 'about') {
      fields = {
        title: document.getElementById('aboutTitle').value,
        text: document.getElementById('aboutText').value
      };
    } else if (section === 'factory') {
      fields = {
        title: document.getElementById('factoryTitle').value,
        text: document.getElementById('factoryText').value
      };
    } else if (section === 'quality') {
      fields = {
        title: document.getElementById('qualityTitle').value,
        text: document.getElementById('qualityText').value
      };
    } else if (section === 'contact') {
      fields = {
        address: document.getElementById('contactAddress').value,
        phone: document.getElementById('contactPhone').value,
        email: document.getElementById('contactEmailAddr').value,
        whatsapp: document.getElementById('contactWhatsapp').value,
        subtitle: document.getElementById('contactSubtitleText').value
      };
    }

    // Save each field
    for (const [field_name, field_value] of Object.entries(fields)) {
      const res = await fetch(`${API}/api/admin/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_name: section, field_name, field_value })
      });
      if (!res.ok) throw new Error('Save failed');
    }

    showAdminToast('Changes saved successfully!', 'success');
  } catch (err) {
    showAdminToast('Failed to save changes', 'error');
  }
}

// ============================================
// IMAGE UPLOAD
// ============================================
async function uploadImage(fileInput) {
  if (!fileInput.files || fileInput.files.length === 0) return null;
  const formData = new FormData();
  formData.append('image', fileInput.files[0]);
  
  try {
    const res = await fetch(`${API}/api/admin/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return data.imageUrl;
    } else {
      throw new Error(data.error || 'Upload failed');
    }
  } catch (err) {
    showAdminToast('Failed to upload image', 'error');
    return null;
  }
}

// ============================================
// PROCESS STEPS CRUD
// ============================================
async function loadProcessSteps() {
  try {
    const res = await fetch(`${API}/api/process`);
    const steps = await res.json();

    let html = '';
    steps.forEach(step => {
      html += `
        <div class="item-card" id="step-${step.id}">
          <div class="item-header">
            <h5><span class="text-muted me-2">#${step.step_number}</span> ${step.title}</h5>
            <div>
              <button class="btn btn-outline-danger btn-sm" onclick="deleteStep(${step.id})"><i class="bi bi-trash"></i></button>
            </div>
          </div>
          <div class="row g-3">
            <div class="col-md-2">
              <label class="form-label small fw-bold">Step #</label>
              <input type="text" class="form-control form-control-sm" id="stepNum-${step.id}" value="${step.step_number}">
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold">Title</label>
              <input type="text" class="form-control form-control-sm" id="stepTitle-${step.id}" value="${step.title}">
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold">Image URL</label>
              <input type="text" class="form-control form-control-sm" id="stepImg-${step.id}" value="${step.image_url || ''}">
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold">Short Description (card)</label>
              <textarea class="form-control form-control-sm" id="stepShort-${step.id}" rows="2">${step.short_desc || ''}</textarea>
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold">Full Description (modal)</label>
              <textarea class="form-control form-control-sm" id="stepFull-${step.id}" rows="2">${step.full_desc || ''}</textarea>
            </div>
            <div class="col-12">
              <button class="btn btn-accent btn-sm" onclick="saveStep(${step.id})"><i class="bi bi-check-lg me-1"></i>Save</button>
            </div>
          </div>
        </div>`;
    });

    if (steps.length === 0) html = '<p class="text-muted">No process steps yet. Click "Add Step" to create one.</p>';
    document.getElementById('processStepsList').innerHTML = html;
  } catch (err) {
    console.error('Load steps error:', err);
  }
}

async function saveStep(id) {
  try {
    await fetch(`${API}/api/admin/process/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: document.getElementById(`stepTitle-${id}`).value,
        short_desc: document.getElementById(`stepShort-${id}`).value,
        full_desc: document.getElementById(`stepFull-${id}`).value,
        image_url: document.getElementById(`stepImg-${id}`).value,
        display_order: parseInt(document.getElementById(`stepNum-${id}`).value) || 0,
        is_active: 1
      })
    });
    showAdminToast('Step saved!', 'success');
  } catch (err) {
    showAdminToast('Failed to save', 'error');
  }
}

async function addProcessStep() {
  try {
    const res = await fetch(`${API}/api/admin/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step_number: '00',
        title: 'New Step',
        short_desc: 'Description...',
        full_desc: 'Full description...',
        image_url: '',
        display_order: 99
      })
    });
    if (res.ok) {
      showAdminToast('New step added!', 'success');
      loadProcessSteps();
    }
  } catch (err) {
    showAdminToast('Failed to add step', 'error');
  }
}

async function deleteStep(id) {
  if (!confirm('Are you sure you want to delete this step?')) return;
  try {
    await fetch(`${API}/api/admin/process/${id}`, { method: 'DELETE' });
    showAdminToast('Step deleted', 'success');
    loadProcessSteps();
  } catch (err) {
    showAdminToast('Failed to delete', 'error');
  }
}

// ============================================
// PRODUCTS CRUD
// ============================================
async function loadProducts() {
  try {
    const res = await fetch(`${API}/api/products`);
    const products = await res.json();

    let html = '';
    products.forEach(p => {
      const isLowStock = p.stock_quantity <= (parseInt(siteSettings.low_stock_threshold) || 10);
      html += `
        <div class="item-card ${isLowStock ? 'border-warning' : ''}" id="product-${p.id}" style="${isLowStock ? 'border-left: 4px solid #ffc107;' : ''}">
          <div class="item-header">
            <h5>${p.title} ${isLowStock ? '<span class="badge bg-warning text-dark small ms-2">Low Stock</span>' : ''}</h5>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteProduct(${p.id})"><i class="bi bi-trash"></i></button>
          </div>
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label small fw-bold">Title</label>
              <input type="text" class="form-control form-control-sm" id="prodTitle-${p.id}" value="${p.title}">
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold">Image URL / Upload Image</label>
              <div class="input-group input-group-sm">
                <input type="text" class="form-control" id="prodImg-${p.id}" value="${p.image_url || ''}">
                <input type="file" class="form-control d-none" id="prodImgUpload-${p.id}" accept="image/*" onchange="handleProductImageUpload(${p.id})">
                <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('prodImgUpload-${p.id}').click()"><i class="bi bi-upload"></i> Upload</button>
              </div>
            </div>
            <div class="col-md-2">
              <label class="form-label small fw-bold">Price (LKR)</label>
              <input type="number" class="form-control form-control-sm" id="prodPrice-${p.id}" value="${p.price || 0}">
            </div>
            <div class="col-md-2">
              <label class="form-label small fw-bold">Discount (LKR)</label>
              <input type="number" class="form-control form-control-sm" id="prodDiscount-${p.id}" value="${p.discount || 0}">
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold">Stock Qty</label>
              <input type="number" class="form-control form-control-sm ${isLowStock ? 'is-invalid' : ''}" id="prodStock-${p.id}" value="${p.stock_quantity || 0}">
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold">Default Delivery</label>
              <input type="number" class="form-control form-control-sm" id="prodDelivery-${p.id}" value="${p.delivery_charge || 0}">
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold">Order</label>
              <input type="number" class="form-control form-control-sm" id="prodOrder-${p.id}" value="${p.display_order || 0}">
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold">Short Description (card)</label>
              <textarea class="form-control form-control-sm" id="prodShort-${p.id}" rows="2">${p.short_desc || ''}</textarea>
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold">Full Description (modal)</label>
              <textarea class="form-control form-control-sm" id="prodFull-${p.id}" rows="2">${p.full_desc || ''}</textarea>
            </div>
            <div class="col-12">
              <button class="btn btn-accent btn-sm" onclick="saveProduct(${p.id})"><i class="bi bi-check-lg me-1"></i>Save</button>
            </div>
          </div>
        </div>`;
    });

    if (products.length === 0) html = '<p class="text-muted">No products yet. Click "Add Product" to create one.</p>';
    document.getElementById('productsList').innerHTML = html;
  } catch (err) {
    console.error('Load products error:', err);
  }
}

async function handleProductImageUpload(id) {
  const fileInput = document.getElementById(`prodImgUpload-${id}`);
  const imageUrl = await uploadImage(fileInput);
  if (imageUrl) {
    document.getElementById(`prodImg-${id}`).value = imageUrl;
    showAdminToast('Image uploaded! Click Save to apply.', 'info');
  }
}

async function saveProduct(id) {
  try {
    await fetch(`${API}/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: document.getElementById(`prodTitle-${id}`).value,
        short_desc: document.getElementById(`prodShort-${id}`).value,
        full_desc: document.getElementById(`prodFull-${id}`).value,
        image_url: document.getElementById(`prodImg-${id}`).value,
        price: parseFloat(document.getElementById(`prodPrice-${id}`).value) || 0,
        discount: parseFloat(document.getElementById(`prodDiscount-${id}`).value) || 0,
        stock_quantity: parseInt(document.getElementById(`prodStock-${id}`).value) || 0,
        delivery_charge: parseFloat(document.getElementById(`prodDelivery-${id}`).value) || 0,
        display_order: parseInt(document.getElementById(`prodOrder-${id}`).value) || 0,
        is_active: 1
      })
    });
    showAdminToast('Product saved!', 'success');
  } catch (err) {
    showAdminToast('Failed to save', 'error');
  }
}

function addProduct() {
  document.getElementById('newProdTitle').value = '';
  document.getElementById('newProdImg').value = '';
  document.getElementById('newProdPrice').value = '0';
  document.getElementById('newProdDiscount').value = '0';
  document.getElementById('newProdStock').value = '10';
  document.getElementById('newProdDelivery').value = '350';
  document.getElementById('newProdOrder').value = '99';
  document.getElementById('newProdShort').value = '';
  document.getElementById('newProdFull').value = '';
  document.getElementById('newProdImgUpload').value = ''; // Reset file input

  const modal = new bootstrap.Modal(document.getElementById('addProductModal'));
  modal.show();
}

async function handleNewProductImageUpload() {
  const fileInput = document.getElementById('newProdImgUpload');
  const imageUrl = await uploadImage(fileInput);
  if (imageUrl) {
    document.getElementById('newProdImg').value = imageUrl;
    showAdminToast('Image uploaded!', 'info');
  }
}

async function submitNewProduct() {
  try {
    const res = await fetch(`${API}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: document.getElementById('newProdTitle').value || 'New Product',
        short_desc: document.getElementById('newProdShort').value,
        full_desc: document.getElementById('newProdFull').value,
        image_url: document.getElementById('newProdImg').value,
        price: parseFloat(document.getElementById('newProdPrice').value) || 0,
        discount: parseFloat(document.getElementById('newProdDiscount').value) || 0,
        stock_quantity: parseInt(document.getElementById('newProdStock').value) || 0,
        delivery_charge: parseFloat(document.getElementById('newProdDelivery').value) || 0,
        display_order: parseInt(document.getElementById('newProdOrder').value) || 0,
        is_active: 1
      })
    });
    if (res.ok) {
      showAdminToast('New product added!', 'success');
      const modalEl = document.getElementById('addProductModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();
      loadProducts();
    }
  } catch (err) {
    showAdminToast('Failed to add product', 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    await fetch(`${API}/api/admin/products/${id}`, { method: 'DELETE' });
    showAdminToast('Product deleted', 'success');
    loadProducts();
    // Intentionally removed location.reload() so it stays in the section
  } catch (err) {
    showAdminToast('Failed to delete', 'error');
  }
}

// ============================================
// ORDERS
// ============================================
async function loadOrders() {
  try {
    const res = await fetch(`${API}/api/admin/orders`);
    const orders = await res.json();

    let html = '';
    orders.forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString();
      const statusClass = getStatusClass(o.status);
      html += `
        <tr>
          <td class="ps-4">#${o.id}</td>
          <td>
            <div class="fw-bold">${o.customer_name}</div>
            <div class="small text-muted">${o.customer_phone}</div>
          </td>
          <td>
            <div class="small fw-bold">${o.district || 'N/A'}</div>
            <div class="small text-muted">${o.province || ''}</div>
          </td>
          <td>
            <div class="small fw-bold">${o.product_name}</div>
            <div class="small text-muted">Qty: ${o.item_quantity}</div>
          </td>
          <td>
            <span class="badge bg-light text-dark border small">${o.payment_method}</span>
          </td>
          <td>LKR ${o.total_amount.toLocaleString()}</td>
          <td><span class="badge ${statusClass}">${o.status}</span></td>
          <td class="text-end pe-4">
            <button class="btn btn-outline-light btn-sm me-1" onclick="viewOrder(${o.id})"><i class="bi bi-eye"></i></button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteOrder(${o.id})"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`;
    });

    if (orders.length === 0) html = '<tr><td colspan="8" class="text-center p-4 text-muted">No orders found.</td></tr>';
    document.getElementById('ordersList').innerHTML = html;
  } catch (err) {
    console.error('Load orders error:', err);
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'Pending': return 'bg-warning text-dark';
    case 'Processing': return 'bg-info text-dark';
    case 'Shipped': return 'bg-primary';
    case 'Delivered': return 'bg-success';
    case 'Cancelled': return 'bg-danger';
    default: return 'bg-secondary';
  }
}

let allOrders = []; // To store for viewing details

async function viewOrder(id) {
  try {
    const res = await fetch(`${API}/api/admin/orders`);
    const orders = await res.json();
    const order = orders.find(o => o.id === id);
    
    document.getElementById('modalOrderId').textContent = order.id;
    
    let html = `
      <div class="row">
        <div class="col-md-6 mb-4">
          <h6 class="fw-bold text-accent border-bottom pb-2">Customer Details</h6>
          <p class="mb-1"><strong>Name:</strong> ${order.customer_name}</p>
          <p class="mb-1"><strong>Email:</strong> ${order.customer_email}</p>
          <p class="mb-1"><strong>Phone:</strong> ${order.customer_phone}</p>
          <p class="mb-1"><strong>District:</strong> ${order.district || 'N/A'} | ${order.province || ''}</p>
          <p class="mb-1"><strong>Address:</strong> ${order.shipping_address}</p>
        </div>
        <div class="col-md-6 mb-4">
          <h6 class="fw-bold text-accent border-bottom pb-2">Order Info</h6>
          <p class="mb-1"><strong>Status:</strong> ${order.status}</p>
          <p class="mb-1"><strong>Payment:</strong> <span class="badge bg-light text-dark border">${order.payment_method}</span></p>
          <p class="mb-1"><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
          <div class="mt-3">
            <label class="form-label small fw-bold">Update Status</label>
            <select class="form-select form-select-sm" onchange="updateOrderStatus(${order.id}, this.value)">
              <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
              <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>
        <div class="col-12">
          <h6 class="fw-bold text-accent border-bottom pb-2">Item Summary</h6>
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Product</th>
                <th class="text-center">Price</th>
                <th class="text-center">Qty</th>
                <th class="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${order.product_name}</td>
                <td class="text-center">LKR ${order.unit_price.toLocaleString()}</td>
                <td class="text-center">${order.item_quantity}</td>
                <td class="text-end">LKR ${(order.unit_price * order.item_quantity).toLocaleString()}</td>
              </tr>
            </tbody>
            <tfoot class="border-top-0">
              <tr>
                <td colspan="3" class="text-end border-0 small">Subtotal:</td>
                <td class="text-end border-0 small">LKR ${order.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-end border-0 small text-success">Discount:</td>
                <td class="text-end border-0 small text-success">- LKR ${order.discount_total.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-end border-0 small">Delivery Charge:</td>
                <td class="text-end border-0 small">LKR ${order.delivery_charge.toLocaleString()}</td>
              </tr>
              <tr class="fw-bold fs-5">
                <td colspan="3" class="text-end border-0">Total:</td>
                <td class="text-end border-0 text-accent">LKR ${order.total_amount.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
    
    document.getElementById('modalOrderBody').innerHTML = html;
    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
  } catch (err) {
    console.error(err);
  }
}

// ============================================
// SETTINGS
// ============================================
async function loadSettings() {
  try {
    const res = await fetch(`${API}/api/settings`);
    siteSettings = await res.json();

    document.getElementById('settingLowStock').value = siteSettings.low_stock_threshold || 10;
    document.getElementById('settingDefaultDelivery').value = siteSettings.default_delivery_charge || 350;
    document.getElementById('settingCodEnabled').checked = siteSettings.cod_enabled === '1';
    document.getElementById('settingOnlineEnabled').checked = siteSettings.online_pay_enabled === '1';

    loadDeliveryRates();
  } catch (err) {
    console.error('Settings load error:', err);
  }
}

async function saveSettings() {
  try {
    const settings = {
      low_stock_threshold: document.getElementById('settingLowStock').value,
      default_delivery_charge: document.getElementById('settingDefaultDelivery').value,
      cod_enabled: document.getElementById('settingCodEnabled').checked ? '1' : '0',
      online_pay_enabled: document.getElementById('settingOnlineEnabled').checked ? '1' : '0'
    };

    for (const [key, value] of Object.entries(settings)) {
      await fetch(`${API}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting_key: key, setting_value: value })
      });
    }

    showAdminToast('Settings saved successfully!', 'success');
    siteSettings = { ...siteSettings, ...settings };
  } catch (err) {
    showAdminToast('Failed to save settings', 'error');
  }
}

async function loadDeliveryRates() {
  try {
    const res = await fetch(`${API}/api/delivery-rates`);
    const rates = await res.json();

    let html = '';
    rates.forEach(r => {
      html += `
        <tr>
          <td>
            <div class="fw-bold small">${r.district}</div>
            <div class="text-muted" style="font-size: 0.7rem;">${r.province}</div>
          </td>
          <td>
            <input type="number" class="form-control form-control-sm" style="width: 100px;" 
                   id="rate-${r.id}" value="${r.rate}" onchange="updateDeliveryRate(${r.id}, this.value)">
          </td>
          <td class="text-end">
            <span class="text-success d-none" id="rateSaved-${r.id}"><i class="bi bi-check-circle-fill"></i></span>
          </td>
        </tr>`;
    });
    document.getElementById('deliveryRatesList').innerHTML = html;
  } catch (err) {
    console.error('Rates load error:', err);
  }
}

async function updateDeliveryRate(id, rate) {
  try {
    await fetch(`${API}/api/admin/delivery-rates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rate: parseFloat(rate) })
    });
    const saved = document.getElementById(`rateSaved-${id}`);
    saved.classList.remove('d-none');
    setTimeout(() => saved.classList.add('d-none'), 2000);
  } catch (err) {
    showAdminToast('Failed to update rate', 'error');
  }
}

async function updateOrderStatus(id, status) {
  try {
    await fetch(`${API}/api/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    showAdminToast('Order status updated', 'success');
    loadOrders();
    loadDashboard();
  } catch (err) {
    showAdminToast('Failed to update status', 'error');
  }
}

async function deleteOrder(id) {
  if (!confirm('Are you sure you want to delete this order?')) return;
  try {
    await fetch(`${API}/api/admin/orders/${id}`, { method: 'DELETE' });
    showAdminToast('Order deleted', 'success');
    loadOrders();
    loadDashboard();
  } catch (err) {
    showAdminToast('Failed to delete', 'error');
  }
}

// ============================================
// MESSAGES
// ============================================
async function loadMessages() {
  try {
    const res = await fetch(`${API}/api/admin/messages`);
    const messages = await res.json();

    let html = '';
    messages.forEach(m => {
      const date = new Date(m.created_at).toLocaleString();
      const unreadClass = m.is_read ? '' : 'unread';
      html += `
        <div class="message-card ${unreadClass}" id="msg-${m.id}">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <strong>${m.name}</strong>
              <span class="text-muted ms-2 small">${m.email}</span>
              ${m.phone ? `<span class="text-muted ms-2 small">| ${m.phone}</span>` : ''}
            </div>
            <div class="d-flex gap-2">
              ${!m.is_read ? `<button class="btn btn-outline-success btn-sm" onclick="markRead(${m.id})"><i class="bi bi-check2"></i></button>` : ''}
              <button class="btn btn-outline-danger btn-sm" onclick="deleteMessage(${m.id})"><i class="bi bi-trash"></i></button>
            </div>
          </div>
          ${m.subject ? `<div class="fw-bold mb-1">${m.subject}</div>` : ''}
          <p class="mb-1">${m.message}</p>
          <small class="text-muted">${date}</small>
        </div>`;
    });

    if (messages.length === 0) html = '<p class="text-muted">No messages yet.</p>';
    document.getElementById('messagesList').innerHTML = html;
  } catch (err) {
    console.error('Load messages error:', err);
  }
}

async function markRead(id) {
  try {
    await fetch(`${API}/api/admin/messages/${id}/read`, { method: 'PUT' });
    loadMessages();
    loadDashboard();
  } catch (err) {
    showAdminToast('Error', 'error');
  }
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  try {
    await fetch(`${API}/api/admin/messages/${id}`, { method: 'DELETE' });
    showAdminToast('Message deleted', 'success');
    loadMessages();
    loadDashboard();
  } catch (err) {
    showAdminToast('Failed to delete', 'error');
  }
}

// ============================================
// TOAST
// ============================================
function showAdminToast(message, type) {
  const toastEl = document.getElementById('adminToast');
  const toastMsg = document.getElementById('adminToastMsg');
  toastMsg.textContent = message;
  toastEl.classList.remove('bg-success', 'bg-danger', 'text-white');
  toastEl.classList.add(type === 'success' ? 'bg-success' : 'bg-danger', 'text-white');
  const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
  toast.show();
}

// ============================================
// ACCOUNTS & ANALYTICS
// ============================================
let revenueChart = null;
let paymentChart = null;

async function loadAccounts() {
  try {
    const res = await fetch(`${API}/api/admin/accounts`);
    const data = await res.json();

    renderRevenueChart(data.dailyRevenue);
    renderPaymentChart(data.paymentStats);
    renderTopProducts(data.productStats);
    renderTopLocations(data.locationStats);

  } catch (err) {
    console.error('Accounts load error:', err);
  }
}

function renderRevenueChart(dailyData) {
  const ctx = document.getElementById('revenueChart').getContext('2d');
  
  if (revenueChart) revenueChart.destroy();

  const labels = dailyData.map(d => new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));
  const revenues = dailyData.map(d => d.revenue);

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Revenue (LKR)',
        data: revenues,
        borderColor: '#a65d25',
        backgroundColor: 'rgba(166, 93, 37, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#a65d25'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function renderPaymentChart(paymentStats) {
  const ctx = document.getElementById('paymentChart').getContext('2d');
  
  if (paymentChart) paymentChart.destroy();

  const labels = paymentStats.map(s => s.payment_method);
  const revenues = paymentStats.map(s => s.revenue);

  paymentChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: revenues,
        backgroundColor: ['#a65d25', '#2c3e50', '#95a5a6'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      },
      cutout: '70%'
    }
  });

  // Render text list
  let html = '';
  paymentStats.forEach(s => {
    html += `
      <div class="d-flex justify-content-between mb-2">
        <span>${s.payment_method}</span>
        <span class="fw-bold">LKR ${s.revenue.toLocaleString()} (${s.orders} orders)</span>
      </div>`;
  });
  document.getElementById('paymentStatsList').innerHTML = html;
}

function renderTopProducts(productStats) {
  let html = '';
  productStats.slice(0, 8).forEach(p => {
    html += `
      <tr>
        <td><div class="fw-bold small text-truncate" style="max-width: 150px;">${p.product_name}</div></td>
        <td class="text-center"><span class="badge bg-light text-dark border">${p.total_qty}</span></td>
        <td class="text-end fw-bold text-accent">LKR ${p.total_revenue.toLocaleString()}</td>
      </tr>`;
  });
  if (productStats.length === 0) html = '<tr><td colspan="3" class="text-center text-muted py-3">No sales yet</td></tr>';
  document.getElementById('topProductsByRevenue').innerHTML = html;
}

function renderTopLocations(locationStats) {
  let html = '';
  locationStats.forEach(l => {
    html += `
      <tr>
        <td><div class="fw-bold small">${l.district}</div></td>
        <td class="text-center"><span class="badge bg-light text-dark border">${l.orders}</span></td>
        <td class="text-end">LKR ${l.revenue.toLocaleString()}</td>
      </tr>`;
  });
  if (locationStats.length === 0) html = '<tr><td colspan="3" class="text-center text-muted py-3">No location data yet</td></tr>';
  document.getElementById('topLocations').innerHTML = html;
}
