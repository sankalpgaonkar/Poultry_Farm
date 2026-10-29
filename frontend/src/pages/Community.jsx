import { useState, useEffect, useCallback } from 'react';
import { ArrowUp, MessageCircle, Send, Plus, Search, X, Users } from 'lucide-react';
import api, { errorMessage } from '../utils/axios';
import { useNotification } from '../context/NotificationContext';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/PageLoader';

const TAGS = ['Market Price', 'Weather', 'Pest Alert', 'Advice', 'Question'];
const TAG_STYLE = {
  'Market Price': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Weather: 'bg-sky-50 text-sky-800 border-sky-200',
  'Pest Alert': 'bg-rose-50 text-rose-800 border-rose-200',
  Advice: 'bg-violet-50 text-violet-800 border-violet-200',
  Question: 'bg-amber-50 text-amber-800 border-amber-200',
};
const when = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function PostCard({ post, onChange }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [voting, setVoting] = useState(false);

  const upvote = async () => {
    setVoting(true);
    try {
      const { data } = await api.put(`/community/${post._id}/upvote`, {});
      onChange({ ...post, upvotes: data.upvotes, hasUpvoted: data.hasUpvoted });
    } catch { /* toast shown */ } finally {
      setVoting(false);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/community/${post._id}/comments`, { content: comment.trim() });
      onChange({ ...post, comments: [...post.comments, data] });
      setComment('');
    } catch { /* toast shown */ } finally {
      setSending(false);
    }
  };

  return (
    <article className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex gap-4 sm:gap-6">
      <div className="flex flex-col items-center gap-1 shrink-0">
        <button type="button" onClick={upvote} disabled={voting} aria-pressed={!!post.hasUpvoted}
          aria-label={post.hasUpvoted ? `Remove your upvote from ${post.title}` : `Upvote ${post.title}`}
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition ${post.hasUpvoted ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-violet-50 hover:text-violet-700'}`}>
          <ArrowUp size={22} aria-hidden="true" />
        </button>
        <span className="text-lg font-extrabold text-slate-900 tabular-nums" aria-label={`${post.upvotes} upvotes`}>{post.upvotes}</span>
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {(post.tags?.length ? post.tags : ['General']).map((t) => <span key={t} className={`chip ${TAG_STYLE[t] || 'bg-slate-50 border-slate-200 text-slate-700'}`}>{t}</span>)}
          <span>{post.author?.name || 'Farmer'} · {when(post.createdAt)}</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{post.title}</h3>
        <p className="text-slate-700 whitespace-pre-line break-words">{post.content}</p>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-violet-700">
          <MessageCircle size={16} aria-hidden="true" />{post.comments.length} comment{post.comments.length === 1 ? '' : 's'}{open ? ' · hide' : ''}
        </button>
        {open && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            {post.comments.map((c) => (
              <div key={c._id} className="bg-slate-50 rounded-2xl p-3">
                <p className="text-xs text-slate-600 font-semibold">{c.author?.name || 'Member'} · {when(c.createdAt)}</p>
                <p className="text-sm text-slate-800 mt-1 whitespace-pre-line break-words">{c.content}</p>
              </div>
            ))}
            <form onSubmit={addComment} className="flex gap-2">
              <label htmlFor={`c-${post._id}`} className="sr-only">Write a comment</label>
              <input id={`c-${post._id}`} className="field !py-2.5" maxLength={2000} placeholder="Write a helpful reply…" value={comment} onChange={(e) => setComment(e.target.value)} />
              <button type="submit" className="btn btn-primary !px-4" disabled={sending || !comment.trim()} aria-label="Post comment"><Send size={16} aria-hidden="true" /></button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}

export default function Community() {
  const { addNotification } = useNotification();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', tag: 'Advice' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/community', { params: tag ? { tag } : {}, silent: true });
      setPosts(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tag]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 3) return setFormError('Please write a title of at least 3 letters.');
    if (!form.content.trim()) return setFormError('Please add some details.');
    setSaving(true);
    setFormError('');
    try {
      const { data } = await api.post('/community', { title: form.title.trim(), content: form.content.trim(), tags: [form.tag] }, { silent: true });
      setPosts((p) => [{ ...data, comments: [], hasUpvoted: false }, ...p]);
      setForm({ title: '', content: '', tag: 'Advice' });
      setShowForm(false);
      addNotification('Your post is live.', 'success');
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const q = search.trim().toLowerCase();
  const shown = posts.filter((p) => !q || p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="max-w-2xl">
          <p className="chip bg-violet-50 border-violet-200 text-violet-800 w-fit"><Users size={14} aria-hidden="true" />Farmer community</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Farmer groups</h1>
          <p className="mt-2 text-slate-600">Share market prices, weather and pest warnings, and help your neighbours.</p>
        </div>
        <button type="button" onClick={() => setShowForm((v) => !v)} aria-expanded={showForm} className="btn btn-dark">
          {showForm ? <X size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}{showForm ? 'Cancel' : 'Start a discussion'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handlePost} className="bg-white border-2 border-violet-200 rounded-3xl p-5 sm:p-6 space-y-4" noValidate aria-labelledby="new-post-title">
          <h2 id="new-post-title" className="text-xl font-bold text-slate-900">New post</h2>
          <div>
            <label htmlFor="p-title" className="field-label">Title</label>
            <input id="p-title" className="field" maxLength={150} placeholder="e.g. Egg rate in Udupi today" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <fieldset>
            <legend className="field-label">Topic</legend>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <label key={t} className={`chip cursor-pointer !py-2 !px-4 ${form.tag === t ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
                  <input type="radio" name="p-tag" className="sr-only" checked={form.tag === t} onChange={() => setForm({ ...form, tag: t })} />{t}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="p-content" className="field-label">Details</label>
            <textarea id="p-content" rows={5} className="field" maxLength={5000} placeholder="Share the details…" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          {formError && <p className="field-error" role="alert">{formError}</p>}
          <div className="flex justify-end"><button type="submit" className="btn btn-primary" disabled={saving}><Send size={16} aria-hidden="true" />{saving ? 'Posting…' : 'Post'}</button></div>
        </form>
      )}

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative lg:w-80">
          <label htmlFor="post-search" className="sr-only">Search posts</label>
          <Search size={16} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input id="post-search" type="search" className="field pl-10" placeholder="Search posts" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Filter by topic">
          {['', ...TAGS].map((t) => (
            <button key={t || 'all'} type="button" aria-pressed={tag === t} onClick={() => setTag(t)}
              className={`chip whitespace-nowrap !py-2.5 !px-4 ${tag === t ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{t || 'All topics'}</button>
          ))}
        </div>
      </div>

      {loading ? <SkeletonList rows={3} className="h-40" /> : error ? (
        <EmptyState icon={Users} tone="error" title="Couldn't load posts" message={error} action={<button type="button" className="btn btn-primary" onClick={fetchPosts}>Try again</button>} />
      ) : shown.length === 0 ? (
        <EmptyState icon={Users} title={posts.length ? 'No posts match your search' : 'No posts yet'} message="Be the first to start a discussion."
          action={!showForm && <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>Start a discussion</button>} />
      ) : (
        <div className="space-y-4">
          {shown.map((p) => <PostCard key={p._id} post={p} onChange={(np) => setPosts((all) => all.map((x) => (x._id === np._id ? np : x)))} />)}
        </div>
      )}
    </div>
  );
}
