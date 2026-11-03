import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TabBar, TabType } from './components/TabBar';
import { AgentTab } from './components/AgentTab';
import { HistoryTab } from './components/HistoryTab';
import { StatsTab } from './components/StatsTab';
import { SettingsTab } from './components/SettingsTab';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { getUserProfile } from './db/storage';
import { checkDailyReminder } from './services/notifications';
import { UserProfile } from './types/finance';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('estadisticas');
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());

  const refreshProfile = () => {
    setProfile(getUserProfile());
  };

  useEffect(() => {
    refreshProfile();
    window.addEventListener('finan_storage_updated', refreshProfile);

    // Daily push reminder check
    checkDailyReminder();
    const interval = setInterval(() => checkDailyReminder(), 60000);

    return () => {
      window.removeEventListener('finan_storage_updated', refreshProfile);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 flex flex-col">
      {/* iOS PWA Install Banner */}
      <PWAInstallBanner />

      {/* Top iOS Header */}
      <Header profile={profile} onOpenSettings={() => setActiveTab('ajustes')} />

      {/* Main View Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-2 overflow-hidden flex flex-col">
        {activeTab === 'estadisticas' && <StatsTab />}
        {activeTab === 'agente' && <AgentTab profile={profile} />}
        {activeTab === 'historial' && <HistoryTab />}
        {activeTab === 'ajustes' && <SettingsTab profile={profile} />}
      </main>

      {/* iOS Floating Bottom Tab Bar */}
      <TabBar activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}
