/* ============================================================
   Cinnamon Heritage — landing page behaviour
   Reuses the platform's own Firebase layer (js/firebase.js) for
   live catalogue data and authentication. Degrades gracefully to
   the published catalogue when the cloud is unreachable.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STORE = '../index.html';
  var WA_NUMBER = '94771234567';

  /* ---------- toasts ---------- */
  var toastHost = $('#chToasts');
  function toast(msg, type) {
    if (!toastHost) return;
    var el = document.createElement('div');
    el.className = 'ch-toast ch-toast--' + (type || 'info');
    var icon = type === 'ok' ? 'bi-check-circle-fill' : type === 'err' ? 'bi-exclamation-circle-fill' : 'bi-info-circle-fill';
    el.innerHTML = '<i class="bi ' + icon + '" aria-hidden="true"></i><span></span>';
    el.lastElementChild.textContent = msg;
    toastHost.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-out');
      setTimeout(function () { el.remove(); }, 320);
    }, 4200);
  }

  /* ---------- overlay / focus management ---------- */
  var openOverlays = [];
  function lockScroll(on) {
    document.body.style.overflow = on ? 'hidden' : '';
  }
  function trapFocus(container, e) {
    var focusables = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
      .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
    if (!focusables.length) return;
    var first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openOverlay(root, focusSel) {
    root.classList.add('is-open');
    openOverlays.push({ root: root, prev: document.activeElement });
    lockScroll(true);
    var target = focusSel ? $(focusSel, root) : null;
    setTimeout(function () { (target || $('button, a, input', root) || root).focus(); }, 60);
  }
  function closeOverlay(root) {
    root.classList.remove('is-open');
    var idx = openOverlays.findIndex(function (o) { return o.root === root; });
    if (idx > -1) {
      var prev = openOverlays[idx].prev;
      openOverlays.splice(idx, 1);
      if (prev && prev.focus) prev.focus();
    }
    if (!openOverlays.length) lockScroll(false);
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openOverlays.length) {
      closeOverlay(openOverlays[openOverlays.length - 1].root);
    } else if (e.key === 'Tab' && openOverlays.length) {
      trapFocus(openOverlays[openOverlays.length - 1].root, e);
    }
  });
  $$('[data-ch-close]').forEach(function (el) {
    el.addEventListener('click', function () {
      var map = { drawer: '#chDrawer', panel: '#chPanel', auth: '#chAuthModal' };
      var root = $(map[el.getAttribute('data-ch-close')]);
      if (root) closeOverlay(root);
    });
  });

  /* ---------- nav: scroll state, progress, scrollspy ---------- */
  var nav = $('#chNav');
  var progress = $('#chProgress');
  var heroBg = $('#chHeroBg');
  var topBtn = $('#chTop');
  var navLinks = $$('.ch-nav-link');
  var spySections = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    nav.classList.toggle('is-scrolled', y > 24);
    topBtn.classList.toggle('is-on', y > 700);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    if (heroBg && !reduceMotion && y < window.innerHeight * 1.2) {
      heroBg.style.transform = 'translateY(' + (y * 0.18) + 'px)';
    }
    var current = null;
    var probe = y + window.innerHeight * 0.34;
    spySections.forEach(function (sec) {
      if (sec.offsetTop <= probe) current = sec.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------- mobile drawer ---------- */
  var drawer = $('#chDrawer');
  var burger = $('#chBurger');
  burger.addEventListener('click', function () {
    var open = drawer.classList.contains('is-open');
    if (open) closeOverlay(drawer); else openOverlay(drawer, '.ch-drawer-panel button');
    burger.setAttribute('aria-expanded', String(!open));
  });
  $$('.ch-drawer-link, .ch-drawer-cta a', drawer).forEach(function (a) {
    a.addEventListener('click', function () { closeOverlay(drawer); burger.setAttribute('aria-expanded', 'false'); });
  });

  /* ---------- account menu ---------- */
  var account = $('#chAccount');
  var accountBtn = $('#chAccountBtn');
  var accountMenu = $('#chAccountMenu');
  accountBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = accountMenu.classList.toggle('is-open');
    accountBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function (e) {
    if (!account.contains(e.target)) {
      accountMenu.classList.remove('is-open');
      accountBtn.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- reveal on scroll ---------- */
  var revealEls = $$('.ch-reveal, .ch-stagger');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- counters + meters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var plain = el.hasAttribute('data-plain');
    if (reduceMotion) { el.textContent = plain ? String(target) : target.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }); return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = plain ? String(Math.round(val)) : val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counted = new WeakSet();
  function activate(el) {
    $$('[data-count]', el).concat(el.hasAttribute('data-count') ? [el] : []).forEach(function (c) {
      if (!counted.has(c)) { counted.add(c); animateCount(c); }
    });
    $$('.ch-meter-fill[data-width]', el).concat(el.classList && el.classList.contains('ch-meter-fill') ? [el] : []).forEach(function (m) {
      m.style.width = m.getAttribute('data-width') + '%';
    });
  }
  var statEls = $$('#chStats, .ch-coumarin, .ch-oil-card');
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { activate(en.target); so.unobserve(en.target); }
      });
    }, { threshold: 0.3 });
    statEls.forEach(function (el) { so.observe(el); });
  } else {
    statEls.forEach(activate);
  }

  /* ---------- marquee: duplicate for a seamless loop ---------- */
  var marquee = $('#chMarquee');
  if (marquee) marquee.appendChild(marquee.firstElementChild.cloneNode(true));

  /* ---------- Ceylon vs cassia ---------- */
  var COMPARE = {
    ceylon: {
      name: 'Ceylon cinnamon',
      latin: 'Cinnamomum verum — native to Sri Lanka',
      icon: 'bi-patch-check-fill',
      rows: [
        ['Quill', 'Thin, fragile, multi-layered bark rolled like a cigar'],
        ['Colour', 'Light tan to golden brown'],
        ['Flavour', 'Delicate, subtly sweet, floral warmth'],
        ['Coumarin', 'Trace amounts — 0.004%'],
        ['Best for', 'Daily culinary and wellness use']
      ]
    },
    cassia: {
      name: 'Cassia',
      latin: 'Cinnamomum cassia — the common supermarket bark',
      icon: 'bi-exclamation-triangle-fill',
      rows: [
        ['Quill', 'A single thick, hard layer of bark'],
        ['Colour', 'Dark reddish brown'],
        ['Flavour', 'Strong, pungent, spicy heat'],
        ['Coumarin', 'Significantly higher — up to 1%'],
        ['Best for', 'Occasional use where bold flavour dominates']
      ]
    }
  };
  var segButtons = $$('.ch-seg button');
  var compareCard = $('#chCompareCard');
  function renderCompare(key) {
    var d = COMPARE[key];
    compareCard.classList.toggle('is-ceylon', key === 'ceylon');
    compareCard.classList.toggle('is-cassia', key === 'cassia');
    $('#chCompareName').textContent = d.name;
    $('#chCompareLatin').textContent = d.latin;
    $('h3 i', compareCard).className = 'bi ' + d.icon;
    $('#chCompareList').innerHTML = d.rows.map(function (r) {
      return '<li><span class="ch-k"></span><span class="ch-v"></span></li>';
    }).join('');
    $$('#chCompareList li').forEach(function (li, i) {
      li.children[0].textContent = d.rows[i][0];
      li.children[1].textContent = d.rows[i][1];
    });
    compareCard.classList.remove('ch-compare-swap');
    void compareCard.offsetWidth;
    compareCard.classList.add('ch-compare-swap');
    segButtons.forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-variant') === key)); });
    $('#chComparePanel').setAttribute('aria-labelledby', key === 'ceylon' ? 'chSegCeylon' : 'chSegCassia');
  }
  segButtons.forEach(function (b) {
    b.addEventListener('click', function () { renderCompare(b.getAttribute('data-variant')); });
  });

  /* ---------- products: filter, fallback images, quick view ---------- */
  var productGrid = $('#chProducts');
  var cards = $$('.ch-product', productGrid);
  var chips = $$('.ch-chip');
  var filterCount = $('#chFilterCount');
  var emptyBox = $('#chProductsEmpty');
  var CAT_LABEL = { quills: 'Quills', powder: 'Powder & chips', tea: 'Tea & infusions', oils: 'Essential oils', gifts: 'Gifts', b2b: 'B2B' };

  function money(n) { return 'LKR ' + Number(n).toLocaleString('en-US'); }
  function stockInfo(q) {
    q = Number(q);
    if (q <= 0) return { cls: 'ch-stock ch-stock--out', icon: 'bi-x-circle', text: 'Out of stock' };
    if (q <= 10) return { cls: 'ch-stock ch-stock--low', icon: 'bi-exclamation-circle', text: 'Low stock' };
    return { cls: 'ch-stock', icon: 'bi-check-circle', text: 'In stock' };
  }
  function paintCard(card) {
    var price = Number(card.getAttribute('data-price'));
    var disc = Number(card.getAttribute('data-discount')) || 0;
    var isContact = card.getAttribute('data-cat') === 'b2b';
    var priceEl = $('[data-price-el]', card);
    if (priceEl && !isContact) {
      priceEl.innerHTML = '';
      priceEl.appendChild(document.createTextNode(money(price)));
      if (disc > 0) {
        var s = document.createElement('s');
        s.textContent = money(price + disc);
        priceEl.appendChild(s);
      }
    }
    var off = $('[data-off]', card);
    if (off) {
      if (disc > 0 && price + disc > 0) {
        off.hidden = false;
        off.textContent = Math.round((disc / (price + disc)) * 100) + '% off';
      } else off.hidden = true;
    }
    var st = $('[data-stock-el]', card);
    if (st && !isContact) {
      var info = stockInfo(card.getAttribute('data-stock'));
      st.className = info.cls;
      st.innerHTML = '<i class="bi ' + info.icon + '" aria-hidden="true"></i> ' + info.text;
    }
  }
  cards.forEach(function (card) {
    paintCard(card);
    var img = $('img', card);
    img.addEventListener('error', function handler() {
      img.removeEventListener('error', handler);
      var fb = card.getAttribute('data-fallback');
      if (fb && img.getAttribute('src') !== fb) img.src = fb;
    });
  });

  function applyFilter(key) {
    var shown = 0;
    cards.forEach(function (card) {
      var match = key === 'all' || card.getAttribute('data-cat') === key;
      card.hidden = !match;
      card.style.display = match ? '' : 'none';
      if (match) shown++;
    });
    emptyBox.hidden = shown !== 0;
    filterCount.textContent = 'Showing ' + shown + ' of ' + cards.length;
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-filter') === key)); });
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () { applyFilter(c.getAttribute('data-filter')); });
  });
  function refreshChipCounts() {
    chips.forEach(function (c) {
      var key = c.getAttribute('data-filter');
      var b = $('b', c);
      if (b) b.textContent = key === 'all' ? cards.length : cards.filter(function (x) { return x.getAttribute('data-cat') === key; }).length;
    });
  }
  refreshChipCounts();

  /* quick view panel */
  var panel = $('#chPanel');
  function openQuick(card) {
    var isContact = card.getAttribute('data-cat') === 'b2b';
    $('#chPanelImg').src = card.getAttribute('data-img');
    $('#chPanelImg').alt = card.getAttribute('data-title');
    $('#chPanelTitle').textContent = card.getAttribute('data-title');
    $('#chPanelDesc').textContent = card.getAttribute('data-full') || card.getAttribute('data-desc');
    var meta = $('#chPanelMeta');
    meta.innerHTML = '';
    var tag = document.createElement('span');
    tag.className = 'ch-tag ch-tag--cat';
    tag.textContent = CAT_LABEL[card.getAttribute('data-cat')] || 'Product';
    meta.appendChild(tag);
    var priceRow = $('#chPanelPriceRow');
    if (isContact) {
      priceRow.style.display = 'none';
    } else {
      priceRow.style.display = '';
      var price = Number(card.getAttribute('data-price'));
      var disc = Number(card.getAttribute('data-discount')) || 0;
      var pEl = $('#chPanelPrice');
      pEl.innerHTML = '';
      pEl.appendChild(document.createTextNode(money(price)));
      if (disc > 0) { var s2 = document.createElement('s'); s2.textContent = money(price + disc); pEl.appendChild(s2); }
      var info = stockInfo(card.getAttribute('data-stock'));
      var sEl = $('#chPanelStock');
      sEl.className = info.cls;
      sEl.innerHTML = '<i class="bi ' + info.icon + '" aria-hidden="true"></i> ' + info.text;
    }
    $('#chPanelOrder').href = isContact ? STORE + '#b2b' : STORE + '#products';
    $('#chPanelOrder').innerHTML = isContact
      ? '<i class="bi bi-handshake" aria-hidden="true"></i> Start a B2B discussion'
      : '<i class="bi bi-bag-plus" aria-hidden="true"></i> Order in the store';
    $('#chPanelWa').href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent('Hello Cinnamon Heritage, I would like to enquire about: ' + card.getAttribute('data-title'));
    openOverlay(panel, '.ch-panel-close');
  }
  $$('[data-quick]', productGrid).forEach(function (btn) {
    btn.addEventListener('click', function () { openQuick(btn.closest('.ch-product')); });
  });

  /* ---------- live catalogue hydration (existing Firebase layer) ---------- */
  function hydrateProducts(list) {
    if (!Array.isArray(list) || !list.length) return;
    list.forEach(function (p) {
      var card = cards.find(function (c) { return c.getAttribute('data-id') === String(p.id); }) ||
        cards.find(function (c) { return c.getAttribute('data-title').toLowerCase() === String(p.title || '').toLowerCase(); });
      if (!card) return;
      if (p.price != null) card.setAttribute('data-price', p.price);
      if (p.discount != null) card.setAttribute('data-discount', p.discount);
      if (p.stock_quantity != null) card.setAttribute('data-stock', p.stock_quantity);
      if (p.full_desc) card.setAttribute('data-full', p.full_desc);
      if (p.short_desc) {
        card.setAttribute('data-desc', p.short_desc);
        var body = $('.ch-product-body p', card);
        if (body) body.textContent = p.short_desc;
      }
      paintCard(card);
    });
  }

  /* ---------- craft stepper ---------- */
  var CRAFT = [
    { n: '01', t: 'Harvesting', s: 'Mature stems are carefully harvested at dawn to ensure the highest concentration of bark essential oils.', f: 'At our estates, skilled harvesters select mature branches (typically 2-3 years old) with optimal bark thickness. Harvesting takes place in the early morning when moisture content is highest, making the bark easier to peel.' },
    { n: '02', t: 'Cleaning and Preparation', s: 'Harvested stems are washed in pure filtered water and outer bark is scraped to expose the clean inner bark.', f: 'Once harvested, the stems are immediately brought to our facility, washed thoroughly with clean water on stainless steel tables, and trimmed. The rough outer cork and green layers are scraped away to expose the golden-bronze inner bark underneath.' },
    { n: '03', t: 'Scraping and Rubbing', s: 'The inner bark is rubbed with a brass rod to loosen it, vital for clean, unbroken peeling.', f: 'Artisans vigorously rub the prepared stems with a smooth brass rod. This traditional friction technique loosens the thin inner bark layer from the wood core, allowing it to be peeled in large, clean, unbroken sheets.' },
    { n: '04', t: 'Peeling', s: 'Expert peelers make precise longitudinal cuts to slide the delicate inner bark off the wood.', f: 'Highly trained artisans use custom curved stainless steel knives to make precise incisions. With immense dexterity, they slide the micro-thin sheets of inner bark off the wood core, taking care to minimize splitting.' },
    { n: '05', t: 'Quill Making', s: 'The thin inner bark is layered and rolled by hand into multi-layered cylindrical quills.', f: 'The peeled bark sheets are immediately packed together, layered, and rolled into continuous cylindrical pipes called quills. The hollow center is filled with smaller fragments of high-grade cinnamon bark to create a solid, uniform cylinder.' },
    { n: '06', t: 'Drying', s: 'Quills are shade-dried on coir racks, then finished in state-of-the-art mechanical dryers.', f: 'The wet quills are initially hung and dried in shade-drying rooms on coconut coir racks to protect the sensitive cinnamaldehyde oils. Once cured, they undergo low-temperature mechanical drying to achieve export-ready moisture content below 12%.' },
    { n: '07', t: 'Grading, Cutting and Milling', s: 'Quills are sorted into international export grades, then cut or milled into ultra-fine powder.', f: 'Cinnamon quills are inspected and sorted into strict export grades (Alba, C5 Special, C5, C4, M5, H1) based on diameter, color, and density. Premium quills are cut to standard lengths, while select pieces are stone-milled into pure, micro-ground powder.' },
    { n: '08', t: 'Essential-Oil Distillation', s: 'Unused leaves and bark chips are steam-distilled into pure leaf and bark essential oils.', f: 'To support zero-waste production, cinnamon leaves and bark chips are loaded into our steam distillation chambers. Steam passes through the organic matter, vaporizing the essential oils, which are then cooled, condensed, and separated to yield pure therapeutic-grade oils.' },
    { n: '09', t: 'Packing and Storage', s: 'Finished products are vacuum-packed and stored in climate-controlled warehouses ready for export.', f: 'To protect against humidity and maintain absolute freshness, our cinnamon products are vacuum-sealed in hygienic food-grade packaging. They are stored in our climate-controlled warehouse, ready for shipping to international markets.' }
  ];
  var rail = $('#chCraftRail');
  var craftIndex = 0;
  CRAFT.forEach(function (step, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ch-craft-step';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-current', i === 0 ? 'true' : 'false');
    b.setAttribute('aria-label', 'Stage ' + step.n + ': ' + step.t);
    b.innerHTML = '<span class="ch-craft-num"></span><span class="ch-craft-name"></span>';
    b.children[0].textContent = step.n;
    b.children[1].textContent = step.t;
    b.addEventListener('click', function () { setCraft(i); });
    rail.appendChild(b);
  });
  var craftBtns = $$('.ch-craft-step', rail);
  function setCraft(i) {
    craftIndex = (i + CRAFT.length) % CRAFT.length;
    var step = CRAFT[craftIndex];
    var frame = $('#chCraftFrame');
    var img = $('#chCraftImg');
    img.src = 'images/step' + (craftIndex + 1) + '.png';
    img.alt = 'Stage ' + step.n + ' — ' + step.t + ': ' + step.s;
    $('#chCraftBig').textContent = step.n;
    $('#chCraftName').textContent = step.t;
    $('#chCraftDesc').textContent = step.f;
    $('#chCraftCount').textContent = step.n + ' / 09';
    $('#chCraftBar').style.width = (((craftIndex + 1) / CRAFT.length) * 100) + '%';
    craftBtns.forEach(function (b, j) { b.setAttribute('aria-current', String(j === craftIndex)); });
    frame.classList.remove('is-swapping');
    void frame.offsetWidth;
    frame.classList.add('is-swapping');
    var next = new Image();
    next.src = 'images/step' + ((craftIndex + 1) % CRAFT.length + 1) + '.png';
  }
  $('#chCraftPrev').addEventListener('click', function () { setCraft(craftIndex - 1); });
  $('#chCraftNext').addEventListener('click', function () { setCraft(craftIndex + 1); });
  rail.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); setCraft(craftIndex + 1); craftBtns[craftIndex].focus(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); setCraft(craftIndex - 1); craftBtns[craftIndex].focus(); }
  });
  setCraft(0);

  /* ---------- how-it-works tabs ---------- */
  var flowTabs = [$('#chTabRetail'), $('#chTabB2b')];
  var flows = [$('#chFlowRetail'), $('#chFlowB2b')];
  flowTabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      flowTabs.forEach(function (t, j) { t.setAttribute('aria-selected', String(i === j)); });
      flows.forEach(function (f, j) {
        f.hidden = i !== j;
        if (i === j) { f.classList.remove('is-in'); void f.offsetWidth; f.classList.add('is-in'); }
      });
    });
  });

  /* ---------- website tour tabs ---------- */
  var tourTabs = $$('.ch-tour-tab');
  var tourPanels = $$('.ch-tour-panel');
  tourTabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      tourTabs.forEach(function (t, j) { t.setAttribute('aria-selected', String(i === j)); });
      tourPanels.forEach(function (p, j) {
        p.hidden = i !== j;
        if (i === j) { p.classList.remove('ch-compare-swap'); void p.offsetWidth; p.classList.add('ch-compare-swap'); }
      });
    });
  });

  /* ---------- order status explorer ---------- */
  var STATUS = [
    { k: 'Pending', d: 'Your order has been received and is awaiting confirmation by our team. Stock is already reserved atomically at checkout.' },
    { k: 'In Progress', d: 'The estate team is picking and preparing your items — grading, weighing and quality checks underway.' },
    { k: 'Packed', d: 'Your cinnamon is vacuum-sealed in food-grade packaging and labelled, ready for dispatch from our warehouse.' },
    { k: 'Shipped', d: 'The parcel has left our facility and is on its way to your district or export destination.' },
    { k: 'Completed', d: 'Delivered and confirmed. The order closes in your account history with its full item record.' },
    { k: 'Cancelled', d: 'The order was cancelled before dispatch. Reserved stock is released back to the catalogue.' }
  ];
  var statusRail = $('#chStatusRail');
  if (statusRail) {
    STATUS.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ch-status-node';
      b.setAttribute('aria-current', i === 0 ? 'true' : 'false');
      b.innerHTML = '<span class="ch-status-dot"><i class="bi bi-circle-fill" aria-hidden="true"></i></span><span class="ch-status-name"></span>';
      b.children[1].textContent = s.k;
      b.addEventListener('click', function () {
        $$('.ch-status-node', statusRail).forEach(function (n, j) { n.setAttribute('aria-current', String(j === i)); });
        $('#chStatusTitle').textContent = s.k;
        $('#chStatusDesc').textContent = s.d;
      });
      statusRail.appendChild(b);
    });
    $('#chStatusTitle').textContent = STATUS[0].k;
    $('#chStatusDesc').textContent = STATUS[0].d;
  }

  /* ---------- FAQ accordion + search ---------- */
  var faqItems = $$('.ch-faq-item');
  faqItems.forEach(function (item) {
    var btn = $('.ch-faq-q', item);
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      faqItems.forEach(function (other) {
        other.classList.remove('is-open');
        $('.ch-faq-q', other).setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
  var faqSearch = $('#chFaqSearch');
  var faqNone = $('#chFaqNone');
  faqSearch.addEventListener('input', function () {
    var q = faqSearch.value.trim().toLowerCase();
    var visible = 0;
    faqItems.forEach(function (item) {
      var text = item.textContent.toLowerCase();
      var match = !q || text.indexOf(q) > -1;
      item.hidden = !match;
      if (match) visible++;
    });
    faqNone.hidden = visible !== 0;
  });

  /* ---------- WhatsApp composer ---------- */
  var WA_TEMPLATES = {
    products: 'Hello Cinnamon Heritage, I would like to buy cinnamon products. Please share your current range and prices.',
    bulk: 'Hello Cinnamon Heritage, I am interested in bulk supply and wholesale pricing. Please share grades, minimum quantities and volume pricing.',
    private: 'Hello Cinnamon Heritage, I would like to discuss private label / white label cinnamon products under my own brand.',
    oils: 'Hello Cinnamon Heritage, I would like essential oil samples with COA and GC-MS reports. Please advise on sizes and pricing.',
    visit: 'Hello Cinnamon Heritage, I would like to book a guided estate visit and tasting session. Please share available dates.',
    export: 'Hello Cinnamon Heritage, I have an export enquiry. Please share CIF/FOB pricing, packing and customs documentation details.'
  };
  var waTopic = $('#chWaTopic');
  var waNote = $('#chWaNote');
  var waPreview = $('#chWaPreview');
  var waOpen = $('#chWaOpen');
  function waMessage() {
    var base = WA_TEMPLATES[waTopic.value] || WA_TEMPLATES.products;
    var note = waNote.value.trim();
    return note ? base + '\n\n' + note : base;
  }
  function paintWa() {
    var msg = waMessage();
    waPreview.textContent = msg;
    waOpen.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  }
  waTopic.addEventListener('change', paintWa);
  waNote.addEventListener('input', paintWa);
  paintWa();
  $('#chWaCopy').addEventListener('click', function () {
    var msg = waMessage();
    function done() { toast('Message copied to your clipboard.', 'ok'); }
    function fail() { toast('Could not copy automatically — select the preview text instead.', 'err'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(done, fail);
    } else {
      var ta = document.createElement('textarea');
      ta.value = msg; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? done() : fail(); } catch (e) { fail(); }
      ta.remove();
    }
  });

  /* ---------- authentication (existing Firebase implementation) ---------- */
  var authModal = $('#chAuthModal');
  var loginBtn = $('#chLoginBtn');
  var authMsg = $('#chAuthMsg');
  var authMsgText = $('#chAuthMsgText');
  var loginForm = $('#chLoginForm');
  var signupForm = $('#chSignupForm');
  var tabLogin = $('#chAuthTabLogin');
  var tabSignup = $('#chAuthTabSignup');

  function firebaseReady() { return typeof window.authLogin === 'function' && typeof window.auth !== 'undefined' && window.auth; }
  function showAuthMsg(text, ok) {
    authMsg.className = 'ch-auth-msg is-on ' + (ok ? 'ch-auth-msg--ok' : 'ch-auth-msg--err');
    $('i', authMsg).className = 'bi ' + (ok ? 'bi-check-circle' : 'bi-exclamation-circle');
    authMsgText.textContent = text;
  }
  function clearAuthMsg() { authMsg.className = 'ch-auth-msg'; }
  function setAuthTab(which) {
    var login = which === 'login';
    tabLogin.setAttribute('aria-selected', String(login));
    tabSignup.setAttribute('aria-selected', String(!login));
    loginForm.hidden = !login;
    signupForm.hidden = login;
    $('#chAuthTitle').textContent = login ? 'Welcome back' : 'Join Cinnamon Heritage';
    $('#chAuthSub').textContent = login ? 'Sign in to shop, track orders and manage your partnerships.' : 'Create a customer account to order and track your cinnamon.';
    clearAuthMsg();
  }
  tabLogin.addEventListener('click', function () { setAuthTab('login'); });
  tabSignup.addEventListener('click', function () { setAuthTab('signup'); });
  loginBtn.addEventListener('click', function () { setAuthTab('login'); openOverlay(authModal, '#chLoginEmail'); });

  function busy(btn, on, label) {
    if (on) {
      btn.dataset.label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="ch-spin" aria-hidden="true"></span> Please wait';
    } else {
      btn.disabled = false;
      btn.innerHTML = label || btn.dataset.label || btn.innerHTML;
    }
  }
  function friendlyError(msg) {
    if (/password/i.test(msg) && /invalid|wrong|incorrect/i.test(msg)) return 'That email and password do not match. Please try again.';
    if (/user-not-found/i.test(msg)) return 'No account exists with that email. Create one instead.';
    if (/email-already-in-use/i.test(msg)) return 'An account with this email already exists. Sign in instead.';
    if (/weak-password/i.test(msg)) return 'Please choose a password of at least 6 characters.';
    if (/invalid-email/i.test(msg)) return 'Please enter a valid email address.';
    if (/network/i.test(msg)) return 'Network error — check your connection and try again.';
    if (/popup-closed/i.test(msg)) return 'Google sign-in was closed before completing.';
    return msg;
  }
  function applySession(session) {
    if (session && session.isLoggedIn) {
      loginBtn.hidden = true;
      account.hidden = false;
      var name = session.username || 'Account';
      $('#chAccountName').textContent = name;
      $('#chAvatar').textContent = name.trim().charAt(0).toUpperCase();
      $('#chAdminLink').hidden = !session.isAdmin;
      if (typeof window.getCartItems === 'function' && session.userId) {
        window.getCartItems(session.userId).then(function (items) {
          var n = Array.isArray(items) ? items.reduce(function (sum, it) { return sum + (Number(it.qty || it.quantity) || 1); }, 0) : 0;
          var badge = $('#chCartCount');
          badge.textContent = n;
          badge.classList.toggle('is-on', n > 0);
        }).catch(function () {});
      }
    } else {
      loginBtn.hidden = false;
      account.hidden = true;
      $('#chCartCount').classList.remove('is-on');
    }
  }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearAuthMsg();
    if (!firebaseReady()) { showAuthMsg('Sign-in is managed securely on the main store portal. Please visit the Cinnamon Heritage store to log in.', false); return; }
    var email = $('#chLoginEmail').value.trim();
    var pass = $('#chLoginPassword').value;
    if (!email || !pass) { showAuthMsg('Enter your email and password to continue.', false); return; }
    var btn = $('#chLoginSubmit');
    busy(btn, true);
    window.authLogin(email, pass).then(function (res) {
      busy(btn, false, 'Sign in');
      if (res.success) {
        applySession({ isLoggedIn: true, userId: res.userId, username: res.username, isAdmin: res.role === 'admin' && res.is_approved });
        closeOverlay(authModal);
        toast('Welcome back, ' + (res.username || 'friend') + '.', 'ok');
      } else if (res.isPending) {
        showAuthMsg(res.error, false);
      } else {
        showAuthMsg(friendlyError(res.error || 'Sign-in failed.'), false);
      }
    }).catch(function (err) { busy(btn, false, 'Sign in'); showAuthMsg(friendlyError(err.message), false); });
  });

  signupForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearAuthMsg();
    if (!firebaseReady()) { showAuthMsg('Account creation is managed on the main store portal. Please visit the store to register.', false); return; }
    var name = $('#chSignupName').value.trim();
    var email = $('#chSignupEmail').value.trim();
    var pass = $('#chSignupPassword').value;
    if (!name || !email || pass.length < 6) { showAuthMsg('Enter your name, a valid email and a password of at least 6 characters.', false); return; }
    var parts = name.split(/\s+/);
    var btn = $('#chSignupSubmit');
    busy(btn, true);
    window.authSignup(name, email, pass, { role: 'customer', first_name: parts[0], last_name: parts.slice(1).join(' ') }).then(function (res) {
      busy(btn, false, 'Create account');
      if (res.success) {
        showAuthMsg(res.message + ' You can sign in now.', true);
        setAuthTab('login');
        $('#chLoginEmail').value = email;
        toast('Account created. Welcome to Cinnamon Heritage.', 'ok');
      } else {
        showAuthMsg(friendlyError(res.error || 'Could not create the account.'), false);
      }
    }).catch(function (err) { busy(btn, false, 'Create account'); showAuthMsg(friendlyError(err.message), false); });
  });

  function googleAuth(role) {
    clearAuthMsg();
    if (!firebaseReady() || typeof window.authGoogleSignIn !== 'function') { showAuthMsg('Google sign-in is managed securely on the main store portal.', false); return; }
    window.authGoogleSignIn(role).then(function (res) {
      if (res && res.success) {
        applySession({ isLoggedIn: true, userId: res.userId || (res.user && res.user.id), username: res.username || (res.user && res.user.username), isAdmin: res.role === 'admin' });
        closeOverlay(authModal);
        toast('Signed in with Google.', 'ok');
      } else {
        showAuthMsg(friendlyError((res && res.error) || 'Google sign-in failed.'), false);
      }
    }).catch(function (err) { showAuthMsg(friendlyError(err.message), false); });
  }
  $('#chGoogleLogin').addEventListener('click', function () { googleAuth(null); });
  $('#chGoogleSignup').addEventListener('click', function () { googleAuth('customer'); });

  $('#chForgotBtn').addEventListener('click', function () {
    var email = $('#chLoginEmail').value.trim();
    if (!email) { showAuthMsg('Enter your email above first, then tap forgot password.', false); $('#chLoginEmail').focus(); return; }
    if (!firebaseReady() || typeof window.authForgotPassword !== 'function') { showAuthMsg('Password reset is managed securely on the main store portal.', false); return; }
    window.authForgotPassword(email).then(function (res) {
      showAuthMsg(res.success ? res.message : friendlyError(res.error), !!res.success);
    });
  });

  $('#chLogoutBtn').addEventListener('click', function () {
    accountMenu.classList.remove('is-open');
    if (firebaseReady() && typeof window.authLogout === 'function') {
      window.authLogout();
    } else {
      applySession(null);
      toast('Signed out.', 'info');
    }
  });

  /* ---------- boot: session + live data ---------- */
  function boot() {
    if (firebaseReady() && typeof window.authStatus === 'function') {
      window.authStatus().then(applySession).catch(function () {});
    }
    if (typeof window.getProducts === 'function') {
      window.getProducts().then(hydrateProducts).catch(function () {});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();