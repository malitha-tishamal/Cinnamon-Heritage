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

async function run() {
  console.log("Fetching existing process steps...");
  const colRef = collection(db, 'process_steps');
  const snapshot = await getDocs(colRef);
  
  console.log(`Deleting ${snapshot.size} existing process steps...`);
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'process_steps', docSnap.id));
    console.log(`Deleted step ${docSnap.id}`);
  }
  
  console.log("Writing 9 new process steps...");
  for (const s of steps) {
    const { id, ...fields } = s;
    await setDoc(doc(db, 'process_steps', id), {
      ...fields,
      updated_at: new Date()
    });
    console.log(`Added/Updated step ${id}: ${s.title}`);
  }
  console.log("Process steps reseeding completed successfully!");
  process.exit(0);
}

run().catch(err => {
  console.error("Reseed failed:", err);
  process.exit(1);
});
