import {
  SymbolType,
  SymbolDef,
  SYMBOL_WEIGHTS,
  SYMBOL_EMOJIS,
  SYMBOL_PAYOUTS,
} from './types';

export const REELS = 5;
export const ROWS = 4;

const generateRandomSymbol = (isMiddleReel: boolean): SymbolType => {
  let totalWeight = 0;
  for (const type in SYMBOL_WEIGHTS) {
    totalWeight += SYMBOL_WEIGHTS[type as SymbolType];
  }

  let random = Math.random() * totalWeight;
  for (const type in SYMBOL_WEIGHTS) {
    random -= SYMBOL_WEIGHTS[type as SymbolType];
    if (random <= 0) {
      // Don't allow wilds or scatters on reels 1 and 5 (index 0 and 4) to control hit rate slightly
      if (!isMiddleReel && (type === SymbolType.WILD || type === SymbolType.SCATTER)) {
         return generateRandomSymbol(isMiddleReel); // Reroll
      }
      return type as SymbolType;
    }
  }
  return SymbolType.DOT_1; // Fallback
};

let symbolIdCounter = 0;

export const generateGrid = (): SymbolDef[][] => {
  const grid: SymbolDef[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: SymbolDef[] = [];
    for (let c = 0; c < REELS; c++) {
      const isMiddleReel = c > 0 && c < REELS - 1;
      const type = generateRandomSymbol(isMiddleReel);
      
      // Chance to be a gold symbol on middle reels (2, 3, 4 -> index 1, 2, 3)
      // Standard symbols can be gold, Wild/Scatter cannot
      const canBeGold = isMiddleReel && type !== SymbolType.WILD && type !== SymbolType.SCATTER;
      const isGold = canBeGold && Math.random() < 0.2; // 20% chance

      row.push({
        id: `sym-${symbolIdCounter++}-${Date.now()}`,
        type,
        emoji: SYMBOL_EMOJIS[type],
        isWild: type === SymbolType.WILD,
        isScatter: type === SymbolType.SCATTER,
        isGold,
        isWinning: false,
      });
    }
    grid.push(row);
  }
  return grid;
};

export interface WinResult {
  totalWinAmount: number;
  winningSymbols: { row: number; col: number }[]; // Grid coordinates
  scattersCount: number;
}

export const evaluateGrid = (grid: SymbolDef[][], betBase: number, multiplier: number): WinResult => {
  let totalWinAmount = 0;
  const winningPositions: Set<string> = new Set();
  let scattersCount = 0;
  
  // Count scatters
  for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < REELS; c++) {
          if (grid[r][c].isScatter) {
              scattersCount++;
              winningPositions.add(`${r},${c}`);
          }
      }
  }

  // Find ways for each symbol type (excluding WILD and SCATTER)
  const symbolTypes = Object.values(SymbolType).filter(
    (t) => t !== SymbolType.WILD && t !== SymbolType.SCATTER
  );

  for (const type of symbolTypes) {
    let consecutiveReels = 0;
    const symbolCountsPerReel: number[] = [0, 0, 0, 0, 0];
    const positionsPerReel: {row: number, col: number}[][] = [[], [], [], [], []];

    // Check reel by reel from left to right
    for (let col = 0; col < REELS; col++) {
      let foundInCol = false;
      for (let row = 0; row < ROWS; row++) {
        const sym = grid[row][col];
        if (sym.type === type || sym.isWild) {
          symbolCountsPerReel[col]++;
          positionsPerReel[col].push({row, col});
          foundInCol = true;
        }
      }

      if (foundInCol) {
        consecutiveReels++;
      } else {
        break; // Sequence broken
      }
    }

    if (consecutiveReels >= 3) {
      // We have a win for this symbol
      let ways = 1;
      for (let i = 0; i < consecutiveReels; i++) {
        ways *= symbolCountsPerReel[i];
      }
      
      const payoutIndex = consecutiveReels - 1; // 3 of a kind -> index 2
      const basePayout = SYMBOL_PAYOUTS[type as SymbolType][payoutIndex];
      const winAmount = ways * basePayout * betBase * multiplier;
      
      totalWinAmount += winAmount;

      // Mark winning positions
      for (let i = 0; i < consecutiveReels; i++) {
        for (const pos of positionsPerReel[i]) {
          winningPositions.add(`${pos.row},${pos.col}`);
        }
      }
    }
  }

  return {
    totalWinAmount,
    winningSymbols: Array.from(winningPositions).map(p => {
      const [r, c] = p.split(',').map(Number);
      return { row: r, col: c };
    }),
    scattersCount
  };
};

// Function to handle cascading
// Replaces winning symbols with new ones, or turns gold to wild
export const applyCascades = (grid: SymbolDef[][], winningSymbols: {row: number, col: number}[]): SymbolDef[][] => {
    // Clone grid
    const newGrid = grid.map(row => [...row]);
    
    // Process winning symbols:
    // If gold -> turn to wild, don't remove.
    // Else -> mark for removal (nullify)
    const toRemove: {row: number, col: number}[] = [];
    
    for (const {row, col} of winningSymbols) {
        const sym = newGrid[row][col];
        if (sym.isScatter) continue; // Scatters don't disappear in normal ways games until round ends usually, but let's keep it simple, they don't pop.
        
        if (sym.isGold) {
            // Transform to Wild
            newGrid[row][col] = {
                ...sym,
                id: `sym-${symbolIdCounter++}-${Date.now()}`,
                type: SymbolType.WILD,
                emoji: SYMBOL_EMOJIS[SymbolType.WILD],
                isWild: true,
                isGold: false, // No longer gold
                isWinning: false,
            };
        } else {
             toRemove.push({row, col});
        }
    }
    
    // Remove symbols and make them fall down (like gravity)
    // We process column by column
    for (let col = 0; col < REELS; col++) {
        let emptyCount = 0;
        // From bottom to top
        for (let row = ROWS - 1; row >= 0; row--) {
            const isRemoving = toRemove.some(p => p.row === row && p.col === col);
            if (isRemoving) {
                emptyCount++;
            } else if (emptyCount > 0) {
                // Move this symbol down by emptyCount
                newGrid[row + emptyCount][col] = newGrid[row][col];
            }
        }
        
        // Fill the empty spots at the top
        for (let i = 0; i < emptyCount; i++) {
            const isMiddleReel = col > 0 && col < REELS - 1;
            const type = generateRandomSymbol(isMiddleReel);
            const isGold = isMiddleReel && type !== SymbolType.WILD && type !== SymbolType.SCATTER && Math.random() < 0.2;
            
            newGrid[i][col] = {
                id: `sym-${symbolIdCounter++}-${Date.now()}`,
                type,
                emoji: SYMBOL_EMOJIS[type],
                isWild: type === SymbolType.WILD,
                isScatter: type === SymbolType.SCATTER,
                isGold,
                isWinning: false,
            };
        }
    }

    return newGrid;
};
