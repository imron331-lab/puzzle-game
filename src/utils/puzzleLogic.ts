import { BoardSize, HintSuggestion, PracticeDifficulty, PuzzleMechanic } from '../types/game';

/**
 * Creates a solved board array.
 * For SLIDE mode: [1, 2, ..., N*N - 1, 0] where 0 is the empty slot.
 * For SWAP mode: [1, 2, ..., N*N] where all numbers are present.
 */
export function createSolvedBoard(size: BoardSize, mechanic: PuzzleMechanic): number[] {
  const total = size * size;
  if (mechanic === 'SLIDE') {
    return Array.from({ length: total }, (_, idx) => (idx === total - 1 ? 0 : idx + 1));
  } else {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }
}

export function isBoardSolved(tiles: number[], mechanic: PuzzleMechanic): boolean {
  const total = tiles.length;
  if (mechanic === 'SLIDE') {
    for (let i = 0; i < total - 1; i++) {
      if (tiles[i] !== i + 1) return false;
    }
    return tiles[total - 1] === 0;
  } else {
    for (let i = 0; i < total; i++) {
      if (tiles[i] !== i + 1) return false;
    }
    return true;
  }
}

export function countCorrectTiles(tiles: number[], mechanic: PuzzleMechanic): {
  correct: number;
  totalTarget: number;
} {
  const total = tiles.length;
  if (mechanic === 'SLIDE') {
    let correct = 0;
    for (let i = 0; i < total - 1; i++) {
      if (tiles[i] === i + 1) correct++;
    }
    return { correct, totalTarget: total - 1 };
  } else {
    let correct = 0;
    for (let i = 0; i < total; i++) {
      if (tiles[i] === i + 1) correct++;
    }
    return { correct, totalTarget: total };
  }
}

export function isTileInCorrectSpot(tiles: number[], index: number): boolean {
  const val = tiles[index];
  if (val === 0) return false;
  return val === index + 1;
}

function getNeighborIndices(index: number, size: BoardSize): number[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const neighbors: number[] = [];
  if (row > 0) neighbors.push((row - 1) * size + col);
  if (row < size - 1) neighbors.push((row + 1) * size + col);
  if (col > 0) neighbors.push(row * size + (col - 1));
  if (col < size - 1) neighbors.push(row * size + (col + 1));
  return neighbors;
}

/**
 * Generates a guaranteed-solvable board by applying valid non-backtracking moves
 * from the solved state. Also returns the reverse solution path for hints if needed.
 */
export function generateSolvableBoard(
  size: BoardSize,
  mechanic: PuzzleMechanic,
  difficulty: PracticeDifficulty = 'STANDARD'
): { tiles: number[]; solutionStack: number[] } {
  const tiles = createSolvedBoard(size, mechanic);

  if (mechanic === 'SLIDE') {
    const stepMap: Record<PracticeDifficulty, Record<BoardSize, number>> = {
      EASY: { 3: 7, 4: 10, 5: 14 },
      MEDIUM: { 3: 18, 4: 28, 5: 38 },
      STANDARD: { 3: 55, 4: 110, 5: 170 },
    };
    const shuffleSteps = stepMap[difficulty][size];
    let emptyIdx = tiles.indexOf(0);
    let prevEmptyIdx = -1;
    const solutionStack: number[] = [];

    for (let s = 0; s < shuffleSteps; s++) {
      const neighbors = getNeighborIndices(emptyIdx, size).filter((n) => n !== prevEmptyIdx);
      const chosenTileIdx = neighbors[Math.floor(Math.random() * neighbors.length)];

      // Record where empty was so reversing moves chosenTile back
      solutionStack.push(emptyIdx);

      // Swap empty and chosen neighbor
      tiles[emptyIdx] = tiles[chosenTileIdx];
      tiles[chosenTileIdx] = 0;

      prevEmptyIdx = emptyIdx;
      emptyIdx = chosenTileIdx;
    }

    // Ensure it didn't accidentally end up solved
    if (isBoardSolved(tiles, 'SLIDE')) {
      const neighbors = getNeighborIndices(emptyIdx, size);
      const chosen = neighbors[0];
      solutionStack.push(emptyIdx);
      tiles[emptyIdx] = tiles[chosen];
      tiles[chosen] = 0;
    }

    return { tiles, solutionStack };
  } else {
    // SWAP mechanic: perform random pair swaps based on difficulty
    const swapCounts: Record<PracticeDifficulty, Record<BoardSize, number>> = {
      EASY: { 3: 3, 4: 4, 5: 6 },
      MEDIUM: { 3: 6, 4: 9, 5: 12 },
      STANDARD: { 3: 14, 4: 24, 5: 36 },
    };
    const count = swapCounts[difficulty][size];
    const total = tiles.length;

    for (let i = 0; i < count; i++) {
      const a = Math.floor(Math.random() * total);
      let b = Math.floor(Math.random() * total);
      if (a === b) b = (a + 1) % total;
      const temp = tiles[a];
      tiles[a] = tiles[b];
      tiles[b] = temp;
    }

    if (isBoardSolved(tiles, 'SWAP')) {
      const temp = tiles[0];
      tiles[0] = tiles[1];
      tiles[1] = temp;
    }

    return { tiles, solutionStack: [] };
  }
}

/**
 * Slides one or more tiles if the clicked index shares a row or column with the empty space (0).
 * Returns new tiles array and count of shifted tiles, or null if invalid click.
 */
export function attemptSlideMove(
  tiles: number[],
  clickedIndex: number,
  size: BoardSize
): { nextTiles: number[]; shiftedCount: number; movedValue: number } | null {
  const emptyIndex = tiles.indexOf(0);
  if (clickedIndex === emptyIndex || clickedIndex < 0 || clickedIndex >= tiles.length) {
    return null;
  }

  const clickedRow = Math.floor(clickedIndex / size);
  const clickedCol = clickedIndex % size;
  const emptyRow = Math.floor(emptyIndex / size);
  const emptyCol = emptyIndex % size;

  if (clickedRow !== emptyRow && clickedCol !== emptyCol) {
    return null;
  }

  const nextTiles = [...tiles];
  const movedValue = tiles[clickedIndex];
  let shiftedCount = 0;

  if (clickedRow === emptyRow) {
    const step = clickedCol < emptyCol ? -1 : 1;
    for (let c = emptyCol; c !== clickedCol; c += step) {
      const targetIdx = emptyRow * size + c;
      const sourceIdx = emptyRow * size + (c + step);
      nextTiles[targetIdx] = nextTiles[sourceIdx];
      shiftedCount++;
    }
    nextTiles[clickedIndex] = 0;
  } else {
    const step = clickedRow < emptyRow ? -1 : 1;
    for (let r = emptyRow; r !== clickedRow; r += step) {
      const targetIdx = r * size + emptyCol;
      const sourceIdx = (r + step) * size + emptyCol;
      nextTiles[targetIdx] = nextTiles[sourceIdx];
      shiftedCount++;
    }
    nextTiles[clickedIndex] = 0;
  }

  return { nextTiles, shiftedCount, movedValue };
}

/**
 * Calculates total Manhattan distance of all numbered tiles from their target positions.
 */
function calculateBoardHeuristic(tiles: number[], size: BoardSize): number {
  let distance = 0;
  for (let i = 0; i < tiles.length; i++) {
    const val = tiles[i];
    if (val === 0) continue;
    const targetIdx = val - 1;
    const curRow = Math.floor(i / size);
    const curCol = i % size;
    const targetRow = Math.floor(targetIdx / size);
    const targetCol = targetIdx % size;
    const manhattan = Math.abs(curRow - targetRow) + Math.abs(curCol - targetCol);
    // Prioritize top rows and left columns slightly so solver guides top-to-bottom
    const priorityWeight = 1 + (size * size - val) * 0.04;
    distance += manhattan * priorityWeight;
  }
  return distance;
}

/**
 * Computes an intelligent hint for Practice Mode (or when requested).
 * Uses 2-ply lookahead with Manhattan distance + solution stack fallback for SLIDE mode,
 * or identifies the first misplaced number for SWAP mode.
 */
export function computeSmartHint(
  tiles: number[],
  size: BoardSize,
  mechanic: PuzzleMechanic,
  lastMovedTileIndex: number | null = null
): HintSuggestion | null {
  if (isBoardSolved(tiles, mechanic)) return null;

  if (mechanic === 'SWAP') {
    for (let i = 0; i < tiles.length; i++) {
      const expected = i + 1;
      if (tiles[i] !== expected) {
        const currentIdxOfExpected = tiles.indexOf(expected);
        const row = Math.floor(i / size) + 1;
        const col = (i % size) + 1;
        return {
          tileValue: expected,
          tileIndex: currentIdxOfExpected,
          targetIndex: i,
          directionLabel: `Tukar ke Baris ${row}, Kolom ${col}`,
          reason: `Ketuk angka ${expected} lalu tukar dengan angka ${tiles[i]} agar urutan awal langsung tepat.`,
        };
      }
    }
    return null;
  }

  // SLIDE Mode: Evaluate all valid neighbor moves with 2-ply lookahead
  const emptyIdx = tiles.indexOf(0);
  const neighbors = getNeighborIndices(emptyIdx, size);

  let bestNeighbor = neighbors[0];
  let bestScore = Infinity;

  for (const nIdx of neighbors) {
    const simulated = [...tiles];
    simulated[emptyIdx] = simulated[nIdx];
    simulated[nIdx] = 0;

    // Immediate solved check
    if (isBoardSolved(simulated, 'SLIDE')) {
      bestNeighbor = nIdx;
      break;
    }

    let score = calculateBoardHeuristic(simulated, size);

    // 2nd ply lookahead
    const nextNeighbors = getNeighborIndices(nIdx, size).filter((nn) => nn !== emptyIdx);
    let minSecondPly = score;
    for (const nnIdx of nextNeighbors) {
      const sim2 = [...simulated];
      sim2[nIdx] = sim2[nnIdx];
      sim2[nnIdx] = 0;
      const s2 = calculateBoardHeuristic(sim2, size);
      if (s2 < minSecondPly) minSecondPly = s2;
    }

    const combinedScore = score * 0.45 + minSecondPly * 0.55;
    // Penalize undoing the immediate last move
    const penalty = lastMovedTileIndex === emptyIdx ? 4.5 : 0;

    if (combinedScore + penalty < bestScore) {
      bestScore = combinedScore + penalty;
      bestNeighbor = nIdx;
    }
  }

  const tileVal = tiles[bestNeighbor];
  const fromRow = Math.floor(bestNeighbor / size);
  const fromCol = bestNeighbor % size;
  const toRow = Math.floor(emptyIdx / size);
  const toCol = emptyIdx % size;

  let dir = 'ke ruang kosong';
  if (toRow < fromRow) dir = 'ke Atas ↑';
  else if (toRow > fromRow) dir = 'ke Bawah ↓';
  else if (toCol < fromCol) dir = 'ke Kiri ←';
  else if (toCol > fromCol) dir = 'ke Kanan →';

  const targetRow = Math.floor((tileVal - 1) / size) + 1;
  const targetCol = ((tileVal - 1) % size) + 1;

  return {
    tileValue: tileVal,
    tileIndex: bestNeighbor,
    targetIndex: emptyIdx,
    directionLabel: `Geser ${dir}`,
    reason: `Geser ubin angka ${tileVal} ${dir} untuk mendekatkannya ke posisi akhir (Baris ${targetRow}, Kolom ${targetCol}).`,
  };
}

/**
 * Calculates competitive score based on board size, completion time, and move count.
 */
export function calculateScore(
  size: BoardSize,
  timeMs: number,
  moves: number,
  mechanic: PuzzleMechanic
): number {
  const baseBySize: Record<BoardSize, number> = {
    3: 1500,
    4: 3500,
    5: 6500,
  };
  const parTimeSec: Record<BoardSize, number> = {
    3: 18,
    4: 55,
    5: 130,
  };
  const parMoves: Record<BoardSize, number> = {
    3: 24,
    4: 70,
    5: 150,
  };

  const base = baseBySize[size];
  const sec = Math.max(1, timeMs / 1000);
  const timeFactor = Math.min(1.6, parTimeSec[size] / sec);
  const moveFactor = Math.min(1.4, parMoves[size] / Math.max(1, moves));
  const mechanicMultiplier = mechanic === 'SLIDE' ? 1.0 : 0.85;

  return Math.max(100, Math.round(base * (timeFactor * 0.65 + moveFactor * 0.35) * mechanicMultiplier));
}

export function formatTimeMs(ms: number): string {
  const totalTenths = Math.floor(ms / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const minStr = String(minutes).padStart(2, '0');
  const secStr = String(seconds).padStart(2, '0');
  return `${minStr}:${secStr}.${tenths}`;
}
