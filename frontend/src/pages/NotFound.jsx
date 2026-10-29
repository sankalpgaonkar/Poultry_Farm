import { Link } from 'react-router-dom';
import { Egg } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center space-y-5 max-w-md">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center" aria-hidden="true">
          <Egg size={30} />
        </div>
        <p className="text-sm font-bold text-emerald-700 tracking-widest uppercase">Error 404</p>
        <h1 className="text-3xl font-extrabold text-slate-900">This page has flown the coop</h1>
        <p className="text-slate-600">The link may be old or mistyped.</p>
        <Link to="/" className="btn btn-primary mx-auto">Back to home</Link>
      </div>
    </section>
  );
}
