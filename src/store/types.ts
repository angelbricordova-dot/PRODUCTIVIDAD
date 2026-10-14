import type { DateKey } from '../lib/date'

export type ID = string

export type ThemeMode = 'auto' | 'light' | 'dark'
export type AccentName = 'mandarina' | 'cielo' | 'menta' | 'chicle' | 'uva' | 'girasol'
export type FontId = 'alba' | 'retro' | 'moderna' | 'redonda' | 'clasica' | 'geometrica' | 'mano' | 'iphone'
export type TextScale = 'sm' | 'md' | 'lg'

export interface Profile {
  name: string
  fullName: string
  avatar: string
  avatarMedia?: ID // foto de perfil (comprimida)
  motto: string
  theme: ThemeMode
  accent: AccentName
  font: FontId
  textScale: TextScale
  sound: boolean
  dayStartHour: number
  onboarded: boolean
  createdAt: DateKey
}

export interface Area {
  id: ID
  name: string
  emoji: string
  color: string
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime'

export type Schedule =
  | { type: 'daily' }
  | { type: 'days'; days: number[] } // 0 = lunes … 6 = domingo
  | { type: 'weekly'; times: number } // N veces por semana, cualquier día

export type Difficulty = 1 | 2 | 3

export interface Habit {
  id: ID
  name: string
  emoji: string
  areaId: ID
  timeOfDay: TimeOfDay
  schedule: Schedule
  target: number // repeticiones por día (1 = sí/no)
  unit?: string
  difficulty: Difficulty
  minutes?: number // duración sugerida, usada por el modo ritual
  cue?: string // "Después de … " (habit stacking)
  why?: string
  archived: boolean
  createdAt: DateKey
  order: number
}

export type XPSource =
  | 'habit' | 'journal' | 'mood' | 'gratitude' | 'relation' | 'media'
  | 'focus' | 'quest' | 'achievement' | 'goal' | 'review' | 'bullet' | 'calm'

export interface XPEvent {
  id: ID
  ts: number
  date: DateKey
  xp: number
  coins: number
  source: XPSource
  label: string
  areaId?: ID
  ref?: string // clave para deshacer (p. ej. "habit:<id>:<date>")
}

export interface Reward {
  id: ID
  name: string
  emoji: string
  cost: number
  note?: string
}

export interface Redemption {
  id: ID
  rewardId: ID
  name: string
  emoji: string
  cost: number
  ts: number
  date: DateKey
}

export interface Mood {
  value: 1 | 2 | 3 | 4 | 5
  score?: number // 0..100, posición exacta del deslizador
  tags: string[]
  note?: string
  ts: number
}

export interface JournalEntry {
  intention?: string
  gratitude: string[]
  highlight?: string
  reflection?: string
  lesson?: string
  media?: ID[]
}

export type BulletType = 'task' | 'event' | 'note'
export type BulletStatus = 'open' | 'done' | 'migrated' | 'cancelled'

export interface Bullet {
  id: ID
  date: DateKey
  type: BulletType
  text: string
  status: BulletStatus
  priority: boolean
  createdAt: number
}

export interface MediaMeta {
  id: ID
  kind: 'image' | 'video'
  mime: string
  width: number
  height: number
  bytes: number // tamaño guardado (ya comprimido)
  originalBytes: number
  duration?: number
  createdAt: number
}

export type RelationKind = 'familia' | 'pareja' | 'amistad' | 'trabajo' | 'mentor' | 'otro'
export type InteractionType = 'llamada' | 'mensaje' | 'en persona' | 'videollamada' | 'detalle'

export interface Interaction {
  id: ID
  date: DateKey
  type: InteractionType
  note?: string
}

export interface Person {
  id: ID
  name: string
  emoji: string
  kind: RelationKind
  cadenceDays: number
  birthday?: string // "MM-DD"
  notes?: string
  photo?: ID
  interactions: Interaction[]
  createdAt: DateKey
}

export interface Milestone {
  id: ID
  text: string
  done: boolean
}

export interface Goal {
  id: ID
  title: string
  emoji: string
  areaId: ID
  why?: string
  deadline?: DateKey
  milestones: Milestone[]
  done: boolean
  doneAt?: DateKey
  createdAt: DateKey
}

export interface FocusSession {
  id: ID
  ts: number
  date: DateKey
  minutes: number
  label: string
  kind: 'focus' | 'breath'
}

export interface WeeklyReview {
  rating: number
  wins: string
  lessons: string
  nextFocus: string
  ts: number
}

export interface AppData {
  version: number
  profile: Profile
  areas: Area[]
  habits: Habit[]
  logs: Record<DateKey, Record<ID, number>>
  restDays: Record<DateKey, true>
  events: XPEvent[]
  rewards: Reward[]
  redemptions: Redemption[]
  moods: Record<DateKey, Mood>
  journal: Record<DateKey, JournalEntry>
  bullets: Bullet[]
  people: Person[]
  goals: Goal[]
  focus: FocusSession[]
  reviews: Record<DateKey, WeeklyReview> // clave = lunes de la semana
  achievements: Record<string, number>
  quests: Record<DateKey, string[]> // misiones ya premiadas ese día
  media: Record<ID, MediaMeta>
  habitPhotos: Record<string, ID[]> // clave "<habitId>:<fecha>"
}
