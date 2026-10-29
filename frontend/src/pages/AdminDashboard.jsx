import { useCallback, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingBag, MessageSquare, IndianRupee, AlertTriangle, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import EmptyState from '../components/EmptyState';
import PageLoader from '../components/PageLoader';
import api, { errorMessage } from '../utils/axios';
import { useNotification } from '../context/NotificationContext';

const navGroups = [{ title: 'Platform', items: [{ label: 'Overview', path: '/admin', icon: LayoutDashboard, keywords: 'admin problems users' }] }];
const STATUS_LABEL = { Pending: 'Pending', Accepted: 'Accepted', Completed: 'Delivered', Rejected: 'Rejected / cancelled' };

function Overview() {
  const { addNotification } = useNotification();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    api.get('/admin/overview', { silent: true }).then(({ data: d }) => setData(d)).catch((err) => setError(errorMessage(err)));
  }, []);
  useEffect(load, [load]);

  const resolve = async (id) => {
    setBusy(id);
    try {
      await api.put(`/admin/orders/${id}/resolve`, {}, { silent: true });
      addNotification('Problem marked as resolved.', 'success');
      load();
    } catch (err) {
      addNotification(errorMessage(err), 'error');
    } finally {
      setBusy('');
    }
  };

  if (error) return <EmptyState icon={AlertTriangle} tone="error" title="Could not load the overview" message={error} />;
  if (!data) return <PageLoader label="Loading the admin overview" />;

  const cards = [
    { label: 'Farmers', value: data.totals.farmers, icon: Users },
    { label: 'Buyers', value: data.totals.buyers, icon: Users },
    { label: 'Active listings', value: data.totals.listings, icon: ShoppingBag },
    { label: 'Delivered order value', value: `₹${Math.round(data.totals.completedValue).toLocaleString('en-IN')}`, icon: IndianRupee },
  ];
  const totalOrders = Object.values(data.ordersByStatus).reduce((s, n) => s + n, 0) || 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Platform overview</h1>
        <p className="text-slate-600 mt-1">Users, orders and reported problems across PoultrySmart.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <li key={c.label} className="bg-white rounded-3xl border border-slate-200 p-5">
            <c.icon size={20} className="text-emerald-700" aria-hidden="true" />
            <p className="mt-3 text-sm text-slate-600">{c.label}</p>
            <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{c.value}</p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="pipe-title" className="bg-white rounded-3xl border border-slate-200 p-6">
        <h2 id="pipe-title" className="text-lg font-bold text-slate-900 mb-4">Order pipeline</h2>
        <div className="flex h-4 rounded-full overflow-hidden bg-slate-100" aria-hidden="true">
          {['Completed', 'Accepted', 'Pending', 'Rejected'].map((k, i) => (
            <div key={k} style={{ width: `${((data.ordersByStatus[k] || 0) / totalOrders) * 100}%` }} className={['bg-emerald-700', 'bg-sky-700', 'bg-amber-600', 'bg-rose-700'][i]} />
          ))}
        </div>
        <ul className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {['Completed', 'Accepted', 'Pending', 'Rejected'].map((k) => (
            <li key={k}><span className="font-bold text-slate-900 tabular-nums">{data.ordersByStatus[k] || 0}</span> <span className="text-slate-600">{STATUS_LABEL[k]}</span></li>
          ))}
        </ul>
      </section>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        <section aria-labelledby="issues-title" className="bg-white rounded-3xl border border-slate-200 p-6">
          <h2 id="issues-title" className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-amber-600" aria-hidden="true" />Open problems ({data.openIssues.length})</h2>
          {data.openIssues.length === 0 ? (
            <p className="text-sm text-slate-600 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-700" aria-hidden="true" />No open problems. Everything reported has been resolved.</p>
          ) : (
            <ul className="space-y-3">
              {data.openIssues.map((o) => (
                <li key={o._id} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 flex gap-4">
                  {o.listing?.image && <img src={o.listing.image} alt="" width="64" height="64" className="w-16 h-16 rounded-xl object-cover shrink-0" loading="lazy" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{o.issue.reason} · {o.listing?.productName || 'Removed listing'}</p>
                    <p className="text-sm text-slate-700 mt-0.5">{o.issue.details}</p>
                    <p className="text-xs text-slate-600 mt-1">Buyer: {o.buyer?.name} · Farmer: {o.farmer?.name} · reported by {o.issue.reportedBy?.name}</p>
                  </div>
                  <button type="button" className="btn btn-secondary !py-2 self-center shrink-0" disabled={busy === o._id} onClick={() => resolve(o._id)}>
                    {busy === o._id ? 'Saving…' : 'Mark resolved'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="users-title" className="bg-white rounded-3xl border border-slate-200 p-6">
          <h2 id="users-title" className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><MessageSquare size={20} className="text-emerald-700" aria-hidden="true" />Newest users</h2>
          <ul className="divide-y divide-slate-100">
            {data.recentUsers.map((u) => (
              <li key={u._id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-900 truncate">{u.name}</span>
                <span className={`chip ${u.role === 'Farmer' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-indigo-50 border-indigo-200 text-indigo-800'}`}>{u.role}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-600 mt-3">{data.totals.posts} community posts in total.</p>
        </section>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <DashboardLayout navGroups={navGroups} roleLabel="Admin" homePath="/admin" showAssistant={false}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="*" element={<Overview />} />
      </Routes>
    </DashboardLayout>
  );
}
