export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function sum<T>(arr: T[], f: (x: T) => number): number {
  let s = 0
  for (const x of arr) s += f(x)
  return s
}

/** Pseudoaleatorio estable por semilla (misiones diarias, frase del día). */
export function seeded(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function money(n: number, currency: string, compact = false): string {
  try {
    return new Intl.NumberFormat(currency === 'EUR' ? 'es-ES' : 'es-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: compact || Math.abs(n) >= 1000 ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(n)
  } catch {
    return `${n.toFixed(2)} ${currency}`
  }
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}
