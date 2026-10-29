import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, AlertTriangle } from 'lucide-react';
import api, { errorMessage } from '../utils/axios';

const SalesCharts = lazy(() => import('./SalesCharts'));
const RANGES = [30, 60, 90];
const rupee = (v) => `₹${Math.round(v).toLocaleString('en-IN')}`;

/** Sales (farmer) or spending (buyer) panel with a 30/60/90-day switch, top products and open problems. */
export default function SalesPanel({ role = 'Farmer', ordersPath }) {
  const [days, setDays] = useState(90);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const label = role === 'Farmer' ? 'Sales' : 'Spending';

  useEffect(() => {
    let alive = true;
    setError('');
    api.get('/marketplace/stats', { params: { days }, silent: true })
      .then(({ data }) => alive && setStats(data))
      .catch((err) => alive && setError(errorMessage(err)));
    return () => { alive = false; };
  }, [days]);

  const hasOrders = stats && Object.keys(stats.byStatus).length > 0;
  return (
    <section aria-labelledby="sales-title" className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 id="sales-title" className="text-lg font-bold text-slate-900 flex items-center gap-2"><IndianRupee size={20} className="text-emerald-700" aria-hidden="true" />{label}</h2>
        <div role="group" aria-label="Time range" className="inline-flex rounded-xl bg-slate-100 p-1">
          {RANGES.map((r) => (
            <button key={r} type="button" onClick={() => setDays(r)} aria-pressed={days === r}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${days === r ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
              {r} days
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {!stats && !error && <div className="skeleton h-[300px]" aria-hidden="true" />}
      {stats && !hasOrders && (
        <p className="py-12 text-center text-slate-600 text-sm">No orders yet. {role === 'Farmer' ? 'Publish a listing and your sales will appear here.' : 'Your purchases will appear here.'}</p>
      )}
      {stats && hasOrders && (
        <>
          <Suspense fallback={<div className="skeleton h-[300px]" aria-hidden="true" />}>
            <SalesCharts stats={stats} label={label} />
          </Suspense>
          <div className="mt-6 grid md:grid-cols-[1fr_auto] gap-4 items-start">
            {stats.top.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{role === 'Farmer' ? 'Best-selling products' : 'Most bought'}</h3>
                <ol className="space-y-2">
                  {stats.top.map((t) => {
                    const pct = Math.max(6, Math.round((t.value / stats.top[0].value) * 100));
                    return (
                      <li key={t._id} className="text-sm">
                        <div className="flex justify-between gap-3"><span className="truncate text-slate-800">{t.name}</span><span className="font-semibold tabular-nums text-slate-900">{rupee(t.value)}</span></div>
                        <div className="h-2 rounded-full bg-slate-100 mt-1 overflow-hidden"><div className="h-full rounded-full bg-[#4f6b1f]" style={{ width: `${pct}%` }} /></div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
            {stats.openIssues > 0 && ordersPath && (
              <Link to={ordersPath} className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-950 flex gap-2 items-start max-w-xs">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>{stats.openIssues} open problem{stats.openIssues > 1 ? 's' : ''}</strong> reported on your orders. Review them.</span>
              </Link>
            )}
          </div>
        </>
      )}
    </section>
  );
}
