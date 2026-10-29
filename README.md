# PoultrySmart

Poultry farm management for Indian farmers and buyers: farm records, egg prediction, bird-health checks, stock and feed tracking, a direct marketplace with buyer–farmer chat, market rates with a fair-price warning, farm weather, a farmer community and the Kisan Mitra AI assistant.

- **Frontend:** React 19, Vite, Tailwind CSS 4 (`frontend/`)
- **API:** Node.js, Express 4, MongoDB with Mongoose 8 (`backend/`)
- **Deploys to:** Vercel (website + serverless API) or Render (one web service). Both configs are included.

## Run it on your computer

You need Node.js 20 or newer and a MongoDB database (a free MongoDB Atlas cluster, or MongoDB installed locally).

```bash
npm install
cp .env.example .env        # then fill in the values in [BRACKETS]
npm run seed:demo           # optional: demo farmers, buyers, orders and photos (see "Demo accounts")
npm run dev                 # API on http://localhost:5005, website on http://localhost:5173
```

Minimum `.env` for local development:

```
MONGODB_URI=mongodb://127.0.0.1:27017/poultrysmart
JWT_SECRET=[a long random string, 32+ characters]
```

`GEMINI_API_KEY` is optional. Without it, the AI assistant, photo scanning and smart alerts show a clear "offline" message and everything else works.

## Demo accounts

`npm run seed:demo` fills the database with a clearly-labelled **sample** dataset for demos and interviews:
5 farmers with stores (Doddaballapur, Siddipet, Baramati, Karkala/Udupi, Hosur), 5 buyers, 1 admin,
45 listings with real photos, 23 inventory items, 48 orders in every status (pending, accepted, delivered,
rejected/cancelled, 3 with a reported problem), 90 days of farm records, chats, community posts with comments
and upvotes, alerts and 90 days of market-rate history. All prices are sample INR figures.

| Role | Email | Password |
|---|---|---|
| Farmer (Ramesh Gowda, Gowda Poultry Farm) | `farmer@demo.poultrysmart` | `Demo@1234` |
| Buyer (Priya Sharma, FreshBasket Mart) | `buyer@demo.poultrysmart` | `Demo@1234` |
| Admin | `admin@demo.poultrysmart` | `Demo@1234` |

Other demo farmers: `lakshmi@`, `sunil@`, `anitha@`, `irfan@demo.poultrysmart` (same password).

- **Safe to re-run:** it only touches `@demo.poultrysmart` accounts and what they own; each run replaces the previous demo data. Real users are never touched.
- **Remove it:** `npm run seed:demo -- --remove`.
- **Production guard:** it refuses to run when `NODE_ENV=production` unless you add `--force`.
- **Seed your MongoDB Atlas database** (from your computer, with your own connection string):

  ```bash
  MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/poultrysmart" npm run seed:demo
  ```
  On Windows PowerShell: `$env:MONGODB_URI="mongodb+srv://..."; npm run seed:demo`.
  Atlas must allow your IP address (Network Access).
- **Demo buttons:** with `VITE_DEMO_MODE=true` (the default) the login page shows *Try demo as Farmer / Buyer / Admin*
  buttons and the home page shows *Try the live demo*. Set `VITE_DEMO_MODE=false` before a real customer launch.
- Demo photos are from Pexels; sources and licence are listed in [DEMO_IMAGES.md](DEMO_IMAGES.md).

The older `npm run seed -- --yes` script still exists, but it **wipes the whole database**; prefer `seed:demo`.

### Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | API and website with live reload |
| `npm test` | API tests on a throwaway in-memory MongoDB; your database is never touched |
| `npm run lint` | ESLint for frontend and backend |
| `npm run build` | Production build of the website into `dist/` |
| `npm start` | Start the API (and the website when `SERVE_FRONTEND=true`) |
| `npm run check` | Lint, tests and build in one go |
| `npm run seed:demo` | Create (or refresh) the demo data and print the demo logins |

Browser checks (optional, need Playwright): `e2e/flows.mjs` runs 17 user journeys (sign-up by phone, listing, order, problem report, chat, community, AI offline mode), `e2e/demo.mjs` checks the landing page (3D hero, poster fallback, reduced motion, layout shift) and clicks through every page as the demo farmer, buyer and admin, and `e2e/a11y.mjs` runs an accessibility scan of every page. Setup steps are at the top of each file. Run `flows.mjs` on a scratch database: it creates test users and posts.

## Environment variables

| Name | Needed | What it is |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB connection string. `MONGO_URI` is also accepted. |
| `JWT_SECRET` | yes | Secret used to sign logins, 32+ characters. In production the server won't start without it. |
| `JWT_EXPIRES_IN` | no | How long a login lasts. Default `7d`. |
| `GEMINI_API_KEY` | no | Google Gemini key for AI features. |
| `GEMINI_MODEL` | no | Default `gemini-2.5-flash`. |
| `CLIENT_ORIGIN` | only for split hosting | Comma-separated website address(es) allowed to call the API from another domain. |
| `SERVE_FRONTEND` | Render | `true` makes Express serve the built website too. |
| `VITE_DEMO_MODE` | no | `true` (default) shows the demo-login buttons; set `false` for a real launch. Read at build time. |
| `VITE_API_URL` | only for split hosting | API address baked into the website at build time. Leave it empty when both are on one domain. |

## Deploy

### Option A: Vercel (website and API on one domain)

1. Push this folder to a GitHub repository.
2. In Vercel, go to **Add New → Project**, import the repo and keep the default settings (they're read from `vercel.json`).
3. Under **Settings → Environment Variables**, add `MONGODB_URI`, `JWT_SECRET` and, optionally, `GEMINI_API_KEY`.
4. Deploy. Open `https://<your-app>.vercel.app/api/health-check`. It should report `"database":"connected"`.

The website is served as static files and every `/api/*` request goes to `api/index.js`, which wraps the same Express app. Uploads stay in memory (nothing is written to disk), and photos are shrunk in the browser so they fit under Vercel's 4.5 MB request limit.

### Option B: Render (one web service)

1. Push to GitHub. In Render, go to **New → Blueprint** and pick the repo. `render.yaml` sets everything up.
2. When asked, paste `MONGODB_URI` and, optionally, `GEMINI_API_KEY`. Render generates `JWT_SECRET` for you.
3. After the deploy, open `https://<your-service>.onrender.com/api/health-check`.

Render's free plan sleeps after about 15 minutes without traffic, so the first visit after that takes about a minute.

### MongoDB Atlas

Create a free M0 cluster, add a database user, and allow access from anywhere (`0.0.0.0/0`), because Vercel and Render don't have fixed IP addresses. Then copy the connection string into `MONGODB_URI` with `/poultrysmart` as the database name.

## 3D landing page and UI libraries

The home page hero is a low-poly poultry farm (barn, coop, silo, hens, chicks, eggs, fields) built **in code** from
three.js primitives in `frontend/src/components/landing/FarmScene.jsx`. No downloaded 3D models, textures or HDRs are used.
It turns slowly, follows the mouse and rotates/zooms with scrolling.

- **Performance:** the 3D code is its own chunk (about 250 KB gzipped, mostly three.js) and is downloaded only on the home page, after first paint, while a static poster image (`frontend/public/landing/hero-poster.webp`) holds the space (no layout shift). The render loop pauses when the hero scrolls out of view.
- **Fallbacks:** reduced-motion users, data-saver mode, very low-end devices and browsers without WebGL see the poster only. Phones get a lighter scene (no shadows, fewer props, lower pixel ratio).
- Visual direction was inspired by Awwwards-recognised sites such as Farm Minerals (earthy olive and cream palette, scroll-driven reveals) and Bruno Simon-style low-poly worlds.

New dependencies (all `devDependencies`, bundled into the website at build time):

| Package | Why |
|---|---|
| `three`, `@react-three/fiber` | The 3D farm scene (React renderer for three.js). |
| `framer-motion` | Scroll-triggered section reveals on the home page (loaded with `LazyMotion`, so only the small DOM-animation feature set ships). Respects reduced motion. |

## Project layout

```
api/index.js          Vercel serverless entry (wraps the Express app)
backend/app.js        Express app: security headers, CORS, rate limits, routes, errors
backend/server.js     Starts the server (Render / local)
backend/config/       Environment checks and the cached database connection
backend/controllers/  Route logic
backend/models/       Mongoose models
backend/validation/   Request validation schemas (zod)
backend/data/         Sample market-rate table (replace with your own source)
backend/tests/        API tests (node:test + in-memory MongoDB)
frontend/src/         React app (pages, components, context, utils)
```

## Notes

- Market rates in `backend/data/marketRates.json` are **sample reference values** and are labelled that way in the app. Connect a real source (for example, the NECC daily egg rate) before relying on them.
- Weather comes from Open-Meteo, which is free and needs no key.
- Chat is available between a buyer and a farmer who have an order together. It refreshes every few seconds; it isn't instant push.
