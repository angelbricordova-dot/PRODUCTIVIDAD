import { motion } from 'framer-motion'
import { addDays, startOfWeek, type DateKey, MONTHS, fromKey, WEEKDAYS_SHORT } from '../lib/date'

/** Mapa de calor estilo GitHub: columnas = semanas, filas = L..D. */
export function Heatmap({
  today,
  weeks = 18,
  value,
  color = 'var(--a)',
}: {
  today: DateKey
  weeks?: number
  value: (d: DateKey) => number | null // 0..1, null = sin datos
  color?: string
}) {
  const start = addDays(startOfWeek(today), -7 * (weeks - 1))
  const cells: { d: DateKey; v: number | null; future: boolean }[] = []
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(start, i)
    cells.push({ d, v: d > today ? null : value(d), future: d > today })
  }
  const months: { col: number; label: string }[] = []
  for (let w = 0; w < weeks; w++) {
    const d = fromKey(addDays(start, w * 7))
    if (d.getDate() <= 7) months.push({ col: w, label: MONTHS[d.getMonth()].slice(0, 3) })
  }
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeks}, 1fr)`, gap: 3, marginBottom: 4, marginLeft: 16 }}>
        {Array.from({ length: weeks }, (_, w) => (
          <span key={w} className="tiny muted" style={{ fontSize: 9.5, whiteSpace: 'nowrap' }}>
            {months.find((m) => m.col === w)?.label ?? ''}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gap: 3, width: 12 }}>
          {WEEKDAYS_SHORT.map((w, i) => (
            <span key={w} className="tiny muted" style={{ fontSize: 9, lineHeight: 1, alignSelf: 'center', opacity: i % 2 ? 0 : 1 }}>
              {w}
            </span>
          ))}
        </div>
        <div className="heatmap" style={{ flex: 1, gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
          {cells.map((c) => (
            <i
              key={c.d}
              title={c.d}
              style={{
                background:
                  c.future ? 'transparent' : c.v === null || c.v === 0 ? undefined : `color-mix(in oklab, ${color} ${Math.round(25 + c.v * 75)}%, var(--surface-3))`,
                outline: c.d === today ? '1.5px solid var(--ink)' : undefined,
                outlineOffset: 1,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function Bars({ data, highlight, height = 120, format }: { data: { label: string; value: number; key: string }[]; highlight?: string; height?: number; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div>
      <div className="bars" style={{ height }}>
        {data.map((d, i) => (
          <motion.div
            key={d.key}
            className={`bar ${d.value > 0 ? 'on' : ''} ${d.key === highlight ? 'today' : ''}`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.015, type: 'spring', stiffness: 200, damping: 24 }}
            style={{ height: `${Math.max(3, (d.value / max) * 100)}%`, transformOrigin: 'bottom' }}
            title={format ? format(d.value) : String(d.value)}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        {data.map((d) => (
          <span key={d.key} className="tiny muted center" style={{ flex: 1, fontSize: 10 }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Radar hexagonal de áreas de vida (los "atributos" del personaje). */
export function Radar({ items, size = 260 }: { items: { label: string; emoji: string; value: number; color: string; level: number }[]; size?: number }) {
  const n = items.length
  if (n < 3) return null
  const cx = size / 2
  const cy = size / 2
  const R = size / 2 - 38
  const pt = (i: number, r: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const
  }
  const poly = (r: (i: number) => number) => items.map((_, i) => pt(i, r(i)).join(',')).join(' ')
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size, display: 'block', margin: '0 auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id="radarG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--a)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--girasol)" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={poly(() => R * f)} fill="none" stroke="var(--line-2)" strokeWidth={1} />
      ))}
      {items.map((_, i) => {
        const [x, y] = pt(i, R)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" />
      })}
      <motion.polygon
        points={poly((i) => R * Math.max(0.08, items[i].value))}
        fill="url(#radarG)"
        stroke="var(--a)"
        strokeWidth={2}
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {items.map((it, i) => {
        const [x, y] = pt(i, R * Math.max(0.08, it.value))
        return <circle key={i} cx={x} cy={y} r={4} fill={it.color} stroke="var(--surface)" strokeWidth={2} />
      })}
      {items.map((it, i) => {
        const [x, y] = pt(i, R + 22)
        return (
          <g key={it.label}>
            <text x={x} y={y - 4} textAnchor="middle" fontSize="16">
              {it.emoji}
            </text>
            <text x={x} y={y + 11} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--muted)">
              {it.label} · {it.level}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
