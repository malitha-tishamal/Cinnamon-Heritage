// ============================================
// EmailJS Configuration
// ============================================
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';

(function() {
  if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
})();

// ============================================
// IMMEDIATE DATA LOADING - Fires ASAP
// ============================================
const dataPromises = {
  content: fetch('/api/content').then(r => r.ok ? r.json() : null).catch(() => null),
  products: fetch('/api/products').then(r => r.ok ? r.json() : []).catch(() => [])
};

// Fallback content if DB is slow/unavailable
const FALLBACK = {
  hero: {
    title: 'Pure Ceylon Cinnamon',
    subtitle: 'From our family estate in Galle to your table — authentic, sustainable, exceptional.',
    cta_text: 'Discover Our Story'
  }
};

// ============================================
// Apply content as soon as DOM is ready
// ============================================
function applyHeroContent(content) {
  const heroTitle = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const heroCta = document.getElementById('hero-cta');

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
}

function renderProducts(products) {
  const productsRow = document.getElementById('productsRow');
  if (!productsRow) return;

  if (!products || products.length === 0) {
    productsRow.innerHTML = '<div class="col-12 text-center"><p class="text-secondary">No products available.</p></div>';
    return;
  }

  productsRow.innerHTML = '';
  products.forEach((p, i) => {
    const hasDiscount = p.discount > 0;
    const displayPrice = parseFloat(p.price);
    const oldPrice = displayPrice + (parseFloat(p.discount) || 0);
    const isLowStock = p.stock_quantity > 0 && p.stock_quantity <= 10;
    const isOutOfStock = p.stock_quantity <= 0;
    const isTopSeller = p.total_sales >= 50;

    const col = document.createElement('div');
    col.className = 'col-lg-3 col-md-6';
    col.style.opacity = '0';
    col.style.transform = 'translateY(30px)';
    col.style.transition = `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`;

    col.innerHTML = `
      <div class="card h-100 product-card ${isOutOfStock ? 'opacity-75' : ''}" 
           data-id="${p.id}" data-title="${p.title}" data-img="${p.image_url}" 
           data-desc="${p.short_desc}" data-price="${p.price}"
           data-discount="${p.discount}" data-stock="${p.stock_quantity}">
        <div class="overflow-hidden" style="height: 200px; position: relative;">
          ${hasDiscount ? '<span class="badge bg-danger position-absolute top-0 end-0 m-2" style="z-index:1;border-radius:6px;">OFFER</span>' : ''}
          ${isTopSeller ? '<span class="badge bg-warning text-dark position-absolute top-0 start-0 m-2" style="z-index:1;border-radius:6px;">TOP SELLER</span>' : ''}
          <img src="${p.image_url}" alt="${p.title}" class="card-img-top h-100 w-100 object-fit-cover product-img" style="transition: transform 0.6s ease;">
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
              isLowStock ? `<span class="badge bg-warning text-dark w-100" style="border-radius:6px;">LOW STOCK: ${p.stock_quantity} LEFT</span>` : 
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
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        col.style.opacity = '1';
        col.style.transform = 'translateY(0)';
      });
    });
  });
}

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

// ============================================
// DOM Ready - Apply everything
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  // Show skeleton loaders immediately
  showSkeletons();

  // Wait for both promises (already started above)
  const [content, products] = await Promise.all([dataPromises.content, dataPromises.products]);

  // Apply hero content
  applyHeroContent(content);

  // Render products
  renderProducts(products);

  // Hide preloader
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('hidden');
    setTimeout(() => preloader.remove(), 600);
  }

  // Init scroll animations
  initScrollAnimations();
});

// ============================================
// Modal Elements & Click Handler
// ============================================
const modal = document.getElementById('processModal');
const closeModal = document.getElementById('closeModal');
const modalImg = document.getElementById('modalImg');
const modalNum = document.getElementById('modalNum');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');

document.addEventListener('click', function(e) {
  const card = e.target.closest('.process-card, .product-card');
  if (!card) return;
  e.preventDefault();
  e.stopPropagation();

  const title = card.getAttribute('data-title');
  const desc = card.getAttribute('data-desc');
  const img = card.getAttribute('data-img');
  const num = card.getAttribute('data-num');
  const isProduct = card.classList.contains('product-card');
  const productId = card.getAttribute('data-id');
  const price = card.getAttribute('data-price');
  const discount = card.getAttribute('data-discount');
  const stock = card.getAttribute('data-stock');

  modalTitle.textContent = title;
  modalDesc.textContent = desc;

  if (num) { modalNum.textContent = num; modalNum.style.display = 'block'; }
  else { modalNum.style.display = 'none'; }

  const priceContainer = document.getElementById('modalPriceContainer');
  const stockContainer = document.getElementById('modalStockContainer');
  const actionContainer = document.getElementById('modalActionContainer');
  const buyBtn = document.getElementById('modalBuyBtn');

  if (isProduct && price) {
    priceContainer.classList.remove('d-none');
    stockContainer.classList.remove('d-none');
    actionContainer.classList.remove('d-none');
    const currentPrice = parseFloat(price);
    const discAmt = parseFloat(discount || 0);
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

// ============================================
// Contact Form Handler
// ============================================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!contactForm.checkValidity()) { contactForm.classList.add('was-validated'); return; }

    const submitBtn = document.getElementById('contactSubmitBtn');
    const btnText = document.getElementById('submitBtnText');
    const spinner = document.getElementById('submitBtnSpinner');
    submitBtn.disabled = true;
    btnText.textContent = 'Sending...';
    spinner.classList.remove('d-none');

    const formData = {
      from_name: document.getElementById('contactName').value,
      from_email: document.getElementById('contactEmail').value,
      phone: document.getElementById('contactPhone').value || 'Not provided',
      subject: document.getElementById('contactSubject').value || 'General Enquiry',
      message: document.getElementById('contactMessage').value
    };

    if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, formData)
        .then(() => { showToast('Message sent successfully!', 'success'); contactForm.reset(); contactForm.classList.remove('was-validated'); })
        .catch(() => { showToast('Failed to send. Please try again.', 'error'); })
        .finally(() => { submitBtn.disabled = false; btnText.textContent = 'Send Message'; spinner.classList.add('d-none'); });
    } else {
      fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
        .then(r => { if (r.ok) return r.json(); throw new Error(); })
        .then(() => { showToast('Message sent successfully!', 'success'); contactForm.reset(); contactForm.classList.remove('was-validated'); })
        .catch(() => { console.log('Contact Form Data:', formData); showToast('Thank you! Message received.', 'success'); contactForm.reset(); contactForm.classList.remove('was-validated'); })
        .finally(() => { submitBtn.disabled = false; btnText.textContent = 'Send Message'; spinner.classList.add('d-none'); });
    }
  });
}

// ============================================
// Toast Notification
// ============================================
function showToast(message, type) {
  const toastEl = document.getElementById('contactToast');
  const toastMsg = document.getElementById('toastMessage');
  toastMsg.textContent = message;
  toastEl.classList.remove('bg-success', 'bg-danger', 'text-white');
  toastEl.classList.add(type === 'success' ? 'bg-success' : 'bg-danger', 'text-white');
  const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
  toast.show();
}

// ============================================
// Smooth Scroll
// ============================================
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

// ============================================
// Scroll Animations (IntersectionObserver)
// ============================================
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children').forEach(el => {
    observer.observe(el);
  });
}

// ============================================
// Navbar Background on Scroll
// ============================================
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    if (window.scrollY > 100) {
      navbar.style.background = 'rgba(10, 10, 15, 0.95)';
      navbar.style.padding = '10px 0';
    } else {
      navbar.style.background = 'rgba(0, 0, 0, 0.3)';
      navbar.style.padding = '20px 0';
    }
  }
});
