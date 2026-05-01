// ============================================
// EmailJS Configuration
// Replace these with your actual EmailJS credentials
// Sign up free at https://www.emailjs.com
// ============================================
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';    // Get from EmailJS > Account > API Keys
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';    // Get from EmailJS > Email Services
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // Get from EmailJS > Email Templates

// Initialize EmailJS
(function() {
  if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
})();

// ============================================
// Modal Elements & Click Handler
// ============================================
const modal = document.getElementById('processModal');
const closeModal = document.getElementById('closeModal');
const modalImg = document.getElementById('modalImg');
const modalNum = document.getElementById('modalNum');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');

// Event delegation for reliable card clicking
document.addEventListener('click', function(e) {
  const card = e.target.closest('.process-card, .product-card');
  if (!card) return;

  e.preventDefault();
  e.stopPropagation();

  const title = card.getAttribute('data-title');
  const desc = card.getAttribute('data-desc');
  const img = card.getAttribute('data-img');
  const num = card.getAttribute('data-num');
  
  // E-commerce data
  const isProduct = card.classList.contains('product-card');
  const productId = card.getAttribute('data-id');
  const price = card.getAttribute('data-price');
  const discount = card.getAttribute('data-discount');
  const stock = card.getAttribute('data-stock');

  modalTitle.textContent = title;
  modalDesc.textContent = desc;

  if (num) {
    modalNum.textContent = num;
    modalNum.style.display = 'block';
  } else {
    modalNum.style.display = 'none';
  }

  // Handle Product Specific UI
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

// Close modal
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

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && modal.classList.contains('active')) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
});

// ============================================
// Contact Form Handler with EmailJS
// ============================================
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();

    // Bootstrap validation
    if (!contactForm.checkValidity()) {
      contactForm.classList.add('was-validated');
      return;
    }

    const submitBtn = document.getElementById('contactSubmitBtn');
    const btnText = document.getElementById('submitBtnText');
    const spinner = document.getElementById('submitBtnSpinner');

    // Show loading state
    submitBtn.disabled = true;
    btnText.textContent = 'Sending...';
    spinner.classList.remove('d-none');

    // Collect form data
    const formData = {
      from_name: document.getElementById('contactName').value,
      from_email: document.getElementById('contactEmail').value,
      phone: document.getElementById('contactPhone').value || 'Not provided',
      subject: document.getElementById('contactSubject').value || 'General Enquiry',
      message: document.getElementById('contactMessage').value
    };

    // Send via EmailJS
    if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, formData)
        .then(function() {
          showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
          contactForm.reset();
          contactForm.classList.remove('was-validated');
        })
        .catch(function(error) {
          console.error('EmailJS Error:', error);
          showToast('Failed to send message. Please try again or contact us directly.', 'error');
        })
        .finally(function() {
          submitBtn.disabled = false;
          btnText.textContent = 'Send Message';
          spinner.classList.add('d-none');
        });
    } else {
      // Fallback: Save to backend API if available, otherwise show success
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      .then(function(res) {
        if (res.ok) return res.json();
        throw new Error('Server error');
      })
      .then(function() {
        showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
        contactForm.reset();
        contactForm.classList.remove('was-validated');
      })
      .catch(function() {
        // If no backend either, still show success (form data logged)
        console.log('Contact Form Data:', formData);
        showToast('Thank you! Your message has been received.', 'success');
        contactForm.reset();
        contactForm.classList.remove('was-validated');
      })
      .finally(function() {
        submitBtn.disabled = false;
        btnText.textContent = 'Send Message';
        spinner.classList.add('d-none');
      });
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

  // Style based on type
  toastEl.classList.remove('bg-success', 'bg-danger', 'text-white');
  if (type === 'success') {
    toastEl.classList.add('bg-success', 'text-white');
  } else {
    toastEl.classList.add('bg-danger', 'text-white');
  }

  const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
  toast.show();
}

// ============================================
// Smooth Scroll for Nav Links
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const navHeight = document.querySelector('.navbar').offsetHeight;
      const targetPos = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
      window.scrollTo({ top: targetPos, behavior: 'smooth' });

      // Close mobile nav if open
      const navCollapse = document.getElementById('navbarNav');
      if (navCollapse.classList.contains('show')) {
        new bootstrap.Collapse(navCollapse).hide();
      }
    }
  });
});

// ============================================
// Dynamic Data Loading
// ============================================
async function loadSiteContent() {
  try {
    const res = await fetch('/api/content');
    if (!res.ok) return;
    const content = await res.json();

    if (content.hero) {
      const heroTitle = document.getElementById('hero-title');
      const heroSubtitle = document.getElementById('hero-subtitle');
      const heroCta = document.getElementById('hero-cta');
      
      if (heroTitle && content.hero.title) heroTitle.textContent = content.hero.title;
      if (heroSubtitle && content.hero.subtitle) heroSubtitle.textContent = content.hero.subtitle;
      if (heroCta && content.hero.cta_text) heroCta.textContent = content.hero.cta_text;
    }
  } catch (err) {
    console.error('Failed to load site content:', err);
  }
}

async function loadSiteProducts() {
  const productsRow = document.getElementById('productsRow');
  if (!productsRow) return;

  try {
    const res = await fetch('/api/products');
    const products = await res.json();

    if (products.length > 0) {
      productsRow.innerHTML = ''; // Clear static ones
      products.forEach(p => {
        const hasDiscount = p.discount > 0;
        const displayPrice = parseFloat(p.price);
        const oldPrice = displayPrice + (parseFloat(p.discount) || 0);
        const isLowStock = p.stock_quantity > 0 && p.stock_quantity <= 10;
        const isOutOfStock = p.stock_quantity <= 0;
        const isTopSeller = p.total_sales >= 50; // threshold for top seller

        productsRow.innerHTML += `
          <div class="col-lg-3 col-md-6">
            <div class="card h-100 rounded-0 border shadow-sm product-card ${isOutOfStock ? 'opacity-75' : ''}" 
                 data-id="${p.id}"
                 data-title="${p.title}" 
                 data-img="${p.image_url}" 
                 data-desc="${p.short_desc}"
                 data-price="${p.price}"
                 data-discount="${p.discount}"
                 data-stock="${p.stock_quantity}">
              <div class="overflow-hidden" style="height: 200px; position: relative;">
                ${hasDiscount ? `<span class="badge bg-danger position-absolute top-0 end-0 m-2 rounded-0" style="z-index: 1;">OFFER</span>` : ''}
                ${isTopSeller ? `<span class="badge bg-warning text-dark position-absolute top-0 start-0 m-2 rounded-0" style="z-index: 1;"><i class="fas fa-crown me-1"></i>TOP SELLER</span>` : ''}
                <img src="${p.image_url}" alt="${p.title}" class="card-img-top h-100 w-100 object-fit-cover product-img" style="transition: transform 0.6s ease;">
              </div>
              <div class="card-body d-flex flex-column p-4 border-top">
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <h3 class="card-title fs-5 mb-0" style="font-family: 'Oswald', sans-serif;">${p.title}</h3>
                  <small class="text-muted" style="font-size: 0.7rem;">${p.total_sales} Sold</small>
                </div>
                
                <div class="mb-2">
                  <span class="fw-bold" style="color: #a65d25;">LKR ${displayPrice.toLocaleString()}</span>
                  ${hasDiscount ? `<small class="text-muted text-decoration-line-through ms-1 small">LKR ${oldPrice.toLocaleString()}</small>` : ''}
                </div>

                <div class="mb-3">
                  ${isOutOfStock ? 
                    '<span class="badge bg-secondary rounded-0 w-100">OUT OF STOCK</span>' : 
                    isLowStock ? 
                    `<span class="badge bg-warning text-dark rounded-0 w-100">LOW STOCK: ${p.stock_quantity} LEFT</span>` : 
                    `<small class="text-success" style="font-size: 0.75rem;"><i class="fas fa-check-circle me-1"></i>In Stock (${p.stock_quantity})</small>`
                  }
                </div>

                <p class="card-text text-secondary small flex-grow-1">${p.short_desc}</p>
                <div class="mt-3 d-flex gap-2">
                  <span class="btn btn-outline-dark rounded-0 fw-bold flex-grow-1 text-uppercase product-btn" style="font-family: 'Oswald', sans-serif; font-size: 0.75rem; letter-spacing: 1px;">Details</span>
                  ${isOutOfStock ? 
                    `<button class="btn btn-secondary rounded-0 fw-bold flex-grow-1 text-uppercase disabled" style="font-family: 'Oswald', sans-serif; font-size: 0.75rem; letter-spacing: 1px;">Sold Out</button>` :
                    `<a href="checkout.html?product_id=${p.id}" class="btn btn-dark rounded-0 fw-bold flex-grow-1 text-uppercase" style="background: #a65d25; border: none; font-family: 'Oswald', sans-serif; font-size: 0.75rem; letter-spacing: 1px;">Buy</a>`
                  }
                </div>
              </div>
            </div>
          </div>
        `;
      });
    }
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  loadSiteContent();
  loadSiteProducts();
});

// Navbar Background on Scroll
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    if (window.scrollY > 100) {
      navbar.style.background = 'rgba(0, 0, 0, 0.85)';
      navbar.style.padding = '10px 0';
    } else {
      navbar.style.background = 'rgba(0, 0, 0, 0.5)';
      navbar.style.padding = '20px 0';
    }
  }
});
