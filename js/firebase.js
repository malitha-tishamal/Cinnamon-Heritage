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
  ['cache_content', 'cache_products', 'cache_process_steps', 'cache_settings'].forEach(invalidateCache);
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
      { id: 'contact', title: 'Contact Us', subtitle: 'Whether you are a wholesaler, retailer or artisan brand looking for authentic Ceylon cinnamon, we would love to hear from you. Reach out to discuss bulk orders, private labelling or any enquiries about our products.', address: 'Galle Unanwitiya, Sri Lanka', phone: '+94 77 123 4567', email: 'info@cinnamonheritage.com', whatsapp: '94771234567' }
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
        title: 'Cinnamon Sticks (C5 Grade)',
        short_desc: 'Premium 100% Ceylon Cinnamon Sticks. Perfect for daily use, retail, and bulk export.',
        full_desc: 'Crafted with tradition. Premium Grade C5 Ceylon Cinnamon Sticks. 100% Natural, hand harvested from the Heritage Lands of Sri Lanka. 100g Pack.',
        image_url: 'images/WhatsApp Image 2026-04-25 at 4.41.59 PM.jpeg',
        display_order: 1,
        is_active: true,
        price: 2500,
        discount: 100,
        stock_quantity: 5,
        delivery_charge: 500,
        total_sales: 0
      },
      {
        id: '2',
        title: 'Cinnamon Powder',
        short_desc: '100% Pure Ceylon Cinnamon Powder. Premium quality, rich aroma and flavor.',
        full_desc: 'Experience the true taste and aroma of 100% Pure Ceylon Cinnamon powder, sourced from the finest cinnamon gardens in Sri Lanka. Perfect for cooking & baking. 100g Pack.',
        image_url: 'images/WhatsApp Image 2026-04-25 at 4.43.01 PM.jpeg',
        display_order: 2,
        is_active: true,
        price: 1200,
        discount: 50,
        stock_quantity: 100,
        delivery_charge: 350,
        total_sales: 0
      },
      {
        id: '3',
        title: 'Pure Cinnamon Leaf Oil',
        short_desc: 'Pure Ceylon Leaf Oil. Steam distilled, pure & unadulterated.',
        full_desc: 'Premium leaf oil extracted from the finest Ceylon Cinnamon leaves through steam distillation, preserving its natural purity. Perfect for Aromatherapy and Skincare. 30ml Bottle.',
        image_url: 'images/WhatsApp Image 2026-04-25 at 4.42.30 PM.jpeg',
        display_order: 3,
        is_active: true,
        price: 2000,
        discount: 0,
        stock_quantity: 30,
        delivery_charge: 350,
        total_sales: 0
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
        short_desc: 'Skilled workers hand-select mature stems at peak age for the finest bark quality.',
        full_desc: 'Hand-selected mature stems are harvested from our cinnamon bushes. Our workers carefully select branches of the highest quality, ensuring the perfect balance of age and thickness for premium Ceylon cinnamon production.',
        image_url: 'images/step1_harvest.png',
        display_order: 1,
        is_active: true
      },
      {
        id: '2',
        step_number: '02',
        title: 'Washing',
        short_desc: 'Harvested bark is rigorously washed on stainless steel tables to ensure purity.',
        full_desc: 'Before processing, the quills are thoroughly washed on top of stone or stainless steel tables with clean water. This rigorous industrial cleaning process ensures there is no residual soil or exterior contamination.',
        image_url: 'images/step2_wash.png',
        display_order: 2,
        is_active: true
      },
      {
        id: '3',
        step_number: '03',
        title: 'Peeling',
        short_desc: 'Expert peelers use traditional brass rods and precision knives to extract inner bark.',
        full_desc: 'After removing the outer bark, highly trained peelers loosen the inner bark with specialized brass rods. They then carefully ease the bark off using precision stainless steel knives, showcasing incredible artisan skill combined with industrial efficiency.',
        image_url: 'images/step3_peel.png',
        display_order: 3,
        is_active: true
      },
      {
        id: '4',
        step_number: '04',
        title: 'Drying',
        short_desc: 'Quills are shade-dried on coir racks, then finished in precision mechanical dryers.',
        full_desc: 'The delicately curled quills are initially dried on coir rope racks in shaded areas to preserve essential oils. Finally, they are finished using modern mechanical dryers to lock in deep colors and intense aromas perfectly.',
        image_url: 'images/step4_dry.png',
        display_order: 4,
        is_active: true
      },
      {
        id: '5',
        step_number: '05',
        title: 'Packing',
        short_desc: 'Each quill is graded to strict standards and hygienically sealed for export.',
        full_desc: 'Quills are strictly graded according to standard thickness and appearance thresholds. Following this, they are hygienically sealed and packed into specialized containers, guaranteeing ultimate freshness and quality upon arrival.',
        image_url: 'images/step5_pack.png',
        display_order: 5,
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
    
    // If no profile document exists, check if this is the first user
    if (!profileDoc.exists) {
      const profilesSnap = await db.collection('profiles').limit(1).get();
      const isFirstUser = profilesSnap.empty;
      
      const defaultRole = isFirstUser ? 'admin' : 'customer';
      const isApproved = isFirstUser; // auto-approved if first user
      
      const newProfile = {
        id: userId,
        username: email.split('@')[0],
        email: email,
        role: defaultRole,
        is_approved: isApproved,
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('profiles').doc(userId).set(newProfile);
      profileDoc = await db.collection('profiles').doc(userId).get();
    }
    
    const profile = profileDoc.data();
    
    return { 
      success: true, 
      userId: userId,
      username: profile.username || (profile.first_name ? `${profile.first_name} ${profile.last_name}` : email.split('@')[0]),
      role: profile.role,
      is_approved: profile.is_approved,
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
      is_approved: role === 'admin' ? false : true, // Customers automatically approved, admins need approval
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      cart_items: []
    };

    // If first user, auto-approve and force admin role
    const profilesSnap = await db.collection('profiles').limit(1).get();
    if (profilesSnap.empty) {
      profile.role = 'admin';
      profile.is_approved = true;
    }
    
    await db.collection('profiles').doc(userId).set(profile);
    
    const msg = profile.role === 'admin' && !profile.is_approved
      ? 'Admin account created! Please wait for another admin to approve your account before logging in.'
      : 'Account created successfully!';
      
    return { success: true, message: msg, role: profile.role, user: profile };
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
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        resolve({ isLoggedIn: false, username: null });
        return;
      }
      
      try {
        const profileDoc = await db.collection('profiles').doc(user.uid).get();
        const profile = profileDoc.exists ? profileDoc.data() : null;
        resolve({
          isLoggedIn: true,
          userId: user.uid,
          isAdmin: profile?.role === 'admin' && profile?.is_approved === true,
          username: profile?.username || (profile?.first_name ? `${profile.first_name} ${profile.last_name}` : user.email),
          role: profile?.role ?? 'customer',
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
    await db.collection('profiles').doc(userId).update({
      cart_items: cartItems,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
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
    await db.collection('orders').doc(String(id)).update({ status });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
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

    return {
      totalMessages:  messagesList.length,
      unreadMessages: messagesList.filter(m => !m.is_read).length,
      totalProducts:  activeProds.size,
      totalSteps:     stepsList.size,
      totalOrders:    ordersList.length,
      earningsToday,
      earningsMonth,
      totalEarnings,
      productSales:   activeProductsList
    };
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
    return {
      totalMessages: 0, unreadMessages: 0, totalProducts: 0, totalSteps: 0, totalOrders: 0,
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
