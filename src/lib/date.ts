// Fechas locales como claves "YYYY-MM-DD". Todo el estado se indexa por día local,
// nunca por UTC, para que un hábito marcado a las 23:50 cuente para ese día.

export type DateKey = string

const pad = (n: number) => String(n).padStart(2, '0')

export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12) // mediodía: inmune a cambios de horario
}

/** El "día lógico": antes de `dayStartHour` seguimos en el día anterior. */
export function todayKey(dayStartHour = 4, now = new Date()): DateKey {
  const d = new Date(now)
  if (d.getHours() < dayStartHour) d.setDate(d.getDate() - 1)
  return toKey(d)
}

export function addDays(key: DateKey, n: number): DateKey {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export function diffDays(a: DateKey, b: DateKey): number {
  return Math.round((fromKey(a).getTime() - fromKey(b).getTime()) / 86_400_000)
}

/** 0 = lunes … 6 = domingo */
export function weekdayMon(key: DateKey): number {
  return (fromKey(key).getDay() + 6) % 7
}

export function startOfWeek(key: DateKey): DateKey {
  return addDays(key, -weekdayMon(key))
}

export function monthKey(key: DateKey): string {
  return key.slice(0, 7)
}

export function range(from: DateKey, to: DateKey): DateKey[] {
  const out: DateKey[] = []
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k)
  return out
}

export function lastNDays(today: DateKey, n: number): DateKey[] {
  return range(addDays(today, -(n - 1)), today)
}

export const WEEKDAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
export const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function prettyDate(key: DateKey): string {
  const d = fromKey(key)
  return `${WEEKDAYS[weekdayMon(key)]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

export function shortDate(key: DateKey): string {
  const d = fromKey(key)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`
}

export function relativeDay(key: DateKey, today: DateKey): string {
  const diff = diffDays(today, key)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff === -1) return 'Mañana'
  if (diff > 1 && diff < 7) return `Hace ${diff} días`
  if (diff < -1 && diff > -7) return `En ${-diff} días`
  return shortDate(key)
}

export type DayPart = 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'night'

export function dayPart(now = new Date()): DayPart {
  const h = now.getHours() + now.getMinutes() / 60
  if (h >= 5 && h < 7.5) return 'dawn'
  if (h >= 7.5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18 && h < 20.5) return 'dusk'
  return 'night'
}

export function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h >= 5 && h < 12) return 'Buenos días'
  if (h >= 12 && h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}
