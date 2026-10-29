import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Package, Trash2, ShoppingCart, Search, ShoppingBag, X, Minus, User, AlertTriangle, ImagePlus, Store } from 'lucide-react';
import api, { errorMessage } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getConsistentImage, formatRupee } from '../utils/imageConstants';
import { compressImage } from '../utils/image';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/PageLoader';
import OrdersList from '../components/OrdersList';

const CATEGORIES = [
  { id: 'ALL', label: 'All' }, { id: 'EGG', label: 'Eggs' }, { id: 'BIRD', label: 'Birds' },
  { id: 'FEED', label: 'Feed' }, { id: 'EQUIPMENT', label: 'Equipment' }, { id: 'OTHER', label: 'Other' },
];
const EMPTY_FORM = { name: '', quantity: '', price: '', category: 'EGG', description: '', image: '' };

function Modal({ titleId, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.querySelector('input,select,textarea,button')?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}
        className="dialog-in w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function ListingCard({ listing, mine, onOrder, onDelete }) {
  return (
    <article className="tilt-card group bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img src={listing.image || getConsistentImage(listing.productName, listing.category)} alt="" loading="lazy" decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute top-3 left-3 chip bg-white/95 border-white text-slate-800">{CATEGORIES.find((c) => c.id === listing.category)?.label || listing.category}</span>
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-lg font-bold text-slate-900 leading-snug">{listing.productName}</h3>
          {!mine && <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1"><User size={14} aria-hidden="true" />{listing.farmer?.name || 'Local farmer'}</p>}
          {listing.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{listing.description}</p>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{formatRupee(listing.pricePerUnit)}<span className="text-sm font-medium text-slate-500"> / unit</span></p>
            <p className={`text-sm ${listing.quantity > 0 ? 'text-slate-600' : 'text-rose-700 font-semibold'}`}>{listing.quantity > 0 ? `${listing.quantity.toLocaleString('en-IN')} available` : 'Sold out'}</p>
          </div>
          {mine ? (
            <button type="button" className="icon-btn text-rose-700 hover:bg-rose-50" onClick={() => onDelete(listing)} aria-label={`Delete listing ${listing.productName}`}>
              <Trash2 size={18} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => onOrder(listing)} disabled={listing.quantity < 1}>
              <ShoppingCart size={16} aria-hidden="true" />Buy
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Marketplace() {
  const { user } = useAuth();
  const { addNotification, confirm } = useNotification();
  const isFarmer = user?.role === 'Farmer';
  const tabs = isFarmer
    ? [{ id: 'my-listings', label: 'My listings', icon: Package }, { id: 'orders', label: 'Orders received', icon: ShoppingBag }, { id: 'browse', label: 'Browse market', icon: Store }]
    : [{ id: 'browse', label: 'Browse market', icon: Store }, { id: 'orders', label: 'My purchases', icon: ShoppingBag }];

  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [ordering, setOrdering] = useState(null);
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Buyers previously called a farmer-only endpoint here, which made the whole page fail with 403.
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [all, mine] = await Promise.all([
        api.get('/marketplace', { silent: true }),
        isFarmer ? api.get('/marketplace/my-listings', { silent: true }) : Promise.resolve({ data: [] }),
      ]);
      setListings(all.data);
      setMyListings(mine.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isFarmer]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setForm((f) => ({ ...f, image: '' }));
      const image = await compressImage(file);
      setForm((f) => ({ ...f, image }));
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) return setFormError('Please enter what you are selling.');
    if (!(Number(form.quantity) >= 1) || !Number.isInteger(Number(form.quantity))) return setFormError('Quantity must be a whole number of at least 1.');
    if (!(Number(form.price) > 0)) return setFormError('Price must be more than ₹0.');
    setSaving(true);
    try {
      const { data } = await api.post('/marketplace', {
        productName: form.name.trim(), quantity: Number(form.quantity), pricePerUnit: Number(form.price),
        category: form.category, description: form.description.trim(), image: form.image || undefined,
      }, { silent: true });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      if (data.priceCheck?.low) addNotification(`Listed. Note: ${data.priceCheck.message}`, 'info');
      else addNotification('Your listing is live on the marketplace.', 'success');
      fetchData();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/marketplace/orders', { listingId: ordering._id, quantityOrdered: Number(qty) }, { silent: true });
      setOrdering(null);
      addNotification('Order placed. The farmer will accept it soon; you can follow it under My purchases.', 'success');
      fetchData();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (listing) => {
    if (!(await confirm({ title: 'Delete this listing?', message: `"${listing.productName}" will be removed from the marketplace.`, confirmLabel: 'Delete', danger: true }))) return;
    try {
      await api.delete(`/marketplace/${listing._id}`);
      setMyListings((l) => l.filter((x) => x._id !== listing._id));
      addNotification('Listing deleted.', 'success');
    } catch { /* toast shown */ }
  };

  const q = search.trim().toLowerCase();
  const browse = listings
    .filter((l) => !isFarmer || String(l.farmer?._id) !== String(user._id))
    .filter((l) => (category === 'ALL' || l.category === category) &&
      (!q || l.productName.toLowerCase().includes(q) || l.farmer?.name?.toLowerCase().includes(q)));
  const sellers = new Set(listings.map((l) => l.farmer?._id).filter(Boolean)).size;
  const maxQty = ordering?.quantity || 1;

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-6 sm:p-10">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-emerald-50 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="chip bg-emerald-50 border-emerald-200 text-emerald-800 w-fit">Direct from farms</p>
            <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">Marketplace</h1>
            <p className="mt-2 text-slate-600 text-base sm:text-lg">Buy and sell eggs, birds and farm supplies directly, at a fair price.</p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
            <dl className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3"><dt className="text-xs text-slate-500">Items for sale</dt><dd className="text-2xl font-extrabold text-slate-900">{listings.length}</dd></div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3"><dt className="text-xs text-slate-500">Selling farmers</dt><dd className="text-2xl font-extrabold text-emerald-800">{sellers}</dd></div>
            </dl>
            {isFarmer && <button type="button" className="btn btn-primary" onClick={() => { setFormError(''); setShowCreate(true); }}><Plus size={18} aria-hidden="true" />Sell my stock</button>}
          </div>
        </div>
      </header>

      <div role="tablist" aria-label="Marketplace sections" className="flex gap-2 overflow-x-auto no-scrollbar bg-slate-100 p-1.5 rounded-2xl w-fit max-w-full">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={activeTab === t.id} aria-controls={`panel-${t.id}`}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            <t.icon size={16} aria-hidden="true" />{t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'orders' ? <OrdersList perspective={isFarmer ? 'farmer' : 'buyer'} /> : loading ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-80" />)}</div>
        ) : error ? (
          <EmptyState icon={ShoppingBag} tone="error" title="Couldn't load the marketplace" message={error} action={<button type="button" className="btn btn-primary" onClick={fetchData}>Try again</button>} />
        ) : activeTab === 'browse' ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <label htmlFor="market-search" className="sr-only">Search products or farmers</label>
                <Search size={18} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="market-search" type="search" className="field pl-11" placeholder="Search eggs, chicks, farmer name…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Filter by category">
                {CATEGORIES.map((c) => (
                  <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}
                    className={`chip whitespace-nowrap !py-2.5 !px-4 ${category === c.id ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{c.label}</button>
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-600" aria-live="polite">{browse.length} item{browse.length === 1 ? '' : 's'} found</p>
            {browse.length === 0 ? (
              <EmptyState icon={Search} title="Nothing found" message={listings.length ? 'Try another search word or category.' : 'No products are listed yet. Check back soon.'} />
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 perspective">
                {browse.map((l) => <ListingCard key={l._id} listing={l} onOrder={(x) => { setFormError(''); setQty(1); setOrdering(x); }} />)}
              </div>
            )}
          </div>
        ) : myListings.length === 0 ? (
          <EmptyState icon={Package} title="You have no listings yet" message="List eggs, birds or supplies so buyers can order from you."
            action={<button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} aria-hidden="true" />Create your first listing</button>} />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 perspective">
            {myListings.map((l) => <ListingCard key={l._id} listing={l} mine onDelete={handleDelete} />)}
          </div>
        )}
      </div>

      {ordering && (
        <Modal titleId="order-title" onClose={() => setOrdering(null)}>
          <form onSubmit={handleOrder} className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="order-title" className="text-xl font-bold text-slate-900">Buy {ordering.productName}</h2>
                <p className="text-sm text-slate-600">from {ordering.farmer?.name || 'a local farmer'} · {formatRupee(ordering.pricePerUnit)} per unit</p>
              </div>
              <button type="button" className="icon-btn -mr-2 -mt-2" onClick={() => setOrdering(null)} aria-label="Close"><X size={18} aria-hidden="true" /></button>
            </div>
            <div>
              <label htmlFor="order-qty" className="field-label">Quantity <span className="font-normal text-slate-500">(max {maxQty.toLocaleString('en-IN')})</span></label>
              <div className="flex items-center gap-3">
                <button type="button" className="icon-btn border border-slate-200" onClick={() => setQty((v) => Math.max(1, Number(v) - 1))} aria-label="Decrease quantity"><Minus size={18} aria-hidden="true" /></button>
                <input id="order-qty" type="number" inputMode="numeric" min={1} max={maxQty} step={1} required className="field text-center text-lg font-bold"
                  value={qty} onChange={(e) => setQty(e.target.value === '' ? '' : Math.min(maxQty, Math.max(1, Math.floor(Number(e.target.value)) || 1)))} />
                <button type="button" className="icon-btn border border-slate-200" onClick={() => setQty((v) => Math.min(maxQty, Number(v) + 1))} aria-label="Increase quantity"><Plus size={18} aria-hidden="true" /></button>
              </div>
            </div>
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <span className="text-emerald-900 font-semibold">Total</span>
              <span className="text-2xl font-extrabold text-emerald-900 tabular-nums">{formatRupee((Number(qty) || 0) * ordering.pricePerUnit)}</span>
            </div>
            <p className="text-xs text-slate-600">You pay the farmer directly on delivery. The farmer confirms the order first.</p>
            {formError && <p className="field-error" role="alert">{formError}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={saving || !qty}>{saving ? 'Placing order…' : 'Place order'}</button>
          </form>
        </Modal>
      )}

      {showCreate && (
        <Modal titleId="create-title" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4" noValidate>
            <div className="flex items-start justify-between gap-4">
              <h2 id="create-title" className="text-xl font-bold text-slate-900">Sell your stock</h2>
              <button type="button" className="icon-btn -mr-2 -mt-2" onClick={() => setShowCreate(false)} aria-label="Close"><X size={18} aria-hidden="true" /></button>
            </div>
            <div>
              <label htmlFor="l-name" className="field-label">What are you selling?</label>
              <input id="l-name" className="field" required maxLength={120} placeholder="e.g. Fresh eggs (tray of 30)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="l-qty" className="field-label">Quantity</label>
                <input id="l-qty" type="number" inputMode="numeric" min={1} step={1} required className="field" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div>
                <label htmlFor="l-price" className="field-label">Price per unit (₹)</label>
                <input id="l-price" type="number" inputMode="decimal" min={0.01} step="0.01" required className="field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>
            <fieldset>
              <legend className="field-label">Category</legend>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.slice(1).map((c) => (
                  <label key={c.id} className={`chip cursor-pointer !py-2 !px-4 ${form.category === c.id ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
                    <input type="radio" name="l-cat" value={c.id} checked={form.category === c.id} onChange={() => setForm({ ...form, category: c.id })} className="sr-only" />{c.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="l-desc" className="field-label">Details <span className="font-normal text-slate-500">(optional)</span></label>
              <textarea id="l-desc" className="field min-h-20" maxLength={1000} placeholder="Breed, freshness, delivery area…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <span className="field-label">Photo <span className="font-normal text-slate-500">(optional)</span></span>
              <label className="flex items-center gap-3 p-3 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50">
                {form.image ? <img src={form.image} alt="Selected product" className="w-16 h-16 object-cover rounded-xl" /> : <span className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500" aria-hidden="true"><ImagePlus size={22} /></span>}
                <span className="text-sm text-slate-700">{form.image ? 'Change photo' : 'Add a photo of your product'}</span>
                <input type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
              </label>
            </div>
            <p className="text-xs text-slate-600 flex gap-1.5"><AlertTriangle size={14} aria-hidden="true" className="shrink-0 mt-0.5" />We compare your price with reference market rates and warn you if it looks too low.</p>
            {formError && <p className="field-error" role="alert">{formError}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={saving}>{saving ? 'Publishing…' : 'Publish listing'}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
