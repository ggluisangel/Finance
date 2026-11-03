import React from 'react';
import { PieChart, Bot, History, Settings } from 'lucide-react';

export type TabType = 'estadisticas' | 'agente' | 'historial' | 'ajustes';

interface TabBarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onChangeTab }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'estadisticas',
      label: 'Estadísticas',
      icon: <PieChart className="w-5 h-5" />
    },
    {
      id: 'agente',
      label: 'Agente AI',
      icon: <Bot className="w-5 h-5" />
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: <History className="w-5 h-5" />
    },
    {
      id: 'ajustes',
      label: 'Ajustes',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/80 pb-safe">
      <div className="max-w-xl mx-auto grid grid-cols-4 items-center h-16 px-2">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${
                isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-transparent'
              }`}>
                {tab.icon}
              </div>
              <span className={`text-[11px] tracking-tight mt-0.5 ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 font-medium'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
