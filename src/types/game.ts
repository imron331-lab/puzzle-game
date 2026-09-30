export type BoardSize = 3 | 4 | 5;

export type PlayMode = 'COMPETITIVE' | 'PRACTICE';

export type PuzzleMechanic = 'SLIDE' | 'SWAP';

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'ROUND_SUMMARY' | 'GAME_OVER';

export type PracticeDifficulty = 'EASY' | 'MEDIUM' | 'STANDARD';

export type NavSection = 'PLAY' | 'PRACTICE' | 'LEADERBOARD' | 'ACHIEVEMENTS';

export type SoundscapeId = 'embun-pagi' | 'taman-bambu' | 'hening-malam';

export interface MoveRecord {
  tilesBefore: number[];
  movedValue: number;
  fromIndex: number;
  toIndex: number;
}

export interface HintSuggestion {
  tileValue: number;
  tileIndex: number;
  targetIndex: number;
  directionLabel: string;
  reason: string;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  region: string;
  boardSize: BoardSize;
  mechanic: PuzzleMechanic;
  timeMs: number;
  moves: number;
  score: number;
  date: string;
  isUser?: boolean;
}

export interface DailyAchievement {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  completedAt?: string;
  rewardPoints: number;
  category: 'SPEED' | 'ACCURACY' | 'PRACTICE' | 'CONSISTENCY';
}

export interface PlayerStats {
  playerName: string;
  region: string;
  totalSolved: number;
  practiceSolved: number;
  currentStreak: number;
  lastPlayedDate: string;
  totalPoints: number;
  bestTimes: Record<string, number>; // key: `${boardSize}_${mechanic}`
  bestMoves: Record<string, number>;
  consecutiveWinsSession: number;
}
