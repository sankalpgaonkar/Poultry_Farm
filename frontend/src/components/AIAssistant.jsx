import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  Minus, 
  Maximize2, 
  Camera, 
  Image as ImageIcon,
  Zap,
  BrainCircuit,
  Activity,
  ArrowRight,
  TrendingUp,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import api, { errorMessage } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { compressImageFile } from '../utils/image';

export default function AIAssistant({ isStatic = false }) {
  const { user } = useAuth();
  const isFarmer = user?.role === 'Farmer';
  const [isOpen, setIsOpen] = useState(isStatic);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([
    { role: 'bot', content: 'Hello! I am **Kisan Mitra**, your farm helper. I can help you track your birds, check egg production, and find the best market prices. How can I help you today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [pendingInventory, setPendingInventory] = useState(null);
  const [voiceQuery, setVoiceQuery] = useState('');
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  useEffect(() => {
    const handleVoice = (e) => {
      setIsOpen(true);
      setIsMinimized(false);
      setVoiceQuery(e.detail);
    };
    window.addEventListener('open-ai-assistant-with-query', handleVoice);
    return () => window.removeEventListener('open-ai-assistant-with-query', handleVoice);
  }, []);

  useEffect(() => {
    if (voiceQuery) {
      handleSend(voiceQuery);
      setVoiceQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- send once per voice query
  }, [voiceQuery]);

  const handleSend = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const query = typeof e === 'string' ? e : message;
    if (!query.trim()) return;

    const history = chat
      .filter(m => m.role === 'user' || m.role === 'bot')
      .slice(-10)
      .map(m => ({
        role: m.role === 'bot' ? 'model' : 'user',
        content: m.content
      }));

    const userMessage = { role: 'user', content: query };
    setChat(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: query, history }, { silent: true, timeout: 45000 });
      setChat(prev => [...prev, { role: 'bot', content: data.reply }]);
    } catch (err) {
      setChat(prev => [...prev, { role: 'bot', content: errorMessage(err, 'Connection problem. Please try again in a moment.') }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoLoading(true);
    setChat(prev => [...prev, { role: 'user', content: '📸 Checking photo...' }]);

    try {
      const formData = new FormData();
      formData.append('photo', await compressImageFile(file));
      const { data } = await api.post('/ai/process-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }, silent: true, timeout: 45000
      });
      
      setPendingInventory(data);
      setChat(prev => [...prev, { 
        role: 'bot', 
        type: 'inventory_confirm',
        data: data,
        content: `Photo checked! I found: **${data.itemName}** (${data.quantity} ${data.unit}). Shall I add this to your stock?` 
      }]);
    } catch (err) {
      setChat(prev => [...prev, { role: 'bot', content: errorMessage(err, 'Could not read the photo. Please take a clearer picture and try again.') }]);
    } finally {
      setPhotoLoading(false);
      e.target.value = '';
    }
  };

  const handleConfirmInventory = async () => {
    if (!pendingInventory) return;
    
    setLoading(true);
    try {
      await api.post('/inventory/bulk', { items: [pendingInventory] }, { silent: true });
      setChat(prev => [...prev.filter(m => m.type !== 'inventory_confirm'), { 
        role: 'bot', 
        content: `✅ Added! **${pendingInventory.itemName}** is now in your stock.` 
      }]);
      setPendingInventory(null);
    } catch (err) {
      setChat(prev => [...prev, { role: 'bot', content: 'Could not save. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const extractSuggestions = (text) => {
    const regex = /\[\[Suggest:\s*(.*?)\]\]/g;
    const suggestions = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      suggestions.push(match[1]);
    }
    return suggestions;
  };

  const removeSuggestions = (text) => {
    return text.replace(/\[\[Suggest:\s*.*?\]\]/g, '').trim();
  };

  const renderContent = (content) => {
    if (!content) return null;
    const cleanContent = removeSuggestions(content);
    
    return cleanContent.split('\n').map((line, i) => {
      const parts = line.split('**');
      const formattedLine = parts.map((part, j) => 
        j % 2 === 1 ? <strong key={j} className="text-emerald-600 font-bold">{part}</strong> : part
      );

      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return <li key={i} className="ml-4 list-disc mb-1 text-slate-700 font-medium font-sans">{formattedLine.map(f => f)}</li>;
      }
      return <p key={i} className={line.trim() === '' ? 'h-2' : 'mb-2 text-slate-700 leading-relaxed font-medium font-sans'}>{formattedLine}</p>;
    });
  };

  const quickActions = [
    "Check Market Prices",
    "Bird Health Tips",
    "Egg Prediction",
    "Daily Farm Report"
  ];

  const containerClasses = isStatic 
    ? "w-full h-[calc(100dvh-12rem)] min-h-[480px] flex flex-col bg-white rounded-[2.5rem] shadow-soft border border-slate-100 overflow-hidden"
    : `fixed inset-x-2 bottom-2 sm:inset-x-auto sm:bottom-6 sm:right-6 z-[100] sm:w-[420px] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isMinimized ? 'h-[88px]' : 'h-[min(650px,85dvh)]'} flex flex-col bg-white rounded-[2.5rem] shadow-strong border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-20 duration-700`;

  if (!isOpen && !isStatic) {
    return (
      <button
        type="button"
        aria-label="Open Kisan Mitra AI assistant"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[100] bg-slate-900 border border-slate-800 text-white w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] shadow-strong hover:scale-105 active:scale-95 transition-all group flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-emerald-500 rounded-full blur-[40px] opacity-10 animate-pulse" />
        <Bot size={30} className="relative z-10" aria-hidden="true" />
      </button>
    );
  }

  return (
    <section className={containerClasses} aria-label="Kisan Mitra AI assistant">
      {/* Friendly Header */}
      <div className="relative overflow-hidden bg-slate-50 p-6 flex items-center justify-between shrink-0 border-b border-slate-100">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] -mr-16 -mt-16"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-100">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-slate-900 font-bold text-xs tracking-wide uppercase">Kisan Mitra AI</h3>
            <div className="flex items-center gap-2 mt-1">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
        {!isStatic && (
          <div className="flex items-center gap-3 relative z-10">
            <button type="button" aria-label={isMinimized ? 'Expand assistant' : 'Minimise assistant'} aria-expanded={!isMinimized} onClick={() => setIsMinimized(!isMinimized)} className="w-8 h-8 rounded-lg bg-slate-200/50 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all">
              {isMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
            </button>
            <button type="button" aria-label="Close assistant" onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-all">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {(!isMinimized || isStatic) && (
        <>
          {/* Chat Messages */}
          <div className="flex-grow overflow-y-auto px-4 sm:px-6 py-6 space-y-5 bg-white scrollbar-hide" aria-live="polite" aria-busy={loading}>
            {chat.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                <div className={`max-w-[85%] relative overflow-hidden transition-all duration-500 ${
                  msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-2xl rounded-tr-none px-5 py-3 shadow-md font-semibold text-sm' 
                  : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm text-sm'
                }`}>
                  {msg.role === 'user' ? (
                     <div className="flex items-center gap-2">
                        <User size={12} className="opacity-50" />
                        <span>{msg.content}</span>
                     </div>
                  ) : renderContent(msg.content)}
                  
                  {msg.role === 'bot' && extractSuggestions(msg.content).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                       {extractSuggestions(msg.content).map((suggestion, sIdx) => (
                         <button
                           key={sIdx}
                           onClick={() => handleSend(suggestion)}
                           className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all font-bold uppercase tracking-wider"
                         >
                           {suggestion}
                         </button>
                       ))}
                    </div>
                  )}


                  {msg.type === 'inventory_confirm' && (
                    <div className="mt-6 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-4">
                      <div className="flex justify-between items-center text-slate-900">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-800">Item Found</span>
                        <Zap size={14} className="text-emerald-500 animate-pulse" />
                      </div>
                      <div className="text-slate-900 font-black text-base uppercase tracking-tighter">
                        {msg.data.itemName} <span className="text-emerald-500">×</span> {msg.data.quantity} {msg.data.unit}
                      </div>
                      <button 
                        onClick={handleConfirmInventory}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-xs hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
                      >
                        Add to Stock <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Quick Actions */}
            {chat.length < 5 && (
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar pt-4">
                {quickActions.map(action => (
                  <button 
                    key={action}
                    onClick={() => handleSend(action)}
                    className="whitespace-nowrap px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 uppercase tracking-wider hover:border-emerald-500/50 hover:text-emerald-600 transition-all hover:-translate-y-1 shadow-sm"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] rounded-tl-none flex items-center gap-3">
                  <div className="flex gap-1">
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce h-1" />
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s] h-1" />
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.5s] h-1" />
                  </div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* User Input Area */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="sr-only" 
              tabIndex={-1}
              aria-hidden="true"
              accept="image/*" 
              onChange={handlePhotoUpload} 
            />
            <div className="relative group flex items-center gap-3">
              {isFarmer && <button
                type="button"
                aria-label="Scan a bill or label photo to add stock"
                onClick={() => fileInputRef.current.click()}
                disabled={loading || photoLoading}
                className="w-14 h-14 bg-white text-slate-400 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-200 flex items-center justify-center shrink-0 shadow-sm"
              >
                {photoLoading ? <Loader2 size={20} className="animate-spin text-emerald-500" /> : <Camera size={20} />}
              </button>}
              <div className="relative flex-grow">
                <label htmlFor={isStatic ? 'ai-input-page' : 'ai-input'} className="sr-only">Ask Kisan Mitra a question</label>
                <input
                  id={isStatic ? 'ai-input-page' : 'ai-input'}
                  type="text"
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  placeholder="Ask Kisan Mitra..."
                  className="w-full bg-white border border-slate-200 pl-5 pr-14 py-4 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-semibold text-sm text-slate-900 placeholder:text-slate-400 shadow-sm"
                />
                <button aria-label="Send message"
                  type="button"
                  onClick={() => handleSend()}
                  disabled={loading || !message.trim() || photoLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900 text-white rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-20 flex items-center justify-center shadow-lg"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
               <p className="text-[11px] text-slate-600 font-semibold leading-none">
                  AI answers can be wrong. Check with a vet for serious problems.
               </p>
               <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-600 font-semibold">Secure</span>
                  <ShieldCheck size={10} className="text-emerald-500" />
               </div>
            </div>
          </div>

        </>
      )}
    </section>
  );
}
