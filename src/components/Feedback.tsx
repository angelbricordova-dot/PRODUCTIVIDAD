import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useUI } from '../store/ui'
import { Coin } from './ui'

export function Toasts() {
  const toasts = useUI((s) => s.toasts)
  const dismiss = useUI((s) => s.dismiss)
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            className={`toast ${t.tone ?? ''}`}
            onClick={() => dismiss(t.id)}
            initial={{ opacity: 0, y: -24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 34 }}
          >
            {t.emoji && <span style={{ fontSize: 18 }}>{t.emoji}</span>}
            {t.xp ? (
              <span className="t-xp">
                <em>+{t.xp} XP</em>
              </span>
            ) : null}
            <span className="ellipsis" style={{ maxWidth: 210 }}>
              {t.title}
              {t.subtitle && <em className="t-sub">{t.subtitle}</em>}
            </span>
            {t.coins ? (
              <span className="t-coins">
                <Coin />+{t.coins}
              </span>
            ) : null}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function CelebrationLayer() {
  const c = useUI((s) => s.celebration)
  const close = useUI((s) => s.closeCelebration)

  useEffect(() => {
    if (!c) return
    const colors = ['#ffb547', '#ff7a59', '#e07cf0', '#47c9d4', '#ffffff']
    const fire = (ratio: number, opts: confetti.Options) =>
      confetti({ origin: { y: 0.55 }, particleCount: Math.floor(160 * ratio), colors, disableForReducedMotion: true, zIndex: 200, ...opts })
    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
  }, [c])

  return (
    <AnimatePresence>
      {c && (
        <motion.div className="celebrate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div
            className="celebrate-card"
            initial={{ scale: 0.7, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div className="celebrate-emoji" initial={{ rotate: -20, scale: 0.4 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 }}>
              {c.emoji ?? '🎉'}
            </motion.div>
            {c.kind === 'level' && <div className="eyebrow" style={{ marginTop: 16 }}>Subiste de nivel</div>}
            <div className="celebrate-title">{c.title}</div>
            {c.subtitle && <p className="celebrate-sub">{c.subtitle}</p>}
            <button className="btn primary block" style={{ marginTop: 22 }} onClick={close}>
              ¡Vamos!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
