import React from 'react';
import { Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { NavSection } from '../types/game';

interface TopBarProps {
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  isDark: boolean;
  onToggleDark: () => void;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeNav,
  onSelectNav,
  isDark,
  onToggleDark,
  isMusicPlaying,
  onToggleMusic,
}) => {
  const navItems: { id: NavSection; label: string }[] = [
    { id: 'PLAY', label: 'Bermain Cepat' },
    { id: 'PRACTICE', label: 'Mode Latihan' },
    { id: 'LEADERBOARD', label: 'Papan Peringkat' },
    { id: 'ACHIEVEMENTS', label: 'Pencapaian Harian' },
  ];

  return (
    <header
      className={`sticky top-0 z-30 border-b transition-colors duration-150 ${
        isDark
          ? 'bg-[#070B12]/90 border-sky-500/20 text-slate-100 shadow-[0_4px_24px_rgba(2,132,199,0.08)]'
          : 'bg-[#EFF3F8]/90 border-slate-300/90 text-slate-900 shadow-xs'
      } backdrop-blur-xl`}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onSelectNav('PLAY')}
          className={`font-display text-xl sm:text-2xl font-extrabold tracking-tight text-left focus-visible:outline-2 focus-visible:outline-sky-500 cursor-pointer whitespace-nowrap shrink-0 ${
            isDark ? 'text-white' : 'text-slate-950'
          }`}
        >
          UrutAngka
        </button>

        {/* Zone 2: 4 clean text navigation links */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectNav(item.id)}
                className={`py-1.5 whitespace-nowrap shrink-0 border-b-2 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${
                  isActive
                    ? isDark
                      ? 'border-sky-400 text-sky-300 font-semibold'
                      : 'border-sky-600 text-sky-900 font-semibold'
                    : isDark
                    ? 'border-transparent text-slate-400 hover:text-slate-100 hover:border-slate-700'
                    : 'border-transparent text-slate-600 hover:text-slate-950 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 2 primary actions (Music & Dark/Light Mode) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleMusic}
            aria-label={
              isMusicPlaying
                ? 'Matikan musik latar menenangkan'
                : 'Putar musik latar menenangkan'
            }
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${
              isMusicPlaying
                ? isDark
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50 hover:bg-sky-500/30'
                  : 'bg-sky-600 text-white hover:bg-sky-700'
                : isDark
                ? 'bg-[#0F172A] text-slate-300 border border-slate-700/80 hover:border-sky-500/40 hover:text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            {isMusicPlaying ? (
              <Volume2 className="w-4 h-4 shrink-0 text-sky-400" />
            ) : (
              <VolumeX className="w-4 h-4 shrink-0" />
            )}
            <span>{isMusicPlaying ? 'Audio Zen: Aktif' : 'Audio Zen'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleDark}
            aria-label={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${
              isDark
                ? 'bg-[#0F172A] text-amber-300 border border-slate-700/80 hover:border-sky-500/40'
                : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            <span className="hidden sm:inline">{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Segmented Navigation */}
      <div
        className={`flex md:hidden items-center justify-around border-t px-2 py-1.5 text-xs font-medium overflow-x-auto ${
          isDark ? 'border-slate-800/90 bg-[#070B12]' : 'border-slate-200 bg-[#EFF3F8]'
        }`}
      >
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectNav(item.id)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? isDark
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                    : 'bg-sky-600 text-white font-semibold'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
