import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Egg, Menu, X, LogOut, Mic, MessageSquare, Wifi, WifiOff, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ErrorBoundary from './ErrorBoundary';
import PageLoader from './PageLoader';
import AIAssistant from './AIAssistant';
import NotificationBell from './NotificationBell';
import api from '../utils/axios';

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

/** Unread chat messages, refreshed every 30 s while the tab is visible. */
function useUnread() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () => {
      if (document.hidden) return;
      api.get('/chat/contacts', { silent: true })
        .then(({ data }) => alive && setUnread(data.reduce((s, c) => s + (c.unread || 0), 0)))
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return unread;
}

/**
 * Shared shell for the farmer and buyer dashboards: sidebar (a drawer on phones and tablets),
 * a top bar with quick search, connection status, messages and voice, and the page area.
 */
export default function DashboardLayout({ navGroups, accent = 'emerald', roleLabel, homePath, messagesPath, showAssistant = true, children }) {
  const { user, logout } = useAuth();
  const { addNotification } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const online = useOnline();
  const unread = useUnread();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [query, setQuery] = useState('');
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);

  const allItems = navGroups.flatMap((g) => g.items);
  const current = allItems.find((i) => i.path === location.pathname) ||
    allItems.filter((i) => i.path !== homePath && location.pathname.startsWith(i.path)).sort((a, b) => b.path.length - a.path.length)[0] ||
    allItems[0];

  // Close the drawer on navigation, and move focus to the page for screen-reader users.
  useEffect(() => {
    setDrawerOpen(false);
    document.getElementById('main')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${current?.label || 'Dashboard'} · PoultrySmart`;
  }, [current]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') { setDrawerOpen(false); menuButtonRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    drawerRef.current?.querySelector('a,button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleVoice = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addNotification('Voice input is not supported in this browser. Try Chrome on Android, or type your question.', 'info');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      window.dispatchEvent(new CustomEvent('open-ai-assistant-with-query', { detail: transcript }));
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === 'not-allowed') addNotification('Microphone permission was blocked. Allow it in your browser settings to use voice.', 'error');
      else if (event.error !== 'aborted') addNotification("Couldn't hear that clearly. Please try again.", 'info');
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }, [addNotification]);

  const matches = query.trim()
    ? allItems.filter((i) => `${i.label} ${i.keywords || ''}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];

  const activeCls = accent === 'indigo' ? 'bg-indigo-600 text-white shadow-md' : 'bg-emerald-700 text-white shadow-md';
  // The floating assistant would cover the chat box's Send button, so it stays off the AI and Messages pages.
  const isAiPage = /\/(ai|messages|chat)$/.test(location.pathname);

  const sidebar = (
    <>
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <Link to={homePath} className="flex items-center gap-3 rounded-xl" aria-label="PoultrySmart dashboard home">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${accent === 'indigo' ? 'bg-indigo-600' : 'bg-emerald-700'}`} aria-hidden="true">
            <Egg size={20} />
          </span>
          <span className="leading-none">
            <span className="block text-lg font-extrabold text-slate-900 tracking-tight">Poultry<span className={accent === 'indigo' ? 'text-indigo-600' : 'text-emerald-700'}>Smart</span></span>
            <span className="block text-[11px] font-semibold tracking-widest text-slate-500 uppercase mt-1">{roleLabel}</span>
          </span>
        </Link>
        <button type="button" className="icon-btn lg:hidden" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-4 py-2 space-y-6 no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title}>
            <h2 className="px-3 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em]">{group.title}</h2>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = item === current;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === homePath}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive ? activeCls : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                      <item.icon size={18} aria-hidden="true" className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'} />
                      <span className="flex-1">{item.label}</span>
                      {item.path === messagesPath && unread > 0 && (
                        <span className={`min-w-6 h-6 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${isActive ? 'bg-white text-slate-900' : 'bg-rose-600 text-white'}`}>
                          {unread}<span className="sr-only"> unread</span>
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700" aria-hidden="true">
            {(user?.name || '?').charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-900 truncate">{user?.name}</span>
            <span className="block text-xs text-slate-500 truncate">{user?.email || user?.phone}</span>
          </span>
        </div>
        <button type="button" onClick={handleLogout} className="btn btn-secondary w-full text-rose-700 hover:bg-rose-50 hover:border-rose-200">
          <LogOut size={16} aria-hidden="true" /> Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[272px] shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200">
        {sidebar}
      </aside>

      {/* Phone / tablet drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside ref={drawerRef} id="dashboard-drawer" role="dialog" aria-modal="true" aria-label="Menu"
            className="drawer-in absolute inset-y-0 left-0 w-[86%] max-w-[300px] bg-white flex flex-col shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="h-16 px-3 sm:px-6 flex items-center gap-2 sm:gap-4">
            <button ref={menuButtonRef} type="button" className="icon-btn lg:hidden" onClick={() => setDrawerOpen(true)}
              aria-label="Open menu" aria-expanded={drawerOpen} aria-controls="dashboard-drawer">
              <Menu size={22} aria-hidden="true" />
            </button>
            <p className="font-bold text-slate-900 truncate lg:hidden">{current?.label}</p>

            <div className="relative hidden md:block flex-1 max-w-sm">
              <label htmlFor="quick-search" className="sr-only">Jump to a tool</label>
              <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input id="quick-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off"
                onKeyDown={(e) => { if (e.key === 'Enter' && matches[0]) { navigate(matches[0].path); setQuery(''); } if (e.key === 'Escape') setQuery(''); }}
                placeholder="Jump to… (e.g. orders, feed)" className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 border border-transparent text-sm focus:bg-white focus:border-emerald-600 focus:outline-none" />
              {matches.length > 0 && (
                <ul className="absolute mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50">
                  {matches.map((m) => (
                    <li key={m.path}>
                      <button type="button" onClick={() => { navigate(m.path); setQuery(''); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50">
                        <m.icon size={16} aria-hidden="true" className="text-slate-500" /> {m.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <span className={`chip hidden sm:inline-flex ${online ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`} role="status">
                {online ? <Wifi size={14} aria-hidden="true" /> : <WifiOff size={14} aria-hidden="true" />} {online ? 'Online' : 'Offline'}
              </span>
              <NotificationBell />
              {messagesPath && (
                <Link to={messagesPath} className="icon-btn relative" aria-label={unread ? `Messages, ${unread} unread` : 'Messages'}>
                  <MessageSquare size={20} aria-hidden="true" />
                  {unread > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white" aria-hidden="true" />}
                </Link>
              )}
              <button type="button" onClick={handleVoice} aria-pressed={listening}
                className={`btn !px-3 sm:!px-4 ${listening ? 'bg-rose-600 text-white' : 'btn-dark'}`}>
                <Mic size={18} aria-hidden="true" className={listening ? 'animate-pulse' : ''} />
                <span className="hidden sm:inline">{listening ? 'Listening…' : 'Ask by voice'}</span>
                <span className="sr-only sm:hidden">{listening ? 'Listening' : 'Ask Kisan Mitra by voice'}</span>
              </button>
            </div>
          </div>
          {/@demo\.poultrysmart$/.test(user?.email || '') && (
            <p className="px-4 py-1.5 text-xs font-semibold text-center bg-amber-100 text-amber-950 border-t border-amber-200">
              Demo account: you are exploring sample data. Changes you make are visible to other demo visitors.
            </p>
          )}
          {!online && (
            <p className="px-4 py-2 text-sm bg-amber-50 text-amber-900 border-t border-amber-200" role="status">
              You are offline. You can keep reading this page; changes will fail until the connection returns.
            </p>
          )}
        </header>

        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
            <ErrorBoundary resetKey={location.pathname}>
              <Suspense fallback={<PageLoader />}>
                <div key={location.pathname} className="page-enter">{children}</div>
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {showAssistant && !isAiPage && <AIAssistant />}
    </div>
  );
}
