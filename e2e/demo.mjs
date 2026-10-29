// End-to-end checks for the demo build: landing page (3D hero, poster fallback, layout shift, demo stats),
// demo logins, and a click-through of every page as the demo farmer, buyer and admin.
// Needs: the app running with VITE_DEMO_MODE=true (the default) on a database seeded with `npm run seed:demo`.
//   node e2e/demo.mjs http://localhost:5005   (screenshots go to e2e-out/)
import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.argv[2] || 'http://localhost:5005';
const shots = process.env.E2E_SHOTS || 'e2e-out';
fs.mkdirSync(shots, { recursive: true });
const results = [];
const step = async (name, fn) => {
  try { await fn(); results.push(['PASS', name]); console.log('PASS', name); }
  catch (e) { results.push(['FAIL', name]); console.log('FAIL', name, '-', String(e.message).split('\n')[0].slice(0, 240)); }
};
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const watch = (page, bag) => {
  page.on('pageerror', (e) => bag.push(`pageerror: ${String(e).slice(0, 160)}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) bag.push(`console: ${m.text().slice(0, 160)}`); });
  page.on('response', (r) => { if (r.url().includes('/api/') && r.status() >= 400) bag.push(`${r.status()} ${r.url().replace(base, '')}`); });
};

// ---------------- Landing page ----------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); const errs = []; watch(p, errs);
  await p.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  await step('Landing: hero headline and poster render before the 3D loads', async () => {
    await p.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await p.getByRole('heading', { level: 1, name: /every egg, every bird/i }).waitFor({ timeout: 8000 });
    await p.locator('img[src="/landing/hero-poster.webp"]').waitFor({ state: 'attached', timeout: 5000 });
  });
  await step('Landing: 3D farm scene loads lazily and becomes ready (desktop = full scene)', async () => {
    await p.waitForSelector('[data-hero-3d="full"][data-ready="true"] canvas', { timeout: 25000 });
  });
  await step('Landing: three.js is a separate chunk, not in the first download', async () => {
    const html = await (await fetch(base + '/')).text();
    if (/FarmScene/.test(html)) throw new Error('3D chunk is preloaded from index.html');
  });
  await step('Landing: demo stats counters are labelled as demo data', async () => {
    await p.getByText('Demo data · sample database').scrollIntoViewIfNeeded();
    await p.getByText('Farmers selling').waitFor({ timeout: 5000 });
  });
  await step('Landing: no layout shift (CLS < 0.1) after scrolling the whole page', async () => {
    for (let y = 0; y < 5000; y += 500) { await p.mouse.wheel(0, 500); await p.waitForTimeout(120); }
    const cls = await p.evaluate(() => window.__cls);
    console.log('   CLS =', cls.toFixed(4));
    if (cls >= 0.1) throw new Error(`CLS ${cls}`);
  });
  await step('Landing: "Try the live demo" leads to the login page with the farmer demo filled in', async () => {
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.getByRole('link', { name: /try the live demo/i }).click();
    await p.waitForURL(/\/login\?demo=farmer/);
    if ((await p.locator('#login-1').inputValue()) !== 'farmer@demo.poultrysmart') throw new Error('not prefilled');
  });
  await step('Landing: no page errors', async () => { if (errs.length) throw new Error(errs.join(' | ')); });
  await ctx.close();
}
await step('Landing: reduced-motion users get the static poster, no WebGL canvas', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(base + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  if ((await p.locator('canvas').count()) !== 0) throw new Error('canvas rendered for reduced motion');
  if ((await p.getAttribute('[data-hero-3d]', 'data-hero-3d')) !== 'poster') throw new Error('not poster mode');
  await ctx.close();
});
await step('Landing: phones get the lighter 3D scene', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('[data-hero-3d="lite"][data-ready="true"]', { timeout: 25000 });
  await p.screenshot({ path: `${shots}/landing_mobile.png` });
  await ctx.close();
});

// ---------------- Demo logins + click-through ----------------
const FARMER_PAGES = ['', 'manage', 'inventory', 'health', 'predict', 'profit', 'smart', 'listings', 'orders', 'messages', 'community', 'store', 'my-store', 'supplies', 'ai'];
const BUYER_PAGES = ['', 'orders', 'chat', 'rates'];

async function demoSession(role, viewport) {
  const ctx = await browser.newContext({ viewport });
  const p = await ctx.newPage(); const errs = []; watch(p, errs);
  await step(`Demo login: "Try demo as ${role}" fills the form and logs in`, async () => {
    await p.goto(base + '/login');
    await p.getByRole('button', { name: `Try demo as ${role}` }).click();
    await p.getByText(`${role} demo login filled in`).waitFor({ timeout: 3000 });
    await p.locator('form').getByRole('button', { name: /^login/i }).click();
    await p.waitForURL(new RegExp(`/${role.toLowerCase()}$`), { timeout: 10000 });
    await p.getByText(/Demo account: you are exploring sample data/).waitFor({ timeout: 5000 });
  });
  return { ctx, p, errs };
}

async function clickThrough(p, errs, prefix, pages, label) {
  for (const path of pages) {
    const url = `${base}/${prefix}${path ? `/${path}` : ''}`;
    await step(`${label} page /${prefix}${path ? `/${path}` : ''} loads without errors`, async () => {
      const before = errs.length;
      await p.goto(url, { waitUntil: 'networkidle' });
      await p.waitForTimeout(400);
      if (await p.getByText(/something went wrong/i).count()) throw new Error('error boundary shown');
      if (await p.getByRole('heading', { name: /page not found/i }).count()) throw new Error('404 shown');
      const fresh = errs.slice(before);
      if (fresh.length) throw new Error(fresh.join(' | '));
      await p.screenshot({ path: `${shots}/${prefix}_${path || 'home'}.png` });
    });
  }
}

{
  const { ctx, p, errs } = await demoSession('Farmer', { width: 1366, height: 860 });
  await step('Farmer dashboard shows seeded sales chart, egg chart and alerts', async () => {
    await p.getByRole('heading', { name: 'Sales' }).waitFor({ timeout: 8000 });
    await p.locator('.recharts-surface').first().waitFor({ timeout: 8000 });
    await p.getByRole('button', { name: /alerts, \d+ unread/i }).click();
    await p.getByRole('region', { name: 'Alerts' }).getByText('Low stock: Shell Grit / Calcium').waitFor({ timeout: 5000 });
    await p.keyboard.press('Escape');
  });
  await step('Farmer orders list shows seeded orders in several statuses', async () => {
    await p.goto(base + '/farmer/orders', { waitUntil: 'networkidle' });
    const text = await p.locator('main').innerText();
    for (const w of ['Pending', 'Accepted']) if (!text.includes(w)) throw new Error(`missing ${w}`);
  });
  await step('Farmer chat shows the seeded conversation with the demo buyer', async () => {
    await p.goto(base + '/farmer/messages', { waitUntil: 'networkidle' });
    await p.getByText(/Priya Sharma/).first().click();
    await p.getByText(/20 trays every Monday/).first().waitFor({ timeout: 6000 });
  });
  await clickThrough(p, errs, 'farmer', FARMER_PAGES, 'Farmer');
  await ctx.close();
}
{
  const { ctx, p, errs } = await demoSession('Buyer', { width: 390, height: 844 });
  await step('Buyer marketplace shows seeded listings with photos', async () => {
    await p.locator('img[src^="/demo/products/"]').first().waitFor({ timeout: 8000 });
    const n = await p.locator('img[src^="/demo/products/"]').count();
    if (n < 10) throw new Error(`only ${n} product photos`);
  });
  await clickThrough(p, errs, 'buyer', BUYER_PAGES, 'Buyer');
  await step('Buyer market rates page draws the 90-day trend', async () => {
    await p.goto(base + '/buyer/rates', { waitUntil: 'networkidle' });
    await p.getByRole('heading', { name: '90-day price trend' }).waitFor({ timeout: 6000 });
    await p.getByText(/Sample history from the demo data/).waitFor();
  });
  await ctx.close();
}
{
  const { ctx, p, errs } = await demoSession('Admin', { width: 1280, height: 860 });
  await step('Admin overview lists open problems and totals', async () => {
    await p.getByRole('heading', { name: /open problems/i }).waitFor({ timeout: 8000 });
    await p.getByText('Order pipeline').waitFor();
    if (errs.length) throw new Error(errs.join(' | '));
    await p.screenshot({ path: `${shots}/admin_home.png` });
  });
  await ctx.close();
}
await step('Demo buttons are hidden for other roles: farmer cannot open /admin', async () => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(base + '/login?demo=farmer');
  await p.locator('form').getByRole('button', { name: /^login/i }).click();
  await p.waitForURL(/\/farmer$/);
  await p.goto(base + '/admin');
  await p.waitForURL(/\/farmer$/, { timeout: 5000 });
  await ctx.close();
});

await browser.close();
const failed = results.filter((r) => r[0] === 'FAIL');
console.log(`\nDEMO E2E: ${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
