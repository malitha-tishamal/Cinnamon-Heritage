// ============================================================
// admin.js — Supabase Edition
// All fetch('/api/...') calls replaced with Supabase helpers
// ============================================================

// ============================================================
// AUTH
// ============================================================
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  const submitBtn = this.querySelector('button[type="submit"]');

  errorDiv.classList.add('d-none');
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing In...';
  }

  const result = await authLogin(email, password);   // Supabase / Firebase helper
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
  }

  if (result.success) {
    if (result.role !== 'admin') {
      await authLogout();
      errorDiv.textContent = 'Access denied. You do not have administrator permissions.';
      errorDiv.classList.remove('d-none');
      return;
    }
    if (result.is_approved === false || result.status === 'pending') {
      await authLogout();
      errorDiv.textContent = 'Your admin account is pending approval. Please wait for an administrator to approve your account before logging in.';
      errorDiv.classList.remove('d-none');
      return;
    }
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
    document.getElementById('setupUsername').value.trim(),
    document.getElementById('setupEmail').value.trim(),
    document.getElementById('setupPassword').value,
    { role: 'admin' }
  );
  if (result.success) {
    showAdminToast(result.message || 'Admin account created! Please login.', 'success');
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
  errorDiv.classList.add('d-none');
  const regBtn = this.querySelector('button[type="submit"]');
  const originalBtnHtml = regBtn ? regBtn.innerHTML : '';
  if (regBtn) {
    regBtn.disabled = true;
    regBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...';
  }

  const result = await authSignup(
    document.getElementById('regUsername').value.trim(),
    document.getElementById('regEmail').value.trim(),
    document.getElementById('regPassword').value,
    { role: 'admin' }
  );

  if (regBtn) {
    regBtn.disabled = false;
    regBtn.innerHTML = originalBtnHtml;
  }

  if (result.success) {
    showAdminToast(result.message, result.is_approved ? 'success' : 'info');
    signupForm.reset();
    signupForm.classList.add('d-none');
    loginForm.classList.remove('d-none');
    const loginError = document.getElementById('loginError');
    if (loginError && !result.is_approved) {
      loginError.className = 'alert alert-warning small';
      loginError.innerHTML = '<i class="bi bi-clock-history me-1"></i> Admin account created! Status is <strong>Pending</strong>. An administrator must approve your account before you can log in.';
      loginError.classList.remove('d-none');
    }
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

    // Update pending admin accounts badge in sidebar
    try {
      const pendingAdminsSnap = await db.collection('profiles')
        .where('role', '==', 'admin')
        .where('is_approved', '==', false)
        .get();
      const pendingAdminBadge = document.getElementById('pendingAdminBadge');
      if (pendingAdminBadge) {
        if (pendingAdminsSnap.size > 0) {
          pendingAdminBadge.textContent = pendingAdminsSnap.size;
          pendingAdminBadge.classList.remove('d-none');
        } else {
          pendingAdminBadge.classList.add('d-none');
        }
      }
    } catch (e) {
      console.warn('Could not update pending admin badge count:', e);
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
    if (section === 'dashboard')    return loadDashboard();
    if (section === 'process')      return loadProcessSteps();
    if (section === 'products')     return loadProducts();
    if (section === 'popups')       return loadPopupManager();
    if (section === 'orders')       return loadOrders();
    if (section === 'messages')     return loadMessages();
    if (section === 'settings')     return loadSettings();
    if (section === 'accounts')     return loadAccounts();
    if (section === 'admin-accounts') return loadAdminAccounts();
    if (section === 'faq')            { loadFaqs(); loadFaqBackground(); return; }

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
      const imgUrl = content.about.image || 'images/cinnamon_plantlings.jpg';
      document.getElementById('aboutImage').value = imgUrl;
      document.getElementById('aboutImgPreviewImg').src = imgUrl;
    }
    if (section === 'villa' && content?.villa) {
      document.getElementById('villaTitle').value = content.villa.title || '';
      document.getElementById('villaSubtitle').value = content.villa.subtitle || '';
      document.getElementById('villaText').value  = content.villa.text  || '';
      const bgUrl = content.villa.background_image || 'images/estate_bg.png';
      document.getElementById('villaBackgroundImage').value = bgUrl;
      document.getElementById('villaBgPreviewImg').src = bgUrl;
      const imgUrl = content.villa.image || 'images/cinnamon_plantlings.jpg';
      document.getElementById('villaImage').value = imgUrl;
      document.getElementById('villaImgPreviewImg').src = imgUrl;
    }
    if (section === 'factory' && content?.factory) {
      document.getElementById('factoryTitle').value = content.factory.title || '';
      document.getElementById('factoryText').value  = content.factory.text  || '';
      const bgUrl  = content.factory.background_image || 'images/estate_bg.png';
      const imgUrl = content.factory.image_url        || 'images/cinnamon_srilanka.jpg';
      document.getElementById('factoryBackgroundImage').value = bgUrl;
      document.getElementById('factoryBgPreviewImg').src      = bgUrl;
      document.getElementById('factoryImageUrl').value        = imgUrl;
      document.getElementById('factoryImgPreview').src        = imgUrl;
    }
    if (section === 'process' && content?.process) {
      const bgUrl = content.process.background_image || 'images/estate_bg.png';
      document.getElementById('processBackgroundImage').value = bgUrl;
      document.getElementById('processBgPreviewImg').src = bgUrl;
    }
    if (section === 'products' && content?.products) {
      const bgUrl = content.products.background_image || 'images/estate_bg.png';
      document.getElementById('productsBackgroundImage').value = bgUrl;
      document.getElementById('productsBgPreviewImg').src = bgUrl;
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
    if (section === 'b2b') {
      loadB2BSection();
    }
    if (section === 'b2b-enquiries') {
      loadB2BEnquiries();
    }
    if (section === 'experience') {
      loadExperienceSection();
    }
    if (section === 'experience-bookings') {
      loadExperienceBookings();
    }
    if (section === 'essential-oils') {
      loadEssentialOilsSection();
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
        background_image: document.getElementById('aboutBackgroundImage').value || 'images/estate_bg.png',
        image:            document.getElementById('aboutImage').value || 'images/cinnamon_plantlings.jpg'
      };
    } else if (section === 'villa') {
      fields = {
        title:            document.getElementById('villaTitle').value,
        subtitle:         document.getElementById('villaSubtitle').value,
        text:             document.getElementById('villaText').value,
        background_image: document.getElementById('villaBackgroundImage').value || 'images/estate_bg.png',
        image:            document.getElementById('villaImage').value || 'images/cinnamon_plantlings.jpg'
      };
    } else if (section === 'factory') {
      fields = {
        title:            document.getElementById('factoryTitle').value,
        text:             document.getElementById('factoryText').value,
        background_image: document.getElementById('factoryBackgroundImage').value || 'images/estate_bg.png',
        image_url:        document.getElementById('factoryImageUrl').value        || 'images/cinnamon_srilanka.jpg'
      };
    } else if (section === 'process') {
      fields = {
        background_image: document.getElementById('processBackgroundImage').value || 'images/estate_bg.png'
      };
    } else if (section === 'products') {
      fields = {
        background_image: document.getElementById('productsBackgroundImage').value || 'images/estate_bg.png'
      };
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
    } else if (section === 'b2b') {
      // B2B is handled separately by saveB2BContent function
      return;
    } else if (section === 'experience') {
      // Experience is handled separately by saveExperienceContent function
      return;
    } else if (section === 'essential-oils') {
      // Essential Oils is handled separately by saveEssentialOilsContent function
      return;
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

// Villa background upload with Cloudinary progress
document.getElementById('villaBgUpload')?.addEventListener('change', async function() {
  if (!this.files || !this.files.length) return;

  const progressWrap = document.getElementById('villaBgUploadProgress');
  const progressBar  = document.getElementById('villaBgUploadBar');
  const progressPct  = document.getElementById('villaBgUploadPercent');
  const successBadge = document.getElementById('villaBgUploadSuccess');
  const failedBadge  = document.getElementById('villaBgUploadFailed');
  const failedMsg    = document.getElementById('villaBgUploadFailedMsg');
  const previewImg   = document.getElementById('villaBgPreviewImg');
  const bgInput      = document.getElementById('villaBackgroundImage');

  progressWrap.classList.remove('d-none');
  successBadge.classList.add('d-none');
  if(failedBadge) failedBadge.classList.add('d-none');
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
    if(failedBadge) {
      failedBadge.classList.remove('d-none');
      if(failedMsg) failedMsg.textContent = 'Upload failed: ' + err.message;
    } else {
      showAdminToast('Upload failed: ' + err.message, 'error');
    }
  } finally {
    this.value = '';
  }
});

// Villa image upload with Cloudinary progress
document.getElementById('villaImgUpload')?.addEventListener('change', async function() {
  if (!this.files || !this.files.length) return;

  const progressWrap = document.getElementById('villaImgUploadProgress');
  const progressBar  = document.getElementById('villaImgUploadBar');
  const progressPct  = document.getElementById('villaImgUploadPercent');
  const successBadge = document.getElementById('villaImgUploadSuccess');
  const failedBadge  = document.getElementById('villaImgUploadFailed');
  const failedMsg    = document.getElementById('villaImgUploadFailedMsg');
  const previewImg   = document.getElementById('villaImgPreviewImg');
  const imgInput     = document.getElementById('villaImage');

  progressWrap.classList.remove('d-none');
  successBadge.classList.add('d-none');
  if(failedBadge) failedBadge.classList.add('d-none');
  progressBar.style.width = '0%';
  progressPct.textContent = '0%';

  try {
    const url = await uploadImageWithProgress(this.files[0], (pct) => {
      progressBar.style.width = pct + '%';
      progressPct.textContent = pct + '%';
    });

    imgInput.value = url;
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
    if(failedBadge) {
      failedBadge.classList.remove('d-none');
      if(failedMsg) failedMsg.textContent = 'Upload failed: ' + err.message;
    } else {
      showAdminToast('Upload failed: ' + err.message, 'error');
    }
  } finally {
    this.value = '';
  }
});

// About image upload with Cloudinary progress
document.getElementById('aboutImgUpload')?.addEventListener('change', async function() {
  if (!this.files || !this.files.length) return;

  const progressWrap = document.getElementById('aboutImgUploadProgress');
  const progressBar  = document.getElementById('aboutImgUploadBar');
  const progressPct  = document.getElementById('aboutImgUploadPercent');
  const successBadge = document.getElementById('aboutImgUploadSuccess');
  const failedBadge  = document.getElementById('aboutImgUploadFailed');
  const failedMsg    = document.getElementById('aboutImgUploadFailedMsg');
  const previewImg   = document.getElementById('aboutImgPreviewImg');
  const imgInput     = document.getElementById('aboutImage');

  progressWrap.classList.remove('d-none');
  successBadge.classList.add('d-none');
  if(failedBadge) failedBadge.classList.add('d-none');
  progressBar.style.width = '0%';
  progressPct.textContent = '0%';

  try {
    const url = await uploadImageWithProgress(this.files[0], (pct) => {
      progressBar.style.width = pct + '%';
      progressPct.textContent = pct + '%';
    });

    imgInput.value = url;
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
    if(failedBadge) {
      failedBadge.classList.remove('d-none');
      if(failedMsg) failedMsg.textContent = 'Upload failed: ' + err.message;
    } else {
      showAdminToast('Upload failed: ' + err.message, 'error');
    }
  } finally {
    this.value = '';
  }
});

// Factory BACKGROUND upload with Cloudinary progress
document.getElementById('factoryBgUpload')?.addEventListener('change', async function() {
  if (!this.files || !this.files.length) return;

  const progressWrap  = document.getElementById('factoryBgUploadProgress');
  const progressBar   = document.getElementById('factoryBgUploadBar');
  const progressPct   = document.getElementById('factoryBgUploadPercent');
  const successBadge  = document.getElementById('factoryBgUploadSuccess');
  const failedBadge   = document.getElementById('factoryBgUploadFailed');
  const failedMsg     = document.getElementById('factoryBgUploadFailedMsg');
  const previewImg    = document.getElementById('factoryBgPreviewImg');
  const bgInput       = document.getElementById('factoryBackgroundImage');

  progressWrap.classList.remove('d-none');
  successBadge.classList.add('d-none');
  failedBadge.classList.add('d-none');
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
    failedMsg.textContent = 'Upload failed: ' + err.message;
    failedBadge.classList.remove('d-none');
  } finally {
    this.value = '';
  }
});

// Factory PRODUCT IMAGE upload with Cloudinary progress
document.getElementById('factoryImgUpload')?.addEventListener('change', async function() {
  if (!this.files || !this.files.length) return;

  const progressWrap  = document.getElementById('factoryImgUploadProgress');
  const progressBar   = document.getElementById('factoryImgUploadBar');
  const progressPct   = document.getElementById('factoryImgUploadPercent');
  const successBadge  = document.getElementById('factoryImgUploadSuccess');
  const failedBadge   = document.getElementById('factoryImgUploadFailed');
  const failedMsg     = document.getElementById('factoryImgUploadFailedMsg');
  const previewImg    = document.getElementById('factoryImgPreview');
  const imgInput      = document.getElementById('factoryImageUrl');

  progressWrap.classList.remove('d-none');
  successBadge.classList.add('d-none');
  failedBadge.classList.add('d-none');
  progressBar.style.width = '0%';
  progressPct.textContent = '0%';

  try {
    const url = await uploadImageWithProgress(this.files[0], (pct) => {
      progressBar.style.width = pct + '%';
      progressPct.textContent = pct + '%';
    });

    imgInput.value = url;
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
    failedMsg.textContent = 'Upload failed: ' + err.message;
    failedBadge.classList.remove('d-none');
  } finally {
    this.value = '';
  }
});

// Process BACKGROUND upload with Cloudinary progress
document.getElementById('processBgUpload')?.addEventListener('change', async function() {
  if (!this.files || !this.files.length) return;

  const progressWrap  = document.getElementById('processBgUploadProgress');
  const progressBar   = document.getElementById('processBgUploadBar');
  const progressPct   = document.getElementById('processBgUploadPercent');
  const successBadge  = document.getElementById('processBgUploadSuccess');
  const failedBadge   = document.getElementById('processBgUploadFailed');
  const failedMsg     = document.getElementById('processBgUploadFailedMsg');
  const previewImg    = document.getElementById('processBgPreviewImg');
  const bgInput       = document.getElementById('processBackgroundImage');

  progressWrap.classList.remove('d-none');
  successBadge.classList.add('d-none');
  failedBadge.classList.add('d-none');
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
    failedMsg.textContent = 'Upload failed: ' + err.message;
    failedBadge.classList.remove('d-none');
  } finally {
    this.value = '';
  }
});

// Products BACKGROUND upload with Cloudinary progress
document.getElementById('productsBgUpload')?.addEventListener('change', async function() {
  if (!this.files || !this.files.length) return;

  const progressWrap  = document.getElementById('productsBgUploadProgress');
  const progressBar   = document.getElementById('productsBgUploadBar');
  const progressPct   = document.getElementById('productsBgUploadPercent');
  const successBadge  = document.getElementById('productsBgUploadSuccess');
  const failedBadge   = document.getElementById('productsBgUploadFailed');
  const failedMsg     = document.getElementById('productsBgUploadFailedMsg');
  const previewImg    = document.getElementById('productsBgPreviewImg');
  const bgInput       = document.getElementById('productsBackgroundImage');

  progressWrap.classList.remove('d-none');
  successBadge.classList.add('d-none');
  failedBadge.classList.add('d-none');
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
    failedMsg.textContent = 'Upload failed: ' + err.message;
    failedBadge.classList.remove('d-none');
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
                <input type="text" class="form-control" id="stepImg-${step.id}" value="${step.image_url || ''}" oninput="updateStepThumbnail('${step.id}')">
                <input type="file" class="form-control d-none" id="stepImgUpload-${step.id}" accept="image/*" onchange="handleStepImageUpload('${step.id}')">
                <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('stepImgUpload-${step.id}').click()"><i class="bi bi-upload"></i> Upload</button>
              </div>
              
              <!-- Thumbnail & Upload Progress UI -->
              <div class="d-flex align-items-center gap-3 mt-2">
                <div class="product-thumb-preview border rounded" style="width: 50px; height: 50px; overflow: hidden; background: rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center;">
                  <img id="stepThumb-${step.id}" src="${step.image_url || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23a6a6a6\'><path d=\'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z\'/></svg>'}" class="w-100 h-100 object-fit-cover" onerror="handleImageError(this)">
                </div>
                <div class="flex-grow-1">
                  <!-- Progress Bar -->
                  <div id="stepUploadProgress-${step.id}" class="upload-progress-wrap d-none">
                    <div class="d-flex justify-content-between small mb-1">
                      <span class="text-muted">Uploading to Cloudinary...</span>
                      <span id="stepUploadPercent-${step.id}" class="fw-bold text-accent">0%</span>
                    </div>
                    <div class="progress upload-progress-bar">
                      <div class="progress-bar progress-bar-striped progress-bar-animated" id="stepUploadBar-${step.id}" role="progressbar" style="width: 0%"></div>
                    </div>
                  </div>
                  <!-- Success Badge -->
                  <div id="stepUploadSuccess-${step.id}" class="upload-success-badge d-none">
                    <i class="bi bi-check-circle-fill"></i>
                    <span>Uploaded! Save to apply.</span>
                  </div>
                  <!-- Error Badge -->
                  <div id="stepUploadFailed-${step.id}" class="alert alert-danger d-none small py-2 m-0">
                    <i class="bi bi-x-circle-fill me-1"></i> Upload failed.
                  </div>
                </div>
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
  if (!fileInput.files || !fileInput.files.length) return;

  const progressWrap = document.getElementById(`stepUploadProgress-${id}`);
  const progressBar  = document.getElementById(`stepUploadBar-${id}`);
  const progressPct  = document.getElementById(`stepUploadPercent-${id}`);
  const successBadge = document.getElementById(`stepUploadSuccess-${id}`);
  const failedBadge  = document.getElementById(`stepUploadFailed-${id}`);
  const previewImg   = document.getElementById(`stepThumb-${id}`);
  const imgInput     = document.getElementById(`stepImg-${id}`);

  if (progressWrap) progressWrap.classList.remove('d-none');
  if (successBadge) successBadge.classList.add('d-none');
  if (failedBadge) failedBadge.classList.add('d-none');
  if (progressBar) progressBar.style.width = '0%';
  if (progressPct) progressPct.textContent = '0%';

  try {
    const url = await uploadImageWithProgress(fileInput.files[0], (pct) => {
      if (progressBar) progressBar.style.width = pct + '%';
      if (progressPct) progressPct.textContent = pct + '%';
    });

    if (imgInput) imgInput.value = url;
    if (previewImg) {
      previewImg.src = url;
      previewImg.classList.add('preview-flash');
    }
    if (progressBar) progressBar.style.width = '100%';
    if (progressPct) progressPct.textContent = '100%';

    setTimeout(() => {
      if (progressWrap) progressWrap.classList.add('d-none');
      if (successBadge) successBadge.classList.remove('d-none');
      if (previewImg) previewImg.classList.remove('preview-flash');
    }, 400);
  } catch (err) {
    if (progressWrap) progressWrap.classList.add('d-none');
    if (failedBadge) failedBadge.classList.remove('d-none');
    showAdminToast('Upload failed: ' + err.message, 'error');
  } finally {
    fileInput.value = '';
  }
}

function updateStepThumbnail(id) {
  const imgInput = document.getElementById(`stepImg-${id}`);
  const previewImg = document.getElementById(`stepThumb-${id}`);
  if (imgInput && previewImg) {
    previewImg.src = imgInput.value || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a6a6a6'><path d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/></svg>";
  }
}

function handleImageError(img) {
  img.onerror = null; // Prevent infinite loop
  img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a6a6a6'><path d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/></svg>";
}
window.handleImageError = handleImageError;

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
                <input type="text" class="form-control" id="prodImg-${p.id}" value="${p.image_url || ''}" oninput="updateProductThumbnail('${p.id}')">
                <input type="file" class="form-control d-none" id="prodImgUpload-${p.id}" accept="image/*" onchange="handleProductImageUpload('${p.id}')">
                <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('prodImgUpload-${p.id}').click()"><i class="bi bi-upload"></i> Upload</button>
              </div>
              
              <!-- Thumbnail & Upload Progress UI -->
              <div class="d-flex align-items-center gap-3 mt-2">
                <div class="product-thumb-preview border rounded" style="width: 50px; height: 50px; overflow: hidden; background: rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center;">
                  <img id="prodThumb-${p.id}" src="${p.image_url || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23a6a6a6\'><path d=\'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z\'/></svg>'}" class="w-100 h-100 object-fit-cover" onerror="handleImageError(this)">
                </div>
                <div class="flex-grow-1">
                  <!-- Progress Bar -->
                  <div id="prodUploadProgress-${p.id}" class="upload-progress-wrap d-none">
                    <div class="d-flex justify-content-between small mb-1">
                      <span class="text-muted">Uploading to Cloudinary...</span>
                      <span id="prodUploadPercent-${p.id}" class="fw-bold text-accent">0%</span>
                    </div>
                    <div class="progress upload-progress-bar">
                      <div class="progress-bar progress-bar-striped progress-bar-animated" id="prodUploadBar-${p.id}" role="progressbar" style="width: 0%"></div>
                    </div>
                  </div>
                  <!-- Success Badge -->
                  <div id="prodUploadSuccess-${p.id}" class="upload-success-badge d-none">
                    <i class="bi bi-check-circle-fill"></i>
                    <span>Uploaded! Save to apply.</span>
                  </div>
                  <!-- Error Badge -->
                  <div id="prodUploadFailed-${p.id}" class="alert alert-danger d-none small py-2 m-0">
                    <i class="bi bi-x-circle-fill me-1"></i> Upload failed.
                  </div>
                </div>
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
            <div class="col-md-2">
              <label class="form-label small fw-bold">Stock Qty</label>
              <input type="number" class="form-control form-control-sm ${isLowStock ? 'is-invalid' : ''}" id="prodStock-${p.id}" value="${p.stock_quantity || 0}">
            </div>
            <div class="col-md-2">
              <label class="form-label small fw-bold">Default Delivery</label>
              <input type="number" class="form-control form-control-sm" id="prodDelivery-${p.id}" value="${p.delivery_charge || 0}">
            </div>
            <div class="col-md-2">
              <label class="form-label small fw-bold">Order</label>
              <input type="number" class="form-control form-control-sm" id="prodOrder-${p.id}" value="${p.display_order || 0}">
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-bold">Card Type</label>
              <select class="form-select form-select-sm" id="prodCardType-${p.id}">
                <option value="product" ${p.card_type !== 'contact' ? 'selected' : ''}>Standard Product</option>
                <option value="contact" ${p.card_type === 'contact' ? 'selected' : ''}>Contact Us (B2B)</option>
              </select>
            </div>
            <div class="col-md-3 d-flex align-items-center">
              <div class="form-check form-switch mt-4">
                <input class="form-check-input" type="checkbox" id="prodIsPopup-${p.id}" ${p.is_popup === true ? 'checked' : ''}>
                <label class="form-check-label small fw-bold" for="prodIsPopup-${p.id}">Promo Popup</label>
              </div>
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
  if (!fileInput.files || !fileInput.files.length) return;

  const progressWrap = document.getElementById(`prodUploadProgress-${id}`);
  const progressBar  = document.getElementById(`prodUploadBar-${id}`);
  const progressPct  = document.getElementById(`prodUploadPercent-${id}`);
  const successBadge = document.getElementById(`prodUploadSuccess-${id}`);
  const failedBadge  = document.getElementById(`prodUploadFailed-${id}`);
  const previewImg   = document.getElementById(`prodThumb-${id}`);
  const imgInput     = document.getElementById(`prodImg-${id}`);

  if (progressWrap) progressWrap.classList.remove('d-none');
  if (successBadge) successBadge.classList.add('d-none');
  if (failedBadge) failedBadge.classList.add('d-none');
  if (progressBar) progressBar.style.width = '0%';
  if (progressPct) progressPct.textContent = '0%';

  try {
    const url = await uploadImageWithProgress(fileInput.files[0], (pct) => {
      if (progressBar) progressBar.style.width = pct + '%';
      if (progressPct) progressPct.textContent = pct + '%';
    });

    if (imgInput) imgInput.value = url;
    if (previewImg) {
      previewImg.src = url;
      previewImg.classList.add('preview-flash');
    }
    if (progressBar) progressBar.style.width = '100%';
    if (progressPct) progressPct.textContent = '100%';

    setTimeout(() => {
      if (progressWrap) progressWrap.classList.add('d-none');
      if (successBadge) successBadge.classList.remove('d-none');
      if (previewImg) previewImg.classList.remove('preview-flash');
    }, 400);
  } catch (err) {
    if (progressWrap) progressWrap.classList.add('d-none');
    if (failedBadge) failedBadge.classList.remove('d-none');
    showAdminToast('Upload failed: ' + err.message, 'error');
  } finally {
    fileInput.value = '';
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
      card_type:       document.getElementById(`prodCardType-${id}`).value             || 'product',
      is_popup:        document.getElementById(`prodIsPopup-${id}`).checked,
      is_active:       true
    });
    showAdminToast('Product saved!', 'success');
  } catch (err) {
    showAdminToast('Failed to save', 'error');
  }
}

function addProduct() {
  ['newProdTitle','newProdImg','newProdShort','newProdFull'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('newProdPrice').value    = '0';
  document.getElementById('newProdDiscount').value = '0';
  document.getElementById('newProdStock').value    = '10';
  document.getElementById('newProdDelivery').value = '350';
  document.getElementById('newProdOrder').value    = '99';
  document.getElementById('newProdCardType').value = 'product';
  document.getElementById('newProdIsPopup').checked = false;
  document.getElementById('newProdImgUpload').value = '';
  
  // Reset upload UI
  const thumb = document.getElementById('newProdThumb');
  if (thumb) thumb.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a6a6a6'><path d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/></svg>";
  
  ['newProdUploadProgress','newProdUploadSuccess','newProdUploadFailed'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('d-none');
  });

  new bootstrap.Modal(document.getElementById('addProductModal')).show();
}

async function handleNewProductImageUpload() {
  const fileInput = document.getElementById('newProdImgUpload');
  if (!fileInput.files || !fileInput.files.length) return;

  const progressWrap = document.getElementById('newProdUploadProgress');
  const progressBar  = document.getElementById('newProdUploadBar');
  const progressPct  = document.getElementById('newProdUploadPercent');
  const successBadge = document.getElementById('newProdUploadSuccess');
  const failedBadge  = document.getElementById('newProdUploadFailed');
  const previewImg   = document.getElementById('newProdThumb');
  const imgInput     = document.getElementById('newProdImg');

  if (progressWrap) progressWrap.classList.remove('d-none');
  if (successBadge) successBadge.classList.add('d-none');
  if (failedBadge) failedBadge.classList.add('d-none');
  if (progressBar) progressBar.style.width = '0%';
  if (progressPct) progressPct.textContent = '0%';

  try {
    const url = await uploadImageWithProgress(fileInput.files[0], (pct) => {
      if (progressBar) progressBar.style.width = pct + '%';
      if (progressPct) progressPct.textContent = pct + '%';
    });

    if (imgInput) imgInput.value = url;
    if (previewImg) {
      previewImg.src = url;
      previewImg.classList.add('preview-flash');
    }
    if (progressBar) progressBar.style.width = '100%';
    if (progressPct) progressPct.textContent = '100%';

    setTimeout(() => {
      if (progressWrap) progressWrap.classList.add('d-none');
      if (successBadge) successBadge.classList.remove('d-none');
      if (previewImg) previewImg.classList.remove('preview-flash');
    }, 400);
  } catch (err) {
    if (progressWrap) progressWrap.classList.add('d-none');
    if (failedBadge) failedBadge.classList.remove('d-none');
    showAdminToast('Upload failed: ' + err.message, 'error');
  } finally {
    fileInput.value = '';
  }
}

function updateProductThumbnail(id) {
  const imgInput = document.getElementById(`prodImg-${id}`);
  const previewImg = document.getElementById(`prodThumb-${id}`);
  if (imgInput && previewImg) {
    previewImg.src = imgInput.value || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a6a6a6'><path d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/></svg>";
  }
}

function updateNewProductThumbnail() {
  const imgInput = document.getElementById('newProdImg');
  const previewImg = document.getElementById('newProdThumb');
  if (imgInput && previewImg) {
    previewImg.src = imgInput.value || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a6a6a6'><path d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/></svg>";
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
      card_type:       document.getElementById('newProdCardType').value             || 'product',
      is_popup:        document.getElementById('newProdIsPopup').checked,
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
    document.getElementById('settingMaxPopups').value        = siteSettings.max_popups             || 5;
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

    // Announcement Bar Settings
    document.getElementById('settingAnnounceEnabled').checked   = siteSettings.announcement_enabled !== '0'; // default true
    document.getElementById('settingAnnounceText').value        = siteSettings.announcement_text || 'Authentic Ceylon Cinnamon from Southern Sri Lanka';
    document.getElementById('settingAnnounceBtn1Text').value    = siteSettings.announcement_btn1_text || 'Explore Products';
    document.getElementById('settingAnnounceBtn1Link').value    = siteSettings.announcement_btn1_link || '#products';
    document.getElementById('settingAnnounceBtn2Text').value    = siteSettings.announcement_btn2_text || 'Partner With Us';
    document.getElementById('settingAnnounceBtn2Link').value    = siteSettings.announcement_btn2_link || '#b2b';

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
      max_popups:             document.getElementById('settingMaxPopups').value             || '5',
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
    console.error(err);
  }
}

async function saveAnnouncementSettings() {
  try {
    const settings = {
      announcement_enabled:   document.getElementById('settingAnnounceEnabled').checked ? '1' : '0',
      announcement_text:      document.getElementById('settingAnnounceText').value,
      announcement_btn1_text: document.getElementById('settingAnnounceBtn1Text').value,
      announcement_btn1_link: document.getElementById('settingAnnounceBtn1Link').value,
      announcement_btn2_text: document.getElementById('settingAnnounceBtn2Text').value,
      announcement_btn2_link: document.getElementById('settingAnnounceBtn2Link').value
    };
    for (const [key, value] of Object.entries(settings)) {
      await saveSetting(key, value); 
    }
    showAdminToast('Announcement settings saved successfully!', 'success');
    siteSettings = { ...siteSettings, ...settings };
  } catch (err) {
    showAdminToast('Failed to save announcement settings', 'error');
    console.error(err);
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

// ============================================================
// ADMIN ACCOUNT MANAGEMENT
// ============================================================
function updatePendingAdminBadge(count) {
  const badge = document.getElementById('pendingAdminBadge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('d-none');
    } else {
      badge.classList.add('d-none');
    }
  }
}

async function loadAdminAccounts() {
  const listEl = document.getElementById('adminAccountsList');
  if (listEl) listEl.innerHTML = '<p class="text-muted small"><span class="spinner-border spinner-border-sm me-2"></span>Loading accounts...</p>';

  try {
    const snapshot = await db.collection('profiles').orderBy('created_at', 'desc').get();
    let html = '';
    let pendingCount = 0;
    let totalAdmins = 0;
    let approvedAdmins = 0;

    snapshot.forEach(doc => {
      const p = doc.data();
      const uid = doc.id;
      const createdAt = p.created_at ? new Date(p.created_at.seconds * 1000).toLocaleString() : 'N/A';
      const isApproved = p.is_approved === true && p.status !== 'pending';
      const isAdmin    = p.role === 'admin';

      if (isAdmin) {
        totalAdmins++;
        if (!isApproved) pendingCount++;
        else approvedAdmins++;
      }

      html += `
        <div class="item-card mb-3 ${!isApproved && isAdmin ? 'border-warning shadow-sm' : ''}" id="account-${uid}" style="${!isApproved && isAdmin ? 'border-left: 4px solid #ffc107 !important;' : ''}">
          <div class="item-header d-flex align-items-center gap-3">
            <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                 style="width:46px;height:46px;background:${isAdmin ? 'linear-gradient(135deg,#a65d25,#d4873a)' : 'linear-gradient(135deg,#6c757d,#495057)'};font-family:'Oswald',sans-serif;font-size:1.3rem;color:#fff;font-weight:700;">
              ${(p.username || p.email || '?')[0].toUpperCase()}
            </div>
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="fw-bold fs-6">${p.username || (p.first_name ? `${p.first_name} ${p.last_name}` : '(no username)')}</span>
                ${isAdmin ? '<span class="badge bg-primary">Admin</span>' : '<span class="badge bg-secondary">Customer</span>'}
                ${isApproved ? '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Approved</span>' : '<span class="badge bg-warning text-dark"><i class="bi bi-clock-history me-1"></i>Pending Approval</span>'}
              </div>
              <div class="small text-muted mt-1"><i class="bi bi-envelope me-1"></i>${p.email} ${p.mobile ? ` | <i class="bi bi-telephone me-1"></i>${p.mobile}` : ''} ${p.city ? ` | <i class="bi bi-geo-alt me-1"></i>${p.city}` : ''}</div>
              <div class="small text-muted">Registered: ${createdAt}</div>
            </div>
          </div>
          <div class="d-flex gap-2 mt-3 flex-wrap align-items-center border-top pt-2">
            ${!isApproved ? `<button class="btn btn-success btn-sm fw-bold" onclick="approveAccount('${uid}')"><i class="bi bi-check-circle me-1"></i>Approve Admin</button>` : ''}
            ${isApproved  ? `<button class="btn btn-outline-warning btn-sm text-dark" onclick="revokeAccount('${uid}')"><i class="bi bi-slash-circle me-1"></i>Revoke Access</button>` : ''}
            ${!isAdmin    ? `<button class="btn btn-outline-primary btn-sm" onclick="makeAdmin('${uid}')"><i class="bi bi-shield-lock me-1"></i>Make Admin</button>` : ''}
            <button class="btn btn-outline-danger btn-sm ms-auto" onclick="deleteAccount('${uid}')"><i class="bi bi-trash me-1"></i>Delete</button>
          </div>
        </div>`;
    });

    updatePendingAdminBadge(pendingCount);

    if (snapshot.empty) {
      html = '<div class="alert alert-secondary small">No user or admin accounts found in the system.</div>';
    } else {
      const summaryHeader = `
        <div class="row g-3 mb-4">
          <div class="col-md-4">
            <div class="card p-3 border-0 bg-light shadow-sm text-center">
              <div class="small text-muted fw-bold text-uppercase">Total Admins</div>
              <div class="fs-4 fw-bold text-primary">${totalAdmins}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card p-3 border-0 bg-light shadow-sm text-center">
              <div class="small text-muted fw-bold text-uppercase">Approved Admins</div>
              <div class="fs-4 fw-bold text-success">${approvedAdmins}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card p-3 border-0 ${pendingCount > 0 ? 'bg-warning bg-opacity-25 border border-warning' : 'bg-light'} shadow-sm text-center">
              <div class="small text-muted fw-bold text-uppercase">Pending Approvals</div>
              <div class="fs-4 fw-bold ${pendingCount > 0 ? 'text-warning text-dark' : 'text-muted'}">${pendingCount}</div>
            </div>
          </div>
        </div>
      `;
      html = summaryHeader + html;
    }

    if (listEl) listEl.innerHTML = html;
  } catch (err) {
    console.error('Load admin accounts error:', err);
    if (listEl) listEl.innerHTML = '<div class="alert alert-danger small">Failed to load accounts: ' + err.message + '</div>';
  }
}

async function approveAccount(uid) {
  try {
    await db.collection('profiles').doc(uid).update({ 
      is_approved: true, 
      status: 'approved',
      approved_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    showAdminToast('Account approved successfully! The admin can now log in.', 'success');
    loadAdminAccounts();
  } catch (err) {
    showAdminToast('Failed to approve: ' + err.message, 'error');
  }
}

async function revokeAccount(uid) {
  if (!confirm('Revoke this account\'s access? They will not be able to log in until re-approved.')) return;
  try {
    await db.collection('profiles').doc(uid).update({ 
      is_approved: false, 
      status: 'pending' 
    });
    showAdminToast('Account access revoked. Status set to Pending.', 'info');
    loadAdminAccounts();
  } catch (err) {
    showAdminToast('Failed to revoke: ' + err.message, 'error');
  }
}

async function makeAdmin(uid) {
  try {
    await db.collection('profiles').doc(uid).update({ 
      role: 'admin', 
      is_approved: true, 
      status: 'approved' 
    });
    showAdminToast('User promoted to Admin and approved!', 'success');
    loadAdminAccounts();
  } catch (err) {
    showAdminToast('Failed to update role: ' + err.message, 'error');
  }
}

async function deleteAccount(uid) {
  if (!confirm('Permanently delete this account? This cannot be undone.')) return;
  try {
    await db.collection('profiles').doc(uid).delete();
    showAdminToast('Account deleted successfully.', 'success');
    loadAdminAccounts();
  } catch (err) {
    showAdminToast('Failed to delete: ' + err.message, 'error');
  }
}

// Expose dynamic-HTML-called functions globally
window.approveAccount         = approveAccount;
window.revokeAccount          = revokeAccount;
window.makeAdmin              = makeAdmin;
window.deleteAccount          = deleteAccount;
window.loadAdminAccounts      = loadAdminAccounts;
window.updatePendingAdminBadge = updatePendingAdminBadge;
window.updateStepThumbnail    = updateStepThumbnail;
window.handleStepImageUpload  = handleStepImageUpload;
window.saveStep               = saveStep;
window.deleteStep             = deleteStep;
window.updateProductThumbnail = updateProductThumbnail;
window.handleProductImageUpload = handleProductImageUpload;
window.toggleProductPopup     = toggleProductPopup;
window.savePopupSettings      = savePopupSettings;
window.loadPopupManager       = loadPopupManager;

// ============================================================
// POPUPS MANAGER
// ============================================================
async function loadPopupManager() {
  const tableBody = document.getElementById('popupProductsTable');
  if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Loading products...</td></tr>';

  try {
    // Load setting first
    if (!siteSettings.max_popups) {
      siteSettings = await getSettings();
    }
    const maxVal = siteSettings.max_popups || 5;
    const settingInput = document.getElementById('popupSettingMax');
    if (settingInput) settingInput.value = maxVal;

    // Load active products
    const products = await getProductsAdmin();
    let html = '';
    
    products.forEach(p => {
      const isPopup = p.is_popup === true;
      const price = parseFloat(p.price) || 0;
      const discount = parseFloat(p.discount) || 0;
      
      html += `
        <tr id="popup-row-${p.id}">
          <td class="ps-4">
            <div style="width:40px;height:40px;overflow:hidden;border-radius:6px;background:#eee;">
              <img src="${p.image_url || 'images/logo.png'}" class="w-100 h-100 object-fit-cover" onerror="this.src='images/logo.png'">
            </div>
          </td>
          <td>
            <div class="fw-bold">${p.title}</div>
            <small class="text-muted d-block" style="max-width:300px;font-size:0.75rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.short_desc}</small>
          </td>
          <td>LKR ${price.toLocaleString()}</td>
          <td>LKR ${discount.toLocaleString()}</td>
          <td><span class="badge ${p.stock_quantity > 0 ? 'bg-light text-dark border' : 'bg-danger-subtle text-danger'}">${p.stock_quantity}</span></td>
          <td class="text-center">
            <div class="form-check form-switch d-inline-block">
              <input class="form-check-input" type="checkbox" id="tablePopupToggle-${p.id}" ${isPopup ? 'checked' : ''} onchange="toggleProductPopup('${p.id}', this.checked)">
            </div>
          </td>
        </tr>`;
    });

    if (products.length === 0) html = '<tr><td colspan="6" class="text-center text-muted py-3">No products available.</td></tr>';
    if (tableBody) tableBody.innerHTML = html;
  } catch (err) {
    console.error('Load popups error:', err);
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load products.</td></tr>';
  }
}

async function toggleProductPopup(id, isChecked) {
  try {
    await updateProduct(id, { is_popup: isChecked });
    showAdminToast(isChecked ? 'Product added to popups!' : 'Product removed from popups!', 'success');
  } catch (err) {
    showAdminToast('Failed to toggle popup status', 'error');
    console.error(err);
    // revert checkbox state
    const cb = document.getElementById(`tablePopupToggle-${id}`);
    if (cb) cb.checked = !isChecked;
  }
}

async function savePopupSettings() {
  try {
    const maxVal = document.getElementById('popupSettingMax').value || '5';
    await saveSetting('max_popups', maxVal);
    siteSettings.max_popups = maxVal;
    showAdminToast('Popup settings saved!', 'success');
  } catch (err) {
    showAdminToast('Failed to save popup settings', 'error');
    console.error(err);
  }
}

// ============================================================
// FAQ CRUD OPERATIONS
// ============================================================
async function loadFaqs() {
  const listDiv = document.getElementById('faqList');
  if (!listDiv) return;
  listDiv.innerHTML = '<p class="text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Loading FAQs...</p>';

  try {
    const faqs = await getFaqsAdmin();
    let html = '';
    
    faqs.forEach(faq => {
      const isActive = faq.is_active !== false;
      html += `
        <div class="item-card" id="faq-${faq.id}">
          <div class="item-header">
            <h5><span class="text-muted me-2">FAQ ID: ${faq.id}</span> ${faq.question || 'Untitled Question'}</h5>
            <div>
              <button class="btn btn-accent btn-sm me-1" onclick="saveFaq('${faq.id}')"><i class="bi bi-check-lg me-1"></i>Save</button>
              <button class="btn btn-outline-danger btn-sm" onclick="deleteFaq('${faq.id}')"><i class="bi bi-trash"></i></button>
            </div>
          </div>
          <div class="row g-3">
            <div class="col-md-9">
              <label class="form-label small fw-bold">Question</label>
              <input type="text" class="form-control form-control-sm" id="faqQuestion-${faq.id}" value="${faq.question || ''}">
            </div>
            <div class="col-md-2 col-6">
              <label class="form-label small fw-bold">Display Order</label>
              <input type="number" class="form-control form-control-sm" id="faqOrder-${faq.id}" value="${faq.display_order || 0}">
            </div>
            <div class="col-md-1 col-6 d-flex align-items-center">
              <div class="form-check form-switch mt-4">
                <input class="form-check-input" type="checkbox" id="faqActive-${faq.id}" ${isActive ? 'checked' : ''}>
                <label class="form-check-label small fw-bold" for="faqActive-${faq.id}">Active</label>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label small fw-bold">Answer</label>
              <textarea class="form-control form-control-sm" id="faqAnswer-${faq.id}" rows="3">${faq.answer || ''}</textarea>
            </div>
          </div>
        </div>`;
    });

    if (faqs.length === 0) {
      html = '<div class="alert alert-warning py-2 small">No FAQs found. Click "Add FAQ" to create one.</div>';
    }
    listDiv.innerHTML = html;
  } catch (err) {
    console.error('Load FAQs error:', err);
    listDiv.innerHTML = '<div class="alert alert-danger py-2 small">Failed to load FAQs from database.</div>';
  }
}

async function saveFaq(id) {
  try {
    const question = document.getElementById(`faqQuestion-${id}`).value;
    const answer = document.getElementById(`faqAnswer-${id}`).value;
    const display_order = parseInt(document.getElementById(`faqOrder-${id}`).value) || 0;
    const is_active = document.getElementById(`faqActive-${id}`).checked;

    await updateFaq(id, {
      question,
      answer,
      display_order,
      is_active
    });

    showAdminToast('FAQ saved successfully!', 'success');
    loadFaqs();
  } catch (err) {
    console.error('Save FAQ error:', err);
    showAdminToast('Failed to save FAQ: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function addFaq() {
  try {
    // Determine high display order
    const faqs = await getFaqsAdmin();
    const maxOrder = faqs.reduce((max, f) => Math.max(max, f.display_order || 0), 0);
    
    await createFaq({
      question: 'New FAQ Question',
      answer: 'New FAQ Answer text.',
      display_order: maxOrder + 1,
      is_active: false
    });

    showAdminToast('New FAQ created! Scroll down to edit it.', 'success');
    loadFaqs();
  } catch (err) {
    console.error('Add FAQ error:', err);
    showAdminToast('Failed to create FAQ: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function deleteFaq(id) {
  if (!confirm('Are you sure you want to delete this FAQ?')) return;
  
  // Clear any existing timeout for this FAQ
  if (faqSaveTimeouts[id]) {
    clearTimeout(faqSaveTimeouts[id]);
    delete faqSaveTimeouts[id];
  }
  
  try {
    await deleteFaqById(id);
    showAdminToast('FAQ deleted successfully!', 'success');
    loadFaqs();
  } catch (err) {
    console.error('Delete FAQ error:', err);
    showAdminToast('Failed to delete FAQ: ' + (err.message || 'Unknown error'), 'error');
  }
}

// FAQ Background Image Upload with Cloudinary Progress
document.getElementById('faqBgImageInput')?.addEventListener('change', async function() {
  if (!this.files || !this.files.length) return;

  const progressWrap = document.getElementById('faqBgUploadProgress');
  const progressBar  = document.getElementById('faqBgProgressBar');
  const progressPct  = document.getElementById('faqBgProgressPercent');
  const statusDiv    = document.getElementById('faqBgUploadStatus');
  const previewImg   = document.getElementById('faqBgPreview');
  const placeholder  = document.getElementById('faqBgPlaceholder');

  progressWrap.classList.remove('d-none');
  statusDiv.classList.add('d-none');
  progressBar.style.width = '0%';
  progressPct.textContent = '0%';

  try {
    const url = await uploadImageWithProgress(this.files[0], (pct) => {
      progressBar.style.width = pct + '%';
      progressPct.textContent = pct + '%';
    });

    previewImg.src = url;
    previewImg.style.display = 'block';
    placeholder.style.display = 'none';
    previewImg.classList.add('preview-flash');

    progressBar.style.width = '100%';
    progressPct.textContent = '100%';

    setTimeout(() => {
      progressWrap.classList.add('d-none');
      statusDiv.innerHTML = '<div class="upload-success-badge"><i class="bi bi-check-circle"></i> Image uploaded successfully!</div>';
      statusDiv.classList.remove('d-none');
      previewImg.classList.remove('preview-flash');
    }, 400);
  } catch (err) {
    progressWrap.classList.add('d-none');
    statusDiv.innerHTML = '<div class="alert alert-danger py-2 small">Upload failed: ' + err.message + '</div>';
    statusDiv.classList.remove('d-none');
    showAdminToast('Upload failed: ' + err.message, 'error');
  } finally {
    this.value = '';
  }
});

// Save FAQ Background
async function saveFaqBackground() {
  const previewImg = document.getElementById('faqBgPreview');
  const statusDiv = document.getElementById('faqBgUploadStatus');
  
  if (!previewImg.src || previewImg.style.display === 'none') {
    showAdminToast('Please upload a background image first', 'error');
    return;
  }

  try {
    statusDiv.innerHTML = '<div class="alert alert-info py-2 small"><span class="spinner-border spinner-border-sm me-2"></span>Saving background...</div>';
    
    await updateFaqBackground(previewImg.src);
    
    statusDiv.innerHTML = '<div class="upload-success-badge"><i class="bi bi-check-circle"></i> Background saved successfully!</div>';
    showAdminToast('FAQ background saved successfully!', 'success');
  } catch (err) {
    console.error('Save FAQ background error:', err);
    statusDiv.innerHTML = '<div class="alert alert-danger py-2 small">Failed to save background: ' + err.message + '</div>';
    showAdminToast('Failed to save background: ' + err.message, 'error');
  }
}

// Load FAQ Background on section load
async function loadFaqBackground() {
  const previewImg = document.getElementById('faqBgPreview');
  const placeholder = document.getElementById('faqBgPlaceholder');
  
  try {
    const bgUrl = await getFaqBackground();
    
    if (bgUrl) {
      previewImg.src = bgUrl;
      previewImg.style.display = 'block';
      placeholder.style.display = 'none';
    }
  } catch (err) {
    console.error('Load FAQ background error:', err);
  }
}

// ============================================================
// B2B PARTNERSHIPS MANAGEMENT
// ============================================================
async function loadB2BSection() {
  try {
    const content = await getContent();
    const b2bData = content?.b2b || {};

    // Load content fields
    document.getElementById('b2bSectionTitle').value = b2bData.title || 'B2B Partnerships';
    document.getElementById('b2bSubtitle').value = b2bData.subtitle || 'Partner With Cinnamon Heritage';
    document.getElementById('b2bDescription').value = b2bData.description || 'We provide authentic Ceylon Cinnamon solutions for global businesses, supporting industries with premium products, reliable supply and customized services from our family estate in Galle, Sri Lanka.';
    const bgUrl = b2bData.background_image || 'images/estate_bg.png';
    document.getElementById('b2bBackgroundImage').value = bgUrl;
    document.getElementById('b2bBgPreviewImg').src = bgUrl;
    document.getElementById('b2bCtaTitle').value = b2bData.cta_title || 'Become a Partner';
    document.getElementById('b2bCtaDescription').value = b2bData.cta_description || 'Partner with Cinnamon Heritage for authentic Ceylon Cinnamon products and tailored business solutions.';
    document.getElementById('b2bButtonText').value = b2bData.button_text || 'Partner With Us';

    // Load partner types
    const partnerTypes = b2bData.partner_types || [
      { title: 'Manufacturers', description: 'Premium Ceylon Cinnamon ingredients for food, beverage, wellness and cosmetic manufacturers.', icon: 'industry' },
      { title: 'Importers', description: 'Export-quality cinnamon supply with consistent quality and reliable sourcing.', icon: 'ship' },
      { title: 'Distributors', description: 'Wholesale partnerships with flexible supply options and premium product ranges.', icon: 'truck' },
      { title: 'Retailers', description: 'Authentic cinnamon products including quills, powder, tea and gift collections.', icon: 'store' },
      { title: 'Hospitality', description: 'Custom cinnamon solutions for hotels, resorts, restaurants and cafés.', icon: 'hotel' },
      { title: 'Product Developers', description: 'Collaborate with us to create innovative cinnamon-based products and concepts.', icon: 'lightbulb' }
    ];

    let partnerTypesHtml = '';
    partnerTypes.forEach((pt, index) => {
      partnerTypesHtml += `
        <div class="col-md-6 col-lg-4">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="flex-grow-1">
                  <input type="text" class="form-control form-control-sm mb-2" 
                    id="partnerTitle-${index}" value="${pt.title || ''}" placeholder="Partner Type Title">
                  <input type="text" class="form-control form-control-sm mb-2" 
                    id="partnerIcon-${index}" value="${pt.icon || 'industry'}" placeholder="Icon (industry, ship, etc.)">
                  <textarea class="form-control form-control-sm" rows="2" 
                    id="partnerDesc-${index}" placeholder="Description">${pt.description || ''}</textarea>
                </div>
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="removePartnerType(${index})">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>`;
    });
    document.getElementById('partnerTypesList').innerHTML = partnerTypesHtml;

    // Load B2B solutions
    const b2bSolutions = b2bData.solutions || [
      { title: 'Bulk Supply', description: 'Large-scale supply of premium Ceylon Cinnamon products for local and international markets.', icon: 'boxes' },
      { title: 'Private Label', description: 'Create your own branded cinnamon products with our manufacturing and packaging support.', icon: 'tag' },
      { title: 'Co-Development', description: 'Work with our team to develop unique cinnamon products tailored to your market.', icon: 'handshake' },
      { title: 'Custom Ingredient Solutions', description: 'Customized cinnamon formats including quills, powder, chips and essential oils based on your requirements.', icon: 'flask' }
    ];

    let solutionsHtml = '';
    b2bSolutions.forEach((sol, index) => {
      solutionsHtml += `
        <div class="col-md-6 col-lg-3">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="flex-grow-1">
                  <input type="text" class="form-control form-control-sm mb-2" 
                    id="solutionTitle-${index}" value="${sol.title || ''}" placeholder="Solution Title">
                  <input type="text" class="form-control form-control-sm mb-2" 
                    id="solutionIcon-${index}" value="${sol.icon || 'boxes'}" placeholder="Icon (boxes, tag, etc.)">
                  <textarea class="form-control form-control-sm" rows="2" 
                    id="solutionDesc-${index}" placeholder="Description">${sol.description || ''}</textarea>
                </div>
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="removeB2BSolution(${index})">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>`;
    });
    document.getElementById('b2bSolutionsList').innerHTML = solutionsHtml;

  } catch (err) {
    console.error('Load B2B section error:', err);
    showAdminToast('Failed to load B2B section: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function addPartnerType() {
  try {
    const partnerTypesList = document.getElementById('partnerTypesList');
    const index = partnerTypesList.children.length;
    
    const newPartnerHtml = `
      <div class="col-md-6 col-lg-4">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="flex-grow-1">
                <input type="text" class="form-control form-control-sm mb-2" 
                  id="partnerTitle-${index}" value="" placeholder="Partner Type Title">
                <input type="text" class="form-control form-control-sm mb-2" 
                  id="partnerIcon-${index}" value="industry" placeholder="Icon (industry, ship, etc.)">
                <textarea class="form-control form-control-sm" rows="2" 
                  id="partnerDesc-${index}" placeholder="Description"></textarea>
              </div>
              <button class="btn btn-sm btn-outline-danger ms-2" onclick="removePartnerType(${index})">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;
    
    partnerTypesList.insertAdjacentHTML('beforeend', newPartnerHtml);
    showAdminToast('New partner type added!', 'success');
  } catch (err) {
    console.error('Add partner type error:', err);
    showAdminToast('Failed to add partner type: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function addB2BSolution() {
  try {
    const solutionsList = document.getElementById('b2bSolutionsList');
    const index = solutionsList.children.length;
    
    const newSolutionHtml = `
      <div class="col-md-6 col-lg-3">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="flex-grow-1">
                <input type="text" class="form-control form-control-sm mb-2" 
                  id="solutionTitle-${index}" value="" placeholder="Solution Title">
                <input type="text" class="form-control form-control-sm mb-2" 
                  id="solutionIcon-${index}" value="boxes" placeholder="Icon (boxes, tag, etc.)">
                <textarea class="form-control form-control-sm" rows="2" 
                  id="solutionDesc-${index}" placeholder="Description"></textarea>
              </div>
              <button class="btn btn-sm btn-outline-danger ms-2" onclick="removeB2BSolution(${index})">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;
    
    solutionsList.insertAdjacentHTML('beforeend', newSolutionHtml);
    showAdminToast('New B2B solution added!', 'success');
  } catch (err) {
    console.error('Add B2B solution error:', err);
    showAdminToast('Failed to add B2B solution: ' + (err.message || 'Unknown error'), 'error');
  }
}

function removePartnerType(index) {
  if (!confirm('Are you sure you want to remove this partner type?')) return;
  const partnerTypesList = document.getElementById('partnerTypesList');
  if (partnerTypesList.children[index]) {
    partnerTypesList.children[index].remove();
    showAdminToast('Partner type removed!', 'success');
  }
}

function removeB2BSolution(index) {
  if (!confirm('Are you sure you want to remove this B2B solution?')) return;
  const solutionsList = document.getElementById('b2bSolutionsList');
  if (solutionsList.children[index]) {
    solutionsList.children[index].remove();
    showAdminToast('B2B solution removed!', 'success');
  }
}

document.getElementById('b2bBgUpload')?.addEventListener('change', async function() {
  if (!this.files || !this.files.length) return;

  const progressWrap  = document.getElementById('b2bBgUploadProgress');
  const progressBar   = document.getElementById('b2bBgUploadBar');
  const progressPct   = document.getElementById('b2bBgUploadPercent');
  const successBadge  = document.getElementById('b2bBgUploadSuccess');
  const failedBadge   = document.getElementById('b2bBgUploadFailed');
  const failedMsg     = document.getElementById('b2bBgUploadFailedMsg');
  const previewImg    = document.getElementById('b2bBgPreviewImg');
  const bgInput       = document.getElementById('b2bBackgroundImage');

  progressWrap.classList.remove('d-none');
  successBadge.classList.add('d-none');
  failedBadge.classList.add('d-none');
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
    failedMsg.textContent = 'Upload failed: ' + err.message;
    failedBadge.classList.remove('d-none');
  } finally {
    this.value = '';
  }
});

async function saveB2BContent() {
  try {
    // Collect partner types
    const partnerTypes = [];
    const partnerTypesList = document.getElementById('partnerTypesList');
    Array.from(partnerTypesList.children).forEach((col, index) => {
      const title = document.getElementById(`partnerTitle-${index}`)?.value || '';
      const icon = document.getElementById(`partnerIcon-${index}`)?.value || 'industry';
      const description = document.getElementById(`partnerDesc-${index}`)?.value || '';
      if (title) {
        partnerTypes.push({ title, icon, description });
      }
    });

    // Collect B2B solutions
    const solutions = [];
    const solutionsList = document.getElementById('b2bSolutionsList');
    Array.from(solutionsList.children).forEach((col, index) => {
      const title = document.getElementById(`solutionTitle-${index}`)?.value || '';
      const icon = document.getElementById(`solutionIcon-${index}`)?.value || 'boxes';
      const description = document.getElementById(`solutionDesc-${index}`)?.value || '';
      if (title) {
        solutions.push({ title, icon, description });
      }
    });

    // Collect content fields
    const b2bData = {
      title: document.getElementById('b2bSectionTitle').value,
      subtitle: document.getElementById('b2bSubtitle').value,
      description: document.getElementById('b2bDescription').value,
      background_image: document.getElementById('b2bBackgroundImage').value || 'images/estate_bg.png',
      cta_title: document.getElementById('b2bCtaTitle').value,
      cta_description: document.getElementById('b2bCtaDescription').value,
      button_text: document.getElementById('b2bButtonText').value,
      partner_types: partnerTypes,
      solutions: solutions
    };

    // Get existing content and update B2B section
    const existingContent = await getContent();
    const updatedContent = {
      ...existingContent,
      b2b: b2bData
    };

    await saveContentFields('b2b', b2bData);
    showAdminToast('B2B content saved successfully!', 'success');
  } catch (err) {
    console.error('Save B2B content error:', err);
    showAdminToast('Failed to save B2B content: ' + (err.message || 'Unknown error'), 'error');
  }
}

// ============================================================
// B2B ENQUIRIES MANAGEMENT
// ============================================================
async function loadB2BEnquiries() {
  try {
    const enquiries = await getB2BEnquiries();
    
    // Update stats
    document.getElementById('b2bTotalEnquiries').textContent = enquiries.length;
    
    const thisMonth = enquiries.filter(e => {
      const enquiryDate = new Date(e.created_at);
      const now = new Date();
      return enquiryDate.getMonth() === now.getMonth() && enquiryDate.getFullYear() === now.getFullYear();
    }).length;
    document.getElementById('b2bThisMonth').textContent = thisMonth;
    
    const pending = enquiries.filter(e => e.status === 'pending' || !e.status).length;
    document.getElementById('b2bPending').textContent = pending;

    // Load email configuration
    const settings = await getSettings();
    document.getElementById('b2bRecipientEmail').value = settings.b2b_recipient_email || 'info@cinnamonheritage.com';
    document.getElementById('b2bEmailJSServiceId').value = settings.b2b_emailjs_service_id || '';
    document.getElementById('b2bEmailJSTemplateId').value = settings.b2b_emailjs_template_id || '';
    document.getElementById('b2bEmailJSPublicKey').value = settings.b2b_emailjs_public_key || '';

    // Render enquiries table
    renderB2BEnquiriesTable(enquiries);
  } catch (err) {
    console.error('Load B2B enquiries error:', err);
    showAdminToast('Failed to load B2B enquiries: ' + (err.message || 'Unknown error'), 'error');
  }
}

function renderB2BEnquiriesTable(enquiries) {
  const tbody = document.getElementById('b2bEnquiriesTableBody');
  
  if (!enquiries || enquiries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No enquiries found</td></tr>';
    return;
  }

  const sortedEnquiries = enquiries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  let html = '';
  sortedEnquiries.forEach(enquiry => {
    const status = enquiry.status || 'pending';
    const statusBadge = status === 'pending' 
      ? '<span class="badge bg-warning text-dark">Pending</span>'
      : status === 'contacted'
        ? '<span class="badge bg-info">Contacted</span>'
        : status === 'completed'
          ? '<span class="badge bg-success">Completed</span>'
          : '<span class="badge bg-secondary">Unknown</span>';

    const date = new Date(enquiry.created_at).toLocaleDateString();
    
    html += `
      <tr>
        <td class="ps-4"><span class="fw-medium">${enquiry.enquiry_id || 'N/A'}</span></td>
        <td>${enquiry.company_name || 'N/A'}</td>
        <td>${enquiry.contact_person || 'N/A'}</td>
        <td>${enquiry.email || 'N/A'}</td>
        <td>${enquiry.industry || 'N/A'}</td>
        <td>${enquiry.intended_product || 'N/A'}</td>
        <td>${date}</td>
        <td class="text-center">${statusBadge}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="viewB2BEnquiry('${enquiry.id}')" title="View Details">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-success me-1" onclick="updateB2BEnquiryStatus('${enquiry.id}', 'contacted')" title="Mark as Contacted">
            <i class="bi bi-check"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteB2BEnquiry('${enquiry.id}')" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`;
  });
  
  tbody.innerHTML = html;
}

async function viewB2BEnquiry(enquiryId) {
  try {
    const enquiry = await getB2BEnquiryById(enquiryId);
    if (!enquiry) {
      showAdminToast('Enquiry not found', 'error');
      return;
    }

    const details = `
      <strong>Enquiry ID:</strong> ${enquiry.enquiry_id || 'N/A'}
      <strong>Company:</strong> ${enquiry.company_name || 'N/A'}
      <strong>Website:</strong> ${enquiry.website || 'N/A'}
      <strong>Country:</strong> ${enquiry.country || 'N/A'}
      <strong>Destination Market:</strong> ${enquiry.destination_market || 'N/A'}
      <strong>Contact Person:</strong> ${enquiry.contact_person || 'N/A'}
      <strong>Position:</strong> ${enquiry.position || 'N/A'}
      <strong>Email:</strong> ${enquiry.email || 'N/A'}
      <strong>Phone:</strong> ${enquiry.phone || 'N/A'}
      <strong>Industry:</strong> ${enquiry.industry || 'N/A'}
      <strong>Intended Product:</strong> ${enquiry.intended_product || 'N/A'}
      <strong>Ingredient Required:</strong> ${enquiry.ingredient_required || 'N/A'}
      <strong>Trial Quantity:</strong> ${enquiry.trial_quantity || 'N/A'}
      <strong>Annual Volume:</strong> ${enquiry.annual_volume || 'N/A'}
      <strong>Pack Size:</strong> ${enquiry.pack_size || 'N/A'}
      <strong>Packaging Type:</strong> ${enquiry.packaging_type || 'N/A'}
      <strong>Certifications:</strong> ${enquiry.certifications ? enquiry.certifications.join(', ') : 'N/A'}
      <strong>Target Launch Date:</strong> ${enquiry.target_launch_date || 'N/A'}
      <strong>Message:</strong> ${enquiry.message || 'N/A'}
      <strong>Status:</strong> ${enquiry.status || 'pending'}
      <strong>Submitted:</strong> ${new Date(enquiry.created_at).toLocaleString()}
    `;

    alert(details.replace(/<strong>/g, '\n').replace(/<\/strong>/g, ': ').replace(/<br>/g, '\n'));
  } catch (err) {
    console.error('View B2B enquiry error:', err);
    showAdminToast('Failed to load enquiry details: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function updateB2BEnquiryStatus(enquiryId, newStatus) {
  try {
    await updateB2BEnquiry(enquiryId, { status: newStatus });
    showAdminToast('Enquiry status updated!', 'success');
    loadB2BEnquiries();
  } catch (err) {
    console.error('Update B2B enquiry status error:', err);
    showAdminToast('Failed to update status: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function deleteB2BEnquiry(enquiryId) {
  if (!confirm('Are you sure you want to delete this enquiry?')) return;
  
  try {
    await deleteB2BEnquiryById(enquiryId);
    showAdminToast('Enquiry deleted successfully!', 'success');
    loadB2BEnquiries();
  } catch (err) {
    console.error('Delete B2B enquiry error:', err);
    showAdminToast('Failed to delete enquiry: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function saveB2BEmailConfig() {
  try {
    const config = {
      b2b_recipient_email: document.getElementById('b2bRecipientEmail').value,
      b2b_emailjs_service_id: document.getElementById('b2bEmailJSServiceId').value,
      b2b_emailjs_template_id: document.getElementById('b2bEmailJSTemplateId').value,
      b2b_emailjs_public_key: document.getElementById('b2bEmailJSPublicKey').value
    };

    // Save each setting individually
    for (const [key, value] of Object.entries(config)) {
      await saveSetting(key, value);
    }

    showAdminToast('Email configuration saved successfully!', 'success');
  } catch (err) {
    console.error('Save B2B email config error:', err);
    showAdminToast('Failed to save email configuration: ' + (err.message || 'Unknown error'), 'error');
  }
}

// ============================================================
// EXPERIENCE BOOKINGS MANAGEMENT
// ============================================================
async function loadExperienceBookings() {
  try {
    const bookings = await getExperienceBookings();
    
    // Update stats
    document.getElementById('expTotalBookings').textContent = bookings.length;
    
    const thisMonth = bookings.filter(b => {
      const bookingDate = new Date(b.created_at);
      const now = new Date();
      return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
    }).length;
    document.getElementById('expThisMonth').textContent = thisMonth;
    
    const pending = bookings.filter(b => b.status === 'pending' || !b.status).length;
    document.getElementById('expPending').textContent = pending;

    // Load email configuration
    const settings = await getSettings();
    document.getElementById('expRecipientEmail').value = settings.exp_recipient_email || 'info@cinnamonheritage.com';
    document.getElementById('expEmailJSServiceId').value = settings.exp_emailjs_service_id || '';
    document.getElementById('expEmailJSTemplateId').value = settings.exp_emailjs_template_id || '';
    document.getElementById('expEmailJSPublicKey').value = settings.exp_emailjs_public_key || '';

    // Render bookings table
    renderExperienceBookingsTable(bookings);
  } catch (err) {
    console.error('Load Experience bookings error:', err);
    showAdminToast('Failed to load Experience bookings: ' + (err.message || 'Unknown error'), 'error');
  }
}

function renderExperienceBookingsTable(bookings) {
  const tbody = document.getElementById('experienceBookingsTableBody');
  
  if (!bookings || bookings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No bookings found</td></tr>';
    return;
  }

  const sortedBookings = bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  let html = '';
  sortedBookings.forEach(booking => {
    const status = booking.status || 'pending';
    const statusBadge = status === 'pending' 
      ? '<span class="badge bg-warning text-dark">Pending</span>'
      : status === 'confirmed'
        ? '<span class="badge bg-success">Confirmed</span>'
        : status === 'completed'
          ? '<span class="badge bg-info">Completed</span>'
          : status === 'cancelled'
            ? '<span class="badge bg-danger">Cancelled</span>'
            : '<span class="badge bg-secondary">Unknown</span>';

    const date = booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString() : 'N/A';
    
    html += `
      <tr>
        <td class="ps-4"><span class="fw-medium">${booking.booking_id || 'N/A'}</span></td>
        <td>${booking.name || 'N/A'}</td>
        <td>${booking.email || 'N/A'}</td>
        <td>${booking.visit_type || 'N/A'}</td>
        <td>${date}</td>
        <td>${booking.number_of_visitors || 'N/A'}</td>
        <td class="text-center">${statusBadge}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="viewExperienceBooking('${booking.id}')" title="View Details">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-success me-1" onclick="updateExperienceBookingStatus('${booking.id}', 'confirmed')" title="Confirm">
            <i class="bi bi-check"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteExperienceBooking('${booking.id}')" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`;
  });
  
  tbody.innerHTML = html;
}

async function viewExperienceBooking(bookingId) {
  try {
    const booking = await getExperienceBookingById(bookingId);
    if (!booking) {
      showAdminToast('Booking not found', 'error');
      return;
    }

    const details = `
      <strong>Booking ID:</strong> ${booking.booking_id || 'N/A'}
      <strong>Name:</strong> ${booking.name || 'N/A'}
      <strong>Email:</strong> ${booking.email || 'N/A'}
      <strong>Phone:</strong> ${booking.phone || 'N/A'}
      <strong>Country:</strong> ${booking.country || 'N/A'}
      <strong>Visit Type:</strong> ${booking.visit_type || 'N/A'}
      <strong>Preferred Date:</strong> ${booking.preferred_date || 'N/A'}
      <strong>Preferred Time:</strong> ${booking.preferred_time || 'N/A'}
      <strong>Number of Visitors:</strong> ${booking.number_of_visitors || 'N/A'}
      <strong>Selected Experiences:</strong> ${booking.selected_experiences ? booking.selected_experiences.join(', ') : 'N/A'}
      <strong>Company Name:</strong> ${booking.company_name || 'N/A'}
      <strong>Position:</strong> ${booking.position || 'N/A'}
      <strong>Industry:</strong> ${booking.industry || 'N/A'}
      <strong>Special Requirements:</strong> ${booking.special_requirements || 'N/A'}
      <strong>Message:</strong> ${booking.message || 'N/A'}
      <strong>Status:</strong> ${booking.status || 'pending'}
      <strong>Submitted:</strong> ${new Date(booking.created_at).toLocaleString()}
    `;

    alert(details.replace(/<strong>/g, '\n').replace(/<\/strong>/g, ': ').replace(/<br>/g, '\n'));
  } catch (err) {
    console.error('View Experience booking error:', err);
    showAdminToast('Failed to load booking details: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function updateExperienceBookingStatus(bookingId, newStatus) {
  try {
    await updateExperienceBooking(bookingId, { status: newStatus });
    showAdminToast('Booking status updated!', 'success');
    loadExperienceBookings();
  } catch (err) {
    console.error('Update Experience booking status error:', err);
    showAdminToast('Failed to update status: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function deleteExperienceBooking(bookingId) {
  if (!confirm('Are you sure you want to delete this booking?')) return;
  
  try {
    await deleteExperienceBookingById(bookingId);
    showAdminToast('Booking deleted successfully!', 'success');
    loadExperienceBookings();
  } catch (err) {
    console.error('Delete Experience booking error:', err);
    showAdminToast('Failed to delete booking: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function saveExperienceEmailConfig() {
  try {
    const config = {
      exp_recipient_email: document.getElementById('expRecipientEmail').value,
      exp_emailjs_service_id: document.getElementById('expEmailJSServiceId').value,
      exp_emailjs_template_id: document.getElementById('expEmailJSTemplateId').value,
      exp_emailjs_public_key: document.getElementById('expEmailJSPublicKey').value
    };

    // Save each setting individually
    for (const [key, value] of Object.entries(config)) {
      await saveSetting(key, value);
    }

    showAdminToast('Email configuration saved successfully!', 'success');
  } catch (err) {
    console.error('Save Experience email config error:', err);
    showAdminToast('Failed to save email configuration: ' + (err.message || 'Unknown error'), 'error');
  }
}

// ============================================================
// ESSENTIAL OILS MANAGEMENT
// ============================================================
async function loadEssentialOilsSection() {
  try {
    const content = await getContent();
    const eoData = content?.essential_oils || {};

    // Load section content
    document.getElementById('eoTitle').value = eoData.title || 'Essential Oils';
    document.getElementById('eoSubtitle').value = eoData.subtitle || 'Pure Ceylon Cinnamon Essential Oils';
    document.getElementById('eoDescription').value = eoData.description || 'Steam Distilled From Authentic Ceylon Cinnamon';
    document.getElementById('eoText').value = eoData.text || 'Experience the natural power of authentic Ceylon Cinnamon through our premium essential oils...';
    const bgUrl = eoData.background_image || 'images/estate_bg.png';
    document.getElementById('eoBackgroundImage').value = bgUrl;
    document.getElementById('eoBgPreviewImg').src = bgUrl;
    document.getElementById('eoSampleBtn').value = eoData.sample_button || 'Request B2B Sample';
    document.getElementById('eoTechBtn').value = eoData.tech_button || 'Technical Discussion';

    // Load leaf oil data
    document.getElementById('eoLeafTitle').value = eoData.leaf?.title || 'Cinnamon Leaf Oil';
    document.getElementById('eoLeafSubtitle').value = eoData.leaf?.subtitle || 'Pure Ceylon Cinnamon Leaf Oil';
    document.getElementById('eoLeafDescription').value = eoData.leaf?.description || 'Our Cinnamon Leaf Oil is produced through steam distillation...';
    document.getElementById('eoLeafFeatures').value = eoData.leaf?.features || '✓ Steam distilled from authentic Ceylon cinnamon leaves\n✓ High natural eugenol content\n✓ Warm spicy aroma profile\n✓ Suitable for industrial and commercial applications\n✓ Available for bulk export supply';
    document.getElementById('eoLeafConstituents').value = eoData.leaf?.constituents || 'Eugenol, Benzyl Benzoate, Linalool, Cinnamaldehyde (minor component)';
    document.getElementById('eoLeafApplications').value = eoData.leaf?.applications || 'Aromatherapy products, Natural fragrances, Cosmetic formulations, Personal care products, Wellness products, Home fragrance solutions';

    // Load bark oil data
    document.getElementById('eoBarkTitle').value = eoData.bark?.title || 'Cinnamon Bark Oil';
    document.getElementById('eoBarkSubtitle').value = eoData.bark?.subtitle || 'Premium Ceylon Cinnamon Bark Oil';
    document.getElementById('eoBarkDescription').value = eoData.bark?.description || 'Cinnamon Bark Oil is one of the most valuable essential oils...';
    document.getElementById('eoBarkFeatures').value = eoData.bark?.features || '✓ Produced from premium Ceylon cinnamon bark\n✓ High cinnamaldehyde content\n✓ Strong sweet cinnamon fragrance\n✓ Premium ingredient for international markets\n✓ Suitable for food, fragrance and wellness industries';
    document.getElementById('eoBarkConstituents').value = eoData.bark?.constituents || 'Cinnamaldehyde, Eugenol, Benzyl Benzoate, Linalool';
    document.getElementById('eoBarkApplications').value = eoData.bark?.applications || 'Premium fragrances, Food flavouring solutions, Beverage concepts, Wellness products, Natural aroma formulations, Cosmetic industries';

    // Load aroma profiles
    document.getElementById('eoLeafAromaTitle').value = eoData.aroma?.leaf_title || 'Cinnamon Leaf Oil Aroma';
    document.getElementById('eoLeafAromaDescription').value = eoData.aroma?.leaf_description || 'Warm and spicy with a distinctive clove-like character.';
    document.getElementById('eoBarkAromaTitle').value = eoData.aroma?.bark_title || 'Cinnamon Bark Oil Aroma';
    document.getElementById('eoBarkAromaDescription').value = eoData.aroma?.bark_description || 'A powerful traditional cinnamon fragrance with a sweet and luxurious character.';
    document.getElementById('eoLeafAromaNotes').value = eoData.aroma?.leaf_notes || 'Herbal, Spicy, Woody, Slightly sweet';
    document.getElementById('eoBarkAromaNotes').value = eoData.aroma?.bark_notes || 'Sweet, Rich, Warm, Intense cinnamon';

    // Load footer
    document.getElementById('eoFooter').value = eoData.footer || 'Authentic Ceylon Cinnamon Quality - From our family estate in Galle, Sri Lanka, every drop represents generations of cinnamon craftsmanship, sustainable farming and uncompromising quality. Pure. Natural. Authentic Ceylon Cinnamon.';

    // Load email configuration
    const settings = await getSettings();
    document.getElementById('eoRecipientEmail').value = settings.eo_recipient_email || 'info@cinnamonheritage.com';
    document.getElementById('eoEmailJSServiceId').value = settings.eo_emailjs_service_id || '';
    document.getElementById('eoEmailJSTemplateId').value = settings.eo_emailjs_template_id || '';
    document.getElementById('eoEmailJSPublicKey').value = settings.eo_emailjs_public_key || '';

  } catch (err) {
    console.error('Load Essential Oils section error:', err);
    showAdminToast('Failed to load Essential Oils section: ' + (err.message || 'Unknown error'), 'error');
  }
}

document.getElementById('eoBgUpload')?.addEventListener('change', async function() {
  if (!this.files || !this.files.length) return;

  const progressWrap  = document.getElementById('eoBgUploadProgress');
  const progressBar   = document.getElementById('eoBgUploadBar');
  const progressPct   = document.getElementById('eoBgUploadPercent');
  const successBadge  = document.getElementById('eoBgUploadSuccess');
  const failedBadge   = document.getElementById('eoBgUploadFailed');
  const failedMsg     = document.getElementById('eoBgUploadFailedMsg');
  const previewImg    = document.getElementById('eoBgPreviewImg');
  const bgInput       = document.getElementById('eoBackgroundImage');

  progressWrap.classList.remove('d-none');
  successBadge.classList.add('d-none');
  failedBadge.classList.add('d-none');
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
    failedMsg.textContent = 'Upload failed: ' + err.message;
    failedBadge.classList.remove('d-none');
  } finally {
    this.value = '';
  }
});

async function saveEssentialOilsContent() {
  try {
    const eoData = {
      title: document.getElementById('eoTitle').value,
      subtitle: document.getElementById('eoSubtitle').value,
      description: document.getElementById('eoDescription').value,
      text: document.getElementById('eoText').value,
      background_image: document.getElementById('eoBackgroundImage').value || 'images/estate_bg.png',
      sample_button: document.getElementById('eoSampleBtn').value,
      tech_button: document.getElementById('eoTechBtn').value,
      leaf: {
        title: document.getElementById('eoLeafTitle').value,
        subtitle: document.getElementById('eoLeafSubtitle').value,
        description: document.getElementById('eoLeafDescription').value,
        features: document.getElementById('eoLeafFeatures').value,
        constituents: document.getElementById('eoLeafConstituents').value,
        applications: document.getElementById('eoLeafApplications').value
      },
      bark: {
        title: document.getElementById('eoBarkTitle').value,
        subtitle: document.getElementById('eoBarkSubtitle').value,
        description: document.getElementById('eoBarkDescription').value,
        features: document.getElementById('eoBarkFeatures').value,
        constituents: document.getElementById('eoBarkConstituents').value,
        applications: document.getElementById('eoBarkApplications').value
      },
      aroma: {
        leaf_title: document.getElementById('eoLeafAromaTitle').value,
        leaf_description: document.getElementById('eoLeafAromaDescription').value,
        bark_title: document.getElementById('eoBarkAromaTitle').value,
        bark_description: document.getElementById('eoBarkAromaDescription').value,
        leaf_notes: document.getElementById('eoLeafAromaNotes').value,
        bark_notes: document.getElementById('eoBarkAromaNotes').value
      },
      footer: document.getElementById('eoFooter').value
    };

    await saveContentFields('essential_oils', eoData);
    showAdminToast('Essential Oils content saved successfully!', 'success');
  } catch (err) {
    console.error('Save Essential Oils content error:', err);
    showAdminToast('Failed to save Essential Oils content: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function saveEssentialOilsFooter() {
  try {
    const content = await getContent();
    const eoData = content?.essential_oils || {};
    eoData.footer = document.getElementById('eoFooter').value;
    
    await saveContentFields('essential_oils', eoData);
    showAdminToast('Footer statement saved successfully!', 'success');
  } catch (err) {
    console.error('Save Essential Oils footer error:', err);
    showAdminToast('Failed to save footer statement: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function saveEssentialOilsEmailConfig() {
  try {
    const config = {
      eo_recipient_email: document.getElementById('eoRecipientEmail').value,
      eo_emailjs_service_id: document.getElementById('eoEmailJSServiceId').value,
      eo_emailjs_template_id: document.getElementById('eoEmailJSTemplateId').value,
      eo_emailjs_public_key: document.getElementById('eoEmailJSPublicKey').value
    };

    // Save each setting individually
    for (const [key, value] of Object.entries(config)) {
      await saveSetting(key, value);
    }

    showAdminToast('Email configuration saved successfully!', 'success');
  } catch (err) {
    console.error('Save Essential Oils email config error:', err);
    showAdminToast('Failed to save email configuration: ' + (err.message || 'Unknown error'), 'error');
  }
}

// ============================================================
// CINNAMON EXPERIENCE MANAGEMENT
// ============================================================
async function loadExperienceSection() {
  try {
    const content = await getContent();
    const experienceData = content?.experience || {};

    // Load content fields
    document.getElementById('experienceSectionTitle').value = experienceData.title || 'Cinnamon Experience';
    document.getElementById('experienceSubtitle').value = experienceData.subtitle || 'Discover the Heart of Ceylon Cinnamon';
    document.getElementById('experienceDescription').value = experienceData.description || 'Step into our family estate in Galle and experience the authentic journey of Ceylon Cinnamon—from plantation to finished product.';
    const bgUrl = experienceData.background_image || 'images/estate_bg.png';
    document.getElementById('experienceBackgroundImage').value = bgUrl;
    document.getElementById('experienceBgPreviewImg').src = bgUrl;
    document.getElementById('experienceCtaTitle').value = experienceData.cta_title || 'Book Your Experience';
    document.getElementById('experienceCtaDescription').value = experienceData.cta_description || 'Discover the heritage, craftsmanship and flavours of authentic Ceylon Cinnamon.';
    document.getElementById('experienceButtonText').value = experienceData.button_text || 'Book a Visit';

    // Load experience items
    const experienceItems = experienceData.items || [
      { title: 'Guided Cinnamon Estate Walk', description: 'Explore our lush cinnamon estate and learn about traditional cultivation methods.', icon: 'leaf' },
      { title: 'Harvesting & Peeling Demonstration', description: 'Watch skilled artisans harvest and peel cinnamon using centuries-old techniques.', icon: 'cut' },
      { title: 'Hands-on Cinnamon Activity', description: 'Take part in interactive cinnamon preparation and quill-making activities.', icon: 'hands' },
      { title: 'Cinnamon Tea & Product Tasting', description: 'Enjoy premium cinnamon tea and sample our signature cinnamon products.', icon: 'mug-hot' },
      { title: 'Sri Lankan Spice & Food Experience', description: 'Experience authentic Sri Lankan spices and traditional local cuisine.', icon: 'utensils' },
      { title: 'Educational Visits', description: 'Special tours and educational programs for schools, universities and research groups.', icon: 'graduation-cap' },
      { title: 'Business Visits', description: 'Customized visits for importers, distributors and business partners.', icon: 'briefcase' },
      { title: 'Cinnamon Heritage Shop', description: 'Purchase authentic Ceylon cinnamon products directly from our estate.', icon: 'shopping-bag' },
      { title: 'Cinnamon Villa — Coming Soon', description: 'Stay immersed in the beauty of Sri Lanka with our upcoming Cinnamon Villa experience.', icon: 'home' }
    ];

    let itemsHtml = '';
    experienceItems.forEach((item, index) => {
      itemsHtml += `
        <div class="col-md-6 col-lg-4">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="flex-grow-1">
                  <input type="text" class="form-control form-control-sm mb-2" 
                    id="experienceTitle-${index}" value="${item.title || ''}" placeholder="Experience Title">
                  <input type="text" class="form-control form-control-sm mb-2" 
                    id="experienceIcon-${index}" value="${item.icon || 'leaf'}" placeholder="Icon (leaf, cut, etc.)">
                  <textarea class="form-control form-control-sm" rows="2" 
                    id="experienceDesc-${index}" placeholder="Description">${item.description || ''}</textarea>
                </div>
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="removeExperienceItem(${index})">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>`;
    });
    document.getElementById('experienceItemsList').innerHTML = itemsHtml;

  } catch (err) {
    console.error('Load Experience section error:', err);
    showAdminToast('Failed to load Experience section: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function addExperienceItem() {
  try {
    const experienceItemsList = document.getElementById('experienceItemsList');
    const index = experienceItemsList.children.length;
    
    const newExperienceHtml = `
      <div class="col-md-6 col-lg-4">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="flex-grow-1">
                <input type="text" class="form-control form-control-sm mb-2" 
                  id="experienceTitle-${index}" value="" placeholder="Experience Title">
                <input type="text" class="form-control form-control-sm mb-2" 
                  id="experienceIcon-${index}" value="leaf" placeholder="Icon (leaf, cut, etc.)">
                <textarea class="form-control form-control-sm" rows="2" 
                  id="experienceDesc-${index}" placeholder="Description"></textarea>
              </div>
              <button class="btn btn-sm btn-outline-danger ms-2" onclick="removeExperienceItem(${index})">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;
    
    experienceItemsList.insertAdjacentHTML('beforeend', newExperienceHtml);
    showAdminToast('New experience item added!', 'success');
  } catch (err) {
    console.error('Add experience item error:', err);
    showAdminToast('Failed to add experience item: ' + (err.message || 'Unknown error'), 'error');
  }
}

function removeExperienceItem(index) {
  if (!confirm('Are you sure you want to remove this experience item?')) return;
  const experienceItemsList = document.getElementById('experienceItemsList');
  if (experienceItemsList.children[index]) {
    experienceItemsList.children[index].remove();
    showAdminToast('Experience item removed!', 'success');
  }
}

document.getElementById('experienceBgUpload')?.addEventListener('change', async function() {
  if (!this.files || !this.files.length) return;

  const progressWrap  = document.getElementById('experienceBgUploadProgress');
  const progressBar   = document.getElementById('experienceBgUploadBar');
  const progressPct   = document.getElementById('experienceBgUploadPercent');
  const successBadge  = document.getElementById('experienceBgUploadSuccess');
  const failedBadge   = document.getElementById('experienceBgUploadFailed');
  const failedMsg     = document.getElementById('experienceBgUploadFailedMsg');
  const previewImg    = document.getElementById('experienceBgPreviewImg');
  const bgInput       = document.getElementById('experienceBackgroundImage');

  progressWrap.classList.remove('d-none');
  successBadge.classList.add('d-none');
  failedBadge.classList.add('d-none');
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
    failedMsg.textContent = 'Upload failed: ' + err.message;
    failedBadge.classList.remove('d-none');
  } finally {
    this.value = '';
  }
});

async function saveExperienceContent() {
  try {
    // Collect experience items
    const experienceItems = [];
    const experienceItemsList = document.getElementById('experienceItemsList');
    Array.from(experienceItemsList.children).forEach((col, index) => {
      const title = document.getElementById(`experienceTitle-${index}`)?.value || '';
      const icon = document.getElementById(`experienceIcon-${index}`)?.value || 'leaf';
      const description = document.getElementById(`experienceDesc-${index}`)?.value || '';
      if (title) {
        experienceItems.push({ title, icon, description });
      }
    });

    // Collect content fields
    const experienceData = {
      title: document.getElementById('experienceSectionTitle').value,
      subtitle: document.getElementById('experienceSubtitle').value,
      description: document.getElementById('experienceDescription').value,
      background_image: document.getElementById('experienceBackgroundImage').value || 'images/estate_bg.png',
      cta_title: document.getElementById('experienceCtaTitle').value,
      cta_description: document.getElementById('experienceCtaDescription').value,
      button_text: document.getElementById('experienceButtonText').value,
      items: experienceItems
    };

    await saveContentFields('experience', experienceData);
    showAdminToast('Experience content saved successfully!', 'success');
  } catch (err) {
    console.error('Save Experience content error:', err);
    showAdminToast('Failed to save Experience content: ' + (err.message || 'Unknown error'), 'error');
  }
}


