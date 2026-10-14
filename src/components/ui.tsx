import { useEffect, useId, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion'
import { X, Minus, Plus } from 'lucide-react'
import { cx } from '../lib/util'
import { AlbaSun } from './Alba'

export const springy = { type: 'spring', stiffness: 520, damping: 34, mass: 0.8 } as const
export const soft = { type: 'spring', stiffness: 260, damping: 30 } as const

/* ───────── Sheet: hoja inferior arrastrable, como en iOS ───────── */

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  right,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  right?: ReactNode
}) {
  const controls = useDragControls()
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40, mass: 0.9 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.9 }}
            onDragEnd={onDragEnd}
          >
            <div className="sheet-grip" onPointerDown={(e) => controls.start(e)} />
            {(title || right) && (
              <div className="sheet-head" onPointerDown={(e) => controls.start(e)}>
                <div className="sheet-title">{title}</div>
                <div className="row">
                  {right}
                  <button className="icon-btn soft sm" onClick={onClose} aria-label="Cerrar">
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}
            <div className="sheet-body">{children}</div>
            {footer && <div className="sheet-foot">{footer}</div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ───────── Anillo de progreso ───────── */

export function Ring({
  value,
  size = 56,
  stroke = 6,
  color = 'var(--a)',
  track = 'var(--surface-2)',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color === 'url(#ringGrad)' ? 'var(--a)' : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        />
      </svg>
      {children && <div className="ring-label">{children}</div>}
    </div>
  )
}

export function XPBar({ value, thin, colored }: { value: number; thin?: boolean; colored?: boolean }) {
  return (
    <div className={cx('xpbar', thin && 'thin', colored && 'c')}>
      <motion.i
        initial={false}
        animate={{ scaleX: Math.max(0.02, Math.min(1, value)) }}
        transition={{ type: 'spring', stiffness: 140, damping: 24 }}
        style={{ width: '100%' }}
      />
    </div>
  )
}

export function Coin({ lg }: { lg?: boolean }) {
  return <i className={cx('coin', lg && 'lg')} aria-hidden />
}

/* ───────── Segmented control con píldora animada ───────── */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
}) {
  const id = useId()
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={o.value === value} className={cx(o.value === value && 'on')} onClick={() => onChange(o.value)}>
          {o.value === value && <motion.span layoutId={`seg${id}`} className="seg-pill" transition={springy} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} className={cx('toggle', on && 'on')} onClick={() => onChange(!on)} />
}

export function Stepper({ value, onChange, min = 0, max = 999, step = 1, suffix }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return (
    <div className="stepper">
      <button aria-label="Menos" onClick={() => onChange(Math.max(min, value - step))}>
        <Minus size={16} />
      </button>
      <span className="val">
        {value}
        {suffix}
      </span>
      <button aria-label="Más" onClick={() => onChange(Math.min(max, value + step))}>
        <Plus size={16} />
      </button>
    </div>
  )
}

export function Empty({ title, children, joy = 0.6 }: { emoji?: string; title: string; children?: ReactNode; joy?: number }) {
  return (
    <div className="empty">
      <div style={{ display: 'grid', placeItems: 'center' }}>
        <AlbaSun size={78} joy={joy} />
      </div>
      <b>{title}</b>
      {children && <div className="small">{children}</div>}
    </div>
  )
}

/* ───────── Selector de emoji ───────── */

const EMOJI_SETS: Record<string, string[]> = {
  Hábitos: ['💧', '🥤', '🏋️', '🚶', '🏃', '🚴', '🧘', '🤸', '😴', '🛏️', '🥗', '🍎', '💊', '🦷', '🧴', '🚿', '📚', '✍️', '🧠', '🎯', '🗣️', '🎧', '🎹', '🎨', '📵', '🌙', '🌅', '☀️', '🌬️', '🌿', '🙏', '🕯️'],
  Vida: ['💰', '🐷', '🧾', '📊', '💳', '🏦', '💌', '📞', '🫶', '👨‍👩‍👧', '❤️', '🤝', '🎁', '🏠', '🧹', '🧺', '🌱', '🐶', '🚀', '💼', '💻', '🗺️', '📝', '⏱️', '🏆', '⭐️', '🔥', '💎', '🛡️', '🧭', '🦁', '🐉'],
  Caras: ['😀', '😊', '😎', '🤓', '🥳', '😌', '🤩', '😇', '🦁', '🐯', '🐺', '🦊', '🐼', '🦉', '🐬', '🦋', '🌻', '🌊', '⚡️', '🌈', '🍀', '🌸', '🍿', '☕️', '🍣', '🎮', '🏖️', '🎬', '✈️', '⛰️', '🎉', '👑'],
}

export function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [set, setSet] = useState(Object.keys(EMOJI_SETS)[0])
  return (
    <div className="stack-12">
      <div className="row">
        <div className="emoji-tile lg">{value}</div>
        <input
          className="input"
          value={value}
          onChange={(e) => {
            const v = [...e.target.value].slice(-2).join('')
            if (v) onChange(v)
          }}
          aria-label="Emoji personalizado"
          placeholder="O escribe cualquier emoji"
        />
      </div>
      <div className="chips wrap">
        {Object.keys(EMOJI_SETS).map((k) => (
          <button key={k} className={cx('chip', k === set && 'on')} onClick={() => setSet(k)}>
            {k}
          </button>
        ))}
      </div>
      <div className="emoji-grid">
        {EMOJI_SETS[set].map((e) => (
          <button key={e} className={cx(e === value && 'on')} onClick={() => onChange(e)}>
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}

/* Número que cuenta hacia arriba con suavidad */
export function CountUp({ value, format = (n: number) => String(Math.round(n)) }: { value: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(value)
  useEffect(() => {
    const from = shown
    const to = value
    if (from === to) return
    const start = performance.now()
    const dur = 650
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(from + (to - from) * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <span className="num">{format(shown)}</span>
}
