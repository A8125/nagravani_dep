import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { askAI, getFAQ, translateText } from '../lib/api';
import { Bot, Send, Loader2, MessageSquare, Mic, Globe, ChevronDown, Smartphone, PhoneCall } from 'lucide-react';

interface Message {
  role: 'user' | 'bot';
  text: string;
  lang?: string;
}

const QUICK_PROMPTS = [
  'Who is my ward representative?',
  'Water supply timings in Mandya?',
  'CESC complaint number?',
  'How do I report a pothole?',
  'When is the next ward meeting?',
];

export default function AIHelpDesk() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'ನಮಸ್ಕಾರ! Hello! I\'m your NagaraVaani AI assistant. I can answer any question about Mandya civic services, or you can ask in Kannada and I\'ll respond accordingly.' }
  ]);
  const [input, setInput]   = useState('');
  const [lang, setLang]     = useState<'en' | 'kn'>('en');
  const [loading, setLoading] = useState(false);
  const [faq, setFaq]       = useState<{ q: string; a: string }[]>([]);
  const [translating, setTranslating] = useState(false);
  const [listening, setListening]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    getFAQ().then(r => setFaq(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', text, lang };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const r = await askAI(text, lang);
      setMessages(prev => [...prev, { role: 'bot', text: r.answer, lang }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I\'m having trouble connecting to the AI right now. Please try again or call TMC at 0823-222001.' }]);
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Voice input not supported in this browser. Use Chrome.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend   = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleTranslate = async (text: string, _i: number) => {
    setTranslating(true);
    try {
      const r = await translateText(text);
      setMessages(prev => prev.map(m => m.text === text ? { ...m, text: r.translated } : m));
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream pt-[72px] flex flex-col">
      <div className="max-w-5xl mx-auto px-4 py-8 w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl text-charcoal mb-1">AI Help Desk</h1>
            <p className="text-stone text-sm">Ask anything about Mandya civic services — powered by local Gemma 2B AI</p>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-stone" />
            <button onClick={() => setLang('en')}
              className={`px-3 py-1 text-xs rounded-l-full border transition-all ${lang==='en' ? 'bg-charcoal text-white border-charcoal' : 'border-border text-stone'}`}>
              English
            </button>
            <button onClick={() => setLang('kn')}
              className={`px-3 py-1 text-xs rounded-r-full border -ml-px transition-all ${lang==='kn' ? 'bg-charcoal text-white border-charcoal' : 'border-border text-stone'}`}>
              ಕನ್ನಡ
            </button>
          </div>
        </div>

        <div className="flex gap-5 flex-1">
          {/* Chat window */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 bg-white rounded-2xl border border-border p-4 overflow-y-auto mb-3 space-y-4" style={{ minHeight: 380, maxHeight: 500 }}>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                  {m.role === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-charcoal flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div>
                    <div className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-3 text-sm ${
                      m.role === 'user'
                        ? 'bg-charcoal text-white rounded-br-none'
                        : 'bg-cream text-charcoal rounded-bl-none'
                    }`}>
                      {m.text}
                    </div>
                    {m.role === 'bot' && lang === 'en' && (
                      <button onClick={() => handleTranslate(m.text, i)}
                        disabled={translating}
                        className="text-xs text-stone mt-1 hover:text-charcoal transition-colors">
                        {translating ? 'Translating…' : 'Translate to ಕನ್ನಡ'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-charcoal flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-cream rounded-2xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-stone" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="text-xs px-3 py-1.5 bg-white border border-border rounded-full text-stone hover:border-charcoal hover:text-charcoal transition-all">
                  {p}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <button onClick={startVoice}
                className={`p-2.5 rounded-full border transition-all ${listening ? 'bg-red-500 border-red-500 text-white animate-pulse' : 'border-border text-stone hover:border-charcoal'}`}>
                <Mic className="w-4 h-4" />
              </button>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ…' : 'Ask about Mandya civic services…'}
                className="flex-1 border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-charcoal transition-colors bg-white"
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className="p-2.5 bg-charcoal text-white rounded-full hover:bg-charcoal/90 transition-colors disabled:opacity-40">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FAQ sidebar */}
          <div className="hidden lg:block w-64">
            <div className="bg-white rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-stone" />
                <span className="text-xs font-medium text-stone uppercase tracking-wide">Common Questions</span>
              </div>
              <div className="space-y-2">
                {faq.map((f, i) => (
                  <FAQ key={i} q={f.q} a={f.a} onAsk={() => sendMessage(f.q)} />
                ))}
              </div>
            </div>

            {/* WhatsApp box */}
            <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4">
              <h4 className="text-sm font-medium text-charcoal mb-1 flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-green-600" /> WhatsApp Bot</h4>
              <p className="text-xs text-stone mb-3">Report issues or get help via WhatsApp in Kannada or English.</p>
              <a href="https://wa.me/14155238886?text=join%20rapidly-eager"
                target="_blank" rel="noopener noreferrer"
                className="block text-center py-2 bg-green-600 text-white text-xs rounded-full hover:bg-green-700 transition-colors">
                Open WhatsApp
              </a>
            </div>

            {/* Voice box */}
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-2xl p-4">
              <h4 className="text-sm font-medium text-charcoal mb-1 flex items-center gap-1.5"><PhoneCall className="w-4 h-4 text-purple-600" /> Voice Portal</h4>
              <p className="text-xs text-stone mb-2">Use the microphone above to report issues by voice in Kannada or English.</p>
              <p className="text-xs text-stone font-medium">Ivr: <span className="text-charcoal">1800-XXX-XXXX</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQ({ q, a, onAsk }: { q: string; a: string; onAsk: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-cream transition-colors">
        <span className="text-xs text-charcoal pr-2 leading-tight">{q}</span>
        <ChevronDown className={`w-3 h-3 text-stone flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-3 pb-3 pt-1">
              <p className="text-xs text-stone mb-2">{a}</p>
              <button onClick={onAsk} className="text-xs text-charcoal font-medium hover:underline">
                Ask the AI →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
