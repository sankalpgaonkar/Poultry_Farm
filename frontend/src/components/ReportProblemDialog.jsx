import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import api, { errorMessage } from '../utils/axios';
import { useNotification } from '../context/NotificationContext';

const REASONS = ['Not delivered', 'Wrong quantity', 'Poor quality', 'Payment not received', 'Other'];

/** "Report a problem" on an order (grievance flow from the Digital Farmer roadmap). */
export default function ReportProblemDialog({ order, onClose, onReported }) {
  const { addNotification } = useNotification();
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post(`/marketplace/orders/${order._id}/report`, { reason, details }, { silent: true });
      addNotification('Problem reported. The other side can see it on the order.', 'success');
      onReported(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <form role="dialog" aria-modal="true" aria-labelledby="report-title" onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="dialog-in w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center" aria-hidden="true"><AlertTriangle size={20} /></span>
            <div>
              <h2 id="report-title" className="text-lg font-bold text-slate-900">Report a problem</h2>
              <p className="text-sm text-slate-600">{order.listing?.productName || 'Order'} · ₹{order.totalPrice}</p>
            </div>
          </div>
          <button type="button" className="icon-btn -mr-2 -mt-2" onClick={onClose} aria-label="Close"><X size={18} aria-hidden="true" /></button>
        </div>
        <div>
          <label htmlFor="report-reason" className="field-label">What went wrong?</label>
          <select id="report-reason" ref={firstRef} className="field" value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="report-details" className="field-label">Details <span className="font-normal text-slate-500">(optional)</span></label>
          <textarea id="report-details" className="field min-h-24" maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)}
            placeholder="For example: 2 trays were missing" />
        </div>
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Sending…' : 'Report problem'}</button>
        </div>
      </form>
    </div>
  );
}
