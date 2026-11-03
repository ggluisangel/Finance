import React, { useState } from 'react';
import { UserProfile, AIProvider } from '../types/finance';
import { saveUserProfile, clearAllTransactions, getTransactions, resetUserDataAPI } from '../db/storage';
import { requestNotificationPermission, testPushNotification } from '../services/notifications';
import { User, Key, Bell, Database, Download, Trash2, CheckCircle2, Cpu, Globe, Server, LogOut, ShieldCheck } from 'lucide-react';

interface SettingsTabProps {
  profile: UserProfile;
  onLogout: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ profile, onLogout }) => {
  const [name, setName] = useState(profile.name || '');
  const [currency, setCurrency] = useState(profile.currency || 'CUP ($)');
  const [initialCashBalance, setInitialCashBalance] = useState((profile.initialCashBalance || 0).toString());
  
  // AI Settings
  const [aiProvider, setAiProvider] = useState<AIProvider>(profile.aiProvider || 'gemini');
  const [customApiKey, setCustomApiKey] = useState(profile.customApiKey || '');
  const [ollamaUrl, setOllamaUrl] = useState(profile.ollamaUrl || 'https://api.ollama.com');
  const [ollamaModel, setOllamaModel] = useState(profile.ollamaModel || 'llama3.2');
  const [ollamaApiKey, setOllamaApiKey] = useState(profile.ollamaApiKey || '');

  // Notifications
  const [pushEnabled, setPushEnabled] = useState(profile.pushEnabled ?? true);
  const [reminderTime, setReminderTime] = useState(profile.reminderTime || '20:00');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const initialNum = parseFloat(initialCashBalance);

    saveUserProfile({
      name: name.trim() || profile.name,
      currency,
      initialCashBalance: isNaN(initialNum) ? 0 : initialNum,
      aiProvider,
      customApiKey: customApiKey.trim(),
      ollamaUrl: ollamaUrl.trim(),
      ollamaModel: ollamaModel.trim(),
      ollamaApiKey: ollamaApiKey.trim(),
      pushEnabled,
      reminderTime
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTogglePush = async () => {
    if (!pushEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Las notificaciones no están permitidas en tu navegador. Revisa los permisos de tu iPhone/navegador.');
      }
    }
    setPushEnabled(!pushEnabled);
  };

  const handleTestNotification = () => {
    testPushNotification();
  };

  const handleExportJSON = () => {
    const txs = getTransactions();
    const data = {
      profile,
      transactions: txs,
      exportedAt: new Date().toISOString()
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finan_ai_sqlite_backup_${profile.name}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleResetAccountToZero = async () => {
    if (confirm(`¿Estás seguro, ${profile.name}? Esto borrará todas tus transacciones y chat en la base de datos de SQLite, poniendo todo en 0 CUP.`)) {
      const success = await resetUserDataAPI();
      if (success) {
        alert('¡Cuenta restablecida a 0 CUP correctamente!');
        window.location.reload();
      } else {
        alert('Error al restablecer la cuenta en el servidor.');
      }
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Ajustes & Configuración</h2>
          <p className="text-xs text-slate-400">Usuario SQLite activo: <strong className="text-emerald-400">{profile.name}</strong></p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
        </button>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Configuración guardada en tu perfil de SQLite.
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-4">
        {/* User Preferences Card */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-4 h-4 text-emerald-400" /> Preferencias de Cuenta
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Moneda Principal</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="CUP ($)">CUP ($ Pesos Cubanos)</option>
                <option value="USD ($)">USD ($ Dólares)</option>
                <option value="EUR (€)">EUR (€ Euros)</option>
                <option value="MLC ($)">MLC ($)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Efectivo Inicial ($)</label>
              <input
                type="number"
                value={initialCashBalance}
                onChange={e => setInitialCashBalance(e.target.value)}
                placeholder="0"
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* AI Engine Config */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" /> Motor de IA
            </h3>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full font-bold">
              {aiProvider === 'ollama' ? 'Ollama Cloud' : 'Gemini AI'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setAiProvider('ollama')}
                className={`py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                  aiProvider === 'ollama' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400'
                }`}
              >
                <Server className="w-3.5 h-3.5" /> Ollama Cloud
              </button>
              <button
                type="button"
                onClick={() => setAiProvider('gemini')}
                className={`py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                  aiProvider === 'gemini' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" /> Gemini AI
              </button>
            </div>

            {aiProvider === 'ollama' && (
              <div className="space-y-2.5 p-3 bg-slate-950/80 border border-purple-500/30 rounded-2xl text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Ollama Host URL</label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={e => setOllamaUrl(e.target.value)}
                    placeholder="https://api.ollama.com"
                    className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Modelo Ollama</label>
                  <input
                    type="text"
                    value={ollamaModel}
                    onChange={e => setOllamaModel(e.target.value)}
                    placeholder="llama3.2, qwen2.5..."
                    className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Push Notifications */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" /> Recordatorio Diario
            </h3>
            <button
              type="button"
              onClick={handleTogglePush}
              className={`w-12 h-6 rounded-full p-1 transition ${pushEnabled ? 'bg-emerald-500' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-slate-950 transition transform ${pushEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {pushEnabled && (
            <div className="flex items-center justify-between text-xs pt-1">
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="h-9 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleTestNotification}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs"
              >
                Probar
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl active:scale-[0.98] transition"
        >
          Guardar Cambios en SQLite
        </button>
      </form>

      {/* Account Reset & Data Management */}
      <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="w-4 h-4 text-cyan-400" /> Gestión de Datos
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={handleExportJSON}
            className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Exportar JSON
          </button>

          <button
            type="button"
            onClick={handleResetAccountToZero}
            className="p-3 rounded-2xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 font-semibold flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Trash2 className="w-4 h-4 text-rose-400" /> Poner Cuenta a 0
          </button>
        </div>
      </div>
    </div>
  );
};
