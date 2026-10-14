// Motor del juego: niveles, títulos y economía de XP / monedas.
// La XP nunca baja (solo se deshace lo que desmarcas). Las monedas se gastan en recompensas.

import type { Difficulty } from '../store/types'

/** XP acumulada necesaria para alcanzar el nivel n (n ≥ 1). */
export function xpForLevel(n: number): number {
  return 50 * (n - 1) * n
}

export function levelFromXp(xp: number): number {
  // inversa de 50·n·(n-1) = xp
  const n = Math.floor((1 + Math.sqrt(1 + (4 * Math.max(0, xp)) / 50)) / 2)
  return Math.max(1, n)
}

export interface LevelInfo {
  level: number
  xpInto: number
  xpNeeded: number
  progress: number
  total: number
}

export function levelInfo(xp: number, scale = 1): LevelInfo {
  const scaled = xp / scale
  const level = levelFromXp(scaled)
  const base = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const xpInto = Math.round((scaled - base) * scale)
  const xpNeeded = Math.round((next - base) * scale)
  return { level, xpInto, xpNeeded, progress: xpNeeded ? xpInto / xpNeeded : 0, total: xp }
}

const TITLES: [number, string, string][] = [
  [1, 'Semilla', '🌱'],
  [3, 'Brote', '🌿'],
  [5, 'Aprendiz', '🔥'],
  [8, 'Explorador', '🧭'],
  [12, 'Constante', '⚡️'],
  [17, 'Disciplinado', '🛡️'],
  [24, 'Maestro', '🏔️'],
  [32, 'Sabio', '🦉'],
  [42, 'Leyenda', '👑'],
]

export function titleFor(level: number): { title: string; emoji: string; nextAt?: number } {
  let i = 0
  while (i + 1 < TITLES.length && TITLES[i + 1][0] <= level) i++
  return { title: TITLES[i][1], emoji: TITLES[i][2], nextAt: TITLES[i + 1]?.[0] }
}

export const DIFFICULTY: Record<Difficulty, { label: string; xp: number }> = {
  1: { label: 'Fácil', xp: 10 },
  2: { label: 'Media', xp: 20 },
  3: { label: 'Épica', xp: 35 },
}

/** Bonus por racha: +1.6 % por día, máximo +50 %. Recompensa constancia sin volverse absurdo. */
export function streakMultiplier(streak: number): number {
  return 1 + Math.min(streak, 30) / 60
}

export function habitReward(difficulty: Difficulty, streak: number) {
  const xp = Math.round(DIFFICULTY[difficulty].xp * streakMultiplier(streak))
  return { xp, coins: coinsFor(xp) }
}

export function coinsFor(xp: number): number {
  return Math.max(1, Math.round(xp / 4))
}

/** Las áreas suben de nivel más rápido que el nivel global para que se sienta movimiento. */
export const AREA_SCALE = 0.4

export const XP = {
  mood: 5,
  gratitude: 15,
  intention: 5,
  reflection: 20,
  finance: 5,
  financeDailyCap: 5,
  relation: 15,
  focusPerMin: 1,
  breath: 10,
  milestone: 40,
  goal: 200,
  review: 60,
  bullet: 3,
  quest: 30,
} as const
