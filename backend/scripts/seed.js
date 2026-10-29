/**
 * Demo data seeder.
 *
 * WARNING: this DELETES all users, farms, listings, orders, logs, posts and inventory
 * in the database it points at, then inserts demo data.
 *
 * Usage:  npm run seed -- --yes
 * It refuses to run when NODE_ENV=production unless ALLOW_SEED=true is also set.
 */
require('dotenv').config();

const User = require('../models/User');
const Farm = require('../models/Farm');
const Listing = require('../models/Listing');
const EggProductionLog = require('../models/EggProductionLog');
const CommunityPost = require('../models/CommunityPost');
const SupplyOrder = require('../models/SupplyOrder');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const connectDB = require('../config/db');

if (!process.argv.includes('--yes')) {
  console.error('This wipes the target database. Re-run with:  npm run seed -- --yes');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
  console.error('Refusing to seed a production database (set ALLOW_SEED=true if you really mean it).');
  process.exit(1);
}

const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'demo-password-123';

const indianSeed = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Farm.deleteMany(),
      Listing.deleteMany(),
      EggProductionLog.deleteMany(),
      CommunityPost.deleteMany(),
      SupplyOrder.deleteMany(),
      Order.deleteMany(),
      Inventory.deleteMany()
    ]);

    console.log('Cleanup complete. Seeding Indian Farmer Data...');

    // 1. Create Users
    const users = await User.create([
      { name: 'Sankalp (Farmer)', email: 'test@example.com', password: DEMO_PASSWORD, role: 'Farmer', phone: '9988776655' },
      { name: 'Rajesh Trading Co (Buyer)', email: 'buyer@example.com', password: DEMO_PASSWORD, role: 'Buyer', phone: '8877665544' },
      { name: 'Priya Mahadev (Farmer)', email: 'priya@example.com', password: DEMO_PASSWORD, role: 'Farmer', phone: '7766554433' }
    ]);

    const farmer = users[0];
    const buyer = users[1];
    const otherFarmer = users[2];

    // 2. Create Farms
    const farms = await Farm.create([
      { farmer: farmer._id, name: 'Sankalp Poultry Farm', location: 'Namakkal, Tamil Nadu', totalChickens: 5000 },
      { farmer: otherFarmer._id, name: 'Priya Organic Poultry', location: 'Pune, Maharashtra', totalChickens: 2000 }
    ]);

    const mainFarm = farms[0];

    // 3. Create active listings
    const listings = await Listing.create([
      // Eggs
      { farmer: farmer._id, productName: 'Farm Fresh White Eggs (Tray of 30)', category: 'EGG', quantity: 100, pricePerUnit: 180, description: 'Freshly collected white eggs from Namakkal.' },
      { farmer: farmer._id, productName: 'Organic Desi Eggs (Dozen)', category: 'EGG', quantity: 50, pricePerUnit: 120, description: 'Healthy desi eggs from free-range birds.' },
      
      // Birds
      { farmer: farmer._id, productName: 'Day Old Broiler Chicks (Cobbs)', category: 'BIRD', quantity: 2000, pricePerUnit: 35, description: 'High-quality Cobb 500 chicks, fully vaccinated.' },
      { farmer: otherFarmer._id, productName: 'BV 300 Layer Pullets (16 Weeks)', category: 'BIRD', quantity: 500, pricePerUnit: 450, description: 'BV 300 layers about to start laying.' },

      // Feeds
      { farmer: farmer._id, productName: 'Suguna Broiler Pre-Starter Feed', category: 'FEED', quantity: 50, pricePerUnit: 2400, description: 'High protein pre-starter for fast growth.' },
      { farmer: otherFarmer._id, productName: 'Godrej Layer Mash Feed (50kg)', category: 'FEED', quantity: 80, pricePerUnit: 2150, description: 'Balanced nutrition for layer birds.' },

      // Equipment
      { farmer: farmer._id, productName: 'Automatic Nipple Drinkers (Set of 10)', category: 'EQUIPMENT', quantity: 20, pricePerUnit: 1500, description: 'Mess-free watering for large flocks.' }
    ]);

    // 4. Create historical logs (30 days)
    const productionLogs = [];
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const logDate = new Date(now);
      logDate.setDate(logDate.getDate() - i);
      
      const tempBase = 28 + Math.sin(i / 5) * 4; // Typical Indian summer temp (28-32)
      const eggsBase = 4200; // ~85% production rate for 5000 birds
      
      productionLogs.push({
        farm: mainFarm._id,
        farmer: farmer._id,
        date: logDate,
        totalEggs: eggsBase + Math.floor(Math.random() * 200) - (tempBase > 31 ? 150 : 0),
        temperature: tempBase + Math.random() * 2,
        humidity: 50 + Math.random() * 15,
        currentChickenCount: 5000,
        feedConsumed: 600 + Math.random() * 20, // (120g per bird)
        mortalityCount: Math.random() > 0.9 ? Math.floor(Math.random() * 5) : 0
      });
    }
    await EggProductionLog.insertMany(productionLogs);

    // 5. Create Community Posts
    await CommunityPost.create([
      { author: farmer._id, title: 'Summer Heat Tips for Broilers', content: 'In Namakkal, temps are rising. Keep the foggers clean and add Vitamin C in water during peak hours.', tags: ['Advice'], upvotes: 1, comments: [] },
      { author: otherFarmer._id, title: 'Looking for Maize Suppliers in Maharashtra', content: 'Rates of maize are increasing. Any reliable wholesaler in Sangli or Pune?', tags: ['Market Price'], upvotes: 0, comments: [] }
    ]);

    // 6. Create some orders
    await Order.create([
      { buyer: buyer._id, farmer: farmer._id, listing: listings[0]._id, quantityOrdered: 10, totalPrice: 1800, status: 'Completed' },
      { buyer: buyer._id, farmer: farmer._id, listing: listings[2]._id, quantityOrdered: 1000, totalPrice: 35000, status: 'Pending' }
    ]);

    // 7. Inventory
    await Inventory.create([
      { farmer: farmer._id, itemName: 'Suguna Starter Feed', category: 'Feed', quantity: 25, unit: 'Bags', lowStockThreshold: 10, dailyConsumptionRate: 2.5 },
      { farmer: farmer._id, itemName: 'Ranikhet Vaccine', category: 'Medicine', quantity: 10, unit: 'Vials', lowStockThreshold: 5, dailyConsumptionRate: 0 },
      { farmer: farmer._id, itemName: 'Electrolyte Powder', category: 'Medicine', quantity: 15, unit: 'Packets', lowStockThreshold: 5, dailyConsumptionRate: 0.5 }
    ]);

    console.log('Indian Data Seeding complete! Log in as test@example.com (farmer) or buyer@example.com (buyer) with password: ' + DEMO_PASSWORD + '');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Indian data:', error);
    process.exit(1);
  }
};

indianSeed();
