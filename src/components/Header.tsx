import React from 'react';
import { UserProfile } from '../types/finance';
import { Bot, WifiOff, Sparkles, User, Banknote } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HeaderProps {
  profile: UserProfile;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ profile, onOpenSettings }) => {
  const isOnline = useOnlineStatus();

  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 transition-colors">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* User Info & App Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-500 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'L'}
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                <Banknote className="w-3 h-3 inline" /> Efectivo Cuba
              </span>
              {!isOnline && (
                <span className="px-1.5 py-0.2 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md flex items-center gap-1">
                  <WifiOff className="w-2.5 h-2.5" /> Offline
                </span>
              )}
            </div>
            <h1 className="text-sm font-bold text-slate-100 tracking-tight leading-none mt-1">
              FinanAI · {profile.name || 'Mi Cuenta'}
            </h1>
          </div>
        </div>

        {/* Currency & Quick Settings */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 flex items-center gap-1 shadow-sm">
            🇨🇺 {profile.currency || 'CUP ($)'}
          </span>

          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 transition active:scale-95"
            aria-label="Ajustes"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
