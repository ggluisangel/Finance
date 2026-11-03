import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TabBar, TabType } from './components/TabBar';
import { AgentTab } from './components/AgentTab';
import { HistoryTab } from './components/HistoryTab';
import { StatsTab } from './components/StatsTab';
import { SettingsTab } from './components/SettingsTab';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { AuthModal } from './components/AuthModal';
import { getUserProfile, getStoredSession, saveSessionData, clearSession } from './db/storage';
import { checkDailyReminder } from './services/notifications';
import { UserProfile, Transaction, ChatMessage } from './types/finance';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('estadisticas');
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const refreshProfile = () => {
    setProfile(getUserProfile());
  };

  useEffect(() => {
    const session = getStoredSession();
    if (session && session.userId) {
      setIsAuthenticated(true);

      // Async sync from server SQLite if online
      if (navigator.onLine) {
        fetch(`/api/user/sync/${session.userId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.user) {
              saveSessionData({
                user: data.user,
                transactions: data.transactions || [],
                chatMessages: data.chatMessages || []
              });
              setProfile(data.user);
            }
          })
          .catch(err => console.warn('PWA Offline mode: Using cached SQLite data', err));
      }
    } else {
      setIsAuthenticated(false);
    }

    window.addEventListener('finan_storage_updated', refreshProfile);

    // Daily push reminder check
    checkDailyReminder();
    const interval = setInterval(() => checkDailyReminder(), 60000);

    return () => {
      window.removeEventListener('finan_storage_updated', refreshProfile);
      clearInterval(interval);
    };
  }, []);

  const handleLoginSuccess = (data: { user: UserProfile; transactions: Transaction[]; chatMessages: ChatMessage[] }) => {
    saveSessionData(data);
    setProfile(data.user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión de este dispositivo?')) {
      clearSession();
      setIsAuthenticated(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 flex flex-col">
      {/* Mandatory Auth Modal if not logged in */}
      {!isAuthenticated && <AuthModal onLoginSuccess={handleLoginSuccess} />}

      {/* iOS PWA Install Banner */}
      <PWAInstallBanner />

      {/* Top Header */}
      <Header
        profile={profile}
        onOpenSettings={() => setActiveTab('ajustes')}
        onLogout={handleLogout}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-2 overflow-hidden flex flex-col">
        {activeTab === 'estadisticas' && <StatsTab />}
        {activeTab === 'agente' && <AgentTab profile={profile} />}
        {activeTab === 'historial' && <HistoryTab />}
        {activeTab === 'ajustes' && <SettingsTab profile={profile} onLogout={handleLogout} />}
      </main>

      {/* iOS Floating Bottom Tab Bar */}
      <TabBar activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}
