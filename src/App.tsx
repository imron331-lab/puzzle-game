import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Trash2,
  Trophy,
  Undo2,
} from 'lucide-react';
import { AmbientMusicPanel } from './components/AmbientMusicPanel';
import { DailyAchievementsSection } from './components/DailyAchievementsSection';
import { LeaderboardSection } from './components/LeaderboardSection';
import { PuzzleBoard } from './components/PuzzleBoard';
import { TopBar } from './components/TopBar';
import {
  BoardSize,
  DailyAchievement,
  GameState,
  HintSuggestion,
  LeaderboardEntry,
  MoveRecord,
  NavSection,
  PlayerStats,
  PlayMode,
  PracticeDifficulty,
  PuzzleMechanic,
  SoundscapeId,
} from './types/game';
import {
  attemptSlideMove,
  calculateScore,
  computeSmartHint,
  countCorrectTiles,
  formatTimeMs,
  generateSolvableBoard,
  isBoardSolved,
  isTileInCorrectSpot,
} from './utils/puzzleLogic';
import { soundEngine } from './utils/soundEngine';
import {
  clearAllGameHistory,
  getBestKey,
  getTodayDateString,
  loadDailyAchievements,
  loadDarkModePreference,
  loadLeaderboard,
  loadPlayerStats,
  saveDailyAchievements,
  saveDarkModePreference,
  saveLeaderboard,
  savePlayerStats,
} from './utils/storageData';

const BLITZ_LIMIT_MS: Record<BoardSize, number> = {
  3: 45000,
  4: 120000,
  5: 240000,
};

export default function App() {
  // Navigation & Theme
  const [activeNav, setActiveNav] = useState<NavSection>('PLAY');
  const [isDark, setIsDark] = useState<boolean>(() => loadDarkModePreference());

  // Audio State
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [soundscape, setSoundscape] = useState<SoundscapeId>('embun-pagi');
  const [musicVolume, setMusicVolume] = useState<number>(0.38);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(true);

  // Persistent Data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => loadLeaderboard());
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => loadPlayerStats());
  const [dailyAchievements, setDailyAchievements] = useState<DailyAchievement[]>(() =>
    loadDailyAchievements()
  );

  // Core Game Configuration
  const [playMode, setPlayMode] = useState<PlayMode>('COMPETITIVE');
  const [boardSize, setBoardSize] = useState<BoardSize>(3);
  const [mechanic, setMechanic] = useState<PuzzleMechanic>('SLIDE');
  const [practiceDifficulty, setPracticeDifficulty] = useState<PracticeDifficulty>('EASY');
  const [blitzCountdown, setBlitzCountdown] = useState<boolean>(false);

  // Active Board State
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [tiles, setTiles] = useState<number[]>(() =>
    generateSolvableBoard(3, 'SLIDE', 'STANDARD').tiles
  );
  const [moves, setMoves] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [selectedSwapIndex, setSelectedSwapIndex] = useState<number | null>(null);
  const [activeHint, setActiveHint] = useState<HintSuggestion | null>(null);
  const [hintsUsedCount, setHintsUsedCount] = useState<number>(0);
  const [showTargetPreview, setShowTargetPreview] = useState<boolean>(false);
  const [confirmSidebarClear, setConfirmSidebarClear] = useState<boolean>(false);

  // Round Victory / Notification State
  const [lastRoundScore, setLastRoundScore] = useState<number>(0);
  const [lastRoundRank, setLastRoundRank] = useState<number | null>(null);
  const [isNewPersonalBest, setIsNewPersonalBest] = useState<boolean>(false);
  const [unlockedToast, setUnlockedToast] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const lastMoveFromIdxRef = useRef<number | null>(null);

  // Sync Dark Mode Preference
  const handleToggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      saveDarkModePreference(next);
      return next;
    });
  };

  // Sync Audio Controls
  const handleToggleMusic = () => {
    const playing = soundEngine.toggleMusic();
    setIsMusicPlaying(playing);
  };

  const handleChangeSoundscape = (id: SoundscapeId) => {
    setSoundscape(id);
    soundEngine.setSoundscape(id);
    if (!isMusicPlaying) {
      soundEngine.startMusic();
      setIsMusicPlaying(true);
    }
  };

  const handleChangeVolume = (val: number) => {
    setMusicVolume(val);
    soundEngine.setMusicVolume(val);
  };

  const handleToggleSfx = () => {
    setSfxEnabled((prev) => {
      const next = !prev;
      soundEngine.setSfxEnabled(next);
      return next;
    });
  };

  // Start / Reset Board
  const initializeNewBoard = useCallback(
    (
      targetMode: PlayMode = playMode,
      targetSize: BoardSize = boardSize,
      targetMechanic: PuzzleMechanic = mechanic,
      targetDifficulty: PracticeDifficulty = practiceDifficulty,
      startImmediately: boolean = false
    ) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const effectiveDifficulty: PracticeDifficulty =
        targetMode === 'COMPETITIVE' ? 'STANDARD' : targetDifficulty;

      const generated = generateSolvableBoard(targetSize, targetMechanic, effectiveDifficulty);
      setTiles(generated.tiles);
      setMoves(0);
      setElapsedMs(0);
      setMoveHistory([]);
      setSelectedSwapIndex(null);
      setActiveHint(null);
      setHintsUsedCount(0);
      setShowTargetPreview(false);
      setIsNewPersonalBest(false);
      setLastRoundRank(null);
      lastMoveFromIdxRef.current = null;
      setGameState(startImmediately ? 'PLAYING' : 'TITLE_MENU');
    },
    [playMode, boardSize, mechanic, practiceDifficulty]
  );

  // Clear All History
  const handleClearAllHistory = useCallback(() => {
    const fresh = clearAllGameHistory();
    setLeaderboard(fresh.leaderboard);
    setPlayerStats(fresh.playerStats);
    setDailyAchievements(fresh.dailyAchievements);
    setConfirmSidebarClear(false);
    initializeNewBoard(playMode, boardSize, mechanic, practiceDifficulty, false);
    setUnlockedToast('Semua histori permainan, rekor peringkat, dan pencapaian berhasil dihapus.');
    window.setTimeout(() => setUnlockedToast(null), 4500);
  }, [initializeNewBoard, playMode, boardSize, mechanic, practiceDifficulty]);

  // Navigation switch handler
  const handleSelectNav = (nav: NavSection) => {
    setActiveNav(nav);
    if (nav === 'PLAY' && playMode !== 'COMPETITIVE') {
      setPlayMode('COMPETITIVE');
      initializeNewBoard('COMPETITIVE', boardSize, mechanic, 'STANDARD', false);
    } else if (nav === 'PRACTICE' && playMode !== 'PRACTICE') {
      setPlayMode('PRACTICE');
      initializeNewBoard('PRACTICE', boardSize, mechanic, practiceDifficulty, false);
    }
  };

  // Timer Effect
  useEffect(() => {
    if (gameState === 'PLAYING') {
      const startTimestamp = performance.now() - elapsedMs;
      timerRef.current = window.setInterval(() => {
        const currentElapsed = Math.floor(performance.now() - startTimestamp);
        if (
          playMode === 'COMPETITIVE' &&
          blitzCountdown &&
          currentElapsed >= BLITZ_LIMIT_MS[boardSize]
        ) {
          setElapsedMs(BLITZ_LIMIT_MS[boardSize]);
          setGameState('GAME_OVER');
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          setElapsedMs(currentElapsed);
        }
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, playMode, blitzCountdown, boardSize]);

  // Evaluate Victory & Update Stats / Leaderboard / Daily Achievements
  const handlePuzzleComplete = useCallback(
    (finalTiles: number[], finalMoves: number, finalTimeMs: number) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const effectiveTimeMs = Math.max(400, finalTimeMs);
      soundEngine.playVictory();
      setGameState('ROUND_SUMMARY');
      setActiveHint(null);

      const score = calculateScore(boardSize, effectiveTimeMs, finalMoves, mechanic);
      setLastRoundScore(score);

      const today = getTodayDateString();
      const bestKey = getBestKey(boardSize, mechanic);
      const prevBestTime = playerStats.bestTimes[bestKey];
      const achievedNewBest =
        playMode === 'COMPETITIVE' && (!prevBestTime || effectiveTimeMs < prevBestTime);
      setIsNewPersonalBest(achievedNewBest);

      const nextWinsSession = playerStats.consecutiveWinsSession + 1;
      let nextStreak = playerStats.currentStreak;
      if (playerStats.lastPlayedDate !== today) {
        nextStreak = playerStats.currentStreak + 1;
      }

      const nowTimeLabel = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      let newlyEarnedPoints = 0;
      const newlyUnlockedTitles: string[] = [];

      const updatedAchievements = dailyAchievements.map((ach) => {
        if (ach.completed) return ach;

        let nextProgress = ach.progress;
        if (ach.id === 'daily_first_solve') {
          nextProgress = 1;
        } else if (
          ach.id === 'daily_speed_3x3' &&
          boardSize === 3 &&
          effectiveTimeMs < 20000
        ) {
          nextProgress = 1;
        } else if (
          ach.id === 'daily_efficient_moves' &&
          playMode === 'COMPETITIVE' &&
          finalMoves < 35
        ) {
          nextProgress = 1;
        } else if (ach.id === 'daily_practice_master' && playMode === 'PRACTICE') {
          nextProgress = 1;
        } else if (ach.id === 'daily_three_wins') {
          nextProgress = Math.min(ach.target, ach.progress + 1);
        }

        const isNowCompleted = nextProgress >= ach.target;
        if (isNowCompleted) {
          newlyEarnedPoints += ach.rewardPoints;
          newlyUnlockedTitles.push(ach.title);
        }

        return {
          ...ach,
          progress: nextProgress,
          completed: isNowCompleted,
          completedAt: isNowCompleted ? nowTimeLabel : undefined,
        };
      });

      if (newlyUnlockedTitles.length > 0) {
        setUnlockedToast(`Misi Harian Tercapai: ${newlyUnlockedTitles.join(', ')}`);
        window.setTimeout(() => setUnlockedToast(null), 5000);
      }

      setDailyAchievements(updatedAchievements);
      saveDailyAchievements(updatedAchievements);

      const updatedStats: PlayerStats = {
        ...playerStats,
        totalSolved:
          playMode === 'COMPETITIVE' ? playerStats.totalSolved + 1 : playerStats.totalSolved,
        practiceSolved:
          playMode === 'PRACTICE' ? playerStats.practiceSolved + 1 : playerStats.practiceSolved,
        currentStreak: nextStreak,
        lastPlayedDate: today,
        totalPoints: playerStats.totalPoints + score + newlyEarnedPoints,
        bestTimes:
          playMode === 'COMPETITIVE'
            ? {
                ...playerStats.bestTimes,
                [bestKey]: prevBestTime
                  ? Math.min(prevBestTime, effectiveTimeMs)
                  : effectiveTimeMs,
              }
            : playerStats.bestTimes,
        bestMoves:
          playMode === 'COMPETITIVE'
            ? {
                ...playerStats.bestMoves,
                [bestKey]: playerStats.bestMoves[bestKey]
                  ? Math.min(playerStats.bestMoves[bestKey], finalMoves)
                  : finalMoves,
              }
            : playerStats.bestMoves,
        consecutiveWinsSession: nextWinsSession,
      };

      setPlayerStats(updatedStats);
      savePlayerStats(updatedStats);

      if (playMode === 'COMPETITIVE') {
        const newEntry: LeaderboardEntry = {
          id: `user-${Date.now()}`,
          playerName: updatedStats.playerName,
          region: updatedStats.region,
          boardSize,
          mechanic,
          timeMs: effectiveTimeMs,
          moves: finalMoves,
          score,
          date: 'Baru saja',
          isUser: true,
        };

        const nextLeaderboard = [...leaderboard, newEntry];
        setLeaderboard(nextLeaderboard);
        saveLeaderboard(nextLeaderboard);

        const sameCategory = nextLeaderboard
          .filter((e) => e.boardSize === boardSize && e.mechanic === mechanic)
          .sort((a, b) => (a.timeMs !== b.timeMs ? a.timeMs - b.timeMs : a.moves - b.moves));

        const rankIdx = sameCategory.findIndex((e) => e.id === newEntry.id);
        setLastRoundRank(rankIdx !== -1 ? rankIdx + 1 : null);
      }
    },
    [boardSize, mechanic, playMode, playerStats, dailyAchievements, leaderboard]
  );

  // Handle Tile Click (Slide or Swap)
  const handleTileClick = useCallback(
    (clickedIndex: number) => {
      if (gameState === 'PAUSED' || gameState === 'ROUND_SUMMARY' || gameState === 'GAME_OVER') {
        return;
      }

      const startingNow = gameState === 'TITLE_MENU';

      if (mechanic === 'SLIDE') {
        const result = attemptSlideMove(tiles, clickedIndex, boardSize);
        if (!result) return;

        if (startingNow) {
          setGameState('PLAYING');
        }

        const nextMoves = moves + 1;
        const emptyIdxBefore = tiles.indexOf(0);
        lastMoveFromIdxRef.current = clickedIndex;

        setMoveHistory((prev) => [
          ...prev,
          {
            tilesBefore: [...tiles],
            movedValue: result.movedValue,
            fromIndex: clickedIndex,
            toIndex: emptyIdxBefore,
          },
        ]);

        setTiles(result.nextTiles);
        setMoves(nextMoves);
        setActiveHint(null);

        if (isTileInCorrectSpot(result.nextTiles, emptyIdxBefore)) {
          soundEngine.playTileCorrect();
        } else {
          soundEngine.playTileSlide(result.shiftedCount);
        }

        if (isBoardSolved(result.nextTiles, 'SLIDE')) {
          handlePuzzleComplete(result.nextTiles, nextMoves, startingNow ? 600 : elapsedMs);
        }
      } else {
        // SWAP Mechanic
        if (selectedSwapIndex === null) {
          if (startingNow) {
            setGameState('PLAYING');
          }
          setSelectedSwapIndex(clickedIndex);
          soundEngine.playTileSlide(1);
          return;
        }

        if (selectedSwapIndex === clickedIndex) {
          setSelectedSwapIndex(null);
          return;
        }

        const nextTiles = [...tiles];
        const valA = nextTiles[selectedSwapIndex];
        nextTiles[selectedSwapIndex] = nextTiles[clickedIndex];
        nextTiles[clickedIndex] = valA;

        const nextMoves = moves + 1;
        setMoveHistory((prev) => [
          ...prev,
          {
            tilesBefore: [...tiles],
            movedValue: valA,
            fromIndex: selectedSwapIndex,
            toIndex: clickedIndex,
          },
        ]);

        setTiles(nextTiles);
        setMoves(nextMoves);
        setSelectedSwapIndex(null);
        setActiveHint(null);

        if (
          isTileInCorrectSpot(nextTiles, selectedSwapIndex) ||
          isTileInCorrectSpot(nextTiles, clickedIndex)
        ) {
          soundEngine.playTileCorrect();
        } else {
          soundEngine.playTileSlide(1);
        }

        if (isBoardSolved(nextTiles, 'SWAP')) {
          handlePuzzleComplete(nextTiles, nextMoves, startingNow ? 600 : elapsedMs);
        }
      }
    },
    [
      gameState,
      mechanic,
      tiles,
      boardSize,
      moves,
      selectedSwapIndex,
      elapsedMs,
      handlePuzzleComplete,
    ]
  );

  // Keyboard Navigation Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeNav !== 'PLAY' && activeNav !== 'PRACTICE') return;
      if (mechanic !== 'SLIDE') return;
      if (gameState === 'PAUSED' || gameState === 'ROUND_SUMMARY' || gameState === 'GAME_OVER') {
        return;
      }
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }

      const emptyIdx = tiles.indexOf(0);
      const emptyRow = Math.floor(emptyIdx / boardSize);
      const emptyCol = emptyIdx % boardSize;
      let targetTileIdx = -1;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (emptyRow < boardSize - 1) targetTileIdx = (emptyRow + 1) * boardSize + emptyCol;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (emptyRow > 0) targetTileIdx = (emptyRow - 1) * boardSize + emptyCol;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (emptyCol < boardSize - 1) targetTileIdx = emptyRow * boardSize + (emptyCol + 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (emptyCol > 0) targetTileIdx = emptyRow * boardSize + (emptyCol - 1);
      }

      if (targetTileIdx !== -1) {
        e.preventDefault();
        handleTileClick(targetTileIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNav, mechanic, gameState, tiles, boardSize, handleTileClick]);

  // Undo Move
  const handleUndoMove = () => {
    if (moveHistory.length === 0) return;
    const last = moveHistory[moveHistory.length - 1];
    setTiles(last.tilesBefore);
    setMoveHistory((prev) => prev.slice(0, -1));
    setMoves((m) => Math.max(0, m - 1));
    setActiveHint(null);
    setSelectedSwapIndex(null);
    soundEngine.playTileSlide(1);
  };

  // Smart Hint Request
  const handleRequestHint = () => {
    const suggestion = computeSmartHint(
      tiles,
      boardSize,
      mechanic,
      lastMoveFromIdxRef.current
    );
    if (suggestion) {
      setActiveHint(suggestion);
      setHintsUsedCount((c) => c + 1);
      soundEngine.playHint();
    }
  };

  // Update Player Profile Name/Region
  const handleUpdateProfile = (name: string, region: string) => {
    const nextStats = { ...playerStats, playerName: name, region };
    setPlayerStats(nextStats);
    savePlayerStats(nextStats);

    const updatedLb = leaderboard.map((entry) =>
      entry.isUser ? { ...entry, playerName: name, region } : entry
    );
    setLeaderboard(updatedLb);
    saveLeaderboard(updatedLb);
  };

  const { correct: correctTilesCount, totalTarget: totalTargetTiles } = countCorrectTiles(
    tiles,
    mechanic
  );
  const syncPercentage = Math.round((correctTilesCount / totalTargetTiles) * 100);
  const currentBestKey = getBestKey(boardSize, mechanic);
  const personalBestMs = playerStats.bestTimes[currentBestKey];
  const displayTimerMs =
    playMode === 'COMPETITIVE' && blitzCountdown
      ? Math.max(0, BLITZ_LIMIT_MS[boardSize] - elapsedMs)
      : elapsedMs;

  const topBoardEntries = leaderboard
    .filter((e) => e.boardSize === boardSize && e.mechanic === mechanic)
    .sort((a, b) => (a.timeMs !== b.timeMs ? a.timeMs - b.timeMs : a.moves - b.moves))
    .slice(0, 3);

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-150 ${
        isDark
          ? 'bg-orbital-grid-dark text-[#F3F4F6] dark'
          : 'bg-orbital-grid-light text-[#0F172A]'
      }`}
    >
      {/* Top Bar Contract */}
      <TopBar
        activeNav={activeNav}
        onSelectNav={handleSelectNav}
        isDark={isDark}
        onToggleDark={handleToggleDark}
        isMusicPlaying={isMusicPlaying}
        onToggleMusic={handleToggleMusic}
      />

      {/* Non-intrusive Toast Notification */}
      {unlockedToast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg border bg-[#0D1A2D] text-sky-100 border-sky-500/50 flex items-center gap-3 backdrop-blur-xl"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-medium">{unlockedToast}</div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeNav === 'LEADERBOARD' ? (
          <LeaderboardSection
            entries={leaderboard}
            playerStats={playerStats}
            isDark={isDark}
            initialSize={boardSize}
            initialMechanic={mechanic}
            onUpdateProfile={handleUpdateProfile}
            onPlayBoard={(sz, mech) => {
              setBoardSize(sz);
              setMechanic(mech);
              setPlayMode('COMPETITIVE');
              setActiveNav('PLAY');
              initializeNewBoard('COMPETITIVE', sz, mech, 'STANDARD', true);
            }}
            onClearAllHistory={handleClearAllHistory}
          />
        ) : activeNav === 'ACHIEVEMENTS' ? (
          <DailyAchievementsSection
            achievements={dailyAchievements}
            playerStats={playerStats}
            isDark={isDark}
            onStartMission={(targetMode, targetSize) => {
              setPlayMode(targetMode);
              setBoardSize(targetSize);
              setActiveNav(targetMode === 'PRACTICE' ? 'PRACTICE' : 'PLAY');
              initializeNewBoard(
                targetMode,
                targetSize,
                mechanic,
                targetMode === 'PRACTICE' ? practiceDifficulty : 'STANDARD',
                true
              );
            }}
            onClearAllHistory={handleClearAllHistory}
          />
        ) : (
          /* PLAY or PRACTICE Workspace (12-column responsive layout) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left / Center Column (7 cols): Primary Quantum Matrix Arena */}
            <div className="lg:col-span-7 flex flex-col">
              {/* Arena Title & Mode Kicker */}
              <div className="flex flex-wrap items-baseline justify-between gap-4 mb-4">
                <div>
                  <div
                    className={`text-xs font-medium mb-1 ${
                      isDark ? 'text-sky-400' : 'text-sky-700'
                    }`}
                  >
                    {playMode === 'COMPETITIVE'
                      ? 'Protokol Kompetitif · Kualifikasi Papan Peringkat Global'
                      : 'Simulasi Latihan Terpandu · Bebas Tekanan Waktu'}
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                    {playMode === 'COMPETITIVE'
                      ? `Matriks Urut 1–${mechanic === 'SLIDE' ? boardSize * boardSize - 1 : boardSize * boardSize}`
                      : 'Laboratorium Latihan Pola'}
                  </h1>
                </div>

                {/* Personal Best Unboxed Metadata */}
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>Rekor Terbaik ({boardSize}×{boardSize}): </span>
                  <strong className="font-mono-tabular font-semibold text-sky-600 dark:text-sky-400">
                    {personalBestMs ? formatTimeMs(personalBestMs) : 'Belum ada'}
                  </strong>
                </div>
              </div>

              {/* Matrix Configuration Controls */}
              <div
                className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border backdrop-blur-md mb-4 ${
                  isDark
                    ? 'bg-[#0D1524]/90 border-sky-500/20'
                    : 'bg-white/90 border-slate-300/90'
                }`}
              >
                {/* Grid Size Selector */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-medium mr-1 hidden sm:inline ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Dimensi:
                  </span>
                  <div
                    role="group"
                    aria-label="Pilih ukuran papan"
                    className={`inline-flex items-center gap-1 p-1 rounded-lg border ${
                      isDark
                        ? 'bg-[#070B12] border-sky-500/15'
                        : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    {([3, 4, 5] as BoardSize[]).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setBoardSize(sz);
                          initializeNewBoard(playMode, sz, mechanic, practiceDifficulty, false);
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          boardSize === sz
                            ? isDark
                              ? 'bg-sky-500 text-slate-950 shadow-[0_0_12px_rgba(14,165,233,0.4)]'
                              : 'bg-sky-600 text-white shadow-xs'
                            : isDark
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {sz}×{sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mechanic Toggle (Geser Ubin vs Tukar Cepat) */}
                <div
                  role="group"
                  aria-label="Pilih cara menyusun angka"
                  className={`inline-flex items-center gap-1 p-1 rounded-lg border ${
                    isDark
                      ? 'bg-[#070B12] border-sky-500/15'
                      : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMechanic('SLIDE');
                      initializeNewBoard(playMode, boardSize, 'SLIDE', practiceDifficulty, false);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      mechanic === 'SLIDE'
                        ? isDark
                          ? 'bg-[#17263F] text-sky-300 border border-sky-500/40'
                          : 'bg-white text-slate-950 shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Geser Ubin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMechanic('SWAP');
                      initializeNewBoard(playMode, boardSize, 'SWAP', practiceDifficulty, false);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      mechanic === 'SWAP'
                        ? isDark
                          ? 'bg-[#17263F] text-sky-300 border border-sky-500/40'
                          : 'bg-white text-slate-950 shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tukar Cepat
                  </button>
                </div>

                {/* Mode-specific 3rd selector */}
                {playMode === 'COMPETITIVE' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const nextBlitz = !blitzCountdown;
                      setBlitzCountdown(nextBlitz);
                      initializeNewBoard('COMPETITIVE', boardSize, mechanic, 'STANDARD', false);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      blitzCountdown
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/45'
                        : isDark
                        ? 'bg-[#070B12] text-slate-400 border border-sky-500/15 hover:text-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>{blitzCountdown ? 'Hitung Mundur: Aktif' : 'Kronometer Cepat'}</span>
                  </button>
                ) : (
                  <div
                    role="group"
                    aria-label="Tingkat acak latihan"
                    className={`inline-flex items-center gap-1 p-1 rounded-lg border ${
                      isDark
                        ? 'bg-[#070B12] border-sky-500/15'
                        : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    {(
                      [
                        { id: 'EASY', label: 'Mudah' },
                        { id: 'MEDIUM', label: 'Sedang' },
                        { id: 'STANDARD', label: 'Penuh' },
                      ] as { id: PracticeDifficulty; label: string }[]
                    ).map((diff) => (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => {
                          setPracticeDifficulty(diff.id);
                          initializeNewBoard('PRACTICE', boardSize, mechanic, diff.id, false);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          practiceDifficulty === diff.id
                            ? isDark
                              ? 'bg-[#17263F] text-sky-300 border border-sky-500/40'
                              : 'bg-white text-sky-800 shadow-xs'
                            : isDark
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {diff.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Futuristic Telemetry & Chronometer HUD */}
              <div
                className={`p-4 rounded-2xl border backdrop-blur-md mb-5 ${
                  isDark
                    ? 'bg-[#0D1524]/90 border-sky-500/20'
                    : 'bg-white/90 border-slate-300/90'
                }`}
              >
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {playMode === 'COMPETITIVE' && blitzCountdown
                        ? 'Sisa Waktu'
                        : 'Kronometer Presisi'}
                    </div>
                    <div
                      className={`font-mono-tabular text-2xl sm:text-3xl font-bold mt-0.5 ${
                        playMode === 'COMPETITIVE' &&
                        blitzCountdown &&
                        displayTimerMs < 10000 &&
                        gameState === 'PLAYING'
                          ? 'text-red-500'
                          : isDark
                          ? 'text-white'
                          : 'text-slate-950'
                      }`}
                    >
                      {formatTimeMs(displayTimerMs)}
                    </div>
                  </div>

                  <div
                    className={`pl-4 border-l ${
                      isDark ? 'border-sky-500/15' : 'border-slate-200'
                    }`}
                  >
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Transisi Langkah
                    </div>
                    <div className="font-mono-tabular text-2xl sm:text-3xl font-bold mt-0.5">
                      {moves}
                    </div>
                  </div>

                  <div
                    className={`pl-4 border-l ${
                      isDark ? 'border-sky-500/15' : 'border-slate-200'
                    }`}
                  >
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Sinkronisasi Urutan
                    </div>
                    <div className="font-mono-tabular text-2xl sm:text-3xl font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">
                      {correctTilesCount}/{totalTargetTiles}
                    </div>
                  </div>
                </div>

                {/* Live Synchronization Progress Bar */}
                <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-sky-500/15 flex items-center gap-3">
                  <div
                    className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                      isDark ? 'bg-[#070B12]' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-200"
                      style={{ width: `${syncPercentage}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono-tabular font-semibold text-sky-600 dark:text-sky-400 shrink-0">
                    {syncPercentage}% Selaras
                  </span>
                </div>
              </div>

              {/* Active Smart Hint Banner */}
              {activeHint && (
                <div
                  role="region"
                  aria-label="Saran langkah berikutnya"
                  className={`mb-4 p-3.5 rounded-xl border flex items-start justify-between gap-3 backdrop-blur-md ${
                    isDark
                      ? 'bg-amber-950/35 border-amber-400/50 text-amber-200'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">{activeHint.directionLabel}: </span>
                      <span>{activeHint.reason}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTileClick(activeHint.tileIndex)}
                    className="px-3 py-1 rounded-md text-xs font-semibold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Eksekusi Langkah
                  </button>
                </div>
              )}

              {/* Futuristic Quantum Matrix Board */}
              <PuzzleBoard
                tiles={tiles}
                size={boardSize}
                mechanic={mechanic}
                selectedSwapIndex={selectedSwapIndex}
                activeHint={activeHint}
                showTargetPreview={showTargetPreview}
                isPaused={gameState === 'PAUSED'}
                isDark={isDark}
                onTileClick={handleTileClick}
                onResumeFromPause={() => setGameState('PLAYING')}
              />

              {/* Primary Game Action Toolbar Below Board */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  {gameState === 'TITLE_MENU' ? (
                    <button
                      type="button"
                      onClick={() => setGameState('PLAYING')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Mulai Sesi</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setGameState((s) => (s === 'PLAYING' ? 'PAUSED' : 'PLAYING'))
                      }
                      disabled={gameState === 'ROUND_SUMMARY' || gameState === 'GAME_OVER'}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 ${
                        isDark
                          ? 'bg-[#0D1524] text-slate-200 border-sky-500/25 hover:border-sky-400/50'
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {gameState === 'PAUSED' ? (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Lanjutkan</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Jeda Waktu</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      initializeNewBoard(playMode, boardSize, mechanic, practiceDifficulty, true)
                    }
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                      isDark
                        ? 'bg-[#0D1524] text-slate-200 border-sky-500/25 hover:border-sky-400/50'
                        : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Acak Ulang Matriks</span>
                  </button>
                </div>

                {/* Practice & Helper Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRequestHint}
                    disabled={gameState === 'ROUND_SUMMARY' || gameState === 'GAME_OVER'}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 ${
                      isDark
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/35 hover:bg-amber-500/25'
                        : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200/80'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Vektor Petunjuk</span>
                  </button>

                  {playMode === 'PRACTICE' && (
                    <>
                      <button
                        type="button"
                        onClick={handleUndoMove}
                        disabled={moveHistory.length === 0}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 ${
                          isDark
                            ? 'bg-[#0D1524] text-slate-200 border-sky-500/25 hover:border-sky-400/50'
                            : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Urungkan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowTargetPreview((p) => !p)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                          showTargetPreview
                            ? 'bg-sky-500 text-slate-950 border-sky-400'
                            : isDark
                            ? 'bg-[#0D1524] text-slate-200 border-sky-500/25 hover:border-sky-400/50'
                            : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {showTargetPreview ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        <span>{showTargetPreview ? 'Tutup Proyeksi' : 'Proyeksi Target'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Victory / Game Over Banner Card */}
              {(gameState === 'ROUND_SUMMARY' || gameState === 'GAME_OVER') && (
                <div
                  role="region"
                  aria-live="polite"
                  className={`mt-6 p-6 rounded-2xl border backdrop-blur-xl ${
                    gameState === 'ROUND_SUMMARY'
                      ? isDark
                        ? 'bg-[#0C2229]/95 border-emerald-400/50 text-slate-100 shadow-[0_0_30px_rgba(16,185,129,0.12)]'
                        : 'bg-emerald-50/95 border-emerald-300 text-slate-900'
                      : isDark
                      ? 'bg-red-950/40 border-red-500/40 text-slate-100'
                      : 'bg-red-50 border-red-200 text-slate-900'
                  }`}
                >
                  {gameState === 'ROUND_SUMMARY' ? (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-xs font-semibold ${
                            isDark ? 'text-emerald-400' : 'text-emerald-800'
                          }`}
                        >
                          Sinkronisasi Matriks Selesai ✓
                          {isNewPersonalBest ? ' · Rekor Waktu Baru!' : ''}
                        </span>
                        {lastRoundRank !== null && playMode === 'COMPETITIVE' && (
                          <span className="text-xs font-mono-tabular font-semibold text-sky-400">
                            Peringkat #{lastRoundRank} pada Matriks {boardSize}×{boardSize}
                          </span>
                        )}
                      </div>

                      <h2 className="font-display text-2xl font-bold mb-3">
                        Urutan Tuntas dalam {formatTimeMs(elapsedMs)}!
                      </h2>

                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm mb-5">
                        <span>
                          Total Transisi:{' '}
                          <strong className="font-mono-tabular">{moves} langkah</strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Skor Efisiensi:{' '}
                          <strong className="font-mono-tabular">
                            {lastRoundScore.toLocaleString('id-ID')} poin
                          </strong>
                        </span>
                        {hintsUsedCount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{hintsUsedCount} vektor petunjuk digunakan</span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            initializeNewBoard(
                              playMode,
                              boardSize,
                              mechanic,
                              practiceDifficulty,
                              true
                            )
                          }
                          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Main Lagi Sekarang
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveNav('LEADERBOARD')}
                          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            isDark
                              ? 'bg-[#0D1524] text-slate-200 border-sky-500/30 hover:bg-[#16233A]'
                              : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Buka Papan Peringkat
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-semibold text-red-400">
                        Batas Waktu Habis
                      </span>
                      <h2 className="font-display text-2xl font-bold mt-1 mb-2">
                        Waktu Hitung Mundur Selesai
                      </h2>
                      <p
                        className={`text-sm mb-4 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        Anda berhasil menyelaraskan {correctTilesCount} dari {totalTargetTiles}{' '}
                        angka sebelum batas waktu berakhir. Coba lagi atau gunakan mode Kronometer
                        Cepat!
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          initializeNewBoard(
                            playMode,
                            boardSize,
                            mechanic,
                            practiceDifficulty,
                            true
                          )
                        }
                        className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column (5 cols): Futuristic Orbital Companion Console */}
            <aside
              className={`lg:col-span-5 p-5 sm:p-6 rounded-2xl border backdrop-blur-xl flex flex-col gap-6 ${
                isDark
                  ? 'bg-[#0D1524]/90 border-sky-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.35)]'
                  : 'bg-white/90 border-slate-300/90 shadow-xs'
              }`}
            >
              {/* 1. Quick Mode Switcher & Guide */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h2 className="text-base font-semibold">Konfigurasi Mode</h2>
                  <span
                    className={`text-xs ${isDark ? 'text-sky-400/80' : 'text-sky-700'}`}
                  >
                    Ergonomis untuk segala usia
                  </span>
                </div>

                <div
                  role="group"
                  aria-label="Pilih mode kompetitif atau latihan"
                  className={`grid grid-cols-2 gap-1.5 p-1 rounded-xl border ${
                    isDark
                      ? 'bg-[#070B12] border-sky-500/15'
                      : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setPlayMode('COMPETITIVE');
                      setActiveNav('PLAY');
                      initializeNewBoard('COMPETITIVE', boardSize, mechanic, 'STANDARD', false);
                    }}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center whitespace-nowrap ${
                      playMode === 'COMPETITIVE'
                        ? isDark
                          ? 'bg-sky-500 text-slate-950 shadow-[0_0_12px_rgba(14,165,233,0.35)]'
                          : 'bg-sky-600 text-white shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mode Kompetitif
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlayMode('PRACTICE');
                      setActiveNav('PRACTICE');
                      initializeNewBoard(
                        'PRACTICE',
                        boardSize,
                        mechanic,
                        practiceDifficulty,
                        false
                      );
                    }}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center whitespace-nowrap ${
                      playMode === 'PRACTICE'
                        ? isDark
                          ? 'bg-sky-500 text-slate-950 shadow-[0_0_12px_rgba(14,165,233,0.35)]'
                          : 'bg-sky-600 text-white shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mode Latihan
                  </button>
                </div>

                <p
                  className={`text-xs leading-relaxed mt-3 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {mechanic === 'SLIDE'
                    ? 'Ketuk ubin angka yang sebaris atau sekolom dengan slot kosong untuk menggesernya secara presisi. Mendukung geser multi-ubin sekaligus maupun tombol panah keyboard.'
                    : 'Mode Tukar Cepat: Ketuk dua ubin angka mana saja untuk langsung menukar posisinya hingga matriks tersusun urut.'}
                </p>
              </div>

              {/* 2. Daily Achievements Progress Snapshot */}
              <div
                className={`pt-5 border-t ${
                  isDark ? 'border-sky-500/15' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Award
                      className={`w-4 h-4 ${
                        isDark ? 'text-amber-400' : 'text-amber-600'
                      }`}
                    />
                    <h3 className="text-sm font-semibold">Pencapaian Harian</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav('ACHIEVEMENTS')}
                    className={`text-xs font-semibold hover:underline cursor-pointer ${
                      isDark ? 'text-sky-400' : 'text-sky-700'
                    }`}
                  >
                    Lihat Semua ({dailyAchievements.filter((a) => a.completed).length}/
                    {dailyAchievements.length})
                  </button>
                </div>

                <div className="space-y-2.5">
                  {dailyAchievements.slice(0, 3).map((ach) => (
                    <div
                      key={ach.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`font-mono-tabular font-bold ${
                            ach.completed
                              ? isDark
                                ? 'text-emerald-400'
                                : 'text-emerald-700'
                              : isDark
                              ? 'text-slate-500'
                              : 'text-slate-400'
                          }`}
                        >
                          {ach.completed ? '✓' : '○'}
                        </span>
                        <span
                          className={`truncate ${
                            ach.completed
                              ? isDark
                                ? 'line-through text-slate-500'
                                : 'line-through text-slate-400'
                              : 'font-medium'
                          }`}
                        >
                          {ach.title}
                        </span>
                      </div>
                      <span
                        className={`font-mono-tabular shrink-0 ${
                          ach.completed
                            ? isDark
                              ? 'text-emerald-400 font-semibold'
                              : 'text-emerald-700 font-semibold'
                            : isDark
                            ? 'text-slate-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {ach.completed ? 'Tuntas' : `${ach.progress}/${ach.target}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Top 3 Global Leaderboard Snapshot for Current Board */}
              <div
                className={`pt-5 border-t ${
                  isDark ? 'border-sky-500/15' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy
                      className={`w-4 h-4 ${
                        isDark ? 'text-sky-400' : 'text-sky-700'
                      }`}
                    />
                    <h3 className="text-sm font-semibold">
                      Peringkat Teratas ({boardSize}×{boardSize})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav('LEADERBOARD')}
                    className={`text-xs font-semibold hover:underline cursor-pointer ${
                      isDark ? 'text-sky-400' : 'text-sky-700'
                    }`}
                  >
                    Papan Penuh
                  </button>
                </div>

                {topBoardEntries.length === 0 ? (
                  <p className={`text-xs py-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Belum ada histori catatan waktu pada matriks {boardSize}×{boardSize}.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {topBoardEntries.map((entry, idx) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between gap-2 text-xs py-1"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`font-mono-tabular font-bold w-6 ${
                              idx === 0
                                ? 'text-amber-400'
                                : isDark
                                ? 'text-slate-400'
                                : 'text-slate-500'
                            }`}
                          >
                            #0{idx + 1}
                          </span>
                          <span className="font-medium truncate">{entry.playerName}</span>
                          <span
                            className={`truncate hidden sm:inline ${
                              isDark ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            · {entry.region}
                          </span>
                        </div>
                        <span className="font-mono-tabular font-semibold shrink-0">
                          {formatTimeMs(entry.timeMs)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Interactive Soothing Ambient Music Controller */}
              <AmbientMusicPanel
                isDark={isDark}
                isMusicPlaying={isMusicPlaying}
                onToggleMusic={handleToggleMusic}
                soundscape={soundscape}
                onChangeSoundscape={handleChangeSoundscape}
                volume={musicVolume}
                onChangeVolume={handleChangeVolume}
                sfxEnabled={sfxEnabled}
                onToggleSfx={handleToggleSfx}
              />

              {/* 5. Quick Tips & Clear All History Action */}
              <div
                className={`pt-4 border-t text-xs flex flex-col gap-3.5 ${
                  isDark
                    ? 'border-sky-500/15 text-slate-400'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-sky-500 dark:text-sky-400" />
                  <div>
                    <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      Strategi Matriks:
                    </strong>{' '}
                    Kunci baris paling atas terlebih dahulu (misal 1, 2, 3 pada papan 3×3), lalu
                    lanjutkan baris di bawahnya.
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span>Memori Penyimpanan:</span>
                  {!confirmSidebarClear ? (
                    <button
                      type="button"
                      onClick={() => setConfirmSidebarClear(true)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                        isDark
                          ? 'bg-red-950/25 border-red-500/35 text-red-300 hover:bg-red-950/45'
                          : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Semua Histori</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleClearAllHistory}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer whitespace-nowrap"
                      >
                        Ya, Hapus Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmSidebarClear(false)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer whitespace-nowrap ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer
        className={`mt-12 border-t py-5 text-xs transition-colors backdrop-blur-md ${
          isDark
            ? 'border-sky-500/15 text-slate-500 bg-[#070B12]/80'
            : 'border-slate-200/80 text-slate-500 bg-white/60'
        }`}
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span>UrutAngka — Sistem Simulasi Kecepatan & Presisi Matriks Angka</span>
            <span aria-hidden="true" className="mx-2">
              ·
            </span>
            <span>Berfungsi penuh secara luring</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleSelectNav('PLAY')}
              className="hover:underline cursor-pointer"
            >
              Mode Kompetitif
            </button>
            <button
              type="button"
              onClick={() => handleSelectNav('PRACTICE')}
              className="hover:underline cursor-pointer"
            >
              Mode Latihan
            </button>
            <button
              type="button"
              onClick={() => handleSelectNav('LEADERBOARD')}
              className="hover:underline cursor-pointer"
            >
              Papan Peringkat
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
