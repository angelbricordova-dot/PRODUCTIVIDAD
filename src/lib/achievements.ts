import type { AppData } from '../store/types'
import { globalStreak, habitStreak } from './habits'
import { levelFromXp } from './game'
import { totalXp } from '../store/selectors'
import type { DateKey } from './date'

export interface Achievement {
  id: string
  title: string
  desc: string
  emoji: string
  xp: number
  check: (d: AppData, ctx: Ctx) => boolean
}

export interface Ctx {
  today: DateKey
  level: number
  bestStreak: number
  bestHabitStreak: number
  habitDone: number
  focusMinutes: number
}

export function makeCtx(d: AppData, today: DateKey): Ctx {
  const active = d.habits.filter((h) => !h.archived)
  let habitDone = 0
  for (const day of Object.values(d.logs))
    for (const [id, n] of Object.entries(day)) {
      const h = d.habits.find((x) => x.id === id)
      if (h && n >= h.target) habitDone++
    }
  return {
    today,
    level: levelFromXp(totalXp(d)),
    bestStreak: globalStreak(d.habits, d.logs, d.restDays, today, d.profile.createdAt).best,
    bestHabitStreak: Math.max(0, ...active.map((h) => habitStreak(h, d.logs, d.restDays, today).best)),
    habitDone,
    focusMinutes: d.focus.filter((f) => f.kind === 'focus').reduce((a, f) => a + f.minutes, 0),
  }
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-step', title: 'Primer paso', desc: 'Completa tu primer hábito', emoji: '👣', xp: 20, check: (_, c) => c.habitDone >= 1 },
  { id: 'habits-50', title: 'Cincuenta', desc: 'Completa 50 hábitos', emoji: '🎖️', xp: 60, check: (_, c) => c.habitDone >= 50 },
  { id: 'habits-250', title: 'Imparable', desc: 'Completa 250 hábitos', emoji: '🏅', xp: 150, check: (_, c) => c.habitDone >= 250 },
  { id: 'habits-1000', title: 'Mil veces sí', desc: 'Completa 1.000 hábitos', emoji: '🏆', xp: 500, check: (_, c) => c.habitDone >= 1000 },
  { id: 'streak-3', title: 'Calentando', desc: 'Racha de 3 días', emoji: '🔥', xp: 20, check: (_, c) => c.bestStreak >= 3 },
  { id: 'streak-7', title: 'Una semana entera', desc: 'Racha de 7 días', emoji: '📅', xp: 50, check: (_, c) => c.bestStreak >= 7 },
  { id: 'streak-21', title: 'Hábito formado', desc: 'Racha de 21 días', emoji: '🧬', xp: 120, check: (_, c) => c.bestStreak >= 21 },
  { id: 'streak-66', title: 'Automático', desc: 'Racha de 66 días: ya es parte de ti', emoji: '⚙️', xp: 300, check: (_, c) => c.bestStreak >= 66 },
  { id: 'streak-100', title: 'Centenario', desc: 'Racha de 100 días', emoji: '💯', xp: 500, check: (_, c) => c.bestStreak >= 100 },
  { id: 'habit-30', title: 'Mes de oro', desc: '30 días seguidos con un mismo hábito', emoji: '🥇', xp: 150, check: (_, c) => c.bestHabitStreak >= 30 },
  { id: 'level-5', title: 'Nivel 5', desc: 'Llega al nivel 5', emoji: '⭐️', xp: 0, check: (_, c) => c.level >= 5 },
  { id: 'level-10', title: 'Nivel 10', desc: 'Llega al nivel 10', emoji: '🌟', xp: 0, check: (_, c) => c.level >= 10 },
  { id: 'level-25', title: 'Nivel 25', desc: 'Llega al nivel 25', emoji: '✨', xp: 0, check: (_, c) => c.level >= 25 },
  { id: 'journal-1', title: 'Querido diario', desc: 'Escribe tu primera reflexión', emoji: '📓', xp: 20, check: (d) => Object.values(d.journal).some((j) => (j.reflection ?? '').length >= 40) },
  { id: 'journal-30', title: 'Cronista', desc: '30 días escribiendo en tu diario', emoji: '🖋️', xp: 150, check: (d) => Object.values(d.journal).filter((j) => (j.reflection ?? '').length >= 20 || j.gratitude.some(Boolean)).length >= 30 },
  { id: 'grateful-7', title: 'Corazón agradecido', desc: '7 días con 3 gratitudes', emoji: '🙏', xp: 60, check: (d) => Object.values(d.journal).filter((j) => j.gratitude.filter((g) => g.trim()).length >= 3).length >= 7 },
  { id: 'mood-14', title: 'Me conozco', desc: 'Registra tu ánimo 14 días', emoji: '🌈', xp: 60, check: (d) => Object.keys(d.moods).length >= 14 },
  { id: 'moments-10', title: 'Coleccionista', desc: 'Guarda 10 momentos en tu diario', emoji: '📸', xp: 60, check: (d) => Object.values(d.journal).reduce((a, j) => a + (j.media?.length ?? 0), 0) >= 10 },
  { id: 'proof-7', title: 'Con pruebas', desc: 'Adjunta 7 fotos a tus hábitos', emoji: '🧾', xp: 60, check: (d) => Object.values(d.habitPhotos).reduce((a, l) => a + l.length, 0) >= 7 },
  { id: 'people-5', title: 'Mi gente', desc: 'Añade 5 personas importantes', emoji: '👥', xp: 30, check: (d) => d.people.length >= 5 },
  { id: 'connect-25', title: 'Buen amigo', desc: '25 momentos de conexión', emoji: '🤝', xp: 120, check: (d) => d.people.reduce((a, p) => a + p.interactions.length, 0) >= 25 },
  { id: 'focus-60', title: 'Primera hora profunda', desc: '60 minutos de enfoque', emoji: '⏱️', xp: 40, check: (_, c) => c.focusMinutes >= 60 },
  { id: 'focus-600', title: 'Monje del enfoque', desc: '10 horas de enfoque', emoji: '🧘', xp: 200, check: (_, c) => c.focusMinutes >= 600 },
  { id: 'goal-1', title: 'Lo logré', desc: 'Cumple tu primera meta', emoji: '🏔️', xp: 0, check: (d) => d.goals.some((g) => g.done) },
  { id: 'reward-1', title: 'Me lo merezco', desc: 'Canjea tu primera recompensa', emoji: '🎁', xp: 20, check: (d) => d.redemptions.length >= 1 },
  { id: 'review-4', title: 'Estratega', desc: '4 revisiones semanales', emoji: '🗺️', xp: 100, check: (d) => Object.keys(d.reviews).length >= 4 },
]
