import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { useStore } from '../store'
import { TEMPLATES, STARTER } from '../lib/seed'
import { TIME_OF_DAY } from '../lib/habits'
import { EmojiPicker } from '../components/ui'
import { cx } from '../lib/util'

const AVATARS = ['🦁', '🐉', '🦅', '🐺', '🦊', '🐯', '🦉', '🐬', '⚡️', '🌊', '🔥', '🚀']

export function Onboarding() {
  const profile = useStore((s) => s.profile)
  const areas = useStore((s) => s.areas)
  const finish = useStore((s) => s.finishOnboarding)
  const [step, setStep] = useState(0)
  const [name, setName] = useState(profile.name)
  const [avatar, setAvatar] = useState(profile.avatar)
  const [more, setMore] = useState(false)
  const [picked, setPicked] = useState<string[]>(STARTER.slice(0, 6))

  const toggle = (n: string) => setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]))
  const go = () => {
    if (step < 2) return setStep(step + 1)
    const templates = TEMPLATES.filter((t) => picked.includes(t.name))
    finish({ name: name.trim() || 'Alejandro', avatar, templates })
  }

  return (
    <div className="onb" style={{ background: step === 0 ? 'linear-gradient(180deg, #2c2463 0%, #7c3f8f 40%, #f06b7a 75%, #ffae7a 100%)' : 'var(--bg)', transition: 'background 600ms' }}>
      <div className="row" style={{ gap: 6, marginBottom: 26 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ flex: 1, height: 4, borderRadius: 9, background: i <= step ? (step === 0 ? '#fff' : 'var(--a1)') : step === 0 ? 'rgba(255,255,255,0.3)' : 'var(--surface-3)', transition: 'background 300ms' }} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          {step === 0 && (
            <div style={{ color: '#fff', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 30 }}>
              <motion.div
                style={{ width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle at 40% 38%, #fffbe6, #ffe28a 55%, #ffb547)', filter: 'drop-shadow(0 0 40px rgba(255,200,120,0.75))', marginBottom: 40 }}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.4, ease: [0.23, 1, 0.32, 1] }}
              />
              <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.8)' }}>Bienvenido a Alba</div>
              <h1 className="onb-hero" style={{ marginTop: 10 }}>Tu vida, nivel a nivel.</h1>
              <p style={{ marginTop: 16, fontSize: 17, opacity: 0.92, maxWidth: 360 }}>
                {profile.fullName}, esto es tuyo. Un lugar para tus hábitos, tu diario, tu dinero y tu gente, convertido en un juego donde el personaje que sube de nivel eres tú.
              </p>
              <div className="stack-8" style={{ marginTop: 22, fontSize: 15 }}>
                <p>✦ Gana XP y monedas con cada paso pequeño</p>
                <p>✦ Canjéalas por recompensas que tú eliges</p>
                <p>✦ Sin castigos: un fallo no borra tu progreso</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="stack-12">
              <h1 className="onb-hero" style={{ fontSize: 36 }}>¿Cómo te llamo?</h1>
              <input className="input big" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alejandro" autoComplete="given-name" />
              <div className="eyebrow" style={{ marginTop: 14 }}>Elige tu avatar</div>
              <div className="emoji-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                {AVATARS.map((a) => (
                  <button key={a} className={cx(a === avatar && 'on')} style={{ fontSize: 30 }} onClick={() => setAvatar(a)}>
                    {a}
                  </button>
                ))}
              </div>
              <button className="btn ghost sm" onClick={() => setMore((m) => !m)}>
                {more ? 'Menos opciones' : 'Más opciones'}
              </button>
              {more && <EmojiPicker value={avatar} onChange={setAvatar} />}
            </div>
          )}

          {step === 2 && (
            <div className="stack-12" style={{ paddingBottom: 90 }}>
              <h1 className="onb-hero" style={{ fontSize: 34 }}>Elige con qué empezar</h1>
              <p className="muted">
                Menos es más: 4–7 hábitos es el punto dulce. Podrás cambiarlos siempre.
              </p>
              {areas.map((a) => {
                const list = TEMPLATES.filter((t) => t.areaId === a.id)
                return (
                  <div key={a.id}>
                    <div className="eyebrow" style={{ margin: '12px 4px 8px' }}>
                      {a.emoji} {a.name}
                    </div>
                    <div className="stack-8">
                      {list.map((t) => {
                        const on = picked.includes(t.name)
                        return (
                          <button key={t.name} className={cx('pick', on && 'on')} onClick={() => toggle(t.name)}>
                            <span className="emoji-tile">{t.emoji}</span>
                            <span className="grow">
                              <span className="bold" style={{ display: 'block' }}>
                                {t.name}
                              </span>
                              <span className="tiny muted">{TIME_OF_DAY[t.timeOfDay].label}</span>
                            </span>
                            <span className="tick">{on && <Check size={15} strokeWidth={3} />}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div style={step === 2 ? { position: 'fixed', left: 0, right: 0, bottom: 0, padding: '14px 22px calc(var(--safe-bottom) + 16px)', background: 'linear-gradient(transparent, var(--bg) 30%)' } : { marginTop: 20 }}>
        <button className="btn primary block" style={step === 0 ? { background: '#fff', color: '#2b1838' } : undefined} onClick={go} disabled={step === 2 && picked.length === 0}>
          {step === 0 ? 'Empezar mi aventura' : step === 1 ? 'Continuar' : `Empezar con ${picked.length} hábitos`} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
