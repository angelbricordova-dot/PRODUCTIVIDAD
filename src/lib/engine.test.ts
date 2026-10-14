import { describe, it, expect } from 'vitest'
import { levelFromXp, xpForLevel, levelInfo, habitReward } from './game'
import { habitStreak, dayStats, scheduleLabel } from './habits'
import { addDays, todayKey, weekdayMon, startOfWeek } from './date'
import type { Habit } from '../store/types'

const habit = (over: Partial<Habit> = {}): Habit => ({
  id: 'h', name: 'Meditar', emoji: '🧘', areaId: 'calma', timeOfDay: 'morning',
  schedule: { type: 'daily' }, target: 1, difficulty: 2, archived: false,
  createdAt: '2026-01-01', order: 0, ...over,
})

describe('niveles', () => {
  it('curva coherente', () => {
    expect(xpForLevel(1)).toBe(0)
    expect(xpForLevel(2)).toBe(100)
    expect(levelFromXp(0)).toBe(1)
    expect(levelFromXp(99)).toBe(1)
    expect(levelFromXp(100)).toBe(2)
    expect(levelFromXp(300)).toBe(3)
    for (let n = 1; n < 60; n++) expect(levelFromXp(xpForLevel(n))).toBe(n)
  })
  it('progreso dentro del nivel', () => {
    const i = levelInfo(150)
    expect(i.level).toBe(2)
    expect(i.xpInto).toBe(50)
    expect(i.xpNeeded).toBe(200)
  })
  it('la racha da bonus con tope', () => {
    expect(habitReward(2, 0).xp).toBe(20)
    expect(habitReward(2, 300).xp).toBe(30)
  })
})

describe('rachas — nunca falles dos veces', () => {
  const days = (from: string, n: number) => Array.from({ length: n }, (_, i) => addDays(from, i))
  const logsFor = (list: string[]) => Object.fromEntries(list.map((d) => [d, { h: 1 }]))

  it('cuenta días seguidos', () => {
    const d = days('2026-01-01', 5)
    const s = habitStreak(habit(), logsFor(d), {}, '2026-01-05')
    expect(s.current).toBe(5)
    expect(s.best).toBe(5)
  })

  it('perdona un fallo aislado', () => {
    const d = days('2026-01-01', 10).filter((x) => x !== '2026-01-05')
    const s = habitStreak(habit(), logsFor(d), {}, '2026-01-10')
    expect(s.current).toBe(9)
  })

  it('dos fallos seguidos rompen la racha', () => {
    const d = days('2026-01-01', 10).filter((x) => x !== '2026-01-05' && x !== '2026-01-06')
    const s = habitStreak(habit(), logsFor(d), {}, '2026-01-10')
    expect(s.current).toBe(4)
    expect(s.best).toBe(4)
  })

  it('hoy sin hacer no rompe nada', () => {
    const d = days('2026-01-01', 4)
    expect(habitStreak(habit(), logsFor(d), {}, '2026-01-05').current).toBe(4)
  })

  it('los días de descanso se saltan', () => {
    const d = days('2026-01-01', 6).filter((x) => x !== '2026-01-03' && x !== '2026-01-04')
    const s = habitStreak(habit(), logsFor(d), { '2026-01-03': true, '2026-01-04': true }, '2026-01-06')
    expect(s.current).toBe(4)
  })

  it('semanales cuentan semanas', () => {
    const h = habit({ schedule: { type: 'weekly', times: 2 }, createdAt: '2026-01-05' })
    const logs = logsFor(['2026-01-05', '2026-01-07', '2026-01-12', '2026-01-14'])
    expect(habitStreak(h, logs, {}, '2026-01-15').current).toBe(2)
  })
})

describe('días', () => {
  it('lunes = 0', () => {
    expect(weekdayMon('2026-10-12')).toBe(0) // lunes
    expect(startOfWeek('2026-10-18')).toBe('2026-10-12')
  })
  it('el día lógico empieza a las 4am', () => {
    expect(todayKey(4, new Date(2026, 9, 14, 2, 0))).toBe('2026-10-13')
    expect(todayKey(4, new Date(2026, 9, 14, 5, 0))).toBe('2026-10-14')
  })
  it('estadísticas del día ignoran semanales no hechos', () => {
    const a = habit({ id: 'a' })
    const b = habit({ id: 'b', schedule: { type: 'weekly', times: 3 } })
    expect(dayStats([a, b], { '2026-02-01': { a: 1 } }, '2026-02-01')).toEqual({ total: 1, done: 1, ratio: 1 })
    expect(scheduleLabel(habit({ schedule: { type: 'days', days: [0, 1, 2, 3, 4] } }))).toBe('Entre semana')
  })
})
