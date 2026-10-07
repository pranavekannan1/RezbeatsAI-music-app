import React from 'react';
import { AudioQuality } from '../types';
import { getAudioQuality, setAudioQuality, formatQualityLabel } from '../services/musicService';

interface AudioQualitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onQualityChange?: (quality: AudioQuality) => void;
}

export const AudioQualitySelector: React.FC<AudioQualitySelectorProps> = ({
  isOpen,
  onClose,
  onQualityChange,
}) => {
  const currentQuality = getAudioQuality();

  if (!isOpen) return null;

  const qualityOptions: AudioQuality[] = ['320k', '160k', '96k', '48k'];

  const handleSelect = (q: AudioQuality) => {
    setAudioQuality(q);
    if (onQualityChange) onQualityChange(q);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-[#16171d] border border-white/[0.12] rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1db954] to-[#dbb8ff] flex items-center justify-center text-[#0d0e12]">
              <span className="material-symbols-outlined text-lg">graphic_eq</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#e3e2e8]">Audio Streaming Quality</h3>
              <p className="text-[11px] text-[#cec2d6]/80">Maximum bitrate; source availability varies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#24252e] hover:bg-[#343540] text-[#cec2d6] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Quality Options List */}
        <div className="flex flex-col space-y-2">
          {qualityOptions.map((q) => {
            const info = formatQualityLabel(q);
            const isSelected = currentQuality === q;
            return (
              <div
                key={q}
                onClick={() => handleSelect(q)}
                className={`p-3 rounded-2xl flex items-center justify-between gap-3 border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#7928ca]/25 border-[#dbb8ff] shadow-md'
                    : 'bg-[#1f2027] border-white/[0.05] hover:bg-[#282932]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#dbb8ff] bg-[#dbb8ff]' : 'border-white/30'
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-[#2b0052]"></span>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#e3e2e8]">{info.label}</span>
                      {q === '320k' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30">
                          MAX
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#cec2d6]/70 block">{info.desc}</span>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-bold text-[#dbb8ff]">{info.badge}</span>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-[#cec2d6]/60 text-center">
          Higher quality uses more data. Actual bitrate depends on the available source stream.
        </p>
      </div>
    </div>
  );
};
