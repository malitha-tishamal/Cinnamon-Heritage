// ============================================================
// main.js — Supabase Edition
// All fetch('/api/...') calls replaced with Supabase helpers
// ============================================================

// EmailJS config (optional — keep if you use it)
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';

(function() {
  if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
})();

// ============================================================
// IMMEDIATE DATA LOADING — fires before DOMContentLoaded
// Using Supabase helpers from supabase.js
// ============================================================
// Caching wrapper for instant loads
async function fetchWithCache(key, fetcher, fallback) {
  const cached = sessionStorage.getItem(key);
  let initialData = fallback;
  if (cached) {
    try { initialData = JSON.parse(cached); } catch(e){}
  }
  
  // Always fetch fresh data in background to update cache for next time
  const promise = fetcher().then(data => {
    if (data) sessionStorage.setItem(key, JSON.stringify(data));
    return data;
  }).catch(() => fallback);

  // If we had cached data, return it immediately, otherwise wait for network
  return cached ? initialData : promise;
}

const dataPromises = {
  content:       fetchWithCache('cache_content', getContent, null),
  products:      fetchWithCache('cache_products', getProducts, []),
  settings:      fetchWithCache('cache_settings', getSettings, {}),
  deliveryRates: fetchWithCache('cache_delivery_rates', getDeliveryRates, []),
  processSteps:  fetchWithCache('cache_process_steps', getProcessSteps, [])
};

// Fallback content if Supabase is slow or unavailable
const FALLBACK = {
  hero: {
    title: 'Pure Ceylon Cinnamon',
    subtitle: 'From our family estate in Galle to your table — authentic, sustainable, exceptional.',
    cta_text: 'Discover Our Story',
    background_image: 'images/cinnamon_spices.jpg'
  }
};

const DEFAULT_HERO_BG = 'images/cinnamon_spices.jpg';

// ============================================================
// Apply hero content & background
// ============================================================
function applyHeroBackground(content) {
  const heroSection = document.getElementById('hero-section');
  if (!heroSection) return;

  const hero = (content && content.hero) ? content.hero : FALLBACK.hero;
  const bgUrl = hero.background_image || DEFAULT_HERO_BG;
  heroSection.style.background = `linear-gradient(rgba(10,10,15,0.55), rgba(10,10,15,0.7)), url('${bgUrl}')`;
  heroSection.style.backgroundSize = 'cover';
  heroSection.style.backgroundPosition = 'center';
  heroSection.style.backgroundAttachment = 'fixed';
  heroSection.classList.add('hero-bg-updated');
}
function applyHeroContent(content) {
  const heroTitle    = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const heroCta      = document.getElementById('hero-cta');
  const hero = (content && content.hero) ? content.hero : FALLBACK.hero;

  if (heroTitle) {
    heroTitle.textContent = hero.title || FALLBACK.hero.title;
    heroTitle.classList.add('hero-text-animate');
  }
  if (heroSubtitle) {
    heroSubtitle.textContent = hero.subtitle || FALLBACK.hero.subtitle;
    heroSubtitle.classList.add('hero-text-animate-delay');
  }
  if (heroCta) {
    heroCta.textContent = hero.cta_text || FALLBACK.hero.cta_text;
    heroCta.style.display = 'inline-block';
    heroCta.classList.add('hero-cta-animate');
  }

  applyHeroBackground(content);
}

function applyAboutContent(content) {
  const aboutTitle = document.getElementById('about-title');
  const aboutTextContainer = document.getElementById('about-text-container');
  const aboutSection = document.getElementById('heritage');

  if (!content || !content.about) return;

  const about = content.about;
  if (aboutTitle && about.title) {
    aboutTitle.textContent = about.title;
  }

  if (aboutTextContainer && about.text) {
    const paragraphs = about.text.split('\n\n').filter(p => p.trim());
    aboutTextContainer.innerHTML = paragraphs.map((p, idx) => {
      const cls = idx === 0 ? 'lead mb-0' : 'mt-3';
      const colorStyle = idx === 0 ? '' : 'color: #e0e0e0 !important; font-size: 1.05rem;';
      return `<p class="${cls}" style="${colorStyle}">${p}</p>`;
    }).join('');
  }

  if (aboutSection && about.background_image) {
    aboutSection.style.backgroundImage = `url('${about.background_image}')`;
    aboutSection.style.backgroundSize = 'cover';
    aboutSection.style.backgroundPosition = 'center';
    aboutSection.style.backgroundAttachment = 'fixed';
  }
}

function applyFactoryContent(content) {
  if (!content || !content.factory) return;
  const factory = content.factory;

  const factoryTitle = document.getElementById('factory-title');
  const factoryTextContainer = document.getElementById('factory-text-container');
  const factorySection = document.getElementById('factory');
  const factoryImage = document.getElementById('factory-image');

  if (factoryTitle && factory.title) {
    factoryTitle.textContent = factory.title;
  }
  if (factoryTextContainer && factory.text) {
    const paragraphs = factory.text.split('\n\n').filter(p => p.trim());
    factoryTextContainer.innerHTML = paragraphs.map((p, idx) => {
      const cls = idx === 0 ? 'lead mb-0' : 'mt-3';
      const colorStyle = idx === 0 ? '' : 'color: #e0e0e0 !important; font-size: 1.05rem;';
      return `<p class="${cls}" style="${colorStyle}">${p}</p>`;
    }).join('');
  }
  if (factorySection && factory.background_image) {
    factorySection.style.backgroundImage = `url('${factory.background_image}')`;
    factorySection.style.backgroundSize = 'cover';
    factorySection.style.backgroundPosition = 'center';
    factorySection.style.backgroundAttachment = 'fixed';
  }
  if (factoryImage && factory.image_url) {
    factoryImage.src = factory.image_url;
    factoryImage.alt = factory.title || 'Factory';
  }
}

function applyProcessContent(content) {
  if (!content || !content.process) return;
  const process = content.process;
  const processSection = document.getElementById('process');
  if (processSection && process.background_image) {
    processSection.style.backgroundImage = `url('${process.background_image}')`;
    processSection.style.backgroundSize = 'cover';
    processSection.style.backgroundPosition = 'center';
    processSection.style.backgroundAttachment = 'fixed';
  }
}

// ============================================================
// Sequential Multi-Product Promo Popup System
// ============================================================
let promoAlertInitialized = false;
let promoQueue = [];         // Array of discounted products to cycle through
let promoQueueIndex = 0;    // Current position in queue
let promoTimeout = null;    // Timeout handle for auto-advance

function initPromoAlert(products) {
  if (promoAlertInitialized) return;

  // Filter products that are configured as popups in DB, are active and in stock
  let popupProducts = products.filter(p => p.is_popup === true && p.is_active !== false && p.stock_quantity > 0);
  
  // Cap popup limit based on settings (default 5, max 10)
  let maxPopups = parseInt(siteSettings.max_popups) || 5;
  if (maxPopups > 10) maxPopups = 10;
  if (maxPopups < 1) maxPopups = 5;

  if (popupProducts.length === 0) {
    // Fallback to discounted products if none are explicitly marked as popup
    popupProducts = products.filter(p => parseFloat(p.discount) > 0 && p.stock_quantity > 0);
  }

  // Slice queue to max limit
  promoQueue = popupProducts.slice(0, maxPopups);
  promoQueueIndex = 0;

  const promoAlert   = document.getElementById('promoAlert');
  if (!promoAlert || promoQueue.length === 0) return;

  // Show a specific product promo in the popup
  function showPromoForProduct(product) {
    const displayPrice = parseFloat(product.price);
    const oldPrice     = displayPrice + parseFloat(product.discount || 0);
    const pct          = oldPrice > 0 ? Math.round((parseFloat(product.discount || 0) / oldPrice) * 100) : 0;

    // Build the popup HTML with image + text
    promoAlert.innerHTML = `
      <div class="promo-alert-header">
        <span><i class="fa-solid fa-fire text-danger me-1"></i> SPECIAL OFFER</span>
        <div class="d-flex align-items-center gap-2">
          <span class="promo-counter">${promoQueueIndex + 1}/${promoQueue.length}</span>
          <button class="promo-close-btn" id="closePromoBtn">&times;</button>
        </div>
      </div>
      <div class="promo-alert-body">
        <div class="promo-product-img">
          <img src="${product.image_url}" alt="${product.title}">
        </div>
        <div class="promo-product-info">
          <div class="promo-alert-title mb-1 fw-bold text-white text-truncate">${product.title}</div>
          <p class="small text-white-50 mb-0 text-truncate-2" style="font-size:0.75rem; line-height:1.3; max-height: 2.6em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal;">${product.short_desc}</p>
          <div class="promo-prices">
            <span class="promo-new-price">LKR ${displayPrice.toLocaleString()}</span>
            <span class="promo-old-price">LKR ${oldPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <button class="promo-alert-btn w-100 mt-2" id="claimPromoBtn">Add to Cart</button>
    `;

    // Re-bind claim button
    document.getElementById('claimPromoBtn').onclick = (e) => {
      e.stopPropagation();
      clearTimeout(promoTimeout);
      promoAlert.classList.remove('active');
      addToCart(product.id);
      
      // Advance to next product
      promoQueueIndex = (promoQueueIndex + 1) % promoQueue.length;
      promoTimeout = setTimeout(() => showAndActivate(), 8000);
    };

    // Re-bind close button — on close, show NEXT product after delay
    document.getElementById('closePromoBtn').onclick = (e) => {
      e.stopPropagation();
      clearTimeout(promoTimeout);
      promoAlert.classList.remove('active');
      // Advance to next product
      promoQueueIndex = (promoQueueIndex + 1) % promoQueue.length;
      if (promoQueueIndex !== 0 || promoQueue.length === 1) {
        // Show next popup after short pause (only cycle through once)
        if (promoQueueIndex > 0) {
          promoTimeout = setTimeout(() => showAndActivate(), 8000);
        }
      }
    };

    // Show the popup
    requestAnimationFrame(() => {
      requestAnimationFrame(() => promoAlert.classList.add('active'));
    });
  }

  function showAndActivate() {
    if (promoQueueIndex >= promoQueue.length) return;
    promoAlert.classList.remove('active');
    setTimeout(() => showPromoForProduct(promoQueue[promoQueueIndex]), 350);
  }

  // Initial show after 3 seconds
  promoTimeout = setTimeout(() => showAndActivate(), 3000);
  promoAlertInitialized = true;
}

// ============================================================
// Render Products
// ============================================================
function renderProducts(products) {
  const productsRow = document.getElementById('productsRow');
  if (!productsRow) return;

  if (!products || products.length === 0) {
    productsRow.innerHTML = '<div class="col-12 text-center"><p class="text-secondary">No products available.</p></div>';
    return;
  }

  productsRow.innerHTML = '';
  products.forEach((p, i) => {
    const isContactCard = p.card_type === 'contact';
    const hasDiscount  = p.discount > 0;
    const displayPrice = parseFloat(p.price);
    const oldPrice     = displayPrice + (parseFloat(p.discount) || 0);
    const isLowStock   = p.stock_quantity > 0 && p.stock_quantity <= 10;
    const isOutOfStock = p.stock_quantity <= 0;
    const isTopSeller  = p.total_sales >= 50;

    // Calculate dynamic discount percentage
    const discountPct = oldPrice > 0 ? Math.round((parseFloat(p.discount) / oldPrice) * 100) : 0;
    const discountLabel = discountPct > 0 ? `${discountPct}% OFF` : `LKR ${parseFloat(p.discount).toLocaleString()} OFF`;

    const col = document.createElement('div');
    col.className = 'col-lg-3 col-md-6';
    col.style.cssText = `opacity:0;transform:translateY(30px);transition:opacity 0.5s cubic-bezier(0.23, 1, 0.32, 1) ${i * 0.1}s,transform 0.5s cubic-bezier(0.23, 1, 0.32, 1) ${i * 0.1}s`;

    if (isContactCard) {
      // Render special Contact Us card
      col.innerHTML = `
        <div class="card h-100 product-card product-card-contact"
             data-id="${p.id}" data-title="${p.title}" data-img="${p.image_url}"
             data-desc="${p.short_desc}" data-price="0"
             data-discount="0" data-stock="999">
          <div class="contact-card-icon">
            <div class="contact-icon-bg"></div>
            <i class="fas fa-handshake"></i>
          </div>
          <div class="card-body d-flex flex-column p-4">
            <div class="mb-2">
              <span class="contact-card-badge">B2B Partner</span>
            </div>
            <h3 class="card-title fs-5 mb-2" style="font-family:'Oswald',sans-serif;">${p.title}</h3>
            <p class="card-text small flex-grow-1" style="color:var(--text-secondary);">${p.short_desc}</p>
            <div class="mt-3">
              <a href="#contact" class="btn contact-us-btn fw-bold w-100 text-uppercase">
                <i class="fas fa-envelope me-2"></i>Contact Us
              </a>
            </div>
          </div>
        </div>`;
    } else {
      // Render standard product card
      col.innerHTML = `
        <div class="card h-100 product-card ${isOutOfStock ? 'opacity-75' : ''}"
             data-id="${p.id}" data-title="${p.title}" data-img="${p.image_url}"
             data-desc="${p.short_desc}" data-price="${p.price}"
             data-discount="${p.discount}" data-stock="${p.stock_quantity}">
          <div class="overflow-hidden" style="height:200px;position:relative;">
            ${hasDiscount  ? `<span class="discount-badge position-absolute top-0 end-0 m-2" style="z-index:1;">${discountLabel}</span>` : ''}
            ${isTopSeller  ? `<span class="topseller-badge position-absolute top-0 start-0 m-2" style="z-index:1;">TOP SELLER</span>` : ''}
            <img src="${p.image_url}" alt="${p.title}" class="card-img-top h-100 w-100 object-fit-cover product-img" style="transition:transform 0.6s ease;">
          </div>
          <div class="card-body d-flex flex-column p-4">
            <div class="d-flex justify-content-between align-items-start mb-1">
              <h3 class="card-title fs-5 mb-0" style="font-family:'Oswald',sans-serif;">${p.title}</h3>
              <small style="font-size:0.7rem;color:var(--text-secondary);">${p.total_sales} Sold</small>
            </div>
            <div class="mb-2">
              <span class="fw-bold" style="color:var(--accent);">LKR ${displayPrice.toLocaleString()}</span>
              ${hasDiscount ? `<small class="text-decoration-line-through ms-1" style="color:var(--text-secondary);font-size:0.8rem;">LKR ${oldPrice.toLocaleString()}</small>` : ''}
            </div>
            <div class="mb-3">
              ${isOutOfStock ? '<span class="badge bg-secondary w-100" style="border-radius:6px;">OUT OF STOCK</span>' :
                isLowStock   ? `<span class="badge bg-warning text-dark w-100" style="border-radius:6px;">LOW STOCK: ${p.stock_quantity} LEFT</span>` :
                               `<small class="text-success" style="font-size:0.75rem;">✓ In Stock (${p.stock_quantity})</small>`}
            </div>
            <p class="card-text small flex-grow-1" style="color:var(--text-secondary);">${p.short_desc}</p>
            <div class="mt-3 d-flex gap-2">
              <span class="btn btn-outline-dark product-btn fw-bold flex-grow-1 text-uppercase" style="font-family:'Oswald',sans-serif;font-size:0.75rem;letter-spacing:1px;border-radius:8px;">Details</span>
              ${isOutOfStock ?
                '<button class="btn btn-secondary fw-bold flex-grow-1 text-uppercase disabled" style="font-family:\'Oswald\',sans-serif;font-size:0.75rem;border-radius:8px;">Sold Out</button>' :
                `<button class="btn add-to-cart-btn fw-bold flex-grow-1 text-uppercase" data-id="${p.id}" style="background:var(--accent);border:none;color:#fff;font-family:'Oswald',sans-serif;font-size:0.75rem;border-radius:8px;">Add to Cart</button>`}
            </div>
          </div>
        </div>`;
    }

    productsRow.appendChild(col);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      col.style.opacity = '1';
      col.style.transform = 'translateY(0)';
    }));
  });

  // Trigger dynamic promo alert for products with discounts
  initPromoAlert(products);
}

// ============================================================
// Render Process Steps
// ============================================================
function renderProcessSteps(steps) {
  const processRow = document.getElementById('processRow');
  if (!processRow) return;

  if (!steps || steps.length === 0) {
    processRow.innerHTML = '<div class="col-12 text-center"><p class="text-secondary">No process steps available.</p></div>';
    return;
  }

  processRow.innerHTML = '';
  steps.forEach((step, i) => {
    const col = document.createElement('div');
    col.className = 'col-xl-4 col-lg-4 col-md-6';
    col.style.cssText = `opacity:0;transform:translateY(30px);transition:opacity 0.5s cubic-bezier(0.23, 1, 0.32, 1) ${i * 0.1}s,transform 0.5s cubic-bezier(0.23, 1, 0.32, 1) ${i * 0.1}s`;

    col.innerHTML = `
      <div class="card h-100 rounded-0 border shadow-sm process-card" 
           data-num="${step.step_number}" data-title="${step.title}" data-img="${step.image_url}" data-desc="${step.full_desc || step.short_desc}">
        <div class="overflow-hidden" style="height: 180px;">
          <div class="card-img-top h-100 w-100 process-img" style="background-image: url('${step.image_url}'); background-size: cover; background-position: center; transition: transform 0.5s ease;"></div>
        </div>
        <div class="card-body d-flex flex-column p-4 border-top">
          <h3 class="card-title d-flex align-items-center gap-3 fs-4 mb-3" style="font-family: 'Oswald', sans-serif;">
            <span class="display-4 fw-bold text-muted lh-1 process-num" style="transition: color 0.3s ease;">${step.step_number}</span> ${step.title}
          </h3>
          <p class="card-text text-secondary flex-grow-1">${step.short_desc}</p>
          <span class="btn btn-outline-dark rounded-0 fw-bold mt-auto align-self-start text-uppercase process-btn" style="font-family: 'Oswald', sans-serif; font-size: 0.85rem; letter-spacing: 1px; transition: all 0.3s ease;">View Details &rarr;</span>
        </div>
      </div>`;

    processRow.appendChild(col);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      col.style.opacity = '1';
      col.style.transform = 'translateY(0)';
    }));
  });
}

// ============================================================
// Skeleton loaders
// ============================================================
function showSkeletons() {
  const productsRow = document.getElementById('productsRow');
  if (!productsRow) return;
  let html = '';
  for (let i = 0; i < 4; i++) {
    html += `<div class="col-lg-3 col-md-6">
      <div class="skeleton-card" style="border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);">
        <div class="skeleton skeleton-img"></div>
        <div style="padding:16px;">
          <div class="skeleton skeleton-text medium"></div>
          <div class="skeleton skeleton-text short"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short" style="margin-top:12px;height:36px;"></div>
        </div>
      </div>
    </div>`;
  }
  productsRow.innerHTML = html;
}

// ============================================================
// Apply settings (footer etc.)
// ============================================================
function applySettings(settings) {
  const map = {
    footer_about:   'footerAboutText',
    footer_address: 'footerAddress',
    footer_phone:   'footerPhone',
    footer_email:   'footerEmail'
  };
  for (const [key, elId] of Object.entries(map)) {
    if (settings[key]) {
      const el = document.getElementById(elId);
      if (el) el.textContent = settings[key];
    }
  }
  const socials = { social_facebook: 'socialFacebook', social_instagram: 'socialInstagram', social_twitter: 'socialTwitter' };
  for (const [key, elId] of Object.entries(socials)) {
    if (settings[key]) {
      const el = document.getElementById(elId);
      if (el) el.href = settings[key];
    }
  }
  
  // Announcement Bar
  const announcementBar = document.getElementById('announcementBar');
  if (announcementBar) {
    if (settings.announcement_enabled === '0') {
      announcementBar.style.display = 'none';
    } else {
      announcementBar.style.display = 'block';
      
      const aText = document.getElementById('announcementText');
      if (aText && settings.announcement_text) aText.textContent = settings.announcement_text;
      
      const btn1Text = document.getElementById('announcementBtn1Text');
      const btn1Link = document.getElementById('announcementBtn1');
      if (btn1Text && settings.announcement_btn1_text) btn1Text.textContent = settings.announcement_btn1_text;
      if (btn1Link && settings.announcement_btn1_link) btn1Link.href = settings.announcement_btn1_link;
      
      const btn2Text = document.getElementById('announcementBtn2Text');
      const btn2Link = document.getElementById('announcementBtn2');
      if (btn2Text && settings.announcement_btn2_text) btn2Text.textContent = settings.announcement_btn2_text;
      if (btn2Link && settings.announcement_btn2_link) btn2Link.href = settings.announcement_btn2_link;
    }
  }
}

// ============================================================
// DOM Ready
// ============================================================
let deliveryRates = [];

function setupSignupLocationSelectors() {
  const provinceSelect = document.getElementById('signupProvince');
  const districtSelect = document.getElementById('signupCity');
  
  if (!provinceSelect || !districtSelect) return;
  if (!deliveryRates || !deliveryRates.length) return; // rates not loaded yet

  // Repopulate provinces
  const currentProvince = provinceSelect.value;
  provinceSelect.innerHTML = '<option value="">Select Province</option>';
  districtSelect.innerHTML = '<option value="">Select District</option>';
  districtSelect.disabled = true;

  const provinces = [...new Set(deliveryRates.map(r => r.province))].filter(Boolean);
  provinces.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    provinceSelect.appendChild(opt);
  });
  if (currentProvince) provinceSelect.value = currentProvince;

  // Replace listener to avoid duplicates
  const newProvince = provinceSelect.cloneNode(true);
  provinceSelect.parentNode.replaceChild(newProvince, provinceSelect);

  document.getElementById('signupProvince').addEventListener('change', () => {
    const province = document.getElementById('signupProvince').value;
    const city = document.getElementById('signupCity');
    city.innerHTML = '<option value="">Select District</option>';
    city.disabled = !province;
    if (province) {
      deliveryRates.filter(r => r.province === province).forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.district;
        opt.textContent = d.district;
        city.appendChild(opt);
      });
    }
  });
}

function setupProfileLocationSelectors() {
  const provinceSelect = document.getElementById('profileProvince');
  const districtSelect = document.getElementById('profileCity');
  
  if (!provinceSelect || !districtSelect) return;
  if (!deliveryRates || !deliveryRates.length) return;

  const currentProvince = provinceSelect.value;
  provinceSelect.innerHTML = '<option value="">Select Province</option>';
  districtSelect.innerHTML = '<option value="">Select District</option>';
  districtSelect.disabled = true;

  const provinces = [...new Set(deliveryRates.map(r => r.province))].filter(Boolean);
  provinces.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    provinceSelect.appendChild(opt);
  });
  if (currentProvince) provinceSelect.value = currentProvince;

  // Replace listener to avoid duplicates
  const newProvince = provinceSelect.cloneNode(true);
  provinceSelect.parentNode.replaceChild(newProvince, provinceSelect);

  document.getElementById('profileProvince').addEventListener('change', () => {
    const province = document.getElementById('profileProvince').value;
    const city = document.getElementById('profileCity');
    city.innerHTML = '<option value="">Select District</option>';
    city.disabled = !province;
    if (province) {
      deliveryRates.filter(r => r.province === province).forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.district;
        opt.textContent = d.district;
        city.appendChild(opt);
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  showSkeletons();

  const [content, products, settings, rates, steps] = await Promise.all([
    dataPromises.content,
    dataPromises.products,
    dataPromises.settings,
    dataPromises.deliveryRates,
    dataPromises.processSteps
  ]);

  allProducts = products;
  siteSettings = settings;
  deliveryRates = rates || [];

  applyHeroContent(content);
  applyAboutContent(content);
  applyFactoryContent(content);
  applyProcessContent(content);
  applySettings(settings);
  renderProducts(products);
  renderProcessSteps(steps);
  
  setupSignupLocationSelectors();
  setupProfileLocationSelectors();

  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('hidden');
    setTimeout(() => preloader.remove(), 600);
  }

  // Check auth session
  await checkAuthStatus();
  // Setup drawer and modal UI listeners
  initCartAndAuthListeners();
  initNavDrawer();

  initScrollAnimations();
  initRealtimeUpdates();
});

// ============================================================
// Real-time Firestore listeners — site updates instantly
// ============================================================
function initRealtimeUpdates() {
  if (typeof subscribeToContent !== 'function') return;

  subscribeToContent(content => {
    applyHeroContent(content);
    applyAboutContent(content);
    applyFactoryContent(content);
    applyProcessContent(content);
  });

  subscribeToProducts(products => {
    renderProducts(products);
  });

  subscribeToSettings(settings => {
    applySettings(settings);
  });

  if (typeof subscribeToProcessSteps === 'function') {
    subscribeToProcessSteps(steps => {
      renderProcessSteps(steps);
    });
  }
}

// ============================================================
// Modal — Process & Product click handler (unchanged)
// ============================================================
const modal     = document.getElementById('processModal');
const closeModal = document.getElementById('closeModal');
const modalImg   = document.getElementById('modalImg');
const modalNum   = document.getElementById('modalNum');
const modalTitle = document.getElementById('modalTitle');
const modalDesc  = document.getElementById('modalDesc');

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('add-to-cart-btn')) {
    e.preventDefault();
    e.stopPropagation();
    const productId = e.target.getAttribute('data-id');
    addToCart(productId);
    return;
  }

  const card = e.target.closest('.process-card, .product-card');
  if (!card) return;
  
  // If user clicks anything inside product card but targeted add-to-cart-btn, ignore details modal
  if (e.target.closest('.add-to-cart-btn')) return;

  e.preventDefault();
  e.stopPropagation();

  const title     = card.getAttribute('data-title');
  const desc      = card.getAttribute('data-desc');
  const img       = card.getAttribute('data-img');
  const num       = card.getAttribute('data-num');
  const isProduct = card.classList.contains('product-card');
  const productId = card.getAttribute('data-id');
  const price     = card.getAttribute('data-price');
  const discount  = card.getAttribute('data-discount');
  const stock     = card.getAttribute('data-stock');

  modalTitle.textContent = title;
  modalDesc.textContent  = desc;

  if (num) { modalNum.textContent = num; modalNum.style.display = 'block'; }
  else { modalNum.style.display = 'none'; }

  const priceContainer  = document.getElementById('modalPriceContainer');
  const stockContainer  = document.getElementById('modalStockContainer');
  const actionContainer = document.getElementById('modalActionContainer');
  const buyBtn          = document.getElementById('modalBuyBtn');

  if (isProduct && price) {
    priceContainer.classList.remove('d-none');
    stockContainer.classList.remove('d-none');
    actionContainer.classList.remove('d-none');
    const currentPrice = parseFloat(price);
    const discAmt      = parseFloat(discount || 0);
    document.getElementById('modalPrice').textContent = `LKR ${currentPrice.toLocaleString()}`;
    if (discAmt > 0) {
      document.getElementById('modalOldPrice').textContent = `LKR ${(currentPrice + discAmt).toLocaleString()}`;
      document.getElementById('modalOldPrice').classList.remove('d-none');
    } else {
      document.getElementById('modalOldPrice').classList.add('d-none');
    }
    document.getElementById('modalStock').textContent = stock || '0';
    buyBtn.onclick = () => window.location.href = `checkout.html?product_id=${productId}`;
  } else {
    priceContainer.classList.add('d-none');
    stockContainer.classList.add('d-none');
    actionContainer.classList.add('d-none');
  }

  modalImg.style.backgroundImage = `url('${img}')`;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
});

closeModal.addEventListener('click', function(e) {
  e.stopPropagation();
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
});

modal.addEventListener('click', function(e) {
  if (e.target === modal || e.target.classList.contains('modal-overlay')) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && modal.classList.contains('active')) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
});

// ============================================================
// Contact Form — now uses Supabase submitContact()
// ============================================================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!contactForm.checkValidity()) { contactForm.classList.add('was-validated'); return; }

    const submitBtn = document.getElementById('contactSubmitBtn');
    const btnText   = document.getElementById('submitBtnText');
    const spinner   = document.getElementById('submitBtnSpinner');
    submitBtn.disabled = true;
    btnText.textContent = 'Sending...';
    spinner.classList.remove('d-none');

    const formData = {
      from_name:  document.getElementById('contactName').value,
      from_email: document.getElementById('contactEmail').value,
      phone:      document.getElementById('contactPhone').value || 'Not provided',
      subject:    document.getElementById('contactSubject').value || 'General Enquiry',
      message:    document.getElementById('contactMessage').value
    };

    // Try EmailJS first (if configured), then Supabase
    if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, formData)
        .then(() => { showToast('Message sent successfully!', 'success'); contactForm.reset(); contactForm.classList.remove('was-validated'); })
        .catch(() => { showToast('Failed to send. Please try again.', 'error'); })
        .finally(() => { submitBtn.disabled = false; btnText.textContent = 'Send Message'; spinner.classList.add('d-none'); });
    } else {
      // *** SUPABASE: replaces fetch('/api/contact', ...) ***
      try {
        await submitContact(formData);
        showToast('Message sent successfully!', 'success');
        contactForm.reset();
        contactForm.classList.remove('was-validated');
      } catch (err) {
        showToast('Thank you! Message received.', 'success');
        contactForm.reset();
        contactForm.classList.remove('was-validated');
      } finally {
        submitBtn.disabled = false;
        btnText.textContent = 'Send Message';
        spinner.classList.add('d-none');
      }
    }
  });
}

// ============================================================
// Toast
// ============================================================
function showToast(message, type) {
  const toastEl  = document.getElementById('contactToast');
  const toastMsg = document.getElementById('toastMessage');
  toastMsg.textContent = message;
  toastEl.classList.remove('bg-success', 'bg-danger', 'text-white');
  toastEl.classList.add(type === 'success' ? 'bg-success' : 'bg-danger', 'text-white');
  new bootstrap.Toast(toastEl, { delay: 5000 }).show();
}

// ============================================================
// Smooth Scroll
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const navHeight = document.querySelector('.navbar').offsetHeight;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - navHeight, behavior: 'smooth' });
      closeNavDrawer();
    }
  });
});

// ============================================================
// Scroll Animations
// ============================================================
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children')
    .forEach(el => observer.observe(el));
}

// ============================================================
// Navbar scroll behaviour
// ============================================================
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    if (window.scrollY > 100) {
      navbar.style.background = 'rgba(10,10,15,0.95)';
      navbar.style.padding    = '10px 0';
    } else {
      navbar.style.background = 'rgba(0,0,0,0.3)';
      navbar.style.padding    = '20px 0';
    }
  }
});

// ============================================================
// SHOPPING CART & CLIENT AUTH SYSTEM
// ============================================================
let currentUser = null;
let currentCart = [];
let allProducts = [];
let siteSettings = {};

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a6a6a6'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

async function checkAuthStatus() {
  const status = await authStatus();
  const loginBtn = document.getElementById('navLoginBtn');
  const signupBtn = document.getElementById('navSignupBtn');
  const authButtons = document.getElementById('navAuthButtons');
  const profileMenu = document.getElementById('userProfileMenu');
  const loginBtnMobile = document.getElementById('navLoginBtnMobile');
  const signupBtnMobile = document.getElementById('navSignupBtnMobile');
  const authButtonsMobile = document.getElementById('navDrawerAuthButtons');
  const profileMenuMobile = document.getElementById('userProfileMenuMobile');
  
  if (status.isLoggedIn) {
    currentUser = status.profile;
    if (authButtons) authButtons.classList.add('d-none');
    if (profileMenu) profileMenu.classList.remove('d-none');
    if (authButtonsMobile) authButtonsMobile.classList.add('d-none');
    if (profileMenuMobile) profileMenuMobile.classList.remove('d-none');
    
    const navPic = document.getElementById('navProfilePic');
    const navName = document.getElementById('navUsername');
    const navPicMobile = document.getElementById('navProfilePicMobile');
    const navNameMobile = document.getElementById('navUsernameMobile');
    if (navPic) navPic.src = currentUser.profile_pic_url || DEFAULT_AVATAR;
    if (navName) navName.textContent = currentUser.first_name || currentUser.username;
    if (navPicMobile) navPicMobile.src = currentUser.profile_pic_url || DEFAULT_AVATAR;
    if (navNameMobile) navNameMobile.textContent = currentUser.first_name || currentUser.username;
    
    const adminPanelLink = document.getElementById('navAdminPanelLink');
    if (adminPanelLink) {
      if (currentUser.role === 'admin') {
        adminPanelLink.classList.remove('d-none');
      } else {
        adminPanelLink.classList.add('d-none');
      }
    }
    
    currentCart = await getCartItems(status.userId);
    updateCartUI();
  } else {
    currentUser = null;
    currentCart = [];
    if (authButtons) authButtons.classList.remove('d-none');
    if (profileMenu) profileMenu.classList.add('d-none');
    if (authButtonsMobile) authButtonsMobile.classList.remove('d-none');
    if (profileMenuMobile) profileMenuMobile.classList.add('d-none');
    updateCartUI();
  }
}

function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  const badgeMobile = document.getElementById('cartBadgeMobile');
  const drawerBody = document.getElementById('cartDrawerItems');
  
  const totalQty = currentCart.reduce((sum, item) => sum + item.quantity, 0);
  [badge, badgeMobile].forEach(el => {
    if (!el) return;
    if (totalQty > 0) {
      el.textContent = totalQty;
      el.classList.remove('d-none');
    } else {
      el.classList.add('d-none');
    }
  });
  
  if (!drawerBody) return;
  
  if (currentCart.length === 0) {
    drawerBody.innerHTML = `
      <div class="h-100 d-flex flex-column align-items-center justify-content-center text-center py-5">
        <i class="fas fa-shopping-basket fa-3x text-muted mb-3" style="color: rgba(255,255,255,0.2) !important;"></i>
        <h5 class="text-white">Your cart is empty</h5>
        <p class="text-white-50 small">Add premium cinnamon products to get started.</p>
      </div>`;
    updateCartTotals(0, 0);
    return;
  }
  
  let html = '';
  let subtotal = 0;
  let discountTotal = 0;
  
  currentCart.forEach(item => {
    // Find product details
    const product = allProducts.find(p => p.id === item.product_id);
    if (!product) return;
    
    const price = parseFloat(product.price);
    const discount = parseFloat(product.discount || 0);
    const itemSubtotal = price * item.quantity;
    const itemDiscount = discount * item.quantity;
    
    subtotal += itemSubtotal;
    discountTotal += itemDiscount;
    
    html += `
      <div class="cart-item" data-id="${item.product_id}">
        <div class="cart-item-img">
          <img src="${product.image_url}" alt="${product.title}">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-title">${product.title}</div>
          <div class="cart-item-price">LKR ${price.toLocaleString()}</div>
          <div class="cart-item-actions">
            <div class="cart-qty-ctrl">
              <button class="cart-qty-btn" onclick="changeCartQty('${item.product_id}', -1)">-</button>
              <div class="cart-qty-val">${item.quantity}</div>
              <button class="cart-qty-btn" onclick="changeCartQty('${item.product_id}', 1)">+</button>
            </div>
            <button class="cart-remove-btn" onclick="removeFromCart('${item.product_id}')">
              <i class="fas fa-trash-alt me-1"></i> Remove
            </button>
          </div>
        </div>
      </div>`;
  });
  
  drawerBody.innerHTML = html;
  updateCartTotals(subtotal, discountTotal);
}

function updateCartTotals(subtotal, discountTotal) {
  const total = subtotal - discountTotal;
  document.getElementById('cartSubtotal').textContent = `LKR ${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
  document.getElementById('cartDiscount').textContent = `- LKR ${discountTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
  document.getElementById('cartTotal').textContent = `LKR ${total.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

async function changeCartQty(productId, delta) {
  if (!currentUser) return;
  const item = currentCart.find(i => i.product_id === productId);
  if (!item) return;
  
  // Find product stock
  const product = allProducts.find(p => p.id === productId);
  const maxStock = product ? (product.stock_quantity ?? 0) : 0;
  
  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    await removeFromCart(productId);
    return;
  }
  
  if (newQty > maxStock) {
    showToast(`Cannot exceed available stock of ${maxStock}!`, 'error');
    return;
  }
  
  item.quantity = newQty;
  updateCartUI();
  await saveCartItems(currentUser.id, currentCart);
}

async function removeFromCart(productId) {
  if (!currentUser) return;
  currentCart = currentCart.filter(i => i.product_id !== productId);
  updateCartUI();
  await saveCartItems(currentUser.id, currentCart);
  showToast("Product removed from cart", "success");
}

async function addToCart(productId) {
  if (!currentUser) {
    openAuthModal('login');
    showToast("Please log in to add products to cart.", "error");
    return;
  }
  
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  if (product.stock_quantity <= 0) {
    showToast("This product is out of stock!", "error");
    return;
  }
  
  const existing = currentCart.find(i => i.product_id === productId);
  if (existing) {
    if (existing.quantity >= product.stock_quantity) {
      showToast(`Cannot add more. Available stock is ${product.stock_quantity}!`, "error");
      return;
    }
    existing.quantity += 1;
  } else {
    currentCart.push({
      product_id: productId,
      quantity: 1
    });
  }
  
  updateCartUI();
  await saveCartItems(currentUser.id, currentCart);
  showToast(`${product.title} added to cart!`, "success");
  
  // Open Cart Drawer
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
}

// Expose functions globally for dynamic elements
window.changeCartQty = changeCartQty;
window.removeFromCart = removeFromCart;
window.addToCart = addToCart;

function openAuthModal(tab) {
  const authModal = document.getElementById('authModal');
  const toggleLoginTab = document.getElementById('toggleLoginTab');
  const toggleSignupTab = document.getElementById('toggleSignupTab');
  const loginTab = document.getElementById('authLoginTab');
  const signupTab = document.getElementById('authSignupTab');

  if (tab === 'signup') {
    toggleLoginTab?.classList.remove('active');
    toggleSignupTab?.classList.add('active');
    loginTab?.classList.add('d-none');
    signupTab?.classList.remove('d-none');
    setupSignupLocationSelectors();
  } else {
    toggleSignupTab?.classList.remove('active');
    toggleLoginTab?.classList.add('active');
    signupTab?.classList.add('d-none');
    loginTab?.classList.remove('d-none');
  }

  new bootstrap.Modal(authModal).show();
}

function openCartDrawer() {
  if (!currentUser) {
    openAuthModal('login');
    showToast("Please log in to view your cart.", "error");
    return;
  }
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
}

// ============================================================
// Mobile Nav Drawer
// ============================================================
function openNavDrawer() {
  const drawer = document.getElementById('navDrawer');
  const overlay = document.getElementById('navDrawerOverlay');
  const toggle = document.getElementById('navDrawerToggle');
  if (!drawer || !overlay) return;
  drawer.classList.add('open');
  overlay.classList.add('open');
  toggle?.classList.add('active');
  toggle?.setAttribute('aria-expanded', 'true');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('nav-drawer-open');
}

function closeNavDrawer() {
  const drawer = document.getElementById('navDrawer');
  const overlay = document.getElementById('navDrawerOverlay');
  const toggle = document.getElementById('navDrawerToggle');
  if (!drawer || !overlay) return;
  drawer.classList.remove('open');
  overlay.classList.remove('open');
  toggle?.classList.remove('active');
  toggle?.setAttribute('aria-expanded', 'false');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('nav-drawer-open');
}

function initNavDrawer() {
  const toggle = document.getElementById('navDrawerToggle');
  const closeBtn = document.getElementById('navDrawerClose');
  const overlay = document.getElementById('navDrawerOverlay');
  const drawer = document.getElementById('navDrawer');
  if (!toggle || !drawer) return;

  toggle.addEventListener('click', () => {
    if (drawer.classList.contains('open')) closeNavDrawer();
    else openNavDrawer();
  });
  closeBtn?.addEventListener('click', closeNavDrawer);
  overlay?.addEventListener('click', closeNavDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeNavDrawer();
  });
}

function initCartAndAuthListeners() {
  const cartBtn = document.getElementById('cartBtn');
  const cartBtnMobile = document.getElementById('cartBtnMobile');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  
  if (cartBtn) {
    cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  }

  if (cartBtnMobile) {
    cartBtnMobile.addEventListener('click', (e) => {
      e.preventDefault();
      closeNavDrawer();
      openCartDrawer();
    });
  }
  
  if (closeCartBtn) {
    closeCartBtn.addEventListener('click', () => {
      cartDrawer.classList.remove('open');
      cartOverlay.classList.remove('open');
    });
  }
  
  if (cartOverlay) {
    cartOverlay.addEventListener('click', () => {
      cartDrawer.classList.remove('remove');
      cartDrawer.classList.remove('open');
      cartOverlay.classList.remove('open');
    });
  }

  // Auth Tabs Toggle
  const toggleLoginTab = document.getElementById('toggleLoginTab');
  const toggleSignupTab = document.getElementById('toggleSignupTab');
  const loginTab = document.getElementById('authLoginTab');
  const signupTab = document.getElementById('authSignupTab');

  if (toggleLoginTab && toggleSignupTab) {
    toggleLoginTab.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSignupTab.classList.remove('active');
      toggleLoginTab.classList.add('active');
      signupTab.classList.add('d-none');
      loginTab.classList.remove('d-none');
    });

    toggleSignupTab.addEventListener('click', (e) => {
      e.preventDefault();
      toggleLoginTab.classList.remove('active');
      toggleSignupTab.classList.add('active');
      loginTab.classList.add('d-none');
      signupTab.classList.remove('d-none');
      // Ensure province/district dropdowns are populated each time signup tab opens
      setupSignupLocationSelectors();
    });
  }

  // Navigation login / signup buttons
  ['navLoginBtn', 'navLoginBtnMobile'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        closeNavDrawer();
        openAuthModal('login');
      });
    }
  });

  ['navSignupBtn', 'navSignupBtnMobile'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        closeNavDrawer();
        openAuthModal('signup');
      });
    }
  });

  // Signup Image Upload to Cloudinary
  const signupPicInput = document.getElementById('signupPicInput');
  const signupPicPreview = document.getElementById('signupPicPreview');
  const signupPicUrl = document.getElementById('signupPicUrl');
  const picUploadSpinner = document.getElementById('picUploadSpinner');

  if (signupPicInput) {
    signupPicInput.addEventListener('change', async () => {
      const file = signupPicInput.files[0];
      if (!file) return;
      
      try {
        if (picUploadSpinner) picUploadSpinner.classList.remove('d-none');
        const url = await uploadImage(file);
        if (signupPicPreview) signupPicPreview.src = url;
        if (signupPicUrl) signupPicUrl.value = url;
        showToast("Profile photo uploaded!", "success");
      } catch (err) {
        showToast("Failed to upload image to Cloudinary", "error");
      } finally {
        if (picUploadSpinner) picUploadSpinner.classList.add('d-none');
      }
    });
  }

  // Submit Client Login Form
  const clientLoginForm = document.getElementById('clientLoginForm');
  const clientLoginError = document.getElementById('clientLoginError');
  if (clientLoginForm) {
    clientLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (clientLoginError) clientLoginError.classList.add('d-none');

      const email = document.getElementById('clientLoginEmail').value.trim();
      const password = document.getElementById('clientLoginPassword').value;

      const res = await authLogin(email, password);
      if (res.success) {
        showToast("Logged in successfully!", "success");
        // Hide modal
        bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
        clientLoginForm.reset();
        await checkAuthStatus();
      } else {
        if (clientLoginError) {
          clientLoginError.textContent = res.error || "Login failed";
          clientLoginError.classList.remove('d-none');
        }
      }
    });
  }

  // Submit Client Signup Form
  const clientSignupForm = document.getElementById('clientSignupForm');
  const clientSignupError = document.getElementById('clientSignupError');
  if (clientSignupForm) {
    // Dynamic fields toggling based on Register As selection
    const roleRadios = document.querySelectorAll('input[name="signupRole"]');
    roleRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const role = e.target.value;
        const picSection = document.getElementById('signupPicUploadSection');
        const nameRow = document.getElementById('signupNameRow');
        const mobileRow = document.getElementById('signupMobileRow');
        const locationRow = document.getElementById('signupLocationRow');
        const usernameInput = document.getElementById('signupUsername');
        const usernameGroup = usernameInput ? usernameInput.closest('.col-md-6, .mb-2') : null;

        if (role === 'admin') {
          // Admin: needs name + email + password only
          if (picSection) picSection.classList.add('d-none');
          if (mobileRow) mobileRow.classList.add('d-none');
          if (locationRow) locationRow.classList.add('d-none');
          if (nameRow) nameRow.classList.remove('d-none');

          document.getElementById('signupFirstName').required = true;
          document.getElementById('signupLastName').required = true;
          document.getElementById('signupMobile').required = false;
          document.getElementById('signupProvince').required = false;
          document.getElementById('signupCity').required = false;
          const nicEl = document.getElementById('signupNic');
          if (nicEl) { nicEl.required = false; nicEl.closest('.col-md-12, .row, div')?.classList?.add('d-none'); }
        } else {
          // Customer: all fields visible and required
          if (picSection) picSection.classList.remove('d-none');
          if (nameRow) nameRow.classList.remove('d-none');
          if (mobileRow) mobileRow.classList.remove('d-none');
          if (locationRow) locationRow.classList.remove('d-none');

          document.getElementById('signupFirstName').required = true;
          document.getElementById('signupLastName').required = true;
          document.getElementById('signupMobile').required = true;
          document.getElementById('signupProvince').required = true;
          document.getElementById('signupCity').required = true;
          const nicEl = document.getElementById('signupNic');
          if (nicEl) { nicEl.required = true; nicEl.closest('.col-md-12, .row, div')?.classList?.remove('d-none'); }
        }
      });
    });

    clientSignupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (clientSignupError) clientSignupError.classList.add('d-none');

      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('signupConfirmPassword').value;

      if (password !== confirmPassword) {
        if (clientSignupError) {
          clientSignupError.textContent = "Passwords do not match!";
          clientSignupError.classList.remove('d-none');
        }
        return;
      }

      const email = document.getElementById('signupEmail').value.trim();
      const role = document.querySelector('input[name="signupRole"]:checked')?.value || 'customer';
      const firstName = document.getElementById('signupFirstName').value.trim();
      const lastName  = document.getElementById('signupLastName').value.trim();
      // Auto-generate username from first + last name if not provided
      const usernameEl = document.getElementById('signupUsername');
      const username = usernameEl && usernameEl.value.trim()
        ? usernameEl.value.trim()
        : (firstName + lastName).toLowerCase().replace(/\s+/g, '') || email.split('@')[0];

      const extraData = {
        role: role,
        first_name: firstName,
        last_name: lastName,
        mobile: role === 'customer' ? document.getElementById('signupMobile').value.trim() : '',
        nic: document.getElementById('signupNic').value.trim(),
        city: role === 'customer' ? document.getElementById('signupCity').value.trim() : '',
        profile_pic_url: role === 'customer' ? (document.getElementById('signupPicUrl').value || '') : ''
      };

      const res = await authSignup(username, email, password, extraData);
      if (res.success) {
        showToast(res.message, "success");
        if (role === 'admin') {
          // Admin needs approval, don't auto login
          bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
          clientSignupForm.reset();
        } else {
          // Auto login customer
          const loginRes = await authLogin(email, password);
          if (loginRes.success) {
            bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
            clientSignupForm.reset();
            if (signupPicPreview) signupPicPreview.src = DEFAULT_AVATAR;
            if (signupPicUrl) signupPicUrl.value = '';
            await checkAuthStatus();
          }
        }
      } else {
        if (clientSignupError) {
          clientSignupError.textContent = res.error || "Signup failed";
          clientSignupError.classList.remove('d-none');
        }
      }
    });
  }

  // Logout Click
  ['clientLogoutBtn', 'clientLogoutBtnMobile'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        closeNavDrawer();
        await authLogout();
      });
    }
  });

  // Profile Details Button Click (populates settings modal)
  function openProfileModal(e) {
    e.preventDefault();
    closeNavDrawer();
    if (!currentUser) return;

      document.getElementById('profileFirstName').value = currentUser.first_name || currentUser.username || '';
      document.getElementById('profileLastName').value = currentUser.last_name || '';
      document.getElementById('profileMobile').value = currentUser.mobile || '';

      
      const userCity = currentUser.city || '';
      const matchedRate = deliveryRates.find(r => r.district.toLowerCase() === userCity.toLowerCase());
      const userProvince = matchedRate ? matchedRate.province : '';

      const provinceSelect = document.getElementById('profileProvince');
      const districtSelect = document.getElementById('profileCity');
      
      if (provinceSelect && districtSelect) {
        // Re-populate province options each time to ensure they're loaded
        provinceSelect.innerHTML = '<option value="">Select Province</option>';
        const provinces = [...new Set(deliveryRates.map(r => r.province))].filter(Boolean);
        provinces.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p;
          opt.textContent = p;
          provinceSelect.appendChild(opt);
        });
        provinceSelect.value = userProvince;
        
        // Populate districts for the matched province
        districtSelect.innerHTML = '<option value="">Select District</option>';
        if (userProvince) {
          districtSelect.disabled = false;
          deliveryRates.filter(r => r.province === userProvince).forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.district;
            opt.textContent = d.district;
            if (d.district.toLowerCase() === userCity.toLowerCase()) {
              opt.selected = true;
            }
            districtSelect.appendChild(opt);
          });
          districtSelect.value = userCity;
        } else {
          districtSelect.disabled = true;
        }
      }

      document.getElementById('profileNic').value = currentUser.nic || '';
      document.getElementById('profileEmail').value = currentUser.email || '';
      
      const profilePicPreview = document.getElementById('profilePicPreview');
      if (profilePicPreview) {
        profilePicPreview.src = currentUser.profile_pic_url || DEFAULT_AVATAR;
      }
      document.getElementById('profilePicUrl').value = currentUser.profile_pic_url || '';

      // Hide updates
      document.getElementById('profileUpdateError').classList.add('d-none');
      document.getElementById('profileUpdateSuccess').classList.add('d-none');

      new bootstrap.Modal(document.getElementById('profileModal')).show();
  }

  ['profileDetailsBtn', 'profileDetailsBtnMobile'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', openProfileModal);
  });



  // Profile Pic Upload (in profile details modal)
  const profilePicInput = document.getElementById('profilePicInput');
  const profilePicPreview = document.getElementById('profilePicPreview');
  const profilePicSpinner = document.getElementById('profilePicSpinner');
  const profilePicUrl = document.getElementById('profilePicUrl');

  if (profilePicInput) {
    profilePicInput.addEventListener('change', async () => {
      const file = profilePicInput.files[0];
      if (!file || !currentUser) return;

      try {
        if (profilePicSpinner) profilePicSpinner.classList.remove('d-none');
        const url = await uploadImage(file);
        if (profilePicPreview) profilePicPreview.src = url;
        if (profilePicUrl) profilePicUrl.value = url;
        
        // Atomically update pic in db immediately
        await updateProfilePicture(currentUser.id, url);
        currentUser.profile_pic_url = url;
        
        // Update Nav bar picture too
        const navPic = document.getElementById('navProfilePic');
        if (navPic) navPic.src = url;

        showToast("Profile picture updated!", "success");
      } catch (err) {
        showToast("Failed to upload image to Cloudinary", "error");
      } finally {
        if (profilePicSpinner) profilePicSpinner.classList.add('d-none');
      }
    });
  }

  // Save general profile details form
  const profileUpdateForm = document.getElementById('profileUpdateForm');
  const profileUpdateError = document.getElementById('profileUpdateError');
  const profileUpdateSuccess = document.getElementById('profileUpdateSuccess');

  if (profileUpdateForm) {
    profileUpdateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (profileUpdateError) profileUpdateError.classList.add('d-none');
      if (profileUpdateSuccess) profileUpdateSuccess.classList.add('d-none');

      const updates = {
        first_name: document.getElementById('profileFirstName').value.trim(),
        last_name: document.getElementById('profileLastName').value.trim(),
        mobile: document.getElementById('profileMobile').value.trim(),
        city: document.getElementById('profileCity').value.trim(),
        nic: document.getElementById('profileNic').value.trim()
      };

      const res = await updateProfileData(currentUser.id, updates);
      if (res.success) {
        if (profileUpdateSuccess) profileUpdateSuccess.classList.remove('d-none');
        currentUser = { ...currentUser, ...updates };
        
        // Update nav bar name too
        const navName = document.getElementById('navUsername');
        if (navName) navName.textContent = currentUser.first_name;

        setTimeout(() => {
          bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
        }, 1500);
      } else {
        if (profileUpdateError) {
          profileUpdateError.textContent = res.error || "Update failed";
          profileUpdateError.classList.remove('d-none');
        }
      }
    });
  }

  // Checkout Button
  const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');
  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener('click', () => {
      if (currentCart.length === 0) {
        showToast("Your cart is empty!", "error");
        return;
      }
      window.location.href = "checkout.html?cart=true";
    });
  }
}
