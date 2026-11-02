import React, { useState } from 'react';
import { UserProfile, AIProvider } from '../types/finance';
import { saveUserProfile, clearAllTransactions, getTransactions } from '../db/storage';
import { requestNotificationPermission, testPushNotification } from '../services/notifications';
import { User, Key, Bell, Database, Download, Trash2, CheckCircle2, Cpu, Globe, Server } from 'lucide-react';

interface SettingsTabProps {
  profile: UserProfile;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ profile }) => {
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
      name: name.trim() || 'Luis Ángel',
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
    a.download = `finan_ai_cuba_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleResetData = () => {
    if (confirm('¿Estás seguro de reiniciar todos los datos locales? Se borrarán los registros en efectivo.')) {
      clearAllTransactions();
      alert('Base de datos restablecida correctamente.');
    }
  };

  return (
    <div className="space-y-4 pb-24 pt-2">
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Ajustes & Configuración</h2>
        <p className="text-xs text-slate-400">Perfil de usuario, Proveedor de IA (Ollama Cloud / Gemini), notificaciones y base de datos local</p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" /> Configuración guardada con éxito en tu dispositivo.
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-4">
        {/* User Profile Card */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-4 h-4 text-emerald-400" /> Registro de Usuario
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Nombre del Usuario</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre (ej. Luis Ángel)"
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <label className="block font-semibold text-slate-300 mb-1">Base de Efectivo Inicial ($)</label>
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
        </div>

        {/* AI Engine & Provider Switcher (Ollama Cloud vs Gemini) */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" /> Agente de IA & Motor
            </h3>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full font-bold">
              {aiProvider === 'ollama' ? 'Ollama Cloud' : 'Gemini AI'}
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Seleccionar Motor de IA</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAiProvider('ollama')}
                  className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                    aiProvider === 'ollama' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-400'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" /> Ollama Cloud
                </button>
                <button
                  type="button"
                  onClick={() => setAiProvider('gemini')}
                  className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                    aiProvider === 'gemini' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30' : 'text-slate-400'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" /> Gemini AI
                </button>
              </div>
            </div>

            {/* Ollama Cloud Configuration */}
            {aiProvider === 'ollama' && (
              <div className="space-y-3 p-3.5 bg-slate-950/80 border border-purple-500/30 rounded-2xl animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Configuración de Ollama Cloud / Host
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Ollama Host URL</label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={e => setOllamaUrl(e.target.value)}
                    placeholder="https://api.ollama.com o http://localhost:11434"
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nombre del Modelo Ollama</label>
                  <input
                    type="text"
                    value={ollamaModel}
                    onChange={e => setOllamaModel(e.target.value)}
                    placeholder="llama3.2, qwen2.5, mistral, deepseek-r1..."
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">API Key / Token Ollama Cloud (Opcional)</label>
                  <input
                    type="password"
                    value={ollamaApiKey}
                    onChange={e => setOllamaApiKey(e.target.value)}
                    placeholder="Bearer token o API Key si tu host lo requiere..."
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Gemini Custom Key option */}
            {aiProvider === 'gemini' && (
              <div className="space-y-2 p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <label className="block font-semibold text-slate-300">Gemini Custom API Key (Opcional)</label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={e => setCustomApiKey(e.target.value)}
                  placeholder="Dejar en blanco para usar la del servidor..."
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Push Notifications & Daily Reminders */}
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Bell className="w-4 h-4 text-emerald-400" /> Notificaciones Push & Recordatorios
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Recordatorio Diario en Efectivo</span>
                <span className="text-[11px] text-slate-400">Te avisa si al terminar el día no has anotado lo que ganaste o gastaste.</span>
              </div>
              <button
                type="button"
                onClick={handleTogglePush}
                className={`w-12 h-6 rounded-full p-1 transition duration-200 ease-in-out ${
                  pushEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition transform duration-200 ease-in-out ${
                    pushEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {pushEnabled && (
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <div>
                  <label className="block font-semibold text-slate-300">Hora del Recordatorio</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={e => setReminderTime(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs mt-1"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition"
                >
                  Probar Notificación
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition"
        >
          Guardar Cambios
        </button>
      </form>

      {/* Local DB Management */}
      <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="w-4 h-4 text-cyan-400" /> Base de Datos Local
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={handleExportJSON}
            className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Exportar Backup JSON
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="p-3 rounded-2xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800 text-rose-300 font-semibold flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Trash2 className="w-4 h-4 text-rose-400" /> Borrar Datos
          </button>
        </div>
      </div>
    </div>
  );
};
