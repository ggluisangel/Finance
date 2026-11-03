import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, Transaction } from '../types/finance';
import { getFinancialSummary, addChatMessage, addTransactions, getChatMessages, clearChatHistory } from '../db/storage';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Bot, Send, Mic, MicOff, Sparkles, Trash2, CheckCircle2, WifiOff, Lock } from 'lucide-react';

interface AgentTabProps {
  profile: UserProfile;
}

export const AgentTab: React.FC<AgentTabProps> = ({ profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const isOnline = useOnlineStatus();
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
    if (!isOnline) {
      alert('Estás en modo sin conexión. Puedes revisar tus datos pero para usar la IA necesitas conexión.');
      return;
    }

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

  const handleClearChat = () => {
    if (confirm('¿Deseas reiniciar la conversación de la IA?')) {
      clearChatHistory();
      loadMessages();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || loading) return;

    if (!isOnline) {
      alert('Modo Sin Conexión: La PWA te permite visualizar todas tus estadísticas y conversaciones guardadas. Para enviar nuevos mensajes al agente de IA se requiere conexión.');
      return;
    }

    setInputPrompt('');

    // 1. Save User Message
    addChatMessage({
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    });

    setLoading(true);

    try {
      // 2. Call Server API endpoint with userId
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
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

      // 3. Save extracted transactions to local DB cache
      let createdTxs: Transaction[] = [];
      if (data.transactions && data.transactions.length > 0) {
        createdTxs = addTransactions(
          data.transactions.map((t: any) => ({
            id: t.id,
            title: t.title,
            amount: t.amount,
            type: t.type,
            category: t.category,
            notes: t.notes || (profile.aiProvider === 'ollama' ? 'Vía Ollama' : 'En efectivo'),
            date: t.date || new Date().toISOString(),
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
    <div className="flex flex-col h-[calc(100vh-140px)] pb-24 relative">
      {/* Offline Banner when disconnected */}
      {!isOnline && (
        <div className="mb-2 bg-amber-500/20 border border-amber-500/40 text-amber-200 p-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Modo Lectura Sin Conexión — Todo tu historial de chat y movimientos están disponibles para visualizar.</span>
          </div>
        </div>
      )}

      {/* Exclusive Chat Header Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex items-center justify-between shrink-0 mb-3 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-100">Agente de IA Financiero</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                {profile.aiProvider === 'ollama' ? `Ollama (${profile.ollamaModel || 'llama3.2'})` : 'Gemini AI'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Usuario SQLite: <strong>{profile.name || 'Invitado'}</strong></p>
          </div>
        </div>

        {/* Clear Chat Button */}
        <button
          onClick={handleClearChat}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:border-rose-800/80 border border-slate-700/60 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shrink-0"
          title="Limpiar conversación del chat"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Limpiar Chat</span>
        </button>
      </div>

      {/* Quick Suggestions Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 shrink-0 no-scrollbar">
        {quickPrompts.map((promptText, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(promptText)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 whitespace-nowrap shrink-0 transition active:scale-95 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            {promptText}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 no-scrollbar">
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
                  {msg.role === 'user' ? `${profile.name || 'Tú'} (Efectivo)` : `FinanAI ${profile.aiProvider === 'ollama' ? 'Ollama' : 'Gemini'}`}
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
                    <CheckCircle2 className="w-3.5 h-3.5" /> Registrado en BD SQLite ({msg.transactions.length})
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
                Sincronizando con SQLite y procesando con {profile.aiProvider === 'ollama' ? `Ollama Cloud (${profile.ollamaModel || 'llama3.2'})` : 'Gemini AI'}...
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Floating Bottom Input Controls */}
      <div className="sticky bottom-0 left-0 right-0 z-30 pt-2 pb-1 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
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
              placeholder={isListening ? 'Escuchando tu voz...' : isOnline ? 'Escribe o habla: hice 15000 en un trabajo...' : 'Sin conexión — Modo lectura de historial'}
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
