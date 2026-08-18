// ============================================================
// Cinnamon Heritage — Firebase Client
// Replace the config keys with your own Firebase Project details
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCxwS4oCfB4b2vQniNoSjNOq_G_2GvAkdg",
  authDomain: "authspark-pq68d.firebaseapp.com",
  projectId: "authspark-pq68d",
  storageBucket: "authspark-pq68d.firebasestorage.app",
  messagingSenderId: "104606816181",
  appId: "1:104606816181:web:249a1f1f3e9daebd4eabfc"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Enable Firestore persistence (offline caching)
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn("Firestore persistence failed: Multiple tabs open.");
  } else if (err.code == 'unimplemented') {
    console.warn("Firestore persistence is not supported by this browser.");
  }
});

// ============================================================
// CACHE HELPERS
// ============================================================

async function serveFromCache(key, fetcher) {
  const cached = sessionStorage.getItem(key);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      fetcher().then(data => {
        if (data !== undefined && data !== null) {
          sessionStorage.setItem(key, JSON.stringify(data));
        }
      }).catch(() => {});
      return parsed;
    } catch (e) {
      sessionStorage.removeItem(key);
    }
  }
  const data = await fetcher();
  if (data !== undefined && data !== null) {
    sessionStorage.setItem(key, JSON.stringify(data));
  }
  return data;
}

function invalidateCache(key) {
  sessionStorage.removeItem(key);
}

function invalidateAllCaches() {
  ['cache_content', 'cache_products', 'cache_process_steps', 'cache_settings', 'cache_faqs'].forEach(invalidateCache);
}

// ============================================================
// REAL-TIME LISTENERS
// ============================================================

function subscribeToContent(callback) {
  return db.collection('site_content').onSnapshot(
    snapshot => {
      const content = {};
      snapshot.forEach(doc => { content[doc.id] = doc.data(); });
      sessionStorage.setItem('cache_content', JSON.stringify(content));
      callback(content);
    },
    err => console.error('Content listener error:', err)
  );
}

function subscribeToProducts(callback) {
  return db.collection('products')
    .orderBy('display_order')
    .onSnapshot(
      async () => {
        invalidateCache('cache_products');
        const products = await getProducts();
        callback(products);
      },
      err => console.error('Products listener error:', err)
    );
}

function subscribeToProcessSteps(callback) {
  return db.collection('process_steps')
    .orderBy('display_order')
    .onSnapshot(
      async () => {
        invalidateCache('cache_process_steps');
        const steps = await getProcessSteps();
        callback(steps);
      },
      err => console.error('Process steps listener error:', err)
    );
}

function subscribeToSettings(callback) {
  return db.collection('site_settings').onSnapshot(
    snapshot => {
      const settings = {};
      snapshot.forEach(doc => { settings[doc.id] = doc.data().value; });
      sessionStorage.setItem('cache_settings', JSON.stringify(settings));
      callback(settings);
    },
    err => console.error('Settings listener error:', err)
  );
}

// ============================================================
// DATABASE SEEDING
// ============================================================

let isSeeded = false;

async function seedDatabaseIfNeeded() {
  if (isSeeded) return;
  
  // Only check once per session to reduce calls
  isSeeded = true;
  
  try {
    const productsSnap = await db.collection('products').limit(1).get();
    if (!productsSnap.empty) {
      return; // Already seeded
    }
    
    console.log("Seeding Firestore database with initial Cinnamon Heritage data...");
    
    // Seed Site Content
    const content = [
      { id: 'hero', title: 'PURE CEYLON CINNAMON', subtitle: 'From our Family Estates in Galle Unanwitiya to the World. Hand Crafted, Sustainably Grown and Certified Authentic Ceylon Cinnamon Since 1982.', cta_text: 'Discover Our Heritage', background_image: 'images/cinnamon_spices.jpg' },
      { id: 'about', title: 'From Our Own Estate', text: 'Nestled in the lush hillsides of Galle Unanwitiya, our family-owned estate spans over 15 acres of prime cinnamon-growing land. The southern coast of Sri Lanka – known globally as "Cinnamon Country" – provides the perfect tropical climate, rich laterite soils and monsoon rains that give Ceylon cinnamon its world-renowned delicate flavour and aroma. Three generations of our family have nurtured these lands using sustainable, organic farming methods passed down through the decades.' },
      { id: 'factory', title: 'Our Facility', text: 'Our state-of-the-art processing facility combines centuries-old Sri Lankan craftsmanship with modern food-grade technology. Every workstation features hygienic stainless steel surfaces, and our advanced mechanical dryers are calibrated to preserve the delicate essential oils that make Ceylon cinnamon exceptional. Over 50 skilled local artisans work alongside quality-control specialists to ensure every batch meets international export standards including ISO 22000 and HACCP certification.' },
      { id: 'quality', title: 'QUALITY ASSURANCE', text: 'Every batch of Cinnamon Heritage products undergoes rigorous laboratory testing for purity, moisture content and coumarin levels. We hold ISO 22000, HACCP and Sri Lanka Standards Institution certifications. Our sustainable farming practices protect the environment, empower our local community and guarantee that our cinnamon reaches you 100% natural – free of additives, preservatives and artificial colouring.' },
      { id: 'contact', title: 'Contact Us', subtitle: 'Whether you are a wholesaler, retailer or artisan brand looking for authentic Ceylon cinnamon, we would love to hear from you. Reach out to discuss bulk orders, private labelling or any enquiries about our products.', address: 'Galle Unanwitiya, Sri Lanka', phone: '+94 77 123 4567', email: 'info@cinnamonheritage.com', whatsapp: '94771234567' },
      { id: 'products', background_image: 'images/estate_bg.png' },
      { id: 'process', background_image: 'images/estate_bg.png' },
      { id: 'faq', background_image: '' }
    ];
    
    for (const c of content) {
      const { id, ...fields } = c;
      await db.collection('site_content').doc(id).set(fields);
    }
    
    // Seed Site Settings
    const settings = {
      cod_enabled: '1',
      default_delivery_charge: '350.00',
      low_stock_threshold: '10',
      max_popups: '5',
      online_pay_enabled: '0',
      bank_transfer_enabled: '1',
      bank_name: 'Bank of Ceylon',
      bank_branch: 'Galle Branch',
      bank_acc_name: 'Cinnamon Heritage (Pvt) Ltd',
      bank_acc_no: '8012345678'
    };
    
    for (const [key, value] of Object.entries(settings)) {
      await db.collection('site_settings').doc(key).set({ value });
    }
    
    // Seed Products
    const products = [
      {
        id: '1',
        title: 'Premium Ceylon Cinnamon Quills',
        short_desc: 'Finest hand-rolled Ceylon Cinnamon Quills. Delicate layers, smooth texture, sweet aroma.',
        full_desc: 'Our signature premium quills are hand-harvested and expertly rolled by skilled artisans. These Grade C5 Special quills showcase the finest layering and sweetest aroma of true Ceylon Cinnamon. Perfect for gourmet kitchens, specialty retail and premium export.',
        image_url: 'images/product_premium_quills.jpg',
        display_order: 1,
        is_active: true,
        price: 3500,
        discount: 200,
        stock_quantity: 50,
        delivery_charge: 500,
        total_sales: 120,
        card_type: 'product'
      },
      {
        id: '2',
        title: 'Cut Quills and Cinnamon Sticks',
        short_desc: 'Precision-cut quills and sticks in various grades. Ideal for retail and food service.',
        full_desc: 'Available in C4, C5 and C5 Special grades. Our cut quills are uniformly sized and sorted for consistency. Perfect for retail packaging, food manufacturing and hospitality use. Available in 50g, 100g and bulk packaging.',
        image_url: 'images/product_cut_quills.jpg',
        display_order: 2,
        is_active: true,
        price: 2500,
        discount: 100,
        stock_quantity: 80,
        delivery_charge: 450,
        total_sales: 95,
        card_type: 'product'
      },
      {
        id: '3',
        title: 'Ceylon Cinnamon Powder',
        short_desc: '100% Pure micro-ground Ceylon Cinnamon Powder. Rich aroma, smooth texture.',
        full_desc: 'Stone-ground from premium Ceylon Cinnamon bark, our powder retains maximum essential oil content and natural sweetness. Ultra-low coumarin content. Perfect for baking, beverages, supplements and health products.',
        image_url: 'images/product_cinnamon_powder.jpg',
        display_order: 3,
        is_active: true,
        price: 1800,
        discount: 0,
        stock_quantity: 200,
        delivery_charge: 350,
        total_sales: 180,
        card_type: 'product'
      },
      {
        id: '4',
        title: 'Cinnamon Chips, Quillings & Featherings',
        short_desc: 'Premium cinnamon by-products. Excellent for oil extraction, tea blends and cooking.',
        full_desc: 'Our chips, quillings and featherings are carefully sorted from the cinnamon processing line. Rich in essential oils, these are ideal for oil distillation, herbal tea blends, potpourri and industrial food processing applications.',
        image_url: 'images/product_chips_quillings.jpg',
        display_order: 4,
        is_active: true,
        price: 950,
        discount: 50,
        stock_quantity: 300,
        delivery_charge: 350,
        total_sales: 65,
        card_type: 'product'
      },
      {
        id: '5',
        title: 'Ceylon Cinnamon Tea Cut',
        short_desc: 'Finely cut cinnamon pieces designed for perfect brewing. Pure and aromatic.',
        full_desc: 'Specifically cut to optimal size for tea brewing and herbal infusions. Our tea cut releases flavor and aroma evenly during steeping. 100% natural with no additives. Perfect for loose-leaf tea blends and sachets.',
        image_url: 'images/product_tea_cut.jpg',
        display_order: 5,
        is_active: true,
        price: 1200,
        discount: 0,
        stock_quantity: 150,
        delivery_charge: 350,
        total_sales: 45,
        card_type: 'product'
      },
      {
        id: '6',
        title: 'Ceylon Cinnamon Leaf Oil',
        short_desc: 'Steam-distilled pure leaf oil. High eugenol content for aromatherapy and wellness.',
        full_desc: 'Extracted through traditional steam distillation from fresh Ceylon Cinnamon leaves. Rich in eugenol (70-85%), this therapeutic-grade oil is perfect for aromatherapy, natural skincare formulations, massage blends and wellness products.',
        image_url: 'images/product_leaf_oil.jpg',
        display_order: 6,
        is_active: true,
        price: 2800,
        discount: 150,
        stock_quantity: 40,
        delivery_charge: 400,
        total_sales: 78,
        card_type: 'product'
      },
      {
        id: '7',
        title: 'Premium Ceylon Cinnamon Bark Oil',
        short_desc: 'Rare bark oil with high cinnamaldehyde content. The gold standard in essential oils.',
        full_desc: 'Our premium bark oil contains 60-75% cinnamaldehyde, making it one of the most potent and sought-after essential oils. Steam-distilled from the finest Ceylon Cinnamon bark. Used in premium perfumery, pharmaceutical applications and luxury wellness products.',
        image_url: 'images/cinnamon_spices.jpg',
        display_order: 7,
        is_active: true,
        price: 8500,
        discount: 500,
        stock_quantity: 15,
        delivery_charge: 500,
        total_sales: 35,
        card_type: 'product'
      },
      {
        id: '8',
        title: 'Cinnamon Herbal Infusions & Beverage Concepts',
        short_desc: 'Curated cinnamon-based herbal tea blends and innovative beverage solutions.',
        full_desc: 'Explore our range of cinnamon herbal infusions combining Ceylon Cinnamon with complementary herbs and spices. From classic cinnamon tea to innovative beverage concepts for the hospitality and wellness industry. Available as loose blends and tea bags.',
        image_url: 'images/cinnamon_srilanka.jpg',
        display_order: 8,
        is_active: true,
        price: 1500,
        discount: 0,
        stock_quantity: 100,
        delivery_charge: 350,
        total_sales: 55,
        card_type: 'product'
      },
      {
        id: '9',
        title: 'Cinnamon Heritage Gift Collection',
        short_desc: 'Luxury curated gift box featuring premium cinnamon products. Perfect for gifting.',
        full_desc: 'An elegantly packaged collection featuring our finest products: Premium Quills, Pure Powder, Leaf Oil and Herbal Infusions. Presented in a handcrafted wooden gift box with heritage branding. Ideal for corporate gifts, special occasions and discerning cinnamon enthusiasts.',
        image_url: 'images/product1_quills.png',
        display_order: 9,
        is_active: true,
        price: 12000,
        discount: 1000,
        stock_quantity: 20,
        delivery_charge: 600,
        total_sales: 25,
        card_type: 'product'
      },
      {
        id: '10',
        title: 'Bulk Supply, Private Label & Custom Development',
        short_desc: 'Partner with us for bulk orders, private labelling and bespoke product development.',
        full_desc: 'We offer comprehensive B2B solutions including bulk supply of all cinnamon grades, private label packaging with your branding, and custom product development. From concept to shelf-ready products, our team works with you to create tailored cinnamon solutions for your market.',
        image_url: 'images/estate_bg.png',
        display_order: 10,
        is_active: true,
        price: 0,
        discount: 0,
        stock_quantity: 999,
        delivery_charge: 0,
        total_sales: 0,
        card_type: 'contact'
      }
    ];
    
    for (const p of products) {
      const { id, ...fields } = p;
      await db.collection('products').doc(id).set(fields);
    }
    
    // Seed Process Steps
    const steps = [
      {
        id: '1',
        step_number: '01',
        title: 'Harvesting',
        short_desc: 'Mature stems are carefully harvested at dawn to ensure the highest concentration of bark essential oils.',
        full_desc: 'At our estates, skilled harvesters select mature branches (typically 2-3 years old) with optimal bark thickness. Harvesting takes place in the early morning when moisture content is highest, making the bark easier to peel and preserving the delicate aromatic compounds.',
        image_url: 'images/step1_harvest.png',
        display_order: 1,
        is_active: true
      },
      {
        id: '2',
        step_number: '02',
        title: 'Cleaning and Preparation',
        short_desc: 'Harvested stems are washed in pure filtered water and outer bark is scraped to ensure clean inner bark.',
        full_desc: 'Once harvested, the stems are immediately brought to our facility, washed thoroughly with clean water on stainless steel tables, and trimmed. The rough outer cork and green layers are scraped away to expose the golden-bronze inner bark underneath.',
        image_url: 'images/step2_wash.png',
        display_order: 2,
        is_active: true
      },
      {
        id: '3',
        step_number: '03',
        title: 'Scraping and Rubbing',
        short_desc: 'The inner bark is rubbed with a brass rod to loosen it, vital for clean, unbroken peeling.',
        full_desc: 'Artisans vigorously rub the prepared stems with a smooth brass rod. This traditional friction technique loosens the thin inner bark layer from the wood core, allowing it to be peeled in large, clean, unbroken sheets.',
        image_url: 'images/step3_scrape.png',
        display_order: 3,
        is_active: true
      },
      {
        id: '4',
        step_number: '04',
        title: 'Peeling',
        short_desc: 'Expert peelers make precise longitudinal cuts to slide the delicate inner bark off the wood.',
        full_desc: 'Highly trained artisans use custom curved stainless steel knives to make precise incisions. With immense dexterity, they slide the micro-thin sheets of inner bark off the wood core, taking care to minimize splitting.',
        image_url: 'images/step3_peel.png',
        display_order: 4,
        is_active: true
      },
      {
        id: '5',
        step_number: '05',
        title: 'Quill Making',
        short_desc: 'The thin inner bark is layered and rolled by hand into multi-layered cylindrical quills.',
        full_desc: 'The peeled bark sheets are immediately packed together, layered, and rolled into continuous cylindrical pipes called quills. The hollow center of each quill is carefully filled with smaller fragments of high-grade cinnamon bark (featherings and chips) to create a solid, uniform cylinder.',
        image_url: 'images/step5_quill.png',
        display_order: 5,
        is_active: true
      },
      {
        id: '6',
        step_number: '06',
        title: 'Drying',
        short_desc: 'Quills are shade-dried on coir racks, then finished in state-of-the-art mechanical dryers.',
        full_desc: 'The wet quills are initially hung and dried in shade-drying rooms on coconut coir racks to protect the sensitive cinnamaldehyde oils. Once cured, they undergo low-temperature mechanical drying to achieve a safe export-ready moisture content below 12%.',
        image_url: 'images/step4_dry.png',
        display_order: 6,
        is_active: true
      },
      {
        id: '7',
        step_number: '07',
        title: 'Grading, Cutting and Milling',
        short_desc: 'Quills are sorted into international export grades, then cut or milled into ultra-fine powder.',
        full_desc: 'Cinnamon quills are inspected and sorted into strict export grades (Alba, C5 Special, C5, C4, M5, H1, etc.) based on diameter, color, and density. Premium quills are cut to standard lengths, while select pieces are stone-milled into pure, micro-ground powder.',
        image_url: 'images/step7_grade.png',
        display_order: 7,
        is_active: true
      },
      {
        id: '8',
        step_number: '08',
        title: 'Essential-Oil Distillation',
        short_desc: 'Unused leaves and bark chips are steam-distilled into pure leaf and bark essential oils.',
        full_desc: 'To support zero-waste production, cinnamon leaves and bark chips are loaded into our state-of-the-art steam distillation chambers. Steam is passed through the organic matter, vaporizing the essential oils, which are then cooled, condensed, and separated to yield pure therapeutic-grade leaf and bark oils.',
        image_url: 'images/step8_distill.png',
        display_order: 8,
        is_active: true
      },
      {
        id: '9',
        step_number: '09',
        title: 'Packing and Storage',
        short_desc: 'Finished products are vacuum-packed and stored in climate-controlled warehouses.',
        full_desc: 'To protect against humidity and maintain absolute freshness, our cinnamon products are vacuum-sealed in hygienic food-grade packaging. They are stored in our climate-controlled warehouse, ready for shipping to international markets under strict quality certification.',
        image_url: 'images/step5_pack.png',
        display_order: 9,
        is_active: true
      }
    ];

    for (const s of steps) {
      const { id, ...fields } = s;
      await db.collection('process_steps').doc(id).set(fields);
    }
    
    // Seed Delivery Rates
    const rates = [
      { province: 'Western', district: 'Colombo', rate: 300 },
      { province: 'Western', district: 'Gampaha', rate: 350 },
      { province: 'Western', district: 'Kalutara', rate: 350 },
      { province: 'Central', district: 'Kandy', rate: 450 },
      { province: 'Central', district: 'Matale', rate: 450 },
      { province: 'Central', district: 'Nuwara Eliya', rate: 500 },
      { province: 'Southern', district: 'Galle', rate: 400 },
      { province: 'Southern', district: 'Matara', rate: 400 },
      { province: 'Southern', district: 'Hambantota', rate: 450 },
      { province: 'Northern', district: 'Jaffna', rate: 600 },
      { province: 'Northern', district: 'Kilinochchi', rate: 600 },
      { province: 'Northern', district: 'Mannar', rate: 600 },
      { province: 'Northern', district: 'Vavuniya', rate: 550 },
      { province: 'Northern', district: 'Mullaitivu', rate: 600 },
      { province: 'Eastern', district: 'Trincomalee', rate: 550 },
      { province: 'Eastern', district: 'Batticaloa', rate: 550 },
      { province: 'Eastern', district: 'Ampara', rate: 550 },
      { province: 'North Western', district: 'Kurunegala', rate: 400 },
      { province: 'North Western', district: 'Puttalam', rate: 450 },
      { province: 'North Central', district: 'Anuradhapura', rate: 500 },
      { province: 'North Central', district: 'Polonnaruwa', rate: 500 },
      { province: 'Uva', district: 'Badulla', rate: 550 },
      { province: 'Uva', district: 'Moneragala', rate: 550 },
      { province: 'Sabaragamuwa', district: 'Ratnapura', rate: 450 },
      { province: 'Sabaragamuwa', district: 'Kegalle', rate: 400 }
    ];
    
    for (const r of rates) {
      // Use clean document IDs for delivery rates to avoid duplicates (e.g. province_district)
      const docId = `${r.province.replace(/\s+/g, '_')}_${r.district.replace(/\s+/g, '_')}`;
      await db.collection('delivery_rates').doc(docId).set({
        ...r,
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    // Seed FAQs
    const faqs = [
      { id: '1', question: 'What is Ceylon Cinnamon?', answer: 'Ceylon Cinnamon (Cinnamomum verum) is the "true cinnamon" native to Sri Lanka. It is distinguished by its delicate, multi-layered quills, light tan colour, subtle sweet flavour, and ultra-low coumarin content \u2014 making it the safest and most premium variety for daily culinary and wellness use.', display_order: 1, is_active: true },
      { id: '2', question: 'What is the difference between Ceylon Cinnamon and Cassia?', answer: 'Ceylon Cinnamon has thin, multi-layered bark, a mild sweet taste, and contains only trace amounts of coumarin (0.004%). Cassia (Cinnamomum cassia) has a single thick bark layer, a stronger spicy taste, and significantly higher coumarin levels (up to 1%), which can be harmful in large doses. Ceylon is considered the premium, health-safe choice.', display_order: 2, is_active: true },
      { id: '3', question: 'Do you supply cinnamon in bulk?', answer: 'Yes. We offer comprehensive bulk supply for wholesalers, distributors, food manufacturers and hospitality businesses. Our minimum order quantities are flexible, and we provide competitive pricing for large volumes across all product lines \u2014 quills, powder, chips, tea cut, and essential oils.', display_order: 3, is_active: true },
      { id: '4', question: 'What is Ceylon Cinnamon Leaf Oil?', answer: 'Cinnamon Leaf Oil is steam-distilled from fresh Ceylon Cinnamon leaves. It is rich in eugenol (70\u201385%) and is widely used in aromatherapy, natural skincare, massage therapy, and as a natural antiseptic. It has a warm, spicy-clove aroma.', display_order: 4, is_active: true },
      { id: '5', question: 'What is Ceylon Cinnamon Bark Oil?', answer: 'Cinnamon Bark Oil is steam-distilled from the inner bark of the Ceylon Cinnamon tree. It contains 60\u201375% cinnamaldehyde, making it one of the most potent essential oils available. It is used in premium perfumery, pharmaceutical applications, and high-end wellness products.', display_order: 5, is_active: true },
      { id: '6', question: 'What is the difference between Leaf Oil and Bark Oil?', answer: 'Leaf Oil is rich in eugenol (clove-like aroma) and is more affordable, making it popular for aromatherapy and skincare. Bark Oil is rich in cinnamaldehyde (warm cinnamon aroma), is rarer and more expensive, and is prized in perfumery and pharmaceutical use. Both are 100% pure and steam-distilled.', display_order: 6, is_active: true },
      { id: '7', question: 'Are your essential oils safe for direct use?', answer: 'Our essential oils are 100% pure and therapeutic-grade. However, they are highly concentrated and must be diluted with a carrier oil before topical application. They are not intended for internal consumption. Always perform a patch test and consult a healthcare professional if you have sensitivities.', display_order: 7, is_active: true },
      { id: '8', question: 'Do you offer Private Label / White Label services?', answer: 'Yes. We provide full private label and white label packaging services. You supply your branding and we handle everything from sourcing and processing to packaging and labelling, delivering shelf-ready products under your brand name.', display_order: 8, is_active: true },
      { id: '9', question: 'Can you provide a Certificate of Analysis (COA)?', answer: 'Absolutely. Every batch we produce is accompanied by a Certificate of Analysis from accredited laboratories. Our COAs include moisture content, volatile oil content, ash levels, coumarin levels, and microbiological test results.', display_order: 9, is_active: true },
      { id: '10', question: 'What certifications do you hold?', answer: 'Cinnamon Heritage holds ISO 22000 (Food Safety Management), HACCP (Hazard Analysis Critical Control Points), and Sri Lanka Standards Institution (SLSI) certifications. Our farming practices are sustainable and our products are 100% natural with no additives or preservatives.', display_order: 10, is_active: true },
      { id: '11', question: 'Can we visit your estate or processing facility?', answer: 'Yes! We welcome visits to our cinnamon estate and processing facility in Galle, Sri Lanka. Experience the entire cinnamon journey from plantation to product. Please contact us in advance to arrange a guided tour and tasting session.', display_order: 11, is_active: true },
      { id: '12', question: 'Do you ship internationally?', answer: 'Yes, we export to markets worldwide including Europe, North America, the Middle East, and East Asia. All shipments are professionally packed in food-grade, humidity-controlled containers. We handle customs documentation and provide CIF/FOB pricing depending on your requirements.', display_order: 12, is_active: true },
      { id: '13', question: 'Does cinnamon have medicinal properties?', answer: 'While Ceylon Cinnamon has been used in traditional medicine for centuries, we do not make specific medical claims about our products. Published scientific research suggests potential benefits for blood sugar regulation, anti-inflammatory properties, and antioxidant content. We recommend consulting a healthcare professional for medical advice.', display_order: 13, is_active: true }
    ];

    for (const f of faqs) {
      const { id, ...fields } = f;
      await db.collection('faqs').doc(id).set(fields);
    }

    console.log("Firestore seeding completed successfully!");
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

// ============================================================
// AUTH HELPERS
// ============================================================

/** Generic user login */
async function authLogin(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const userId = userCredential.user.uid;
    
    // Check if profile exists
    let profileDoc = await db.collection('profiles').doc(userId).get();
    
    // If no profile document exists, create default customer profile
    if (!profileDoc.exists) {
      const newProfile = {
        id: userId,
        username: email.split('@')[0],
        email: email,
        role: 'customer',
        is_approved: true,
        status: 'approved',
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('profiles').doc(userId).set(newProfile);
      profileDoc = await db.collection('profiles').doc(userId).get();
    }
    
    const profile = profileDoc.data();

    // Check if admin account is pending approval
    const isPendingAdmin = profile.role === 'admin' && (profile.is_approved !== true || profile.status === 'pending');
    if (isPendingAdmin) {
      await auth.signOut();
      return {
        success: false,
        isPending: true,
        role: 'admin',
        error: 'Your admin account is pending approval. Please wait for an administrator to approve your account before logging in.'
      };
    }
    
    return { 
      success: true, 
      userId: userId,
      username: profile.username || (profile.first_name ? `${profile.first_name} ${profile.last_name}` : email.split('@')[0]),
      role: profile.role || 'customer',
      is_approved: profile.is_approved !== false,
      status: profile.status || 'approved',
      profile: profile
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/** Generic user signup with support for custom fields */
async function authSignup(username, email, password, extraData = {}) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const userId = userCredential.user.uid;
    
    const role = extraData.role || 'customer';

    // When an admin account is created, it ALWAYS defaults to is_approved: false and status: 'pending'
    const isApproved = role === 'admin' ? false : true;
    const status = role === 'admin' ? 'pending' : 'approved';
    
    const profile = {
      id: userId,
      username: username || email.split('@')[0],
      email: email,
      role: role,
      first_name: extraData.first_name || '',
      last_name: extraData.last_name || '',
      mobile: extraData.mobile || '',
      nic: extraData.nic || '',
      city: extraData.city || '',
      profile_pic_url: extraData.profile_pic_url || '',
      is_approved: isApproved,
      status: status,
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      cart_items: []
    };
    
    await db.collection('profiles').doc(userId).set(profile);

    // If the new account is an admin, sign out immediately so they cannot bypass login until approved
    if (role === 'admin') {
      await auth.signOut();
    }
    
    const msg = role === 'admin'
      ? 'Admin account created! Your account status is Pending approval. Please wait for an administrator to approve your account before logging in.'
      : 'Account created successfully!';
      
    return { 
      success: true, 
      message: msg, 
      role: profile.role, 
      is_approved: isApproved, 
      status: status, 
      user: profile 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/** Logout */
async function authLogout() {
  await auth.signOut();
  location.reload();
}

/** Check current auth session */
async function authStatus() {
  return new Promise((resolve) => {
    // Unsubscribe immediately after first call to avoid listener accumulation
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe(); // Remove listener after first fire
      if (!user) {
        resolve({ isLoggedIn: false, username: null });
        return;
      }
      
      try {
        const profileDoc = await db.collection('profiles').doc(user.uid).get();
        const profile = profileDoc.exists ? profileDoc.data() : null;

        // If admin account is not approved or is pending, sign out immediately
        if (profile?.role === 'admin' && (profile?.is_approved !== true || profile?.status === 'pending')) {
          await auth.signOut();
          resolve({ isLoggedIn: false, isPending: true, role: 'admin', is_approved: false });
          return;
        }

        resolve({
          isLoggedIn: true,
          userId: user.uid,
          isAdmin: profile?.role === 'admin' && profile?.is_approved === true,
          username: profile?.username || (profile?.first_name ? `${profile.first_name} ${profile.last_name}` : user.email),
          role: profile?.role ?? 'customer',
          status: profile?.status ?? 'approved',
          profile: profile
        });
      } catch (e) {
        resolve({ isLoggedIn: true, isAdmin: false, username: user.email, role: 'customer' });
      }
    });
  });
}

/** Forgot password */
async function authForgotPassword(email) {
  try {
    await auth.sendPasswordResetEmail(email, {
      url: window.location.origin + '/admin.html'
    });
    return { success: true, message: 'Password reset email sent! Check your inbox.' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/** Get cart items from profile */
async function getCartItems(userId) {
  try {
    const doc = await db.collection('profiles').doc(userId).get();
    if (doc.exists) {
      return doc.data().cart_items || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to get cart items:", error);
    return [];
  }
}

/** Save cart items to profile */
async function saveCartItems(userId, cartItems) {
  try {
    await db.collection('profiles').doc(userId).set({
      cart_items: cartItems,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Failed to save cart items:", error);
    return { success: false, error: error.message };
  }
}

/** Update profile picture */
async function updateProfilePicture(userId, url) {
  try {
    await db.collection('profiles').doc(userId).update({
      profile_pic_url: url,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile pic:", error);
    return { success: false, error: error.message };
  }
}

/** Update general profile data */
async function updateProfileData(userId, fields) {
  try {
    await db.collection('profiles').doc(userId).update({
      ...fields,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile data:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// SITE CONTENT HELPERS
// ============================================================

/** GET all site content */
async function getContent() {
  await seedDatabaseIfNeeded();
  return serveFromCache('cache_content', async () => {
    const snapshot = await db.collection('site_content').get();
    const content = {};
    snapshot.forEach(doc => {
      content[doc.id] = doc.data();
    });
    return content;
  });
}

/** Upsert multiple site content fields at once */
async function saveContentFields(section_name, fields) {
  try {
    await db.collection('site_content').doc(section_name).set({
      ...fields,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    invalidateCache('cache_content');
  } catch (error) {
    console.error("Error saving content fields:", error);
    throw error;
  }
}

/** Upsert site content field */
async function saveContentField(section_name, field_name, field_value) {
  return saveContentFields(section_name, { [field_name]: field_value });
}

/** Get FAQ background image */
async function getFaqBackground() {
  try {
    const content = await getContent();
    return content?.faq?.background_image || null;
  } catch (error) {
    console.error("Error getting FAQ background:", error);
    return null;
  }
}

/** Update FAQ background image */
async function updateFaqBackground(imageUrl) {
  try {
    await saveContentFields('faq', { background_image: imageUrl });
  } catch (error) {
    console.error("Error updating FAQ background:", error);
    throw error;
  }
}

// ============================================================
// PRODUCTS HELPERS
// ============================================================

/** GET active products */
async function getProducts() {
  await seedDatabaseIfNeeded();
  return serveFromCache('cache_products', async () => {
    // Get all products ordered by display_order
    const snapshot = await db.collection('products')
      .orderBy('display_order')
      .get();
      
    const productsList = [];
    snapshot.forEach(doc => {
      productsList.push({ id: doc.id, ...doc.data() });
    });
    
    // Filter active products client-side to avoid composite index requirements
    return productsList
      .filter(p => p.is_active !== false)
      .map(p => ({
        ...p,
        total_sales: p.total_sales || 0
      }));
  });
}

/** GET all products (admin) */
async function getProductsAdmin() {
  await seedDatabaseIfNeeded();
  try {
    const snapshot = await db.collection('products')
      .orderBy('display_order')
      .get();
      
    const productsList = [];
    snapshot.forEach(doc => {
      productsList.push({ id: doc.id, ...doc.data() });
    });
    
    return productsList.map(p => ({
      ...p,
      total_sales: p.total_sales || 0
    }));
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return [];
  }
}

/** GET single product by ID */
async function getProduct(id) {
  await seedDatabaseIfNeeded();
  try {
    const doc = await db.collection('products').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

/** UPDATE product */
async function updateProduct(id, fields) {
  try {
    await db.collection('products').doc(id).update({
      ...fields,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    invalidateCache('cache_products');
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

/** CREATE product */
async function createProduct(fields) {
  try {
    // Generate simple incremental string ID or use Firestore auto ID.
    // For compatibility with sequential number IDs if desired:
    const snapshot = await db.collection('products').get();
    let maxId = 0;
    snapshot.forEach(doc => {
      const numId = parseInt(doc.id);
      if (!isNaN(numId) && numId > maxId) {
        maxId = numId;
      }
    });
    const newId = String(maxId + 1);
    
    const prodData = {
      ...fields,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('products').doc(newId).set(prodData);
    invalidateCache('cache_products');
    return { id: newId, ...prodData };
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

/** DELETE product */
async function deleteProductById(id) {
  try {
    await db.collection('products').doc(id).delete();
    invalidateCache('cache_products');
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

// ============================================================
// IMAGE UPLOAD (CLOUDINARY IMAGE HOSTING)
// ============================================================

const CLOUDINARY_CLOUD_NAME = "dqeptzlsb";
const CLOUDINARY_UPLOAD_PRESET = "flutter_mediq_upload";

/** Upload image to Cloudinary with optional progress callback (0–100) */
function uploadImageWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } catch (e) {
          reject(new Error('Invalid Cloudinary response'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error?.message || 'Failed to upload image to Cloudinary'));
        } catch (e) {
          reject(new Error('Failed to upload image to Cloudinary'));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.open('POST', url);
    xhr.send(formData);
  });
}

/** Upload image to Cloudinary using direct fetch REST API */
async function uploadImage(file, bucket = 'unused') {
  try {
    return await uploadImageWithProgress(file);
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}

// ============================================================
// PROCESS STEPS HELPERS
// ============================================================

/** GET active process steps */
async function getProcessSteps() {
  await seedDatabaseIfNeeded();
  return serveFromCache('cache_process_steps', async () => {
    const snapshot = await db.collection('process_steps')
      .orderBy('display_order')
      .get();
      
    const stepsList = [];
    snapshot.forEach(doc => {
      stepsList.push({ id: doc.id, ...doc.data() });
    });
    
    // Filter active steps client-side to avoid composite index requirements
    return stepsList.filter(s => s.is_active !== false);
  });
}

/** GET all process steps (admin) */
async function getProcessStepsAdmin() {
  await seedDatabaseIfNeeded();
  try {
    const snapshot = await db.collection('process_steps')
      .orderBy('display_order')
      .get();
      
    const stepsList = [];
    snapshot.forEach(doc => {
      stepsList.push({ id: doc.id, ...doc.data() });
    });
    return stepsList;
  } catch (error) {
    console.error("Error fetching admin process steps:", error);
    return [];
  }
}

/** UPDATE step */
async function updateStep(id, fields) {
  try {
    await db.collection('process_steps').doc(String(id)).update({
      ...fields,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    invalidateCache('cache_process_steps');
  } catch (error) {
    console.error("Error updating step:", error);
    throw error;
  }
}

/** CREATE step */
async function createStep(fields) {
  try {
    // Generate incremental string ID
    const snapshot = await db.collection('process_steps').get();
    let maxId = 0;
    snapshot.forEach(doc => {
      const numId = parseInt(doc.id);
      if (!isNaN(numId) && numId > maxId) {
        maxId = numId;
      }
    });
    const newId = String(maxId + 1);
    
    const stepData = {
      ...fields,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('process_steps').doc(newId).set(stepData);
    invalidateCache('cache_process_steps');
    return { id: newId, ...stepData };
  } catch (error) {
    console.error("Error creating step:", error);
    throw error;
  }
}

/** DELETE step */
async function deleteStepById(id) {
  try {
    await db.collection('process_steps').doc(String(id)).delete();
    invalidateCache('cache_process_steps');
  } catch (error) {
    console.error("Error deleting step:", error);
    throw error;
  }
}

async function seedFaqsIfNeeded() {
  try {
    const snapshot = await db.collection('faqs').limit(1).get();
    if (!snapshot.empty) return; // Already seeded
    
    console.log("Seeding FAQs collection...");
    const faqs = [
      { question: 'What is Ceylon Cinnamon?', answer: 'Ceylon Cinnamon (Cinnamomum verum) is the "true cinnamon" native to Sri Lanka. It is distinguished by its delicate, multi-layered quills, light tan colour, subtle sweet flavour, and ultra-low coumarin content — making it the safest and most premium variety for daily culinary and wellness use.', display_order: 1, is_active: true },
      { question: 'What is the difference between Ceylon Cinnamon and Cassia?', answer: 'Ceylon Cinnamon has thin, multi-layered bark, a mild sweet taste, and contains only trace amounts of coumarin (0.004%). Cassia (Cinnamomum cassia) has a single thick bark layer, a stronger spicy taste, and significantly higher coumarin levels (up to 1%), which can be harmful in large doses. Ceylon is considered the premium, health-safe choice.', display_order: 2, is_active: true },
      { question: 'Do you supply cinnamon in bulk?', answer: 'Yes. We offer comprehensive bulk supply for wholesalers, distributors, food manufacturers and hospitality businesses. Our minimum order quantities are flexible, and we provide competitive pricing for large volumes across all product lines — quills, powder, chips, tea cut, and essential oils.', display_order: 3, is_active: true },
      { question: 'What is Ceylon Cinnamon Leaf Oil?', answer: 'Cinnamon Leaf Oil is steam-distilled from fresh Ceylon Cinnamon leaves. It is rich in eugenol (70–85%) and is widely used in aromatherapy, natural skincare, massage therapy, and as a natural antiseptic. It has a warm, spicy-clove aroma.', display_order: 4, is_active: true },
      { question: 'What is Ceylon Cinnamon Bark Oil?', answer: 'Cinnamon Bark Oil is steam-distilled from the inner bark of the Ceylon Cinnamon tree. It contains 60–75% cinnamaldehyde, making it one of the most potent essential oils available. It is used in premium perfumery, pharmaceutical applications, and high-end wellness products.', display_order: 5, is_active: true },
      { question: 'What is the difference between Leaf Oil and Bark Oil?', answer: 'Leaf Oil is rich in eugenol (clove-like aroma) and is more affordable, making it popular for aromatherapy and skincare. Bark Oil is rich in cinnamaldehyde (warm cinnamon aroma), is rarer and more expensive, and is prized in perfumery and pharmaceutical use. Both are 100% pure and steam-distilled.', display_order: 6, is_active: true },
      { question: 'Are your essential oils safe for direct use?', answer: 'Our essential oils are 100% pure and therapeutic-grade. However, they are highly concentrated and must be diluted with a carrier oil before topical application. They are not intended for internal consumption. Always perform a patch test and consult a healthcare professional if you have sensitivities.', display_order: 7, is_active: true },
      { question: 'Do you offer Private Label / White Label services?', answer: 'Yes. We provide full private label and white label packaging services. You supply your branding and we handle everything from sourcing and processing to packaging and labelling, delivering shelf-ready products under your brand name.', display_order: 8, is_active: true },
      { question: 'Can you provide a Certificate of Analysis (COA)?', answer: 'Absolutely. Every batch we produce is accompanied by a Certificate of Analysis from accredited laboratories. Our COAs include moisture content, volatile oil content, ash levels, coumarin levels, and microbiological test results.', display_order: 9, is_active: true },
      { question: 'What certifications do you hold?', answer: 'Cinnamon Heritage holds ISO 22000 (Food Safety Management), HACCP (Hazard Analysis Critical Control Points), and Sri Lanka Standards Institution (SLSI) certifications. Our farming practices are sustainable and our products are 100% natural with no additives or preservatives.', display_order: 10, is_active: true },
      { question: 'Can we visit your estate or processing facility?', answer: 'Yes! We welcome visits to our cinnamon estate and processing facility in Galle, Sri Lanka. Experience the entire cinnamon journey from plantation to product. Please contact us in advance to arrange a guided tour and tasting session.', display_order: 11, is_active: true },
      { question: 'Do you ship internationally?', answer: 'Yes, we export to markets worldwide including Europe, North America, the Middle East, and East Asia. All shipments are professionally packed in food-grade, humidity-controlled containers. We handle customs documentation and provide CIF/FOB pricing depending on your requirements.', display_order: 12, is_active: true },
      { question: 'Does cinnamon have medicinal properties?', answer: 'While Ceylon Cinnamon has been used in traditional medicine for centuries, we do not make specific medical claims about our products. Published scientific research suggests potential benefits for blood sugar regulation, anti-inflammatory properties, and antioxidant content. We recommend consulting a healthcare professional for medical advice.', display_order: 13, is_active: true }
    ];

    for (let i = 0; i < faqs.length; i++) {
      const id = String(i + 1);
      await db.collection('faqs').doc(id).set(faqs[i]);
    }
    console.log("FAQs seeded successfully!");
  } catch (err) {
    console.error("Error seeding FAQs:", err);
  }
}

// ============================================================
// FAQ HELPERS
// ============================================================

/** GET active FAQs */
async function getFaqs() {
  await seedDatabaseIfNeeded();
  await seedFaqsIfNeeded();
  return serveFromCache('cache_faqs', async () => {
    const snapshot = await db.collection('faqs')
      .where('is_active', '==', true)
      .orderBy('display_order')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });
}

/** GET all FAQs (admin) */
async function getFaqsAdmin() {
  await seedDatabaseIfNeeded();
  await seedFaqsIfNeeded();
  try {
    const snapshot = await db.collection('faqs')
      .orderBy('display_order')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching admin FAQs:", error);
    return [];
  }
}

/** UPDATE FAQ */
async function updateFaq(id, fields) {
  try {
    await db.collection('faqs').doc(String(id)).update({
      ...fields,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    invalidateCache('cache_faqs');
  } catch (error) {
    console.error("Error updating FAQ:", error);
    throw error;
  }
}

/** CREATE FAQ */
async function createFaq(fields) {
  try {
    const snapshot = await db.collection('faqs').get();
    let maxId = 0;
    snapshot.forEach(doc => {
      const numId = parseInt(doc.id);
      if (!isNaN(numId) && numId > maxId) maxId = numId;
    });
    const newId = String(maxId + 1);
    const faqData = {
      ...fields,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('faqs').doc(newId).set(faqData);
    invalidateCache('cache_faqs');
    return { id: newId, ...faqData };
  } catch (error) {
    console.error("Error creating FAQ:", error);
    throw error;
  }
}

/** DELETE FAQ */
async function deleteFaqById(id) {
  try {
    await db.collection('faqs').doc(String(id)).delete();
    invalidateCache('cache_faqs');
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    throw error;
  }
}

/** Subscribe to FAQ changes in real-time */
function subscribeToFaqs(callback) {
  return db.collection('faqs')
    .where('is_active', '==', true)
    .orderBy('display_order')
    .onSnapshot(
      snapshot => {
        invalidateCache('cache_faqs');
        const faqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(faqs);
      },
      err => console.error('FAQ listener error:', err)
    );
}

// ============================================================
// ORDERS HELPERS
// ============================================================

/** Place order (using Firestore transactions to atomically decrement stock for all items) */
async function placeOrder(orderData) {
  try {
    let finalOrderId = 'CH-' + Date.now() + '-' + Math.floor(Math.random() * 100);
    
    // Normalize order items (supports single-product parameter for backwards compatibility)
    let items = [];
    if (orderData.order_items && Array.isArray(orderData.order_items)) {
      items = orderData.order_items;
    } else {
      items = [{
        product_id:   String(orderData.product_id),
        product_name: orderData.product_name,
        quantity:     parseInt(orderData.quantity ?? 1),
        unit_price:   parseFloat(orderData.unit_price)
      }];
    }
    
    await db.runTransaction(async (transaction) => {
      // 1. Fetch all product documents first
      const productDocs = [];
      for (const item of items) {
        const ref = db.collection('products').doc(String(item.product_id));
        const doc = await transaction.get(ref);
        if (!doc.exists) {
          throw new Error(`Product "${item.product_name}" does not exist!`);
        }
        productDocs.push({ ref, doc, item });
      }

      // 2. Perform stock validation & update
      for (const { ref, doc, item } of productDocs) {
        const currentStock = doc.data().stock_quantity ?? 0;
        const purchaseQty = item.quantity;
        const currentSales = doc.data().total_sales ?? 0;
        
        if (currentStock < purchaseQty) {
          throw new Error(`Insufficient stock available for "${item.product_name}"!`);
        }
        
        transaction.update(ref, {
          stock_quantity: currentStock - purchaseQty,
          total_sales: currentSales + purchaseQty,
          updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // 3. Write the order document
      const orderRef = db.collection('orders').doc(finalOrderId);
      transaction.set(orderRef, {
        customer_name:    orderData.customer_name,
        customer_email:   orderData.customer_email,
        customer_phone:   orderData.customer_phone,
        shipping_address: orderData.shipping_address,
        subtotal:         parseFloat(orderData.subtotal),
        discount_total:   parseFloat(orderData.discount_total || 0),
        delivery_charge:  parseFloat(orderData.delivery_charge || 0),
        total_amount:     parseFloat(orderData.total_amount),
        status:           'Pending',
        payment_method:   orderData.payment_method ?? 'COD',
        district:         orderData.district ?? null,
        province:         orderData.province ?? null,
        bank_reference:   orderData.bank_reference ?? null,
        created_at:       firebase.firestore.FieldValue.serverTimestamp(),
        order_items:      items
      });
    });
    
    return { success: true, order_id: finalOrderId };
  } catch (error) {
    console.error("Place order failed:", error);
    return { success: false, error: error.message };
  }
}

/** GET all orders (admin) */
async function getOrders() {
  await seedDatabaseIfNeeded();
  try {
    const snapshot = await db.collection('orders')
      .orderBy('created_at', 'desc')
      .get();
      
    const ordersList = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Ensure created_at date works whether Firestore timestamp or string
      let created_at = new Date().toISOString();
      if (data.created_at) {
        created_at = data.created_at.toDate ? data.created_at.toDate().toISOString() : data.created_at;
      }
      
      ordersList.push({
        id: doc.id,
        ...data,
        created_at,
        // Flatten for compatibility with original admin UI script
        product_name:  data.order_items?.[0]?.product_name ?? '',
        item_quantity: data.order_items?.[0]?.quantity ?? 0,
        unit_price:    data.order_items?.[0]?.unit_price ?? 0
      });
    });
    return ordersList;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

/** UPDATE order status */
async function updateOrderStatus(id, status) {
  try {
    await db.collection('orders').doc(String(id)).update({ 
      status,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

/** Subscribe to user orders by email for real-time tracking */
function subscribeToUserOrders(email, callback) {
  if (!email) return () => {};
  try {
    const cleanEmail = email.trim().toLowerCase();
    return db.collection('orders')
      .onSnapshot(snapshot => {
        const orders = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          const orderEmail = (data.customer_email || '').trim().toLowerCase();
          if (orderEmail === cleanEmail) {
            let created_at = new Date().toISOString();
            if (data.created_at) {
              created_at = data.created_at.toDate ? data.created_at.toDate().toISOString() : data.created_at;
            }
            orders.push({
              id: doc.id,
              ...data,
              created_at
            });
          }
        });
        // Sort descending by created_at date
        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        callback(orders);
      }, err => {
        console.error("subscribeToUserOrders error:", err);
      });
  } catch (err) {
    console.error("subscribeToUserOrders init error:", err);
    return () => {};
  }
}

/** DELETE order */
async function deleteOrderById(id) {
  try {
    await db.collection('orders').doc(String(id)).delete();
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
}

// ============================================================
// CONTACT MESSAGES HELPERS
// ============================================================

/** Submit contact message */
async function submitContact({ from_name, from_email, phone, subject, message }) {
  try {
    await db.collection('contact_messages').add({
      name: from_name,
      email: from_email,
      phone: phone || null,
      subject: subject || null,
      message,
      is_read: false,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Error submitting contact message:", error);
    throw error;
  }
}

/** GET all messages (admin) */
async function getMessages() {
  await seedDatabaseIfNeeded();
  try {
    const snapshot = await db.collection('contact_messages')
      .orderBy('created_at', 'desc')
      .get();
      
    const messagesList = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      let created_at = new Date().toISOString();
      if (data.created_at) {
        created_at = data.created_at.toDate ? data.created_at.toDate().toISOString() : data.created_at;
      }
      messagesList.push({
        id: doc.id,
        ...data,
        created_at
      });
    });
    return messagesList;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

/** Mark message read */
async function markMessageRead(id) {
  try {
    await db.collection('contact_messages').doc(String(id)).update({ is_read: true });
  } catch (error) {
    console.error("Error marking message read:", error);
    throw error;
  }
}

/** DELETE message */
async function deleteMessageById(id) {
  try {
    await db.collection('contact_messages').doc(String(id)).delete();
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
}

// ============================================================
// SETTINGS & DELIVERY RATES HELPERS
// ============================================================

/** GET settings */
async function getSettings() {
  await seedDatabaseIfNeeded();
  return serveFromCache('cache_settings', async () => {
    const snapshot = await db.collection('site_settings').get();
    const settings = {};
    snapshot.forEach(doc => {
      settings[doc.id] = doc.data().value;
    });
    return settings;
  });
}

/** Upsert setting */
async function saveSetting(key, value) {
  try {
    await db.collection('site_settings').doc(key).set({
      value: value,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    invalidateCache('cache_settings');
  } catch (error) {
    console.error("Error saving setting:", error);
    throw error;
  }
}

/** GET delivery rates */
async function getDeliveryRates() {
  await seedDatabaseIfNeeded();
  try {
    const snapshot = await db.collection('delivery_rates').get();
      
    const ratesList = [];
    snapshot.forEach(doc => {
      ratesList.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort client-side to avoid composite index requirements
    return ratesList.sort((a, b) => {
      if (a.province < b.province) return -1;
      if (a.province > b.province) return 1;
      if (a.district < b.district) return -1;
      if (a.district > b.district) return 1;
      return 0;
    });
  } catch (error) {
    console.error("Error fetching delivery rates:", error);
    return [];
  }
}

/** Update delivery rate */
async function updateDeliveryRateById(id, rate) {
  try {
    await db.collection('delivery_rates').doc(String(id)).update({
      rate: parseFloat(rate)
    });
  } catch (error) {
    console.error("Error updating delivery rate:", error);
    throw error;
  }
}

// ============================================================
// ANALYTICS (ADMIN)
// ============================================================

/** Dashboard stats */
async function getDashboardStats() {
  try {
    const [messagesList, activeProds, stepsList, ordersList] = await Promise.all([
      getMessages(),
      db.collection('products').where('is_active', '==', true).get(),
      db.collection('process_steps').where('is_active', '==', true).get(),
      getOrders()
    ]);

    const todayStr = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    let earningsToday = 0;
    let earningsMonth = 0;
    let totalEarnings = 0;

    ordersList.forEach(o => {
      if (o.status !== 'Cancelled') {
        const amt = Number(o.total_amount || 0);
        totalEarnings += amt;
        
        const oDate = new Date(o.created_at);
        const oDateStr = oDate.toISOString().split('T')[0];
        
        if (oDateStr === todayStr) {
          earningsToday += amt;
        }
        if (oDate >= firstDayOfMonth) {
          earningsMonth += amt;
        }
      }
    });

    // Group sales performance count client-side
    const salesMapByName = {};
    const salesMapById = {};
    ordersList.forEach(o => {
      if (o.status !== 'Cancelled' && o.order_items) {
        o.order_items.forEach(item => {
          const prodName = item.product_name;
          const prodId = item.product_id;
          salesMapByName[prodName] = (salesMapByName[prodName] || 0) + item.quantity;
          if (prodId) {
            salesMapById[prodId] = (salesMapById[prodId] || 0) + item.quantity;
          }
        });
      }
    });

    const activeProductsList = [];
    activeProds.forEach(doc => {
      const data = doc.data();
      const calculatedSales = salesMapById[doc.id] || salesMapByName[data.title] || 0;
      
      // Self-healing check: if the total_sales field is missing or incorrect, update it in Firestore
      if (data.total_sales !== calculatedSales) {
        db.collection('products').doc(doc.id).update({
          total_sales: calculatedSales
        }).catch(err => console.error("Self-healing update failed for product:", doc.id, err));
      }

      activeProductsList.push({
        title: data.title,
        stock_quantity: data.stock_quantity ?? 0,
        sales: salesMapByName[data.title] || 0
      });
    });

    const inProgressOrders = ordersList.filter(o => o.status === 'In Progress').length;
    const pendingOrders    = ordersList.filter(o => o.status === 'Pending').length;
    const packedOrders     = ordersList.filter(o => o.status === 'Packed').length;
    const shippedOrders    = ordersList.filter(o => o.status === 'Shipped').length;
    const completedOrders  = ordersList.filter(o => o.status === 'Completed' || o.status === 'Delivered').length;
    const cancelledOrders  = ordersList.filter(o => o.status === 'Cancelled').length;

    return {
      totalMessages:    messagesList.length,
      unreadMessages:   messagesList.filter(m => !m.is_read).length,
      totalProducts:    activeProds.size,
      totalSteps:       stepsList.size,
      totalOrders:      ordersList.length,
      inProgressOrders,
      pendingOrders,
      packedOrders,
      shippedOrders,
      completedOrders,
      cancelledOrders,
      earningsToday,
      earningsMonth,
      totalEarnings,
      productSales:     activeProductsList
    };
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
    return {
      totalMessages: 0, unreadMessages: 0, totalProducts: 0, totalSteps: 0, totalOrders: 0,
      inProgressOrders: 0, pendingOrders: 0, packedOrders: 0, shippedOrders: 0, completedOrders: 0, cancelledOrders: 0,
      earningsToday: 0, earningsMonth: 0, totalEarnings: 0, productSales: []
    };
  }
}

/** Accounts analytics */
async function getAccountsData() {
  try {
    const orders = await getOrders();
    const nonCancelled = orders.filter(o => o.status !== 'Cancelled');
    
    // 1. Daily revenue (last 30 days)
    const dailyMap = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    nonCancelled.forEach(o => {
      const oDate = new Date(o.created_at);
      if (oDate >= thirtyDaysAgo) {
        const dateStr = oDate.toISOString().split('T')[0];
        dailyMap[dateStr] = (dailyMap[dateStr] || 0) + Number(o.total_amount || 0);
      }
    });
    
    const dailyRevenue = Object.entries(dailyMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 2. Monthly revenue
    const monthlyMap = {};
    nonCancelled.forEach(o => {
      const oDate = new Date(o.created_at);
      const monthStr = `${oDate.getFullYear()}-${String(oDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[monthStr] = (monthlyMap[monthStr] || 0) + Number(o.total_amount || 0);
    });
    const monthlyRevenue = Object.entries(monthlyMap)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 3. Location revenue (districts)
    const locMap = {};
    nonCancelled.forEach(o => {
      const dist = o.district || 'Unknown';
      if (!locMap[dist]) locMap[dist] = { district: dist, orders: 0, revenue: 0 };
      locMap[dist].orders++;
      locMap[dist].revenue += Number(o.total_amount || 0);
    });
    const locationStats = Object.values(locMap).sort((a, b) => b.revenue - a.revenue);

    // 4. Product performance sales
    const prodMap = {};
    nonCancelled.forEach(o => {
      if (o.order_items) {
        o.order_items.forEach(item => {
          const name = item.product_name;
          if (!prodMap[name]) prodMap[name] = { product_name: name, total_qty: 0, total_revenue: 0 };
          prodMap[name].total_qty += item.quantity;
          prodMap[name].total_revenue += (item.quantity * item.unit_price);
        });
      }
    });
    const productStats = Object.values(prodMap).sort((a, b) => b.total_revenue - a.total_revenue);

    // 5. Payment method stats
    const payMap = {};
    nonCancelled.forEach(o => {
      const pm = o.payment_method || 'COD';
      if (!payMap[pm]) payMap[pm] = { payment_method: pm, revenue: 0, orders: 0 };
      payMap[pm].revenue += Number(o.total_amount || 0);
      payMap[pm].orders++;
    });
    const paymentStats = Object.values(payMap);

    return {
      dailyRevenue,
      monthlyRevenue,
      locationStats,
      productStats,
      paymentStats
    };
  } catch (error) {
    console.error("Error loading accounts data:", error);
    return { dailyRevenue: [], monthlyRevenue: [], locationStats: [], productStats: [], paymentStats: [] };
  }
}

// ============================================================
// B2B ENQUIRIES
// ============================================================

async function saveB2BEnquiry(enquiryData) {
  try {
    const docRef = await db.collection('b2b_enquiries').add(enquiryData);
    console.log('B2B enquiry saved with ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving B2B enquiry:', error);
    return { success: false, error: error.message };
  }
}

async function getB2BEnquiries() {
  try {
    const snapshot = await db.collection('b2b_enquiries')
      .orderBy('created_at', 'desc')
      .get();
    
    const enquiries = [];
    snapshot.forEach(doc => {
      enquiries.push({ id: doc.id, ...doc.data() });
    });
    
    return enquiries;
  } catch (error) {
    console.error('Error getting B2B enquiries:', error);
    return [];
  }
}

async function getB2BEnquiryById(enquiryId) {
  try {
    const doc = await db.collection('b2b_enquiries').doc(enquiryId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting B2B enquiry:', error);
    return null;
  }
}

async function updateB2BEnquiry(enquiryId, updates) {
  try {
    await db.collection('b2b_enquiries').doc(enquiryId).update(updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating B2B enquiry:', error);
    return { success: false, error: error.message };
  }
}

async function deleteB2BEnquiryById(enquiryId) {
  try {
    await db.collection('b2b_enquiries').doc(enquiryId).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting B2B enquiry:', error);
    return { success: false, error: error.message };
  }
}

async function sendB2BEnquiryEmail(enquiryData) {
  try {
    // Get email configuration from settings
    const settings = await getSettings();
    const recipientEmail = settings.b2b_recipient_email || 'info@cinnamonheritage.com';
    const EMAILJS_SERVICE_ID = settings.b2b_emailjs_service_id || 'YOUR_SERVICE_ID';
    const EMAILJS_TEMPLATE_ID = settings.b2b_emailjs_template_id || 'YOUR_TEMPLATE_ID';
    const EMAILJS_PUBLIC_KEY = settings.b2b_emailjs_public_key || 'YOUR_PUBLIC_KEY';

    if (typeof emailjs === 'undefined') {
      console.warn('EmailJS not loaded. Skipping email notification.');
      return { success: true, warning: 'EmailJS not configured' };
    }

    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      console.warn('EmailJS not configured. Please add your credentials in admin panel.');
      return { success: true, warning: 'EmailJS not configured' };
    }

    // Initialize EmailJS if not already done
    if (!emailjs.initialized) {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      emailjs.initialized = true;
    }

    const templateParams = {
      to_email: recipientEmail,
      enquiry_id: enquiryData.enquiry_id,
      company_name: enquiryData.company_name,
      website: enquiryData.website,
      country: enquiryData.country,
      destination_market: enquiryData.destination_market,
      contact_person: enquiryData.contact_person,
      position: enquiryData.position,
      email: enquiryData.email,
      phone: enquiryData.phone,
      industry: enquiryData.industry,
      intended_product: enquiryData.intended_product,
      ingredient_required: enquiryData.ingredient_required,
      trial_quantity: enquiryData.trial_quantity,
      annual_volume: enquiryData.annual_volume,
      pack_size: enquiryData.pack_size,
      packaging_type: enquiryData.packaging_type,
      certifications: enquiryData.certifications.join(', '),
      target_launch_date: enquiryData.target_launch_date,
      message: enquiryData.message,
      created_at: enquiryData.created_at
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('Email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// EXPERIENCE BOOKINGS
// ============================================================

async function saveExperienceBooking(bookingData) {
  try {
    const docRef = await db.collection('experience_bookings').add(bookingData);
    console.log('Experience booking saved with ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving experience booking:', error);
    return { success: false, error: error.message };
  }
}

async function getExperienceBookings() {
  try {
    const snapshot = await db.collection('experience_bookings')
      .orderBy('created_at', 'desc')
      .get();
    
    const bookings = [];
    snapshot.forEach(doc => {
      bookings.push({ id: doc.id, ...doc.data() });
    });
    
    return bookings;
  } catch (error) {
    console.error('Error getting experience bookings:', error);
    return [];
  }
}

async function getExperienceBookingById(bookingId) {
  try {
    const doc = await db.collection('experience_bookings').doc(bookingId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting experience booking:', error);
    return null;
  }
}

async function updateExperienceBooking(bookingId, updates) {
  try {
    await db.collection('experience_bookings').doc(bookingId).update(updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating experience booking:', error);
    return { success: false, error: error.message };
  }
}

async function deleteExperienceBookingById(bookingId) {
  try {
    await db.collection('experience_bookings').doc(bookingId).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting experience booking:', error);
    return { success: false, error: error.message };
  }
}

async function sendExperienceBookingEmail(bookingData) {
  try {
    // Get email configuration from settings
    const settings = await getSettings();
    const recipientEmail = settings.exp_recipient_email || 'info@cinnamonheritage.com';
    const EMAILJS_SERVICE_ID = settings.exp_emailjs_service_id || 'YOUR_SERVICE_ID';
    const EMAILJS_TEMPLATE_ID = settings.exp_emailjs_template_id || 'YOUR_TEMPLATE_ID';
    const EMAILJS_PUBLIC_KEY = settings.exp_emailjs_public_key || 'YOUR_PUBLIC_KEY';

    if (typeof emailjs === 'undefined') {
      console.warn('EmailJS not loaded. Skipping email notification.');
      return { success: true, warning: 'EmailJS not configured' };
    }

    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      console.warn('EmailJS not configured. Please add your credentials in admin panel.');
      return { success: true, warning: 'EmailJS not configured' };
    }

    // Initialize EmailJS if not already done
    if (!emailjs.initialized) {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      emailjs.initialized = true;
    }

    const templateParams = {
      to_email: recipientEmail,
      booking_id: bookingData.booking_id,
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      country: bookingData.country,
      visit_type: bookingData.visit_type,
      preferred_date: bookingData.preferred_date,
      preferred_time: bookingData.preferred_time,
      number_of_visitors: bookingData.number_of_visitors,
      selected_experiences: bookingData.selected_experiences.join(', '),
      company_name: bookingData.company_name,
      position: bookingData.position,
      industry: bookingData.industry,
      special_requirements: bookingData.special_requirements,
      message: bookingData.message,
      created_at: bookingData.created_at
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('Experience booking email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending experience booking email:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// ESSENTIAL OILS ENQUIRIES
// ============================================================

async function saveEssentialOilsEnquiry(enquiryData) {
  try {
    const docRef = await db.collection('essential_oils_enquiries').add(enquiryData);
    console.log('Essential oils enquiry saved with ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving essential oils enquiry:', error);
    return { success: false, error: error.message };
  }
}

async function sendEssentialOilsEmail(enquiryData) {
  try {
    // Get email configuration from settings
    const settings = await getSettings();
    const recipientEmail = settings.eo_recipient_email || 'info@cinnamonheritage.com';
    const EMAILJS_SERVICE_ID = settings.eo_emailjs_service_id || 'YOUR_SERVICE_ID';
    const EMAILJS_TEMPLATE_ID = settings.eo_emailjs_template_id || 'YOUR_TEMPLATE_ID';
    const EMAILJS_PUBLIC_KEY = settings.eo_emailjs_public_key || 'YOUR_PUBLIC_KEY';

    if (typeof emailjs === 'undefined') {
      console.warn('EmailJS not loaded. Skipping email notification.');
      return { success: true, warning: 'EmailJS not configured' };
    }

    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      console.warn('EmailJS not configured. Please add your credentials in admin panel.');
      return { success: true, warning: 'EmailJS not configured' };
    }

    // Initialize EmailJS if not already done
    if (!emailjs.initialized) {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      emailjs.initialized = true;
    }

    const templateParams = {
      to_email: recipientEmail,
      request_id: enquiryData.request_id,
      type: enquiryData.type,
      name: enquiryData.name,
      company: enquiryData.company,
      email: enquiryData.email,
      phone: enquiryData.phone,
      country: enquiryData.country,
      sample_size: enquiryData.sample_size,
      selected_oils: enquiryData.selected_oils ? enquiryData.selected_oils.join(', ') : 'N/A',
      industry: enquiryData.industry,
      requirements: enquiryData.requirements,
      message: enquiryData.message,
      created_at: enquiryData.created_at
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('Essential oils email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending essential oils email:', error);
    return { success: false, error: error.message };
  }
}
