import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LazyMotion, MotionConfig, domAnimation, m as Motion } from 'framer-motion';
import {
  ShieldCheck, Cpu, ArrowRight, Globe, Activity, Egg, MessageSquare, LineChart, CloudSun, AlertTriangle,
  Mic, Smartphone, Sparkles, PlayCircle, Store, Truck, CheckCircle2,
} from 'lucide-react';
import useTilt from '../hooks/useTilt';
import useCountUp from '../hooks/useCountUp';
import Hero3D from '../components/landing/Hero3D';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const API_ROOT = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const FEATURES = [
  { icon: Activity, title: 'Farm records', desc: 'Record eggs, feed and bird deaths in seconds and see the trend on a chart.', color: 'bg-sky-700' },
  { icon: Cpu, title: 'Egg prediction', desc: 'Estimate tomorrow\'s eggs from flock age, feed, light and temperature.', color: 'bg-emerald-700' },
  { icon: Globe, title: 'Direct market', desc: 'Sell eggs and birds straight to buyers, with no middleman taking a cut.', color: 'bg-orange-700' },
  { icon: ShieldCheck, title: 'Bird health', desc: 'Check symptoms and get clear next steps and low-stock alerts.', color: 'bg-indigo-600' },
];

const NEW_FEATURES = [
  { icon: LineChart, title: 'Market rates', desc: 'Reference egg and broiler prices with a 90-day trend, plus a warning if your price looks unfairly low.' },
  { icon: MessageSquare, title: 'Buyer chat', desc: 'Message the buyer or farmer of any order, right inside the app.' },
  { icon: AlertTriangle, title: 'Report a problem', desc: 'Raise an issue on an order (not delivered, wrong quantity) that both sides can see.' },
  { icon: CloudSun, title: 'Farm weather', desc: 'Three-day forecast for your farm with heat and rain tips for your flock.' },
];

// Real photos (Pexels licence, see DEMO_IMAGES.md); prices are sample figures.
const SHOWCASE = [
  { img: '/demo/products/eggs-tray.webp', name: 'Farm fresh eggs', meta: 'Tray of 30', price: '₹175', tag: 'Eggs', z: '60px', cls: 'float-slow' },
  { img: '/demo/products/chicks.webp', name: 'Day-old chicks', meta: 'Vaccinated, per chick', price: '₹38', tag: 'Hatchery', z: '110px', cls: 'float-slower' },
  { img: '/demo/products/kadaknath.webp', name: 'Kadaknath', meta: 'Free-range, per bird', price: '₹950', tag: 'Desi', z: '40px', cls: 'float-slow' },
];

const STEPS = [
  { icon: Store, title: 'List in a minute', desc: 'Add eggs, birds or feed with a photo and a price. The fair-price check warns you if it is too low.' },
  { icon: MessageSquare, title: 'Agree with the buyer', desc: 'Buyers order and chat with you directly. Accept, deliver and get paid, with every step tracked.' },
  { icon: Truck, title: 'Deliver and grow', desc: 'Your dashboard shows sales, egg production and stock, so you know what to sell next week.' },
];

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

function ShowcaseCard({ p, i }) {
  const tilt = useTilt(12);
  return (
    <div className={p.cls} style={{ '--z': p.z, animationDelay: `${i * -1.7}s` }}>
      <div ref={tilt} className="tilt-card preserve-3d rounded-[1.75rem] bg-white p-3 shadow-strong border border-[#e8dfcf] w-56 sm:w-60">
        <div className="relative overflow-hidden rounded-[1.25rem] aspect-[4/3] bg-[#efe7d8]">
          <img src={p.img} alt={p.name} width="400" height="300" loading="lazy" decoding="async" className="w-full h-full object-cover" />
          <span className="absolute top-2 left-2 chip bg-white/90 border-white text-[#3f4f22]">{p.tag}</span>
        </div>
        <div className="px-1.5 pt-3 pb-1 flex items-end justify-between gap-2" style={{ transform: 'translateZ(30px)' }}>
          <div>
            <p className="font-bold text-slate-900 leading-tight">{p.name}</p>
            <p className="text-xs text-slate-600">{p.meta}</p>
          </div>
          <p className="text-lg font-extrabold text-[#3f5a1c] tabular-nums">{p.price}</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ f }) {
  const tilt = useTilt(8);
  return (
    <Motion.li {...reveal} className="list-none">
      <div ref={tilt} className="tilt-card h-full bg-white p-7 rounded-3xl border border-[#e8dfcf] hover:border-[#9bb36a] flex flex-col">
        <span className={`${f.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`} aria-hidden="true"><f.icon size={26} /></span>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
        <p className="text-slate-600 leading-relaxed">{f.desc}</p>
      </div>
    </Motion.li>
  );
}

function Stat({ value, label, suffix = '' }) {
  const [ref, n] = useCountUp(value);
  return (
    <div ref={ref} className="text-center sm:text-left">
      <p className="text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums text-white">{n.toLocaleString('en-IN')}{suffix}</p>
      <p className="mt-1 text-sm font-medium text-[#d9e4c3]">{label}</p>
    </div>
  );
}

function LiveStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${API_ROOT}/api/public/stats`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStats(d && d.listings + d.farmers > 0 ? d : null))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);
  // Fixed height either way, so the page never jumps when the numbers arrive.
  return (
    <section aria-labelledby="stats-title" className="px-4 sm:px-8 -mt-6 relative z-10">
      <div className="max-w-6xl mx-auto rounded-[2rem] bg-[#2f3f17] text-white p-7 sm:p-10 shadow-strong min-h-[200px]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 id="stats-title" className="text-lg font-bold">On PoultrySmart right now</h2>
          {stats?.demo && <span className="chip bg-[#f2b544] border-[#f2b544] text-[#2f3f17]">Demo data · sample database</span>}
          {stats && !stats.demo && <span className="chip bg-white/10 border-white/20 text-white">Live from the database</span>}
        </div>
        {stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Stat value={stats.farmers} label="Farmers selling" />
            <Stat value={stats.listings} label="Active listings" />
            <Stat value={stats.delivered} label="Orders delivered" />
            <Stat value={stats.eggsLogged} label="Eggs recorded" />
          </div>
        ) : (
          <p className="text-[#d9e4c3]">Farmers list their stock, buyers order directly, and every order is tracked from request to delivery.</p>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => { document.title = 'PoultrySmart · Smart poultry farming and a direct market for farmers'; }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="bg-[#f6f0e6] text-slate-900 overflow-hidden">
          {/* ---------------- Hero ---------------- */}
          <section className="relative">
            <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-40 w-[42rem] h-[42rem] rounded-full bg-[radial-gradient(circle,rgba(134,184,74,0.35),transparent_65%)]" />
            <div aria-hidden="true" className="pointer-events-none absolute top-64 -left-40 w-[30rem] h-[30rem] rounded-full bg-[radial-gradient(circle,rgba(242,181,68,0.28),transparent_65%)]" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-16 lg:pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-4 items-center">
              <div className="fade-up">
                <span className="chip bg-white/70 border-[#d9cdb5] text-[#3f4f22] mb-6"><Sparkles size={14} aria-hidden="true" />Made for Indian poultry farmers</span>
                <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#24310f]">
                  Every egg, every bird, <span className="relative whitespace-nowrap text-[#4f6b1f]">every rupee<svg aria-hidden="true" viewBox="0 0 300 12" className="absolute left-0 -bottom-2 w-full h-3 text-[#f2b544]"><path d="M2 9c60-6 140-8 296-3" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg></span>.
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-slate-700 max-w-xl leading-relaxed">
                  PoultrySmart is a farm diary, an egg forecaster and a direct marketplace in one app. Track your flock, sell to buyers without middlemen, and see what your farm earns.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  {DEMO_MODE ? (
                    <Link to="/login?demo=farmer" className="btn btn-primary text-base !py-4 !px-7 !bg-[#3f5a1c] hover:!bg-[#2f4413] !shadow-none">
                      <PlayCircle size={20} aria-hidden="true" />Try the live demo
                    </Link>
                  ) : (
                    <Link to="/signup" className="btn btn-primary text-base !py-4 !px-7 !bg-[#3f5a1c] hover:!bg-[#2f4413] !shadow-none">
                      Start free<ArrowRight size={20} aria-hidden="true" />
                    </Link>
                  )}
                  <Link to={DEMO_MODE ? '/signup' : '/login'} className="btn btn-secondary text-base !py-4 !px-7 !border-[#d9cdb5] !bg-white/70">
                    {DEMO_MODE ? 'Create a free account' : 'I already have an account'}
                  </Link>
                </div>
                <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-700">
                  <li className="flex items-center gap-2"><Smartphone size={16} className="text-[#4f6b1f]" aria-hidden="true" />Works on any phone</li>
                  <li className="flex items-center gap-2"><Mic size={16} className="text-[#4f6b1f]" aria-hidden="true" />Voice input</li>
                  <li className="flex items-center gap-2"><Egg size={16} className="text-[#4f6b1f]" aria-hidden="true" />Free for farmers</li>
                </ul>
              </div>
              <div className="relative h-[340px] sm:h-[460px] lg:h-[620px] -mx-4 sm:mx-0 lg:-mr-12">
                <Hero3D />
              </div>
            </div>
          </section>

          <LiveStats />

          {/* ---------------- Floating product cards ---------------- */}
          <section aria-labelledby="market-title" className="py-20 sm:py-28 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
              <Motion.div {...reveal}>
                <p className="text-farmer-label !text-[#5d7330]">Marketplace</p>
                <h2 id="market-title" className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-[#24310f]">From the farm gate straight to the buyer.</h2>
                <p className="mt-5 text-lg text-slate-700 leading-relaxed max-w-lg">Hotels, caterers and shops order eggs, birds and feed directly from farms near them. Farmers set the price and keep the margin.</p>
                <ul className="mt-6 space-y-3 text-slate-800">
                  {['Real-time stock, so nobody orders what is sold out', 'Fair-price warning against the market rate', 'Chat and order tracking for both sides'].map((t) => (
                    <li key={t} className="flex gap-3"><CheckCircle2 className="text-[#4f6b1f] shrink-0 mt-0.5" size={20} aria-hidden="true" />{t}</li>
                  ))}
                </ul>
              </Motion.div>
              <ul aria-label="Example listings" className="perspective relative flex flex-wrap justify-center gap-5 sm:gap-6 lg:block lg:h-[440px]">
                {SHOWCASE.map((p, i) => (
                  <li key={p.name} className={`list-none lg:absolute ${['lg:left-0 lg:top-10', 'lg:left-[34%] lg:top-0', 'lg:right-0 lg:top-44'][i]}`}>
                    <ShowcaseCard p={p} i={i} />
                  </li>
                ))}
                <li className="list-none w-full lg:absolute lg:bottom-0 lg:left-0 text-center lg:text-left text-xs text-slate-600">Sample listings and prices from the demo data.</li>
              </ul>
            </div>
          </section>

          {/* ---------------- Features ---------------- */}
          <section aria-labelledby="features-title" className="py-20 sm:py-24 px-4 sm:px-8 bg-white/60">
            <div className="max-w-7xl mx-auto">
              <Motion.div {...reveal} className="text-center max-w-2xl mx-auto mb-14">
                <h2 id="features-title" className="text-3xl sm:text-5xl font-extrabold text-[#24310f] tracking-tight">Run your whole farm from your phone</h2>
                <p className="text-lg text-slate-700 mt-4">Simple tools that save time every day, built for farmers first.</p>
              </Motion.div>
              <ul className="perspective grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {FEATURES.map((f) => <FeatureCard key={f.title} f={f} />)}
              </ul>
            </div>
          </section>

          {/* ---------------- How it works ---------------- */}
          <section aria-labelledby="how-title" className="py-20 sm:py-28 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
              <Motion.div {...reveal} className="relative order-last lg:order-first">
                <img src="/demo/farms/farmer.webp" alt="A farmer standing in a green field" width="1000" height="666" loading="lazy" decoding="async" className="rounded-[2rem] shadow-strong w-full aspect-[3/2] object-cover" />
                <div className="float-slow absolute -bottom-6 right-4 sm:-right-4 bg-white rounded-2xl p-4 shadow-strong border border-[#e8dfcf] max-w-[15rem]">
                  <p className="text-xs font-semibold text-slate-600">Fair-price check</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">₹175 a tray is above the ₹168 market rate</p>
                </div>
              </Motion.div>
              <div>
                <Motion.h2 {...reveal} id="how-title" className="text-3xl sm:text-5xl font-extrabold text-[#24310f] tracking-tight">How it works</Motion.h2>
                <ol className="mt-10 space-y-8">
                  {STEPS.map((s, i) => (
                    <Motion.li key={s.title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.12 }} className="flex gap-5">
                      <span className="shrink-0 w-12 h-12 rounded-2xl bg-[#3f5a1c] text-white flex items-center justify-center font-bold" aria-hidden="true">{i + 1}</span>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><s.icon size={20} className="text-[#4f6b1f]" aria-hidden="true" />{s.title}</h3>
                        <p className="mt-1.5 text-slate-700 leading-relaxed">{s.desc}</p>
                      </div>
                    </Motion.li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          {/* ---------------- Fair trade tools ---------------- */}
          <section aria-labelledby="fair-title" className="py-20 sm:py-24 px-4 sm:px-8 bg-[#24310f] text-white">
            <div className="max-w-7xl mx-auto">
              <Motion.div {...reveal} className="max-w-2xl mb-12">
                <h2 id="fair-title" className="text-3xl sm:text-5xl font-extrabold tracking-tight">Fairer trade, built in</h2>
                <p className="text-lg text-[#d9e4c3] mt-4">Ideas from farmers, now part of the app.</p>
              </Motion.div>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {NEW_FEATURES.map((f, i) => (
                  <Motion.li key={f.title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }} className="rounded-3xl bg-white/[0.06] border border-white/10 p-6 hover:bg-white/[0.1] transition-colors">
                    <f.icon className="text-[#f2b544]" size={28} aria-hidden="true" />
                    <h3 className="text-lg font-bold mt-4">{f.title}</h3>
                    <p className="text-[#d9e4c3] mt-2 leading-relaxed text-[15px]">{f.desc}</p>
                  </Motion.li>
                ))}
              </ul>
            </div>
          </section>

          {/* ---------------- CTA ---------------- */}
          <section className="py-20 sm:py-24 px-4 sm:px-8">
            <Motion.div {...reveal} className="max-w-5xl mx-auto rounded-[2.5rem] bg-[#f2b544] p-10 sm:p-14 text-center relative overflow-hidden">
              <Egg aria-hidden="true" className="absolute -left-6 -bottom-8 text-[#e19f22] w-40 h-40 rotate-[-18deg]" />
              <Egg aria-hidden="true" className="absolute -right-4 -top-6 text-[#e19f22] w-28 h-28 rotate-[24deg]" />
              <h2 className="relative text-3xl sm:text-5xl font-extrabold tracking-tight text-[#24310f]">Ready to try it?</h2>
              <p className="relative mt-4 text-lg text-[#3b3110] max-w-xl mx-auto">Free for farmers. Set up your farm in two minutes, or explore the demo farm first.</p>
              <div className="relative mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/signup" className="btn btn-dark text-base !py-4 !px-8">Create my free account<ArrowRight size={20} aria-hidden="true" /></Link>
                {DEMO_MODE && <Link to="/login?demo=buyer" className="btn btn-secondary text-base !py-4 !px-8 !border-[#24310f]/20">Explore as a buyer</Link>}
              </div>
            </Motion.div>
          </section>

          <footer className="px-4 sm:px-8 pb-10 text-sm text-slate-600">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between gap-2 border-t border-[#e0d5c2] pt-6">
              <p>© {new Date().getFullYear()} PoultrySmart</p>
              <p>3D farm built in code with three.js · Photos from Pexels (see DEMO_IMAGES.md)</p>
            </div>
          </footer>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
