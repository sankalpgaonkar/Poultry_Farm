import { useEffect, useRef, useState } from 'react';
import { Bell, ShoppingBag, AlertTriangle, Stethoscope, Info } from 'lucide-react';
import api from '../utils/axios';

const ICON = { Order: ShoppingBag, Alert: AlertTriangle, Disease: Stethoscope, System: Info };
const TONE = { Order: 'bg-indigo-50 text-indigo-700', Alert: 'bg-amber-50 text-amber-800', Disease: 'bg-rose-50 text-rose-700', System: 'bg-slate-100 text-slate-700' };

const ago = (d) => {
  const s = Math.max(1, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.round(s / 60) || 1} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
};

/** Alerts bell in the dashboard top bar: unread count, a dropdown list, and "mark all read". */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unread: 0 });
  const [loaded, setLoaded] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    let alive = true;
    const load = () => !document.hidden && api.get('/notifications', { silent: true })
      .then(({ data: d }) => { if (alive) { setData(d); setLoaded(true); } })
      .catch(() => alive && setLoaded(true));
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const markAll = async () => {
    setData((d) => ({ items: d.items.map((n) => ({ ...n, isRead: true })), unread: 0 }));
    api.put('/notifications/read-all', {}, { silent: true }).catch(() => {});
  };

  return (
    <div className="relative" ref={box}>
      <button type="button" className="icon-btn relative" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="alerts-panel"
        aria-label={data.unread ? `Alerts, ${data.unread} unread` : 'Alerts'}>
        <Bell size={20} aria-hidden="true" />
        {data.unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white" aria-hidden="true">
            {data.unread}
          </span>
        )}
      </button>
      {open && (
        <div id="alerts-panel" role="region" aria-label="Alerts" className="dialog-in absolute right-0 mt-2 w-[min(22rem,calc(100vw-1.5rem))] bg-white border border-slate-200 rounded-2xl shadow-strong z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Alerts</h2>
            {data.unread > 0 && <button type="button" onClick={markAll} className="text-sm font-semibold text-emerald-700 hover:underline">Mark all read</button>}
          </div>
          {!loaded ? (
            <div className="p-4 space-y-3" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-12" />)}</div>
          ) : data.items.length === 0 ? (
            <p className="p-6 text-sm text-slate-600 text-center">No alerts yet. Order updates and farm warnings will show up here.</p>
          ) : (
            <ul className="max-h-[22rem] overflow-y-auto divide-y divide-slate-100">
              {data.items.map((n) => {
                const Icon = ICON[n.type] || Info;
                return (
                  <li key={n._id} className={`flex gap-3 px-4 py-3 ${n.isRead ? '' : 'bg-emerald-50/40'}`}>
                    <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${TONE[n.type] || TONE.System}`} aria-hidden="true"><Icon size={16} /></span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{n.title}{!n.isRead && <span className="sr-only"> (unread)</span>}</p>
                      <p className="text-sm text-slate-600">{n.message}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ago(n.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
