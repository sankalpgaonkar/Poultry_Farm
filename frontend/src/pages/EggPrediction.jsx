import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { 
  BrainCircuit, 
  AlertCircle, 
  Lightbulb, 
  TrendingUp, 
  Zap, 
  Wind, 
  Thermometer, 
  Droplets, 
  Sun, 
  Bird, 
  Scale, 
  PieChart as PieChartIcon,
  ChevronRight,
  Target,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { formatRupee } from '../utils/imageConstants';

export default function EggPrediction() {
  const [formData, setFormData] = useState({
    chickens: '',
    age: '',
    feedQuality: 'Good',
    feedQty: '',
    temperature: '',
    humidity: '',
    lighting: '',
    breed: 'Leghorn',
    eggPrice: '6' // Default price per egg in ₹
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-run "What if" simulation when formData changes
  useEffect(() => {
    const runSimulation = async () => {
      if (!formData.chickens || !formData.age) return;
      setLoading(true);
      try {
        const payload = {
          ...formData,
          chickens: Number(formData.chickens) || 0,
          age: Number(formData.age) || 0,
          feedQty: Number(formData.feedQty) || 0,
          temperature: Number(formData.temperature) || 0,
          humidity: Number(formData.humidity) || 0,
          lighting: Number(formData.lighting) || 0
        };
        const { data } = await api.post('/ai/predict', payload);
        setResult(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(runSimulation, 600);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const chartData = (result && result.prediction) ? [
    { name: 'Predicted Yield', Eggs: result.prediction.predictedEggs || 0 },
    { name: 'Ideal Max', Eggs: result.idealProduction || 0 }
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 pb-24">
      {/* Friendly Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 lg:p-12 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/10 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm font-black uppercase tracking-wider text-emerald-400">
               <BrainCircuit size={12} className="animate-pulse" /> AI Egg Helper
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight uppercase leading-none">
              Egg <span className="text-emerald-500">Forecast.</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-xl font-medium leading-relaxed">
              Estimate how many eggs your flock should lay today from its age, feed and the weather.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-md shrink-0 w-full lg:w-80">
             <p className="text-sm font-black text-slate-200 uppercase tracking-wider mb-3">How it works</p>
             <p className="text-sm text-slate-300 leading-relaxed">An estimate from flock age, feed, daylight, temperature and humidity. Compare it with your real counts in My Farm Data to see how close it is for your farm.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Input Details */}
        <div className="xl:col-span-5 space-y-8">
           <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-50">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Target size={20} />
                 </div>
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Enter Farm Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <div className="space-y-2">
                   <label htmlFor="eggpre-1" className="text-sm font-black text-slate-600 uppercase tracking-wider px-1">Number of Birds</label>
                   <div className="relative">
                      <Bird className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input id="eggpre-1" type="number" name="chickens" value={formData.chickens} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 pl-14 pr-5 py-4 rounded-2xl focus:border-emerald-500 outline-none font-bold text-slate-900 transition-all" placeholder="0" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label htmlFor="eggpre-2" className="text-sm font-black text-slate-400 uppercase tracking-wider px-1">Age of Birds (Weeks)</label>
                   <input id="eggpre-2" type="number" name="age" value={formData.age} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-emerald-500 outline-none font-bold text-slate-900 transition-all" placeholder="0" />
                </div>
                <div className="space-y-2">
                   <label htmlFor="eggpre-3" className="text-sm font-black text-slate-400 uppercase tracking-wider px-1">Daily Feed (kg)</label>
                   <div className="relative">
                      <Scale className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input id="eggpre-3" type="number" name="feedQty" value={formData.feedQty} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 pl-14 pr-5 py-4 rounded-2xl focus:border-emerald-500 outline-none font-bold text-slate-900 transition-all" placeholder="0.0" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label htmlFor="eggpre-4" className="text-sm font-black text-slate-400 uppercase tracking-wider px-1">Feed Quality</label>
                   <select id="eggpre-4" name="feedQuality" value={formData.feedQuality} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-emerald-500 outline-none font-bold text-slate-900 appearance-none">
                      <option value="Poor">Low</option>
                      <option value="Average">Medium</option>
                      <option value="Good">Best Feed</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label htmlFor="eggpre-5" className="text-sm font-black text-slate-400 uppercase tracking-wider px-1">Inside Temp (°C)</label>
                   <div className="relative">
                      <Thermometer className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input id="eggpre-5" type="number" name="temperature" value={formData.temperature} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 pl-14 pr-5 py-4 rounded-2xl focus:border-emerald-500 outline-none font-bold text-slate-900 transition-all" placeholder="24" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label htmlFor="eggpre-6" className="text-sm font-black text-slate-400 uppercase tracking-wider px-1">Humidity (%)</label>
                   <div className="relative">
                      <Droplets className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input id="eggpre-6" type="number" name="humidity" value={formData.humidity} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 pl-14 pr-5 py-4 rounded-2xl focus:border-emerald-500 outline-none font-bold text-slate-900 transition-all" placeholder="50" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label htmlFor="eggpre-7" className="text-sm font-black text-slate-400 uppercase tracking-wider px-1">Bird Type</label>
                   <select id="eggpre-7" name="breed" value={formData.breed} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-emerald-500 outline-none font-bold text-slate-900 appearance-none">
                      <option value="Leghorn">White Leghorn</option>
                      <option value="Desi">Desi Chicken</option>
                      <option value="Kadaknath">Kadaknath</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label htmlFor="eggpre-8" className="text-sm font-black text-slate-400 uppercase tracking-wider px-1">Sale Price (₹)</label>
                   <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-600">₹</span>
                      <input id="eggpre-8" type="number" name="eggPrice" value={formData.eggPrice} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 pl-10 pr-5 py-4 rounded-2xl focus:border-emerald-500 outline-none font-bold text-slate-900 transition-all" placeholder="6" />
                   </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                 <div className="flex items-center gap-3 text-emerald-600">
                    <Zap size={16} className={loading ? "animate-spin" : ""} />
                    <span className="text-sm font-black uppercase tracking-wider">{loading ? "Calculating eggs..." : "Connected to Helper"}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Prediction Side */}
        <div className="xl:col-span-7">
           {result ? (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                {/* Result Card */}
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
                   <div className="absolute bottom-0 right-0 p-10 opacity-5 scale-150 rotate-12">
                      <TrendingUp size={180} />
                   </div>
                   <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                      <div className="space-y-3">
                         <p className="text-sm font-black uppercase tracking-wider text-emerald-400 italic">Estimated eggs today</p>
                         <div className="flex items-end gap-3">
                            <h3 className="text-7xl font-black tracking-tight tabular-nums leading-none">
                               {result.prediction.predictedEggs.toLocaleString()}
                            </h3>
                            <span className="text-xl font-black text-slate-300 mb-1 uppercase">Eggs</span>
                         </div>
                         <div className="flex items-center gap-4 pt-4">
                            <div className="bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20 text-emerald-400 text-sm font-black uppercase tracking-wider flex items-center gap-2">
                               <TrendingUp size={14} /> Daily Income: {formatRupee(result.prediction.predictedEggs * (Number(formData.eggPrice) || 0))}
                            </div>
                         </div>
                      </div>
                      <div className="shrink-0">
                         <div className="w-28 h-28 rounded-full border-4 border-white/5 flex flex-col items-center justify-center relative bg-white/5">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                               <circle 
                                 cx="56" cy="56" r="50" 
                                 fill="none" stroke="currentColor" 
                                 strokeWidth="5" className="text-white/5" 
                               />
                               <circle 
                                 cx="56" cy="56" r="50" 
                                 fill="none" stroke="currentColor" 
                                 strokeWidth="5" strokeDasharray="314" 
                                 strokeDashoffset={314 * (1 - result.prediction.confidence / 100)} 
                                 className="text-emerald-500"
                                 strokeLinecap="round"
                               />
                            </svg>
                            <span className="text-2xl font-black mb-0.5">{result.prediction.confidence}%</span>
                            <span className="text-xs font-black uppercase tracking-wider text-slate-300">Confidence</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* performance Card */}
                   <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                         <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Performance</h4>
                         <PieChartIcon className="text-emerald-500" size={20} />
                      </div>
                      <div className="h-44">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', fill: '#94a3b8' }} />
                               <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 15px 30px rgba(0,0,0,0.1)', padding: '15px' }} />
                               <Bar dataKey="Eggs" radius={[12, 12, 0, 0]} barSize={40}>
                                  {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f1f5f9'} />
                                  ))}
                                </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl text-center">
                         <p className="text-sm font-black text-slate-400 uppercase tracking-wider">Bird Health Score</p>
                         <p className="text-xl font-black text-slate-900 mt-1">{result.efficiency}%</p>
                      </div>
                   </div>

                   {/* Tips Card */}
                   <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <Lightbulb size={20} />
                         </div>
                         <h4 className="text-lg font-black uppercase tracking-tight">Farm Tips</h4>
                      </div>
                      
                      <div className="space-y-4">
                         {result.insights.map((insight, idx) => {
                           const isAlert = insight.includes('reducing') || insight.includes('too young') || insight.includes('low') || insight.includes('Check');
                           return (
                             <div key={idx} className={`p-4 rounded-xl border flex gap-3 ${isAlert ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                                {isAlert ? <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} /> : <ArrowUpRight className="text-amber-500 shrink-0 mt-0.5" size={16} />}
                                <p className={`text-xs font-bold leading-relaxed ${isAlert ? 'text-rose-900' : 'text-amber-900'} italic uppercase`}>{insight}</p>
                             </div>
                           )
                         })}
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <div className="h-full min-h-[500px] border-4 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center p-16 text-center space-y-8 bg-white/50">
                <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-200 border border-slate-50">
                   <BrainCircuit size={40} />
                </div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Ready when you are!</h3>
                   <p className="text-slate-400 font-bold text-sm max-w-sm">Please fill in the details on the left to see your egg prediction.</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
