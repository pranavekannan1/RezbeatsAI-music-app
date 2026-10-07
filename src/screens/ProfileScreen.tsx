import React, { useState, useEffect } from 'react';
import { UserAuthProfile, AppTheme, AudioQuality, UserTasteProfile } from '../types';
import {
  getAuthUser,
  getAppTheme,
  setAppTheme,
  getAudioQuality,
  formatQualityLabel,
  getOnRepeatTracks,
  getUserTasteProfile,
  updateUserProfile,
} from '../services/musicService';
import { ThemeSelector } from '../components/ThemeSelector';
import { logoutFromFirebase } from '../services/firebase';
import { AudioQualitySelector } from '../components/AudioQualitySelector';

export const ProfileScreen: React.FC = () => {
  const [user, setUser] = useState<UserAuthProfile>(getAuthUser());
  const [theme, setTheme] = useState<AppTheme>(getAppTheme());
  const [quality, setQuality] = useState<AudioQuality>(getAudioQuality());
  const [onRepeatList, setOnRepeatList] = useState<{ track: any; playCount: number }[]>([]);
  const [tasteProfile, setTasteProfile] = useState<UserTasteProfile | null>(null);

  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user.name);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    refreshProfile();

    const handleAuthChange = (e: any) => {
      if (e.detail) {
        setUser(e.detail);
        setEditedName(e.detail.name);
      }
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

  const refreshProfile = () => {
    const current = getAuthUser();
    setUser(current);
    setEditedName(current.name);
    setTheme(getAppTheme());
    setQuality(getAudioQuality());
    setOnRepeatList(getOnRepeatTracks());
    setTasteProfile(getUserTasteProfile());
  };

  const handleSaveName = () => {
    if (!editedName.trim()) return;
    const updated = updateUserProfile({ name: editedName.trim() });
    setUser(updated);
    setIsEditingName(false);
    showToast(`Name updated to ${updated.name}`);
  };

  const handleLogout = async () => {
    await logoutFromFirebase();
    showToast('Logged out successfully');
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    setAppTheme(newTheme);
    showToast(`Theme changed to ${newTheme.toUpperCase()}`);
  };

  const qualityInfo = formatQualityLabel(quality);

  return (
    <div className="flex flex-col w-full space-y-6 pb-36 pt-2 select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1e1f26] text-white shadow-2xl flex items-center gap-2 border border-[#dbb8ff]/40 text-xs font-semibold backdrop-blur-md animate-fade-in pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-[#1db954]"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* User Info Header Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1a1b22] to-[#121317] p-5 sm:p-6 border border-white/[0.08] shadow-xl flex flex-col items-center text-center">
        {/* Ambient background glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#7928ca]/25 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#7928ca] via-[#508eff] to-[#1db954] shadow-[0_0_25px_rgba(121,40,202,0.5)]">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="absolute bottom-0 right-0 px-2 py-0.5 rounded-full bg-[#0d0e12] border border-[#dbb8ff]/40 text-[10px] font-bold text-[#dbb8ff] flex items-center gap-1 shadow-md">
            <span className="material-symbols-outlined text-xs text-[#1db954]">verified</span>
            <span>{user.plan}</span>
          </div>
        </div>

        {/* User Name & Email */}
        {isEditingName ? (
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="px-3 py-1 bg-[#24252e] border border-[#dbb8ff] rounded-xl text-sm font-bold text-[#e3e2e8] focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleSaveName}
              className="px-3 py-1 rounded-xl bg-[#dbb8ff] text-[#2b0052] font-bold text-xs cursor-pointer"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mt-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#e3e2e8] font-display">
              {user.name}
            </h1>
            <button
              onClick={() => setIsEditingName(true)}
              className="text-[#cec2d6]/60 hover:text-white p-1"
              title="Edit Name"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>
        )}

        <p className="text-xs text-[#dbb8ff] mt-0.5 font-mono">
          {user.email}
        </p>
        <p className="text-[11px] text-[#cec2d6]/70 mt-0.5">
          {user.joinedDate} • <strong className="text-[#dbb8ff]">Hi-Fi Streaming Active</strong>
        </p>

        {/* Account Controls */}
        <div className="flex items-center gap-2 mt-3.5 flex-wrap justify-center">
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 rounded-full bg-[#3a1d22] text-[#ffb1c5] text-xs font-semibold hover:bg-[#4a242a] transition-colors border border-rose-500/20 cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Log Out</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/[0.06]">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-[#e3e2e8] font-mono">
              FLAC / HD
            </span>
            <span className="text-[10px] text-[#cec2d6] uppercase tracking-wider mt-0.5">
              Audio Engine
            </span>
          </div>
          <div className="flex flex-col items-center border-x border-white/[0.06]">
            <span className="text-lg font-bold text-[#dbb8ff] font-mono">
              Smart Engine
            </span>
            <span className="text-[10px] text-[#cec2d6] uppercase tracking-wider mt-0.5">
              Music Tracking
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-[#1db954] font-mono">
              320k HD
            </span>
            <span className="text-[10px] text-[#cec2d6] uppercase tracking-wider mt-0.5">
              Bitrate
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 🎨 THREE UI THEMES SWITCHER (Requested) */}
      {/* ========================================================= */}
      <section className="rounded-3xl bg-[#1a1b22] p-4 sm:p-5 border border-white/[0.08] shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#7928ca]/30 flex items-center justify-center text-[#dbb8ff]">
              <span className="material-symbols-outlined text-base">palette</span>
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#e3e2e8] font-display">
                UI Themes (3 Distinct Palettes)
              </h2>
              <p className="text-[11px] text-[#cec2d6]/70">
                Choose your visual mood: Twilight Obsidian, Sapphire Midnight, or Sandalwood Sunset
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#dbb8ff] uppercase px-2 py-0.5 rounded-full bg-white/[0.06]">
            {theme}
          </span>
        </div>

        <ThemeSelector onThemeChange={handleThemeChange} />
      </section>

      {/* ========================================================= */}
      {/* 🎚️ AUDIO STREAMING QUALITY SELECTOR (Requested) */}
      {/* ========================================================= */}
      <section className="rounded-3xl bg-[#1a1b22] p-4 sm:p-5 border border-white/[0.08] shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#1db954]/20 flex items-center justify-center text-[#1db954]">
              <span className="material-symbols-outlined text-base">graphic_eq</span>
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#e3e2e8] font-display">
                Audio Streaming Quality
              </h2>
              <p className="text-[11px] text-[#cec2d6]/70">
                Configure preferred bitrate for zero-lag streaming
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsQualityModalOpen(true)}
            className="text-xs text-[#1db954] hover:underline font-bold cursor-pointer"
          >
            Change
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#22232c] border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1db954]/20 text-[#1db954] flex items-center justify-center font-bold font-mono text-xs">
              {qualityInfo.badge}
            </div>
            <div>
              <p className="text-xs font-bold text-[#e3e2e8]">{qualityInfo.label}</p>
              <p className="text-[11px] text-[#cec2d6]/70">{qualityInfo.desc}</p>
            </div>
          </div>

          <button
            onClick={() => setIsQualityModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-xs font-bold text-[#e3e2e8] cursor-pointer"
          >
            Select Bitrate
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 🔁 USER'S REPEATED SONGS & LISTENING TASTE */}
      {/* ========================================================= */}
      <section className="rounded-3xl bg-[#1a1b22] p-4 sm:p-5 border border-white/[0.08] shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#7928ca]/30 flex items-center justify-center text-[#dbb8ff]">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#e3e2e8] font-display">
                Your Music Taste & Preferences
              </h2>
              <p className="text-[11px] text-[#cec2d6]/70">
                Continuously adapted by smart listening intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Top Artists & Dominant Taste */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#22232c] border border-white/[0.04]">
            <span className="text-[10px] text-[#cec2d6] uppercase tracking-wider font-semibold block mb-1">
              Top Listened Artist
            </span>
            <p className="text-xs font-bold text-[#dbb8ff] truncate">
              {tasteProfile?.topArtists[0]?.name || 'Arijit Singh & Tito Dutta'}
            </p>
            <p className="text-[10px] text-[#cec2d6]/70">
              Personalized Priority
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#22232c] border border-white/[0.04]">
            <span className="text-[10px] text-[#cec2d6] uppercase tracking-wider font-semibold block mb-1">
              Dominant Cultural Mood
            </span>
            <p className="text-xs font-bold text-[#1db954] truncate">
              {tasteProfile?.dominantMood || 'Soulful & Raga Resonance'}
            </p>
            <p className="text-[10px] text-[#cec2d6]/70">
              Acoustic / Classical bias
            </p>
          </div>
        </div>

        {/* Top Favorite Songs List */}
        {onRepeatList.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-[#e3e2e8] mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#dbb8ff]">favorite</span>
              <span>Your Rotation Favorites</span>
            </h3>

            <div className="space-y-2">
              {onRepeatList.slice(0, 3).map(({ track }, idx) => (
                <div
                  key={track.id}
                  className="p-2.5 rounded-xl bg-[#22232c] border border-white/[0.04] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-mono font-bold text-[#dbb8ff] w-4">#{idx + 1}</span>
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#e3e2e8] truncate">{track.title}</p>
                      <p className="text-[10px] text-[#cec2d6]/70 truncate">{track.artist}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#7928ca]/25 text-[#dbb8ff] flex-shrink-0">
                    Favorite
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Smart Recommendations & Autoplay Queue */}
      <section className="rounded-3xl bg-[#1a1b22] p-4 sm:p-5 border border-white/[0.08] shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-[#1db954]">stream</span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#e3e2e8] font-display">
                Smart Autoplay Queue
              </h2>
              <p className="text-[11px] text-[#cec2d6]/70">
                Autoplay tailored to your taste
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#1db954] px-2 py-0.5 rounded-full bg-[#1db954]/20 border border-[#1db954]/30">
            Active
          </span>
        </div>

        <p className="text-xs text-[#cec2d6]/80 leading-relaxed">
          RezbeatsAi continuously updates your queue based on your listening history, liked tracks, and favorite genres.
        </p>
      </section>

      <AudioQualitySelector
        isOpen={isQualityModalOpen}
        onClose={() => setIsQualityModalOpen(false)}
        onQualityChange={(q) => {
          setQuality(q);
          showToast(`Audio quality set to ${q}`);
        }}
      />
    </div>
  );
};
