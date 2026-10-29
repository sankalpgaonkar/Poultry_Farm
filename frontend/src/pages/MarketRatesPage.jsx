import { lazy, Suspense, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import api from '../utils/axios';
import MarketRatesCard from '../components/MarketRatesCard';

const RateHistoryChart = lazy(() => import('../components/RateHistoryChart'));

function RateTrend() {
  const [rates, setRates] = useState(null);
  const [history, setHistory] = useState(null);
  const [selected, setSelected] = useState('egg-tray');

  useEffect(() => {
    Promise.all([api.get('/market/rates', { silent: true }), api.get('/market/rates/history', { params: { days: 90 }, silent: true })])
      .then(([r, h]) => { setRates(r.data.rates); setHistory(h.data); })
      .catch(() => setHistory({ series: {} }));
  }, []);

  if (!history) return <div className="skeleton h-[340px]" aria-hidden="true" />;
  const ids = Object.keys(history.series);
  if (!ids.length) return null; // no stored history yet (e.g. a fresh production database)
  const current = ids.includes(selected) ? selected : ids[0];
  const points = history.series[current];
  const meta = rates?.find((r) => r.id === current);
  const change = points.length > 1 ? ((points.at(-1).price - points[0].price) / points[0].price) * 100 : 0;

  return (
    <section aria-labelledby="trend-title" className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="trend-title" className="text-lg font-bold text-slate-900">90-day price trend</h2>
        <label className="sr-only" htmlFor="rate-pick">Product</label>
        <select id="rate-pick" className="field !w-auto !py-2" value={current} onChange={(e) => setSelected(e.target.value)}>
          {ids.map((id) => <option key={id} value={id}>{rates?.find((r) => r.id === id)?.product || id}</option>)}
        </select>
      </div>
      <p className="flex items-center gap-2 text-sm text-slate-700">
        <span className={`chip ${change >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {change >= 0 ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}{change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </span>
        over {points.length} days{meta ? `, now ₹${points.at(-1).price} ${meta.unit}` : ''}
      </p>
      <Suspense fallback={<div className="skeleton h-[240px]" aria-hidden="true" />}>
        <RateHistoryChart points={points} unit={meta?.unit || ''} />
      </Suspense>
      {history.isSample && <p className="text-xs text-slate-600">Sample history from the demo data, not real market prices.</p>}
    </section>
  );
}

export default function MarketRatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Market rates</h1>
        <p className="text-slate-600 mt-1">Reference prices to help buyers and farmers agree a fair deal.</p>
      </div>
      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6 items-start">
        <MarketRatesCard />
        <RateTrend />
      </div>
    </div>
  );
}
