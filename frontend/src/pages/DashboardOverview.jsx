import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Truck, Bird, Layers, Activity, ShieldCheck, Store, Package, TrendingUp, TrendingDown, Printer, X, Globe } from 'lucide-react';
import api, { errorMessage } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import WeatherCard from '../components/WeatherCard';
import MarketRatesCard from '../components/MarketRatesCard';
import EmptyState from '../components/EmptyState';
import PageLoader from '../components/PageLoader';
import SalesPanel from '../components/SalesPanel';

// The chart library is large, so it loads separately after the numbers are on screen.
const ProductionChart = lazy(() => import('../components/ProductionChart'));

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const strip = (s) => String(s).replace(/\*\*/g, '');

export default function DashboardOverview() {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [data, setData] = useState({ logs: [], alerts: [], farms: [], supplies: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState([]);
  const [range, setRange] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // allSettled: one failing widget (e.g. AI alerts) must not hide the rest of the dashboard.
      const [a, f, l, s] = await Promise.allSettled([
        api.get('/ai/alerts', { silent: true }), api.get('/farms', { silent: true }),
        api.get('/logs', { silent: true }), api.get('/supplies/my-orders', { silent: true }),
      ]);
      if ([a, f, l, s].every((r) => r.status === 'rejected')) throw f.reason;
      setData({
        alerts: a.status === 'fulfilled' ? a.value.data.alerts || [] : [],
        farms: f.status === 'fulfilled' && Array.isArray(f.value.data) ? f.value.data : [],
        logs: l.status === 'fulfilled' && Array.isArray(l.value.data) ? [...l.value.data].reverse() : [],
        supplies: s.status === 'fulfilled' && Array.isArray(s.value.data) ? s.value.data : [],
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { logs, farms, supplies } = data;
  const alerts = data.alerts.filter((a) => !dismissed.includes(a) && !/All stocks are stable/.test(a));
  const totalChickens = farms.reduce((acc, f) => acc + (f.totalChickens || 0), 0);
  const latest = logs.at(-1);
  const todaysEggs = latest ? latest.totalEggs : 0;
  const last7 = logs.slice(-7).map((x) => x.totalEggs || 0);
  const prev7 = logs.slice(-14, -7).map((x) => x.totalEggs || 0);
  const trend = prev7.length && avg(prev7) > 0 ? ((avg(last7) - avg(prev7)) / avg(prev7)) * 100 : null;
  const activeDeliveries = supplies.filter((s) => !['Delivered', 'Cancelled'].includes(s.status)).length;
  const chartData = logs.slice(-range).map((log) => ({
    date: new Date(log.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    eggs: log.totalEggs || 0,
  }));

  const handlePrintReport = () => {
    const w = window.open('', '_blank');
    if (!w) {
      addNotification('Please allow pop-ups for this site to print the report.', 'info');
      return;
    }
    // Every value is escaped before it goes into the report page.
    w.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Farm report ${esc(new Date().toLocaleDateString('en-IN'))}</title>
      <style>body{font-family:system-ui,sans-serif;color:#0f172a;padding:32px;max-width:900px;margin:0 auto}h1{margin:0 0 4px}p.sub{color:#475569;margin:0 0 24px}
      .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}.box{border:1px solid #cbd5e1;border-radius:12px;padding:14px;text-align:center}
      .box b{display:block;font-size:26px;color:#047857}table{width:100%;border-collapse:collapse;margin:8px 0 24px}th,td{padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:14px}
      th{background:#f1f5f9}li{margin-bottom:6px}</style></head><body>
      <h1>Farm status report</h1><p class="sub">${esc(user?.name)} · ${esc(new Date().toLocaleString('en-IN'))}</p>
      <div class="grid"><div class="box"><b>${esc(totalChickens)}</b>Total birds</div><div class="box"><b>${esc(todaysEggs)}</b>Eggs (latest record)</div>
      <div class="box"><b>${esc(activeDeliveries)}</b>Deliveries on the way</div><div class="box"><b>${esc(farms.length)}</b>Farms</div></div>
      ${alerts.length ? `<h2>Alerts</h2><ul>${alerts.map((a) => `<li>${esc(strip(a))}</li>`).join('')}</ul>` : ''}
      <h2>Farms</h2><table><thead><tr><th>Farm</th><th>Birds</th><th>Location</th></tr></thead><tbody>
      ${farms.map((f) => `<tr><td>${esc(f.name)}</td><td>${esc(f.totalChickens || 0)}</td><td>${esc(f.location)}</td></tr>`).join('') || '<tr><td colspan="3">No farms yet</td></tr>'}</tbody></table>
      <h2>Last 7 records</h2><table><thead><tr><th>Date</th><th>Eggs</th><th>Deaths</th><th>Feed (kg)</th></tr></thead><tbody>
      ${logs.slice(-7).reverse().map((l) => `<tr><td>${esc(new Date(l.date).toLocaleDateString('en-IN'))}</td><td>${esc(l.totalEggs || 0)}</td><td>${esc(l.mortalityCount || 0)}</td><td>${esc(l.feedConsumed ?? '-')}</td></tr>`).join('') || '<tr><td colspan="4">No records yet</td></tr>'}
      </tbody></table></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  if (loading) return <PageLoader label="Loading your farm dashboard" />;
  if (error) return <EmptyState icon={AlertCircle} tone="error" title="Couldn't load your dashboard" message={error} action={<button type="button" className="btn btn-primary" onClick={load}>Try again</button>} />;

  const stats = [
    { label: 'Total birds', value: totalChickens.toLocaleString('en-IN'), sub: `${farms.length} farm${farms.length === 1 ? '' : 's'}`, icon: Bird, color: 'bg-emerald-700', to: '/farmer/manage' },
    { label: 'Eggs (latest record)', value: todaysEggs.toLocaleString('en-IN'), sub: latest ? new Date(latest.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No records yet', icon: Layers, color: 'bg-sky-700', to: '/farmer/manage', trend },
    { label: 'Deliveries on the way', value: activeDeliveries, sub: 'Supply orders', icon: Truck, color: 'bg-amber-700', to: '/farmer/supplies' },
    { label: 'Farms', value: farms.length, sub: 'Registered units', icon: Activity, color: 'bg-indigo-600', to: '/farmer/manage' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-emerald-800">Namaste, {user?.name?.split(' ')[0]} 👋</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">My farm today</h1>
          <p className="text-slate-600 mt-1">Your birds, eggs, stock and weather in one place.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handlePrintReport} className="btn btn-secondary"><Printer size={16} aria-hidden="true" />Print report</button>
          <Link to="/farmer/manage" className="btn btn-primary">Record today's eggs <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </header>

      {farms.length === 0 && (
        <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-emerald-900"><strong>Start here:</strong> add your first farm to unlock egg records, weather and predictions.</p>
          <Link to="/farmer/manage" className="btn btn-primary shrink-0">Add a farm</Link>
        </div>
      )}

      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {stats.map((s) => (
          <li key={s.label}>
            <Link to={s.to} className="tilt-card group block h-full bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 hover:border-emerald-300">
              <div className="flex items-start justify-between gap-2">
                <span className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white ${s.color}`} aria-hidden="true"><s.icon size={22} /></span>
                {typeof s.trend === 'number' && (
                  <span className={`chip ${s.trend >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    {s.trend >= 0 ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
                    {s.trend >= 0 ? '+' : ''}{s.trend.toFixed(1)}%<span className="sr-only"> versus the previous week</span>
                  </span>
                )}
              </div>
              <p className="mt-5 text-2xl sm:text-4xl font-extrabold text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-sm font-semibold text-slate-700">{s.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
            </Link>
          </li>
        ))}
      </ul>

      {alerts.length > 0 && (
        <section aria-labelledby="alerts-title" className="bg-rose-50 border border-rose-200 rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 id="alerts-title" className="text-lg font-bold text-rose-900 flex items-center gap-2"><AlertCircle size={20} aria-hidden="true" />Needs your attention</h2>
            <Link to="/farmer/inventory" className="text-sm font-semibold text-rose-800 underline">Open feed & supplies</Link>
          </div>
          <ul className="grid md:grid-cols-2 gap-3">
            {alerts.map((a) => (
              <li key={a} className="bg-white rounded-2xl border border-rose-100 p-4 flex gap-3 items-start">
                <p className="text-sm text-slate-800 flex-1">{strip(a)}</p>
                <button type="button" className="icon-btn !w-8 !h-8 shrink-0" onClick={() => setDismissed((d) => [...d, a])} aria-label="Dismiss alert"><X size={16} aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <section aria-labelledby="chart-title" className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="chart-title" className="text-lg font-bold text-slate-900">Egg production, last {Math.min(range, logs.length) || range} records</h2>
            <div role="group" aria-label="Records to show" className="inline-flex rounded-xl bg-slate-100 p-1">
              {[14, 30, 90].map((r) => (
                <button key={r} type="button" onClick={() => setRange(r)} aria-pressed={range === r}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${range === r ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>{r}</button>
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4">{trend === null ? 'Add a few days of records to see your trend.' : `Average this week: ${Math.round(avg(last7)).toLocaleString('en-IN')} eggs a day.`}</p>
          {chartData.length ? (
            <Suspense fallback={<div className="skeleton h-[280px]" aria-hidden="true" />}>
              <ProductionChart data={chartData} />
            </Suspense>
          ) : (
            <p className="h-[200px] flex items-center justify-center text-slate-500 text-sm text-center">No egg records yet. <Link className="ml-1 font-semibold text-emerald-800 underline" to="/farmer/manage">Add today's count</Link></p>
          )}
        </section>
        <WeatherCard />
      </div>

      <SalesPanel role="Farmer" ordersPath="/farmer/orders" />

      <div className="grid lg:grid-cols-3 gap-6">
        <Link to="/farmer/listings" className="tilt-card group relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-emerald-800 text-white lg:col-span-1">
          <span className="chip bg-white/10 border-white/20 text-white"><ShieldCheck size={14} aria-hidden="true" />Direct to buyers</span>
          <h2 className="mt-5 text-2xl font-extrabold leading-tight">Sell your farm products</h2>
          <p className="mt-2 text-emerald-50 text-sm">List eggs and birds and get orders directly, without middlemen.</p>
          <span className="mt-6 inline-flex items-center gap-2 font-semibold">Open marketplace <ArrowRight size={16} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" /></span>
          <Globe size={96} aria-hidden="true" className="absolute -right-6 -bottom-6 text-white/10" />
        </Link>
        <Link to="/farmer/store" className="tilt-card group relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 lg:col-span-1">
          <span className="chip bg-slate-50 border-slate-200 text-slate-700"><Store size={14} aria-hidden="true" />Shop supplies</span>
          <h2 className="mt-5 text-2xl font-extrabold leading-tight text-slate-900">Buy feed and medicine</h2>
          <p className="mt-2 text-slate-600 text-sm">Order from trusted suppliers and track the delivery.</p>
          <span className="mt-6 inline-flex items-center gap-2 font-semibold text-emerald-800">Shop now <ArrowRight size={16} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" /></span>
          <Package size={96} aria-hidden="true" className="absolute -right-6 -bottom-6 text-slate-100" />
        </Link>
        <MarketRatesCard compact />
      </div>
    </div>
  );
}
