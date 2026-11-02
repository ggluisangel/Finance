import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, Transaction } from '../types/finance';
import { getFinancialSummary, addChatMessage, addTransactions, getChatMessages } from '../db/storage';
import { Bot, Send, Mic, MicOff, Sparkles, ArrowUpRight, ArrowDownRight, CheckCircle2, Wallet, Cpu } from 'lucide-react';

interface AgentTabProps {
  profile: UserProfile;
}

export const AgentTab: React.FC<AgentTabProps> = ({ profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const summary = getFinancialSummary();

  const loadMessages = () => {
    setMessages(getChatMessages());
  };

  useEffect(() => {
    loadMessages();
    const handleStorageUpdate = () => loadMessages();
    window.addEventListener('finan_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('finan_storage_updated', handleStorageUpdate);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'es-CU';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = (err: any) => {
          console.error('Speech recognition error:', err);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Tu navegador no soporta entrada de voz directa. Puedes escribir tu mensaje en texto.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Error starting speech recognition:', e);
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || loading) return;

    setInputPrompt('');

    // 1. Save User Message
    addChatMessage({
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    });

    setLoading(true);

    try {
      // 2. Call Server API endpoint for Gemini / Ollama Cloud Agent
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          aiProvider: profile.aiProvider,
          ollamaUrl: profile.ollamaUrl,
          ollamaModel: profile.ollamaModel,
          ollamaApiKey: profile.ollamaApiKey,
          userApiKey: profile.customApiKey,
          currentCashInHand: summary.currentCashInHand
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo procesar el mensaje con la IA.');
      }

      // 3. Save extracted transactions to local DB
      let createdTxs: Transaction[] = [];
      if (data.transactions && data.transactions.length > 0) {
        createdTxs = addTransactions(
          data.transactions.map((t: any) => ({
            title: t.title,
            amount: t.amount,
            type: t.type,
            category: t.category,
            notes: t.notes || (profile.aiProvider === 'ollama' ? 'Vía Ollama' : 'En efectivo'),
            date: new Date().toISOString(),
            rawUtterance: text
          }))
        );
      }

      // 4. Save Agent Response
      addChatMessage({
        role: 'agent',
        content: data.summary || 'Movimientos en efectivo registrados correctamente.',
        timestamp: new Date().toISOString(),
        transactions: createdTxs
      });
    } catch (err: any) {
      addChatMessage({
        role: 'agent',
        content: `⚠️ Error al procesar con el agente (${profile.aiProvider}): ${err.message}`,
        timestamp: new Date().toISOString(),
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Hice 15000 en un trabajo hoy',
    'Vendí 8500 en productos',
    '1800 en gasolina y 350 en botero',
    '1200 en cerveza y 3400 en bodega',
    '500 pesos recarga ETECSA'
  ];

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* Real Cash Flow Card (Variable Income & Cash in Hand) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 p-5 shadow-2xl space-y-4">
        {/* Glow ambient highlight */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              <Wallet className="w-3.5 h-3.5" /> Efectivo Físico en Mano
              {profile.aiProvider === 'ollama' && (
                <span className="ml-1 px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30 font-mono text-[9px]">
                  Ollama ({profile.ollamaModel || 'llama3.2'})
                </span>
              )}
            </div>
            <div className="text-3xl font-extrabold text-slate-100 tracking-tight mt-1 tabular-nums">
              ${summary.currentCashInHand.toLocaleString('es-MX')} <span className="text-sm font-semibold text-emerald-400">CUP</span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Flujo Neto Mes</span>
            <span className={`text-xs font-mono font-bold tabular-nums ${summary.monthlyNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary.monthlyNet >= 0 ? '+' : ''}${summary.monthlyNet.toLocaleString('es-MX')}
            </span>
          </div>
        </div>

        {/* Multi-metric stats row (Income vs Expense on the fly) */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2.5 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Generado Mes</span>
              <span className="text-sm font-bold text-emerald-400 tabular-nums">
                +${summary.monthlyIncome.toLocaleString('es-MX')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Gastado Mes</span>
              <span className="text-sm font-bold text-rose-400 tabular-nums">
                -${summary.monthlyExpenses.toLocaleString('es-MX')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Prompt Chips */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Anotaciones Rápidas de Dinero
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {quickPrompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(promptText)}
              className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 whitespace-nowrap shrink-0 transition active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* AI Chat Feed */}
      <div className="space-y-3 min-h-[220px]">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-3xl p-4 text-sm space-y-2 shadow-lg ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-slate-950 rounded-br-md font-semibold'
                  : msg.isError
                  ? 'bg-rose-950/80 border border-rose-800/80 text-rose-200 rounded-bl-md'
                  : 'bg-slate-900 border border-slate-800/80 text-slate-100 rounded-bl-md'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] opacity-80">
                <span className="font-bold flex items-center gap-1">
                  {msg.role === 'user' ? 'Tú (Efectivo)' : `FinanAI ${profile.aiProvider === 'ollama' ? 'Ollama' : 'Gemini'}`}
                </span>
                <span>
                  {new Date(msg.timestamp).toLocaleTimeString('es-CU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>

              {/* Parsed Transactions Cards inside Agent response */}
              {msg.transactions && msg.transactions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Registrado en BD Local ({msg.transactions.length})
                  </span>
                  <div className="space-y-1.5">
                    {msg.transactions.map(t => (
                      <div
                        key={t.id}
                        className="bg-slate-950/90 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-200 text-xs">{t.title}</div>
                          <div className="text-[10px] text-slate-400">{t.category}</div>
                        </div>
                        <div className={`font-mono font-bold text-xs ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('es-MX')} CUP
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl rounded-bl-md text-xs text-slate-400 flex items-center gap-3 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Bot className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span>
                Procesando con {profile.aiProvider === 'ollama' ? `Ollama Cloud (${profile.ollamaModel || 'llama3.2'})` : 'Gemini AI'}...
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Floating Input Controls */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-4 py-2 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          {/* Voice Input Button */}
          <button
            onClick={toggleVoiceInput}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition active:scale-95 shrink-0 shadow-lg ${
              isListening
                ? 'bg-rose-600 animate-pulse shadow-rose-600/40'
                : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300'
            }`}
            title={isListening ? 'Detener voz' : 'Hablar con la IA'}
          >
            {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* Text Prompt Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder={isListening ? 'Escuchando tu voz...' : 'Ej: hice 15000 en un trabajo y gasté 1800 en gasolina...'}
              disabled={loading}
              className="w-full h-12 pl-4 pr-11 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputPrompt.trim() || loading}
              className="absolute right-1.5 top-1.5 w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-slate-950 flex items-center justify-center transition active:scale-95 shadow-sm shadow-emerald-500/20 font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
