import type { Habit, AppData } from '../store/types'
import { type DateKey, addDays, weekdayMon, startOfWeek, range } from './date'

type Logs = AppData['logs']
type RestDays = AppData['restDays']

export function countOn(logs: Logs, habitId: string, day: DateKey): number {
  return logs[day]?.[habitId] ?? 0
}

export function isDone(h: Habit, logs: Logs, day: DateKey): boolean {
  return countOn(logs, h.id, day) >= h.target
}

/** Días programados de forma fija (diario / días concretos). Los semanales son flexibles. */
export function isScheduled(h: Habit, day: DateKey): boolean {
  if (day < h.createdAt) return false
  switch (h.schedule.type) {
    case 'daily':
      return true
    case 'days':
      return h.schedule.days.includes(weekdayMon(day))
    case 'weekly':
      return true
  }
}

export function weekCount(h: Habit, logs: Logs, day: DateKey): number {
  const start = startOfWeek(day)
  let n = 0
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i)
    if (d > day) break
    if (isDone(h, logs, d)) n++
  }
  return n
}

/** ¿Aparece hoy en la lista? Los semanales siempre aparecen (marcados si ya cumpliste la cuota). */
export function showsOn(h: Habit, day: DateKey): boolean {
  return !h.archived && isScheduled(h, day)
}

/** ¿Cuenta para el % del día? Los semanales solo cuentan el día que los haces. */
export function countsForDay(h: Habit, logs: Logs, day: DateKey): boolean {
  if (!showsOn(h, day)) return false
  if (h.schedule.type === 'weekly') return isDone(h, logs, day)
  return true
}

export interface StreakInfo {
  current: number
  best: number
  /** Ayer fallaste y hoy aún no: usa el comodín o se rompe. */
  atRisk: boolean
  graceUsed: boolean
}

const GRACE_WINDOW = 7

/**
 * Racha con la regla "nunca falles dos veces": se perdona un fallo cada 7 días programados.
 * Un segundo fallo dentro de esa ventana rompe la racha. Los días de descanso no cuentan.
 * Hoy, si aún no está hecho, no cuenta como fallo.
 */
export function habitStreak(h: Habit, logs: Logs, restDays: RestDays, today: DateKey): StreakInfo {
  if (h.schedule.type === 'weekly') return weeklyStreak(h, logs, today)
  let run = 0
  let best = 0
  let idx = 0
  let lastMiss: number | null = null
  let lastWasMiss = false
  for (const d of range(h.createdAt, today)) {
    if (!isScheduled(h, d) || restDays[d]) continue
    const done = isDone(h, logs, d)
    if (done) {
      run++
      lastWasMiss = false
    } else if (d !== today) {
      if (lastMiss !== null && idx - lastMiss < GRACE_WINDOW) run = 0
      lastMiss = idx
      lastWasMiss = true
    }
    best = Math.max(best, run)
    idx++
  }
  const todayDone = isDone(h, logs, today)
  return {
    current: run,
    best,
    atRisk: lastWasMiss && !todayDone && run > 0,
    graceUsed: lastMiss !== null && idx - 1 - lastMiss < GRACE_WINDOW && run > 0,
  }
}

/** Semanas consecutivas cumpliendo la cuota. La semana en curso suma si ya se cumplió. */
function weeklyStreak(h: Habit, logs: Logs, today: DateKey): StreakInfo {
  if (h.schedule.type !== 'weekly') throw new Error('not weekly')
  const times = h.schedule.times
  let run = 0
  let best = 0
  let week = startOfWeek(h.createdAt)
  const thisWeek = startOfWeek(today)
  while (week <= thisWeek) {
    const end = week === thisWeek ? today : addDays(week, 6)
    const n = weekCount(h, logs, end)
    if (n >= times) run++
    else if (week !== thisWeek) run = 0
    best = Math.max(best, run)
    week = addDays(week, 7)
  }
  return { current: run, best, atRisk: false, graceUsed: false }
}

export interface DayStats {
  total: number
  done: number
  ratio: number
}

export function dayStats(habits: Habit[], logs: Logs, day: DateKey): DayStats {
  let total = 0
  let done = 0
  for (const h of habits) {
    if (!countsForDay(h, logs, day)) continue
    total++
    if (isDone(h, logs, day)) done++
  }
  return { total, done, ratio: total ? done / total : 0 }
}

/** Racha global: días seguidos con al menos un hábito hecho (misma regla de comodín). */
export function globalStreak(habits: Habit[], logs: Logs, restDays: RestDays, today: DateKey, since: DateKey): StreakInfo {
  let run = 0
  let best = 0
  let idx = 0
  let lastMiss: number | null = null
  let lastWasMiss = false
  const active = (d: DateKey) => habits.some((h) => isDone(h, logs, d))
  for (const d of range(since, today)) {
    if (restDays[d]) continue
    if (active(d)) {
      run++
      lastWasMiss = false
    } else if (d !== today) {
      if (lastMiss !== null && idx - lastMiss < GRACE_WINDOW) run = 0
      lastMiss = idx
      lastWasMiss = true
    }
    best = Math.max(best, run)
    idx++
  }
  return {
    current: run,
    best,
    atRisk: lastWasMiss && !active(today) && run > 0,
    graceUsed: lastMiss !== null && idx - 1 - lastMiss < GRACE_WINDOW && run > 0,
  }
}

export function completionRate(habits: Habit[], logs: Logs, days: DateKey[]): number {
  let total = 0
  let done = 0
  for (const d of days) {
    const s = dayStats(habits, logs, d)
    total += s.total
    done += s.done
  }
  return total ? done / total : 0
}

export function habitRate(h: Habit, logs: Logs, days: DateKey[]): number {
  let total = 0
  let done = 0
  for (const d of days) {
    if (!isScheduled(h, d) || h.schedule.type === 'weekly') continue
    total++
    if (isDone(h, logs, d)) done++
  }
  if (h.schedule.type === 'weekly') {
    const weeks = Math.max(1, Math.ceil(days.length / 7))
    const doneDays = days.filter((d) => isDone(h, logs, d)).length
    return Math.min(1, doneDays / (weeks * h.schedule.times))
  }
  return total ? done / total : 0
}

export function scheduleLabel(h: Habit): string {
  const s = h.schedule
  if (s.type === 'daily') return 'Cada día'
  if (s.type === 'weekly') return `${s.times}× por semana`
  if (s.days.length === 5 && [0, 1, 2, 3, 4].every((d) => s.days.includes(d))) return 'Entre semana'
  if (s.days.length === 2 && s.days.includes(5) && s.days.includes(6)) return 'Fines de semana'
  const names = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  return [...s.days].sort().map((d) => names[d]).join(' · ')
}

export const TIME_OF_DAY = {
  morning: { label: 'Mañana', emoji: '🌅', ritual: 'Ritual de mañana' },
  afternoon: { label: 'Tarde', emoji: '☀️', ritual: 'Ritual de tarde' },
  evening: { label: 'Noche', emoji: '🌙', ritual: 'Ritual de noche' },
  anytime: { label: 'Cuando sea', emoji: '✨', ritual: 'Durante el día' },
} as const
