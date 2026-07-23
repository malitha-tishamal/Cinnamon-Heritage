// ============================================================
// admin.js — Supabase Edition
// All fetch('/api/...') calls replaced with Supabase helpers
// ============================================================

// ============================================================
// AUTH
// ============================================================
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');

  errorDiv.classList.add('d-none');

  const result = await authLogin(email, password);   // replaces fetch('/api/auth/login')
  if (result.success) {
    document.getElementById('adminUsername').textContent = result.username;
    document.getElementById('loginScreen').classList.add('d-none');
    document.getElementById('dashboardScreen').classList.remove('d-none');
    loadDashboard();
  } else {
    errorDiv.textContent = result.error || 'Login failed';
    errorDiv.classList.remove('d-none');
  }
});

// Setup form
document.getElementById('adminSetupForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const result = await authSignup(   // replaces fetch('/api/auth/setup')
    document.getElementById('setupUsername').value,
    document.getElementById('setupEmail').value,
    document.getElementById('setupPassword').value
  );
  if (result.success) {
    showAdminToast('Admin account created! Please login.', 'success');
    document.getElementById('setupForm').classList.add('d-none');
    document.getElementById('loginForm').classList.remove('d-none');
  } else {
    showAdminToast(result.error, 'error');
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async function() {
  await authLogout();   // replaces fetch('/api/auth/logout')
});

// Password visibility toggles
function setupPasswordToggle(toggleBtnId, inputId) {
  const btn = document.getElementById(toggleBtnId);
  if (!btn) return;
  btn.addEventListener('click', function() {
    const input = document.getElementById(inputId);
    const icon  = this.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.replace('bi-eye-slash', 'bi-eye');
    } else {
      input.type = 'password';
      icon.classList.replace('bi-eye', 'bi-eye-slash');
    }
  });
}
setupPasswordToggle('toggleLoginPassword', 'loginPassword');
setupPasswordToggle('toggleSetupPassword', 'setupPassword');
setupPasswordToggle('toggleRegPassword',   'regPassword');

// Form switchers
const loginForm          = document.getElementById('loginForm');
const signupForm         = document.getElementById('signupForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

document.getElementById('showSignup')?.addEventListener('click', e => { e.preventDefault(); loginForm.classList.add('d-none'); signupForm.classList.remove('d-none'); });
document.getElementById('showForgotPassword')?.addEventListener('click', e => { e.preventDefault(); loginForm.classList.add('d-none'); forgotPasswordForm.classList.remove('d-none'); });
document.getElementById('showLoginFromSignup')?.addEventListener('click', e => { e.preventDefault(); signupForm.classList.add('d-none'); loginForm.classList.remove('d-none'); });
document.getElementById('showLoginFromForgot')?.addEventListener('click', e => { e.preventDefault(); forgotPasswordForm.classList.add('d-none'); loginForm.classList.remove('d-none'); });

// Signup submission
signupForm?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const errorDiv = document.getElementById('signupError');
  const result   = await authSignup(   // replaces fetch('/api/auth/signup')
    document.getElementById('regUsername').value,
    document.getElementById('regEmail').value,
    document.getElementById('regPassword').value
  );
  if (result.success) {
    showAdminToast('Account created! Please log in.', 'success');
    signupForm.reset();
    signupForm.classList.add('d-none');
    loginForm.classList.remove('d-none');
  } else {
    errorDiv.textContent = result.error || 'Signup failed';
    errorDiv.classList.remove('d-none');
  }
});

// Forgot password
forgotPasswordForm?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const errorDiv   = document.getElementById('forgotError');
  const successDiv = document.getElementById('forgotSuccess');
  errorDiv.classList.add('d-none');
  successDiv.classList.add('d-none');

  const result = await authForgotPassword(document.getElementById('forgotEmail').value);  // replaces fetch('/api/auth/forgot-password')
  if (result.success) {
    successDiv.textContent = result.message;
    successDiv.classList.remove('d-none');
    forgotPasswordForm.reset();
  } else {
    errorDiv.textContent = result.error || 'Request failed';
    errorDiv.classList.remove('d-none');
  }
});

// Check auth on load — replaces fetch('/api/auth/status')
(async function checkAuth() {
  const status = await authStatus();
  if (status.isLoggedIn && status.isAdmin) {
    document.getElementById('adminUsername').textContent = status.username;
    document.getElementById('loginScreen').classList.add('d-none');
    document.getElementById('dashboardScreen').classList.remove('d-none');
    loadDashboard();
  }
  // No setup-check needed — Supabase handles user creation via Dashboard
})();

// ============================================================
// SIDEBAR NAVIGATION
// ============================================================
document.querySelectorAll('.sidebar-nav li').forEach(function(li) {
  li.addEventListener('click', function() {
    document.querySelectorAll('.sidebar-nav li').forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    const section = this.dataset.section;
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('d-none'));
    document.getElementById('sec-' + section).classList.remove('d-none');
    loadSection(section);
  });
});

// ============================================================
// LOAD FUNCTIONS
// ============================================================
async function loadDashboard() {
  try {
    const stats = await getDashboardStats();  // replaces fetch('/api/admin/stats')

    document.getElementById('statMessages').textContent    = stats.totalMessages;
    document.getElementById('statUnread').textContent      = stats.unreadMessages;
    document.getElementById('statProducts').textContent    = stats.totalProducts;
    document.getElementById('statSteps').textContent       = stats.totalSteps;
    document.getElementById('statOrders').textContent      = stats.totalOrders;
    document.getElementById('statEarningsToday').textContent  = `LKR ${Number(stats.earningsToday).toLocaleString()}`;
    document.getElementById('statEarningsMonth').textContent  = `LKR ${Number(stats.earningsMonth).toLocaleString()}`;
    document.getElementById('statTotalEarnings').textContent  = `LKR ${Number(stats.totalEarnings).toLocaleString()}`;

    const badge = document.getElementById('unreadBadge');
    if (stats.unreadMessages > 0) {
      badge.textContent = stats.unreadMessages;
      badge.classList.remove('d-none');
    } else {
      badge.classList.add('d-none');
    }

    // Product performance table
    let perfHtml = '';
    (stats.productSales ?? []).forEach(p => {
      const threshold  = parseInt(siteSettings.low_stock_threshold) || 10;
      const isLowStock = p.stock_quantity <= threshold;
      const stockBadge = p.stock_quantity <= 0
        ? '<span class="badge bg-danger">Out of Stock</span>'
        : isLowStock
          ? '<span class="badge bg-warning text-dark">Low Stock</span>'
          : '<span class="badge bg-success">Healthy</span>';
      perfHtml += `
        <tr>
          <td><span class="fw-medium">${p.title ?? p.product_name}</span></td>
          <td><span class="badge bg-light text-dark border">${p.sales} Sales</span></td>
          <td><span class="${isLowStock ? 'text-danger fw-bold' : ''}">${p.stock_quantity}</span></td>
          <td>${stockBadge}</td>
        </tr>`;
    });
    document.getElementById('productPerformance').innerHTML = perfHtml;

    // Recent messages
    const messages = await getMessages();  // replaces fetch('/api/admin/messages')
    const recent   = messages.slice(0, 5);
    let msgHtml = '<table class="table table-hover mb-0"><thead><tr><th>Name</th><th>Subject</th><th>Date</th><th>Status</th></tr></thead><tbody>';
    recent.forEach(m => {
      const date   = new Date(m.created_at).toLocaleDateString();
      const status = m.is_read ? '<span class="badge bg-secondary">Read</span>' : '<span class="badge bg-danger">New</span>';
      msgHtml += `<tr><td>${m.name}</td><td>${m.subject || '-'}</td><td>${date}</td><td>${status}</td></tr>`;
    });
    msgHtml += '</tbody></table>';
    if (recent.length === 0) msgHtml = '<p class="text-muted">No messages yet.</p>';
    document.getElementById('recentMessages').innerHTML = msgHtml;

  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

let siteSettings = {};

async function loadSection(section) {
  try {
    if (section === 'dashboard')   return loadDashboard();
    if (section === 'process')     return loadProcessSteps();
    if (section === 'products')    return loadProducts();
    if (section === 'orders')      return loadOrders();
    if (section === 'messages')    return loadMessages();
    if (section === 'settings')    return loadSettings();
    if (section === 'accounts')    return loadAccounts();

    // Content sections (hero, about, factory, quality, contact-info)
    const content = await getContent();  // replaces fetch('/api/content')

    if (section === 'hero' && content?.hero) {
      document.getElementById('heroTitle').value    = content.hero.title    || '';
      document.getElementById('heroSubtitle').value = content.hero.subtitle || '';
      document.getElementById('heroCta').value      = content.hero.cta_text || '';
      const bgUrl = content.hero.background_image || 'images/cinnamon_spices.jpg';
      document.getElementById('heroBackgroundImage').value = bgUrl;
      document.getElementById('heroBgPreviewImg').src = bgUrl;
    }
    if (section === 'about' && content?.about) {
      document.getElementById('aboutTitle').value = content.about.title || '';
      document.getElementById('aboutText').value  = content.about.text  || '';
      const bgUrl = content.about.background_image || 'images/estate_bg.png';
      document.getElementById('aboutBackgroundImage').value = bgUrl;
      document.getElementById('aboutBgPreviewImg').src = bgUrl;
    }
    if (section === 'factory' && content?.factory) {
      document.getElementById('factoryTitle').value = content.factory.title || '';
      document.getElementById('factoryText').value  = content.factory.text  || '';
    }
    if (section === 'quality' && content?.quality) {
      document.getElementById('qualityTitle').value = content.quality.title || '';
      document.getElementById('qualityText').value  = content.quality.text  || '';
    }
    if (section === 'contact-info' && content?.contact) {
      document.getElementById('contactAddress').value      = content.contact.address  || '';
      document.getElementById('contactPhone').value        = content.contact.phone    || '';
      document.getElementById('contactEmailAddr').value    = content.contact.email    || '';
      document.getElementById('contactWhatsapp').value     = content.contact.whatsapp || '';
      document.getElementById('contactSubtitleText').value = content.contact.subtitle || '';
    }
  } catch (err) {
    console.error('Load error:', err);
  }
}

// ============================================================
// SAVE CONTENT — replaces fetch('/api/admin/content', PUT)
// ============================================================
async function saveContent(section) {
  try {
    let fields = {};
    if (section === 'hero') {
      fields = {
        title:            document.getElementById('heroTitle').value,
        subtitle:         document.getElementById('heroSubtitle').value,
        cta_text:         document.getElementById('heroCta').value,
        background_image: document.getElementById('heroBackgroundImage').value || 'images/cinnamon_spices.jpg'
      };
    } else if (section === 'about') {
      fields = {
        title:            document.getElementById('aboutTitle').value,
        text:             document.getElementById('aboutText').value,
        background_image: document.getElementById('aboutBackgroundImage').value || 'images/estate_bg.png'
      };
    } else if (section === 'factory') {
      fields = { title: document.getElementById('factoryTitle').value, text: document.getElementById('factoryText').value };
    } else if (section === 'quality') {
      fields = { title: document.getElementById('qualityTitle').value, text: document.getElementById('qualityText').value };
    } else if (section === 'contact') {
      fields = {
        address:  document.getElementById('contactAddress').value,
        phone:    document.getElementById('contactPhone').value,
        email:    document.getElementById('contactEmailAddr').value,
        whatsapp: document.getElementById('contactWhatsapp').value,
        subtitle: document.getElementById('contactSubtitleText').value
      };
    }

    await saveContentFields(section, fields);
    showAdminToast('Changes saved successfully!', 'success');
  } catch (err) {
    console.error('Save content error:', err);
    showAdminToast('Failed to save: ' + (err.message || 'Unknown error'), 'error');
  }
}

// Hero background upload with Cloudinary progress
document.getElementById('heroBgUpload')?.addEventListener('change', async function() {
  if (!this.files || !this.files.length) return;

  const progressWrap = document.getElementById('heroUploadProgress');
  const progressBar  = document.getElementById('heroUploadBar');
  const progressPct  = document.getElementById('heroUploadPercent');
  const successBadge = document.getElementById('heroUploadSuccess');
  const previewImg   = document.getElementById('heroBgPreviewImg');
  const bgInput      = document.getElementById('heroBackgroundImage');

  progressWrap.classList.remove('d-none');
  successBadge.classList.add('d-none');
  progressBar.style.width = '0%';
  progressPct.textContent = '0%';

  try {
    const url = await uploadImageWithProgress(this.files[0], (pct) => {
      progressBar.style.width = pct + '%';
      progressPct.textContent = pct + '%';
    });

    bgInput.value = url;
    previewImg.src = url;
    previewImg.classList.add('preview-flash');

    progressBar.style.width = '100%';
    progressPct.textContent = '100%';

    setTimeout(() => {
      progressWrap.classList.add('d-none');
      successBadge.classList.remove('d-none');
      previewImg.classList.remove('preview-flash');
    }, 400);
  } catch (err) {
    progressWrap.classList.add('d-none');
    showAdminToast('Upload failed: ' + err.message, 'error');
  } finally {
    this.value = '';
  }
});

// About background upload with Cloudinary progress
document.getElementById('aboutBgUpload')?.addEventListener('change', async function() {
  if (!this.files || !this.files.length) return;

  const progressWrap = document.getElementById('aboutUploadProgress');
  const progressBar  = document.getElementById('aboutUploadBar');
  const progressPct  = document.getElementById('aboutUploadPercent');
  const successBadge = document.getElementById('aboutUploadSuccess');
  const previewImg   = document.getElementById('aboutBgPreviewImg');
  const bgInput      = document.getElementById('aboutBackgroundImage');

  progressWrap.classList.remove('d-none');
  successBadge.classList.add('d-none');
  progressBar.style.width = '0%';
  progressPct.textContent = '0%';

  try {
    const url = await uploadImageWithProgress(this.files[0], (pct) => {
      progressBar.style.width = pct + '%';
      progressPct.textContent = pct + '%';
    });

    bgInput.value = url;
    previewImg.src = url;
    previewImg.classList.add('preview-flash');

    progressBar.style.width = '100%';
    progressPct.textContent = '100%';

    setTimeout(() => {
      progressWrap.classList.add('d-none');
      successBadge.classList.remove('d-none');
      previewImg.classList.remove('preview-flash');
    }, 400);
  } catch (err) {
    progressWrap.classList.add('d-none');
    showAdminToast('Upload failed: ' + err.message, 'error');
  } finally {
    this.value = '';
  }
});

// ============================================================
// IMAGE UPLOAD — with Cloudinary progress animation
// ============================================================
async function uploadImageFile(fileInput, bucket = 'product-images', progressIds = null) {
  if (!fileInput.files || fileInput.files.length === 0) return null;

  let progressWrap, progressBar, progressPct;
  if (progressIds) {
    progressWrap = document.getElementById(progressIds.wrap);
    progressBar  = document.getElementById(progressIds.bar);
    progressPct  = document.getElementById(progressIds.pct);
    if (progressWrap) progressWrap.classList.remove('d-none');
    if (progressBar) progressBar.style.width = '0%';
    if (progressPct) progressPct.textContent = '0%';
  }

  try {
    const url = await uploadImageWithProgress(fileInput.files[0], (pct) => {
      if (progressBar) progressBar.style.width = pct + '%';
      if (progressPct) progressPct.textContent = pct + '%';
    });

    if (progressBar) progressBar.style.width = '100%';
    if (progressPct) progressPct.textContent = '100%';
    setTimeout(() => { if (progressWrap) progressWrap.classList.add('d-none'); }, 500);

    return url;
  } catch (err) {
    if (progressWrap) progressWrap.classList.add('d-none');
    showAdminToast('Failed to upload image: ' + err.message, 'error');
    return null;
  }
}

// ============================================================
// PROCESS STEPS CRUD
// ============================================================
async function loadProcessSteps() {
  try {
    const steps = await getProcessStepsAdmin();  // replaces fetch('/api/process')
    let html = '';
    steps.forEach(step => {
      html += `
        <div class="item-card" id="step-${step.id}">
          <div class="item-header">
            <h5><span class="text-muted me-2">#${step.step_number}</span> ${step.title}</h5>
            <div>
              <button class="btn btn-outline-danger btn-sm" onclick="deleteStep('${step.id}')"><i class="bi bi-trash"></i></button>
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
              <label class="form-label small fw-bold">Image URL / Upload</label>
              <div class="input-group input-group-sm">
                <input type="text" class="form-control" id="stepImg-${step.id}" value="${step.image_url || ''}">
                <input type="file" class="form-control d-none" id="stepImgUpload-${step.id}" accept="image/*" onchange="handleStepImageUpload('${step.id}')">
                <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('stepImgUpload-${step.id}').click()"><i class="bi bi-upload"></i> Upload</button>
              </div>
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
              <button class="btn btn-accent btn-sm" onclick="saveStep('${step.id}')"><i class="bi bi-check-lg me-1"></i>Save</button>
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

async function handleStepImageUpload(id) {
  const fileInput = document.getElementById(`stepImgUpload-${id}`);
  const url = await uploadImageFile(fileInput, 'process-images');
  if (url) {
    document.getElementById(`stepImg-${id}`).value = url;
    showAdminToast('Image uploaded! Click Save to apply.', 'success');
  }
}

async function saveStep(id) {
  try {
    await updateStep(id, {  // replaces fetch('/api/admin/process/:id', PUT)
      title:         document.getElementById(`stepTitle-${id}`).value,
      short_desc:    document.getElementById(`stepShort-${id}`).value,
      full_desc:     document.getElementById(`stepFull-${id}`).value,
      image_url:     document.getElementById(`stepImg-${id}`).value,
      step_number:   document.getElementById(`stepNum-${id}`).value,
      display_order: parseInt(document.getElementById(`stepNum-${id}`).value) || 0,
      is_active:     true
    });
    showAdminToast('Step saved!', 'success');
  } catch (err) {
    showAdminToast('Failed to save', 'error');
  }
}

async function addProcessStep() {
  try {
    await createStep({  // replaces fetch('/api/admin/process', POST)
      step_number: '00', title: 'New Step',
      short_desc: 'Description...', full_desc: 'Full description...',
      image_url: '', display_order: 99
    });
    showAdminToast('New step added!', 'success');
    loadProcessSteps();
  } catch (err) {
    showAdminToast('Failed to add step', 'error');
  }
}

async function deleteStep(id) {
  if (!confirm('Are you sure you want to delete this step?')) return;
  try {
    await deleteStepById(id);  // replaces fetch('/api/admin/process/:id', DELETE)
    showAdminToast('Step deleted', 'success');
    loadProcessSteps();
  } catch (err) {
    showAdminToast('Failed to delete', 'error');
  }
}

// ============================================================
// PRODUCTS CRUD
// ============================================================
async function loadProducts() {
  try {
    const products = await getProductsAdmin();  // replaces fetch('/api/products')
    let html = '';
    products.forEach(p => {
      const isLowStock = p.stock_quantity <= (parseInt(siteSettings.low_stock_threshold) || 10);
      html += `
        <div class="item-card ${isLowStock ? 'border-warning' : ''}" id="product-${p.id}" style="${isLowStock ? 'border-left:4px solid #ffc107;' : ''}">
          <div class="item-header">
            <h5>${p.title} ${isLowStock ? '<span class="badge bg-warning text-dark small ms-2">Low Stock</span>' : ''}</h5>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteProduct('${p.id}')"><i class="bi bi-trash"></i></button>
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
                <input type="file" class="form-control d-none" id="prodImgUpload-${p.id}" accept="image/*" onchange="handleProductImageUpload('${p.id}')">
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
              <button class="btn btn-accent btn-sm" onclick="saveProduct('${p.id}')"><i class="bi bi-check-lg me-1"></i>Save</button>
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
  const url = await uploadImageFile(fileInput, 'product-images');
  if (url) {
    document.getElementById(`prodImg-${id}`).value = url;
    showAdminToast('Image uploaded! Click Save to apply.', 'success');
  }
}

async function saveProduct(id) {
  try {
    await updateProduct(id, {  // replaces fetch('/api/admin/products/:id', PUT)
      title:           document.getElementById(`prodTitle-${id}`).value,
      short_desc:      document.getElementById(`prodShort-${id}`).value,
      full_desc:       document.getElementById(`prodFull-${id}`).value,
      image_url:       document.getElementById(`prodImg-${id}`).value,
      price:           parseFloat(document.getElementById(`prodPrice-${id}`).value)    || 0,
      discount:        parseFloat(document.getElementById(`prodDiscount-${id}`).value) || 0,
      stock_quantity:  parseInt(document.getElementById(`prodStock-${id}`).value)      || 0,
      delivery_charge: parseFloat(document.getElementById(`prodDelivery-${id}`).value) || 0,
      display_order:   parseInt(document.getElementById(`prodOrder-${id}`).value)      || 0,
      is_active:       true
    });
    showAdminToast('Product saved!', 'success');
  } catch (err) {
    showAdminToast('Failed to save', 'error');
  }
}

function addProduct() {
  ['newProdTitle','newProdImg','newProdShort','newProdFull'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('newProdPrice').value    = '0';
  document.getElementById('newProdDiscount').value = '0';
  document.getElementById('newProdStock').value    = '10';
  document.getElementById('newProdDelivery').value = '350';
  document.getElementById('newProdOrder').value    = '99';
  document.getElementById('newProdImgUpload').value = '';
  new bootstrap.Modal(document.getElementById('addProductModal')).show();
}

async function handleNewProductImageUpload() {
  const fileInput = document.getElementById('newProdImgUpload');
  const url = await uploadImageFile(fileInput, 'product-images');
  if (url) {
    document.getElementById('newProdImg').value = url;
    showAdminToast('Image uploaded!', 'success');
  }
}

async function submitNewProduct() {
  try {
    await createProduct({  // replaces fetch('/api/admin/products', POST)
      title:           document.getElementById('newProdTitle').value    || 'New Product',
      short_desc:      document.getElementById('newProdShort').value,
      full_desc:       document.getElementById('newProdFull').value,
      image_url:       document.getElementById('newProdImg').value,
      price:           parseFloat(document.getElementById('newProdPrice').value)    || 0,
      discount:        parseFloat(document.getElementById('newProdDiscount').value) || 0,
      stock_quantity:  parseInt(document.getElementById('newProdStock').value)      || 0,
      delivery_charge: parseFloat(document.getElementById('newProdDelivery').value) || 0,
      display_order:   parseInt(document.getElementById('newProdOrder').value)      || 0,
      is_active:       true
    });
    showAdminToast('New product added!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
    loadProducts();
  } catch (err) {
    showAdminToast('Failed to add product: ' + err.message, 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    await deleteProductById(id);  // replaces fetch('/api/admin/products/:id', DELETE)
    showAdminToast('Product deleted', 'success');
    loadProducts();
  } catch (err) {
    showAdminToast('Failed to delete', 'error');
  }
}

// ============================================================
// ORDERS
// ============================================================
async function loadOrders() {
  try {
    const orders = await getOrders();  // replaces fetch('/api/admin/orders')
    let html = '';
    orders.forEach(o => {
      const date        = new Date(o.created_at).toLocaleDateString();
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
          <td><span class="badge bg-light text-dark border small">${o.payment_method}</span></td>
          <td>LKR ${Number(o.total_amount).toLocaleString()}</td>
          <td><span class="badge ${statusClass}">${o.status}</span></td>
          <td class="text-end pe-4">
            <button class="btn btn-outline-light btn-sm me-1" onclick="viewOrder('${o.id}')"><i class="bi bi-eye"></i></button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteOrder('${o.id}')"><i class="bi bi-trash"></i></button>
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
  const map = { Pending: 'bg-warning text-dark', Processing: 'bg-info text-dark', Shipped: 'bg-primary', Delivered: 'bg-success', Cancelled: 'bg-danger' };
  return map[status] ?? 'bg-secondary';
}

async function viewOrder(id) {
  try {
    const orders = await getOrders();
    const o      = orders.find(x => x.id === id);
    if (!o) return;

    document.getElementById('modalOrderId').textContent = o.id;
    document.getElementById('modalOrderBody').innerHTML = `
      <div class="row">
        <div class="col-md-6 mb-4">
          <h6 class="fw-bold text-accent border-bottom pb-2">Customer Details</h6>
          <p class="mb-1"><strong>Name:</strong> ${o.customer_name}</p>
          <p class="mb-1"><strong>Email:</strong> ${o.customer_email}</p>
          <p class="mb-1"><strong>Phone:</strong> ${o.customer_phone}</p>
          <p class="mb-1"><strong>District:</strong> ${o.district || 'N/A'} | ${o.province || ''}</p>
          <p class="mb-1"><strong>Address:</strong> ${o.shipping_address}</p>
        </div>
        <div class="col-md-6 mb-4">
          <h6 class="fw-bold text-accent border-bottom pb-2">Order Info</h6>
          <p class="mb-1"><strong>Status:</strong> ${o.status}</p>
          <p class="mb-1"><strong>Payment:</strong> <span class="badge bg-light text-dark border">${o.payment_method}</span></p>
          <p class="mb-1"><strong>Date:</strong> ${new Date(o.created_at).toLocaleString()}</p>
          ${o.bank_reference ? `<p class="mb-1"><strong>Bank Ref:</strong> ${o.bank_reference}</p>` : ''}
          <div class="mt-3">
            <label class="form-label small fw-bold">Update Status</label>
            <select class="form-select form-select-sm" onchange="updateOrderStatusAndRefresh('${o.id}', this.value)">
              ${['Pending','Processing','Shipped','Delivered','Cancelled'].map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="col-12">
          <h6 class="fw-bold text-accent border-bottom pb-2">Item Summary</h6>
          <table class="table table-sm">
            <thead><tr><th>Product</th><th class="text-center">Price</th><th class="text-center">Qty</th><th class="text-end">Subtotal</th></tr></thead>
            <tbody>
              <tr>
                <td>${o.product_name}</td>
                <td class="text-center">LKR ${Number(o.unit_price).toLocaleString()}</td>
                <td class="text-center">${o.item_quantity}</td>
                <td class="text-end">LKR ${(Number(o.unit_price) * o.item_quantity).toLocaleString()}</td>
              </tr>
            </tbody>
            <tfoot class="border-top-0">
              <tr><td colspan="3" class="text-end border-0 small">Subtotal:</td><td class="text-end border-0 small">LKR ${Number(o.subtotal).toLocaleString()}</td></tr>
              <tr><td colspan="3" class="text-end border-0 small text-success">Discount:</td><td class="text-end border-0 small text-success">- LKR ${Number(o.discount_total).toLocaleString()}</td></tr>
              <tr><td colspan="3" class="text-end border-0 small">Delivery:</td><td class="text-end border-0 small">LKR ${Number(o.delivery_charge).toLocaleString()}</td></tr>
              <tr class="fw-bold fs-5"><td colspan="3" class="text-end border-0">Total:</td><td class="text-end border-0 text-accent">LKR ${Number(o.total_amount).toLocaleString()}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>`;
    new bootstrap.Modal(document.getElementById('orderModal')).show();
  } catch (err) {
    console.error(err);
  }
}

async function updateOrderStatusAndRefresh(id, status) {
  try {
    await updateOrderStatus(id, status);  // replaces fetch('/api/admin/orders/:id/status', PUT)
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
    await deleteOrderById(id);  // replaces fetch('/api/admin/orders/:id', DELETE)
    showAdminToast('Order deleted', 'success');
    loadOrders();
    loadDashboard();
  } catch (err) {
    showAdminToast('Failed to delete', 'error');
  }
}

// ============================================================
// SETTINGS
// ============================================================
async function loadSettings() {
  try {
    siteSettings = await getSettings();  // replaces fetch('/api/settings')

    document.getElementById('settingLowStock').value         = siteSettings.low_stock_threshold    || 10;
    document.getElementById('settingDefaultDelivery').value  = siteSettings.default_delivery_charge || 350;
    document.getElementById('settingCodEnabled').checked     = siteSettings.cod_enabled    === '1';
    document.getElementById('settingOnlineEnabled').checked  = siteSettings.online_pay_enabled === '1';

    // Footer Settings
    document.getElementById('settingFooterAbout').value     = siteSettings.footer_about || '';
    document.getElementById('settingFooterAddress').value   = siteSettings.footer_address || '';
    document.getElementById('settingFooterPhone').value     = siteSettings.footer_phone || '';
    document.getElementById('settingFooterEmail').value     = siteSettings.footer_email || '';
    document.getElementById('settingSocialFacebook').value  = siteSettings.social_facebook || '';
    document.getElementById('settingSocialInstagram').value = siteSettings.social_instagram || '';
    document.getElementById('settingSocialTwitter').value   = siteSettings.social_twitter || '';

    loadDeliveryRates();
  } catch (err) {
    console.error('Settings load error:', err);
  }
}

async function saveSettings() {
  try {
    const settings = {
      low_stock_threshold:    document.getElementById('settingLowStock').value,
      default_delivery_charge: document.getElementById('settingDefaultDelivery').value,
      cod_enabled:            document.getElementById('settingCodEnabled').checked  ? '1' : '0',
      online_pay_enabled:     document.getElementById('settingOnlineEnabled').checked ? '1' : '0'
    };
    for (const [key, value] of Object.entries(settings)) {
      await saveSetting(key, value);  // replaces fetch('/api/admin/settings', PUT)
    }
    showAdminToast('Settings saved successfully!', 'success');
    siteSettings = { ...siteSettings, ...settings };
  } catch (err) {
    showAdminToast('Failed to save settings', 'error');
  }
}

async function saveFooterSettings() {
  try {
    const settings = {
      footer_about:     document.getElementById('settingFooterAbout').value,
      footer_address:   document.getElementById('settingFooterAddress').value,
      footer_phone:     document.getElementById('settingFooterPhone').value,
      footer_email:     document.getElementById('settingFooterEmail').value,
      social_facebook:  document.getElementById('settingSocialFacebook').value,
      social_instagram: document.getElementById('settingSocialInstagram').value,
      social_twitter:   document.getElementById('settingSocialTwitter').value
    };
    for (const [key, value] of Object.entries(settings)) {
      await saveSetting(key, value); 
    }
    showAdminToast('Footer settings saved successfully!', 'success');
    siteSettings = { ...siteSettings, ...settings };
  } catch (err) {
    showAdminToast('Failed to save footer settings', 'error');
  }
}

async function loadDeliveryRates() {
  try {
    const rates = await getDeliveryRates();  // replaces fetch('/api/delivery-rates')
    let html = '';
    rates.forEach(r => {
      html += `
        <tr>
          <td>
            <div class="fw-bold small">${r.district}</div>
            <div class="text-muted" style="font-size:0.7rem;">${r.province}</div>
          </td>
          <td>
            <input type="number" class="form-control form-control-sm" style="width:100px;"
                   id="rate-${r.id}" value="${r.rate}"
                   onchange="updateDeliveryRate('${r.id}', this.value)">
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
    await updateDeliveryRateById(id, rate);  // replaces fetch('/api/admin/delivery-rates/:id', PUT)
    const saved = document.getElementById(`rateSaved-${id}`);
    saved.classList.remove('d-none');
    setTimeout(() => saved.classList.add('d-none'), 2000);
  } catch (err) {
    showAdminToast('Failed to update rate', 'error');
  }
}

// ============================================================
// MESSAGES
// ============================================================
async function loadMessages() {
  try {
    const messages = await getMessages();  // replaces fetch('/api/admin/messages')
    let html = '';
    messages.forEach(m => {
      const date        = new Date(m.created_at).toLocaleString();
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
              ${!m.is_read ? `<button class="btn btn-outline-success btn-sm" onclick="markRead('${m.id}')"><i class="bi bi-check2"></i></button>` : ''}
              <button class="btn btn-outline-danger btn-sm" onclick="deleteMessage('${m.id}')"><i class="bi bi-trash"></i></button>
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
    await markMessageRead(id);  // replaces fetch('/api/admin/messages/:id/read', PUT)
    loadMessages();
    loadDashboard();
  } catch (err) {
    showAdminToast('Error', 'error');
  }
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  try {
    await deleteMessageById(id);  // replaces fetch('/api/admin/messages/:id', DELETE)
    showAdminToast('Message deleted', 'success');
    loadMessages();
    loadDashboard();
  } catch (err) {
    showAdminToast('Failed to delete', 'error');
  }
}

// ============================================================
// TOAST
// ============================================================
function showAdminToast(message, type) {
  const toastEl  = document.getElementById('adminToast');
  const toastMsg = document.getElementById('adminToastMsg');
  toastMsg.textContent = message;
  toastEl.classList.remove('bg-success', 'bg-danger', 'bg-info', 'text-white');
  const cls = type === 'success' ? 'bg-success' : type === 'info' ? 'bg-info' : 'bg-danger';
  toastEl.classList.add(cls, 'text-white');
  new bootstrap.Toast(toastEl, { delay: 3000 }).show();
}

// ============================================================
// ACCOUNTS & ANALYTICS
// ============================================================
let revenueChart = null;
let paymentChart = null;

async function loadAccounts() {
  try {
    const data = await getAccountsData();  // replaces fetch('/api/admin/accounts')
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

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dailyData.map(d => new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })),
      datasets: [{
        label: 'Revenue (LKR)',
        data: dailyData.map(d => d.revenue),
        borderColor: '#a65d25',
        backgroundColor: 'rgba(166,93,37,0.1)',
        borderWidth: 3, fill: true, tension: 0.4,
        pointRadius: 4, pointBackgroundColor: '#a65d25'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderPaymentChart(paymentStats) {
  const ctx = document.getElementById('paymentChart').getContext('2d');
  if (paymentChart) paymentChart.destroy();

  paymentChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: paymentStats.map(s => s.payment_method),
      datasets: [{ data: paymentStats.map(s => s.revenue), backgroundColor: ['#a65d25','#2c3e50','#95a5a6'], borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      cutout: '70%'
    }
  });

  let html = '';
  paymentStats.forEach(s => {
    html += `
      <div class="d-flex justify-content-between mb-2">
        <span>${s.payment_method}</span>
        <span class="fw-bold">LKR ${Number(s.revenue).toLocaleString()} (${s.orders} orders)</span>
      </div>`;
  });
  document.getElementById('paymentStatsList').innerHTML = html;
}

function renderTopProducts(productStats) {
  let html = '';
  productStats.slice(0, 8).forEach(p => {
    html += `
      <tr>
        <td><div class="fw-bold small text-truncate" style="max-width:150px;">${p.product_name}</div></td>
        <td class="text-center"><span class="badge bg-light text-dark border">${p.total_qty}</span></td>
        <td class="text-end fw-bold text-accent">LKR ${Number(p.total_revenue).toLocaleString()}</td>
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
        <td class="text-end">LKR ${Number(l.revenue).toLocaleString()}</td>
      </tr>`;
  });
  if (locationStats.length === 0) html = '<tr><td colspan="3" class="text-center text-muted py-3">No location data yet</td></tr>';
  document.getElementById('topLocations').innerHTML = html;
}
