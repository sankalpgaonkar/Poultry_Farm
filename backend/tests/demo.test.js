/**
 * Demo seed + demo-only features: idempotent seed, production guard, demo logins,
 * admin overview, alerts, sales stats, market-rate history and public landing stats.
 */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo, request, mongoose, uri;
const SEED = path.join(__dirname, '..', 'scripts', 'seedDemo.js');
// Async on purpose: a blocking spawnSync would stall the in-memory MongoDB that lives in this process.
const runSeed = (env = {}, args = []) => new Promise((resolve) => {
  const child = spawn(process.execPath, [SEED, ...args], { env: { ...process.env, NODE_ENV: 'development', MONGODB_URI: uri, JWT_SECRET: '', ...env } });
  let stdout = ''; let stderr = '';
  child.stdout.on('data', (d) => { stdout += d; });
  child.stderr.on('data', (d) => { stderr += d; });
  child.on('close', (status) => resolve({ status, stdout, stderr }));
});

before(async () => {
  mongo = await MongoMemoryServer.create();
  uri = mongo.getUri('poultrysmart_demo_test');
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test-secret-that-is-long-enough-1234567890';
  delete process.env.GEMINI_API_KEY;
});

after(async () => {
  if (mongoose) await mongoose.disconnect();
  await mongo.stop();
});

const auth = (t) => ({ Authorization: `Bearer ${t}` });
const login = async (identifier) => {
  const res = await request.post('/api/auth/login').send({ identifier, password: 'Demo@1234' });
  assert.equal(res.status, 200, res.text);
  return res.body;
};

describe('demo seed', () => {
  test('refuses to run with NODE_ENV=production unless --force', async () => {
    const res = await runSeed({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(40) });
    assert.equal(res.status, 1);
    assert.match(res.stderr, /Refusing to seed demo data/);
  });

  test('creates the demo data and prints the demo accounts', async () => {
    const res = await runSeed();
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /farmer@demo\.poultrysmart/);
    assert.match(res.stdout, /Demo@1234/);
    assert.match(res.stdout, /48 orders/);
  });

  test('is idempotent: a second run replaces the demo data instead of duplicating it', async () => {
    const res = await runSeed();
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /Removed the previous demo data \(11 demo accounts/);
    // Now load the app against the seeded database.
    request = require('supertest')(require('../app'));
    mongoose = require('mongoose');
    await require('../config/db')();
    const User = require('../models/User');
    const Order = require('../models/Order');
    const Listing = require('../models/Listing');
    assert.equal(await User.countDocuments(), 11);
    assert.equal(await Order.countDocuments(), 48);
    assert.ok((await Listing.countDocuments()) >= 40);
    const statuses = await Order.distinct('status');
    for (const s of ['Pending', 'Accepted', 'Completed', 'Rejected']) assert.ok(statuses.includes(s), s);
    assert.equal(await Order.countDocuments({ 'issue.status': 'Open' }), 2);
  });
});

describe('demo features', () => {
  const s = {};
  test('demo farmer, buyer and admin can log in', async () => {
    s.farmer = await login('farmer@demo.poultrysmart');
    s.buyer = await login('BUYER@demo.poultrysmart');
    s.admin = await login('admin@demo.poultrysmart');
    assert.equal(s.farmer.role, 'Farmer');
    assert.equal(s.buyer.role, 'Buyer');
    assert.equal(s.admin.role, 'Admin');
  });

  test('signup cannot create an Admin account', async () => {
    const res = await request.post('/api/auth/register').send({ name: 'Sneaky', emailOrPhone: 'sneaky@example.com', password: 'secret-pass-1', role: 'Admin' });
    assert.equal(res.status, 400);
  });

  test('public stats are labelled as demo data', async () => {
    const res = await request.get('/api/public/stats');
    assert.equal(res.status, 200);
    assert.equal(res.body.demo, true);
    assert.equal(res.body.farmers, 5);
    assert.ok(res.body.eggsLogged > 0);
  });

  test('farmer sales stats cover 90 days with every status', async () => {
    const res = await request.get('/api/marketplace/stats?days=90').set(auth(s.farmer.token));
    assert.equal(res.status, 200, res.text);
    assert.ok(res.body.daily.length > 5);
    assert.ok(res.body.top.length > 0);
    const buyer = await request.get('/api/marketplace/stats').set(auth(s.buyer.token));
    assert.equal(buyer.status, 200);
    assert.ok(Object.keys(buyer.body.byStatus).length > 0);
  });

  test('admin overview is admin-only, and an admin can resolve a reported problem', async () => {
    assert.equal((await request.get('/api/admin/overview').set(auth(s.farmer.token))).status, 403);
    assert.equal((await request.get('/api/admin/overview')).status, 401);
    const res = await request.get('/api/admin/overview').set(auth(s.admin.token));
    assert.equal(res.status, 200);
    assert.equal(res.body.openIssues.length, 2);
    assert.equal(res.body.totals.farmers, 5);
    const id = res.body.openIssues[0]._id;
    const done = await request.put(`/api/admin/orders/${id}/resolve`).set(auth(s.admin.token));
    assert.equal(done.status, 200);
    assert.equal(done.body.issue.status, 'Resolved');
    assert.equal((await request.put(`/api/admin/orders/${id}/resolve`).set(auth(s.admin.token))).status, 400);
  });

  test('alerts: list, unread count and mark all read', async () => {
    const res = await request.get('/api/notifications').set(auth(s.farmer.token));
    assert.equal(res.status, 200);
    assert.ok(res.body.unread > 0);
    await request.put('/api/notifications/read-all').set(auth(s.farmer.token));
    const after = await request.get('/api/notifications').set(auth(s.farmer.token));
    assert.equal(after.body.unread, 0);
    // A buyer never sees the farmer's alerts.
    const buyer = await request.get('/api/notifications').set(auth(s.buyer.token));
    assert.ok(buyer.body.items.every((n) => n.title !== 'Low stock: Shell Grit / Calcium'));
  });

  test('market-rate history returns 90 sample points per rate', async () => {
    const res = await request.get('/api/market/rates/history?days=90').set(auth(s.buyer.token));
    assert.equal(res.status, 200);
    assert.equal(res.body.isSample, true);
    assert.ok(res.body.series['egg-tray'].length >= 89);
  });

  test('--remove clears the demo data', async () => {
    const res = await runSeed({}, ['--remove']);
    assert.equal(res.status, 0, res.stderr);
    const User = require('../models/User');
    assert.equal(await User.countDocuments({ email: /@demo\.poultrysmart$/ }), 0);
  });
});
