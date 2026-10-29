import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, PackageCheck, MessageSquare, AlertTriangle, Calendar, User } from 'lucide-react';
import { getConsistentImage } from '../utils/imageConstants';

const STATUS = {
  Pending: { cls: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock, label: 'Waiting for farmer' },
  Accepted: { cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle, label: 'Accepted' },
  Completed: { cls: 'bg-sky-50 text-sky-800 border-sky-200', icon: PackageCheck, label: 'Completed' },
  Rejected: { cls: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle, label: 'Rejected' },
};

/** One marketplace order, shown to the farmer (perspective="farmer") or to the buyer. */
export default function OrderCard({ order, perspective, busy, onStatus, onReport, onResolve, messagesPath }) {
  const s = STATUS[order.status] || STATUS.Pending;
  const other = perspective === 'farmer' ? order.buyer : order.farmer;
  const issue = order.issue;
  const name = order.listing?.productName || 'Listing removed';

  return (
    <article className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 flex flex-col md:flex-row gap-5 hover:shadow-soft transition-shadow">
      <img src={order.listing?.image || getConsistentImage(name)} alt="" loading="lazy" decoding="async"
        className="w-full md:w-36 h-40 md:h-36 object-cover rounded-2xl bg-slate-100 shrink-0" />
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate">{name}</h3>
            <p className="text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <span className="inline-flex items-center gap-1.5"><User size={14} aria-hidden="true" />{perspective === 'farmer' ? 'Buyer' : 'Seller'}: {other?.name || 'Unknown'}</span>
              <span className="inline-flex items-center gap-1.5"><Calendar size={14} aria-hidden="true" />{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </p>
          </div>
          <span className={`chip ${s.cls}`}><s.icon size={14} aria-hidden="true" />{perspective === 'farmer' && order.status === 'Pending' ? 'New order' : s.label}</span>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-slate-50 rounded-xl p-3"><dt className="text-slate-500">Quantity</dt><dd className="font-bold text-slate-900">{order.quantityOrdered}</dd></div>
          <div className="bg-slate-50 rounded-xl p-3"><dt className="text-slate-500">Total</dt><dd className="font-bold text-slate-900">₹{Number(order.totalPrice).toLocaleString('en-IN')}</dd></div>
          {other?.phone && <div className="bg-slate-50 rounded-xl p-3 col-span-2 sm:col-span-1"><dt className="text-slate-500">Phone</dt><dd className="font-bold text-slate-900"><a className="underline" href={`tel:${other.phone}`}>{other.phone}</a></dd></div>}
        </dl>

        {issue && (
          <div className={`rounded-xl p-3 text-sm border ${issue.status === 'Open' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <p className="font-semibold flex items-center gap-2"><AlertTriangle size={16} aria-hidden="true" />
              Problem {issue.status === 'Open' ? 'reported' : 'resolved'}: {issue.reason}</p>
            {issue.details && <p className="mt-1">{issue.details}</p>}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {perspective === 'farmer' && order.status === 'Pending' && (
            <>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => onStatus(order, 'Accepted')}><CheckCircle size={16} aria-hidden="true" />Accept</button>
              <button type="button" className="btn btn-secondary text-rose-700" disabled={busy} onClick={() => onStatus(order, 'Rejected')}><XCircle size={16} aria-hidden="true" />Reject</button>
            </>
          )}
          {perspective === 'farmer' && order.status === 'Accepted' && (
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => onStatus(order, 'Completed')}><PackageCheck size={16} aria-hidden="true" />Mark as delivered</button>
          )}
          {other?._id && messagesPath && (
            <Link to={`${messagesPath}?with=${other._id}`} className="btn btn-secondary"><MessageSquare size={16} aria-hidden="true" />Message {perspective === 'farmer' ? 'buyer' : 'seller'}</Link>
          )}
          {!issue || issue.status !== 'Open' ? (
            <button type="button" className="btn btn-secondary" onClick={() => onReport(order)}><AlertTriangle size={16} aria-hidden="true" />Report a problem</button>
          ) : (
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => onResolve(order)}>Mark problem solved</button>
          )}
        </div>
      </div>
    </article>
  );
}
