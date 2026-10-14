import { describe, it, expect } from 'vitest'
import { migrateData, SCHEMA_VERSION } from './data'

describe('migración v1 → v2', () => {
  it('quita Finanzas y conserva todo lo demás', () => {
    const v1 = {
      version: 1,
      profile: { name: 'Alejandro', fullName: 'Alejandro Gabriel Lamont Bencomo', avatar: '🦁', motto: 'x', theme: 'auto', accent: 'lavanda', sound: true, dayStartHour: 4, currency: 'USD', onboarded: true, createdAt: '2026-10-01' },
      areas: [
        { id: 'cuerpo', name: 'Cuerpo', emoji: '💪', color: '#f00' },
        { id: 'finanzas', name: 'Finanzas', emoji: '💰', color: '#0f0' },
      ],
      habits: [{ id: 'h1', name: 'Leer', areaId: 'cuerpo' }],
      logs: { '2026-10-02': { h1: 1 } },
      transactions: [{ id: 't' }],
      categories: [{ id: 'c' }],
      savings: [{ id: 's' }],
      events: [{ id: 'e', xp: 10 }],
    }
    const d = migrateData(v1, 1) as any
    expect(d.version).toBe(SCHEMA_VERSION)
    expect(d.transactions).toBeUndefined()
    expect(d.categories).toBeUndefined()
    expect(d.savings).toBeUndefined()
    expect(d.profile.currency).toBeUndefined()
    expect(d.areas.map((a: any) => a.id)).toEqual(['cuerpo'])
    expect(d.habits).toHaveLength(1)
    expect(d.logs['2026-10-02'].h1).toBe(1)
    expect(d.events).toHaveLength(1)
    expect(d.profile.accent).toBe('uva')
    expect(d.profile.font).toBe('alba')
    expect(d.profile.name).toBe('Alejandro')
    expect(d.media).toEqual({})
  })

  it('mantiene el área Finanzas si algún hábito la usa', () => {
    const d = migrateData({ areas: [{ id: 'finanzas' }], habits: [{ id: 'h', areaId: 'finanzas' }], profile: {} }, 1) as any
    expect(d.areas).toHaveLength(1)
  })
})
