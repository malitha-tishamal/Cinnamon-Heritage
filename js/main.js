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
  content:  fetchWithCache('cache_content', getContent, null),
  products: fetchWithCache('cache_products', getProducts, []),
  settings: fetchWithCache('cache_settings', getSettings, {})
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
  const aboutSection = document.getElementById('about');

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

// ============================================================
// Sequential Multi-Product Promo Popup System
// ============================================================
let promoAlertInitialized = false;
let promoQueue = [];         // Array of discounted products to cycle through
let promoQueueIndex = 0;    // Current position in queue
let promoTimeout = null;    // Timeout handle for auto-advance

function initPromoAlert(products) {
  if (promoAlertInitialized) return;

  // Filter products that have a discount and stock
  const discounted = products.filter(p => parseFloat(p.discount) > 0 && p.stock_quantity > 0);
  if (discounted.length === 0) return;

  // Sort by discount percentage (highest first) so best deals show first
  discounted.sort((a, b) => {
    const pctA = (parseFloat(a.discount) / (parseFloat(a.price) + parseFloat(a.discount))) * 100;
    const pctB = (parseFloat(b.discount) / (parseFloat(b.price) + parseFloat(b.discount))) * 100;
    return pctB - pctA;
  });

  promoQueue = discounted;
  promoQueueIndex = 0;

  const promoAlert   = document.getElementById('promoAlert');
  const closePromoBtn = document.getElementById('closePromoBtn');
  const claimPromoBtn = document.getElementById('claimPromoBtn');

  if (!promoAlert) return;

  // Show a specific product promo in the popup
  function showPromoForProduct(product) {
    const displayPrice = parseFloat(product.price);
    const oldPrice     = displayPrice + parseFloat(product.discount);
    const pct          = oldPrice > 0 ? Math.round((parseFloat(product.discount) / oldPrice) * 100) : 0;

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
        ${ product.image_url ? `<div class="promo-product-img"><img src="${product.image_url}" alt="${product.title}" loading="lazy"></div>` : '' }
        <div class="promo-product-info">
          <div class="promo-alert-title" id="promoAlertText">
            Save <strong>${pct}%</strong> on <strong>${product.title}</strong>! Special seasonal offer.
          </div>
          <div class="promo-prices">
            <span class="promo-new-price">LKR ${displayPrice.toLocaleString()}</span>
            <span class="promo-old-price">LKR ${oldPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <button class="promo-alert-btn w-100 mt-2" id="claimPromoBtn">Claim Deal &rarr;</button>
    `;

    // Re-bind claim button
    document.getElementById('claimPromoBtn').onclick = () => {
      clearTimeout(promoTimeout);
      promoAlert.classList.remove('active');
      const target = document.getElementById('products');
      if (target) {
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 80;
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.pageYOffset - navHeight,
          behavior: 'smooth'
        });
        setTimeout(() => {
          const card = document.querySelector(`.product-card[data-id="${product.id}"]`);
          if (card) {
            card.classList.add('pulse-highlight');
            card.click();
            setTimeout(() => card.classList.remove('pulse-highlight'), 2000);
          }
        }, 800);
      }
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
            <span class="btn btn-outline-dark product-btn fw-bold flex-grow-1 text-uppercase" style="font-family:'Oswald',sans-serif;font-size:0.75rem;letter-spacing:1px;">Details</span>
            ${isOutOfStock ?
              '<button class="btn btn-secondary fw-bold flex-grow-1 text-uppercase disabled" style="font-family:\'Oswald\',sans-serif;font-size:0.75rem;border-radius:8px;">Sold Out</button>' :
              `<a href="checkout.html?product_id=${p.id}" class="btn fw-bold flex-grow-1 text-uppercase" style="background:var(--accent);border:none;color:#fff;font-family:'Oswald',sans-serif;font-size:0.75rem;border-radius:8px;">Buy</a>`}
          </div>
        </div>
      </div>`;

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
}

// ============================================================
// DOM Ready
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  showSkeletons();

  const [content, products, settings] = await Promise.all([
    dataPromises.content, dataPromises.products, dataPromises.settings
  ]);

  applyHeroContent(content);
  applyAboutContent(content);
  applyFactoryContent(content);
  applySettings(settings);
  renderProducts(products);

  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('hidden');
    setTimeout(() => preloader.remove(), 600);
  }

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
  });

  subscribeToProducts(products => {
    renderProducts(products);
  });

  subscribeToSettings(settings => {
    applySettings(settings);
  });
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
  const card = e.target.closest('.process-card, .product-card');
  if (!card) return;
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
      const navCollapse = document.getElementById('navbarNav');
      if (navCollapse.classList.contains('show')) new bootstrap.Collapse(navCollapse).hide();
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
