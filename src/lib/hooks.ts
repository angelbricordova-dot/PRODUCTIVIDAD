import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import { todayKey, dayPart, type DayPart } from './date'
import { levelInfo, titleFor } from './game'
import { totalXp, coinBalance } from '../store/selectors'
import { globalStreak } from './habits'

/** Reloj de baja frecuencia: re-renderiza cada minuto para que el cielo y "hoy" estén al día. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    const onVis = () => document.visibilityState === 'visible' && setNow(new Date())
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [intervalMs])
  return now
}

export function useToday() {
  const start = useStore((s) => s.profile.dayStartHour)
  const now = useNow()
  return todayKey(start, now)
}

export function useDayPart(): DayPart {
  return dayPart(useNow())
}

export function useLevel() {
  const events = useStore((s) => s.events)
  return useMemo(() => {
    const xp = totalXp({ events })
    const info = levelInfo(xp)
    return { ...info, ...titleFor(info.level) }
  }, [events])
}

export function useCoins() {
  const events = useStore((s) => s.events)
  const redemptions = useStore((s) => s.redemptions)
  return useMemo(() => coinBalance({ events, redemptions }), [events, redemptions])
}

export function useGlobalStreak() {
  const habits = useStore((s) => s.habits)
  const logs = useStore((s) => s.logs)
  const restDays = useStore((s) => s.restDays)
  const since = useStore((s) => s.profile.createdAt)
  const today = useToday()
  return useMemo(() => globalStreak(habits, logs, restDays, today, since), [habits, logs, restDays, today, since])
}
