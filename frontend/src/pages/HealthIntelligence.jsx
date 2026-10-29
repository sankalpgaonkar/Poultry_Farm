import { useState } from 'react';
import api from '../utils/axios';
import { 
  Stethoscope, 
  AlertTriangle, 
  ShieldCheck, 
  Bug, 
  Activity, 
  Zap, 
  ChevronRight, 
  Dna,
  HeartPulse,
  Microscope,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  X,
  Loader2,
  Cpu,
  RefreshCw,
  Search,
  Scan,
  Waves,
  ArrowRight
} from 'lucide-react';

export default function HealthIntelligence() {
  const [symptomsInput, setSymptomsInput] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const predefinedSymptoms = [
    'sneezing', 'coughing', 'drop in eggs', 'bloody diarrhea', 'lethargy', 'pale comb',
    'gasping', 'twisted neck', 'weight loss', 'panting', 'watery eyes', 'increased thirst'
  ];

  const handleAnalyze = async () => {
    if (!symptomsInput) return;
    setLoading(true);
    try {
      const symptomsArray = symptomsInput.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.post('/health/analyze', { symptoms: symptomsArray });
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addSymptom = (s) => {
    setSymptomsInput(prev => prev ? prev + ', ' + s : s);
  };

  const clearSymptoms = () => setSymptomsInput('');

  return (
    <div className="space-y-12 pb-20">
      {/* Friendly Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-soft relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50/50 rounded-full translate-x-32 -translate-y-32 blur-3xl opacity-30"></div>
        
        <div className="space-y-4 relative z-10">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 rounded-full border border-rose-100">
              <span className="text-[11px] font-bold uppercase tracking-widest text-rose-700">Health Check</span>
           </div>
           <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight text-slate-900">
              Disease <span className="text-rose-600">Finder</span>
           </h1>
           <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xl">
             Pick the signs you see in your chickens. Kisan Mitra will tell you what could be wrong and how to fix it.
           </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 relative z-10 w-full lg:w-auto">
           <div className="flex-1 lg:flex-none h-14 px-6 bg-white border border-slate-200 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500">
                 <HeartPulse size={16} className="animate-pulse" />
              </div>
              <div className="space-y-0.5">
                 <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Kisan Mitra AI</h4>
                 <p className="text-[9px] font-bold text-slate-400 uppercase">Ready to Help</p>
              </div>
           </div>
           
           <button aria-label="Refresh" onClick={clearSymptoms} className="h-14 w-14 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-lg">
              <RefreshCw size={18} />
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Input - Left Side */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-soft relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                 <Dna size={120} />
              </div>
              
              <div className="flex items-center gap-3 mb-8 relative z-10">
                 <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                    <Microscope size={20} />
                 </div>
                 <h2 className="text-lg font-bold text-slate-900 tracking-tight">Select Symptoms</h2>
              </div>
              
              <div className="space-y-8 relative z-10">
                <div className="space-y-3">
                  <label htmlFor="health-1" className="text-xs font-bold uppercase text-slate-600 tracking-wider px-1">Describe symptoms</label>
                  <textarea id="health-1" 
                    rows="4"
                    value={symptomsInput}
                    onChange={(e) => setSymptomsInput(e.target.value)}
                    placeholder="E.g., sneezing, not eating..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 focus:ring-4 focus:ring-rose-500/10 outline-none focus:border-rose-400/50 resize-none font-semibold text-sm text-slate-900 placeholder:text-slate-400 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">Common Signs</p>
                  <div className="flex flex-wrap gap-2">
                    {predefinedSymptoms.map(s => (
                      <button 
                        key={s} 
                        onClick={() => addSymptom(s)}
                        className="bg-white hover:bg-rose-50 text-slate-600 border border-slate-100 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all hover:border-rose-200 active:scale-95 shadow-sm"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleAnalyze} 
                  disabled={loading || !symptomsInput}
                  className="w-full h-14 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg enabled:hover:bg-rose-600 transition-all flex items-center justify-center gap-3 group disabled:opacity-30"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin text-rose-400" /> Thinking...</>
                  ) : (
                    <><Cpu size={16} className="text-rose-400" /> Analyze Now</>
                  )}
                </button>
              </div>
           </div>
           
           <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex items-center gap-6 border border-slate-800 shadow-soft group transition-all">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-rose-600 transition-colors">
                 <ShieldCheck size={24} className="text-rose-400 group-hover:text-white" />
              </div>
              <div className="space-y-0.5">
                 <h4 className="text-sm font-bold uppercase tracking-tight">Need a Vet?</h4>
                 <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">Serious problem? Call a local vet.</p>
              </div>
           </div>
        </div>

        {/* Results - Right Side */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-soft flex items-center gap-4">
             <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-rose-100">
                <Activity size={20} />
             </div>
             <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Analysis Results</h2>
          </div>

          <div className="space-y-6">
            {results ? (
              results.length > 0 ? (
                results.map((r, i) => (
                  <div key={i} className="group bg-white border border-slate-100 rounded-[2rem] p-8 shadow-soft hover:shadow-strong transition-all overflow-hidden flex flex-col relative">
                    <div className={`absolute top-0 left-0 w-2 h-full ${
                       r.riskLevel === 'Critical' ? 'bg-rose-600' : 
                       r.riskLevel === 'High' ? 'bg-orange-500' : 'bg-amber-400'
                    }`}></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                             r.riskLevel === 'Critical' ? 'bg-rose-600 text-white border-rose-700' : 
                             r.riskLevel === 'High' ? 'bg-orange-500 text-white border-orange-600' : 'bg-amber-400 text-slate-900 border-amber-500'
                           }`}>
                             {r.riskLevel} Level
                           </span>
                           <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Potential Disease</span>
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight group-hover:text-rose-600 transition-colors uppercase">{r.disease}</h3>
                      </div>
                      
                      <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 flex flex-col items-center">
                         <span className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Confidence</span>
                         <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                           {r.confidence}%
                         </span>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-4">
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                            <ShieldAlert size={20} />
                         </div>
                         <div className="space-y-2">
                            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Recommended Action</p>
                            <p className="text-white font-bold text-lg leading-snug">{r.action}</p>
                         </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200 flex flex-col items-center gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 shadow-soft">
                     <AlertTriangle size={32} className="text-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">No match found</h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest max-w-xs mx-auto leading-relaxed">Please provide more symptoms or consult a veterinarian.</p>
                  </div>
                </div>
              )
            ) : (
               <div className="h-full min-h-[400px] bg-slate-50/30 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center group">
                 <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-slate-200 mb-6 shadow-soft group-hover:scale-105 transition-transform">
                    <Scan size={32} className="opacity-20 group-hover:opacity-40" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-600 tracking-tight italic">Waiting for your selection...</h3>
                 <p className="text-slate-600 font-bold text-xs uppercase tracking-widest mt-4">Kisan Mitra AI is ready</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
