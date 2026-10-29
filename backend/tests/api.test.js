/**
 * API tests: run with `npm test`.
 * Uses an in-memory MongoDB (mongodb-memory-server), so no real database or secrets are needed.
 * The first run downloads a MongoDB binary (~100 MB) into node_modules/.cache.
 */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo, request, app, mongoose;

before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongo.getUri('poultrysmart_test');
  process.env.JWT_SECRET = 'test-secret-that-is-long-enough-1234567890';
  delete process.env.GEMINI_API_KEY;
  app = require('../app');
  mongoose = require('mongoose');
  request = require('supertest')(app);
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const auth = (t) => ({ Authorization: `Bearer ${t}` });
const register = async (body) => request.post('/api/auth/register').send({ password: 'secret-pass-1', ...body });

const state = {};

describe('auth', () => {
  test('health check works without a database call', async () => {
    const res = await request.get('/api/health-check');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(JSON.stringify(res.body).includes('Secret'), false);
  });

  test('register with email returns a token and no password', async () => {
    const res = await register({ name: 'Farmer Ravi', emailOrPhone: 'Ravi@Example.com', role: 'Farmer' });
    assert.equal(res.status, 201, res.text);
    assert.ok(res.body.token);
    assert.equal(res.body.email, 'ravi@example.com');
    assert.equal(res.body.password, undefined);
    state.farmer = res.body;
  });

  test('duplicate email is rejected with 409', async () => {
    const res = await register({ name: 'Again', emailOrPhone: 'ravi@example.com', role: 'Farmer' });
    assert.equal(res.status, 409);
  });

  test('register with a phone number works (was broken: email was required)', async () => {
    const res = await register({ name: 'Buyer Asha', emailOrPhone: '+91 98450 12345', role: 'Buyer' });
    assert.equal(res.status, 201, res.text);
    assert.equal(res.body.phone, '9845012345');
    state.buyer = res.body;
  });

  test('login by phone with or without +91', async () => {
    for (const identifier of ['9845012345', '+919845012345']) {
      const res = await request.post('/api/auth/login').send({ identifier, password: 'secret-pass-1' });
      assert.equal(res.status, 200, identifier);
    }
  });

  test('login is case-insensitive for email (was broken)', async () => {
    const res = await request.post('/api/auth/login').send({ identifier: 'RAVI@example.COM', password: 'secret-pass-1' });
    assert.equal(res.status, 200);
  });

  test('wrong password gives 401 with a safe message', async () => {
    const res = await request.post('/api/auth/login').send({ identifier: 'ravi@example.com', password: 'nope-nope' });
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Incorrect/);
  });

  test('validation: short password, bad phone, bad role', async () => {
    let res = await register({ name: 'X Y', emailOrPhone: 'x@y.com', role: 'Farmer', password: 'short' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /8 characters/);
    res = await register({ name: 'X Y', emailOrPhone: '12345', role: 'Farmer' });
    assert.equal(res.status, 400);
    res = await register({ name: 'X Y', emailOrPhone: 'z@y.com', role: 'Admin' });
    assert.equal(res.status, 400);
  });

  test('protected routes need a token, and farmer routes need a farmer', async () => {
    assert.equal((await request.get('/api/farms')).status, 401);
    assert.equal((await request.get('/api/farms').set(auth('garbage'))).status, 401);
    assert.equal((await request.get('/api/farms').set(auth(state.buyer.token))).status, 403);
    assert.equal((await request.get('/api/farms').set(auth(state.farmer.token))).status, 200);
  });
});

describe('marketplace', () => {
  test('farmer creates a listing; invalid prices are rejected', async () => {
    let res = await request.post('/api/marketplace').set(auth(state.farmer.token))
      .send({ productName: 'Fresh Eggs (Tray of 30)', quantity: 10, pricePerUnit: 170 });
    assert.equal(res.status, 201, res.text);
    assert.equal(res.body.category, 'EGG');
    assert.equal(res.body.priceCheck.checked, true);
    assert.equal(res.body.priceCheck.low, false);
    state.listing = res.body;

    res = await request.post('/api/marketplace').set(auth(state.farmer.token))
      .send({ productName: 'Eggs', quantity: 5, pricePerUnit: -3 });
    assert.equal(res.status, 400);
  });

  test('fair price guard warns on a very low price', async () => {
    const res = await request.post('/api/marketplace').set(auth(state.farmer.token))
      .send({ productName: 'Eggs tray of 30', quantity: 5, pricePerUnit: 60 });
    assert.equal(res.status, 201);
    assert.equal(res.body.priceCheck.low, true);
    assert.match(res.body.priceCheck.message, /below the reference rate/);
  });

  test('buyer can browse listings (was broken: 403) and no farmer email is exposed', async () => {
    const res = await request.get('/api/marketplace').set(auth(state.buyer.token));
    assert.equal(res.status, 200);
    assert.ok(res.body.length >= 1);
    assert.equal(res.body[0].farmer.email, undefined);
    assert.equal((await request.get('/api/marketplace/orders/me').set(auth(state.buyer.token))).status, 200);
  });

  test('orders: negative, zero and too-large quantities are rejected', async () => {
    for (const q of [-50, 0, 1.5]) {
      const res = await request.post('/api/marketplace/orders').set(auth(state.buyer.token)).send({ listingId: state.listing._id, quantityOrdered: q });
      assert.equal(res.status, 400, `qty ${q}`);
    }
    const res = await request.post('/api/marketplace/orders').set(auth(state.buyer.token)).send({ listingId: state.listing._id, quantityOrdered: 11 });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Only 10 left/);
  });

  test('farmer cannot order their own listing', async () => {
    const res = await request.post('/api/marketplace/orders').set(auth(state.farmer.token)).send({ listingId: state.listing._id, quantityOrdered: 1 });
    assert.equal(res.status, 400);
  });

  test('valid order reserves stock; parallel orders never oversell', async () => {
    const res = await request.post('/api/marketplace/orders').set(auth(state.buyer.token)).send({ listingId: state.listing._id, quantityOrdered: 4 });
    assert.equal(res.status, 201, res.text);
    assert.equal(res.body.totalPrice, 680);
    state.order = res.body;
    // 6 left: fire four orders of 2 at once; exactly three can succeed.
    const results = await Promise.all([1, 2, 3, 4].map(() =>
      request.post('/api/marketplace/orders').set(auth(state.buyer.token)).send({ listingId: state.listing._id, quantityOrdered: 2 })));
    assert.equal(results.filter((r) => r.status === 201).length, 3);
    const Listing = require('../models/Listing');
    const l = await Listing.findById(state.listing._id);
    assert.equal(l.quantity, 0);
    assert.equal(l.isAvailable, false);
  });

  test('rejecting an order returns stock; invalid transitions are refused', async () => {
    let res = await request.put(`/api/marketplace/orders/${state.order._id}/status`).set(auth(state.farmer.token)).send({ status: 'Rejected' });
    assert.equal(res.status, 200, res.text);
    const Listing = require('../models/Listing');
    const l = await Listing.findById(state.listing._id);
    assert.equal(l.quantity, 4);
    assert.equal(l.isAvailable, true);
    res = await request.put(`/api/marketplace/orders/${state.order._id}/status`).set(auth(state.farmer.token)).send({ status: 'Completed' });
    assert.equal(res.status, 400);
    res = await request.put(`/api/marketplace/orders/${state.order._id}/status`).set(auth(state.farmer.token)).send({ status: 'Shipped' });
    assert.equal(res.status, 400);
  });

  test('report a problem on an order, then resolve it', async () => {
    let res = await request.post(`/api/marketplace/orders/${state.order._id}/report`).set(auth(state.buyer.token)).send({ reason: 'Not delivered', details: 'Waited 3 days' });
    assert.equal(res.status, 201, res.text);
    assert.equal(res.body.issue.status, 'Open');
    res = await request.post(`/api/marketplace/orders/${state.order._id}/report`).set(auth(state.buyer.token)).send({ reason: 'Other' });
    assert.equal(res.status, 400);
    res = await request.put(`/api/marketplace/orders/${state.order._id}/report/resolve`).set(auth(state.farmer.token));
    assert.equal(res.status, 200);
    assert.equal(res.body.issue.status, 'Resolved');
  });

  test('bad ids return 400, unknown API routes return JSON 404', async () => {
    assert.equal((await request.delete('/api/marketplace/not-an-id').set(auth(state.farmer.token))).status, 400);
    const res = await request.get('/api/does-not-exist');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});

describe('chat', () => {
  test('buyer and farmer with an order can message; strangers cannot', async () => {
    let res = await request.post(`/api/chat/${state.farmer._id}`).set(auth(state.buyer.token)).send({ message: 'Hello, when can you deliver?' });
    assert.equal(res.status, 201, res.text);
    res = await request.get('/api/chat/contacts').set(auth(state.farmer.token));
    assert.equal(res.status, 200);
    assert.equal(res.body[0].unread, 1);
    res = await request.get(`/api/chat/${state.buyer._id}`).set(auth(state.farmer.token));
    assert.equal(res.body.length, 1);
    const stranger = await register({ name: 'Stranger', emailOrPhone: 'stranger@example.com', role: 'Buyer' });
    res = await request.post(`/api/chat/${state.farmer._id}`).set(auth(stranger.body.token)).send({ message: 'spam' });
    assert.equal(res.status, 403);
  });
});

describe('inventory, store, community, supplies', () => {
  test('inventory update cannot change the owner; other farmers get 403', async () => {
    let res = await request.post('/api/inventory').set(auth(state.farmer.token)).send({ itemName: 'Layer Mash', category: 'Feed', quantity: 20, unit: 'Bags' });
    assert.equal(res.status, 201, res.text);
    const id = res.body._id;
    const other = await register({ name: 'Other Farmer', emailOrPhone: 'other@example.com', role: 'Farmer' });
    res = await request.put(`/api/inventory/${id}`).set(auth(state.farmer.token)).send({ quantity: 18, farmer: other.body._id });
    assert.equal(res.status, 200);
    assert.equal(res.body.farmer, state.farmer._id);
    assert.equal(res.body.quantity, 18);
    res = await request.put(`/api/inventory/${id}`).set(auth(other.body.token)).send({ quantity: 0 });
    assert.equal(res.status, 403);
  });

  test('store: images up to ~1 MB save (was failing above ~75 KB); public list hides emails; oversize body gives 413', async () => {
    const img = 'data:image/jpeg;base64,' + Buffer.alloc(900_000, 7).toString('base64').slice(0, 1_200_000);
    let res = await request.post('/api/stores').set(auth(state.farmer.token)).send({ name: 'Ravi Farm Store', location: 'Udupi', image: img });
    assert.equal(res.status, 201, res.text.slice(0, 200));
    res = await request.get('/api/stores');
    assert.equal(res.status, 200);
    assert.equal(res.body[0].user.email, undefined);
    const huge = 'data:image/jpeg;base64,' + 'A'.repeat(2_500_000);
    res = await request.post('/api/stores').set(auth(state.farmer.token)).send({ name: 'Ravi Farm Store', image: huge });
    assert.equal(res.status, 413);
  });

  test('community: one upvote per user (toggle), tags filter', async () => {
    let res = await request.post('/api/community').set(auth(state.farmer.token)).send({ title: 'Heat tips', content: 'Use foggers', tags: ['Weather'] });
    assert.equal(res.status, 201, res.text);
    const id = res.body._id;
    res = await request.put(`/api/community/${id}/upvote`).set(auth(state.buyer.token));
    assert.deepEqual([res.body.upvotes, res.body.hasUpvoted], [1, true]);
    res = await request.put(`/api/community/${id}/upvote`).set(auth(state.buyer.token));
    assert.deepEqual([res.body.upvotes, res.body.hasUpvoted], [0, false]);
    res = await request.get('/api/community?tag=Weather').set(auth(state.buyer.token));
    assert.equal(res.body.length, 1);
    res = await request.get('/api/community?tag=Pest%20Alert').set(auth(state.buyer.token));
    assert.equal(res.body.length, 0);
  });

  test('supply order total is calculated by the server; receiving adds stock once', async () => {
    let res = await request.post('/api/supplies/order').set(auth(state.farmer.token)).send({
      storeName: 'Agro Store', totalAmount: 1, items: [{ name: 'Vitamin Mix', category: 'Medicine', price: 250, quantity: 2 }],
    });
    assert.equal(res.status, 201, res.text);
    assert.equal(res.body.totalAmount, 500);
    const id = res.body._id;
    const [a, b] = await Promise.all([1, 2].map(() => request.put(`/api/supplies/${id}/receive`).set(auth(state.farmer.token))));
    assert.deepEqual([a.status, b.status].sort(), [200, 400]);
    const inv = await request.get('/api/inventory').set(auth(state.farmer.token));
    assert.equal(inv.body.items.find((i) => i.itemName === 'Vitamin Mix').quantity, 2);
  });
});

describe('AI and smart features without an AI key', () => {
  test('chat answers in offline mode instead of failing', async () => {
    const res = await request.post('/api/ai/chat').set(auth(state.farmer.token)).send({ message: 'How to increase eggs?' });
    assert.equal(res.status, 200);
    assert.equal(res.body.offline, true);
  });

  test('photo scan returns a clear 503 without a key, and rejects non-images', async () => {
    let res = await request.post('/api/ai/process-photo').set(auth(state.farmer.token)).attach('photo', Buffer.from([0xff, 0xd8, 0xff]), { filename: 'bill.jpg', contentType: 'image/jpeg' });
    assert.equal(res.status, 503);
    res = await request.post('/api/ai/process-photo').set(auth(state.farmer.token)).attach('photo', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' });
    assert.equal(res.status, 400);
  });

  test('prediction is deterministic (no random confidence)', async () => {
    const body = { chickens: 1000, age: 30, feedQuality: 'Good', feedQty: 115, temperature: 26, lighting: 15, breed: 'Leghorn' };
    const a = await request.post('/api/ai/predict').set(auth(state.farmer.token)).send(body);
    const b = await request.post('/api/ai/predict').set(auth(state.farmer.token)).send(body);
    assert.equal(a.status, 200, a.text);
    assert.equal(a.body.prediction.confidence, b.body.prediction.confidence);
    assert.equal(a.body.prediction.predictedEggs, 900);
  });

  test('market rates, schemes, buyer matches and daily report respond', async () => {
    const rates = await request.get('/api/market/rates').set(auth(state.buyer.token));
    assert.equal(rates.status, 200);
    assert.ok(rates.body.rates.length > 0);
    assert.equal(rates.body.rates[0].keywords, undefined);
    for (const path of ['/api/smart/schemes', '/api/smart/buyer-matches', '/api/smart/daily-report']) {
      const res = await request.get(path).set(auth(state.farmer.token));
      assert.equal(res.status, 200, path);
    }
    const matches = await request.get('/api/smart/buyer-matches').set(auth(state.farmer.token));
    assert.equal(matches.body[0].name, 'Buyer Asha');
  });
});
