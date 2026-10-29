import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Minus,
  Tag,
  Truck,
  Store as StoreIcon,
  Search,
  ChevronLeft,
  ArrowRight,
  Zap,
  ShieldCheck,
  Star,
  Package,
  Activity,
  X
} from 'lucide-react';
import api from '../utils/axios';
import { useNotification } from '../context/NotificationContext';

const handleImageError = (e) => {
  e.target.src = "/assets/images/default.webp";
  e.target.onerror = null;
};

const STORES = [
  {
    id: 1,
    name: 'National Agro Supplies',
    description: 'High quality feed and basic farm tools.',
    image: '/assets/images/national_agro_supplies_ultra.webp',
    products: [
      { id: 101, name: 'Premium Layer Mash (50kg)', category: 'Feed', price: 1500, description: 'High protein formula for maximum egg production.', image: '/assets/images/Layer-mesh.webp' },
      { id: 102, name: 'Broiler Starter Crumbles', category: 'Feed', price: 1800, description: 'Optimal nutrition for rapid early growth.', image: '/assets/images/Starter.webp' },
      { id: 103, name: 'Wood Shavings Bale (20kg)', category: 'Supplies', price: 150, description: 'Clean bedding material for optimal coop hygiene.', image: '/assets/images/woodshavings.webp' }
    ]
  },
  {
    id: 2,
    name: 'PoultryMed Pharma',
    description: 'Medicine and health boosters for birds.',
    image: '/assets/images/poultrymed_pharma_ultra.webp',
    products: [
      { id: 201, name: 'Amoxicillin Powder 500g', category: 'Medicine', price: 600, description: 'Broad-spectrum antibiotic for poultry health.', image: '/assets/images/Amox.webp' },
      { id: 202, name: 'Liquid Multivitamins 1L', category: 'Medicine', price: 450, description: 'Essential vitamins to boost flock immunity.', image: '/assets/images/Liquid.webp' },
      { id: 203, name: 'Disinfectant Spray 5L', category: 'Supplies', price: 850, description: 'Heavy-duty biosecurity spray for farm sanitization.', image: '/assets/images/Disinfectant.webp' }
    ]
  },
  {
    id: 3,
    name: 'Sunrise Hatcheries',
    description: 'Quality chicks and strong farm equipment.',
    image: '/assets/images/sunrise_hatcheries_ultra.webp',
    products: [
      { id: 301, name: 'White Leghorn Chicks (x100)', category: 'Chicks', price: 3500, description: 'Day-old superior layer chicks for high yield.', image: '/assets/images/whiteleghorn.webp' },
      { id: 302, name: 'Cobb 500 Broilers (x100)', category: 'Chicks', price: 3200, description: 'Fast-growing meat birds for efficient production.', image: '/assets/images/whiteleghorn.webp' },
      { id: 303, name: 'Automatic Bell Drinker', category: 'Equipment', price: 250, description: 'Gravity-fed watering system for constant hydration.', image: '/assets/images/equipment_drinker.webp' },
      { id: 304, name: 'Infrared Brooder Lamp', category: 'Equipment', price: 450, description: '250W high-efficiency heating lamp for brooding.', image: '/assets/images/infrarred.webp' }
    ]
  }
];

export default function FarmStore() {
  const { addNotification } = useNotification();
  const [cart, setCart] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [fetchedStores, setFetchedStores] = useState([]);
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await api.get('/stores', { silent: true });
        setFetchedStores(res.data);
      } catch (err) {
        console.error('Failed to fetch stores', err);
      }
    };
    fetchStores();
  }, []);

  const allStores = useMemo(() => {
    // Map fetched stores to match the structure
    const mappedFetched = fetchedStores.map(s => ({
      id: s._id,
      name: s.name,
      description: s.description,
      image: s.image,
      products: s.products.map(p => ({
        id: p._id,
        name: p.name,
        price: p.price,
        description: p.description,
        category: p.category,
        image: p.image
      }))
    }));
    return [...STORES, ...mappedFetched];
  }, [fetchedStores]);

  const filteredStores = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return allStores.filter(store =>
      store.name.toLowerCase().includes(lowerSearch) ||
      (store.description || '').toLowerCase().includes(lowerSearch)
    );
  }, [search, allStores]);

  const displayedProducts = useMemo(() => {
    if (!selectedStore) return [];
    const lowerSearch = search.toLowerCase();
    return selectedStore.products.filter(p =>
      p.name.toLowerCase().includes(lowerSearch)
    );
  }, [selectedStore, search]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const orderData = {
        storeName: selectedStore.name,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.qty,
          price: item.price,
          category: item.category,
          image: item.image || "/assets/images/default.webp"
        })),
        totalAmount: cartTotal
      };

      setPlacing(true);
      await api.post('/supplies/order', orderData);

      addNotification(`Order placed (₹${cartTotal.toLocaleString('en-IN')}). You can track it under Track Deliveries.`, 'success');
      setCart([]);
      setShowCart(false);
      navigate('/farmer/supplies');
    } catch {
      /* the API client shows the reason */
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-14rem)] flex flex-col pb-20">

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-16">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-slate-700">Farm Store</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-slate-950 tracking-tight uppercase leading-none">
            {selectedStore ? selectedStore.name : 'Buy'} <span className="text-emerald-600">Supplies.</span>
          </h1>
          <p className="text-slate-400 font-medium text-lg leading-relaxed">
            {selectedStore ? `Browsing items from ${selectedStore.name}.` : 'Choose a shop to buy feed, medicine, and equipment.'}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder={selectedStore ? "Search for an item..." : "Search for a shop..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full lg:w-96 pl-14 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-xs uppercase tracking-wider text-slate-900 placeholder:text-slate-300 shadow-xl shadow-slate-100/50"
            />
          </div>

          <button
            type="button"
            aria-label={`Open cart, ${cartItemCount} item${cartItemCount === 1 ? '' : 's'}`}
            onClick={() => setShowCart(true)}
            className="relative w-16 h-16 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center hover:bg-emerald-700 hover:-translate-y-1 transition-all duration-500 shadow-2xl shadow-emerald-100 group"
          >
            <ShoppingCart size={24} className="transition-transform group-hover:rotate-12" />
            {cartItemCount > 0 && (
              <span className="absolute -top-3 -right-3 bg-rose-500 text-white text-sm font-black w-8 h-8 flex items-center justify-center rounded-full border-4 border-white shadow-xl animate-in zoom-in-50">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {selectedStore && (
        <button
          onClick={() => { setSelectedStore(null); setSearch(''); }}
          className="w-fit mb-10 flex items-center gap-3 px-6 py-4 bg-white border border-slate-100 rounded-2xl font-black text-sm uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 shadow-sm"
        >
          <ChevronLeft size={16} /> Back to Shops
        </button>
      )}

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {!selectedStore ? (
          filteredStores.map(store => (
            <div
              key={store.id}
              onClick={() => { setSelectedStore(store); setSearch(''); }}
              className="relative bg-white rounded-[2.5rem] overflow-hidden border border-slate-50 shadow-soft cursor-pointer flex flex-col"
            >
              <div className="h-64 overflow-hidden relative">
                <img
                  src={store.image || "/assets/images/default.webp"}
                  alt={store.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 transition-opacity" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center text-white">
                      <StoreIcon size={20} />
                    </div>
                    <span className="text-sm font-bold text-white uppercase tracking-[0.2em]">Trusted Shop</span>
                  </div>
                </div>
              </div>
              <div className="p-10 flex-grow flex flex-col">
                <h3 className="font-black text-2xl text-slate-950 uppercase tracking-tight leading-none">{store.name}</h3>
                <p className="text-slate-400 font-medium text-sm mt-4 leading-relaxed line-clamp-2">{store.description}</p>

                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-slate-300" />
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-500">{store.products.length} Products</span>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm transition-transform group-hover:scale-110">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          displayedProducts.map(item => (
            <div key={item.id} className="bg-white rounded-[2rem] p-6 border border-slate-50 shadow-soft flex flex-col relative overflow-hidden">
              <div className="absolute top-6 left-6 z-10">
                <div className="px-4 py-2 bg-white/80 backdrop-blur-xl border border-white rounded-2xl shadow-xl">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900">{item.category}</span>
                </div>
              </div>

              <div className="h-56 overflow-hidden rounded-[2.5rem] mb-8 relative">
                <img
                  src={item.image || "/assets/images/default.webp"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </div>

              <div className="flex-1 flex flex-col space-y-4">
                <h3 className="font-black text-slate-950 text-xl leading-none uppercase tracking-tight">{item.name}</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.description}</p>

                <div className="pt-6 mt-auto flex items-end justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Price per item</span>
                    <div className="flex items-center gap-1">
                      <span className="text-3xl font-black text-slate-950 tracking-tight">₹{item.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <button aria-label="Add"
                    onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                    className="w-16 h-16 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-100 flex items-center justify-center"
                  >
                    <Plus size={28} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Glassmorphism Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in" onClick={() => setShowCart(false)}></div>
          <div className="relative w-full max-w-xl bg-white h-full shadow-[0_0_100px_rgba(0,0,0,0.2)] flex flex-col animate-in slide-in-from-right duration-700">

            {/* Cart Header */}
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-100">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight leading-none">My Shopping <span className="text-emerald-600">Bag.</span></h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-2">{cartItemCount} Items added</p>
                </div>
              </div>
              <button aria-label="Close"
                onClick={() => setShowCart(false)}
                className="w-12 h-12 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-950 hover:bg-slate-50 transition-all font-black text-xs"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Body */}
            <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-hide">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-100">
                    <ShoppingCart size={64} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-950 uppercase tracking-tight">Bag is Empty</h4>
                    <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto mt-2">You haven't added anything to your bag yet.</p>
                  </div>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="group flex items-center gap-6 p-6 rounded-[2.5rem] border border-slate-50 bg-white hover:border-emerald-100 hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500">
                    <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden shrink-0 border border-slate-100 shadow-sm relative">
                      <img src={item.image || "/assets/images/default.webp"} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={handleImageError} />
                      <div className="absolute inset-0 bg-emerald-500/5"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-1 block">Selected Item</span>
                      <h4 className="font-black text-sm text-slate-950 uppercase tracking-tight truncate leading-none mb-2">{item.name}</h4>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-black text-slate-950 tracking-tight leading-none">₹{(item.price * item.qty).toLocaleString()}</span>
                        <div className="h-3 w-[1px] bg-slate-100"></div>
                        <span className="text-sm font-bold text-slate-400">₹{item.price.toLocaleString()} / UNIT</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-1.5 border border-slate-100">
                      <button aria-label="Decrease" onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 border border-white bg-white shadow-sm flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 transition-all"><Minus size={16} /></button>
                      <span className="font-black text-sm w-6 text-center text-slate-950 tracking-tight">{item.qty}</span>
                      <button aria-label="Add" onClick={() => updateQuantity(item.id, 1)} className="w-10 h-10 border border-white bg-white shadow-sm flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-500 transition-all"><Plus size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-10 border-t border-slate-50 bg-white">
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Total Price</span>
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-black text-slate-950 tracking-tight leading-none">₹{cartTotal.toLocaleString()}</span>
                      <span className="text-sm font-bold text-emerald-500 uppercase">INR</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <p className="text-sm font-bold text-emerald-800 uppercase tracking-wider leading-tight">Order safely. Trusted items directly from shops.</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={placing}
                  onClick={handleCheckout}
                  className="group relative w-full h-20 disabled:opacity-60 bg-emerald-600 text-white rounded-[1.5rem] overflow-hidden transition-all duration-500 hover:bg-emerald-700 hover:-translate-y-1 shadow-3xl shadow-emerald-100 flex items-center justify-center"
                >
                  <div className="absolute inset-0 bg-emerald-400 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <div className="relative z-10 flex items-center justify-center gap-4">
                    <span className="text-xs font-black uppercase tracking-wider">Place Order</span>
                    <ArrowRight size={20} className="group-hover:translate-x-3 transition-transform duration-500" />
                  </div>
                </button>
                <p className="text-center mt-6 text-xs font-bold text-slate-300 uppercase tracking-wider">Payment on delivery or pickup</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
