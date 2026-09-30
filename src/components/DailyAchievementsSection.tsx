import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { BoardSize, DailyAchievement, PlayerStats, PlayMode } from '../types/game';

interface DailyAchievementsSectionProps {
  achievements: DailyAchievement[];
  playerStats: PlayerStats;
  isDark: boolean;
  onStartMission: (mode: PlayMode, size: BoardSize) => void;
  onClearAllHistory: () => void;
}

export const DailyAchievementsSection: React.FC<DailyAchievementsSectionProps> = ({
  achievements,
  playerStats,
  isDark,
  onStartMission,
  onClearAllHistory,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  const completedCount = achievements.filter((a) => a.completed).length;
  const totalCount = achievements.length;
  const dailyPointsEarned = achievements
    .filter((a) => a.completed)
    .reduce((sum, a) => sum + a.rewardPoints, 0);

  const getMissionLaunchTarget = (
    id: string
  ): { mode: PlayMode; size: BoardSize; label: string } => {
    switch (id) {
      case 'daily_practice_master':
        return { mode: 'PRACTICE', size: 3, label: 'Buka Mode Latihan' };
      case 'daily_speed_3x3':
        return { mode: 'COMPETITIVE', size: 3, label: 'Mainkan 3×3 Cepat' };
      case 'daily_efficient_moves':
        return { mode: 'COMPETITIVE', size: 3, label: 'Uji Efisiensi Langkah' };
      default:
        return { mode: 'COMPETITIVE', size: 4, label: 'Mainkan Sekarang' };
    }
  };

  return (
    <div className="max-w-[1060px] mx-auto">
      {/* Header & Daily Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p
            className={`text-xs font-medium mb-1.5 ${
              isDark ? 'text-sky-400' : 'text-sky-700'
            }`}
          >
            Protokol Motivasi & Konsistensi · Diperbarui Setiap Hari
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Sistem Pencapaian Harian
          </h1>
          <p className={`text-sm mt-1.5 max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Selesaikan objektif harian untuk menjaga ketajaman fokus, kecepatan pengenalan pola
            matriks, dan menambah rangkaian hari bermain beruntun Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Clean Tabular Summary Strip */}
          <div
            className={`grid grid-cols-3 gap-6 p-4 rounded-xl border backdrop-blur-md ${
              isDark
                ? 'bg-[#0D1524]/90 border-sky-500/20'
                : 'bg-white/90 border-slate-300/90'
            }`}
          >
            <div>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Target Hari Ini
              </div>
              <div className="font-mono-tabular text-xl font-bold mt-0.5">
                {completedCount}/{totalCount}
              </div>
            </div>
            <div
              className={`pl-5 border-l ${
                isDark ? 'border-sky-500/15' : 'border-slate-200'
              }`}
            >
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Hari Beruntun
              </div>
              <div className="font-mono-tabular text-xl font-bold mt-0.5 text-amber-500 dark:text-amber-400">
                {playerStats.currentStreak} hari
              </div>
            </div>
            <div
              className={`pl-5 border-l ${
                isDark ? 'border-sky-500/15' : 'border-slate-200'
              }`}
            >
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Total Poin
              </div>
              <div className="font-mono-tabular text-xl font-bold mt-0.5 text-sky-600 dark:text-sky-400">
                {playerStats.totalPoints.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Hapus Semua Histori Button */}
          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'bg-red-950/25 border-red-500/35 text-red-300 hover:bg-red-950/45'
                  : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua Histori</span>
            </button>
          ) : (
            <div
              className={`inline-flex items-center gap-2 p-2 rounded-xl border text-xs ${
                isDark
                  ? 'bg-red-950/50 border-red-700 text-red-200'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              <span className="font-medium px-1">Reset semua histori?</span>
              <button
                type="button"
                onClick={() => {
                  onClearAllHistory();
                  setConfirmClear(false);
                }}
                className="px-2.5 py-1 rounded-md font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer whitespace-nowrap"
              >
                Ya, Hapus
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer whitespace-nowrap ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700'
                }`}
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar Banner */}
      <div
        className={`p-5 rounded-2xl border mb-6 backdrop-blur-md ${
          isDark
            ? 'bg-[#0D1524]/90 border-sky-500/20'
            : 'bg-white/90 border-slate-300/90'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium mb-2.5">
          <span>
            Sinkronisasi Misi Harian:{' '}
            <strong className="font-mono-tabular">
              {Math.round((completedCount / totalCount) * 100)}%
            </strong>{' '}
            tuntas
          </span>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            +{dailyPointsEarned} poin diraih hari ini · Total{' '}
            {playerStats.totalSolved + playerStats.practiceSolved} matriks diselesaikan
          </span>
        </div>
        <div
          className={`w-full h-2.5 rounded-full overflow-hidden ${
            isDark ? 'bg-[#070B12]' : 'bg-slate-200'
          }`}
        >
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* List of Daily Achievements (Single-Elevation Divider List) */}
      <div
        className={`rounded-2xl border divide-y backdrop-blur-md ${
          isDark
            ? 'bg-[#0D1524]/90 border-sky-500/20 divide-sky-500/15'
            : 'bg-white/90 border-slate-300/90 divide-slate-200/80'
        }`}
      >
        {achievements.map((item, idx) => {
          const pct = Math.min(100, Math.round((item.progress / item.target) * 100));
          const launch = getMissionLaunchTarget(item.id);

          return (
            <div
              key={item.id}
              className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 max-w-2xl">
                <div className="mt-0.5 shrink-0">
                  {item.completed ? (
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        isDark ? 'text-emerald-400' : 'text-emerald-700'
                      }`}
                    />
                  ) : (
                    <Circle
                      className={`w-5 h-5 ${
                        isDark ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                    <span className="font-mono-tabular font-semibold opacity-60">
                      0{idx + 1}.
                    </span>
                    <span
                      className={
                        item.completed
                          ? isDark
                            ? 'text-emerald-400 font-semibold'
                            : 'text-emerald-700 font-semibold'
                          : isDark
                          ? 'text-slate-400'
                          : 'text-slate-500'
                      }
                    >
                      {item.completed ? 'Tuntas ✓' : `Berjalan (${item.progress}/${item.target})`}
                    </span>
                    <span aria-hidden="true" className="opacity-40">
                      ·
                    </span>
                    <span className="font-mono-tabular font-medium text-amber-500 dark:text-amber-400">
                      +{item.rewardPoints} Poin Motivasi
                    </span>
                    {item.completedAt && (
                      <>
                        <span aria-hidden="true" className="opacity-40">
                          ·
                        </span>
                        <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
                          Diraih pukul {item.completedAt}
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {item.description}
                  </p>

                  {/* Individual progress bar when multi-step */}
                  {item.target > 1 && (
                    <div className="mt-3 flex items-center gap-3 max-w-xs">
                      <div
                        className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                          isDark ? 'bg-[#070B12]' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className="h-full bg-sky-500 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono-tabular font-medium">
                        {item.progress}/{item.target}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="sm:self-center shrink-0">
                {item.completed ? (
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      isDark ? 'text-emerald-400' : 'text-emerald-700'
                    }`}
                  >
                    <span>Misi Tercapai</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onStartMission(launch.mode, launch.size)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      isDark
                        ? 'bg-[#162338] text-sky-300 border border-sky-500/30 hover:bg-[#1E304C]'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <span>{launch.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
