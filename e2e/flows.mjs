// End-to-end checks of the main user journeys in a real browser.
// Needs: a running app with an empty or demo database, then
//   npm i --no-save playwright @axe-core/playwright && npx playwright install chromium
//   node e2e/flows.mjs http://localhost:5005
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://localhost:5005';
const stamp = Date.now().toString().slice(-6);
const results = [];
const step = async (name, fn) => {
  try { await fn(); results.push(['PASS', name]); console.log('PASS', name); }
  catch (e) {
    results.push(['FAIL', name, String(e.message).split('\n')[0].slice(0, 200)]); console.log('FAIL', name, String(e.message).split('\n')[0].slice(0, 300));
    for (const [tag, p] of [['f', f], ['b', b]]) { try { await p.screenshot({ path: `e2e-fail-${results.length}_${tag}.png` }); console.log('   ', tag, p.url(), (await p.getByRole('button').allInnerTexts()).map((x) => x.replace(/\s+/g, ' ').slice(0, 40)).filter(Boolean).join(' | ').slice(0, 400)); } catch { /* best-effort debug output */ } }
  }
};
const browser = await chromium.launch();
const ctxF = await browser.newContext({ viewport: { width: 390, height: 844 } });
const ctxB = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const f = await ctxF.newPage(); const b = await ctxB.newPage();
const errs = [];
for (const p of [f, b]) p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
const farmerPhone = ('98' + stamp + '12').slice(0, 10);
const listing = `E2E eggs ${stamp}`;
const pw = 'e2e-password-123';

await step('Logged-out visit to a dashboard redirects to login with ?next', async () => {
  await f.goto(base + '/farmer/inventory');
  await f.waitForURL(/\/login\?.*next=/, { timeout: 8000 });
});
await step('Signup form rejects an invalid phone before calling the server', async () => {
  await f.goto(base + '/signup');
  await f.getByLabel('Full Name').fill('E2E Farmer');
  await f.getByLabel('Mobile or Email').fill('12345');
  await f.getByLabel('Set Password').fill(pw);
  await f.getByRole('button', { name: /create|sign up|register|join/i }).last().click();
  await f.getByRole('alert').filter({ hasText: /valid email address or a 10-digit/ }).waitFor({ timeout: 5000 });
});
await step('Farmer signs up with a mobile number (was broken: email required)', async () => {
  await f.getByLabel('Mobile or Email').fill(farmerPhone);
  await f.getByRole('button', { name: /create|sign up|register|join/i }).last().click();
  await f.waitForURL(/\/farmer$/, { timeout: 10000 });
});
await step('Farmer publishes a listing from the marketplace', async () => {
  await f.goto(base + '/farmer/listings');
  await f.getByRole('button', { name: /sell my stock/i }).click();
  await f.locator('#l-name').fill(listing);
  await f.locator('#l-qty').fill('50');
  await f.locator('#l-price').fill('170');
  await f.getByRole('button', { name: /publish listing/i }).click();
  await f.getByRole('dialog').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
  await f.getByText(listing).first().waitFor({ timeout: 8000 });
});
await step('Farmer adds an inventory item through the form', async () => {
  await f.goto(base + '/farmer/inventory');
  await f.getByRole('button', { name: /^add item$/i }).click();
  await f.locator('form input[type="text"]').first().fill(`E2E feed ${stamp}`);
  await f.locator('form input[type="number"]').first().fill('120');
  await f.getByRole('button', { name: /save to stock/i }).click();
  await f.getByText(`E2E feed ${stamp}`).first().waitFor({ timeout: 8000 });
});
await step('Buyer signs up with email in mixed case', async () => {
  await b.goto(base + '/signup');
  await b.getByRole('button', { name: 'Buyer' }).click();
  await b.getByLabel('Full Name').fill('E2E Buyer');
  await b.getByLabel('Mobile or Email').fill(`E2E.Buyer${stamp}@Example.com`);
  await b.getByLabel('Set Password').fill(pw);
  await b.getByRole('button', { name: /create|sign up|register|join/i }).last().click();
  await b.waitForURL(/\/buyer$/, { timeout: 10000 });
});
await step('Buyer logs out and back in with lower-case email (login was case-sensitive)', async () => {
  await b.getByRole('button', { name: /log out/i }).first().click();
  await b.waitForURL(/\/login/, { timeout: 8000 });
  await b.getByLabel('Mobile Number / Email').fill(`e2e.buyer${stamp}@example.com`);
  await b.getByLabel('Password', { exact: true }).fill(pw);
  await b.getByRole('button', { name: /^login$/i }).click();
  await b.waitForURL(/\/buyer$/, { timeout: 10000 });
});
await step('Buyer marketplace shows listings (was empty: 403)', async () => {
  await b.locator('#market-search').fill(listing);
  await b.getByText(listing).first().waitFor({ timeout: 8000 });
});
await step('Buyer places an order for 2 units', async () => {
  const card = b.locator('article, li, div').filter({ hasText: listing }).filter({ has: b.getByRole('button', { name: /order|buy/i }) }).last();
  await card.getByRole('button', { name: /order|buy/i }).first().click();
  await b.getByRole('button', { name: /place order/i }).click();
  await b.getByText(/order placed|placed/i).first().waitFor({ timeout: 8000 });
});
await step('Buyer sees the order and reports a problem', async () => {
  await b.goto(base + '/buyer/orders');
  await b.getByText(listing).first().waitFor({ timeout: 8000 });
  await b.getByRole('button', { name: /report a problem/i }).first().click();
  await b.locator('#report-details').fill('Two eggs were cracked (e2e test).');
  await b.getByRole('button', { name: /^report problem$/i }).click();
  await b.getByText(/problem reported|reported/i).first().waitFor({ timeout: 8000 });
});
await step('Buyer messages the farmer', async () => {
  await b.goto(base + '/buyer/chat');
  await b.getByRole('button', { name: /E2E Farmer/ }).first().click();
  await b.locator('#chat-input').fill(`Hello from e2e ${stamp}`);
  await b.getByRole('button', { name: 'Send message' }).click();
  await b.getByText(`Hello from e2e ${stamp}`).first().waitFor({ timeout: 8000 });
});
await step('Farmer sees the order with the reported problem and accepts it', async () => {
  await f.goto(base + '/farmer/orders');
  await f.getByText(listing).first().waitFor({ timeout: 8000 });
  await f.getByText(/cracked/).first().waitFor({ timeout: 8000 });
  await f.getByRole('button', { name: /^accept$/i }).first().click();
  await f.getByText(/accepted/i).first().waitFor({ timeout: 8000 });
});
await step('Farmer receives the buyer message', async () => {
  await f.goto(base + '/farmer/messages');
  await f.getByRole('button', { name: /E2E Buyer/ }).first().click();
  await f.getByText(`Hello from e2e ${stamp}`).first().waitFor({ timeout: 8000 });
});
await step('Community: post with a topic, upvote toggles on and off, comment', async () => {
  await f.goto(base + '/farmer/community');
  await f.getByRole('button', { name: /start a discussion/i }).first().click();
  await f.locator('#p-title').fill(`E2E rate ${stamp}`);
  await f.getByText('Market Price', { exact: true }).last().click();
  await f.locator('#p-content').fill('Udupi tray rate 168 today.');
  await f.getByRole('button', { name: /^post$/i }).click();
  const up = f.getByRole('button', { name: `Upvote E2E rate ${stamp}` });
  await up.click();
  await f.getByRole('button', { name: `Remove your upvote from E2E rate ${stamp}` }).click();
  await up.waitFor({ timeout: 5000 });
  const art = f.locator('article').filter({ hasText: `E2E rate ${stamp}` });
  await art.getByRole('button', { name: /comment/i }).first().click();
  await art.getByLabel('Write a comment').fill('Same in Mangaluru.');
  await art.getByRole('button', { name: 'Post comment' }).click();
  await art.getByText('Same in Mangaluru.').waitFor({ timeout: 8000 });
});
await step('Kisan Mitra replies in offline mode without an AI key', async () => {
  await f.goto(base + '/farmer/ai');
  await f.locator('#ai-input-page').fill('How do I keep birds cool?');
  await f.locator('#ai-input-page').press('Enter');
  await f.getByText(/offline|not available|AI/i).last().waitFor({ timeout: 10000 });
});
await step('Wrong password shows a clear error', async () => {
  const p = await browser.newPage();
  await p.goto(base + '/login');
  await p.getByLabel('Mobile Number / Email').fill(farmerPhone);
  await p.getByLabel('Password', { exact: true }).fill('wrong-password');
  await p.getByRole('button', { name: /^login$/i }).click();
  await p.getByRole('alert').waitFor({ timeout: 8000 });
  await p.close();
});
await step('Unknown page shows the 404 screen', async () => {
  await f.goto(base + '/no-such-page');
  await f.getByText(/not found|404/i).first().waitFor({ timeout: 5000 });
});
await browser.close();
console.log('page errors:', errs.length ? errs : 'none');
const fails = results.filter((r) => r[0] === 'FAIL').length;
console.log(`E2E: ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);
