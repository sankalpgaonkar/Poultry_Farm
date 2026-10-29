import { useState, useEffect, useRef } from 'react';
import api, { errorMessage } from '../utils/axios';
import { compressImage } from '../utils/image';
import { useNotification } from '../context/NotificationContext';
import { 
  Store, 
  MapPin, 
  Image as ImageIcon, 
  Save, 
  Plus, 
  Trash2, 
  Package, 
  Tag, 
  AlignLeft,
  X
} from 'lucide-react';

export default function FarmerStoreManager() {
  const { addNotification } = useNotification();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Store form state
  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [storeImage, setStoreImage] = useState('');
  
  // Product form state
  const [showProductModal, setShowProductModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodImage, setProdImage] = useState('');

  const storeFileInputRef = useRef(null);
  const prodFileInputRef = useRef(null);

  const fetchMyStore = async () => {
    try {
      setLoading(true);
      // 404 simply means the farmer has not created a store yet, so no error toast.
      const res = await api.get('/stores/my-store', { silent: true });
      if (!res.data) return; // no store yet
      setStore(res.data);
      setStoreName(res.data.name || '');
      setStoreDesc(res.data.description || '');
      setStoreLocation(res.data.location || '');
      setStoreImage(res.data.image || '');
    } catch (err) {
      if (err.response?.status !== 404) addNotification(errorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on open
  }, []);

  // Photos are shrunk in the browser first (was: raw base64, which failed above ~75 KB).
  const handleImageUpload = async (e, setImageFn) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setImageFn(await compressImage(file));
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (storeName.trim().length < 2) { addNotification('Please enter a store name (at least 2 letters).', 'error'); return; }
    
    try {
      setSavingStore(true);
      const res = await api.post('/stores', {
        name: storeName,
        description: storeDesc,
        location: storeLocation,
        image: storeImage
      });
      setStore(res.data);
      addNotification('Store profile saved.', 'success');
    } catch {
      /* the API client shows the reason */
    } finally {
      setSavingStore(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!prodName.trim() || !(Number(prodPrice) >= 0) || prodPrice === '') { addNotification('Please enter a product name and price.', 'error'); return; }

    try {
      setAddingProduct(true);
      await api.post('/stores/products', {
        name: prodName,
        price: Number(prodPrice),
        description: prodDesc,
        category: prodCat,
        image: prodImage
      });
      setShowProductModal(false);
      setProdName(''); setProdPrice(''); setProdDesc(''); setProdCat(''); setProdImage('');
      fetchMyStore();
      addNotification('Product added.', 'success');
    } catch {
      /* the API client shows the reason */
    } finally {
      setAddingProduct(false);
    }
  };

  const handleDeleteClick = (productId) => {
    if (confirmDeleteId === productId) {
      // Second tap: actually delete
      performDelete(productId);
    } else {
      // First tap: mark for confirmation
      setConfirmDeleteId(productId);
      // Auto-reset after 3 seconds if user doesn't confirm
      setTimeout(() => setConfirmDeleteId(prev => prev === productId ? null : prev), 3000);
    }
  };

  const performDelete = async (productId) => {
    if (!productId || deletingId) return;
    
    setDeletingId(productId);
    setConfirmDeleteId(null);
    
    // Save previous state for rollback
    const previousProducts = [...store.products];
    
    // Optimistic UI removal
    setStore(prev => ({
      ...prev,
      products: prev.products.filter(p => (p._id || p.id) !== productId)
    }));

    try {
      const res = await api.delete(`/stores/products/${productId}`);
      // Use the server's authoritative product list
      if (res.data && res.data.products) {
        setStore(prev => ({ ...prev, products: res.data.products }));
      }
    } catch (err) {
      console.error('Delete failed:', err.response?.data || err.message);
      // Rollback on failure
      setStore(prev => ({ ...prev, products: previousProducts }));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-pulse">
        <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] mb-6"></div>
        <div className="h-4 w-64 bg-slate-100 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
        <div className="space-y-4 max-w-2xl">
           <div className="inline-flex items-center gap-3 px-5 py-3 bg-slate-100 rounded-full border border-slate-200">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">Your Store</span>
           </div>
           <h1 className="text-6xl lg:text-8xl font-black text-slate-900 tracking-tight uppercase leading-tight">
              My <span className="text-emerald-600">Store.</span>
           </h1>
           <p className="text-slate-400 font-medium text-xl leading-relaxed">
             Establish your commercial presence. Set up your storefront and catalog products for the global Farm Store.
           </p>
        </div>
      </div>

      {/* Store Profile Section */}
      <section className="bg-white border border-slate-50 shadow-soft rounded-[3rem] p-10 lg:p-14">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
            <Store size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Store Profile</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Public identity on the Farm Store</p>
          </div>
        </div>

        <form onSubmit={handleSaveStore} className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Image Upload Area */}
            <div className="col-span-1">
              <div 
                className="w-full aspect-square bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors relative overflow-hidden group"
                onClick={() => storeFileInputRef.current.click()}
              >
                {storeImage ? (
                  <>
                    <img src={storeImage} alt="Store Logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="text-white" size={32} />
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="text-slate-300 mb-4" size={48} />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Upload Logo</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={storeFileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, setStoreImage)}
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="col-span-1 lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <label htmlFor="farmer-1" className="block text-xs font-black uppercase text-slate-500 tracking-[0.2em] px-2">Store Name</label>
                <div className="relative">
                   <Store className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                   <input id="farmer-1" required type="text" className="w-full bg-slate-50 border border-slate-100 pl-16 pr-8 py-5 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none focus:border-emerald-500 font-bold text-sm text-slate-900 transition-all" placeholder="e.g. Sunny Farms Co." value={storeName} onChange={e => setStoreName(e.target.value)} />
                </div>
              </div>
              
              <div className="space-y-4">
                <label htmlFor="farmer-2" className="block text-xs font-black uppercase text-slate-500 tracking-[0.2em] px-2">Location</label>
                <div className="relative">
                   <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                   <input id="farmer-2" type="text" className="w-full bg-slate-50 border border-slate-100 pl-16 pr-8 py-5 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none focus:border-emerald-500 font-bold text-sm text-slate-900 transition-all" placeholder="e.g. Pune, Maharashtra" value={storeLocation} onChange={e => setStoreLocation(e.target.value)} />
                </div>
              </div>

              <div className="space-y-4">
                <label htmlFor="farmer-3" className="block text-xs font-black uppercase text-slate-500 tracking-[0.2em] px-2">Description</label>
                <textarea id="farmer-3" rows="3" className="w-full bg-slate-50 border border-slate-100 p-6 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none focus:border-emerald-500 font-bold text-sm text-slate-900 transition-all" placeholder="Describe what your store sells..." value={storeDesc} onChange={e => setStoreDesc(e.target.value)} />
              </div>

              <div className="pt-4 text-right">
                <button type="submit" disabled={savingStore} className="px-10 py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-wider text-sm shadow-xl shadow-slate-200 hover:bg-emerald-600 transition-all duration-300 flex items-center justify-center gap-3 ml-auto disabled:opacity-50">
                   {savingStore ? 'Saving...' : <><Save size={18} /> Save Profile</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* Product Catalog Section */}
      {store && (
        <section className="space-y-10">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                   <Package size={32} />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Product Catalog</h2>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{store.products.length} Items Listed</p>
                </div>
             </div>
             <button 
               onClick={() => setShowProductModal(true)}
               className="h-16 px-8 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-emerald-600 hover:-translate-y-1 transition-all duration-300 shadow-xl flex items-center gap-3"
             >
               <Plus size={20} /> Add Product
             </button>
          </div>

          {store.products.length === 0 ? (
            <div className="bg-slate-50/50 rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
              <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">No products added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {store.products.map(p => (
                <div key={p._id} className="bg-white border border-slate-50 rounded-[2.5rem] overflow-hidden shadow-soft flex flex-col group relative">
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-900 shadow-sm">{p.category || 'Item'}</span>
                  </div>
                  <div className="h-48 overflow-hidden bg-slate-100 relative">
                    <img src={p.image || "/assets/images/default.webp"} alt={p.name} className="w-full h-full object-cover" />
                    <button aria-label="Close" 
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(p._id || p.id); }}
                      className={`absolute top-4 right-4 w-10 h-10 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 z-20 ${
                        confirmDeleteId === (p._id || p.id)
                          ? 'bg-rose-500 text-white scale-110 animate-pulse'
                          : 'bg-white/90 text-rose-500 hover:bg-rose-500 hover:text-white'
                      }`}
                      title={confirmDeleteId === (p._id || p.id) ? 'Tap again to confirm delete' : 'Delete product'}
                    >
                      {confirmDeleteId === (p._id || p.id) ? <X size={16} /> : <Trash2 size={16} />}
                    </button>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="font-black text-lg text-slate-900 leading-tight mb-2 uppercase tracking-tight line-clamp-1">{p.name}</h3>
                    <p className="text-xs font-bold text-slate-400 mb-6 line-clamp-2">{p.description}</p>
                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Price</span>
                      <span className="text-2xl font-black text-emerald-600 tracking-tight">₹{p.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowProductModal(false)} />
          <div className="relative bg-white rounded-[3rem] p-10 w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">New Product</h2>
               <button aria-label="Close" onClick={() => setShowProductModal(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                  <X size={20} />
               </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-6">
              {/* Product Image */}
              <div 
                className="w-full h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-300 transition-colors relative overflow-hidden"
                onClick={() => prodFileInputRef.current.click()}
              >
                {prodImage ? (
                  <img src={prodImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="text-slate-300 mb-2" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Click to upload product image</span>
                  </>
                )}
                <input type="file" ref={prodFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setProdImage)} />
              </div>

              <div className="space-y-2">
                <label htmlFor="farmer-4" className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Product Name</label>
                <div className="relative">
                   <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                   <input id="farmer-4" required type="text" className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none focus:border-emerald-500 font-bold text-sm text-slate-900" value={prodName} onChange={e => setProdName(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="farmer-5" className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Price (₹)</label>
                  <input id="farmer-5" required type="number" className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none focus:border-emerald-500 font-bold text-sm text-slate-900" value={prodPrice} onChange={e => setProdPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="farmer-6" className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Category</label>
                  <input id="farmer-6" type="text" className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none focus:border-emerald-500 font-bold text-sm text-slate-900" placeholder="e.g. Feed" value={prodCat} onChange={e => setProdCat(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="farmer-7" className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Description</label>
                <textarea id="farmer-7" rows="2" className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none focus:border-emerald-500 font-bold text-sm text-slate-900" value={prodDesc} onChange={e => setProdDesc(e.target.value)} />
              </div>

              <button type="submit" disabled={addingProduct} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-wider text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 mt-4">
                {addingProduct ? 'Adding...' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
