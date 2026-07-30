const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCxwS4oCfB4b2vQniNoSjNOq_G_2GvAkdg",
  authDomain: "authspark-pq68d.firebaseapp.com",
  projectId: "authspark-pq68d",
  storageBucket: "authspark-pq68d.firebasestorage.app",
  messagingSenderId: "104606816181",
  appId: "1:104606816181:web:249a1f1f3e9daebd4eabfc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

async function run() {
  console.log("Fetching existing products...");
  const colRef = collection(db, 'products');
  const snapshot = await getDocs(colRef);
  
  console.log(`Deleting ${snapshot.size} existing products...`);
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'products', docSnap.id));
    console.log(`Deleted product ${docSnap.id}`);
  }
  
  console.log("Writing 10 new products...");
  for (const p of products) {
    const { id, ...fields } = p;
    await setDoc(doc(db, 'products', id), {
      ...fields,
      updated_at: new Date()
    });
    console.log(`Added/Updated product ${id}: ${p.title}`);
  }
  console.log("Reseeding completed successfully!");
  process.exit(0);
}

run().catch(err => {
  console.error("Reseed failed:", err);
  process.exit(1);
});
