import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useUI } from '../store/ui'
import { Coin } from './ui'
import { AlbaSun } from './Alba'

const CONFETTI = ['#f26a2e', '#ffc23d', '#2f7bf5', '#12a07c', '#f0468e', '#7b5cf5']

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
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 30 }}
          >
            {t.icon ? <t.icon size={18} strokeWidth={2.4} /> : t.emoji ? <span style={{ fontSize: '1.1rem' }}>{t.emoji}</span> : null}
            {t.xp ? <span className="t-xp">+{t.xp} XP</span> : null}
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
    const fire = (ratio: number, opts: confetti.Options) =>
      confetti({ origin: { y: 0.55 }, particleCount: Math.floor(170 * ratio), colors: CONFETTI, shapes: ['circle', 'square'], disableForReducedMotion: true, zIndex: 200, ...opts })
    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.3 })
  }, [c])

  const Icon = c?.icon
  return (
    <AnimatePresence>
      {c && (
        <motion.div className="celebrate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div
            className="celebrate-card"
            initial={{ scale: 0.7, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="celebrate-emoji"
              initial={{ y: 30, scale: 0.4, rotate: -25 }}
              animate={{ y: [30, -14, 0], scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 11, delay: 0.08 }}
            >
              {c.kind === 'level' ? (
                <AlbaSun joy={1} size={130} />
              ) : Icon ? (
                <span className={`badge-item on c-${c.color ?? 'girasol'}`} style={{ padding: 0 }}>
                  <span className="medal" style={{ width: 104, height: 104, borderRadius: '38px 30px 40px 28px' }}>
                    <Icon size={52} strokeWidth={2.2} />
                  </span>
                </span>
              ) : (
                <span style={{ fontSize: '4.5rem', lineHeight: 1 }}>{c.emoji ?? '🎉'}</span>
              )}
            </motion.div>
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
