import React, { useState } from 'react';
import { UserProfile, Transaction, ChatMessage } from '../types/finance';
import { Lock, User, Key, Sparkles, LogIn, UserPlus, AlertCircle, Banknote } from 'lucide-react';

interface AuthModalProps {
  onLoginSuccess: (data: { user: UserProfile; transactions: Transaction[]; chatMessages: ChatMessage[] }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Por favor escribe tu nombre de usuario y tu clave.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al iniciar sesión.');
      }

      onLoginSuccess({
        user: data.user,
        transactions: data.transactions || [],
        chatMessages: data.chatMessages || []
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión con la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800/80 p-6 shadow-2xl space-y-5 text-slate-100 relative overflow-hidden">
        {/* Glow ambient highlight */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 p-0.5 mx-auto shadow-xl shadow-emerald-500/20">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-emerald-400">
              <Banknote className="w-7 h-7" />
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight">FinanAI Cuba</h2>
          <p className="text-xs text-slate-400">
            {isRegister ? 'Crea tu usuario obligatorio para guardar tus datos en la BD SQLite del servidor' : 'Ingresa tu usuario y clave obligatoria para sincronizar tus finanzas'}
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-200 p-3 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Nombre de Usuario</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ej. luisangel"
                className="w-full h-11 pl-9 pr-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Clave / Contraseña</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Escribe tu clave..."
                className="w-full h-11 pl-9 pr-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Procesando...</span>
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" /> Crear Cuenta en SQLite
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="text-center border-t border-slate-800/80 pt-3">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMessage(null);
            }}
            className="text-xs text-emerald-400 hover:underline font-semibold"
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Registra tu usuario aquí'}
          </button>
        </div>
      </div>
    </div>
  );
};
