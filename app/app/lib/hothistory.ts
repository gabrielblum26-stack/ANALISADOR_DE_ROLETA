import { classify, Classif, WHEEL_EU } from "./roulette";

// ============ TERMINAL ANALYSIS ============

export type TerminalPattern = {
  pattern: number[];
  nextTerminal: number;
  count: number;
  strength: number; // percentual
};

export type TerminalAnalysisResult = {
  patterns: TerminalPattern[];
  terminalStats: Record<number, { count: number; percentage: number }>;
};

export function analyzeTerminalPatterns(
  history: number[],
  patternLength: number,
  minRepetitions: number
): TerminalAnalysisResult {
  const patternMap: Record<string, { nextTerminal: number; count: number }> = {};

  // Percorrer histórico e registrar padrões
  for (let i = 0; i < history.length - 1; i++) {
    const pattern = history.slice(i, i + patternLength);
    if (pattern.length < patternLength) break;

    const nextNum = history[i + patternLength];
    if (nextNum === undefined) break;

    const nextTerminal = nextNum % 10;
    const patternKey = pattern.join(",");

    if (!patternMap[patternKey]) {
      patternMap[patternKey] = { nextTerminal, count: 0 };
    }
    patternMap[patternKey].count++;
  }

  // Filtrar por mínimo de repetições
  const patterns: TerminalPattern[] = Object.entries(patternMap)
    .filter(([_, data]) => data.count >= minRepetitions)
    .map(([patternStr, data]) => {
      const pattern = patternStr.split(",").map(Number);
      const strength = (data.count / (history.length - patternLength)) * 100;
      return {
        pattern,
        nextTerminal: data.nextTerminal,
        count: data.count,
        strength
      };
    })
    .sort((a, b) => b.strength - a.strength);

  // Calcular estatísticas de terminais
  const terminalStats: Record<number, { count: number; percentage: number }> = {};
  for (let i = 0; i <= 9; i++) {
    terminalStats[i] = { count: 0, percentage: 0 };
  }

  for (const num of history) {
    const terminal = num % 10;
    terminalStats[terminal].count++;
  }

  const totalCount = history.length;
  for (let i = 0; i <= 9; i++) {
    terminalStats[i].percentage = (terminalStats[i].count / totalCount) * 100;
  }

  return { patterns, terminalStats };
}

// ============ STRATEGY ANALYSIS ============

export type StrategyClassification = {
  color?: "red" | "black";
  parity?: "even" | "odd";
  half?: "low" | "high";
  dozen?: 1 | 2 | 3;
  column?: 1 | 2 | 3;
};

export type StrategyAnalysisResult = {
  colors: { red: number; black: number };
  parities: { even: number; odd: number };
  halves: { low: number; high: number };
  dozens: { 1: number; 2: number; 3: number };
  columns: { 1: number; 2: number; 3: number };
  intersectionNumbers: number[];
  intersectionOccurrences: number;
  intersectionPercentage: number;
  temperature: "cold" | "warm" | "hot" | "very_hot";
};

function getNumbersForStrategy(strategy: StrategyClassification): Set<number> {
  const numbers = new Set<number>();

  for (let n = 1; n <= 36; n++) {
    const classif = classify(n);
    let matches = true;

    if (strategy.color && classif.color !== strategy.color) matches = false;
    if (strategy.parity && classif.parity !== strategy.parity) matches = false;
    if (strategy.half && classif.half !== strategy.half) matches = false;
    if (strategy.dozen && classif.dozen !== strategy.dozen) matches = false;
    if (strategy.column && classif.column !== strategy.column) matches = false;

    if (matches) numbers.add(n);
  }

  return numbers;
}

export function analyzeStrategy(
  history: number[],
  strategy: StrategyClassification
): StrategyAnalysisResult {
  const colors = { red: 0, black: 0 };
  const parities = { even: 0, odd: 0 };
  const halves = { low: 0, high: 0 };
  const dozens = { 1: 0, 2: 0, 3: 0 };
  const columns = { 1: 0, 2: 0, 3: 0 };

  for (const num of history) {
    const classif = classify(num);

    if (classif.color === "red") colors.red++;
    else if (classif.color === "black") colors.black++;

    if (classif.parity === "even") parities.even++;
    else if (classif.parity === "odd") parities.odd++;

    if (classif.half === "low") halves.low++;
    else if (classif.half === "high") halves.high++;

    if (classif.dozen === 1) dozens[1]++;
    else if (classif.dozen === 2) dozens[2]++;
    else if (classif.dozen === 3) dozens[3]++;

    if (classif.column === 1) columns[1]++;
    else if (classif.column === 2) columns[2]++;
    else if (classif.column === 3) columns[3]++;
  }

  const intersectionNumbers = Array.from(getNumbersForStrategy(strategy));
  const intersectionOccurrences = history.filter(n =>
    intersectionNumbers.includes(n)
  ).length;
  const intersectionPercentage =
    history.length > 0 ? (intersectionOccurrences / history.length) * 100 : 0;

  // Determinar temperatura
  let temperature: "cold" | "warm" | "hot" | "very_hot" = "cold";
  if (intersectionPercentage >= 40) temperature = "very_hot";
  else if (intersectionPercentage >= 30) temperature = "hot";
  else if (intersectionPercentage >= 20) temperature = "warm";

  return {
    colors,
    parities,
    halves,
    dozens,
    columns,
    intersectionNumbers,
    intersectionOccurrences,
    intersectionPercentage,
    temperature
  };
}

// ============ SECTOR ANALYSIS ============

export type SectorName = "voisins" | "tier" | "orphelins" | "zero_game";

export const SECTORS: Record<SectorName, number[]> = {
  voisins: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
  tier: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
  orphelins: [1, 20, 14, 31, 9, 17],
  zero_game: [12, 35, 3, 26, 0, 32, 15]
};

export type SectorPattern = {
  pattern: number[];
  nextSector: SectorName;
  count: number;
  strength: number;
};

export type SectorAnalysisResult = {
  patterns: SectorPattern[];
  sectorStats: Record<SectorName, { count: number; percentage: number }>;
};

function getNumberSector(num: number): SectorName | null {
  // Zero Game tem prioridade pois está contido em Voisins
  if (SECTORS.zero_game.includes(num)) return "zero_game";
  if (SECTORS.voisins.includes(num)) return "voisins";
  if (SECTORS.tier.includes(num)) return "tier";
  if (SECTORS.orphelins.includes(num)) return "orphelins";
  return null;
}

export function analyzeSectorPatterns(
  history: number[],
  patternLength: number,
  minRepetitions: number
): SectorAnalysisResult {
  const patternMap: Record<string, { nextSector: SectorName; count: number }> = {};

  // Percorrer histórico e registrar padrões
  for (let i = 0; i < history.length - 1; i++) {
    const pattern = history.slice(i, i + patternLength);
    if (pattern.length < patternLength) break;

    const nextNum = history[i + patternLength];
    if (nextNum === undefined) break;

    const nextSector = getNumberSector(nextNum);
    if (!nextSector) continue;

    const patternKey = pattern.join(",");

    if (!patternMap[patternKey]) {
      patternMap[patternKey] = { nextSector, count: 0 };
    }
    patternMap[patternKey].count++;
  }

  // Filtrar por mínimo de repetições
  const patterns: SectorPattern[] = Object.entries(patternMap)
    .filter(([_, data]) => data.count >= minRepetitions)
    .map(([patternStr, data]) => {
      const pattern = patternStr.split(",").map(Number);
      const strength = (data.count / (history.length - patternLength)) * 100;
      return {
        pattern,
        nextSector: data.nextSector,
        count: data.count,
        strength
      };
    })
    .sort((a, b) => b.strength - a.strength);

  // Calcular estatísticas de setores
  const sectorStats: Record<SectorName, { count: number; percentage: number }> = {
    voisins: { count: 0, percentage: 0 },
    tier: { count: 0, percentage: 0 },
    orphelins: { count: 0, percentage: 0 },
    zero_game: { count: 0, percentage: 0 }
  };

  for (const num of history) {
    const sector = getNumberSector(num);
    if (sector) {
      sectorStats[sector].count++;
    }
  }

  const totalCount = history.length;
  for (const sector of Object.keys(sectorStats) as SectorName[]) {
    sectorStats[sector].percentage = (sectorStats[sector].count / totalCount) * 100;
  }

  return { patterns, sectorStats };
}

// ============ TERMINAL MAPPING ============

export const TERMINAL_NUMBERS: Record<number, number[]> = {
  0: [0, 10, 20, 30],
  1: [1, 11, 21, 31],
  2: [2, 12, 22, 32],
  3: [3, 13, 23, 33],
  4: [4, 14, 24, 34],
  5: [5, 15, 25, 35],
  6: [6, 16, 26, 36],
  7: [7, 17, 27],
  8: [8, 18, 28],
  9: [9, 19, 29]
};
