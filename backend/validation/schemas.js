const { z } = require('zod');

// Treat "" and null from HTML forms as "not provided".
const blank = (v) => (v === '' || v === null ? undefined : v);
const num = (min, max) => z.preprocess(blank, z.coerce.number({ invalid_type_error: 'must be a number' }).finite().min(min).max(max));
const int = (min, max) => z.preprocess(blank, z.coerce.number({ invalid_type_error: 'must be a number' }).int('must be a whole number').min(min).max(max));
const text = (min, max) => z.string().trim().min(min, min === 1 ? 'is required' : `must be at least ${min} characters`).max(max, `must be at most ${max} characters`);
const optText = (max) => z.preprocess(blank, z.string().trim().max(max).optional());
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'is not a valid id');
const idParam = z.object({ id: objectId });
// Images arrive as compressed data URLs from the browser, or as a site-relative path.
const image = z.preprocess(blank, z.string().max(1_500_000, 'image is too large').refine(
  (s) => /^data:image\/(png|jpe?g|webp|gif);base64,/.test(s) || /^\/[\w\-./]+$/.test(s),
  'must be an uploaded image'
).optional());

const PHONE_RE = /^(?:\+?91[\s-]?)?[6-9]\d{9}$/;
const normalizePhone = (raw) => {
  const digits = String(raw).replace(/[\s\-()]/g, '');
  return digits.replace(/^(\+?91)(?=\d{10}$)/, '');
};
const identifier = z.string().trim().min(1, 'Email or phone number is required').max(120).transform((v, ctx) => {
  if (v.includes('@')) {
    const email = v.toLowerCase();
    if (!z.string().email().safeParse(email).success) ctx.addIssue({ code: 'custom', message: 'Enter a valid email address' });
    return { email };
  }
  const compact = v.replace(/[\s\-()]/g, '');
  if (!PHONE_RE.test(compact)) ctx.addIssue({ code: 'custom', message: 'Enter a valid 10-digit mobile number or an email address' });
  return { phone: normalizePhone(compact) };
});

const auth = {
  register: z.object({
    name: text(2, 80),
    emailOrPhone: identifier,
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    role: z.enum(['Farmer', 'Buyer'], { errorMap: () => ({ message: 'Choose Farmer or Buyer' }) }),
  }),
  login: z.object({
    identifier: z.string().optional(),
    email: z.string().optional(),
    password: z.string().min(1, 'Password is required').max(128),
  }).transform((v, ctx) => {
    const raw = (v.identifier || v.email || '').trim();
    if (!raw) { ctx.addIssue({ code: 'custom', path: ['identifier'], message: 'Email or phone number is required' }); return z.NEVER; }
    return { raw, password: v.password };
  }),
};

const vaccination = z.object({
  disease: text(1, 80),
  date: z.preprocess(blank, z.coerce.date().optional()),
  status: z.enum(['Pending', 'Completed']).optional(),
});
const farm = {
  create: z.object({
    name: text(1, 100),
    location: text(1, 200),
    totalChickens: int(0, 10_000_000).optional(),
    vaccinationSchedule: z.array(vaccination).max(100).optional(),
  }),
};
farm.update = farm.create.partial();

const log = {
  create: z.object({
    farmId: objectId,
    date: z.preprocess(blank, z.coerce.date().max(new Date(Date.now() + 86_400_000), 'cannot be in the future').optional()),
    totalEggs: int(0, 10_000_000),
    temperature: num(-20, 60).optional(),
    humidity: num(0, 100).optional(),
    feedConsumed: num(0, 1_000_000).optional(),
    mortalityCount: int(0, 1_000_000).optional(),
    currentChickenCount: int(0, 10_000_000).optional(),
  }),
};

const CATEGORY = ['EGG', 'BIRD', 'FEED', 'EQUIPMENT', 'OTHER'];
const marketplace = {
  listing: z.object({
    productName: text(2, 120),
    description: optText(1000),
    quantity: int(1, 10_000_000),
    pricePerUnit: num(0.01, 10_000_000),
    image,
    category: z.preprocess(blank, z.enum(CATEGORY).optional()),
  }),
  order: z.object({ listingId: objectId, quantityOrdered: int(1, 10_000_000) }),
  status: z.object({ status: z.enum(['Pending', 'Accepted', 'Rejected', 'Completed']) }),
  report: z.object({
    reason: z.enum(['Not delivered', 'Wrong quantity', 'Poor quality', 'Payment not received', 'Other']),
    details: optText(1000),
  }),
};

const INV_CAT = ['Feed', 'Medicine', 'Equipment', 'Other'];
const inventoryItem = z.object({
  itemName: text(1, 120),
  category: z.preprocess(blank, z.enum(INV_CAT).optional()),
  quantity: num(0, 10_000_000),
  unit: text(1, 30),
  lowStockThreshold: num(0, 10_000_000).optional(),
  dailyConsumptionRate: num(0, 10_000_000).optional(),
});
const inventory = {
  create: inventoryItem,
  update: inventoryItem.partial(),
  bulk: z.object({
    items: z.array(inventoryItem.extend({ unit: optText(30), quantity: num(0, 10_000_000) })).min(1, 'No items to add').max(100),
  }),
};

const store = {
  profile: z.object({ name: text(2, 100), description: optText(1000), location: optText(200), image }),
  product: z.object({
    name: text(1, 120),
    price: num(0, 10_000_000),
    description: optText(1000),
    category: optText(60),
    image,
  }),
  productParam: z.object({ productId: objectId }),
};

const COMMUNITY_TAGS = ['Market Price', 'Weather', 'Pest Alert', 'Advice', 'Question'];
const community = {
  post: z.object({
    title: text(3, 150),
    content: text(1, 5000),
    tags: z.array(z.enum(COMMUNITY_TAGS)).max(3).optional(),
  }),
  comment: z.object({ content: text(1, 2000) }),
  query: z.object({ tag: z.enum(COMMUNITY_TAGS).optional() }).passthrough(),
};

const supply = {
  order: z.object({
    storeName: text(1, 120),
    items: z.array(z.object({
      name: text(1, 120),
      category: optText(60),
      price: num(0, 10_000_000),
      quantity: int(1, 100_000),
      image: optText(500),
    })).min(1, 'Your cart is empty').max(100),
  }),
};

const nonNeg = num(0, 100_000_000);
const finance = {
  calculate: z.object({
    birdsCount: nonNeg, dailyFeedKg: nonNeg, feedCostPerKg: nonNeg, dailyEggProduction: nonNeg,
    eggSalePrice: nonNeg, laborCostDaily: nonNeg, utilitiesCostDaily: nonNeg,
  }),
};

const health = { analyze: z.object({ symptoms: z.array(text(1, 100)).min(1, 'Select at least one symptom').max(30) }) };

const ai = {
  predict: z.object({
    chickens: num(0, 10_000_000).optional(), age: num(0, 520).optional(),
    feedQuality: optText(30), feedQty: num(0, 1_000_000).optional(),
    temperature: num(-20, 60).optional(), humidity: num(0, 100).optional(),
    lighting: num(0, 24).optional(), breed: optText(60),
    farmId: z.preprocess(blank, objectId.optional()),
  }),
  chat: z.object({
    message: text(1, 2000),
    history: z.array(z.object({ role: z.string().max(20), text: z.string().max(4000).optional(), content: z.string().max(4000).optional() }).passthrough()).max(30).optional(),
  }),
};

const chat = {
  userParam: z.object({ userId: objectId }),
  send: z.object({ message: text(1, 2000) }),
};

module.exports = {
  z, objectId, idParam, normalizePhone, auth, farm, log, marketplace, inventory, store, community, supply, finance, health, ai, chat,
  COMMUNITY_TAGS,
};
