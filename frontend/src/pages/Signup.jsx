import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { errorMessage } from '../utils/axios';
import { useAuth, homeFor } from '../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(?:\+?91)?[6-9]\d{9}$/;

/** Same rules as the server, checked first so the user gets instant feedback. */
function validate({ name, identifier, password }) {
  if (name.trim().length < 2) return 'Please enter your full name.';
  const id = identifier.trim();
  if (id.includes('@') ? !EMAIL_RE.test(id) : !PHONE_RE.test(id.replace(/[\s\-()]/g, ''))) return 'Enter a valid email address or a 10-digit mobile number.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return '';
}
import { 
  ArrowRight, 
  User, 
  Mail, 
  Lock, 
  Egg, 
  CheckCircle2, 
  ShieldCheck, 
  Globe,
  Cpu,
  Layers,
  Database,
  Briefcase,
  Tractor,
  ShoppingCart,
  Scan,
  Activity
} from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Farmer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    const problem = validate({ name, identifier, password });
    if (problem) {
      setError(problem);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', { name: name.trim(), emailOrPhone: identifier.trim(), password, role });
      login(data);
      navigate(homeFor(data.role), { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex bg-slate-50 overflow-hidden relative">
      
      {/* Friendly Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,#d1fae5_0%,transparent_50%)] opacity-40"></div>
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/3"></div>
      
      {/* Left Column: Simple Branding & Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative p-16 flex-col justify-between border-r border-slate-200 z-10 overflow-hidden bg-white">
        
        {/* Decorative Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
           <img 
             src="/images/poultry_farm_hero.webp" 
             alt="Poultry Farm Hero" 
             className="w-full h-full object-cover opacity-10 blur-[2px] scale-110"
           />
           <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white"></div>
        </div>

        <div className="relative z-10 space-y-6">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-200">
                 <Egg size={28} className="fill-white" />
              </div>
              <div className="space-y-0.5">
                 <span className="text-2xl font-black text-slate-900 italic tracking-tight leading-none block">POULTRY<span className="text-emerald-600 not-italic">SMART</span></span>
                 <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">The Intelligent Farmer's Choice</span>
              </div>
           </div>
        </div>

        <div className="relative z-10 space-y-12">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
                 <Globe size={14} />
                 Join Our Farming Community
              </div>
              <h1 className="text-7xl font-black text-slate-900 leading-[0.85] tracking-tighter uppercase">
                 Empower <br />
                 <span className="text-emerald-600">Your Farm.</span>
              </h1>
              <p className="text-slate-500 font-bold text-base leading-relaxed max-w-sm">
                 The all-in-one platform for modern poultry management. From bird health to global marketplace access.
              </p>
           </div>

           <div className="grid grid-cols-1 gap-8 border-t border-slate-200 pt-12">
              <div className="flex items-center gap-6 group">
                 <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-emerald-200 group-hover:shadow-lg lg:group-hover:translate-x-2 transition-all duration-500">
                    <Activity size={28} />
                 </div>
                 <div className="space-y-0.5">
                    <h4 className="text-slate-900 font-black text-xs uppercase tracking-wider">Health Intelligence</h4>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wider leading-relaxed">AI-Driven Disease Prediction & Alerts</p>
                 </div>
              </div>
              <div className="flex items-center gap-6 group">
                 <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-emerald-200 group-hover:shadow-lg lg:group-hover:translate-x-2 transition-all duration-500">
                    <Layers size={28} />
                 </div>
                 <div className="space-y-0.5">
                    <h4 className="text-slate-900 font-black text-xs uppercase tracking-wider">Inventory & Supply</h4>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wider leading-relaxed">Seamless Feed and Store Management</p>
                 </div>
              </div>
              <div className="flex items-center gap-6 group">
                 <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-emerald-200 group-hover:shadow-lg lg:group-hover:translate-x-2 transition-all duration-500">
                    <ShoppingCart size={28} />
                 </div>
                 <div className="space-y-0.5">
                    <h4 className="text-slate-900 font-black text-xs uppercase tracking-wider">Direct Marketplace</h4>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wider leading-relaxed">Connect directly with buyers and grocers</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-sm font-black text-slate-400 uppercase tracking-widest italic">
           <div className="w-8 h-[2px] bg-slate-200"></div>
           TRUSTED BY 5,000+ FARMERS
        </div>
      </div>

      {/* Right Column: Interaction Interface */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-20 z-10 overflow-y-auto">
        <div className="w-full max-w-md space-y-12 py-12">
          <div className="space-y-6 text-center lg:text-left">
             <div className="lg:hidden flex justify-center mb-10">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-emerald-600 shadow-xl">
                   <Egg size={40} className="fill-emerald-600" />
                </div>
             </div>
             <h2 className="text-5xl font-black text-slate-900 tracking-tight uppercase leading-[0.9]">Start <br /><span className="text-emerald-600">Today.</span></h2>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Register your details below</p>
          </div>

          {error && (
            <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-sm font-semibold flex items-center gap-4">
               <div className="w-8 h-8 bg-rose-100 rounded-xl flex items-center justify-center font-black shrink-0" aria-hidden="true">!</div> 
               {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-8" noValidate>
            <div className="space-y-4">
              <p id="role-label" className="block text-xs font-black text-slate-600 uppercase tracking-wider px-4">What is your role?</p>
              <div className="grid grid-cols-2 gap-4">
                 <button
                   type="button"
                   aria-pressed={role === 'Farmer'}
                   onClick={() => setRole('Farmer')}
                   className={`h-20 rounded-[1.5rem] font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-3 border-2 ${
                     role === 'Farmer' 
                     ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl shadow-emerald-200 translate-y-[-2px]' 
                     : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600'
                   }`}
                 >
                   <Tractor size={24} />
                   Farmer
                 </button>
                 <button
                   type="button"
                   aria-pressed={role === 'Buyer'}
                   onClick={() => setRole('Buyer')}
                   className={`h-20 rounded-[1.5rem] font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-3 border-2 ${
                     role === 'Buyer' 
                     ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl shadow-emerald-200 translate-y-[-2px]' 
                     : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600'
                   }`}
                 >
                   <ShoppingCart size={24} />
                   Buyer
                 </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="signup-1" className="block text-xs font-black text-slate-500 uppercase tracking-wider px-4">Full Name</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors">
                    <User size={20} />
                  </div>
                  <input id="signup-1" autoComplete="name"
                    type="text"
                    className="w-full bg-white border border-slate-200 px-12 py-4 rounded-[2rem] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="signup-2" className="block text-xs font-black text-slate-500 uppercase tracking-wider px-4">Mobile or Email</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input id="signup-2" autoComplete="username" autoCapitalize="none" inputMode="email"
                    type="text"
                    className="w-full bg-white border border-slate-200 px-12 py-4 rounded-[2rem] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                    placeholder="Enter Mobile/Email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="signup-3" className="block text-xs font-black text-slate-500 uppercase tracking-wider px-4">Set Password</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input id="signup-3" autoComplete="new-password" minLength={8} aria-describedby="pw-hint"
                    type="password"
                    className="w-full bg-white border border-slate-200 px-12 py-4 rounded-[2rem] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <p id="pw-hint" className="px-4 text-xs text-slate-600">At least 8 characters.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-[2rem] transition-all shadow-xl shadow-emerald-200 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 text-sm uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Register'} 
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <p className="text-center text-xs font-bold text-slate-500">
            Already have an account? <Link to="/login" className="text-emerald-600 hover:underline ml-1">Login here</Link>
          </p>
        </div>
      </div>
      
      {/* Aesthetic Accents */}
      <div className="absolute -top-20 -right-20 opacity-[0.03] pointer-events-none -rotate-12 scale-[2]">
         <Activity size={400} />
      </div>
    </div>
  );
}
