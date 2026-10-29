import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, RefreshCw } from 'lucide-react';
import api, { errorMessage } from '../utils/axios';
import { useNotification } from '../context/NotificationContext';
import OrderCard from './OrderCard';
import ReportProblemDialog from './ReportProblemDialog';
import EmptyState from './EmptyState';
import { SkeletonList } from './PageLoader';

const FILTERS = ['All', 'Pending', 'Accepted', 'Completed', 'Rejected'];

/** Shared order list for "Your Orders" (farmer) and "My Purchases" (buyer). */
export default function OrdersList({ perspective }) {
  const { addNotification, confirm } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [reporting, setReporting] = useState(null);
  const isFarmer = perspective === 'farmer';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(isFarmer ? '/marketplace/orders' : '/marketplace/orders/me', { silent: true });
      setOrders(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isFarmer]);

  useEffect(() => { load(); }, [load]);

  const replace = (updated) => setOrders((prev) => prev.map((o) => (o._id === updated._id ? { ...o, ...updated, listing: o.listing, buyer: o.buyer, farmer: o.farmer } : o)));

  const setStatus = async (order, status) => {
    if (status === 'Rejected' && !(await confirm({ title: 'Reject this order?', message: 'The quantity goes back to your listing. This cannot be undone.', confirmLabel: 'Reject order', danger: true }))) return;
    setBusyId(order._id);
    try {
      const { data } = await api.put(`/marketplace/orders/${order._id}/status`, { status });
      replace(data);
      addNotification(`Order ${status === 'Completed' ? 'marked as delivered' : status.toLowerCase()}.`, 'success');
    } catch { /* toast shown by the API client */ } finally {
      setBusyId(null);
    }
  };

  const resolve = async (order) => {
    setBusyId(order._id);
    try {
      const { data } = await api.put(`/marketplace/orders/${order._id}/report/resolve`);
      replace(data);
      addNotification('Marked as solved.', 'success');
    } catch { /* toast shown */ } finally {
      setBusyId(null);
    }
  };

  const shown = filter === 'All' ? orders : orders.filter((o) => o.status === filter);
  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === 'All' ? orders.length : orders.filter((o) => o.status === f).length]));

  return (
    <section className="space-y-6" aria-labelledby="orders-title">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="orders-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900">{isFarmer ? 'Your orders' : 'My purchases'}</h1>
          <p className="text-slate-600 mt-1">{isFarmer ? 'Orders buyers placed on your listings.' : 'Everything you ordered from farmers.'}</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}><RefreshCw size={16} aria-hidden="true" className={loading ? 'animate-spin' : ''} />Refresh</button>
      </header>

      <div role="tablist" aria-label="Filter orders by status" className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {FILTERS.map((f) => (
          <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
            className={`chip whitespace-nowrap ${filter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
            {f} <span>({counts[f]})</span>
          </button>
        ))}
      </div>

      {loading ? <SkeletonList rows={3} className="h-40" /> : error ? (
        <EmptyState icon={ShoppingCart} tone="error" title="Couldn't load orders" message={error}
          action={<button type="button" className="btn btn-primary" onClick={load}>Try again</button>} />
      ) : shown.length === 0 ? (
        <EmptyState icon={ShoppingCart} title={orders.length ? `No ${filter.toLowerCase()} orders` : 'No orders yet'}
          message={isFarmer ? 'When buyers order from your listings, they appear here.' : 'Browse the marketplace to buy fresh eggs and birds directly from farmers.'}
          action={!orders.length && <Link to={isFarmer ? '/farmer/listings' : '/buyer'} className="btn btn-primary">{isFarmer ? 'Go to marketplace' : 'Start shopping'}</Link>} />
      ) : (
        <div className="space-y-4">
          {shown.map((o) => (
            <OrderCard key={o._id} order={o} perspective={perspective} busy={busyId === o._id} onStatus={setStatus}
              onReport={setReporting} onResolve={resolve} messagesPath={isFarmer ? '/farmer/messages' : '/buyer/chat'} />
          ))}
        </div>
      )}

      {reporting && (
        <ReportProblemDialog order={reporting} onClose={() => setReporting(null)} onReported={(data) => { replace(data); setReporting(null); }} />
      )}
    </section>
  );
}
