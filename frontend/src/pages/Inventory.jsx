import { useState, useEffect } from 'react';
import api, { errorMessage } from '../utils/axios';
import { useNotification } from '../context/NotificationContext';
import { compressImageFile } from '../utils/image';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/PageLoader';
import { 
  Package, 
  Plus, 
  Minus,
  AlertCircle, 
  Trash2, 
  Camera, 
  Loader2, 
  Sparkles,
  BarChart3,
  Search,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  Zap,
  ChevronRight,
  Activity,
  X as XIcon,
} from 'lucide-react';

export default function Inventory() {
  const { addNotification, confirm } = useNotification();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ itemName: '', category: 'Feed', quantity: '', unit: 'kg', lowStockThreshold: '', dailyConsumptionRate: '' });
  const [isScanning, setIsScanning] = useState(false);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setLoadError('');
      setItems(res.data.items);
      setAlerts(res.data.alerts);
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredItems = items.filter(item => 
    item.itemName.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemName.trim()) { addNotification('Please enter the item name.', 'error'); return; }
    if (!(Number(formData.quantity) >= 0) || formData.quantity === '') { addNotification('Please enter a quantity of 0 or more.', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity) || 0,
        lowStockThreshold: formData.lowStockThreshold === '' ? 10 : Number(formData.lowStockThreshold),
        dailyConsumptionRate: Number(formData.dailyConsumptionRate) || 0
      };

      await api.post('/inventory', payload);
      setShowModal(false);
      setFormData({ itemName: '', category: 'Feed', quantity: '', unit: 'kg', lowStockThreshold: '', dailyConsumptionRate: '' });
      fetchInventory();
      addNotification('Item added to your stock.', 'success');
    } catch {
      /* the API client shows the reason */
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    if (!(await confirm({ title: 'Remove this item?', message: 'It will be deleted from your stock list.', confirmLabel: 'Remove', danger: true }))) return;
    try {
      await api.delete(`/inventory/${id}`);
      fetchInventory();
      addNotification('Item removed.', 'success');
    } catch {
      /* toast shown by the API client */
    }
  };

  const updateQuantity = async (id, currentQuantity, change) => {
    const newQuantity = Math.max(0, currentQuantity + change);
    if (newQuantity === currentQuantity) return;
    
    setUpdatingId(id);
    try {
      await api.put(`/inventory/${id}`, { quantity: newQuantity });
      await fetchInventory();
    } catch {
      /* toast shown by the API client */
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSmartLog = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    try {
      // Shrink first: phone photos are often 4-8 MB, over the hosting upload limit.
      const formDataUpload = new FormData();
      formDataUpload.append('photo', await compressImageFile(file));
      const { data } = await api.post('/ai/process-photo', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }, silent: true, timeout: 45000
      });
      
      setFormData(prev => ({
        ...prev,
        itemName: data.itemName,
        category: data.category || 'Feed',
        quantity: data.quantity,
        unit: data.unit
      }));
      setShowModal(true);
    } catch (err) {
      addNotification(errorMessage(err, 'Could not read the photo. Please try again with a clearer picture.'), 'error');
    } finally {
      setIsScanning(false);
      e.target.value = '';
    }
  };

  if (loading) return <SkeletonList rows={3} className="h-40" />;
  if (loadError) return <EmptyState icon={Package} tone="error" title="Couldn't load your stock" message={loadError} action={<button type="button" className="btn btn-primary" onClick={fetchInventory}>Try again</button>} />;

  return (
    <div className="space-y-12 pb-20">
      
      {/* Balanced Header Layer */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-soft relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full translate-x-32 -translate-y-32 blur-3xl opacity-30"></div>
        
        <div className="space-y-4 relative z-10">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">Stock Center</span>
           </div>
           <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Farm <span className="text-emerald-600">Inventory</span>
           </h1>
           <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xl">
              Keep track of your feed, medicine, and equipment. We'll alert you when items are running low.
           </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 relative z-10 w-full lg:w-auto">
           <label className={`group cursor-pointer ${isScanning ? 'opacity-50 pointer-events-none' : ''} h-14 px-6 bg-slate-900 border border-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all hover:bg-slate-800 shadow-lg`}>
              {isScanning ? <Loader2 size={18} className="animate-spin text-emerald-400" /> : <Camera size={18} className="text-emerald-400" />}
              {isScanning ? 'Scanning...' : 'Smart Scan'}
              <input type="file" className="sr-only" accept="image/*" onChange={handleSmartLog} aria-label="Scan a bill or label photo to add stock" />
           </label>
           
           <button 
             onClick={() => setShowModal(true)}
             className="flex-1 lg:flex-none h-14 px-8 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-3"
           >
              <Plus size={18} />
              Add Item
           </button>
        </div>
      </div>


      {alerts.length > 0 && (
        <div className="relative overflow-hidden bg-rose-50 border border-slate-100 rounded-[2rem] p-8 flex flex-col md:flex-row gap-8 items-center shadow-soft">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100 shadow-sm shrink-0">
             <ShieldAlert size={32} className="animate-pulse" />
          </div>
          <div className="flex-1 space-y-1.5 text-center md:text-left">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Low Stock Alert</h3>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              {alerts.map((a, i) => (
                <div key={i} className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                   <div className="w-1 w-1 bg-rose-400 rounded-full"></div> {a}
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => navigate('/farmer/store')} className="px-6 py-3.5 bg-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-rose-700 transition-all shadow-md flex items-center gap-2">
             Restock Now <ArrowRight size={14} />
          </button>
        </div>
      )}


      {/* Item List */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-soft flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-100">
                 <Package size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Stock List</h2>
           </div>
           
           <div className="relative group w-full md:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search inventory items..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-sm text-slate-900 placeholder:text-slate-400"
              />
           </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map(item => {
            const isLow = item.quantity <= item.lowStockThreshold;
            const daysLeft = item.dailyConsumptionRate > 0 ? Math.floor(item.quantity / item.dailyConsumptionRate) : '---';

            return (
              <div key={item._id} className="group bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-strong transition-all duration-300 flex flex-col">
                 <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</span>
                       <h4 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors truncate">{item.itemName}</h4>
                    </div>
                    {isLow && (
                       <div className="bg-rose-50 text-rose-800 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-2 shrink-0">
                          <ShieldAlert size={12} strokeWidth={2.5} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Low</span>
                       </div>
                    )}
                 </div>

                 <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-6 mb-8">
                    <div className="flex justify-between items-center">
                       <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quantity Left</span>
                          <div className="flex items-baseline gap-2">
                             <span className={`text-4xl font-extrabold tracking-tight tabular-nums ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{item.quantity}</span>
                             <span className="text-xs font-bold text-slate-400 uppercase text-slate-400">{item.unit}</span>
                          </div>
                       </div>

                       <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
                          <button type="button" aria-label={`Use one ${item.unit || 'unit'} of ${item.itemName}`} 
                            disabled={updatingId === item._id || item.quantity <= 0}
                            onClick={() => updateQuantity(item._id, item.quantity, -1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all disabled:opacity-30"
                          >
                             <Minus size={14} strokeWidth={3} />
                          </button>
                          <div className="w-px h-4 bg-slate-100 mx-0.5"></div>
                          <button type="button" aria-label={`Add one ${item.unit || 'unit'} of ${item.itemName}`}
                            disabled={updatingId === item._id}
                            onClick={() => updateQuantity(item._id, item.quantity, 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all disabled:opacity-30"
                          >
                             {updatingId === item._id ? (
                               <Loader2 size={14} className="animate-spin text-emerald-600" />
                             ) : (
                               <Plus size={14} strokeWidth={3} />
                             )}
                          </button>
                       </div>
                    </div>
                    
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                       <div className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((item.quantity / (item.lowStockThreshold * 3 || 1)) * 100, 100)}%` }}></div>
                    </div>
                 </div>

                 <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                       <Calendar size={12} className="text-emerald-500" /> {daysLeft} Days Left
                    </div>
                    <div className="flex items-center gap-3">
                       <button type="button" aria-label={`Remove ${item.itemName}`} 
                         onClick={() => deleteItem(item._id)} 
                         className="w-10 h-10 bg-slate-50 text-slate-300 rounded-lg flex items-center justify-center hover:text-rose-600 hover:bg-rose-50 transition-all"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>
                 </div>
              </div>
            );
          })}

          
          {filteredItems.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <Package size={48} className="mx-auto text-slate-200" />
              <p className="text-slate-400 font-black text-xs uppercase tracking-wider">No items found. Add something new!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add New Item Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[3rem] p-10 md:p-12 w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-600" />
            
            <div className="flex justify-between items-start mb-10">
               <div className="space-y-1">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                     Add to <span className="text-emerald-600">Stock.</span> <Sparkles size={24} className="text-emerald-400" />
                  </h2>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-wider">Adding a new item to your farm stock</p>
               </div>
               <button aria-label="Close" onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                  <XIcon size={20} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="invent-1" className="block text-sm font-black uppercase text-slate-500 tracking-wider px-2">Item Name</label>
                <div className="relative">
                   <Package className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   <input id="invent-1" required type="text" className="w-full bg-slate-50 border border-slate-100 pl-14 pr-6 py-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none focus:border-emerald-500 font-bold text-xs uppercase tracking-wider text-slate-900 transition-all" placeholder="e.g. Broiler Feed Bag" value={formData.itemName} onChange={e=>setFormData({...formData, itemName: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label htmlFor="invent-2" className="block text-sm font-black uppercase text-slate-500 tracking-wider px-2">Category</label>
                  <select id="invent-2" value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none focus:border-emerald-500 font-bold text-xs uppercase tracking-wider text-slate-900 transition-all appearance-none cursor-pointer">
                    <option value="Feed">Feed</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label htmlFor="invent-3" className="block text-sm font-black uppercase text-slate-500 tracking-wider px-2">Unit (kg/bags/L)</label>
                  <input id="invent-3" required type="text" className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none focus:border-emerald-500 font-bold text-xs uppercase tracking-wider text-slate-900 transition-all" placeholder="kg / Bags / L" value={formData.unit} onChange={e=>setFormData({...formData, unit: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label htmlFor="invent-4" className="block text-sm font-black uppercase text-slate-500 tracking-wider px-2">Total Quantity</label>
                  <div className="relative">
                    <Layers className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input id="invent-4" required type="number" className="w-full bg-slate-50 border border-slate-100 pl-14 pr-6 py-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none focus:border-emerald-500 font-bold text-xs text-slate-900 transition-all" value={formData.quantity} onChange={e=>setFormData({...formData, quantity: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-3">
                   <label htmlFor="invent-5" className="block text-sm font-black uppercase text-slate-500 tracking-wider px-2">Alert Me When Low (Count)</label>
                   <div className="relative">
                     <ShieldAlert className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                     <input id="invent-5" type="number" min={0} placeholder="10" className="w-full bg-slate-50 border border-slate-100 pl-14 pr-6 py-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none focus:border-emerald-500 font-bold text-xs text-slate-900 transition-all" value={formData.lowStockThreshold} onChange={e=>setFormData({...formData, lowStockThreshold: e.target.value})} />
                   </div>
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="invent-6" className="block text-sm font-black uppercase text-slate-500 tracking-wider px-2">Used Daily (Amount)</label>
                <div className="relative">
                  <Activity className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input id="invent-6" type="number" min={0} step="0.1" placeholder="Optional" className="w-full bg-slate-50 border border-slate-100 pl-14 pr-6 py-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none focus:border-emerald-500 font-bold text-xs text-slate-900 transition-all" value={formData.dailyConsumptionRate} onChange={e=>setFormData({...formData, dailyConsumptionRate: e.target.value})} />
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" disabled={saving} className="w-full h-18 disabled:opacity-60 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-wider text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
                   {saving ? 'Saving…' : 'Save to Stock'} <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
