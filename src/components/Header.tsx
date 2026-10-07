import React, { useState, useEffect } from 'react';
import { TabType, AppTheme, AudioQuality } from '../types';
import { REZBEATSAI_LOGO_URL } from '../data/musicData';
import { getAuthUser, getAppTheme, setAppTheme, getAudioQuality } from '../services/musicService';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentTab: TabType;
  onNavigate: (tab: TabType) => void;
  onOpenQuality?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onNavigate, onOpenQuality }) => {
  const [user, setUser] = useState(getAuthUser());
  const [theme, setTheme] = useState<AppTheme>(getAppTheme());
  const [quality, setQuality] = useState<AudioQuality>(getAudioQuality());

  useEffect(() => {
    const handleAuthChange = (e: any) => {
      if (e.detail) setUser(e.detail);
    };
    const handleThemeChange = (e: any) => {
      if (e.detail) setTheme(e.detail);
    };
    const handleQualityChange = (e: any) => {
      if (e.detail) setQuality(e.detail);
    };

    window.addEventListener('rezbeatsai_auth_change', handleAuthChange);
    window.addEventListener('rezbeatsai_theme_change', handleThemeChange);
    window.addEventListener('rezbeatsai_quality_change', handleQualityChange);

    return () => {
      window.removeEventListener('rezbeatsai_auth_change', handleAuthChange);
      window.removeEventListener('rezbeatsai_theme_change', handleThemeChange);
      window.removeEventListener('rezbeatsai_quality_change', handleQualityChange);
    };
  }, []);

  const cycleTheme = () => {
    const nextTheme: AppTheme =
      theme === 'dark' ? 'light' : theme === 'light' ? 'sunset' : 'dark';
    setTheme(nextTheme);
    setAppTheme(nextTheme);
  };

  const getThemeLabel = (t: AppTheme) => {
    if (t === 'light') return 'Light';
    if (t === 'sunset') return 'Sunset';
    return 'Dark';
  };

  return (
    <header className="app-header fixed top-0 inset-x-0 z-40 backdrop-blur-xl border-b transition-all">
      {/* Main Bar */}
      <div className="max-w-[1720px] mx-auto h-14 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('home')} 
          aria-label="RezbeatsAi home"
          className="app-focusable flex items-center gap-2.5 cursor-pointer select-none group bg-transparent border-0 text-left"
        >
          <div className="relative">
            <img
              src={REZBEATSAI_LOGO_URL}
              alt="RezbeatsAi Logo"
              className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl tracking-tight text-[#e3e2e8] font-bold font-display">RezbeatsAi</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#7928ca]/25 text-[#dbb8ff] text-[10px] font-medium border border-[#dbb8ff]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#dbb8ff] animate-pulse"></span>
              {getThemeLabel(theme)}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Theme Quick Switcher button */}
          <button
            type="button"
            onClick={cycleTheme}
            title={`Switch Theme (Current: ${getThemeLabel(theme)})`}
            aria-label={`Switch theme. Current theme: ${getThemeLabel(theme)}`}
            className="app-header-control app-focusable w-10 h-10 rounded-full border flex items-center justify-center hover:bg-[#2a2b34] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">
              {theme === 'light' ? 'light_mode' : theme === 'sunset' ? 'wb_sunny' : 'dark_mode'}
            </span>
          </button>

          {/* Audio Quality Badge */}
          <button
            type="button"
            onClick={onOpenQuality}
            title="Streaming Quality"
            aria-label={`Streaming quality: ${quality === '320k' ? '320 kilobits per second' : quality}`}
            className="app-header-control app-focusable min-h-10 px-3 py-1 rounded-full border text-[10px] font-mono font-bold text-[#1db954] hover:bg-[#2a2b34] transition-all cursor-pointer hidden sm:flex items-center gap-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#1db954]"></span>
            <span>{quality === '320k' ? '320k HD' : quality}</span>
          </button>

          {/* User Profile Avatar */}
          <button
            type="button"
            aria-label={`Profile - ${user.name}`}
            onClick={() => onNavigate('profile')}
            className={`app-focusable w-10 h-10 flex items-center justify-center rounded-full transition-all cursor-pointer relative ${
              currentTab === 'profile'
                ? 'app-profile-ring ring-2 ring-[#dbb8ff] ring-offset-2'
                : 'hover:ring-1 hover:ring-[#dbb8ff]/50'
            }`}
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-white/10"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#1db954] border-2 border-[#121317]"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
