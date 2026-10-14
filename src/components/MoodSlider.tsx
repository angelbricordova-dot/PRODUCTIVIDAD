import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Face, moodColor } from './Alba'
import { haptic, playSoft } from '../lib/feedback'
import type { Mood } from '../store/types'

export const MOOD_LABELS = [
  { max: 15, value: 1, label: 'Fatal', line: 'Hoy pesa. Está bien no estar bien.' },
  { max: 37, value: 2, label: 'Bajo', line: 'Un día gris. Sé amable contigo.' },
  { max: 62, value: 3, label: 'Normal', line: 'Ni fu ni fa. Un día más de camino.' },
  { max: 84, value: 4, label: 'Bien', line: 'Buena energía. Aprovéchala.' },
  { max: 101, value: 5, label: 'Genial', line: '¡Estás que brillas!' },
] as const

export function moodFromScore(score: number) {
  return MOOD_LABELS.find((m) => score < m.max) ?? MOOD_LABELS[4]
}

export function scoreFromValue(v: Mood['value']) {
  return [8, 26, 50, 73, 94][v - 1]
}

/**
 * Deslizador de ánimo: la cara cambia de gesto y color mientras arrastras.
 * `onCommit` se llama al soltar (o al usar el teclado) con la puntuación 0..100.
 */
export function MoodSlider({
  score,
  onChange,
  onCommit,
  compact = false,
}: {
  score: number | undefined
  onChange?: (s: number) => void
  onCommit: (s: number) => void
  compact?: boolean
}) {
  const [local, setLocal] = useState(score ?? 50)
  const [dragging, setDragging] = useState(false)
  const [touched, setTouched] = useState(score !== undefined)
  const track = useRef<HTMLDivElement>(null)
  const lastLabel = useRef(moodFromScore(local).label)

  useEffect(() => {
    if (!dragging && score !== undefined) setLocal(score)
  }, [score, dragging])

  const mood = moodFromScore(local)
  const color = moodColor(local / 100)

  const update = (s: number) => {
    const v = Math.round(Math.max(0, Math.min(100, s)))
    setLocal(v)
    onChange?.(v)
    const l = moodFromScore(v).label
    if (l !== lastLabel.current) {
      lastLabel.current = l
      haptic('light')
    }
  }

  const fromEvent = (e: React.PointerEvent) => {
    const r = track.current!.getBoundingClientRect()
    return ((e.clientX - r.left) / r.width) * 100
  }

  return (
    <div className={`mood-slider ${compact ? 'compact' : ''}`} style={{ ['--mood' as string]: color }}>
      <div className="mood-stage">
        <motion.svg
          viewBox="0 0 100 100"
          className="mood-face"
          key={mood.label}
          initial={{ scale: 0.9, rotate: -4 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 14 }}
          aria-hidden
        >
          <motion.circle cx={50} cy={50} r={44} animate={{ fill: color }} transition={{ duration: 0.2 }} />
          <circle cx={38} cy={34} r={20} fill="#fff" opacity={0.18} />
          <Face joy={local / 100} />
        </motion.svg>
        <div className="mood-words">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={touched ? mood.label : 'q'}
              className="mood-label"
              initial={{ y: 14, opacity: 0, filter: 'blur(4px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -14, opacity: 0, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 520, damping: 34 }}
            >
              {touched ? mood.label : '¿Cómo estás?'}
            </motion.div>
          </AnimatePresence>
          {!compact && <p className="mood-line">{touched ? mood.line : 'Desliza para contarme cómo te sientes.'}</p>}
        </div>
      </div>

      <div
        ref={track}
        className={`mood-track ${dragging ? 'dragging' : ''}`}
        role="slider"
        tabIndex={0}
        aria-label="Estado de ánimo"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={local}
        aria-valuetext={mood.label}
        onPointerDown={(e) => {
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          setDragging(true)
          setTouched(true)
          update(fromEvent(e))
        }}
        onPointerMove={(e) => dragging && update(fromEvent(e))}
        onPointerUp={() => {
          setDragging(false)
          playSoft()
          onCommit(local)
        }}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') update(local + 5)
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') update(local - 5)
          else return
          e.preventDefault()
          setTouched(true)
        }}
        onKeyUp={(e) => ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key) && onCommit(local)}
      >
        <div className="mood-rail" />
        {[0, 25, 50, 75, 100].map((t) => (
          <span key={t} className="mood-tick" style={{ left: `${t}%` }} />
        ))}
        <motion.div
          className="mood-thumb"
          style={{ left: `${local}%` }}
          animate={{ scale: dragging ? 1.18 : 1 }}
          transition={{ type: 'spring', stiffness: 600, damping: 28 }}
        />
      </div>
      <div className="mood-ends" aria-hidden>
        <span>Fatal</span>
        <span>Genial</span>
      </div>
    </div>
  )
}
