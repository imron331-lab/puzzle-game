import React from 'react';
import { Check, Crosshair, Sparkles } from 'lucide-react';
import { BoardSize, HintSuggestion, PuzzleMechanic } from '../types/game';
import { createSolvedBoard, isTileInCorrectSpot } from '../utils/puzzleLogic';

interface PuzzleBoardProps {
  tiles: number[];
  size: BoardSize;
  mechanic: PuzzleMechanic;
  selectedSwapIndex: number | null;
  activeHint: HintSuggestion | null;
  showTargetPreview: boolean;
  isPaused: boolean;
  isDark: boolean;
  onTileClick: (index: number) => void;
  onResumeFromPause: () => void;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  tiles,
  size,
  mechanic,
  selectedSwapIndex,
  activeHint,
  showTargetPreview,
  isPaused,
  isDark,
  onTileClick,
  onResumeFromPause,
}) => {
  const displayTiles = showTargetPreview ? createSolvedBoard(size, mechanic) : tiles;
  const emptyIndex = displayTiles.indexOf(0);
  const emptyRow = Math.floor(emptyIndex / size);
  const emptyCol = emptyIndex % size;

  const gridColsClass: Record<BoardSize, string> = {
    3: 'grid-cols-3 gap-3 sm:gap-4',
    4: 'grid-cols-4 gap-2.5 sm:gap-3.5',
    5: 'grid-cols-5 gap-2 sm:gap-2.5',
  };

  const tileHeightClass: Record<BoardSize, string> = {
    3: 'h-24 sm:h-28 md:h-32 text-3xl sm:text-4xl',
    4: 'h-20 sm:h-24 md:h-26 text-2xl sm:text-3xl',
    5: 'h-16 sm:h-20 md:h-22 text-xl sm:text-2xl',
  };

  return (
    <div className="relative w-full max-w-[510px] mx-auto">
      {/* Architectural Corner Calibration Brackets */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 rounded-tl-md ${
          isDark ? 'border-sky-400/70' : 'border-sky-600/70'
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 rounded-tr-md ${
          isDark ? 'border-sky-400/70' : 'border-sky-600/70'
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 rounded-bl-md ${
          isDark ? 'border-sky-400/70' : 'border-sky-600/70'
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 rounded-tr-none rounded-br-md ${
          isDark ? 'border-sky-400/70' : 'border-sky-600/70'
        }`}
      />

      {/* Precision Quantum Number Matrix Container */}
      <div
        role="grid"
        aria-label={`Matriks puzzle angka ${size} kali ${size}`}
        className={`grid ${gridColsClass[size]} p-3.5 sm:p-5 rounded-2xl border transition-colors duration-150 ${
          isDark
            ? 'bg-[#0A101D]/95 border-sky-500/25 shadow-[inset_0_1px_20px_rgba(14,165,233,0.07)]'
            : 'bg-slate-200/75 border-slate-300 shadow-inner'
        }`}
      >
        {displayTiles.map((val, idx) => {
          const isEmpty = val === 0;
          const isCorrect = isTileInCorrectSpot(displayTiles, idx);
          const isHintSource = !showTargetPreview && activeHint?.tileIndex === idx;
          const isHintTarget = !showTargetPreview && activeHint?.targetIndex === idx;
          const isSwapSelected =
            !showTargetPreview && mechanic === 'SWAP' && selectedSwapIndex === idx;

          const row = Math.floor(idx / size);
          const col = idx % size;
          const canSlide =
            mechanic === 'SLIDE' && !isEmpty && (row === emptyRow || col === emptyCol);
          const isInteractive = !showTargetPreview && (mechanic === 'SWAP' || canSlide);
          const slotCode = String(idx + 1).padStart(2, '0');

          if (isEmpty) {
            return (
              <div
                key={`empty-${idx}`}
                role="gridcell"
                aria-label="Slot matriks kosong"
                className={`${tileHeightClass[size]} rounded-xl flex flex-col items-center justify-center border border-dashed transition-colors ${
                  isHintTarget
                    ? isDark
                      ? 'bg-amber-500/10 border-amber-400/70 text-amber-300'
                      : 'bg-amber-500/10 border-amber-600/70 text-amber-800'
                    : isDark
                    ? 'bg-[#05080F]/80 border-sky-500/20 text-slate-600'
                    : 'bg-slate-100/80 border-slate-300 text-slate-400'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5 mb-1 opacity-60" />
                <span className="text-[11px] font-mono-tabular font-medium tracking-tight">
                  {isHintTarget ? 'TARGET' : `SLOT ${slotCode}`}
                </span>
              </div>
            );
          }

          return (
            <button
              key={`tile-${val}`}
              type="button"
              role="gridcell"
              disabled={!isInteractive && !showTargetPreview}
              onClick={() => {
                if (!showTargetPreview) onTileClick(idx);
              }}
              aria-label={`Angka ${val}${isCorrect ? ', terkunci pada urutan yang tepat' : ''}${
                isHintSource ? ', disarankan oleh vektor petunjuk' : ''
              }`}
              className={`group relative ${tileHeightClass[size]} rounded-xl flex flex-col items-center justify-center font-mono-tabular font-bold select-none transition-all duration-150 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                isInteractive
                  ? 'cursor-pointer active:scale-[0.96] hover:-translate-y-0.5'
                  : 'cursor-default'
              } ${
                isHintSource
                  ? isDark
                    ? 'bg-amber-400 text-slate-950 border-2 border-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.35)]'
                    : 'bg-amber-400 text-slate-950 border-2 border-amber-600 shadow-md'
                  : isSwapSelected
                  ? isDark
                    ? 'bg-sky-400 text-slate-950 border-2 border-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.4)] scale-[0.98]'
                    : 'bg-sky-600 text-white border-2 border-sky-900 shadow-md scale-[0.98]'
                  : isCorrect
                  ? isDark
                    ? 'bg-gradient-to-b from-[#0E232E] to-[#0A1922] text-emerald-300 border border-emerald-500/45 shadow-[inset_0_1px_0_rgba(16,185,129,0.25)]'
                    : 'bg-emerald-50/95 text-emerald-950 border border-emerald-400/80 shadow-xs'
                  : isDark
                  ? 'bg-gradient-to-b from-[#162235] to-[#0F1826] text-slate-100 border border-sky-500/25 hover:border-sky-400/60 hover:from-[#1B2A42] hover:to-[#131F31] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'bg-white text-slate-900 border border-slate-300/90 hover:border-sky-500/70 hover:bg-sky-50/30 shadow-xs'
              }`}
            >
              {/* Top-left coordinate index */}
              <span
                className={`absolute top-1.5 left-2 text-[10px] font-mono-tabular font-medium leading-none ${
                  isHintSource || isSwapSelected
                    ? 'opacity-85'
                    : isCorrect
                    ? isDark
                      ? 'text-emerald-400/80'
                      : 'text-emerald-700/80'
                    : isDark
                    ? 'text-sky-400/50'
                    : 'text-slate-400'
                }`}
              >
                {slotCode}
              </span>

              {/* Top-right non-hue-only status indicator */}
              {isCorrect && !isHintSource && !isSwapSelected && (
                <span
                  aria-hidden="true"
                  className={`absolute top-1.5 right-2 inline-flex items-center gap-0.5 text-[10px] font-sans font-semibold leading-none ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  {size <= 4 && <span className="hidden sm:inline">Urut</span>}
                </span>
              )}

              {isHintSource && (
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 right-2 inline-flex items-center gap-0.5 text-[10px] font-sans font-bold leading-none"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Vektor</span>
                </span>
              )}

              {/* Primary large geometric numeral */}
              <span className="leading-none tracking-tight mt-1">{val}</span>

              {/* Bottom precision energy bar indicator */}
              {!isSwapSelected && !isHintTarget && (
                <span
                  aria-hidden="true"
                  className={`mt-2 h-0.5 rounded-full transition-all duration-200 ${
                    size === 5 ? 'w-5' : 'w-7'
                  } ${
                    isHintSource
                      ? 'bg-slate-950'
                      : isCorrect
                      ? isDark
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                        : 'bg-emerald-600'
                      : isInteractive
                      ? isDark
                        ? 'bg-sky-400/30 group-hover:bg-sky-400'
                        : 'bg-slate-300 group-hover:bg-sky-500'
                      : isDark
                      ? 'bg-slate-800'
                      : 'bg-slate-200'
                  }`}
                />
              )}

              {isSwapSelected && (
                <span className="text-[10px] font-sans font-semibold mt-1 leading-none">
                  Pilih tujuan
                </span>
              )}
              {isHintTarget && mechanic === 'SWAP' && !isSwapSelected && (
                <span
                  className={`text-[10px] font-sans font-semibold mt-1 leading-none ${
                    isDark ? 'text-amber-300' : 'text-amber-700'
                  }`}
                >
                  Tukar ke sini
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Futuristic Pause Scrim Overlay */}
      {isPaused && (
        <div
          className={`absolute inset-0 z-20 rounded-2xl flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl transition-opacity ${
            isDark
              ? 'bg-[#070B12]/90 border border-sky-500/30 text-slate-100'
              : 'bg-white/90 border border-slate-300 text-slate-900'
          }`}
        >
          <p className="text-xs font-semibold tracking-wide text-sky-500 dark:text-sky-400 mb-1">
            Kronometer Dijeda Sementara
          </p>
          <h3 className="font-display text-2xl font-bold mb-2">Mode Siaga Aktif</h3>
          <p
            className={`text-sm max-w-xs mb-6 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Matriks angka dikunci sementara untuk menjaga akurasi waktu kompetitif Anda.
          </p>
          <button
            type="button"
            onClick={onResumeFromPause}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer whitespace-nowrap"
          >
            Lanjutkan Sesi
          </button>
        </div>
      )}
    </div>
  );
};
