import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { 
  Plus, 
  CheckCircle2, 
  MapPin, 
  Bird, 
  Activity, 
  Thermometer, 
  Database,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  X,
  Cpu,
  Layers,
  Globe,
  Waves
} from 'lucide-react';

export default function FarmManagement() {
  const [farms, setFarms] = useState([]);
  const [showFarmModal, setShowFarmModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [chickens, setChickens] = useState('');

  const [eggs, setEggs] = useState('');
  const [temperature, setTemperature] = useState('');
  const [feed, setFeed] = useState('');
  const [currentChickens, setCurrentChickens] = useState('');

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/farms');
      setFarms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleCreateFarm = async (e) => {
    e.preventDefault();
    try {
      await api.post('/farms', { name: farmName, location, totalChickens: Number(chickens) });
      setShowFarmModal(false);
      setFarmName(''); setLocation(''); setChickens('');
      fetchFarms();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    try {
      await api.post('/logs', {
        farmId: selectedFarm,
        totalEggs: Number(eggs),
        temperature: Number(temperature),
        feedConsumed: Number(feed),
        currentChickenCount: Number(currentChickens)
      });
      setShowLogModal(false);
      setEggs(''); setTemperature(''); setFeed(''); setCurrentChickens('');
      fetchFarms(); 
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 animate-pulse italic text-slate-300 font-bold uppercase tracking-wider">
        Loading your farms...
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      
      {/* Optimized Header Layer */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-soft relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>
        
        <div className="space-y-4 relative z-10">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">Overview</span>
           </div>
           <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              My Poultry <span className="text-emerald-600">Farms</span>
           </h1>
           <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xl">
             Manage your farms and update daily records. Keep track of chickens, feed, and eggs with ease.
           </p>
        </div>
        
        <button 
          onClick={() => setShowFarmModal(true)}
          className="h-16 px-8 bg-emerald-600 text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-emerald-700 hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-emerald-100 flex items-center justify-center gap-3 group relative z-10"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          Add New Farm
        </button>
      </div>


      {farms.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-24 text-center border border-slate-100 shadow-soft flex flex-col items-center gap-8 relative overflow-hidden">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 shadow-inner">
             <Database size={32} />
          </div>
          <div className="space-y-2 relative z-10">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">No farms added yet</h3>
            <p className="text-slate-500 font-medium text-sm max-w-xs mx-auto">Start by adding your first poultry farm using the button below.</p>
          </div>
          <button onClick={() => setShowFarmModal(true)} className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100">Add First Farm</button>
        </div>

      ) : (
        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <div key={farm._id} className="group relative bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-strong transition-all duration-300 overflow-hidden flex flex-col">
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="space-y-1.5">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight truncate">{farm.name}</h3>
                   <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                      <MapPin size={12} className="text-slate-400" /> {farm.location}
                   </div>
                </div>
                <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600">
                   <ShieldCheck size={12} className="text-emerald-500" strokeWidth={2.5} /> Healthy
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-6 mb-8 relative z-10">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Chickens</span>
                     <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">{farm.totalChickens}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase">Birds</span>
                     </div>
                  </div>
                </div>
                
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((farm.totalChickens / 2000) * 100, 100)}%` }}></div>
                </div>
              </div>

              <button
                onClick={() => { 
                  setSelectedFarm(farm._id); 
                  setCurrentChickens(farm.totalChickens);
                  setShowLogModal(true); 
                }}
                className="w-full h-14 bg-emerald-600 text-white font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-50"
              >
                Update Numbers <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>

      )}

      {/* Initialize Farm Modal */}
      {showFarmModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl animate-in fade-in duration-500" onClick={() => setShowFarmModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] p-10 md:p-12 w-full max-w-2xl shadow-4xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-20 duration-700">
            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-emerald-600 to-emerald-400" />
            
            <div className="flex justify-between items-start mb-16 relative z-10">
               <div className="space-y-4">
                  <h2 className="text-5xl lg:text-6xl font-black text-slate-950 uppercase tracking-tight leading-[0.9]">Add New <br /><span className="text-emerald-600">Farm.</span></h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] italic">Enter details to start tracking</p>
               </div>
               <button aria-label="Close" onClick={() => setShowFarmModal(false)} className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:scale-110 transition-all border border-slate-100">
                  <X size={32} strokeWidth={2.5} />
               </button>
            </div>

            <form onSubmit={handleCreateFarm} className="space-y-12 relative z-10">
              <div className="space-y-6">
                <label htmlFor="farmma-1" className="block text-sm font-bold uppercase text-slate-400 tracking-[0.2em] px-4">Farm Name</label>
                <div className="relative">
                   <div className="absolute left-10 top-1/2 -translate-y-1/2 text-emerald-500">
                      <Cpu size={24} />
                   </div>
                   <input id="farmma-1" required type="text" placeholder="e.g. My Big Farm" className="w-full bg-slate-50 border border-slate-100 pl-24 pr-12 h-20 rounded-[1.8rem] focus:ring-8 focus:ring-emerald-500/5 outline-none focus:border-emerald-500/30 font-bold text-sm uppercase tracking-[0.1em] transition-all" value={farmName} onChange={e => setFarmName(e.target.value)} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <label htmlFor="farmma-2" className="block text-sm font-bold uppercase text-slate-400 tracking-[0.2em] px-4">Location (City/Village)</label>
                   <div className="relative">
                      <MapPin className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                      <input id="farmma-2" required type="text" placeholder="e.g. Karnal, Haryana" className="w-full bg-slate-50 border border-slate-100 pl-24 pr-12 h-20 rounded-[1.8rem] focus:ring-8 focus:ring-emerald-500/5 outline-none focus:border-emerald-500/30 font-bold text-sm uppercase tracking-[0.1em] transition-all" value={location} onChange={e => setLocation(e.target.value)} />
                   </div>
                </div>
                <div className="space-y-6">
                   <label htmlFor="farmma-3" className="block text-sm font-bold uppercase text-slate-400 tracking-[0.2em] px-4">Number of Chickens</label>
                   <div className="relative">
                      <Bird className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                      <input id="farmma-3" required type="number" className="w-full bg-slate-50 border border-slate-100 pl-24 pr-12 h-20 rounded-[1.8rem] focus:ring-8 focus:ring-emerald-500/5 outline-none focus:border-emerald-500/30 font-bold text-sm transition-all shadow-inner" value={chickens} onChange={e => setChickens(e.target.value)} />
                   </div>
                </div>
              </div>
              
              <div className="pt-10 flex flex-col sm:flex-row gap-6">
                <button type="submit" className="flex-1 h-24 bg-emerald-600 text-white rounded-[2.2rem] font-black uppercase tracking-[0.2em] text-[12px] shadow-4xl shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-2 transition-all duration-700 flex items-center justify-center gap-6 group/submit">
                   Save Farm <ShieldCheck size={28} className="group-hover/submit:scale-125 transition-transform" strokeWidth={2.5} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Data Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl animate-in fade-in duration-500" onClick={() => setShowLogModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] p-10 md:p-12 w-full max-w-2xl shadow-4xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-20 duration-700">
            <div className="absolute top-0 left-0 w-full h-4 bg-emerald-600" />
            
            <div className="flex justify-between items-start mb-16 relative z-10">
               <div className="space-y-4">
                  <h2 className="text-5xl lg:text-6xl font-black text-slate-950 uppercase tracking-tight leading-[0.9]">Daily <br /><span className="text-emerald-600">Entry.</span></h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] italic">Update daily numbers for your farm</p>
               </div>
               <button aria-label="Close" onClick={() => setShowLogModal(false)} className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:scale-110 transition-all border border-slate-100">
                  <X size={32} strokeWidth={2.5} />
               </button>
            </div>

            <form onSubmit={handleAddLog} className="space-y-12 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <label htmlFor="farmma-4" className="block text-sm font-bold uppercase text-slate-400 tracking-[0.2em] px-4">Total Chickens Now</label>
                  <div className="relative">
                     <Bird className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                     <input id="farmma-4" required type="number" className="w-full bg-slate-50 border border-slate-100 pl-24 pr-12 h-20 rounded-[1.8rem] focus:ring-8 focus:ring-emerald-500/5 outline-none focus:border-emerald-500/30 font-bold text-sm text-slate-950 transition-all" value={currentChickens} onChange={e => setCurrentChickens(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-6">
                  <label htmlFor="farmma-5" className="block text-sm font-bold uppercase text-slate-400 tracking-[0.2em] px-4">Eggs Collected Today</label>
                  <div className="relative">
                      <div className="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-8 bg-amber-100 rounded-full border border-amber-200"></div>
                      <input id="farmma-5" required type="number" className="w-full bg-slate-50 border border-slate-100 pl-24 pr-12 h-20 rounded-[1.8rem] focus:ring-8 focus:ring-emerald-500/5 outline-none focus:border-emerald-500/30 font-bold text-sm text-slate-950 transition-all" value={eggs} onChange={e => setEggs(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <label htmlFor="farmma-6" className="block text-sm font-bold uppercase text-slate-400 tracking-[0.2em] px-4">Temperature (°C)</label>
                   <div className="relative">
                      <Thermometer className="absolute left-10 top-1/2 -translate-y-1/2 text-rose-500/60" size={24} />
                      <input id="farmma-6" required type="number" step="0.1" className="w-full bg-slate-50 border border-slate-100 pl-24 pr-12 h-20 rounded-[1.8rem] focus:ring-8 focus:ring-emerald-500/5 outline-none focus:border-emerald-500/30 font-bold text-sm text-slate-950 transition-all" value={temperature} onChange={e => setTemperature(e.target.value)} />
                   </div>
                </div>
                <div className="space-y-6">
                   <label htmlFor="farmma-7" className="block text-sm font-bold uppercase text-slate-400 tracking-[0.2em] px-4">Feed Used (kg)</label>
                   <div className="relative">
                      <Layers className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                      <input id="farmma-7" required type="number" className="w-full bg-slate-50 border border-slate-100 pl-24 pr-12 h-20 rounded-[1.8rem] focus:ring-8 focus:ring-emerald-500/5 outline-none focus:border-emerald-500/30 font-bold text-sm text-slate-950 transition-all" value={feed} onChange={e => setFeed(e.target.value)} />
                   </div>
                </div>
              </div>

              <div className="pt-10 flex flex-col sm:flex-row gap-6">
                <button type="submit" className="flex-1 h-24 bg-emerald-600 text-white rounded-[2.2rem] font-black uppercase tracking-[0.2em] text-[12px] shadow-4xl shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-2 transition-all duration-700 flex items-center justify-center gap-6 group/submit">
                   Save Daily Record <Activity size={28} className="group-hover/submit:animate-bounce transition-all" strokeWidth={2.5} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
