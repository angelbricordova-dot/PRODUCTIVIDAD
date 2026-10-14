import type { AppData, Habit } from './types'
import { todayKey } from '../lib/date'
import { DEFAULT_AREAS, DEFAULT_REWARDS } from '../lib/seed'

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

