import type { AppData } from '../store/types'
import type { DateKey } from './date'
import { dayStats, isDone, showsOn } from './habits'
import { seeded } from './util'

export interface Quest {
  id: string
  title: string
  emoji: string
  /** progreso 0..1 */
  progress: (d: AppData, day: DateKey) => number
  available?: (d: AppData, day: DateKey) => boolean
}

const morningHabits = (d: AppData, day: DateKey) =>
  d.habits.filter((h) => h.timeOfDay === 'morning' && showsOn(h, day) && h.schedule.type !== 'weekly')

export const QUEST_POOL: Quest[] = [
  {
    id: 'morning',
    title: 'Completa tu ritual de mañana',
    emoji: '🌅',
    available: (d, day) => morningHabits(d, day).length > 0,
    progress: (d, day) => {
      const list = morningHabits(d, day)
      return list.length ? list.filter((h) => isDone(h, d.logs, day)).length / list.length : 0
    },
  },
  { id: 'mood', title: 'Registra cómo te sientes', emoji: '🌈', progress: (d, day) => (d.moods[day] ? 1 : 0) },
  {
    id: 'gratitude',
    title: 'Escribe 3 gratitudes',
    emoji: '🙏',
    progress: (d, day) => Math.min(1, (d.journal[day]?.gratitude ?? []).filter((g) => g.trim()).length / 3),
  },
  { id: 'intention', title: 'Define tu intención del día', emoji: '🎯', progress: (d, day) => ((d.journal[day]?.intention ?? '').trim().length >= 3 ? 1 : 0) },
  {
    id: 'perfect',
    title: 'Día perfecto: todos tus hábitos',
    emoji: '💎',
    available: (d, day) => dayStats(d.habits, d.logs, day).total >= 3,
    progress: (d, day) => dayStats(d.habits, d.logs, day).ratio,
  },
  {
    id: 'three',
    title: 'Completa 3 hábitos',
    emoji: '✅',
    progress: (d, day) => Math.min(1, d.habits.filter((h) => isDone(h, d.logs, day)).length / 3),
  },
  {
    id: 'focus',
    title: 'Haz 25 minutos de enfoque',
    emoji: '⏱️',
    progress: (d, day) => Math.min(1, d.focus.filter((f) => f.date === day && f.kind === 'focus').reduce((a, f) => a + f.minutes, 0) / 25),
  },
  { id: 'breath', title: 'Respira con calma un momento', emoji: '🌬️', progress: (d, day) => (d.focus.some((f) => f.date === day && f.kind === 'breath') ? 1 : 0) },
  {
    id: 'connect',
    title: 'Conecta con alguien importante',
    emoji: '💞',
    progress: (d, day) => (d.people.some((p) => p.interactions.some((i) => i.date === day)) ? 1 : 0),
  },
  { id: 'money', title: 'Registra un movimiento de dinero', emoji: '🧾', progress: (d, day) => (d.transactions.some((t) => t.date === day) ? 1 : 0) },
  { id: 'reflect', title: 'Escribe tu reflexión del día', emoji: '✍️', progress: (d, day) => Math.min(1, (d.journal[day]?.reflection ?? '').trim().length / 40) },
  {
    id: 'bullets',
    title: 'Tacha 2 tareas de tu bitácora',
    emoji: '📌',
    available: (d, day) => d.bullets.filter((b) => b.date === day && b.type === 'task').length >= 2,
    progress: (d, day) => Math.min(1, d.bullets.filter((b) => b.date === day && b.type === 'task' && b.status === 'done').length / 2),
  },
]

/** 3 misiones por día, estables durante todo el día. */
export function questsFor(d: AppData, day: DateKey): Quest[] {
  const rand = seeded(`quests:${day}`)
  const pool = QUEST_POOL.filter((q) => !q.available || q.available(d, day))
  const shuffled = [...pool].map((q) => [rand(), q] as const).sort((a, b) => a[0] - b[0]).map(([, q]) => q)
  // Siempre una de hábitos para anclar el día.
  const anchor = shuffled.find((q) => q.id === 'morning' || q.id === 'three' || q.id === 'perfect')
  const rest = shuffled.filter((q) => q !== anchor)
  return [anchor, ...rest].filter(Boolean).slice(0, 3) as Quest[]
}
