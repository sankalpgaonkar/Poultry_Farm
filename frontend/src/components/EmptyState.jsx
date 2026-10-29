/** Friendly empty / error state with an optional action. */
export default function EmptyState({ icon: Icon, title, message, action, tone = 'neutral' }) {
  const toneCls = tone === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500';
  return (
    <div className="flex flex-col items-center text-center gap-4 py-14 px-6 rounded-3xl border-2 border-dashed border-slate-200 bg-white">
      {Icon && (
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${toneCls}`} aria-hidden="true">
          <Icon size={26} />
        </div>
      )}
      <div className="space-y-1 max-w-md">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
      {action}
    </div>
  );
}
