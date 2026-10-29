/** Skeleton shown while a page's code or data loads. */
export default function PageLoader({ fullScreen = false, label = 'Loading' }) {
  return (
    <div role="status" aria-live="polite" className={`${fullScreen ? 'min-h-screen' : 'min-h-[40vh]'} w-full p-6 md:p-10`}>
      <span className="sr-only">{label}…</span>
      <div className="max-w-6xl mx-auto space-y-6" aria-hidden="true">
        <div className="skeleton h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="skeleton h-64" />
      </div>
    </div>
  );
}

/** Small inline skeleton for lists and cards. */
export function SkeletonList({ rows = 3, className = 'h-24' }) {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, i) => <div key={i} aria-hidden="true" className={`skeleton ${className}`} />)}
    </div>
  );
}
