import { useState, useEffect } from 'react';
import api, { errorMessage } from '../utils/axios';
import { useNotification } from '../context/NotificationContext';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/PageLoader';
import { Truck, Package, Clock, CheckCircle2, ShoppingBag, Calendar, MapPin, Search, Filter, ArrowRight, Info, Plus } from 'lucide-react';
import { formatRupee, getConsistentImage } from '../utils/imageConstants';

export default function SupplyTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadError, setLoadError] = useState('');
  const [receivingId, setReceivingId] = useState(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/supplies/my-orders', { silent: true });
        setOrders(Array.isArray(res.data) ? res.data : []);
        setLoadError('');
      } catch (err) {
        setLoadError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleReceive = async (orderId) => {
    setReceivingId(orderId);
    try {
      const res = await api.put(`/supplies/${orderId}/receive`);
      setOrders(prev => prev.map(o => o._id === orderId ? res.data : o));
      addNotification('Marked as received. The items were added to your stock.', 'success');
    } catch {
      /* the API client shows the reason */
    } finally {
      setReceivingId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered': return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'Shipped': return <Truck className="text-blue-500" size={20} />;
      case 'Processing': return <Clock className="text-amber-500" size={20} />;
      default: return <Package className="text-slate-400" size={20} />;
    }
  };

  const dashboardStats = {
    total: orders.length,
    inTransit: orders.filter(o => o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    spend: orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0)
  };

  if (loading) return <SkeletonList rows={3} className="h-40" />;
  if (loadError) return <EmptyState icon={Truck} tone="error" title="Couldn't load your deliveries" message={loadError} action={<button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>} />;

  return (
    <div className="space-y-10">
      {/* Premium Header Container */}
      <div className="relative overflow-hidden bg-white border border-slate-100 rounded-[2.5rem] p-10 lg:p-12 text-slate-900 shadow-soft">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-500/5 to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-bold uppercase tracking-[0.1em] text-emerald-600">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               Track Your Orders
            </div>
            <h1 className="text-5xl font-black tracking-tight leading-[0.9]">My <span className="text-emerald-600">Deliveries</span></h1>
            <p className="text-slate-400 text-lg max-w-md font-medium leading-relaxed">
              Check where your feed, medicine, and other farm items are right now.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Money Spent</p>
              <h3 className="text-2xl font-black text-slate-900">{formatRupee(dashboardStats.spend)}</h3>
            </div>
            <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Orders on the Way</p>
              <h3 className="text-2xl font-black text-emerald-600">{dashboardStats.inTransit}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by Order ID or Shop..."
            className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-3xl outline-none focus:border-emerald-500/30 transition-all font-medium text-slate-700 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-8 py-5 bg-emerald-600 text-white rounded-3xl font-bold uppercase tracking-wider text-xs flex items-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100">
          <Filter size={18} /> Filter List
        </button>
      </div>

      {/* Main Logistics View */}
      {orders.length === 0 ? (
        <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] py-24 text-center">
           <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl relative">
              <Package size={40} className="text-slate-200" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white">
                <Plus size={16} className="text-white" />
              </div>
           </div>
           <h3 className="text-2xl font-black text-slate-900">No shipments found</h3>
           <p className="text-slate-500 font-medium mt-2">When you purchase from the farm store, your orders will appear here.</p>
           <button 
             onClick={() => window.location.href='/farmer/store'}
             className="mt-8 bg-emerald-600 text-white font-black uppercase tracking-wider text-xs px-10 py-5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-200"
           >
             Go to Supply Store
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {orders.filter(order => 
            order.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            order._id.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((order) => (
            <div key={order._id} className="group bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500 hover:-translate-y-1">
               <div className="p-10 flex flex-col xl:flex-row gap-12">
                  {/* Info Panel */}
                  <div className="xl:w-1/3 space-y-8 pr-12 xl:border-r border-slate-100">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center shadow-sm text-emerald-600 border border-emerald-100 group-hover:rotate-12 transition-transform">
                           <ShoppingBag size={28} />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black text-slate-900 leading-tight">{order.storeName}</h2>
                           <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">Order #{order._id.slice(-6).toUpperCase()}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                           <p className="text-sm font-black text-slate-400 uppercase tracking-wider mb-1">Date</p>
                           <p className="font-bold text-slate-700">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                           <p className="text-sm font-black text-slate-400 uppercase tracking-wider mb-1">Status</p>
                           <div className="flex items-center gap-1.5 font-bold text-slate-700">
                              {getStatusIcon(order.status)}
                              {order.status}
                           </div>
                        </div>
                     </div>

                     <div className="bg-emerald-600 p-8 rounded-[2rem] text-white shadow-xl shadow-emerald-100">
                        <p className="text-sm font-bold uppercase tracking-wider text-emerald-50 mb-2">Total Amount Paid</p>
                        <h4 className="text-3xl font-black">{formatRupee(order.totalAmount)}</h4>
                     </div>
                  </div>

                  {/* Shipment Tracking Visualization */}
                  <div className="xl:w-2/3 flex flex-col justify-between pt-4">
                     <div className="space-y-4">
                        <div className="flex justify-between items-end mb-6">
                           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delivery Status</h3>
                           <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Safe Delivery</span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="relative mb-12">
                           <div className="h-4 bg-slate-100 rounded-full w-full overflow-hidden">
                              <div 
                                 className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                                 style={{ width: order.status === 'Delivered' ? '100%' : order.status === 'Shipped' ? '66%' : order.status === 'Processing' ? '33%' : '10%' }}
                              ></div>
                           </div>
                           <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2">
                              {['Ordered', 'Processing', 'Shipped', 'Delivered'].map((s, idx) => (
                                 <div key={idx} className={`w-8 h-8 rounded-full border-4 border-white shadow-md flex items-center justify-center transition-colors ${['Ordered', 'Processing', 'Shipped', 'Delivered'].indexOf(order.status) >= idx ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}>
                                    {['Ordered', 'Processing', 'Shipped', 'Delivered'].indexOf(order.status) >= idx ? <CheckCircle2 size={12} /> : <span></span>}
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Recent Items Preview */}
                        <div className="flex flex-wrap gap-4 pt-4">
                           {order.items.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex-1 min-w-[200px] bg-white border border-slate-100 p-4 rounded-3xl flex items-center gap-4 hover:border-emerald-200 transition-colors">
                                 <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden shrink-0">
                                    <img src={getConsistentImage(item.name)} alt="" className="w-full h-full object-cover" />
                                 </div>
                                 <div>
                                    <h5 className="font-extrabold text-slate-900 text-sm leading-tight mb-0.5">{item.name}</h5>
                                    <p className="text-xs text-slate-400 font-bold tracking-tight">Qty: {item.quantity}</p>
                                 </div>
                              </div>
                           ))}
                           {order.items.length > 3 && (
                             <div className="flex items-center justify-center w-14 h-14 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 font-black text-xs">
                                +{order.items.length - 3}
                             </div>
                           )}
                        </div>
                     </div>

                     <div className="mt-12 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex items-center gap-4 text-slate-500 font-medium px-4">
                           <MapPin className="text-emerald-500" size={20} />
                           <div>
                              <p className="text-sm font-bold uppercase text-slate-400 tracking-wider">Delivery Destination</p>
                              <p className="text-sm">Verified Farm Registered Address</p>
                           </div>
                        </div>
                        <div className="flex gap-4">
                           {order.status !== 'Delivered' ? (
                              <button 
                                type="button"
                                disabled={receivingId === order._id}
                                onClick={() => handleReceive(order._id)}
                                className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-wider text-sm flex items-center gap-3 hover:translate-x-1 transition-all shadow-xl shadow-emerald-100 active:scale-95"
                              >
                                I Have Received This <ArrowRight size={14} />
                              </button>
                           ) : (
                              <div className="px-10 py-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl font-bold uppercase tracking-wider text-sm flex items-center gap-3">
                                 Received & Added to Stock
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Notice */}
      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 flex gap-6 items-start">
         <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 shrink-0">
            <Info size={24} />
         </div>
         <div>
            <h4 className="font-bold text-amber-900 uppercase tracking-wider text-xs mb-1">Adding to your stock</h4>
            <p className="text-amber-800 text-sm font-medium leading-relaxed">
               Clicking "I Have Received This" will add these items to your farm stock automatically. Please check the items before clicking.
            </p>
         </div>
      </div>
    </div>
  );
}
