import React from 'react';
import { Screen, NavItem } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const navItems: NavItem[] = [
  { id: Screen.DailyLog, label: 'Diário', icon: 'book_2' },
  { id: Screen.Dashboard, label: 'Estatísticas', icon: 'bar_chart' },
  { id: Screen.Goals, label: 'Metas', icon: 'flag' },
  { id: Screen.Agreements, label: 'Acordos', icon: 'handshake' },
  { id: Screen.Settings, label: 'Config', icon: 'settings' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-card-dark/95 backdrop-blur-lg border-t border-border-light dark:border-border-dark shadow-nav pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around w-full h-16 px-1">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                isActive ? 'text-primary' : 'text-text-muted hover:text-primary/70'
              }`}
            >
              <div className="relative">
                <span className={`material-symbols-rounded text-[24px] ${isActive ? 'font-medium' : 'opacity-70'}`}>
                  {item.icon}
                </span>
                {isActive && item.id === Screen.DailyLog && (
                   <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'font-bold' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};