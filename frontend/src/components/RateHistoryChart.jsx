import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

/** 90-day price line for one market rate (Recharts, loaded only on the Market Rates page). */
export default function RateHistoryChart({ points, unit }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const data = points.map((p) => ({ date: new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), price: p.price }));
  const first = data[0]?.price; const last = data.at(-1)?.price;
  return (
    <div className="h-[240px] w-full" role="img" aria-label={`Price moved from ₹${first} to ₹${last} ${unit} over ${data.length} days`}>
      <div aria-hidden="true" className="w-full h-full"><ResponsiveContainer width="100%" height="100%">
        <LineChart accessibilityLayer={false} data={data} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} dy={8} minTickGap={28} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} width={52} domain={['auto', 'auto']} tickFormatter={(v) => `₹${v}`} />
          <Tooltip formatter={(v) => [`₹${v}`, unit]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
          <Line type="monotone" dataKey="price" stroke="#4f6b1f" strokeWidth={2.5} dot={false} isAnimationActive={!reduced} />
        </LineChart>
      </ResponsiveContainer></div>
    </div>
  );
}
