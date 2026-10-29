import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, ArrowLeft, MessageSquare, Search } from 'lucide-react';
import api, { errorMessage } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/PageLoader';

const POLL_MS = 5000;
const time = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

/**
 * Buyer <-> farmer messages. Conversations exist for people you have an order with.
 * New messages are fetched every few seconds while the chat is open (works on serverless hosting).
 */
export default function Messages() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeId = params.get('with');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [filter, setFilter] = useState('');
  const endRef = useRef(null);

  const loadContacts = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/contacts', { silent: true });
      setContacts(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const loadThread = useCallback(async (id, quiet = false) => {
    if (!quiet) setLoadingThread(true);
    try {
      const { data } = await api.get(`/chat/${id}`, { silent: true });
      setMessages((prev) => (prev.length === data.length && prev.at(-1)?._id === data.at(-1)?._id ? prev : data));
      // Opening a conversation marks it read on the server; clear its badge right away.
      setContacts((cs) => cs.map((c) => (String(c._id) === String(id) && c.unread ? { ...c, unread: 0 } : c)));
    } catch (err) {
      if (!quiet) setSendError(errorMessage(err));
    } finally {
      if (!quiet) setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    if (!activeId) return undefined;
    setMessages([]);
    setSendError('');
    loadThread(activeId);
    const t = setInterval(() => { if (!document.hidden) { loadThread(activeId, true); loadContacts(); } }, POLL_MS);
    return () => clearInterval(t);
  }, [activeId, loadThread, loadContacts]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError('');
    try {
      const { data } = await api.post(`/chat/${activeId}`, { message: body }, { silent: true });
      setMessages((m) => [...m, data]);
      setText('');
      loadContacts();
    } catch (err) {
      setSendError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const active = contacts.find((c) => c._id === activeId);
  const shown = contacts.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));

  if (loading) return <SkeletonList rows={3} />;
  if (error) return <EmptyState icon={MessageSquare} tone="error" title="Couldn't load messages" message={error} action={<button type="button" className="btn btn-primary" onClick={loadContacts}>Try again</button>} />;
  if (!contacts.length) {
    return (
      <EmptyState icon={MessageSquare} title="No conversations yet"
        message={user?.role === 'Farmer' ? 'When a buyer orders from you, you can message them here.' : 'Place an order on the marketplace, then you can message the farmer here.'} />
    );
  }

  return (
    <section aria-labelledby="messages-title" className="space-y-4">
      <h1 id="messages-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900">Messages</h1>
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] bg-white border border-slate-200 rounded-3xl overflow-hidden h-[calc(100dvh-13rem)] min-h-[420px]">
        <aside className={`${activeId ? 'hidden md:flex' : 'flex'} flex-col border-r border-slate-200 min-h-0 min-w-0`}>
          <div className="p-3 border-b border-slate-100 relative">
            <label htmlFor="contact-filter" className="sr-only">Search conversations</label>
            <Search size={16} aria-hidden="true" className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
            <input id="contact-filter" type="search" className="field !py-2 pl-9" placeholder="Search" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <ul className="flex-1 overflow-y-auto p-2 space-y-1">
            {shown.map((c) => (
              <li key={c._id}>
                <button type="button" onClick={() => setParams({ with: c._id })} aria-current={c._id === activeId ? 'true' : undefined}
                  className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-colors ${c._id === activeId ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                  <span className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0" aria-hidden="true">{c.name.charAt(0)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2"><span className="font-semibold text-slate-900 truncate">{c.name}</span>
                      {c.lastAt && <span className="text-xs text-slate-500 shrink-0">{time(c.lastAt)}</span>}</span>
                    <span className="block text-sm text-slate-600 truncate">{c.lastMessage || `${c.role} · say hello`}</span>
                  </span>
                  {c.unread > 0 && <span className="min-w-6 h-6 px-1.5 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center">{c.unread}<span className="sr-only"> unread</span></span>}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className={`${activeId ? 'flex' : 'hidden md:flex'} flex-col min-h-0`}>
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 p-8 text-center">Choose a conversation to start messaging.</div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 border-b border-slate-100">
                <button type="button" className="icon-btn md:hidden" onClick={() => setParams({})} aria-label="Back to conversations"><ArrowLeft size={20} aria-hidden="true" /></button>
                <span className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center" aria-hidden="true">{active?.name?.charAt(0) || '?'}</span>
                <div><p className="font-bold text-slate-900">{active?.name || 'Conversation'}</p><p className="text-xs text-slate-500">{active?.role}</p></div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50" aria-live="polite" aria-label="Messages">
                {loadingThread && <SkeletonList rows={2} className="h-10" />}
                {!loadingThread && messages.length === 0 && <p className="text-center text-sm text-slate-500 py-10">No messages yet. Say hello!</p>}
                {messages.map((m) => {
                  const mine = String(m.sender) === String(user?._id);
                  return (
                    <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <p className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ${mine ? 'bg-emerald-700 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'}`}>
                        {m.message}
                        <span className={`block text-[11px] mt-1 ${mine ? 'text-emerald-100' : 'text-slate-500'}`}>{time(m.createdAt)}</span>
                      </p>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="p-3 border-t border-slate-100 flex gap-2 items-end">
                <label htmlFor="chat-input" className="sr-only">Type a message</label>
                <textarea id="chat-input" rows={1} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send(e); }}
                  className="field resize-none !py-2.5" placeholder="Type a message" />
                <button type="submit" className="btn btn-primary !px-4" disabled={sending || !text.trim()} aria-label="Send message"><Send size={18} aria-hidden="true" /></button>
              </form>
              {sendError && <p className="field-error px-4 pb-3" role="alert">{sendError}</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
