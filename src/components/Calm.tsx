import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, RotateCcw } from 'lucide-react'
import { useStore } from '../store'
import { playSoft, playLevelUp, haptic } from '../lib/feedback'
import { cx } from '../lib/util'
import { Ring, Segmented } from './ui'

type Pattern = { id: string; name: string; desc: string; steps: { label: string; secs: number; scale: number }[] }

const PATTERNS: Pattern[] = [
  {
    id: 'box',
    name: 'Caja 4·4·4·4',
    desc: 'Calma y foco. La usan pilotos y atletas.',
    steps: [
      { label: 'Inhala', secs: 4, scale: 1 },
      { label: 'Sostén', secs: 4, scale: 1 },
      { label: 'Exhala', secs: 4, scale: 0.55 },
      { label: 'Sostén', secs: 4, scale: 0.55 },
    ],
  },
  {
    id: '478',
    name: '4·7·8',
    desc: 'Para soltar la ansiedad y dormir mejor.',
    steps: [
      { label: 'Inhala', secs: 4, scale: 1 },
      { label: 'Sostén', secs: 7, scale: 1 },
      { label: 'Exhala', secs: 8, scale: 0.55 },
    ],
  },
  {
    id: 'coherent',
    name: 'Coherencia 5·5',
    desc: 'Equilibra tu sistema nervioso.',
    steps: [
      { label: 'Inhala', secs: 5, scale: 1 },
      { label: 'Exhala', secs: 5, scale: 0.55 },
    ],
  },
]

export function Calm({ mode: initial, onClose }: { mode: 'focus' | 'breath'; onClose: () => void }) {
  const [mode, setMode] = useState(initial)
  return (
    <motion.div
      className={cx('fullscreen calm-bg', mode === 'focus' && 'focus')}
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="row-between">
        <div style={{ width: 210 }} className="calm-seg">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'breath', label: 'Respirar' },
              { value: 'focus', label: 'Enfoque' },
            ]}
          />
        </div>
        <button className="icon-btn" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', boxShadow: 'none' }} onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
      </div>
      {mode === 'breath' ? <Breath /> : <Focus />}
    </motion.div>
  )
}

function Breath() {
  const addFocus = useStore((s) => s.addFocus)
  const [pattern, setPattern] = useState(PATTERNS[0])
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [left, setLeft] = useState(pattern.steps[0].secs)
  const [cycles, setCycles] = useState(0)
  const [rewarded, setRewarded] = useState(false)
  const target = 4

  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setTick((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [running])

  useEffect(() => {
    if (!running || tick === 0) return
    if (left > 1) {
      setLeft(left - 1)
      return
    }
    const next = (step + 1) % pattern.steps.length
    if (next === 0) setCycles((c) => c + 1)
    setStep(next)
    setLeft(pattern.steps[next].secs)
    playSoft()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  useEffect(() => {
    if (cycles >= target && !rewarded) {
      setRewarded(true)
      haptic('success')
      addFocus(1, pattern.name, 'breath')
    }
  }, [cycles, rewarded, addFocus, pattern.name])

  const cur = pattern.steps[step]
  const start = () => {
    if (!running) playSoft()
    setRunning((r) => !r)
  }

  return (
    <div className="center">
      <div className="breath-stage">
        <motion.div className="breath-halo" animate={{ scale: running ? cur.scale * 1.1 : 0.8, opacity: running ? 1 : 0.5 }} transition={{ duration: running ? cur.secs : 0.6, ease: 'easeInOut' }} />
        <motion.div className="breath-blob" animate={{ scale: running ? cur.scale : 0.7, borderRadius: running ? ['50%', '46% 54% 52% 48%', '50%'] : '50%' }} transition={{ duration: running ? cur.secs : 0.6, ease: 'easeInOut' }} />
        <div className="breath-text">
          <AnimatePresence mode="wait">
            <motion.div key={running ? `${step}-${cycles}` : 'idle'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
              {running ? cur.label : 'Listo'}
              {running && <div style={{ fontSize: 18, opacity: 0.7 }}>{left}</div>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <p style={{ opacity: 0.8, minHeight: 24 }}>
        {cycles >= target ? '✨ Bien hecho. +10 XP para tu calma.' : `Ciclo ${Math.min(cycles + 1, target)} de ${target}`}
      </p>
      <button className="btn primary" style={{ marginTop: 18, minWidth: 180 }} onClick={start}>
        {running ? <Pause size={18} /> : <Play size={18} />} {running ? 'Pausar' : 'Empezar'}
      </button>
      <div className="stack-8" style={{ marginTop: 28, textAlign: 'left' }}>
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            className="card pad-sm row"
            style={{ width: '100%', textAlign: 'left', background: p.id === pattern.id ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)', color: '#fff', boxShadow: 'none' }}
            onClick={() => {
              setPattern(p)
              setStep(0)
              setLeft(p.steps[0].secs)
              setRunning(false)
            }}
          >
            <span className="grow">
              <b>{p.name}</b>
              <br />
              <span className="small" style={{ opacity: 0.7 }}>{p.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

const PRESETS = [15, 25, 45, 60]

function Focus() {
  const addFocus = useStore((s) => s.addFocus)
  const [minutes, setMinutes] = useState(25)
  const [label, setLabel] = useState('')
  const [endAt, setEndAt] = useState<number | null>(null)
  const [pausedLeft, setPausedLeft] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const done = useRef(false)

  useEffect(() => {
    if (!endAt) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [endAt])

  const total = minutes * 60_000
  const left = endAt ? Math.max(0, endAt - now) : pausedLeft ?? total
  const progress = 1 - left / total

  useEffect(() => {
    if (endAt && left === 0 && !done.current) {
      done.current = true
      setEndAt(null)
      setPausedLeft(null)
      playLevelUp()
      haptic('success')
      addFocus(minutes, label.trim() || 'Sesión de enfoque', 'focus')
    }
  }, [left, endAt, addFocus, minutes, label])

  const mm = Math.floor(left / 60000)
  const ss = Math.floor((left % 60000) / 1000)
  const running = !!endAt

  const toggle = () => {
    if (running) {
      setPausedLeft(left)
      setEndAt(null)
    } else {
      done.current = false
      setEndAt(Date.now() + (pausedLeft ?? total))
      setPausedLeft(null)
    }
  }
  const reset = () => {
    setEndAt(null)
    setPausedLeft(null)
  }
  const stopEarly = () => {
    const mins = Math.floor((total - left) / 60000)
    reset()
    if (mins >= 5) addFocus(mins, label.trim() || 'Sesión de enfoque', 'focus')
  }

  return (
    <div className="center" style={{ marginTop: 26 }}>
      <input
        className="input center"
        style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', maxWidth: 320, margin: '0 auto' }}
        placeholder="¿En qué te vas a enfocar?"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <div style={{ display: 'grid', placeItems: 'center', marginTop: 28 }}>
        <Ring value={progress} size={260} stroke={10} color="#ffb98a" track="rgba(255,255,255,0.12)">
          <div>
            <div className="timer-num">
              {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
            </div>
            <div className="small" style={{ opacity: 0.7 }}>+{minutes} XP al terminar</div>
          </div>
        </Ring>
      </div>
      {!running && pausedLeft === null && (
        <div className="row" style={{ justifyContent: 'center', marginTop: 22, gap: 8 }}>
          {PRESETS.map((p) => (
            <button key={p} className="chip" style={{ background: p === minutes ? '#fff' : 'rgba(255,255,255,0.1)', color: p === minutes ? '#2b1838' : '#fff', boxShadow: 'none' }} onClick={() => setMinutes(p)}>
              {p} min
            </button>
          ))}
        </div>
      )}
      <div className="row" style={{ justifyContent: 'center', marginTop: 22 }}>
        {(running || pausedLeft !== null) && (
          <button className="icon-btn" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', boxShadow: 'none' }} onClick={stopEarly} aria-label="Terminar">
            <RotateCcw size={18} />
          </button>
        )}
        <button className="btn primary" style={{ minWidth: 180 }} onClick={toggle}>
          {running ? <Pause size={18} /> : <Play size={18} />} {running ? 'Pausar' : pausedLeft !== null ? 'Seguir' : 'Empezar'}
        </button>
      </div>
      <p className="small" style={{ opacity: 0.65, marginTop: 26, maxWidth: 300, marginInline: 'auto' }}>
        Deja el móvil boca abajo. Una sola tarea. Si terminas antes, las sesiones de 5+ minutos también cuentan.
      </p>
    </div>
  )
}
