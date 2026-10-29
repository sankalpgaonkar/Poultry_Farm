import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const STATUS = [
  { key: 'Completed', label: 'Delivered', color: '#047857' },
  { key: 'Accepted', label: 'Accepted', color: '#0369a1' },
  { key: 'Pending', label: 'Pending', color: '#b45309' },
  { key: 'Rejected', label: 'Rejected / cancelled', color: '#be123c' },
];
const rupee = (v) => `₹${Math.round(v).toLocaleString('en-IN')}`;
const short = (v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`);

/** Fills missing days with zero so the area chart shows a continuous timeline. */
function timeline(daily, days) {
  const map = Object.fromEntries(daily.map((d) => [d.date, d]));
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    out.push({ date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: map[key]?.value || 0 });
  }
  return out;
}

/** Revenue (or spending) over time plus the order-status split. Loaded lazily with Recharts. */
export default function SalesCharts({ stats, label = 'Sales' }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const series = timeline(stats.daily, stats.days);
  const total = series.reduce((s, d) => s + d.value, 0);
  const pie = STATUS.map((s) => ({ ...s, value: stats.byStatus[s.key]?.count || 0 })).filter((s) => s.value > 0);
  const orders = pie.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <p className="text-sm text-slate-600">{label} from accepted and delivered orders: <strong className="text-slate-900">{rupee(total)}</strong> in {stats.days} days</p>
        <div className="h-[260px] w-full mt-3" role="img" aria-label={`${label} over the last ${stats.days} days, total ${rupee(total)}`}>
          <div aria-hidden="true" className="w-full h-full"><ResponsiveContainer width="100%" height="100%">
            <AreaChart accessibilityLayer={false} data={series} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f6b1f" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#4f6b1f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} dy={8} minTickGap={24} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} width={52} tickFormatter={short} />
              <Tooltip formatter={(v) => [rupee(v), label]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="value" stroke="#4f6b1f" strokeWidth={2.5} fill="url(#salesFill)" isAnimationActive={!reduced} animationDuration={900} />
            </AreaChart>
          </ResponsiveContainer></div>
        </div>
      </div>
      <div>
        <p className="text-sm text-slate-600">Orders by status ({orders})</p>
        <div className="relative h-[180px] mt-2" role="img" aria-label={`Orders by status: ${pie.map((p) => `${p.label} ${p.value}`).join(', ')}`}>
          <div aria-hidden="true" className="w-full h-full"><ResponsiveContainer width="100%" height="100%">
            <PieChart accessibilityLayer={false}>
              <Pie rootTabIndex={-1} data={pie} dataKey="value" nameKey="label" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none" isAnimationActive={!reduced}>
                {pie.map((p) => <Cell key={p.key} fill={p.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" aria-hidden="true">
            <span className="text-2xl font-extrabold text-slate-900">{orders}</span><span className="text-xs text-slate-500">orders</span>
          </div>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          {STATUS.map((s) => (
            <li key={s.key} className="flex items-center gap-2 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} aria-hidden="true" />
              <span className="truncate">{s.label}</span><span className="ml-auto font-semibold tabular-nums">{stats.byStatus[s.key]?.count || 0}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
