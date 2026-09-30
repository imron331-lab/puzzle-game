import React from 'react';
import { Music, Volume2, VolumeX } from 'lucide-react';
import { SoundscapeId } from '../types/game';

interface AmbientMusicPanelProps {
  isDark: boolean;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  soundscape: SoundscapeId;
  onChangeSoundscape: (id: SoundscapeId) => void;
  volume: number;
  onChangeVolume: (val: number) => void;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
}

const SOUNDSCAPES: { id: SoundscapeId; name: string; detail: string }[] = [
  {
    id: 'embun-pagi',
    name: 'Embun Pagi',
    detail: 'Akord pad hangat · Lonceng lembut',
  },
  {
    id: 'taman-bambu',
    name: 'Taman Bambu',
    detail: 'Nada kalimba pentatonik · Tenang',
  },
  {
    id: 'hening-malam',
    name: 'Hening Malam',
    detail: 'Harmoni frekuensi 432Hz · Fokus dalam',
  },
];

export const AmbientMusicPanel: React.FC<AmbientMusicPanelProps> = ({
  isDark,
  isMusicPlaying,
  onToggleMusic,
  soundscape,
  onChangeSoundscape,
  volume,
  onChangeVolume,
  sfxEnabled,
  onToggleSfx,
}) => {
  return (
    <section
      aria-label="Pengaturan Musik Latar & Suara"
      className={`pt-5 border-t ${
        isDark ? 'border-sky-500/15 text-slate-200' : 'border-slate-200 text-slate-800'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold">Modul Audio & Harmoni Fokus</h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Sintesis gelombang akustik relaksasi · Berjalan 100% luring
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleMusic}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            isMusicPlaying
              ? isDark
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50'
                : 'bg-sky-600 text-white'
              : isDark
              ? 'bg-[#0F172A] text-slate-300 border border-slate-700/80 hover:border-sky-500/40'
              : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
          }`}
        >
          <Music className="w-3.5 h-3.5 shrink-0" />
          <span>{isMusicPlaying ? 'Jeda Audio' : 'Putar Audio'}</span>
        </button>
      </div>

      {/* Soundscape Selector */}
      <div
        role="radiogroup"
        aria-label="Pilih tema musik latar"
        className={`grid grid-cols-3 gap-1.5 p-1 rounded-xl mb-3.5 border ${
          isDark
            ? 'bg-[#070B12]/90 border-sky-500/15'
            : 'bg-slate-100 border-slate-200/80'
        }`}
      >
        {SOUNDSCAPES.map((item) => {
          const active = soundscape === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChangeSoundscape(item.id)}
              className={`px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer ${
                active
                  ? isDark
                    ? 'bg-[#131F33] text-white border border-sky-500/40 shadow-xs'
                    : 'bg-white text-slate-950 border border-slate-300 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 border border-transparent'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="text-xs font-semibold truncate">{item.name}</div>
              <div
                className={`text-[11px] truncate mt-0.5 ${
                  active
                    ? isDark
                      ? 'text-sky-400'
                      : 'text-sky-700'
                    : isDark
                    ? 'text-slate-500'
                    : 'text-slate-500'
                }`}
              >
                {item.detail.split(' · ')[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Volume & SFX Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
        <label className="flex items-center gap-2.5 flex-1 min-w-[160px]">
          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Intensitas</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => onChangeVolume(Number(e.target.value) / 100)}
            className="w-full accent-sky-500 cursor-pointer h-1.5 rounded-lg"
            aria-label="Volume musik latar"
          />
          <span className="font-mono-tabular w-9 text-right">
            {Math.round(volume * 100)}%
          </span>
        </label>

        <button
          type="button"
          onClick={onToggleSfx}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            sfxEnabled
              ? isDark
                ? 'text-sky-300 hover:bg-slate-800/70'
                : 'text-sky-800 hover:bg-slate-200/60'
              : isDark
              ? 'text-slate-500 hover:bg-slate-800/70'
              : 'text-slate-400 hover:bg-slate-200/60'
          }`}
        >
          {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>Efek Taktil: {sfxEnabled ? 'Aktif' : 'Mati'}</span>
        </button>
      </div>
    </section>
  );
};
