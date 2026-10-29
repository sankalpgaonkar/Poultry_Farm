import { Link, useNavigate } from 'react-router-dom';
import { Egg, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth, homeFor } from '../context/AuthContext';

/** Top bar for public pages (home, login, signup). Dashboards have their own layout. */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-[100] bg-white/85 backdrop-blur-xl border-b border-slate-200">
      <nav aria-label="Main" className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
        <Link to="/" className="group flex items-center gap-2.5 rounded-xl" aria-label="PoultrySmart home">
          <span className="bg-brand-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-md shadow-brand-200" aria-hidden="true">
            <Egg className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </span>
          <span className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">Poultry<span className="text-brand-600">Smart</span></span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to={homeFor(user.role)} className="btn btn-secondary !px-3 sm:!px-5">
              <LayoutDashboard size={18} aria-hidden="true" /><span className="hidden sm:inline">My dashboard</span><span className="sr-only sm:hidden">My dashboard</span>
            </Link>
            <button type="button" onClick={handleLogout} className="btn btn-dark !px-3 sm:!px-5">
              <LogOut size={16} aria-hidden="true" /><span className="hidden sm:inline">Log out</span><span className="sr-only sm:hidden">Log out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 sm:gap-3">
            <Link to="/login" className="btn !px-3 sm:!px-5 text-slate-700 hover:text-brand-700 hover:bg-slate-100">Log in</Link>
            <Link to="/signup" className="btn btn-primary !px-4 sm:!px-6">Join now</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
