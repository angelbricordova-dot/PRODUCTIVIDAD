import { useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Play, Flame, Wind, Timer, Receipt, Smile, Plus, Moon, ShieldCheck, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { useUI } from '../store/ui'
import { Sky } from '../components/Sky'
import { HabitRow } from '../components/HabitRow'
import { MoodSheet, MOODS } from '../components/MoodSheet'
import { TransactionSheet } from '../components/TransactionSheet'
import { Ring, XPBar, Coin, CountUp } from '../components/ui'
import { useCoins, useDayPart, useGlobalStreak, useLevel, useNow, useToday } from '../lib/hooks'
import { greeting, prettyDate, dayPart as partOf } from '../lib/date'
import { dayStats, isDone, showsOn, TIME_OF_DAY } from '../lib/habits'
import { questsFor } from '../lib/quests'
import { XP } from '../lib/game'
import { QUOTES, PROMPTS } from '../lib/seed'
import { seeded, cx } from '../lib/util'
import type { TimeOfDay } from '../store/types'

const ORDER: Record<string, TimeOfDay[]> = {
  dawn: ['morning', 'anytime', 'afternoon', 'evening'],
  morning: ['morning', 'anytime', 'afternoon', 'evening'],
  afternoon: ['afternoon', 'anytime', 'evening', 'morning'],
  dusk: ['evening', 'anytime', 'afternoon', 'morning'],
  night: ['evening', 'anytime', 'morning', 'afternoon'],
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.04 * i, duration: 0.5, ease: [0.23, 1, 0.32, 1] as const } }),
}

export function Today() {
  const data = useStore()
  const { profile, habits, logs, restDays, moods } = data
  const today = useToday()
  const now = useNow()
  const part = useDayPart()
  const level = useLevel()
  const coins = useCoins()
  const streak = useGlobalStreak()
  const { open, setTab } = useUI()
  const [moodOpen, setMoodOpen] = useState(false)
  const [txOpen, setTxOpen] = useState(false)

  const isRest = !!restDays[today]
  const visible = useMemo(() => habits.filter((h) => showsOn(h, today)).sort((a, b) => a.order - b.order), [habits, today])
  const stats = dayStats(habits, logs, today)
  const quests = questsFor(data, today)
  const claimed = data.quests[today] ?? []
  const rand = seeded(today)
  const quote = QUOTES[Math.floor(rand() * QUOTES.length)]
  const prompt = PROMPTS[Math.floor(rand() * PROMPTS.length)]
  const mood = moods[today]
  const remaining = stats.total - stats.done

  const groups = ORDER[part]
    .map((t) => ({ t, list: visible.filter((h) => h.timeOfDay === t) }))
    .filter((g) => g.list.length)

  const subtitle = isRest
    ? 'Hoy es día de descanso. Tus rachas están a salvo.'
    : stats.total === 0
      ? 'Empieza con un hábito pequeño. Lo pequeño se vuelve enorme.'
      : remaining === 0
        ? '¡Día perfecto! Todo hecho. Estás construyendo a tu mejor versión.'
        : stats.done === 0
          ? `Tienes ${stats.total} hábitos esperándote. Empieza por el más fácil.`
          : `Llevas ${stats.done} de ${stats.total}. ${remaining === 1 ? 'Solo te falta uno.' : `Te faltan ${remaining}.`}`

  let i = 0
  return (
    <div className="page">
      <Sky part={part} now={now}>
        <div className="sky-top">
          <span className="sky-date">{prettyDate(today)}</span>
          <button className="avatar-btn" onClick={() => setTab('yo')} aria-label="Tu perfil">
            <span className="av">{profile.avatar}</span>
            Nv. {level.level}
          </button>
        </div>
        <motion.h1 className="sky-hello" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}>
          {greeting(now)},<br />
          {profile.name}
        </motion.h1>
        <p className="sky-sub">{subtitle}</p>
      </Sky>

      {/* HUD del jugador */}
      <motion.section className="hud" initial="hidden" animate="show" custom={i++} variants={fadeUp}>
        <div className="row">
          <div className="level-badge">{level.level}</div>
          <div className="grow">
            <div className="row-between">
              <b className="display" style={{ fontSize: 17 }}>
                {level.title} {level.emoji}
              </b>
              <span className="small muted num">
                <CountUp value={level.xpInto} /> / {level.xpNeeded} XP
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <XPBar value={level.progress} />
            </div>
          </div>
        </div>
        <div className="hud-stats">
          <button className="hud-stat" onClick={() => setTab('yo')}>
            <b style={{ color: streak.current ? 'var(--warn)' : undefined }}>
              <Flame size={18} style={{ verticalAlign: '-2px', marginRight: 2 }} />
              {streak.current}
            </b>
            <span>{streak.atRisk ? '¡Recupérala hoy!' : streak.current === 1 ? 'día de racha' : 'días de racha'}</span>
          </button>
          <button className="hud-stat" onClick={() => setTab('habitos')}>
            <Ring value={stats.ratio} size={34} stroke={4}>
              <span className="bold num" style={{ fontSize: 9.5 }}>{Math.round(stats.ratio * 100)}</span>
            </Ring>
            <span>% de hoy</span>
          </button>
          <button className="hud-stat" onClick={() => open({ type: 'shop' })}>
            <b className="row" style={{ gap: 6 }}>
              <Coin lg />
              <CountUp value={coins} />
            </b>
            <span>monedas</span>
          </button>
        </div>
      </motion.section>

      {streak.atRisk && !isRest && (
        <motion.div className="card flat row" style={{ marginTop: 14, background: 'color-mix(in oklab, var(--warn) 14%, var(--surface))' }} initial="hidden" animate="show" custom={i++} variants={fadeUp}>
          <ShieldCheck size={22} color="var(--warn)" />
          <div className="grow small">
            <b>Nunca falles dos veces.</b> Ayer usaste tu comodín; completa un hábito hoy y tu racha de {streak.current} sigue viva.
          </div>
        </motion.div>
      )}

      {/* Accesos rápidos */}
      <motion.div className="chips" style={{ marginTop: 18 }} initial="hidden" animate="show" custom={i++} variants={fadeUp}>
        <button className="chip" onClick={() => setMoodOpen(true)}>
          {mood ? <span>{MOODS[mood.value - 1].face}</span> : <Smile size={16} />}
          {mood ? 'Ánimo' : '¿Cómo estás?'}
        </button>
        <button className="chip" onClick={() => open({ type: 'calm', mode: 'breath' })}>
          <Wind size={16} /> Respirar
        </button>
        <button className="chip" onClick={() => open({ type: 'calm', mode: 'focus' })}>
          <Timer size={16} /> Enfoque
        </button>
        <button className="chip" onClick={() => setTxOpen(true)}>
          <Receipt size={16} /> Gasto
        </button>
        <button className="chip" onClick={() => open({ type: 'habit' })}>
          <Plus size={16} /> Hábito
        </button>
      </motion.div>

      {/* Misiones */}
      <motion.section className="section" initial="hidden" animate="show" custom={i++} variants={fadeUp}>
        <div className="section-head">
          <h2 className="section-title">Misiones de hoy</h2>
          <span className="small muted num">{claimed.length}/3</span>
        </div>
        <div className="quests">
          {quests.map((q) => {
            const p = q.progress(data, today)
            const done = claimed.includes(q.id)
            return (
              <div key={q.id} className={cx('quest', done && 'done')}>
                <span className="q-emoji">{done ? '✅' : q.emoji}</span>
                <div className="grow">
                  <div className="q-title">{q.title}</div>
                </div>
                <span className="quest-reward">
                  {done ? '¡Hecho!' : (
                    <>
                      +{XP.quest} XP · <Coin /> {Math.round(XP.quest / 4)}
                    </>
                  )}
                </span>
                {!done && <span className="q-prog" style={{ width: `${p * 100}%` }} />}
              </div>
            )
          })}
        </div>
      </motion.section>

      {/* Rituales */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Tus rituales</h2>
          <button className="section-link" onClick={() => setTab('habitos')}>
            Editar
          </button>
        </div>

        {isRest && (
          <div className="card flat row" style={{ marginBottom: 14 }}>
            <Moon size={20} />
            <div className="grow small">Día de descanso activado. Puedes completar hábitos igual si te apetece.</div>
            <button className="btn soft sm" onClick={() => data.toggleRest(today)}>
              Quitar
            </button>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div className="e-emoji">🌱</div>
              <b>Aún no tienes hábitos</b>
              <div className="small">Los mejores cambios empiezan ridículamente pequeños.</div>
              <button className="btn primary" style={{ marginTop: 16 }} onClick={() => open({ type: 'habit' })}>
                <Plus size={18} /> Crear mi primer hábito
              </button>
            </div>
          </div>
        ) : (
          groups.map((g) => {
            const pending = g.list.filter((h) => !isDone(h, logs, today))
            const ratio = (g.list.length - pending.length) / g.list.length
            const meta = TIME_OF_DAY[g.t]
            return (
              <motion.div key={g.t} className={cx('ritual', ratio === 1 && 'complete')} initial="hidden" animate="show" custom={i++} variants={fadeUp} layout="position">
                <div className="ritual-head">
                  <Ring value={ratio} size={38} stroke={4.5}>
                    <span style={{ fontSize: 16 }}>{meta.emoji}</span>
                  </Ring>
                  <div className="grow">
                    <div className="ritual-title">{meta.ritual}</div>
                    <div className="tiny muted bold">
                      {ratio === 1 ? 'Completado ✨' : `${g.list.length - pending.length} de ${g.list.length}`}
                    </div>
                  </div>
                  {pending.length > 1 && (
                    <button className="ritual-play" onClick={() => open({ type: 'ritual', part: g.t })}>
                      <Play size={14} fill="currentColor" /> Empezar
                    </button>
                  )}
                </div>
                {g.list.map((h) => (
                  <HabitRow key={h.id} habit={h} day={today} />
                ))}
              </motion.div>
            )
          })
        )}
      </section>

      {/* Reflexión / diario */}
      <section className="section">
        <button className="card row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setTab('diario')}>
          <div className="emoji-tile lg" style={{ background: 'var(--a-soft)' }}>
            {partOf(now) === 'night' || partOf(now) === 'dusk' ? '🌙' : '✍️'}
          </div>
          <div className="grow">
            <div className="eyebrow">Diario</div>
            <div className="bold" style={{ marginTop: 2 }}>
              {prompt}
            </div>
          </div>
          <ChevronRight size={20} className="muted" />
        </button>
      </section>

      <section className="section">
        <div className="card flat">
          <p className="quote">“{quote[0]}”</p>
          <p className="small muted" style={{ marginTop: 8 }}>
            — {quote[1]}
          </p>
        </div>
        {!isRest && (
          <button className="btn ghost block" style={{ marginTop: 10 }} onClick={() => data.toggleRest(today)}>
            <Moon size={16} /> Marcar hoy como día de descanso
          </button>
        )}
      </section>

      <MoodSheet open={moodOpen} onClose={() => setMoodOpen(false)} day={today} />
      <TransactionSheet open={txOpen} onClose={() => setTxOpen(false)} />
    </div>
  )
}
