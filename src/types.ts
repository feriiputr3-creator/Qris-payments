export enum SymbolType {
  WILD = 'WILD',
  SCATTER = 'SCATTER',
  DRAGON_RED = 'DRAGON_RED',
  DRAGON_GREEN = 'DRAGON_GREEN',
  CHAR_8 = 'CHAR_8',
  BAMBOO_5 = 'BAMBOO_5',
  DOT_5 = 'DOT_5',
  CHAR_1 = 'CHAR_1',
  BAMBOO_1 = 'BAMBOO_1',
  DOT_1 = 'DOT_1',
}

export interface SymbolDef {
  id: string; // unique instance id for react keys and animations
  type: SymbolType;
  emoji: string;
  isWild: boolean;
  isScatter: boolean;
  isGold: boolean; // Mahjong Ways specific mechanic
  isWinning: boolean; // Flag to animate winning symbols
}

export const SYMBOL_PAYOUTS: Record<SymbolType, number[]> = {
  // Payouts for [1, 2, 3, 4, 5] of a kind
  [SymbolType.WILD]: [0, 0, 0, 0, 0],
  [SymbolType.SCATTER]: [0, 0, 0, 0, 0],
  [SymbolType.DRAGON_RED]: [0, 0, 30, 60, 100],
  [SymbolType.DRAGON_GREEN]: [0, 0, 20, 40, 80],
  [SymbolType.CHAR_8]: [0, 0, 15, 30, 60],
  [SymbolType.BAMBOO_5]: [0, 0, 10, 20, 40],
  [SymbolType.DOT_5]: [0, 0, 10, 20, 40],
  [SymbolType.CHAR_1]: [0, 0, 5, 10, 20],
  [SymbolType.BAMBOO_1]: [0, 0, 5, 10, 20],
  [SymbolType.DOT_1]: [0, 0, 5, 10, 20],
};

export const SYMBOL_WEIGHTS: Record<SymbolType, number> = {
  [SymbolType.WILD]: 2,
  [SymbolType.SCATTER]: 2, // Harder to get
  [SymbolType.DRAGON_RED]: 6,
  [SymbolType.DRAGON_GREEN]: 6,
  [SymbolType.CHAR_8]: 10,
  [SymbolType.BAMBOO_5]: 12,
  [SymbolType.DOT_5]: 12,
  [SymbolType.CHAR_1]: 15,
  [SymbolType.BAMBOO_1]: 15,
  [SymbolType.DOT_1]: 15,
};

export const SYMBOL_EMOJIS: Record<SymbolType, string> = {
  [SymbolType.WILD]: '💎',
  [SymbolType.SCATTER]: '🧧',
  [SymbolType.DRAGON_RED]: '🀄',
  [SymbolType.DRAGON_GREEN]: '🀅',
  [SymbolType.CHAR_8]: '🀏',
  [SymbolType.BAMBOO_5]: '🀔',
  [SymbolType.DOT_5]: '🀝',
  [SymbolType.CHAR_1]: '🀇',
  [SymbolType.BAMBOO_1]: '🀐',
  [SymbolType.DOT_1]: '🀙',
};

// Formatter for IDR
export const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
