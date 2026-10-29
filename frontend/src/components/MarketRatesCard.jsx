import { useEffect, useState } from 'react';
import { LineChart, Info } from 'lucide-react';
import api, { errorMessage } from '../utils/axios';

/** Reference egg and poultry rates (Market Rates from the Digital Farmer roadmap). */
export default function MarketRatesCard({ compact = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/market/rates', { silent: true }).then(({ data: d }) => setData(d)).catch((err) => setError(errorMessage(err)));
  }, []);

  return (
    <section aria-labelledby="rates-title" className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="rates-title" className="text-lg font-bold text-slate-900 flex items-center gap-2"><LineChart size={20} aria-hidden="true" className="text-emerald-700" />Market rates</h2>
        {data && <span className="text-xs text-slate-500">as of {new Date(data.asOf).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
      </div>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {!data && !error && <div className="space-y-2" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-10" />)}</div>}
      {data && (
        <>
          <ul className="divide-y divide-slate-100">
            {(compact ? data.rates.slice(0, 4) : data.rates).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0"><span className="block font-semibold text-slate-900 truncate">{r.product}</span><span className="block text-xs text-slate-500">{r.region}</span></span>
                <span className="text-right shrink-0"><span className="block font-bold text-slate-900 tabular-nums">₹{r.price.toLocaleString('en-IN')}</span><span className="block text-xs text-slate-500">{r.unit}</span></span>
              </li>
            ))}
          </ul>
          {data.isSample && (
            <p className="flex gap-2 text-xs text-slate-600 bg-slate-50 rounded-xl p-3"><Info size={14} aria-hidden="true" className="shrink-0 mt-0.5" />Reference figures, not live prices. Confirm with your local NECC rate or mandi before selling.</p>
          )}
        </>
      )}
    </section>
  );
}
