import { BoardSize, DailyAchievement, LeaderboardEntry, PlayerStats, PuzzleMechanic } from '../types/game';

const LEGACY_KEYS = [
  'urutangka_leaderboard_v1',
  'urutangka_player_stats_v1',
  'urutangka_daily_achievements_v1',
  'urutangka_daily_date_v1',
];

const STORAGE_KEYS = {
  LEADERBOARD: 'urutangka_leaderboard_v2_clean',
  PLAYER_STATS: 'urutangka_player_stats_v2_clean',
  DAILY_ACHIEVEMENTS: 'urutangka_daily_achievements_v2_clean',
  DAILY_DATE: 'urutangka_daily_date_v2_clean',
  THEME_DARK: 'urutangka_theme_dark_v2_futuristic',
};

// Immediately purge legacy v1 history keys if present
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  }
} catch {
  // ignore storage errors
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createDefaultPlayerStats(): PlayerStats {
  return {
    playerName: 'Pemain',
    region: 'Indonesia',
    totalSolved: 0,
    practiceSolved: 0,
    currentStreak: 0,
    lastPlayedDate: '',
    totalPoints: 0,
    bestTimes: {},
    bestMoves: {},
    consecutiveWinsSession: 0,
  };
}

export function createDefaultDailyAchievements(): DailyAchievement[] {
  return [
    {
      id: 'daily_first_solve',
      title: 'Pemanasan Otak Harian',
      description: 'Selesaikan 1 puzzle susun angka pada ukuran papan mana saja hari ini.',
      target: 1,
      progress: 0,
      completed: false,
      rewardPoints: 100,
      category: 'CONSISTENCY',
    },
    {
      id: 'daily_speed_3x3',
      title: 'Kilat Presisi 3×3',
      description: 'Selesaikan papan 3×3 dalam waktu kurang dari 20 detik.',
      target: 1,
      progress: 0,
      completed: false,
      rewardPoints: 200,
      category: 'SPEED',
    },
    {
      id: 'daily_efficient_moves',
      title: 'Langkah Hemat Energi',
      description: 'Selesaikan puzzle Kompetitif dengan jumlah langkah di bawah 35 gerakan.',
      target: 1,
      progress: 0,
      completed: false,
      rewardPoints: 180,
      category: 'ACCURACY',
    },
    {
      id: 'daily_practice_master',
      title: 'Eksplorasi Mode Latihan',
      description: 'Selesaikan 1 papan di Mode Latihan untuk mengasah pola urutan.',
      target: 1,
      progress: 0,
      completed: false,
      rewardPoints: 120,
      category: 'PRACTICE',
    },
    {
      id: 'daily_three_wins',
      title: 'Tiga Kemenangan Beruntun',
      description: 'Selesaikan total 3 puzzle dalam sesi bermain hari ini.',
      target: 3,
      progress: 0,
      completed: false,
      rewardPoints: 250,
      category: 'CONSISTENCY',
    },
  ];
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLeaderboard(entries: LeaderboardEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(entries));
  } catch {
    // ignore storage quota errors
  }
}

export function loadPlayerStats(): PlayerStats {
  const defaultStats = createDefaultPlayerStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYER_STATS);
    if (!raw) return defaultStats;
    return { ...defaultStats, ...JSON.parse(raw) };
  } catch {
    return defaultStats;
  }
}

export function savePlayerStats(stats: PlayerStats) {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_STATS, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function loadDailyAchievements(): DailyAchievement[] {
  const today = getTodayDateString();
  try {
    const savedDate = localStorage.getItem(STORAGE_KEYS.DAILY_DATE);
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_ACHIEVEMENTS);
    if (savedDate === today && raw) {
      return JSON.parse(raw) as DailyAchievement[];
    }
    const fresh = createDefaultDailyAchievements();
    localStorage.setItem(STORAGE_KEYS.DAILY_DATE, today);
    localStorage.setItem(STORAGE_KEYS.DAILY_ACHIEVEMENTS, JSON.stringify(fresh));
    return fresh;
  } catch {
    return createDefaultDailyAchievements();
  }
}

export function saveDailyAchievements(list: DailyAchievement[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_DATE, getTodayDateString());
    localStorage.setItem(STORAGE_KEYS.DAILY_ACHIEVEMENTS, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function clearAllGameHistory(): {
  leaderboard: LeaderboardEntry[];
  playerStats: PlayerStats;
  dailyAchievements: DailyAchievement[];
} {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem(STORAGE_KEYS.LEADERBOARD);
    localStorage.removeItem(STORAGE_KEYS.PLAYER_STATS);
    localStorage.removeItem(STORAGE_KEYS.DAILY_ACHIEVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.DAILY_DATE);
  } catch {
    // ignore
  }

  return {
    leaderboard: [],
    playerStats: createDefaultPlayerStats(),
    dailyAchievements: createDefaultDailyAchievements(),
  };
}

export function loadDarkModePreference(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME_DARK);
    if (raw !== null) return raw === 'true';
    return true;
  } catch {
    return true;
  }
}

export function saveDarkModePreference(isDark: boolean) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME_DARK, String(isDark));
  } catch {
    // ignore
  }
}

export function getBestKey(size: BoardSize, mechanic: PuzzleMechanic): string {
  return `${size}_${mechanic}`;
}
