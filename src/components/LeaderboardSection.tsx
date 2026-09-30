import React, { useState } from 'react';
import { Check, Edit3, Play, Trash2, Trophy } from 'lucide-react';
import { BoardSize, LeaderboardEntry, PlayerStats, PuzzleMechanic } from '../types/game';
import { formatTimeMs } from '../utils/puzzleLogic';

interface LeaderboardSectionProps {
  entries: LeaderboardEntry[];
  playerStats: PlayerStats;
  isDark: boolean;
  initialSize?: BoardSize;
  initialMechanic?: PuzzleMechanic;
  onUpdateProfile: (name: string, region: string) => void;
  onPlayBoard: (size: BoardSize, mechanic: PuzzleMechanic) => void;
  onClearAllHistory: () => void;
}

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({
  entries,
  playerStats,
  isDark,
  initialSize = 3,
  initialMechanic = 'SLIDE',
  onUpdateProfile,
  onPlayBoard,
  onClearAllHistory,
}) => {
  const [selectedSize, setSelectedSize] = useState<BoardSize>(initialSize);
  const [selectedMechanic, setSelectedMechanic] = useState<PuzzleMechanic>(initialMechanic);
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'ID' | 'MINE'>('ALL');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [nameInput, setNameInput] = useState(playerStats.playerName);
  const [regionInput, setRegionInput] = useState(playerStats.region);

  const filteredEntries = entries
    .filter((e) => e.boardSize === selectedSize && e.mechanic === selectedMechanic)
    .filter((e) => {
      if (scopeFilter === 'ID') {
        return e.region.toLowerCase().includes('id') || e.region.toLowerCase().includes('indonesia');
      }
      if (scopeFilter === 'MINE') {
        return Boolean(e.isUser);
      }
      return true;
    })
    .sort((a, b) => {
      if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
      return a.moves - b.moves;
    });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim() || 'Pemain';
    const cleanRegion = regionInput.trim() || 'Indonesia';
    onUpdateProfile(cleanName, cleanRegion);
    setIsEditingProfile(false);
  };

  return (
    <div className="max-w-[1060px] mx-auto">
      {/* Header & Player Identity Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p
            className={`text-xs font-medium mb-1.5 ${
              isDark ? 'text-sky-400' : 'text-sky-700'
            }`}
          >
            Telemetri Kecepatan & Presisi · Basis Data Luring
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Papan Peringkat Global
          </h1>
          <p className={`text-sm mt-1.5 max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Daftar catatan waktu tercepat dan langkah paling efisien. Setiap kali Anda menyelesaikan
            Mode Kompetitif, rekor baru Anda langsung tercatat.
          </p>
        </div>

        {/* Editable Player Identity & Clear History Action */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div
            className={`p-3.5 rounded-xl border backdrop-blur-md ${
              isDark
                ? 'bg-[#0D1524]/90 border-sky-500/20'
                : 'bg-white/90 border-slate-300/90'
            }`}
          >
            {!isEditingProfile ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Identitas Operator Anda
                  </div>
                  <div className="text-sm font-semibold mt-0.5">
                    {playerStats.playerName}{' '}
                    <span aria-hidden="true" className="opacity-50">
                      ·
                    </span>{' '}
                    <span className={`font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {playerStats.region}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(playerStats.playerName);
                    setRegionInput(playerStats.region);
                    setIsEditingProfile(true);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isDark
                      ? 'bg-[#152238] text-sky-300 border border-sky-500/30 hover:bg-[#1B2C47]'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah Nama</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nama Pemain"
                  maxLength={28}
                  className={`px-2.5 py-1.5 rounded-md text-xs border w-36 focus:outline-2 focus:outline-sky-500 ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <input
                  type="text"
                  value={regionInput}
                  onChange={(e) => setRegionInput(e.target.value)}
                  placeholder="Kota, Negara"
                  maxLength={24}
                  className={`px-2.5 py-1.5 rounded-md text-xs border w-32 focus:outline-2 focus:outline-sky-500 ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
              </form>
            )}
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
              <span className="font-medium px-1">Yakin hapus semua histori?</span>
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

      {/* Interactive Filter Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b ${
          isDark ? 'border-sky-500/15' : 'border-slate-300/80'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Board Size Filter */}
          <div
            role="group"
            aria-label="Filter ukuran papan"
            className={`inline-flex items-center gap-1 p-1 rounded-xl border ${
              isDark
                ? 'bg-[#0D1524] border-sky-500/20'
                : 'bg-slate-200/70 border-slate-300/70'
            }`}
          >
            {([3, 4, 5] as BoardSize[]).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedSize === sz
                    ? isDark
                      ? 'bg-sky-500 text-slate-950 shadow-xs'
                      : 'bg-white text-slate-950 shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Matriks {sz}×{sz}
              </button>
            ))}
          </div>

          {/* Mechanic Filter */}
          <div
            role="group"
            aria-label="Filter mekanisme permainan"
            className={`inline-flex items-center gap-1 p-1 rounded-xl border ${
              isDark
                ? 'bg-[#0D1524] border-sky-500/20'
                : 'bg-slate-200/70 border-slate-300/70'
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedMechanic('SLIDE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedMechanic === 'SLIDE'
                  ? isDark
                    ? 'bg-[#17263F] text-sky-300 border border-sky-500/40'
                    : 'bg-white text-slate-950 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Geser Ubin
            </button>
            <button
              type="button"
              onClick={() => setSelectedMechanic('SWAP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedMechanic === 'SWAP'
                  ? isDark
                    ? 'bg-[#17263F] text-sky-300 border border-sky-500/40'
                    : 'bg-white text-slate-950 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Tukar Cepat
            </button>
          </div>

          {/* Region / Scope Filter */}
          <div
            role="group"
            aria-label="Filter cakupan wilayah"
            className={`inline-flex items-center gap-1 p-1 rounded-xl border ${
              isDark
                ? 'bg-[#0D1524] border-sky-500/20'
                : 'bg-slate-200/70 border-slate-300/70'
            }`}
          >
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'ID', label: 'Nusantara' },
              { id: 'MINE', label: 'Catatan Saya' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScopeFilter(tab.id as 'ALL' | 'ID' | 'MINE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  scopeFilter === tab.id
                    ? isDark
                      ? 'bg-[#17263F] text-sky-300 border border-sky-500/40'
                      : 'bg-white text-slate-950 shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onPlayBoard(selectedSize, selectedMechanic)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Mainkan Matriks {selectedSize}×{selectedSize}</span>
        </button>
      </div>

      {/* Leaderboard Table */}
      <div
        className={`rounded-2xl border overflow-hidden backdrop-blur-md ${
          isDark
            ? 'bg-[#0D1524]/90 border-sky-500/20'
            : 'bg-white/90 border-slate-300/90'
        }`}
      >
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy
              className={`w-8 h-8 mx-auto mb-3 ${
                isDark ? 'text-sky-500/50' : 'text-slate-400'
              }`}
            />
            <h3 className="text-base font-semibold mb-1">
              Histori Papan Peringkat Kosong
            </h3>
            <p
              className={`text-xs max-w-md mx-auto mb-5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Belum ada histori waktu pada matriks {selectedSize}×{selectedSize} (
              {selectedMechanic === 'SLIDE' ? 'Geser Ubin' : 'Tukar Cepat'}). Selesaikan sesi
              permainan untuk mencatatkan rekor pertama.
            </p>
            <button
              type="button"
              onClick={() => onPlayBoard(selectedSize, selectedMechanic)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer"
            >
              Mulai Tantangan {selectedSize}×{selectedSize}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`border-b text-xs font-semibold ${
                    isDark
                      ? 'border-sky-500/20 text-slate-400 bg-[#070B12]/60'
                      : 'border-slate-200 text-slate-500 bg-slate-50/80'
                  }`}
                >
                  <th className="py-3.5 px-4 sm:px-6 w-20">Peringkat</th>
                  <th className="py-3.5 px-4">Operator & Wilayah</th>
                  <th className="py-3.5 px-4 text-right">Waktu Selesai</th>
                  <th className="py-3.5 px-4 text-right hidden sm:table-cell">Jumlah Langkah</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Skor Efisiensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-sky-500/10 text-sm">
                {filteredEntries.map((entry, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        entry.isUser
                          ? isDark
                            ? 'bg-sky-950/35'
                            : 'bg-sky-50/80'
                          : isDark
                          ? 'hover:bg-slate-800/40'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-mono-tabular font-bold">
                        <span
                          className={
                            rank === 1
                              ? isDark
                                ? 'text-amber-400'
                                : 'text-amber-600'
                              : isTop3
                              ? isDark
                                ? 'text-sky-400'
                                : 'text-sky-700'
                              : isDark
                              ? 'text-slate-400'
                              : 'text-slate-500'
                          }
                        >
                          #{String(rank).padStart(2, '0')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold">
                          {entry.playerName}
                          {entry.isUser && (
                            <span
                              className={`ml-2 text-xs font-normal ${
                                isDark ? 'text-sky-400' : 'text-sky-700'
                              }`}
                            >
                              · Rekor Anda
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-xs flex items-center gap-1.5 mt-0.5 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          <span>{entry.region}</span>
                          <span aria-hidden="true">·</span>
                          <span>{entry.date}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold">
                        {formatTimeMs(entry.timeMs)}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono-tabular hidden sm:table-cell ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        {entry.moves} gerakan
                      </td>
                      <td
                        className={`py-3.5 px-4 sm:px-6 text-right font-mono-tabular font-semibold ${
                          isDark ? 'text-emerald-400' : 'text-emerald-700'
                        }`}
                      >
                        {entry.score.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
