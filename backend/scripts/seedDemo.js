/**
 * PoultrySmart DEMO data seed  (npm run seed:demo)
 *
 * Creates a clearly-labelled sample dataset for demos and interviews: farmers with stores,
 * buyers, an admin, listings, inventory, 90 days of farm records, orders in every status,
 * chats, community posts, alerts and market-rate history.
 *
 * - Idempotent: every demo account uses an @demo.poultrysmart email. Each run first removes
 *   those accounts and everything they own, then recreates the same data (dates are relative
 *   to "today", so the charts always cover the last 90 days). Real users' data is not touched.
 * - Safe: refuses to run when NODE_ENV=production unless you pass --force.
 * - Target database: MONGODB_URI (for Atlas:  MONGODB_URI="mongodb+srv://..." npm run seed:demo)
 * - Remove the demo data again:  npm run seed:demo -- --remove
 *
 * All prices are SAMPLE figures in INR, roughly in line with Indian poultry prices in 2026.
 * Photos are real, reusable stock photos stored in frontend/public/demo (see DEMO_IMAGES.md).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/env');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const REMOVE_ONLY = args.includes('--remove');
if (config.isProd && !FORCE) {
  console.error('Refusing to seed demo data while NODE_ENV=production. Re-run with --force if this database is meant for demos:');
  console.error('  npm run seed:demo -- --force');
  process.exit(1);
}

const User = require('../models/User');
const Farm = require('../models/Farm');
const Store = require('../models/Store');
const Listing = require('../models/Listing');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const ChatMessage = require('../models/ChatMessage');
const CommunityPost = require('../models/CommunityPost');
const Notification = require('../models/Notification');
const EggProductionLog = require('../models/EggProductionLog');
const SupplyOrder = require('../models/SupplyOrder');
const Prediction = require('../models/Prediction');
const MarketRateHistory = require('../models/MarketRateHistory');

const DEMO_DOMAIN = '@demo.poultrysmart';
const DEMO_RE = /@demo\.poultrysmart$/;
const PASSWORD = 'Demo@1234';
const DAY = 86_400_000;
const NOW = Date.now();
const daysAgo = (d, hour = 10, min = 0) => {
  const t = new Date(NOW - d * DAY);
  t.setHours(hour, min, 0, 0);
  return t;
};

// Deterministic random numbers, so every run produces the same demo data.
let seedState = 20261029;
const rand = () => {
  seedState |= 0; seedState = (seedState + 0x6d2b79f5) | 0;
  let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (a, b) => a + rand() * (b - a);
const int = (a, b) => Math.floor(between(a, b + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const img = (name) => `/demo/${name}.webp`;

// ---------------------------------------------------------------- people
const FARMERS = [
  { key: 'ramesh', name: 'Ramesh Gowda', email: `farmer${DEMO_DOMAIN}`,
    farm: { name: 'Gowda Poultry Farm', location: 'Doddaballapur, Bengaluru Rural, Karnataka', birds: 4800, type: 'layer' },
    store: { name: 'Gowda Farm Fresh', image: img('farms/layer-shed'), description: 'Family-run layer farm since 2009. Fresh eggs collected twice a day and delivered across north Bengaluru.' } },
  { key: 'lakshmi', name: 'Lakshmi Reddy', email: `lakshmi${DEMO_DOMAIN}`,
    farm: { name: 'Sri Lakshmi Hatcheries', location: 'Siddipet, Telangana', birds: 12000, type: 'hatchery' },
    store: { name: 'Sri Lakshmi Hatcheries', image: img('products/brooder'), description: 'Vaccinated day-old chicks (broiler, layer and Kaveri) for farms across Telangana and north Karnataka.' } },
  { key: 'sunil', name: 'Sunil Patil', email: `sunil${DEMO_DOMAIN}`,
    farm: { name: 'Patil Agro Poultry', location: 'Baramati, Maharashtra', birds: 9000, type: 'broiler' },
    store: { name: 'Patil Agro Poultry', image: img('farms/broiler-house'), description: 'Contract broiler grower and feed dealer. Live birds, broiler feed and farm equipment.' } },
  { key: 'anitha', name: 'Anitha Shetty', email: `anitha${DEMO_DOMAIN}`,
    farm: { name: 'Coastal Desi Farms', location: 'Karkala, Udupi, Karnataka', birds: 1500, type: 'desi' },
    store: { name: 'Coastal Desi Farms', image: img('farms/free-range'), description: 'Free-range country chicken, Kadaknath and duck eggs raised on coconut-grove pasture near Karkala.' } },
  { key: 'irfan', name: 'Mohammed Irfan', email: `irfan${DEMO_DOMAIN}`,
    farm: { name: 'Irfan Quail & Broilers', location: 'Hosur, Tamil Nadu', birds: 6500, type: 'quail' },
    store: { name: 'Irfan Quail & Broilers', image: img('farms/farm-yard'), description: 'Japanese quail, quail eggs and broilers for hotels and caterers in Hosur and Bengaluru.' } },
];
const BUYERS = [
  { key: 'priya', name: 'Priya Sharma (FreshBasket Mart)', email: `buyer${DEMO_DOMAIN}` },
  { key: 'udupi', name: 'Hotel Udupi Grand', email: `udupigrand${DEMO_DOMAIN}` },
  { key: 'kumar', name: 'Kumar Caterers, Hyderabad', email: `kumarcaterers${DEMO_DOMAIN}` },
  { key: 'punebake', name: 'Pune Bake House', email: `punebake${DEMO_DOMAIN}` },
  { key: 'annapurna', name: 'Annapurna Mess, Mysuru', email: `annapurna${DEMO_DOMAIN}` },
];
const ADMIN = { name: 'PoultrySmart Admin', email: `admin${DEMO_DOMAIN}` };

// ---------------------------------------------------------------- catalogue (sample INR prices)
// [productName, category, unit price, typical stock, image, description]
const CATALOGUE = {
  ramesh: [
    ['Farm Fresh White Eggs (Tray of 30)', 'EGG', 175, 400, 'products/eggs-tray', 'BV-300 layer eggs, graded and collected the same morning.'],
    ['Brown Eggs (Tray of 30)', 'EGG', 210, 150, 'products/eggs-brown', 'Brown-shell eggs from our Kaveri layer flock.'],
    ['Table Eggs Bulk (Box of 210)', 'EGG', 1180, 60, 'products/egg-crates', 'Seven trays per box. Ideal for hotels, bakeries and retailers.'],
    ['Spent Layer Hens (per bird)', 'BIRD', 190, 300, 'products/layer-hens', '72-week layers after the laying cycle, healthy and vaccinated.'],
    ['BV-300 Layer Pullets (16 weeks)', 'BIRD', 420, 250, 'products/pullets', 'Point-of-lay pullets, fully vaccinated (ND, IB, IBD, Fowl Pox).'],
    ['Poultry Manure Compost (50 kg bag)', 'OTHER', 220, 120, 'products/manure', 'Dried and composted layer manure. Great for vegetables and coconut.'],
    ['Layer Mash Feed (50 kg bag)', 'FEED', 1850, 40, 'products/feed', 'Our own farm-mixed layer mash: maize, soya and mineral mix.'],
    ['Egg Trays, Paper Pulp (Pack of 100)', 'EQUIPMENT', 380, 80, 'products/eggs-hatching', 'Reusable 30-egg pulp trays.'],
    ['Organic Desi Eggs (Dozen)', 'EGG', 140, 90, 'products/eggs-desi', 'From our small backyard flock of country hens.'],
    ['Table Eggs (Tray of 30) - Weekly subscription', 'EGG', 168, 120, 'products/eggs-white', 'Four trays a month at a fixed price, delivered every Monday.'],
  ],
  lakshmi: [
    ['Day-Old Broiler Chicks (Cobb 430)', 'BIRD', 38, 5000, 'products/chicks', 'Marek\'s and ND vaccinated at the hatchery. Minimum 100 chicks.'],
    ['Day-Old Layer Chicks (BV-300)', 'BIRD', 46, 3000, 'products/chicks-2', 'Sexed female layer chicks, hatchery vaccinated.'],
    ['Kaveri Chicks (2 weeks)', 'BIRD', 65, 1200, 'products/chicks-3', 'Dual-purpose coloured birds for backyard farms.'],
    ['Giriraja Chicks (Day-old)', 'BIRD', 55, 900, 'products/chicks', 'Hardy dual-purpose breed developed in Karnataka.'],
    ['Hatching Eggs (Tray of 30)', 'EGG', 420, 100, 'products/eggs-hatching', 'Fertile broiler breeder eggs for small hatcheries.'],
    ['Egg Incubator, 100-egg Automatic', 'EQUIPMENT', 8500, 12, 'products/incubator', 'Automatic turning, digital temperature and humidity control.'],
    ['Chick Brooder Lamp (250 W Infrared)', 'EQUIPMENT', 450, 60, 'products/brooder', 'Keeps chicks warm during the first two weeks.'],
    ['Broiler Pre-Starter Crumbles (50 kg)', 'FEED', 2250, 50, 'products/feed-crumbles', 'High-protein crumbles for days 1 to 10.'],
    ['Day-Old Broiler Chicks (Vencobb 400)', 'BIRD', 36, 4000, 'products/chicks-2', 'Uniform, active chicks with a 7-day mortality replacement.'],
  ],
  sunil: [
    ['Live Broiler Chicken (per kg)', 'BIRD', 112, 2500, 'products/broiler', 'Birds at 2.2 to 2.5 kg, 38 to 42 days old. Price per kg live weight.'],
    ['Broiler Starter Feed (50 kg)', 'FEED', 2150, 80, 'products/feed', 'Starter crumbles for days 1 to 14.'],
    ['Broiler Finisher Feed (50 kg)', 'FEED', 1980, 120, 'products/feed-pellets', 'Pelleted finisher for days 25 to harvest.'],
    ['Yellow Maize (per quintal)', 'FEED', 2350, 60, 'products/maize', 'Sun-dried maize from Baramati. Moisture below 12%.'],
    ['Plastic Chick Feeder (5 kg)', 'EQUIPMENT', 160, 200, 'products/feeder', 'Round feeder for chicks and growers.'],
    ['Automatic Bell Drinker', 'EQUIPMENT', 260, 150, 'products/feeder', 'Gravity-fed drinker for broiler houses.'],
    ['Rice Husk Bedding (per bag)', 'OTHER', 90, 300, 'products/litter', 'Dry husk litter for deep-litter sheds.'],
    ['Dressed Broiler Chicken (per kg)', 'BIRD', 190, 400, 'products/broiler-2', 'Cleaned and chilled, delivered to Pune and Baramati.'],
    ['Soybean Meal (50 kg)', 'FEED', 2600, 40, 'products/feed-pellets', '46% protein soya de-oiled cake.'],
  ],
  anitha: [
    ['Country Chicken (Naati Koli), live', 'BIRD', 520, 150, 'products/desi-hen', 'Free-range naati birds, 1.2 to 1.5 kg. Price per bird.'],
    ['Kadaknath Chicken (live, per bird)', 'BIRD', 950, 60, 'products/kadaknath', 'Black-meat Kadaknath, 5 to 6 months old, free-range.'],
    ['Kadaknath Eggs (Dozen)', 'EGG', 300, 40, 'products/eggs-kadaknath', 'Small, light-brown eggs from our Kadaknath flock.'],
    ['Country Eggs / Naati Mottae (Dozen)', 'EGG', 150, 120, 'products/eggs-desi', 'Free-range eggs with deep orange yolks.'],
    ['Duck Eggs (Dozen)', 'EGG', 160, 60, 'products/eggs-duck', 'From our Khaki Campbell ducks.'],
    ['Khaki Campbell Ducklings', 'BIRD', 85, 200, 'products/duck', 'Two-week ducklings, good layers for coastal farms.'],
    ['Aseel Rooster (breeding)', 'BIRD', 1800, 15, 'products/rooster', 'Pure Aseel roosters for breeding.'],
    ['Turkey (live, per kg)', 'BIRD', 330, 45, 'products/turkey', 'Broad-breasted turkeys for Christmas orders. Pre-book now.'],
    ['Vermicompost with Poultry Manure (25 kg)', 'OTHER', 260, 80, 'products/manure', 'Composted in our own pits.'],
  ],
  irfan: [
    ['Quail Eggs (Pack of 30)', 'EGG', 90, 300, 'products/eggs-quail', 'Fresh Japanese quail eggs, packed in clear trays.'],
    ['Live Japanese Quail (per bird)', 'BIRD', 48, 2000, 'products/quail', '5 to 6 weeks old, 180 to 220 g.'],
    ['Quail Chicks (Day-old, pack of 100)', 'BIRD', 900, 40, 'products/quail', 'From our own breeder stock.'],
    ['Live Broiler Chicken (per kg)', 'BIRD', 110, 1800, 'products/broiler', 'Hosur farm-gate price per kg live weight.'],
    ['Quail Cage, 4-tier (100 birds)', 'EQUIPMENT', 6500, 8, 'products/cages', 'Galvanised wire, with feed and water troughs.'],
    ['Quail Grower Feed (25 kg)', 'FEED', 1150, 50, 'products/feed-pellets', 'High-protein feed for quail.'],
    ['Farm Fresh Eggs (Tray of 30)', 'EGG', 172, 200, 'products/eggs-white', 'Sourced from partner layer farms in Hosur.'],
    ['Nipple Drinker Line (10 m kit)', 'EQUIPMENT', 1450, 20, 'products/feeder', 'Hygienic nipple drinkers with regulator.'],
  ],
};

const INVENTORY = {
  // [itemName, category, quantity, unit, lowStockThreshold, dailyConsumption]
  ramesh: [
    ['Layer Mash Feed', 'Feed', 1450, 'kg', 1000, 560], ['Maize (crushed)', 'Feed', 2800, 'kg', 800, 180], ['Shell Grit / Calcium', 'Feed', 120, 'kg', 150, 12],
    ['Lasota (ND) vaccine', 'Medicine', 4, 'vials', 5, 0], ['Vitamin & Electrolyte Mix', 'Medicine', 6, 'kg', 2, 0.3], ['Deworming Tablets', 'Medicine', 2, 'boxes', 1, 0],
    ['Egg Trays (paper)', 'Equipment', 900, 'pieces', 500, 140], ['Disinfectant (5 L)', 'Other', 3, 'cans', 2, 0.1],
  ],
  lakshmi: [['Broiler Pre-Starter', 'Feed', 900, 'kg', 600, 120], ['Marek\'s Vaccine', 'Medicine', 12, 'vials', 10, 1], ['Chick Boxes', 'Equipment', 300, 'pieces', 200, 25], ['Formalin', 'Other', 20, 'litres', 10, 1]],
  sunil: [['Broiler Finisher Feed', 'Feed', 3200, 'kg', 2000, 900], ['Broiler Starter Feed', 'Feed', 600, 'kg', 800, 150], ['Gumboro (IBD) Vaccine', 'Medicine', 8, 'vials', 4, 0], ['Rice Husk', 'Other', 40, 'bags', 30, 3]],
  anitha: [['Free-range Grain Mix', 'Feed', 380, 'kg', 200, 35], ['Fowl Pox Vaccine', 'Medicine', 3, 'vials', 2, 0], ['Turmeric Powder (water additive)', 'Medicine', 5, 'kg', 2, 0.1]],
  irfan: [['Quail Grower Feed', 'Feed', 420, 'kg', 500, 70], ['Quail Breeder Feed', 'Feed', 300, 'kg', 150, 30], ['Multivitamin Liquid', 'Medicine', 4, 'litres', 2, 0.1], ['Quail Egg Packs', 'Equipment', 700, 'pieces', 300, 60]],
};

// ---------------------------------------------------------------- helpers
async function removeDemoData() {
  const demoUsers = await User.find({ email: DEMO_RE }).select('_id').lean();
  const ids = demoUsers.map((u) => u._id);
  if (!ids.length) {
    await MarketRateHistory.deleteMany({ isSample: true });
    return 0;
  }
  const demoListings = await Listing.find({ farmer: { $in: ids } }).select('_id').lean();
  const listingIds = demoListings.map((l) => l._id);
  await Promise.all([
    Farm.deleteMany({ farmer: { $in: ids } }),
    Store.deleteMany({ user: { $in: ids } }),
    Listing.deleteMany({ farmer: { $in: ids } }),
    Inventory.deleteMany({ farmer: { $in: ids } }),
    Order.deleteMany({ $or: [{ buyer: { $in: ids } }, { farmer: { $in: ids } }, { listing: { $in: listingIds } }] }),
    ChatMessage.deleteMany({ $or: [{ sender: { $in: ids } }, { receiver: { $in: ids } }] }),
    CommunityPost.deleteMany({ author: { $in: ids } }),
    CommunityPost.updateMany({}, { $pull: { comments: { author: { $in: ids } }, upvotedBy: { $in: ids } } }),
    Notification.deleteMany({ user: { $in: ids } }),
    EggProductionLog.deleteMany({ farmer: { $in: ids } }),
    SupplyOrder.deleteMany({ user: { $in: ids } }),
    Prediction.deleteMany({ farmer: { $in: ids } }),
    MarketRateHistory.deleteMany({ isSample: true }),
  ]);
  await User.deleteMany({ _id: { $in: ids } });
  return ids.length;
}

// Sets createdAt/updatedAt directly in MongoDB (Mongoose would otherwise stamp "now").
async function backdate(Model, rows) {
  if (!rows.length) return;
  await Model.collection.bulkWrite(rows.map(([_id, createdAt, updatedAt]) => ({
    updateOne: { filter: { _id }, update: { $set: { createdAt, updatedAt: updatedAt || createdAt } } },
  })));
}

async function seed() {
  // ---- users
  // Demo users have no phone number, so no real person's number can ever appear in the demo.
  const mk = (u, role, ageDays) => ({ name: u.name, email: u.email, password: PASSWORD, role, _age: ageDays });
  const userDocs = [
    ...FARMERS.map((f, i) => mk(f, 'Farmer', 95 - i * 3)),
    ...BUYERS.map((b, i) => mk(b, 'Buyer', 92 - i * 4)),
    mk(ADMIN, 'Admin', 100),
  ];
  const created = [];
  for (const { _age, ...doc } of userDocs) created.push([await User.create(doc), _age]);
  await backdate(User, created.map(([u, age]) => [u._id, daysAgo(age, 9)]));
  const byEmail = Object.fromEntries(created.map(([u]) => [u.email, u]));
  const F = Object.fromEntries(FARMERS.map((f) => [f.key, byEmail[f.email]]));
  const B = Object.fromEntries(BUYERS.map((b) => [b.key, byEmail[b.email]]));

  // ---- farms (+ vaccination schedules)
  const farms = {};
  for (const f of FARMERS) {
    const vacc = [
      { disease: 'Marek\'s disease', date: daysAgo(80), status: 'Completed' },
      { disease: 'Newcastle (Lasota)', date: daysAgo(45), status: 'Completed' },
      { disease: 'Gumboro (IBD)', date: daysAgo(30), status: 'Completed' },
      { disease: 'Newcastle booster (R2B)', date: daysAgo(-4), status: 'Pending' },
      { disease: 'Fowl Pox', date: daysAgo(-12), status: 'Pending' },
    ];
    farms[f.key] = await Farm.create({ farmer: F[f.key]._id, name: f.farm.name, location: f.farm.location, totalChickens: f.farm.birds, vaccinationSchedule: vacc });
  }
  await backdate(Farm, FARMERS.map((f, i) => [farms[f.key]._id, daysAgo(94 - i * 3)]));

  // ---- 90 days of farm records (eggs, feed, mortality, temperature)
  const logs = [];
  for (const f of FARMERS) {
    let birds = f.farm.birds;
    const layRate = { layer: 0.86, hatchery: 0.72, broiler: 0, desi: 0.42, quail: 0.68 }[f.farm.type];
    for (let d = 89; d >= 0; d--) {
      const heat = d >= 40 && d <= 46; // a heat wave in the middle of the period: fewer eggs, more water
      const temp = Math.round((heat ? between(35, 38) : between(27, 32.5)) * 10) / 10;
      const deaths = rand() < (heat ? 0.9 : 0.35) ? int(1, heat ? 9 : 3) : 0;
      birds -= deaths;
      const trend = 1 + (89 - d) * 0.0006; // flock settling into peak lay
      const eggs = layRate ? Math.round(birds * layRate * trend * (heat ? between(0.86, 0.92) : between(0.97, 1.02))) : 0;
      logs.push({ farm: farms[f.key]._id, farmer: F[f.key]._id, date: daysAgo(d, 18), totalEggs: eggs, temperature: temp,
        humidity: Math.round(between(heat ? 40 : 55, heat ? 52 : 78)), currentChickenCount: birds, feedConsumed: Math.round(birds * (f.farm.type === 'quail' ? 0.028 : 0.112) * between(0.96, 1.04)), mortalityCount: deaths });
    }
  }
  const insertedLogs = await EggProductionLog.insertMany(logs);
  await backdate(EggProductionLog, insertedLogs.map((l) => [l._id, l.date]));

  // ---- stores with products, listings
  const listings = [];
  for (const f of FARMERS) {
    const items = CATALOGUE[f.key];
    await Store.create({
      user: F[f.key]._id, name: f.store.name, description: f.store.description, location: f.farm.location, image: f.store.image,
      products: items.slice(0, 5).map(([name, category, price, , image, description]) => ({ name, price, category, image: img(image), description })),
    });
    items.forEach(([productName, category, pricePerUnit, quantity, image, description], i) => {
      listings.push({ farmer: F[f.key]._id, productName, category, pricePerUnit, quantity, image: img(image), description, isAvailable: true, _age: int(3, 85), _sold: i === items.length - 1 && f.key === 'sunil' });
    });
  }
  const listingDocs = [];
  for (const { _age, _sold, ...l } of listings) {
    const doc = await Listing.create(_sold ? { ...l, quantity: 0, isAvailable: false } : l);
    listingDocs.push([doc, _age]);
  }
  await backdate(Listing, listingDocs.map(([l, age]) => [l._id, daysAgo(age, 8)]));

  // ---- inventory
  const inv = [];
  for (const [key, rows] of Object.entries(INVENTORY)) {
    for (const [itemName, category, quantity, unit, lowStockThreshold, dailyConsumptionRate] of rows) {
      inv.push({ farmer: F[key]._id, itemName, category, quantity, unit, lowStockThreshold, dailyConsumptionRate });
    }
  }
  const invDocs = await Inventory.insertMany(inv);
  await backdate(Inventory, invDocs.map((d) => [d._id, daysAgo(int(5, 60))]));

  // ---- orders across every status
  const avail = listingDocs.map(([l]) => l).filter((l) => l.isAvailable);
  const ofFarmer = (key) => avail.filter((l) => l.farmer.equals(F[key]._id));
  const qtyFor = (l) => (l.pricePerUnit >= 3000 ? int(1, 2) : l.pricePerUnit >= 800 ? int(2, 10) : l.pricePerUnit >= 150 ? int(5, 40) : int(100, 600));
  const plan = [];
  // The demo farmer (Ramesh) and demo buyer (Priya) get the richest history.
  for (let i = 0; i < 18; i++) plan.push({ listing: pick(ofFarmer('ramesh')), buyer: B[pick(['priya', 'priya', 'udupi', 'annapurna', 'punebake', 'kumar'])] });
  for (let i = 0; i < 10; i++) plan.push({ listing: pick(avail.filter((l) => !l.farmer.equals(F.ramesh._id))), buyer: B.priya });
  for (let i = 0; i < 20; i++) plan.push({ listing: pick(avail.filter((l) => !l.farmer.equals(F.ramesh._id))), buyer: B[pick(['udupi', 'kumar', 'punebake', 'annapurna'])] });
  const statusFor = (age) => {
    if (age <= 2) return rand() < 0.6 ? 'Pending' : 'Accepted';
    if (age <= 7) return pick(['Pending', 'Accepted', 'Accepted', 'Completed', 'Completed', 'Rejected']);
    return rand() < 0.8 ? 'Completed' : 'Rejected';
  };
  const orders = [];
  plan.forEach((p, i) => {
    const age = i < 4 ? i * 0.4 : rand() < 0.32 ? between(0.5, 7) : int(8, 88); // guarantee a few fresh pending orders
    const status = i < 3 ? 'Pending' : statusFor(age);
    const q = qtyFor(p.listing);
    orders.push({ doc: { buyer: p.buyer._id, farmer: p.listing.farmer, listing: p.listing._id, quantityOrdered: q, totalPrice: Math.round(q * p.listing.pricePerUnit), status }, age });
  });
  // Reported problems ("Report a problem"): two open, one resolved.
  const problems = [
    { idx: 5, reason: 'Wrong quantity', details: 'Ordered 20 trays but received 18. Two trays short in the second box.', by: 'buyer', open: true },
    { idx: 12, reason: 'Poor quality', details: 'About 15 eggs were cracked when the delivery reached our kitchen.', by: 'buyer', open: true },
    { idx: 22, reason: 'Payment not received', details: 'Delivered on time, but the UPI payment is still pending after 5 days.', by: 'farmer', open: false },
  ];
  for (const p of problems) { orders[p.idx].doc.status = 'Completed'; orders[p.idx].age = Math.max(orders[p.idx].age, 8); }
  const orderDocs = [];
  for (const [i, o] of orders.entries()) {
    const pr = problems.find((p) => p.idx === i);
    const doc = { ...o.doc };
    if (pr) doc.issue = { reason: pr.reason, details: pr.details, reportedBy: pr.by === 'buyer' ? doc.buyer : doc.farmer, status: pr.open ? 'Open' : 'Resolved', resolvedAt: pr.open ? undefined : daysAgo(o.age - 3) };
    const created = await Order.create(doc);
    const createdAt = daysAgo(o.age, int(7, 20), int(0, 59));
    const updatedAt = doc.status === 'Pending' ? createdAt : new Date(createdAt.getTime() + int(2, 40) * 3600_000);
    orderDocs.push([created._id, createdAt, updatedAt]);
  }
  await backdate(Order, orderDocs);

  // ---- chat threads
  const threads = [
    [B.priya, F.ramesh, 6, [
      ['b', 'Namaste Ramesh ji, can you supply 20 trays of white eggs every Monday for our Yelahanka store?'],
      ['f', 'Namaste Priya madam. Yes, 20 trays every Monday is fine. ₹175 a tray, delivered before 8 am.'],
      ['b', 'Can you do ₹168 if we commit for 3 months? Same as the weekly subscription listing.'],
      ['f', 'OK, ₹168 for the subscription. I will add your store to Monday\'s route.'],
      ['b', 'Great. Last week two trays were short, I have reported it on the order.'],
      ['f', 'Sorry about that, the loader missed one box. I will send the two trays free with this Monday\'s delivery.'],
      ['b', 'Thank you! 🙏'],
    ]],
    [B.priya, F.anitha, 3, [
      ['b', 'Hi Anitha, are the Kadaknath eggs available this week? Customers keep asking.'],
      ['f', 'Hi Priya, yes, 6 dozen are ready. The hens are laying well after the rains.'],
      ['b', 'Please keep 4 dozen for us, I will place the order now.'],
    ]],
    [B.udupi, F.ramesh, 10, [
      ['b', 'We need 35 trays for a wedding on Saturday. Is that possible?'],
      ['f', 'Yes sir, 35 trays can be arranged. Please place the order today so I can plan the collection.'],
      ['b', 'Order placed. Please send fresh stock only.'],
      ['f', 'Sure, all eggs will be from Friday evening\'s collection.'],
    ]],
    [B.kumar, F.sunil, 2, [
      ['b', 'Sunil bhai, what is today\'s live broiler rate?'],
      ['f', '₹112 per kg at the farm gate today. Birds are averaging 2.4 kg.'],
      ['b', 'Book 300 kg for Thursday morning please.'],
    ]],
    [B.annapurna, F.irfan, 14, [
      ['b', 'Do you deliver quail eggs to Mysuru?'],
      ['f', 'Yes, every Wednesday and Saturday. Minimum 10 packs.'],
    ]],
  ];
  const chats = [];
  for (const [buyer, farmer, startDays, msgs] of threads) {
    msgs.forEach(([who, message], i) => {
      const at = new Date(NOW - startDays * DAY + i * int(8, 70) * 60_000);
      chats.push({ doc: { sender: who === 'b' ? buyer._id : farmer._id, receiver: who === 'b' ? farmer._id : buyer._id, message, isRead: i < msgs.length - 1 }, at });
    });
  }
  const chatDocs = await ChatMessage.insertMany(chats.map((c) => c.doc));
  await backdate(ChatMessage, chatDocs.map((d, i) => [d._id, chats[i].at]));

  // ---- community posts with comments and upvotes
  const everyone = [...Object.values(F), ...Object.values(B)];
  const POSTS = [
    [F.ramesh, 'Egg prices up ₹8 a tray this week in Bengaluru', 'NECC rates moved up after Deepavali demand. Our local traders paid ₹172 a tray today. What are you getting in your area?', ['Market Price'], 2,
      [[F.irfan, 'Hosur farm gate is ₹170 today.'], [F.sunil, 'Baramati traders are at ₹178 for brown eggs.'], [B.priya, 'Retail moved to ₹6.5 per egg at our stores.']]],
    [F.anitha, 'Heavy rain warning for coastal Karnataka', 'IMD has an orange alert for Udupi and Dakshina Kannada for the next 3 days. Check roof sheets, keep litter dry and store extra feed.', ['Weather'], 5,
      [[F.ramesh, 'Thanks for the heads-up. Turning the litter twice a day helps with ammonia.']]],
    [F.sunil, 'Ranikhet (Newcastle) cases reported near Baramati', 'Two farms near us lost birds this week. Vet confirmed Newcastle disease. Please check your Lasota/R2B booster dates and stop visitors entering sheds.', ['Pest Alert'], 9,
      [[F.lakshmi, 'We are giving the Lasota booster to all chick batches this week.'], [F.irfan, 'Footbaths at the gate are a must. Thanks Sunil.']]],
    [F.lakshmi, 'How to cut chick mortality in the first week', 'What worked for us: brooder at 33°C on day 1, then down 2°C every 3 days; jaggery water for the first 6 hours; no crowding at the feeder. First-week mortality dropped from 4% to 1.2%.', ['Advice'], 16,
      [[F.anitha, 'Very useful. Do you use paper on the litter for the first days?'], [F.lakshmi, 'Yes, newspaper for 3 days so chicks find the feed easily.'], [F.sunil, 'Agreed on the jaggery water.']]],
    [F.irfan, 'Is quail farming profitable for a beginner?', 'Many people ask me this. 1,000 quail need about 100 sq ft, start laying in 6–7 weeks, and eggs sell at ₹3 each in Hosur. Feed is the main cost. Happy to answer questions.', ['Advice', 'Question'], 22,
      [[B.annapurna, 'We buy quail eggs every week for our mess, demand is steady.']]],
    [B.priya, 'Looking for a steady supplier of desi eggs in Bengaluru', 'FreshBasket Mart needs about 30 dozen country eggs a week for 3 stores. Please message me if you can supply regularly.', ['Question'], 26,
      [[F.anitha, 'I can supply 10 dozen a week from Karkala. Sending you a message.'], [F.ramesh, 'I can do 8 dozen from my backyard flock.']]],
    [F.ramesh, 'Heat stress tips that saved my flock in September', 'During the heat wave our egg count fell almost 10%. What helped: foggers 12–4 pm, electrolytes + vitamin C in water, feeding at 5 am and 7 pm, and white-washing the roof.', ['Advice', 'Weather'], 44,
      [[F.irfan, 'White-washing the roof makes a big difference.'], [F.anitha, 'We also hung wet gunny bags on the side curtains.']]],
    [F.sunil, 'Maize price falling after kharif harvest', 'Maize dropped from ₹2,500 to ₹2,350 a quintal at Baramati APMC. Good time to stock up for feed if you have dry storage.', ['Market Price'], 31,
      [[F.ramesh, 'Same in Doddaballapur. Buying 5 tonnes this week.']]],
    [B.kumar, 'Need 500 kg broilers every weekend for wedding season', 'Kumar Caterers is booking weekend supply for Nov–Feb in Hyderabad. Farms in Telangana, please reply with your rate.', ['Question'], 12,
      [[F.lakshmi, 'We can connect you with two broiler growers in Siddipet who buy our chicks.']]],
    [F.lakshmi, 'Government subsidy for hatchery equipment (NLM)', 'The National Livestock Mission covers up to 50% of the cost for poultry entrepreneurship projects. The application is on the NLM portal; you need a DPR and a bank loan sanction.', ['Advice'], 58, []],
  ];
  const postRows = [];
  for (const [author, title, content, tags, age, comments] of POSTS) {
    const voters = everyone.filter((u) => !u._id.equals(author._id) && rand() < 0.55);
    const post = await CommunityPost.create({
      author: author._id, title, content, tags, upvotes: voters.length, upvotedBy: voters.map((v) => v._id),
      comments: comments.map(([who, text], i) => ({ author: who._id, content: text, upvotes: int(0, 6), createdAt: daysAgo(age - (i + 1) * 0.3, 11 + i * 2, int(0, 59)), updatedAt: daysAgo(age - (i + 1) * 0.3, 11 + i * 2) })),
    });
    postRows.push([post._id, daysAgo(age, int(7, 21))]);
  }
  await backdate(CommunityPost, postRows);

  // ---- alerts (notifications)
  const notes = [];
  const note = (user, type, title, message, age, isRead = false) => notes.push({ doc: { user: user._id, type, title, message, isRead }, at: daysAgo(age, int(6, 21)) });
  note(F.ramesh, 'Order', 'New order received', 'FreshBasket Mart ordered Farm Fresh White Eggs. Accept it from Orders received.', 0.2);
  note(F.ramesh, 'Alert', 'Low stock: Shell Grit / Calcium', 'Only 120 kg left (below your 150 kg limit). Reorder this week.', 0.6);
  note(F.ramesh, 'Disease', 'Newcastle booster due in 4 days', 'R2B booster for Gowda Poultry Farm is scheduled. Keep the vaccine chilled.', 1);
  note(F.ramesh, 'Alert', 'Problem reported on an order', 'A buyer reported "Wrong quantity" on an order. Reply from the order card.', 3, true);
  note(F.ramesh, 'System', 'Market rate update', 'Egg tray reference rate moved to ₹168 (sample data).', 5, true);
  note(F.sunil, 'Disease', 'Newcastle cases nearby', 'Two farms within 10 km reported Newcastle disease. Tighten biosecurity.', 9);
  note(F.irfan, 'Alert', 'Low stock: Quail Grower Feed', '420 kg left, about 6 days of feed.', 1);
  note(B.priya, 'Order', 'Order accepted', 'Gowda Poultry Farm accepted your egg order.', 0.5);
  note(B.priya, 'Order', 'Order delivered', 'Coastal Desi Farms marked your Kadaknath eggs as delivered.', 4, true);
  note(B.priya, 'System', 'Welcome to PoultrySmart', 'Browse fresh listings from verified farms and chat directly with farmers.', 60, true);
  const noteDocs = await Notification.insertMany(notes.map((n) => n.doc));
  await backdate(Notification, noteDocs.map((d, i) => [d._id, notes[i].at]));

  // ---- supply orders placed by the demo farmer from the Farm Store
  const supplies = [
    ['National Agro Supplies', [['Premium Layer Mash (50kg)', 4, 1500, 'Feed', '/assets/images/Layer-mesh.webp']], 'Delivered', 40],
    ['PoultryMed Pharma', [['Liquid Multivitamins 1L', 3, 450, 'Medicine', '/assets/images/Liquid.webp'], ['Disinfectant Spray 5L', 1, 850, 'Supplies', '/assets/images/Disinfectant.webp']], 'Delivered', 21],
    ['Sunrise Hatcheries', [['Automatic Bell Drinker', 6, 250, 'Equipment', '/assets/images/equipment_drinker.webp']], 'Shipped', 2],
    ['National Agro Supplies', [['Broiler Starter Crumbles', 2, 1800, 'Feed', '/assets/images/Starter.webp']], 'Ordered', 0.3],
  ];
  const supplyRows = [];
  for (const [storeName, items, status, age] of supplies) {
    const so = await SupplyOrder.create({ user: F.ramesh._id, storeName, status, items: items.map(([name, quantity, price, category, image]) => ({ name, quantity, price, category, image })),
      totalAmount: items.reduce((s, [, q, p]) => s + q * p, 0), deliveryEstimate: daysAgo(age - 3) });
    supplyRows.push([so._id, daysAgo(age)]);
  }
  await backdate(SupplyOrder, supplyRows);

  // ---- a few saved egg predictions
  const preds = [];
  for (const age of [30, 14, 3]) {
    const p = await Prediction.create({ farmer: F.ramesh._id, inputData: { chickens: 4700, age: 38, feedQuality: 'High', feedQty: 520, temperature: 30, humidity: 65, lighting: 16, breed: 'BV-300' }, predictedEggs: int(3950, 4150), confidence: 0.82 });
    preds.push([p._id, daysAgo(age)]);
  }
  await backdate(Prediction, preds);

  // ---- 90 days of sample market-rate history (for the rates chart)
  const RATES = { 'egg-tray': [150, 172], 'egg-single': [5.0, 5.75], 'egg-dozen': [64, 74], 'broiler-live': [96, 118], 'chick-broiler': [28, 38], 'layer-feed': [2060, 2180] };
  const history = [];
  for (const [rateId, [lo, hi]] of Object.entries(RATES)) {
    let v = lo + (hi - lo) * 0.35;
    for (let d = 89; d >= 0; d--) {
      v += (hi - lo) * (between(-0.06, 0.07) + (d < 20 ? 0.012 : 0)); // gentle festive-season rise at the end
      v = Math.min(hi, Math.max(lo, v));
      history.push({ rateId, date: daysAgo(d, 6), price: Math.round(v * (hi > 100 ? 1 : 100)) / (hi > 100 ? 1 : 100), region: 'Sample', isSample: true });
    }
  }
  await MarketRateHistory.insertMany(history);

  return { users: created.length, farms: FARMERS.length, listings: listingDocs.length, inventory: invDocs.length, orders: orderDocs.length,
    logs: insertedLogs.length, chats: chatDocs.length, posts: postRows.length, notifications: noteDocs.length, supplies: supplyRows.length, rateHistory: history.length,
    statuses: orders.reduce((m, o) => ({ ...m, [o.doc.status]: (m[o.doc.status] || 0) + 1 }), {}) };
}

(async () => {
  const target = config.mongoUri.replace(/\/\/([^@/]+)@/, '//***@');
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log(`Connected to ${target}`);
    const removed = await removeDemoData();
    if (removed) console.log(`Removed the previous demo data (${removed} demo accounts and everything they owned).`);
    if (REMOVE_ONLY) { console.log('Demo data removed.'); return; }
    const s = await seed();
    console.log('\nDemo data created (SAMPLE data, prices in INR are illustrative):');
    console.log(`  ${s.users} users, ${s.farms} farms + stores, ${s.listings} listings, ${s.inventory} inventory items`);
    console.log(`  ${s.orders} orders ${JSON.stringify(s.statuses)}, 3 with a reported problem`);
    console.log(`  ${s.logs} daily farm records, ${s.chats} chat messages, ${s.posts} community posts, ${s.notifications} alerts, ${s.supplies} supply orders, ${s.rateHistory} market-rate points`);
    console.log('\nDemo accounts (password for all: Demo@1234):');
    console.log(`  Farmer : farmer${DEMO_DOMAIN}   (Ramesh Gowda, Gowda Poultry Farm)`);
    console.log(`  Buyer  : buyer${DEMO_DOMAIN}    (Priya Sharma, FreshBasket Mart)`);
    console.log(`  Admin  : admin${DEMO_DOMAIN}`);
    console.log(`  Other farmers: ${FARMERS.slice(1).map((f) => f.email).join(', ')}`);
  } catch (err) {
    console.error('Demo seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
