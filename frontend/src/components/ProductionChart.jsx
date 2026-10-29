import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

/** Egg production chart (kept in its own file so the chart library loads only when needed). */
export default function ProductionChart({ data }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <div className="h-[280px] w-full" role="img" aria-label={`Egg production chart: ${data.map((d) => `${d.date} ${d.eggs}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEggs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#047857" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#047857" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} dy={8} minTickGap={12} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} width={48} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }} itemStyle={{ fontWeight: 700, color: '#047857' }} />
          <Area type="monotone" dataKey="eggs" name="Eggs" stroke="#047857" strokeWidth={3} fill="url(#colorEggs)" isAnimationActive={!reduced} animationDuration={900} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
