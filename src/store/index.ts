import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type {
  AppData, Habit, Mood, JournalEntry, Bullet, MediaMeta,
  Person, Interaction, Goal, Reward, WeeklyReview, XPEvent, Profile, Area, ID,
} from './types'
import { todayKey, type DateKey } from '../lib/date'
import { uid } from '../lib/util'
import { DEFAULT_AREAS, DEFAULT_REWARDS, templateToHabit, type HabitTemplate } from '../lib/seed'
import { removeMediaFiles } from '../lib/media'
import { habitReward, levelFromXp, coinsFor, XP, AREA_SCALE, titleFor } from '../lib/game'
import { habitStreak, isDone } from '../lib/habits'
import { totalXp, areaXp, coinBalance } from './selectors'
import { useUI } from './ui'
import { playComplete, playLevelUp, playUndo, playCoins, haptic } from '../lib/feedback'

export const SCHEMA_VERSION = 2

export function initialData(): AppData {
  const today = todayKey()
  return {
    version: SCHEMA_VERSION,
    profile: {
      name: 'Alejandro',
      fullName: 'Alejandro Gabriel Lamont Bencomo',
      avatar: '🦁',
      motto: 'Cada día, un poco mejor.',
      theme: 'auto',
      accent: 'mandarina',
      font: 'alba',
      textScale: 'md',
      sound: true,
      dayStartHour: 4,
      onboarded: false,
      createdAt: today,
    },
    areas: DEFAULT_AREAS,
    habits: [],
    logs: {},
    restDays: {},
    events: [],
    rewards: DEFAULT_REWARDS,
    redemptions: [],
    moods: {},
    journal: {},
    bullets: [],
    people: [],
    goals: [],
    focus: [],
    reviews: {},
    achievements: {},
    quests: {},
    media: {},
    habitPhotos: {},
  }
}

/**
 * Evoluciona datos guardados de versiones anteriores sin perder nada útil.
 * v1 → v2: se elimina Finanzas (movimientos, categorías, ahorro, moneda) y llegan fotos y tipografías.
 */
export function migrateData(raw: Record<string, any>, from: number): AppData {
  const base = initialData()
  const d: Record<string, any> = { ...base, ...raw }
  d.profile = { ...base.profile, ...(raw.profile ?? {}) }
  if (from < 2) {
    delete d.transactions
    delete d.categories
    delete d.savings
    delete d.profile.currency
    const usesFinance = (d.habits ?? []).some((h: Habit) => h.areaId === 'finanzas')
    if (!usesFinance) d.areas = (d.areas ?? []).filter((a: { id: string }) => a.id !== 'finanzas')
    const accents: Record<string, string> = { amanecer: 'mandarina', oceano: 'cielo', bosque: 'menta', lavanda: 'uva', coral: 'chicle', oro: 'girasol' }
    d.profile.accent = accents[d.profile.accent] ?? 'mandarina'
    d.media ??= {}
    d.habitPhotos ??= {}
  }
  d.version = SCHEMA_VERSION
  return d as AppData
}

type NewEvent = Omit<XPEvent, 'id' | 'ts' | 'coins'> & { coins?: number }

interface Actions {
  today: () => DateKey
  award: (e: NewEvent, opts?: { silent?: boolean }) => void
  revoke: (ref: string) => void
  hasRef: (ref: string) => boolean

  setProfile: (p: Partial<Profile>) => void
  finishOnboarding: (opts: { name: string; avatar: string; templates: HabitTemplate[] }) => void

  addHabit: (h: Omit<Habit, 'id' | 'createdAt' | 'order' | 'archived'>) => ID
  updateHabit: (id: ID, patch: Partial<Habit>) => void
  archiveHabit: (id: ID, archived?: boolean) => void
  deleteHabit: (id: ID) => void
  moveHabit: (id: ID, dir: -1 | 1) => void
  logHabit: (id: ID, day: DateKey, delta: number) => void
  setHabitCount: (id: ID, day: DateKey, value: number) => void
  toggleRest: (day: DateKey) => void

  upsertArea: (a: Area) => void
  deleteArea: (id: ID) => void

  setMood: (day: DateKey, mood: Omit<Mood, 'ts'>) => void
  setJournal: (day: DateKey, patch: Partial<JournalEntry>) => void

  addBullet: (b: Pick<Bullet, 'date' | 'type' | 'text'> & { priority?: boolean }) => void
  updateBullet: (id: ID, patch: Partial<Bullet>) => void
  cycleBullet: (id: ID) => void
  migrateBullet: (id: ID, to: DateKey) => void
  deleteBullet: (id: ID) => void

  addMedia: (m: MediaMeta) => void
  deleteMedia: (id: ID) => void
  addJournalMedia: (day: DateKey, m: MediaMeta) => void
  removeJournalMedia: (day: DateKey, id: ID) => void
  addHabitPhoto: (habitId: ID, day: DateKey, m: MediaMeta) => void
  removeHabitPhoto: (habitId: ID, day: DateKey, id: ID) => void

  upsertPerson: (p: Person) => void
  deletePerson: (id: ID) => void
  logInteraction: (personId: ID, i: Omit<Interaction, 'id'>) => void
  deleteInteraction: (personId: ID, interactionId: ID) => void

  upsertGoal: (g: Goal) => void
  deleteGoal: (id: ID) => void
  toggleMilestone: (goalId: ID, milestoneId: ID) => void
  completeGoal: (goalId: ID, done: boolean) => void

  addFocus: (minutes: number, label: string, kind: 'focus' | 'breath') => void
  saveReview: (week: DateKey, r: Omit<WeeklyReview, 'ts'>) => void

  upsertReward: (r: Reward) => void
  deleteReward: (id: ID) => void
  redeem: (id: ID) => boolean

  unlockAchievement: (id: string, title: string, emoji: string, xp: number) => void
  claimQuest: (day: DateKey, id: string, title: string) => void

  importData: (d: AppData) => void
  resetAll: () => void
}

export type Store = AppData & Actions & { hydrated: boolean }

const idbStorage: StateStorage = {
  getItem: async (name) => (await idbGet(name)) ?? null,
  setItem: (name, value) => idbSet(name, value),
  removeItem: (name) => idbDel(name),
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialData(),
      hydrated: false,

      today: () => todayKey(get().profile.dayStartHour),

      hasRef: (ref) => get().events.some((e) => e.ref === ref),

      award: (e, opts) => {
        const s = get()
        if (e.ref && s.events.some((x) => x.ref === e.ref)) return
        const coins = e.coins ?? coinsFor(e.xp)
        const event: XPEvent = { ...e, coins, id: uid(), ts: Date.now() }
        const beforeXp = totalXp(s)
        const beforeLevel = levelFromXp(beforeXp)
        const beforeArea = e.areaId ? levelFromXp((areaXp(s.events)[e.areaId] ?? 0) / AREA_SCALE) : 0
        set({ events: [...s.events, event] })
        const afterLevel = levelFromXp(beforeXp + e.xp)
        const ui = useUI.getState()
        if (!opts?.silent) ui.toast({ title: e.label, xp: e.xp, coins, tone: 'xp' })
        if (afterLevel > beforeLevel) {
          const t = titleFor(afterLevel)
          const newTitle = titleFor(beforeLevel).title !== t.title
          playLevelUp()
          haptic('success')
          ui.celebrate({
            kind: 'level',
            level: afterLevel,
            title: `¡Nivel ${afterLevel}!`,
            subtitle: newTitle
              ? `Nuevo título: ${t.title} ${t.emoji}. Te lo has ganado, ${s.profile.name}.`
              : `Un paso más cerca de ${t.nextAt ? `tu próximo título (nivel ${t.nextAt})` : 'la leyenda'}. Sigue así, ${s.profile.name}.`,
            emoji: newTitle ? t.emoji : '⭐️',
          })
        } else if (e.areaId) {
          const afterArea = levelFromXp(((areaXp(s.events)[e.areaId] ?? 0) + e.xp) / AREA_SCALE)
          if (afterArea > beforeArea) {
            const area = s.areas.find((a) => a.id === e.areaId)
            if (area) ui.toast({ title: `${area.name} sube a nivel ${afterArea}`, emoji: area.emoji, tone: 'achievement' })
          }
        }
      },

      revoke: (ref) => set((s) => ({ events: s.events.filter((e) => e.ref !== ref) })),

      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),

      finishOnboarding: ({ name, avatar, templates }) => {
        const today = get().today()
        const habits = templates.map((t, i) => templateToHabit(t, uid(), i, today))
        set((s) => ({ habits, profile: { ...s.profile, name, avatar, onboarded: true, createdAt: today } }))
      },

      addHabit: (h) => {
        const id = uid()
        set((s) => ({
          habits: [...s.habits, { ...h, id, createdAt: get().today(), order: s.habits.length, archived: false }],
        }))
        return id
      },
      updateHabit: (id, patch) => set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      archiveHabit: (id, archived = true) => get().updateHabit(id, { archived }),
      deleteHabit: (id) =>
        set((s) => ({
          habits: s.habits.filter((h) => h.id !== id),
          events: s.events.filter((e) => !e.ref?.startsWith(`habit:${id}:`)),
        })),
      moveHabit: (id, dir) =>
        set((s) => {
          const list = [...s.habits].sort((a, b) => a.order - b.order)
          const i = list.findIndex((h) => h.id === id)
          const j = i + dir
          if (i < 0 || j < 0 || j >= list.length) return {}
          ;[list[i], list[j]] = [list[j], list[i]]
          return { habits: list.map((h, order) => ({ ...h, order })) }
        }),

      logHabit: (id, day, delta) => {
        const h = get().habits.find((x) => x.id === id)
        if (!h) return
        const current = get().logs[day]?.[id] ?? 0
        get().setHabitCount(id, day, Math.max(0, current + delta))
      },

      setHabitCount: (id, day, value) => {
        const s = get()
        const found = s.habits.find((x) => x.id === id)
        if (!found) return
        // Registrar un día anterior a la creación del hábito adelanta su fecha de inicio.
        const h = day < found.createdAt ? { ...found, createdAt: day } : found
        if (h !== found) set({ habits: s.habits.map((x) => (x.id === id ? h : x)) })
        const wasDone = isDone(h, s.logs, day)
        const dayLog = { ...(s.logs[day] ?? {}) }
        if (value <= 0) delete dayLog[id]
        else dayLog[id] = Math.min(value, Math.max(h.target, 99))
        const logs = { ...s.logs, [day]: dayLog }
        set({ logs })
        const nowDone = isDone(h, logs, day)
        const ref = `habit:${id}:${day}`
        if (!wasDone && nowDone) {
          const streak = habitStreak(h, logs, s.restDays, day).current
          const { xp, coins } = habitReward(h.difficulty, streak)
          const doneToday = s.habits.filter((x) => !x.archived && isDone(x, logs, day)).length
          playComplete(doneToday - 1)
          haptic('light')
          get().award({ date: day, xp, coins, source: 'habit', label: `${h.emoji} ${h.name}`, areaId: h.areaId, ref })
        } else if (wasDone && !nowDone) {
          playUndo()
          get().revoke(ref)
        } else if (!nowDone && value > 0) {
          haptic('light')
          playComplete(0)
        }
      },

      toggleRest: (day) =>
        set((s) => {
          const restDays = { ...s.restDays }
          if (restDays[day]) delete restDays[day]
          else restDays[day] = true
          return { restDays }
        }),

      upsertArea: (a) =>
        set((s) => ({
          areas: s.areas.some((x) => x.id === a.id) ? s.areas.map((x) => (x.id === a.id ? a : x)) : [...s.areas, a],
        })),
      deleteArea: (id) =>
        set((s) => {
          const fallback = s.areas.find((a) => a.id !== id)?.id ?? ''
          return {
            areas: s.areas.filter((a) => a.id !== id),
            habits: s.habits.map((h) => (h.areaId === id ? { ...h, areaId: fallback } : h)),
          }
        }),

      setMood: (day, mood) => {
        set((s) => ({ moods: { ...s.moods, [day]: { ...mood, ts: Date.now() } } }))
        get().award({ date: day, xp: XP.mood, source: 'mood', label: 'Registro de ánimo', areaId: 'calma', ref: `mood:${day}` })
      },

      setJournal: (day, patch) => {
        const prev = get().journal[day] ?? { gratitude: [] }
        const entry = { ...prev, ...patch }
        set((s) => ({ journal: { ...s.journal, [day]: entry } }))
        const award = get().award
        if (entry.gratitude.filter((g) => g.trim()).length >= 3)
          award({ date: day, xp: XP.gratitude, source: 'gratitude', label: '3 gratitudes', areaId: 'calma', ref: `gratitude:${day}` })
        if ((entry.intention ?? '').trim().length >= 3)
          award({ date: day, xp: XP.intention, source: 'journal', label: 'Intención del día', areaId: 'proposito', ref: `intention:${day}` })
        if ((entry.reflection ?? '').trim().length >= 40)
          award({ date: day, xp: XP.reflection, source: 'journal', label: 'Reflexión escrita', areaId: 'mente', ref: `reflection:${day}` })
      },

      addBullet: (b) =>
        set((s) => ({
          bullets: [...s.bullets, { id: uid(), status: 'open', priority: false, createdAt: Date.now(), ...b }],
        })),
      updateBullet: (id, patch) => set((s) => ({ bullets: s.bullets.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      cycleBullet: (id) => {
        const b = get().bullets.find((x) => x.id === id)
        if (!b || b.type !== 'task') return
        const status = b.status === 'done' ? 'open' : 'done'
        get().updateBullet(id, { status })
        if (status === 'done') {
          playComplete(2)
          haptic('light')
          get().award({ date: get().today(), xp: XP.bullet, source: 'bullet', label: 'Tarea completada', areaId: 'proposito', ref: `bullet:${id}` }, { silent: true })
        } else get().revoke(`bullet:${id}`)
      },
      migrateBullet: (id, to) => {
        const b = get().bullets.find((x) => x.id === id)
        if (!b) return
        set((s) => ({
          bullets: [
            ...s.bullets.map((x) => (x.id === id ? { ...x, status: 'migrated' as const } : x)),
            { ...b, id: uid(), date: to, status: 'open' as const, createdAt: Date.now() },
          ],
        }))
      },
      deleteBullet: (id) => {
        set((s) => ({ bullets: s.bullets.filter((b) => b.id !== id) }))
        get().revoke(`bullet:${id}`)
      },

      addMedia: (m) => set((s) => ({ media: { ...s.media, [m.id]: m } })),
      deleteMedia: (id) => {
        set((s) => {
          const media = { ...s.media }
          delete media[id]
          return { media }
        })
        void removeMediaFiles(id)
      },
      addJournalMedia: (day, m) => {
        get().addMedia(m)
        const prev = get().journal[day] ?? { gratitude: [] }
        set((s) => ({ journal: { ...s.journal, [day]: { ...prev, media: [...(prev.media ?? []), m.id] } } }))
        get().award({ date: day, xp: 5, source: 'media', label: m.kind === 'video' ? 'Video guardado' : 'Momento guardado', areaId: 'calma', ref: `moment:${day}` })
      },
      removeJournalMedia: (day, id) => {
        const prev = get().journal[day]
        if (prev) set((s) => ({ journal: { ...s.journal, [day]: { ...prev, media: (prev.media ?? []).filter((x) => x !== id) } } }))
        get().deleteMedia(id)
      },
      addHabitPhoto: (habitId, day, m) => {
        get().addMedia(m)
        const key = `${habitId}:${day}`
        set((s) => ({ habitPhotos: { ...s.habitPhotos, [key]: [...(s.habitPhotos[key] ?? []), m.id] } }))
        const h = get().habits.find((x) => x.id === habitId)
        get().award({ date: day, xp: 5, source: 'media', label: `Prueba: ${h?.name ?? 'hábito'}`, areaId: h?.areaId, ref: `proof:${key}` })
      },
      removeHabitPhoto: (habitId, day, id) => {
        const key = `${habitId}:${day}`
        set((s) => ({ habitPhotos: { ...s.habitPhotos, [key]: (s.habitPhotos[key] ?? []).filter((x) => x !== id) } }))
        get().deleteMedia(id)
      },

      upsertPerson: (p) =>
        set((s) => ({
          people: s.people.some((x) => x.id === p.id) ? s.people.map((x) => (x.id === p.id ? p : x)) : [...s.people, p],
        })),
      deletePerson: (id) => set((s) => ({ people: s.people.filter((p) => p.id !== id) })),
      logInteraction: (personId, i) => {
        const p = get().people.find((x) => x.id === personId)
        if (!p) return
        const id = uid()
        get().upsertPerson({ ...p, interactions: [{ ...i, id }, ...p.interactions] })
        get().award({ date: i.date, xp: XP.relation, source: 'relation', label: `Conectaste con ${p.name}`, areaId: 'vinculos', ref: `int:${id}` })
      },
      deleteInteraction: (personId, interactionId) => {
        const p = get().people.find((x) => x.id === personId)
        if (!p) return
        get().upsertPerson({ ...p, interactions: p.interactions.filter((i) => i.id !== interactionId) })
        get().revoke(`int:${interactionId}`)
      },

      upsertGoal: (g) =>
        set((s) => ({ goals: s.goals.some((x) => x.id === g.id) ? s.goals.map((x) => (x.id === g.id ? g : x)) : [...s.goals, g] })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      toggleMilestone: (goalId, milestoneId) => {
        const g = get().goals.find((x) => x.id === goalId)
        if (!g) return
        const milestones = g.milestones.map((m) => (m.id === milestoneId ? { ...m, done: !m.done } : m))
        get().upsertGoal({ ...g, milestones })
        const m = milestones.find((x) => x.id === milestoneId)!
        const ref = `ms:${milestoneId}`
        if (m.done) {
          playComplete(4)
          get().award({ date: get().today(), xp: XP.milestone, source: 'goal', label: `Hito: ${m.text}`, areaId: g.areaId, ref })
        } else get().revoke(ref)
      },
      completeGoal: (goalId, done) => {
        const g = get().goals.find((x) => x.id === goalId)
        if (!g) return
        get().upsertGoal({ ...g, done, doneAt: done ? get().today() : undefined })
        const ref = `goal:${goalId}`
        if (done) {
          useUI.getState().celebrate({ kind: 'achievement', title: '¡Meta cumplida!', subtitle: `${g.emoji} ${g.title}`, emoji: '🏆' })
          playLevelUp()
          get().award({ date: get().today(), xp: XP.goal, source: 'goal', label: `Meta: ${g.title}`, areaId: g.areaId, ref })
        } else get().revoke(ref)
      },

      addFocus: (minutes, label, kind) => {
        const id = uid()
        const today = get().today()
        set((s) => ({ focus: [...s.focus, { id, ts: Date.now(), date: today, minutes, label, kind }] }))
        const xp = kind === 'breath' ? XP.breath : Math.round(minutes * XP.focusPerMin)
        get().award({
          date: today,
          xp,
          source: kind === 'breath' ? 'calm' : 'focus',
          label: kind === 'breath' ? 'Sesión de respiración' : `Enfoque: ${minutes} min`,
          areaId: kind === 'breath' ? 'calma' : 'proposito',
          ref: `focus:${id}`,
        })
      },

      saveReview: (week, r) => {
        set((s) => ({ reviews: { ...s.reviews, [week]: { ...r, ts: Date.now() } } }))
        get().award({ date: get().today(), xp: XP.review, source: 'review', label: 'Revisión semanal', areaId: 'proposito', ref: `review:${week}` })
      },

      upsertReward: (r) =>
        set((s) => ({ rewards: s.rewards.some((x) => x.id === r.id) ? s.rewards.map((x) => (x.id === r.id ? r : x)) : [...s.rewards, r] })),
      deleteReward: (id) => set((s) => ({ rewards: s.rewards.filter((r) => r.id !== id) })),
      redeem: (id) => {
        const s = get()
        const r = s.rewards.find((x) => x.id === id)
        if (!r || coinBalance(s) < r.cost) return false
        set({
          redemptions: [
            ...s.redemptions,
            { id: uid(), rewardId: r.id, name: r.name, emoji: r.emoji, cost: r.cost, ts: Date.now(), date: get().today() },
          ],
        })
        playCoins()
        haptic('success')
        useUI.getState().celebrate({ kind: 'reward', title: '¡Te lo ganaste!', subtitle: `${r.emoji} ${r.name}. Disfrútalo sin culpa.`, emoji: r.emoji })
        return true
      },

      unlockAchievement: (id, title, emoji, xp) => {
        if (get().achievements[id]) return
        set((s) => ({ achievements: { ...s.achievements, [id]: Date.now() } }))
        // Los logros grandes merecen pantalla completa; los pequeños, un aviso que no interrumpe.
        if (xp >= 100) useUI.getState().celebrate({ kind: 'achievement', title: 'Logro desbloqueado', subtitle: title, emoji })
        else useUI.getState().toast({ title: `Logro: ${title}`, subtitle: xp ? `+${xp} XP` : undefined, emoji, tone: 'achievement' })
        get().award({ date: get().today(), xp, source: 'achievement', label: `Logro: ${title}`, ref: `ach:${id}` }, { silent: true })
      },

      claimQuest: (day, id, title) => {
        const done = get().quests[day] ?? []
        if (done.includes(id)) return
        set((s) => ({ quests: { ...s.quests, [day]: [...done, id] } }))
        playCoins()
        get().award({ date: day, xp: XP.quest, source: 'quest', label: `Misión: ${title}`, ref: `quest:${day}:${id}` })
      },

      importData: (d) => set(migrateData(d as any, (d as AppData).version ?? 1)),
      resetAll: () => set({ ...initialData() }),
    }),
    {
      name: 'alba-data',
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => {
        const { hydrated: _h, ...rest } = s
        const data: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(rest)) if (typeof v !== 'function') data[k] = v
        return data as unknown as AppData
      },
      // Punto único para evolucionar el esquema sin perder datos.
      migrate: (persisted, version) => migrateData(persisted as Record<string, any>, version) as any,
      merge: (persisted, current) => ({ ...current, ...(persisted as AppData) }),
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true })
      },
    },
  ),
)

export function exportData(): AppData {
  const s = useStore.getState()
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(initialData())) out[k] = (s as any)[k]
  return out as unknown as AppData
}


