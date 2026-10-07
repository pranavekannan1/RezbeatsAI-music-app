import React, { useState } from 'react';
import { Track } from '../types';
import { searchWorldwideCatalog, apiFetch } from '../services/musicService';

interface StudioScreenProps {
  onStartSession: (tracks: Track[]) => void;
  onPlaySingleTrack: (track: Track) => void;
}

export const StudioScreen: React.FC<StudioScreenProps> = ({
  onStartSession,
  onPlaySingleTrack,
}) => {
  const [promptText, setPromptText] = useState('Apologies aistudio is under development');
  const [acousticWeight, setAcousticWeight] = useState(88);
  const [activeMode, setActiveMode] = useState<'dj' | 'playlist' | 'mood'>('dj');
  const [isGenerating, setIsGenerating] = useState(false);
  const [telemetryProgress, setTelemetryProgress] = useState(92);
  const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({
    'submerged-horizons': true,
  });

  const [sessionTracks, setSessionTracks] = useState<Track[]>([
    {
      id: 'submerged-horizons',
      title: 'Submerged Horizons',
      artist: 'Kiasmos',
      album: 'Acoustic',
      duration: '04:12',
      coverUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDP94YgZVLv2yRbjv9VefZYL90Bn2gNfGAehiamoRfyRl-FhGmytLSRID9cxW9QYJOCmX50u6w8iBYKz7ZLLRiA7mvQUZWTMtCyB3R9I0W_wnWX5LWhb2MyGpwCb2iVZKXGfPT7OY5gHteG-UqLO4Md3WJuCbZShTyGZrIRjSs-1w8cwwZ117VKIaTS_NoogAPAsJ6LA_1CeScA804sVIbwggu4W5BiM3UegKXXBblgG7g-5XK4iewiUg',
      tags: ['Acoustic', 'Neo-Classical'],
    },
    {
      id: 'echoes-in-cedar',
      title: 'Echoes in Cedar',
      artist: 'Hania Rani',
      album: 'Neo-Classical',
      duration: '05:40',
      coverUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCuGqhvC1ftYYaQ4Q1TicnboRPV4sKN70OXNyZLkgzNhMrbpAguk83NZdZ_f78Syr-zJbbyczX9WdzynPYSyIvlzLunEZGDm9xG4LaQIB4PkcDWtxkStPMtEO6Uw57SPDDT5gpjc5CXy524ndcBky0uzJZ_yRxQTxHlxTMqsLSCd_BcTtn7FvJKV7Y4VCqIwOcN5aBG9VcrOVFlaSR6Mcmd75inaR7QjfqKgR8U_O5GX9QUVzoF49GVTA',
      tags: ['Neo-Classical', 'Piano'],
    },
    {
      id: 'midnight-rain',
      title: 'Midnight Rain & Fender Rhodes',
      artist: 'RezbeatsAi Synthesis',
      album: 'Original Soundscape',
      duration: '03:55',
      coverUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBljuQ7doGPribSPe1z0zKfTcP3h9km_w5K8W1OcneOgCq3yS0_676RBlbQ0unAv7Twdn5elrcVV6GDS-NtBqZFTNIdVIyItAVOPEaJd3hM355jVJRA1-BH0NbnLbaTxOGRbAMJBP4y7J8rDHPyb8TrpXT6Hp2jnPPgQQz_Ru_OaQMBDX8qTwd_3wZ6627w9hoI39m9xd9kgk1Kzu6QaAbjJ6qxe9AjavirR6tKHDlwP5EefbveUOAsZg',
      tags: ['Original Soundscape', 'Ambient Rhodes'],
    },
  ]);

  const handleRefine = async () => {
    const prompt = promptText.trim();
    if (!prompt) return;

    setIsGenerating(true);
    setTelemetryProgress(20);

    try {
      const response = await apiFetch('/api/ai/music-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      setTelemetryProgress(50);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to generate suggestions.');
      }

      const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
      const results = await Promise.all(
        suggestions.slice(0, 8).map(async (suggestion: any) => {
          const matches = await searchWorldwideCatalog(
            suggestion.searchQuery || suggestion.title || prompt,
            5
          );
          const track = matches[0];
          if (!track) return null;
          return {
            ...track,
            affinityNote: suggestion.reason || 'Matched to your AI prompt.',
          } as Track;
        })
      );

      const unique = Array.from(
        new Map(
          results
            .filter((track): track is Track => Boolean(track))
            .map((track) => [track.id, track])
        ).values()
      ).slice(0, 8);

      if (unique.length > 0) {
        setSessionTracks(unique);
      } else {
        throw new Error('No matching songs were found for this prompt. Try adding an artist, genre, mood, or activity.');
      }

      setTelemetryProgress(100);
    } catch (error: any) {
      console.warn('AI music suggestion error:', error);
      // Keep the existing UI/session instead of replacing it with fake songs.
      setTelemetryProgress(100);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReshuffle = () => {
    handleRefine();
  };

  const toggleTrackLike = (id: string) => {
    setLikedTracks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col w-full space-y-6 pb-36 pt-2">
      {/* Title */}
      <section className="flex flex-col space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#e3e2e8] tracking-tight font-display">
          Soundscape Studio
        </h1>
        <p className="text-xs sm:text-sm text-[#cec2d6]">
          On development but system may work but work in progress...
        </p>
      </section>

      {/* Neural Prompt Field */}
      <section className="relative rounded-2xl bg-[#1f1f24] p-4 sm:p-5 border border-white/[0.08] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2 text-[#dbb8ff]">
            <span className="material-symbols-outlined text-lg">neurology</span>
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
              Neural Prompt Field
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#988d9f]">
            TOKENS: {promptText.length}/256
          </span>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            rows={3}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base text-[#e3e2e8] italic leading-relaxed focus:outline-none resize-none border-none p-0"
            placeholder="Describe mood, instruments, tempo or environment..."
          />
        </div>

        {/* Prompt Parameters Row */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#cec2d6]">tune</span>
            <span className="text-xs text-[#cec2d6]">
              Acoustic weight:{' '}
              <strong className="text-[#dbb8ff] font-mono">{acousticWeight}%</strong>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={acousticWeight}
              onChange={(e) => setAcousticWeight(Number(e.target.value))}
              className="w-16 sm:w-24 accent-[#dbb8ff] cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefine}
              disabled={isGenerating}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#292a2e] hover:bg-[#343439] text-[#dbb8ff] text-xs font-semibold border border-[#dbb8ff]/30 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">
                {isGenerating ? 'cyclone' : 'auto_awesome'}
              </span>
              <span>Refine</span>
            </button>
            <button
              onClick={() => {
                setPromptText(
                  '40 Hz Gamma wave ambient drone with soft rain sound for deep focus'
                );
                handleRefine();
              }}
              aria-label="Voice input"
              className="w-8 h-8 rounded-full bg-[#dbb8ff] text-[#470083] flex items-center justify-center hover:bg-[#efdbff] active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">mic</span>
            </button>
          </div>
        </div>

        {/* Mode Selector Chips */}
        <div className="flex items-center gap-2 pt-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveMode('dj')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'dj'
                ? 'bg-[#7928ca] text-[#efdbff] shadow-sm'
                : 'bg-[#292a2e] text-[#cec2d6] hover:text-[#e3e2e8]'
            }`}
          >
            <span>✨ Smart DJ Live</span>
          </button>
          <button
            onClick={() => setActiveMode('playlist')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'playlist'
                ? 'bg-[#7928ca] text-[#efdbff] shadow-sm'
                : 'bg-[#292a2e] text-[#cec2d6] hover:text-[#e3e2e8]'
            }`}
          >
            <span>🎵 Create Playlist</span>
          </button>
          <button
            onClick={() => setActiveMode('mood')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'mood'
                ? 'bg-[#7928ca] text-[#efdbff] shadow-sm'
                : 'bg-[#292a2e] text-[#cec2d6] hover:text-[#e3e2e8]'
            }`}
          >
            <span>🌊 Mood → Music</span>
          </button>
        </div>
      </section>

      {/* Audio Engine Telemetry */}
      <section className="rounded-2xl bg-[#1f1f24] p-4 border border-white/[0.06] shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffb1c5] animate-pulse"></span>
            <h2 className="text-sm font-semibold text-[#e3e2e8]">
              Audio Engine Telemetry
            </h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#292a2e] text-[#aec6ff] font-mono">
            LATENCY: 182ms
          </span>
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#dbb8ff]/20 text-[#dbb8ff] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-xs font-bold">check</span>
            </span>
            <div>
              <div className="text-xs font-semibold text-[#e3e2e8]">
                Understanding your mood
              </div>
              <div className="text-[11px] text-[#cec2d6]">Meditative & Focused</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#dbb8ff]/20 text-[#dbb8ff] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-xs font-bold">check</span>
            </span>
            <div>
              <div className="text-xs font-semibold text-[#e3e2e8]">
                Finding matching music
              </div>
              <div className="text-[11px] text-[#cec2d6]">
                Acoustic & Downtempo Neo-Classical
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#dbb8ff]/20 text-[#dbb8ff] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-xs font-bold">check</span>
            </span>
            <div>
              <div className="text-xs font-semibold text-[#e3e2e8]">
                Balancing energy
              </div>
              <div className="text-[11px] text-[#cec2d6]">
                42 BPM to 68 BPM gentle arc curve
              </div>
            </div>
          </div>

          {/* Progress Stage */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#dbb8ff] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#dbb8ff] animate-ping"></span>
                <span>Creating your session...</span>
              </div>
              <span className="font-mono text-[#dbb8ff] font-semibold">
                {telemetryProgress}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#343439] mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7928ca] via-[#508eff] to-[#dbb8ff] rounded-full transition-all duration-500"
                style={{ width: `${telemetryProgress}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#988d9f] font-mono mt-1">
              <span>Harmonic drift: calibrated</span>
              <span>Target: 14 tracks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Generated Session Preview */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-semibold text-[#e3e2e8] font-display">
              Generated Session Preview
            </h2>
            <span className="w-1.5 h-1.5 rounded-full bg-[#dbb8ff]"></span>
          </div>
          <button
            onClick={handleReshuffle}
            className="flex items-center gap-1 text-xs text-[#dbb8ff] hover:text-[#efdbff] cursor-pointer"
          >
            <span>Reshuffle</span>
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>

        {/* 4 Feature Parameter Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-[#1f1f24] p-3 border border-white/[0.05] flex items-center gap-2.5">
            <span className="material-symbols-outlined text-lg text-[#dbb8ff]">
              schedule
            </span>
            <div>
              <div className="text-[10px] uppercase font-mono text-[#988d9f]">
                Duration
              </div>
              <div className="text-xs font-bold text-[#e3e2e8]">58 min</div>
            </div>
          </div>

          <div className="rounded-xl bg-[#1f1f24] p-3 border border-white/[0.05] flex items-center gap-2.5">
            <span className="material-symbols-outlined text-lg text-[#aec6ff]">spa</span>
            <div>
              <div className="text-[10px] uppercase font-mono text-[#988d9f]">Mood</div>
              <div className="text-xs font-bold text-[#e3e2e8]">Calm Flow</div>
            </div>
          </div>

          <div className="rounded-xl bg-[#1f1f24] p-3 border border-white/[0.05] flex items-center gap-2.5">
            <span className="material-symbols-outlined text-lg text-[#ffb1c5]">bolt</span>
            <div>
              <div className="text-[10px] uppercase font-mono text-[#988d9f]">Energy</div>
              <div className="text-xs font-bold text-[#e3e2e8]">Medium-low</div>
            </div>
          </div>

          <div className="rounded-xl bg-[#1f1f24] p-3 border border-white/[0.05] flex items-center gap-2.5">
            <span className="material-symbols-outlined text-lg text-[#dbb8ff]">
              graphic_eq
            </span>
            <div>
              <div className="text-[10px] uppercase font-mono text-[#988d9f]">Vocals</div>
              <div className="text-xs font-bold text-[#e3e2e8]">Minimal (4%)</div>
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex flex-col space-y-2 pt-1">
          {sessionTracks.map((tr) => (
            <div
              key={tr.id}
              onClick={() => onPlaySingleTrack(tr)}
              className="rounded-xl bg-[#1f1f24] p-3 flex items-center justify-between gap-3 border border-white/[0.05] hover:bg-[#292a2e] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-[#292a2e]">
                  <img
                    src={tr.coverUrl}
                    alt={tr.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-[#e3e2e8] truncate group-hover:text-[#dbb8ff] transition-colors">
                    {tr.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-[#cec2d6] truncate">
                    <span>{tr.artist}</span>
                    <span>•</span>
                    <span className="text-[#dbb8ff]">{tr.album || 'Acoustic'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-[#988d9f]">
                <span>{tr.duration}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTrackLike(tr.id);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    likedTracks[tr.id] ? 'text-[#ffb1c5]' : 'hover:text-[#e3e2e8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {likedTracks[tr.id] ? 'favorite' : 'favorite_border'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Start Session Primary CTA */}
        <div className="pt-2">
          <button
            onClick={() => onStartSession(sessionTracks)}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#7928ca] via-[#508eff] to-[#ffb1c5] text-white font-bold text-sm tracking-wide shadow-[0_0_30px_rgba(121,40,202,0.4)] hover:shadow-[0_0_40px_rgba(121,40,202,0.6)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">play_circle</span>
            <span>Start Session</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </section>
    </div>
  );
};
