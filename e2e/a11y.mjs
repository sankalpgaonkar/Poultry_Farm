// Accessibility (axe, WCAG 2 A/AA), horizontal-overflow and console-error check of every route
// at phone and desktop widths, logged in as the demo farmer, buyer and admin.
// Needs the demo seed (npm run seed:demo) and the same setup as flows.mjs.
//   mkdir -p e2e-out && node e2e/a11y.mjs http://localhost:5005 e2e-out
// ONLY=/farmer,/buyer/orders limits the run to some routes.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
const [,, base, outdir] = process.argv;
const P = 'Demo@1234';
const routes = {
  none: ['/', '/login', '/signup', '/does-not-exist'],
  farmer: ['/farmer', '/farmer/manage', '/farmer/inventory', '/farmer/health', '/farmer/predict', '/farmer/profit', '/farmer/smart', '/farmer/listings', '/farmer/orders', '/farmer/messages', '/farmer/my-store', '/farmer/store', '/farmer/supplies', '/farmer/community', '/farmer/ai', '/farmer/rates'],
  buyer: ['/buyer', '/buyer/orders', '/buyer/chat', '/buyer/rates'],
  admin: ['/admin'],
};
const creds = { farmer: 'farmer@demo.poultrysmart', buyer: 'buyer@demo.poultrysmart', admin: 'admin@demo.poultrysmart' };
const vps = { mobile: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const out = {};
for (const [vpn, vp] of Object.entries(vps)) {
  for (const [role, list] of Object.entries(routes)) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror ' + String(e).slice(0, 200)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
    if (role !== 'none') {
      await page.goto(base + '/login');
      const r = await page.request.post(base + '/api/auth/login', { data: { identifier: creds[role], password: P } });
      const d = await r.json();
      await page.evaluate((x) => localStorage.setItem('userInfo', JSON.stringify(x)), d);
    }
    for (const path of list.filter((x) => !process.env.ONLY || process.env.ONLY.split(',').includes(x))) {
      await page.goto(base + path, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(900);
      if (path === '/') { for (let y = 0; y < 6000; y += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(150); } await page.waitForTimeout(1200); }
      const name = `${role}${path.replace(/\//g, '_') || '_home'}_${vpn}`;
      await page.screenshot({ path: `${outdir}/${name}.png` });
      let axe;
      try {
        const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        axe = res.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, targets: v.nodes.slice(0, 3).map((x) => x.target.join(' ') + ' | ' + (x.failureSummary || '').slice(0, 160)) }));
      } catch (e) { axe = [{ id: 'axe-failed', impact: String(e).slice(0, 80) }]; }
      const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      const url = page.url().replace(base, '');
      out[name] = { url, overflowX, axe, errors: errors.splice(0) };
    }
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(`${outdir}/results.json`, JSON.stringify(out, null, 1));
let bad = 0;
for (const [k, v] of Object.entries(out)) {
  const issues = [...v.axe.map((a) => `${a.id}(${a.impact}):${a.n}`), ...(v.overflowX ? ['overflowX'] : []), ...v.errors];
  if (issues.length) { bad++; console.log(k, '->', v.url, issues.join(' ; ')); }
}
console.log(`pages checked: ${Object.keys(out).length}, with issues: ${bad}`);
