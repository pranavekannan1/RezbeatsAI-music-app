import React from 'react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  return (
    <nav aria-label="Main navigation" className="app-bottom-nav fixed bottom-0 inset-x-0 z-50 backdrop-blur-2xl border-t">
      <div className="flex justify-around items-center h-20 px-4 pb-[env(safe-area-inset-bottom)] relative max-w-[1720px] mx-auto">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          aria-current={currentTab === 'home' ? 'page' : undefined}
          className={`app-nav-item app-focusable flex flex-col items-center justify-center gap-1 min-w-16 min-h-16 rounded-xl transition-all cursor-pointer ${
            currentTab === 'home'
              ? 'font-bold scale-105'
              : ''
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">home</span>
          <span className="text-[11px] tracking-wide">Home</span>
        </button>

        {/* 2. Explore / Search */}
        <button
          type="button"
          onClick={() => onTabChange('discover')}
          aria-current={currentTab === 'discover' ? 'page' : undefined}
          className={`app-nav-item app-focusable flex flex-col items-center justify-center gap-1 min-w-16 min-h-16 rounded-xl transition-all cursor-pointer ${
            currentTab === 'discover'
              ? 'font-bold scale-105'
              : ''
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">search</span>
          <span className="text-[11px] tracking-wide">Search</span>
        </button>

        {/* 3. Live World Radio (24/7 free streams) */}
        <button
          type="button"
          onClick={() => onTabChange('radio')}
          aria-current={currentTab === 'radio' ? 'page' : undefined}
          className={`app-nav-item app-focusable flex flex-col items-center justify-center gap-1 min-w-16 min-h-16 rounded-xl transition-all cursor-pointer ${
            currentTab === 'radio'
              ? 'font-bold scale-105'
              : ''
          }`}
        >
          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">podcasts</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </div>
          <span className="text-[11px] tracking-wide">Radio</span>
        </button>

        {/* 4. Library */}
        <button
          type="button"
          onClick={() => onTabChange('library')}
          aria-current={currentTab === 'library' ? 'page' : undefined}
          className={`app-nav-item app-focusable flex flex-col items-center justify-center gap-1 min-w-16 min-h-16 rounded-xl transition-all cursor-pointer ${
            currentTab === 'library'
              ? 'font-bold scale-105'
              : ''
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">library_music</span>
          <span className="text-[11px] tracking-wide">Library</span>
        </button>

        {/* 5. Soundscape Studio */}
        <button
          type="button"
          onClick={() => onTabChange('studio')}
          aria-current={currentTab === 'studio' ? 'page' : undefined}
          className={`app-nav-item app-focusable flex flex-col items-center justify-center gap-1 min-w-16 min-h-16 rounded-xl transition-all cursor-pointer ${
            currentTab === 'studio'
              ? 'font-bold scale-105'
              : ''
          }`}
        >
          <span className="material-symbols-outlined text-[23px] app-nav-accent">
            graphic_eq
          </span>
          <span className="text-[10px] tracking-wide app-nav-accent">Studio</span>
        </button>
      </div>
    </nav>
  );
};
