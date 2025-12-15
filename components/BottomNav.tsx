import React from 'react';
import { Screen } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';

interface BottomNavProps {
  activeScreen: Screen;
  setScreen: (screen: Screen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, setScreen }) => {
  const navItems = [
    { screen: 'home' as Screen, icon: HomeIcon, label: '홈' },
    { screen: 'memo' as Screen, icon: ClipboardIcon, label: '메모' },
    { screen: 'settings' as Screen, icon: SettingsIcon, label: '설정' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-bathlance-cream/95 via-bathlance-cream/90 to-bathlance-cream/85 backdrop-blur-sm shadow-cute-lg border-t-2 border-bathlance-orange/20 p-2 flex justify-around items-center rounded-t-cute">
      {navItems.map(({ screen, icon: Icon, label }) => (
        <button
          key={screen}
          onClick={() => setScreen(screen)}
          className={`flex flex-col items-center justify-center p-3 rounded-cute transition-all duration-300 ${
            activeScreen === screen
              ? 'text-bathlance-orange bg-white/60 shadow-cute scale-110'
              : 'text-bathlance-brown/60 hover:text-bathlance-orange hover:bg-white/40'
          }`}
        >
          <Icon className="w-8 h-8" />
          <span className={`text-xs mt-1 font-bold ${activeScreen === screen ? 'opacity-100' : 'opacity-0'} transition-opacity`}>{label}</span>
        </button>
      ))}
    </nav>
  );
};
