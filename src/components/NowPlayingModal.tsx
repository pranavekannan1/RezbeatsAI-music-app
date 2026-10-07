import React, { useState, useEffect } from 'react';
import { Track, AudioQuality, SongLyrics, TabType } from '../types';
import { audioEngine } from '../services/audioEngine';
import {
  saveLikedTrack,
  isTrackLiked,
  getUserPlaylists,
  addTrackToPlaylist,
  getAudioQuality,
  formatQualityLabel,
  getTrackLyrics,
} from '../services/musicService';
import { AudioQualitySelector } from './AudioQualitySelector';

interface NowPlayingModalProps {
  track: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  queue?: Track[];
  onOpenQueue?: () => void;
  currentTab?: TabType;
  onNavigate?: (tab: TabType) => void;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({
  track,
  isPlaying,
  onTogglePlay,
  onClose,
  onNextTrack,
  onPrevTrack,
  queue = [],
  onOpenQueue,
  currentTab = 'home',
  onNavigate,
}) => {
  const [activeMode, setActiveMode] = useState<'cover' | 'lyrics'>('cover');
  const [lyricsLang, setLyricsLang] = useState<'original' | 'english'>('original');
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [totalTimeSec, setTotalTimeSec] = useState(track.durationSec || 30);
  const [isLiked, setIsLiked] = useState(() => isTrackLiked(track.id, track.title));
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<AudioQuality>(getAudioQuality());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [lyricsData, setLyricsData] = useState<SongLyrics>(() => getTrackLyrics(track));

  // Sync state when track updates
  useEffect(() => {
    setIsLiked(isTrackLiked(track.id, track.title));
    if (track.durationSec) {
      setTotalTimeSec(track.durationSec);
    }
    setLyricsData(getTrackLyrics(track));
    setActiveMode('cover'); // Reset to cover artwork when track changes for speed
  }, [track]);

  // AudioEngine subscriptions
  useEffect(() => {
    const unsub = audioEngine.onTimeUpdate((current, duration) => {
      setCurrentTimeSec(current);
      if (duration > 0) {
        setTotalTimeSec(duration);
      }
    });
    return unsub;
  }, []);

  const formatTime = (seconds: number) => {
    if (track.isLiveRadio) return 'LIVE';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressFraction = totalTimeSec > 0 ? Math.min(1, currentTimeSec / totalTimeSec) : 0;

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (track.isLiveRadio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const target = pct * totalTimeSec;
    setCurrentTimeSec(target);
    audioEngine.seek(target);
  };

  const handleToggleLike = () => {
    const newLikedState = saveLikedTrack(track);
    setIsLiked(newLikedState);
    setToastMessage(newLikedState ? `Added "${track.title}" to Liked Songs` : `Removed "${track.title}"`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    audioEngine.setVolume(val);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume || 0.8);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  const cycleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  const handleAddToPlaylist = (playlistId: string) => {
    const added = addTrackToPlaylist(playlistId, track);
    setToastMessage(added ? 'Added to playlist!' : 'Song already in playlist');
    setShowPlaylistPicker(false);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // 48 Waveform bars
  const waveformBars = [
    20, 30, 45, 60, 75, 90, 65, 80, 95, 85, 55, 40, 70, 85, 100, 65, 45, 80,
    90, 55, 30, 50, 65, 85, 95, 70, 45, 30, 25, 45, 65, 75, 50, 40, 25, 20,
    30, 45, 60, 50, 35, 25, 18, 30, 42, 55, 35, 20,
  ];

  // Find active lyric line
  const activeLyricIndex = lyricsData.lines.reduce((acc, line, idx) => {
    if (currentTimeSec >= line.time) return idx;
    return acc;
  }, 0);

  return (
    <div className="fixed inset-x-0 top-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 bg-[#0c0d12] text-[#f1f0f7] flex flex-col justify-between overflow-y-auto overflow-x-hidden select-none animate-fade-in">
      {/* Dynamic atmospheric background glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-[#7928ca]/25 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] bg-[#508eff]/20 rounded-full blur-[140px]"></div>
      </div>

      {/* Floating toast notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#7928ca] text-white text-xs font-semibold rounded-full shadow-2xl border border-[#dbb8ff]/30 backdrop-blur-md animate-fade-in pointer-events-none">
          {toastMessage}
        </div>
      )}

      <div className="relative z-10 max-w-md w-full mx-auto min-h-screen flex flex-col justify-between p-4 sm:p-6 pb-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pt-1 pb-2">
          <button
            onClick={onClose}
            aria-label="Minimize player"
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#f1f0f7] hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">expand_more</span>
          </button>

          <div className="flex flex-col items-center text-center max-w-[220px]">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${track.isLiveRadio ? 'bg-rose-500 animate-ping' : 'bg-[#dbb8ff] animate-pulse'}`}></span>
              <span className="text-[10px] uppercase tracking-widest text-[#b8b0c2] font-bold">
                {track.isLiveRadio ? 'Live Broadcast' : 'Now Playing'}
              </span>
            </div>
            <h2 className="text-xs font-semibold text-[#f1f0f7] truncate mt-0.5">
              {track.album || 'Studio Master Stream'}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            {onOpenQueue && (
              <button
                onClick={onOpenQueue}
                aria-label="Open queue"
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#b8b0c2] hover:text-white hover:bg-white/10 transition-colors cursor-pointer relative"
              >
                <span className="material-symbols-outlined text-xl">queue_music</span>
                {queue.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#1db954]"></span>
                )}
              </button>
            )}

            <button
              onClick={() => setShowPlaylistPicker(true)}
              aria-label="Add to playlist"
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#b8b0c2] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">playlist_add</span>
            </button>
          </div>
        </div>

        {/* View Switcher: Artwork vs Lyrics */}
        <div className="flex items-center justify-center gap-1 bg-[#1a1b24] p-1 rounded-full border border-white/[0.08] mb-3 max-w-[260px] mx-auto w-full">
          <button
            onClick={() => setActiveMode('cover')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeMode === 'cover'
                ? 'bg-gradient-to-r from-[#7928ca] to-[#508eff] text-white shadow-md font-bold'
                : 'text-[#b8b0c2] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">album</span>
            <span>Cover Art</span>
          </button>
          
          <button
            onClick={() => setActiveMode('lyrics')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeMode === 'lyrics'
                ? 'bg-gradient-to-r from-[#7928ca] to-[#508eff] text-white shadow-md font-bold'
                : 'text-[#b8b0c2] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">lyrics</span>
            <span>Lyrics</span>
          </button>
        </div>

        {/* 1. COVER ARTWORK MODE */}
        {activeMode === 'cover' && (
          <div className="my-auto py-2 flex flex-col items-center animate-fade-in">
            {/* Album Artwork with Ambient Reflection */}
            <div className="relative w-full max-w-[310px] aspect-square rounded-3xl overflow-hidden p-1 bg-gradient-to-b from-white/15 to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(121,40,202,0.3)]">
              <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-[#14151c]">
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className={`w-full h-full object-cover transition-transform duration-700 ${
                    isPlaying ? 'scale-105' : 'scale-100'
                  }`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none"></div>

                {/* Audio Quality Badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQualityModal(true);
                  }}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#1db954]/60 flex items-center gap-1.5 text-[11px] font-bold text-[#1db954] shadow-md hover:bg-black transition-colors cursor-pointer"
                  title="Change audio streaming bitrate"
                >
                  <span className="material-symbols-outlined text-sm">graphic_eq</span>
                  <span>{formatQualityLabel(currentQuality).badge}</span>
                </button>

                <div className="absolute bottom-3 inset-x-3 text-center pointer-events-none">
                  <span className="text-xs uppercase tracking-widest text-white/90 font-semibold block truncate">
                    {track.album || 'Studio Master'}
                  </span>
                  <span className="text-[11px] text-[#dbb8ff]">
                    {track.genre || 'Music'}
                  </span>
                </div>
              </div>
            </div>

            {/* Track Info & Like Button */}
            <div className="w-full mt-5 flex items-center justify-between px-1">
              <div className="min-w-0 flex-1 pr-3">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate font-display">
                  {track.title}
                </h1>
                <p className="text-sm text-[#b8b0c2] mt-0.5 truncate font-medium">
                  {track.artist}
                </p>
              </div>
              <button
                onClick={handleToggleLike}
                aria-label="Like track"
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-transform active:scale-90 cursor-pointer ${
                  isLiked ? 'text-rose-500' : 'text-[#b8b0c2] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-3xl">
                  {isLiked ? 'favorite' : 'favorite_border'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 2. LYRICS MODE (With English & Original Switch) */}
        {activeMode === 'lyrics' && (
          <div className="my-auto py-2 flex flex-col w-full h-[370px] bg-[#14151c]/90 rounded-3xl p-5 border border-white/[0.08] backdrop-blur-xl animate-fade-in shadow-2xl relative overflow-hidden">
            {/* Header with Original vs English Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#dbb8ff] font-bold block">
                  Synchronized Lyrics
                </span>
                <span className="text-xs text-[#b8b0c2] truncate block max-w-[180px]">
                  {lyricsData.language}
                </span>
              </div>

              {/* English Toggle Button */}
              <div className="flex items-center bg-[#1a1b24] p-1 rounded-full border border-white/[0.08]">
                <button
                  onClick={() => setLyricsLang('original')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    lyricsLang === 'original'
                      ? 'bg-[#7928ca] text-white shadow-sm'
                      : 'text-[#b8b0c2] hover:text-white'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setLyricsLang('english')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    lyricsLang === 'english'
                      ? 'bg-[#1db954] text-[#003b14] font-bold shadow-sm'
                      : 'text-[#b8b0c2] hover:text-white'
                  }`}
                >
                  <span>English</span>
                </button>
              </div>
            </div>

            {/* Scrollable Lyric Lines with active highlighting & click-to-seek */}
            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar py-2 px-1">
              {lyricsData.lines.map((line, idx) => {
                const isActive = idx === activeLyricIndex;
                const displayText = lyricsLang === 'english' ? line.english : line.original;

                return (
                  <div
                    key={idx}
                    onClick={() => audioEngine.seek(line.time)}
                    className={`cursor-pointer transition-all duration-300 p-2 rounded-xl text-left ${
                      isActive
                        ? 'text-white text-base sm:text-lg font-bold bg-[#7928ca]/25 border-l-4 border-[#dbb8ff] pl-3 scale-[1.02]'
                        : 'text-[#b8b0c2]/60 hover:text-[#b8b0c2] text-sm font-medium'
                    }`}
                  >
                    <p className="leading-relaxed">{displayText}</p>
                    {isActive && (
                      <span className="text-[10px] font-mono text-[#dbb8ff] opacity-80 mt-1 block">
                        Tap to jump • {formatTime(line.time)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-center text-[10px] text-[#b8b0c2]/50 border-t border-white/[0.04]">
              Tap any line to jump to that moment in song
            </div>
          </div>
        )}



        {/* Universal Playback Timeline Scrubber */}
        <div className="w-full mt-2">
          <div
            onClick={handleScrub}
            className="relative h-12 w-full flex items-center cursor-pointer group"
          >
            {/* Waveform visual bars */}
            <div className="absolute inset-0 flex items-center justify-between gap-[2px]">
              {waveformBars.map((h, i) => {
                const barProgress = i / waveformBars.length;
                const isPassed = barProgress <= progressFraction;
                const dynamicHeight =
                  isPlaying && isPassed
                    ? Math.min(100, h + Math.sin(currentTimeSec * 2 + i) * 12)
                    : h;

                return (
                  <div
                    key={i}
                    className="flex-1 rounded-full transition-all duration-150"
                    style={{
                      height: `${Math.max(12, dynamicHeight)}%`,
                      backgroundColor: isPassed ? '#dbb8ff' : '#232532',
                      boxShadow: isPassed ? '0 0 6px rgba(219,184,255,0.4)' : 'none',
                    }}
                  />
                );
              })}
            </div>

            {/* Progress bar track */}
            <div className="absolute bottom-0 inset-x-0 h-1.5 rounded-full bg-[#1e202a]">
              <div
                className="h-full bg-gradient-to-r from-[#7928ca] via-[#508eff] to-[#dbb8ff] rounded-full relative"
                style={{ width: `${progressFraction * 100}%` }}
              >
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_#dbb8ff] ring-2 ring-[#7928ca]"></span>
              </div>
            </div>
          </div>

          {/* Time display */}
          <div className="flex items-center justify-between text-xs font-mono text-[#b8b0c2] mt-1.5">
            <span>{formatTime(currentTimeSec)}</span>
            <span className="text-[10px] text-[#1db954] font-sans font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1db954] animate-pulse"></span>
              Continuous Play Active
            </span>
            <span>{track.isLiveRadio ? 'LIVE' : `-${formatTime(Math.max(0, totalTimeSec - currentTimeSec))}`}</span>
          </div>
        </div>

        {/* Playback Controls (Shuffle, Prev, Play/Pause, Next, Repeat) */}
        <div className="w-full flex items-center justify-between mt-3 px-2">
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            aria-label="Shuffle"
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              isShuffle ? 'text-[#dbb8ff]' : 'text-[#b8b0c2]/50 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">shuffle</span>
          </button>

          <button
            onClick={onPrevTrack}
            aria-label="Previous"
            className="w-12 h-12 flex items-center justify-center rounded-full text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-3xl">skip_previous</span>
          </button>

          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#dbb8ff] to-[#efdbff] text-[#2b0052] flex items-center justify-center shadow-[0_0_30px_rgba(219,184,255,0.4),0_8px_20px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-4xl font-bold">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button
            onClick={onNextTrack}
            aria-label="Next"
            className="w-12 h-12 flex items-center justify-center rounded-full text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-3xl">skip_next</span>
          </button>

          <button
            onClick={cycleRepeat}
            aria-label="Repeat"
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              repeatMode !== 'off' ? 'text-[#dbb8ff]' : 'text-[#b8b0c2]/50 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">
              {repeatMode === 'one' ? 'repeat_one' : 'repeat'}
            </span>
          </button>
        </div>

        {/* Volume Control Bar */}
        <div className="w-full flex items-center gap-3 mt-4 px-3 py-2 rounded-2xl bg-[#1a1b24] border border-white/[0.04]">
          <button
            onClick={toggleMute}
            className="text-[#b8b0c2] hover:text-white transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <span className="material-symbols-outlined text-xl">
              {isMuted || volume === 0 ? 'volume_off' : volume > 0.5 ? 'volume_up' : 'volume_down'}
            </span>
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-full accent-[#dbb8ff] h-1.5 bg-[#232532] rounded-lg cursor-pointer"
          />
          <span className="text-[11px] font-mono text-[#b8b0c2]/70 w-8 text-right">
            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>

        {/* Quick Tab Switcher & Navigation directly from Player */}
        {onNavigate && (
          <div className="w-full mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between px-1">
            <button
              onClick={() => onNavigate('home')}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'home' ? 'text-[#dbb8ff] font-bold scale-105' : 'text-[#b8b0c2]/70 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">home</span>
              <span className="text-[10px]">Home</span>
            </button>
            <button
              onClick={() => onNavigate('discover')}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'discover' ? 'text-[#dbb8ff] font-bold scale-105' : 'text-[#b8b0c2]/70 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              <span className="text-[10px]">Search</span>
            </button>
            <button
              onClick={() => onNavigate('radio')}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'radio' ? 'text-[#dbb8ff] font-bold scale-105' : 'text-[#b8b0c2]/70 hover:text-white'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">podcasts</span>
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              </div>
              <span className="text-[10px]">Radio</span>
            </button>
            <button
              onClick={() => onNavigate('library')}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'library' ? 'text-[#dbb8ff] font-bold scale-105' : 'text-[#b8b0c2]/70 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">library_music</span>
              <span className="text-[10px]">Library</span>
            </button>
            <button
              onClick={() => onNavigate('studio')}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'studio' ? 'text-[#dbb8ff] font-bold scale-105' : 'text-[#b8b0c2]/70 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] text-[#dbb8ff]/80">graphic_eq</span>
              <span className="text-[10px] text-[#dbb8ff]/80">Studio</span>
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'profile' ? 'text-[#dbb8ff] font-bold scale-105' : 'text-[#b8b0c2]/70 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
              <span className="text-[10px]">Profile</span>
            </button>
          </div>
        )}
      </div>

      {/* Playlist Picker Dialog */}
      {showPlaylistPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1a1b24] border border-white/10 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add to Playlist</h3>
              <button
                onClick={() => setShowPlaylistPicker(false)}
                className="text-[#b8b0c2] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getUserPlaylists().map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => handleAddToPlaylist(pl.id)}
                  className="w-full p-3 rounded-xl bg-[#232532] hover:bg-[#2c2e3d] text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="text-xs font-semibold text-white truncate">{pl.title}</span>
                  <span className="text-[11px] text-[#b8b0c2] font-mono">{pl.tracks.length} tracks</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audio Quality Settings Modal */}
      <AudioQualitySelector
        isOpen={showQualityModal}
        onClose={() => {
          setShowQualityModal(false);
          setCurrentQuality(getAudioQuality());
        }}
        onQualityChange={(q: AudioQuality) => {
          setCurrentQuality(q);
          setToastMessage(`Streaming quality set to ${formatQualityLabel(q).label}`);
          setTimeout(() => setToastMessage(null), 2000);
        }}
      />
    </div>
  );
};
