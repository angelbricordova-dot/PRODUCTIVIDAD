import { useMemo, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { Play, Flame, Wind, Timer, Plus, Moon, ShieldCheck, ChevronRight, ChevronDown, Sunrise, Sun, Sparkles, PenLine, Check } from 'lucide-react'
import { useStore } from '../store'
import { useUI } from '../store/ui'
import { Sky } from '../components/Sky'
import { HabitRow } from '../components/HabitRow'
import { MoodSheet, moodScore } from '../components/MoodSheet'
import { MoodSlider, moodFromScore } from '../components/MoodSlider'
import { moodColor } from '../components/Alba'
import { XPBar, Coin, CountUp } from '../components/ui'
import { Avatar } from '../components/MediaUI'
import { useCoins, useDayPart, useGlobalStreak, useLevel, useNow, useToday } from '../lib/hooks'
import { greeting, prettyDate } from '../lib/date'
import { dayStats, isDone, showsOn, TIME_OF_DAY } from '../lib/habits'
import { questsFor } from '../lib/quests'
import { XP } from '../lib/game'
import { PROMPTS } from '../lib/seed'
import { seeded, cx } from '../lib/util'
import type { TimeOfDay } from '../store/types'

const ORDER: Record<string, TimeOfDay[]> = {
  dawn: ['morning', 'anytime', 'afternoon', 'evening'],
  morning: ['morning', 'anytime', 'afternoon', 'evening'],
  afternoon: ['afternoon', 'anytime', 'evening', 'morning'],
  dusk: ['evening', 'anytime', 'afternoon', 'morning'],
  night: ['evening', 'anytime', 'morning', 'afternoon'],
}

export const RITUAL_STYLE: Record<TimeOfDay, { color: string; icon: typeof Sun }> = {
  morning: { color: 'mandarina', icon: Sunrise },
  afternoon: { color: 'girasol', icon: Sun },
  evening: { color: 'uva', icon: Moon },
  anytime: { color: 'cielo', icon: Sparkles },
}

const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.05 * i, type: 'spring', stiffness: 260, damping: 24 } }),
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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const isRest = !!restDays[today]
  const visible = useMemo(() => habits.filter((h) => showsOn(h, today)).sort((a, b) => a.order - b.order), [habits, today])
  const stats = dayStats(habits, logs, today)
  const quests = questsFor(data, today)
  const claimed = data.quests[today] ?? []
  const prompt = PROMPTS[Math.floor(seeded(today)() * PROMPTS.length)]
  const mood = moods[today]
  const remaining = stats.total - stats.done
  const night = part === 'night' || part === 'dusk'

  const groups = ORDER[part].map((t) => ({ t, list: visible.filter((h) => h.timeOfDay === t) })).filter((g) => g.list.length)

  const subtitle = isRest
    ? 'Hoy toca descansar. Tus rachas están a salvo.'
    : stats.total === 0
      ? 'Empieza con algo pequeño. Lo pequeño se vuelve enorme.'
      : remaining === 0
        ? '¡Día perfecto! Lo hiciste todo.'
        : stats.done === 0
          ? `${stats.total} hábitos te esperan. Empieza por el más fácil.`
          : remaining === 1
            ? 'Solo te falta uno. ¡Vamos!'
            : `Vas ${stats.done} de ${stats.total}. Sigue así.`

  let i = 0
  return (
    <div className="page">
      <Sky part={part} now={now} joy={isRest ? 0.7 : 0.45 + stats.ratio * 0.55}>
        <div className="sky-top">
          <span className="sky-date">{prettyDate(today)}</span>
          <button className="avatar-btn" onClick={() => setTab('yo')} aria-label="Tu perfil">
            <Avatar size={32} />
            Nivel {level.level}
          </button>
        </div>
        <motion.h1 className="sky-hello" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
          {greeting(now)}, {profile.name}
        </motion.h1>
        <p className="sky-sub">{subtitle}</p>
      </Sky>

      {/* Racha, monedas y nivel: tres bloques de color que se pueden tocar */}
      <motion.div className="stat-row" initial="hidden" animate="show" custom={i++} variants={rise}>
        <button className="stat-blob c-mandarina" onClick={() => setTab('yo')}>
          <span className="sb-icon">
            <Flame size={18} strokeWidth={2.6} />
          </span>
          <b>{streak.current}</b>
          <span>{streak.atRisk ? '¡Recupérala!' : streak.current === 1 ? 'día seguido' : 'días seguidos'}</span>
        </button>
        <button className="stat-blob c-girasol" onClick={() => open({ type: 'shop' })}>
          <span className="sb-icon">
            <Coin />
          </span>
          <b>
            <CountUp value={coins} />
          </b>
          <span>monedas</span>
        </button>
        <button className="stat-blob c-cielo" onClick={() => setTab('yo')}>
          <span className="sb-icon display" style={{ fontSize: '1rem' }}>
            {level.level}
          </span>
          <b style={{ fontSize: 'calc(1.05rem * var(--display-scale))' }}>{level.title}</b>
          <XPBar value={level.progress} thin colored />
          <span className="num">
            {level.xpInto}/{level.xpNeeded} XP
          </span>
        </button>
      </motion.div>

      {streak.atRisk && !isRest && (
        <motion.div className="card row c-mandarina" style={{ marginTop: 12, background: 'var(--c-soft)' }} initial="hidden" animate="show" custom={i++} variants={rise}>
          <ShieldCheck size={22} color="var(--mandarina)" />
          <p className="grow small">
            <b>Nunca falles dos veces.</b> Ayer usaste tu comodín. Completa un hábito hoy y tu racha de {streak.current} sigue viva.
          </p>
        </motion.div>
      )}

      {/* Ánimo con el deslizador */}
      <motion.section
        className="section mood-card"
        style={{ ['--mood' as string]: mood ? moodColor((moodScore(mood) ?? 50) / 100) : undefined }}
        initial="hidden"
        animate="show"
        custom={i++}
        variants={rise}
      >
        <MoodSlider
          compact
          score={moodScore(mood)}
          onCommit={(s) => data.setMood(today, { value: moodFromScore(s).value, score: s, tags: mood?.tags ?? [], note: mood?.note })}
        />
        <button className="section-link" style={{ marginTop: 4 }} onClick={() => setMoodOpen(true)}>
          {mood?.tags.length ? `${mood.tags.join(' · ')} · editar` : '¿Qué influye? Añadir detalles'}
        </button>
      </motion.section>

      {/* Rituales */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Tus rituales</h2>
          <button className="section-link" onClick={() => open({ type: 'habit' })}>
            <Plus size={14} style={{ verticalAlign: '-2px' }} /> Hábito
          </button>
        </div>

        {isRest && (
          <div className="card row" style={{ marginBottom: 12 }}>
            <Moon size={20} />
            <p className="grow small">Día de descanso activado. Puedes completar hábitos igual si te apetece.</p>
            <button className="btn soft sm" onClick={() => data.toggleRest(today)}>
              Quitar
            </button>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="card center">
            <div className="empty" style={{ paddingTop: 6 }}>
              <b>Aún no tienes hábitos</b>
              <div className="small">Los grandes cambios empiezan ridículamente pequeños.</div>
            </div>
            <button className="btn primary" style={{ marginTop: 6 }} onClick={() => open({ type: 'habit' })}>
              <Plus size={18} /> Crear mi primer hábito
            </button>
          </div>
        ) : (
          groups.map((g, gi) => {
            const pending = g.list.filter((h) => !isDone(h, logs, today))
            const ratio = (g.list.length - pending.length) / g.list.length
            const meta = TIME_OF_DAY[g.t]
            const style = RITUAL_STYLE[g.t]
            const isCollapsed = collapsed[g.t] ?? (gi > 0 && ratio === 1)
            const Icon = style.icon
            return (
              <motion.div key={g.t} className={cx('ritual', `c-${style.color}`, isCollapsed && 'collapsed')} initial="hidden" animate="show" custom={i++} variants={rise} layout="position">
                <div className="ritual-head">
                  <button className="row grow" style={{ textAlign: 'left' }} onClick={() => setCollapsed((c) => ({ ...c, [g.t]: !isCollapsed }))} aria-expanded={!isCollapsed}>
                    <span className="icon-tile">{ratio === 1 ? <Check size={20} strokeWidth={3} /> : <Icon size={20} strokeWidth={2.4} />}</span>
                    <span className="grow">
                      <span className="ritual-title" style={{ display: 'block' }}>
                        {meta.ritual}
                      </span>
                      <span className="ritual-meta">{ratio === 1 ? '¡Completado!' : `${g.list.length - pending.length} de ${g.list.length}`}</span>
                    </span>
                    <motion.span animate={{ rotate: isCollapsed ? -90 : 0 }} className="muted">
                      <ChevronDown size={18} />
                    </motion.span>
                  </button>
                  {pending.length > 1 && !isCollapsed && (
                    <button className="ritual-play" onClick={() => open({ type: 'ritual', part: g.t })}>
                      <Play size={13} fill="currentColor" /> Guiado
                    </button>
                  )}
                </div>
                <div className="ritual-bar">
                  <i style={{ width: `${ratio * 100}%` }} />
                </div>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 32 }} style={{ overflow: 'hidden' }}>
                      {g.list.map((h) => (
                        <HabitRow key={h.id} habit={h} day={today} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </section>

      {/* Misiones */}
      <motion.section className="section" initial="hidden" animate="show" custom={i++} variants={rise}>
        <div className="section-head">
          <h2 className="section-title">Misiones de hoy</h2>
          <span className="small muted bold num">{claimed.length} de 3</span>
        </div>
        <div className="quests">
          {quests.map((q) => {
            const p = q.progress(data, today)
            const done = claimed.includes(q.id)
            const Icon = q.icon
            return (
              <motion.div key={q.id} className={cx('quest', `c-${q.color}`, done && 'done')} layout>
                <span className="q-icon">{done ? <Check size={18} strokeWidth={3} /> : <Icon size={18} strokeWidth={2.4} />}</span>
                <span className="q-title">{q.title}</span>
                <span className="q-foot">
                  {done ? '¡Hecha!' : (
                    <>
                      <Coin /> {Math.round(XP.quest / 4)} · {XP.quest} XP
                    </>
                  )}
                </span>
                {!done && <span className="q-prog" style={{ width: `${p * 100}%` }} />}
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* Calma y diario */}
      <section className="section grid-2">
        <button className="card row c-cielo" style={{ textAlign: 'left', padding: 14 }} onClick={() => open({ type: 'calm', mode: 'breath' })}>
          <span className="icon-tile" style={{ background: 'var(--c-soft)', color: 'var(--c)' }}>
            <Wind size={20} />
          </span>
          <span className="bold">Respirar</span>
        </button>
        <button className="card row c-mandarina" style={{ textAlign: 'left', padding: 14 }} onClick={() => open({ type: 'calm', mode: 'focus' })}>
          <span className="icon-tile" style={{ background: 'var(--c-soft)', color: 'var(--c)' }}>
            <Timer size={20} />
          </span>
          <span className="bold">Enfoque</span>
        </button>
      </section>

      <section className="section">
        <button className="card row c-uva" style={{ width: '100%', textAlign: 'left' }} onClick={() => setTab('diario')}>
          <span className="icon-tile" style={{ background: 'var(--c-soft)', color: 'var(--c)' }}>
            {night ? <Moon size={20} /> : <PenLine size={20} />}
          </span>
          <span className="grow">
            <span className="quote" style={{ display: 'block' }}>
              {prompt}
            </span>
            <span className="small muted bold">Responder en tu diario</span>
          </span>
          <ChevronRight size={20} className="muted" />
        </button>
        {!isRest && (
          <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => data.toggleRest(today)}>
            <Moon size={16} /> Hoy es día de descanso
          </button>
        )}
      </section>

      <MoodSheet open={moodOpen} onClose={() => setMoodOpen(false)} day={today} />
    </div>
  )
}
