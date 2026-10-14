import type { AppData, XPEvent } from './types'
import { sum } from '../lib/util'
import type { DateKey } from '../lib/date'

export const totalXp = (d: Pick<AppData, 'events'>) => sum(d.events, (e) => e.xp)

export const coinBalance = (d: Pick<AppData, 'events' | 'redemptions'>) =>
  sum(d.events, (e) => e.coins) - sum(d.redemptions, (r) => r.cost)

export function areaXp(events: XPEvent[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const e of events) if (e.areaId) out[e.areaId] = (out[e.areaId] ?? 0) + e.xp
  return out
}

export function xpByDay(events: XPEvent[]): Record<DateKey, number> {
  const out: Record<DateKey, number> = {}
  for (const e of events) out[e.date] = (out[e.date] ?? 0) + e.xp
  return out
}

export function xpOn(events: XPEvent[], day: DateKey) {
  return sum(events.filter((e) => e.date === day), (e) => e.xp)
}
