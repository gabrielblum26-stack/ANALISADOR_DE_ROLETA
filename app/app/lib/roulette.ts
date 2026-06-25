export const WHEEL_EU: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30,
  8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26
];

export const RED_SET = new Set<number>([
  1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
]);

export type ColorName = "red" | "black" | "green";

export function colorOf(n: number): ColorName {
  if (n === 0) return "green";
  return RED_SET.has(n) ? "red" : "black";
}

export function neighborsEU(n: number): { prev: number; current: number; next: number } {
  const idx = WHEEL_EU.indexOf(n);
  if (idx < 0) return { prev: n, current: n, next: n };
  const prev = WHEEL_EU[(idx - 1 + WHEEL_EU.length) % WHEEL_EU.length];
  const next = WHEEL_EU[(idx + 1) % WHEEL_EU.length];
  return { prev, current: n, next };
}

export function parseInput(raw: string): number[] {
  // Aceita vírgula ou espaço como separador
  return raw
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => Number(s))
    .filter(n => Number.isInteger(n) && n >= 0 && (n <= 36 || n === 99));
}

export type Classif = {
  color: "red" | "black" | "zero";
  parity: "even" | "odd" | "zero";
  half: "low" | "high" | "zero";
  column: 1 | 2 | 3 | 0;
  dozen: 1 | 2 | 3 | 0;
};

export function classify(n: number): Classif {
  if (n === 0) return { color:"zero", parity:"zero", half:"zero", column:0, dozen:0 };

  const color: Classif["color"] = RED_SET.has(n) ? "red" : "black";
  const parity: Classif["parity"] = n % 2 === 0 ? "even" : "odd";
  const half: Classif["half"] = n <= 18 ? "low" : "high";
  const mod = n % 3;
  const column: Classif["column"] = mod === 1 ? 1 : mod === 2 ? 2 : 3;
  const dozen: Classif["dozen"] = n <= 12 ? 1 : n <= 24 ? 2 : 3;

  return { color, parity, half, column, dozen };
}

export const TABLE_ROWS: number[][] = [
  [3,6,9,12,15,18,21,24,27,30,33,36],
  [2,5,8,11,14,17,20,23,26,29,32,35],
  [1,4,7,10,13,16,19,22,25,28,31,34],
];


export function wheelStepEU(n: number, delta: number): number {
  const idx = WHEEL_EU.indexOf(n);
  if (idx < 0) return n;
  const L = WHEEL_EU.length;
  return WHEEL_EU[(idx + delta + L * 1000) % L];
}

/**
 * Calcula a distância entre dois números na roleta.
 * H (Horário): passos de 'from' para 'to' movendo para a direita no array WHEEL_EU.
 * AH (Anti-Horário): passos de 'from' para 'to' movendo para a esquerda no array WHEEL_EU.
 * Ajuste: Subtrai 1 do resultado para não contar a casa do número atual (destino).
 */
export function wheelDistance(from: number, to: number): { h: number; ah: number } {
  const idxFrom = WHEEL_EU.indexOf(from);
  const idxTo = WHEEL_EU.indexOf(to);
  if (idxFrom < 0 || idxTo < 0) return { h: 0, ah: 0 };

  const L = WHEEL_EU.length;
  
  // Distância bruta (incluindo a casa de destino)
  let h = (idxTo - idxFrom + L) % L;
  let ah = (idxFrom - idxTo + L) % L;
  
  // Ajuste: se a distância for maior que 0, subtrai 1 para não contar a casa do atual
  if (h > 0) h = h - 1;
  if (ah > 0) ah = ah - 1;
  
  return { h, ah };
}
