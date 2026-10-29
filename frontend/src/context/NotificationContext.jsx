import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

const NotificationContext = createContext({ addNotification: () => {}, confirm: async () => false });

let nextId = 1;

/**
 * Toast messages (replaces window.alert) and an accessible confirm dialog (replaces window.confirm).
 * Usage: const { addNotification, confirm } = useNotification();
 *        if (await confirm({ title: 'Delete item?', confirmLabel: 'Delete', danger: true })) { ... }
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [dialog, setDialog] = useState(null);
  const confirmBtnRef = useRef(null);
  const lastFocusRef = useRef(null);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((message, type = 'info') => {
    if (!message) return;
    const id = nextId++;
    setNotifications((prev) => {
      // Avoid stacking the same message several times (e.g. several failed requests at once).
      if (prev.some((n) => n.message === message)) return prev;
      return [...prev.slice(-3), { id, message, type }];
    });
    setTimeout(() => removeNotification(id), type === 'error' ? 7000 : 4500);
  }, [removeNotification]);

  const confirm = useCallback((options) => new Promise((resolve) => {
    lastFocusRef.current = document.activeElement;
    setDialog({ title: 'Are you sure?', message: '', confirmLabel: 'Confirm', cancelLabel: 'Cancel', danger: false, ...options, resolve });
  }), []);

  const closeDialog = useCallback((result) => {
    setDialog((d) => { d?.resolve(result); return null; });
    setTimeout(() => lastFocusRef.current?.focus?.(), 0);
  }, []);

  useEffect(() => {
    if (!dialog) return;
    confirmBtnRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') closeDialog(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialog, closeDialog]);

  // Global notifications from the API client (utils/axios.js)
  useEffect(() => {
    const handleGlobalNotify = (e) => addNotification(e.detail?.message, e.detail?.type);
    window.addEventListener('app-notify', handleGlobalNotify);
    return () => window.removeEventListener('app-notify', handleGlobalNotify);
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{ addNotification, notify: addNotification, confirm }}>
      {children}
      <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-[999] flex flex-col gap-3 sm:max-w-sm sm:w-full pointer-events-none" aria-live="polite" aria-atomic="false">
        {notifications.map((n) => (
          <div
            key={n.id}
            role={n.type === 'error' ? 'alert' : 'status'}
            className={`toast-in pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border ${
              n.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900' :
              n.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
              'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <span className="shrink-0 mt-0.5" aria-hidden="true">
              {n.type === 'error' ? <AlertCircle size={20} /> : n.type === 'success' ? <CheckCircle size={20} /> : <Info size={20} />}
            </span>
            <p className="text-sm font-semibold leading-snug flex-1">{n.message}</p>
            <button type="button" onClick={() => removeNotification(n.id)} aria-label="Dismiss message"
              className="p-1 -m-1 rounded-lg hover:bg-black/5 transition-colors">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => closeDialog(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message"
            className="dialog-in w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="confirm-title" className="text-lg font-bold text-slate-900">{dialog.title}</h2>
            {dialog.message && <p id="confirm-message" className="mt-2 text-sm text-slate-600">{dialog.message}</p>}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button type="button" onClick={() => closeDialog(false)} className="btn btn-secondary">{dialog.cancelLabel}</button>
              <button type="button" ref={confirmBtnRef} onClick={() => closeDialog(true)} className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`}>
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => useContext(NotificationContext);
