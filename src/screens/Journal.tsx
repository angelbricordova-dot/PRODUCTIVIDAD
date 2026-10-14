import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Star, Trash2, X, CalendarClock, Sparkles, Map as MapIcon } from 'lucide-react'
import { useStore } from '../store'
import { useUI } from '../store/ui'
import { useToday } from '../lib/hooks'
import { addDays, fromKey, lastNDays, prettyDate, relativeDay, startOfWeek, weekdayMon, WEEKDAYS_SHORT, type DateKey } from '../lib/date'
import { PROMPTS } from '../lib/seed'
import { seeded, cx } from '../lib/util'
import { MoodSheet, moodScore, moodSwatch } from '../components/MoodSheet'
import { MoodSlider, moodFromScore } from '../components/MoodSlider'
import { AddMedia, MediaGrid } from '../components/MediaUI'
import { Sheet } from '../components/ui'
import type { Bullet, BulletType } from '../store/types'

/** Texto que se guarda solo (con pausa) para no escribir en disco en cada tecla. */
function AutoText({
  value,
  onSave,
  placeholder,
  multiline,
  rows = 3,
}: {
  value: string
  onSave: (v: string) => void
  placeholder: string
  multiline?: boolean
  rows?: number
}) {
  const [v, setV] = useState(value)
  const t = useRef<number | null>(null)
  useEffect(() => setV(value), [value])
  const change = (nv: string) => {
    setV(nv)
    if (t.current) clearTimeout(t.current)
    t.current = window.setTimeout(() => onSave(nv), 500)
  }
  const flush = () => {
    if (t.current) clearTimeout(t.current)
    if (v !== value) onSave(v)
  }
  return multiline ? (
    <textarea className="textarea" rows={rows} placeholder={placeholder} value={v} onChange={(e) => change(e.target.value)} onBlur={flush} />
  ) : (
    <input className="input" placeholder={placeholder} value={v} onChange={(e) => change(e.target.value)} onBlur={flush} enterKeyHint="done" />
  )
}

const SIG: Record<BulletType, string> = { task: '•', event: '○', note: '–' }

export function Journal() {
  const today = useToday()
  const [day, setDay] = useState<DateKey>(today)
  const journal = useStore((s) => s.journal[day])
  const mood = useStore((s) => s.moods[day])
  const moods = useStore((s) => s.moods)
  const allJournal = useStore((s) => s.journal)
  const bullets = useStore((s) => s.bullets)
  const reviews = useStore((s) => s.reviews)
  const setJournal = useStore((s) => s.setJournal)
  const setMood = useStore((s) => s.setMood)
  const migrate = useStore((s) => s.migrateBullet)
  const addJournalMedia = useStore((s) => s.addJournalMedia)
  const removeJournalMedia = useStore((s) => s.removeJournalMedia)
  const open = useUI((s) => s.open)
  const [moodOpen, setMoodOpen] = useState(false)

  const days = lastNDays(today, 7)
  const entry = journal ?? { gratitude: [] }
  const gratitude = [0, 1, 2].map((i) => entry.gratitude[i] ?? '')
  const prompt = PROMPTS[Math.floor(seeded(`prompt:${day}`)() * PROMPTS.length)]
  const dayBullets = bullets.filter((b) => b.date === day).sort((a, b) => Number(b.priority) - Number(a.priority) || a.createdAt - b.createdAt)
  const pendingOld = bullets.filter((b) => b.date < today && b.type === 'task' && b.status === 'open')
  const week = startOfWeek(today)
  const showReview = weekdayMon(today) >= 4 || weekdayMon(today) === 0
  const reviewDone = !!reviews[week]
  const moodMonth = lastNDays(today, 30)

  const hasEntry = (d: DateKey) => !!moods[d] || !!allJournal[d] || bullets.some((b) => b.date === d)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Diario</h1>
          <p className="page-sub">
            {relativeDay(day, today) === 'Hoy' ? 'Hoy, ' : `${relativeDay(day, today)} · `}
            {prettyDate(day).toLowerCase()}
          </p>
        </div>
      </div>

      <div className="daystrip">
        {days.map((d) => (
          <button key={d} className={cx('day', d === day && 'on')} onClick={() => setDay(d)}>
            {WEEKDAYS_SHORT[weekdayMon(d)]}
            <b>{fromKey(d).getDate()}</b>
            <span className={cx('dot', hasEntry(d) && 'has')} />
          </button>
        ))}
      </div>

      {showReview && day === today && (
        <button
          className="card row section"
          style={{ width: '100%', textAlign: 'left', background: reviewDone ? 'var(--menta-soft)' : 'var(--uva-soft)' }}
          onClick={() => open({ type: 'review' })}
        >
          <span className="icon-tile" style={{ background: reviewDone ? 'var(--menta)' : 'var(--uva)', color: '#fff' }}>
            <MapIcon size={20} />
          </span>
          <div className="grow">
            <div className="ritual-title">Revisión semanal</div>
            <div className="small bold muted">{reviewDone ? '¡Hecha! Toca para releerla.' : 'Cierra la semana con intención · +60 XP'}</div>
          </div>
          <ArrowRight size={18} />
        </button>
      )}

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Intención</h2>
        </div>
        <AutoText key={`int-${day}`} value={entry.intention ?? ''} onSave={(v) => setJournal(day, { intention: v })} placeholder="Hoy elijo enfocarme en…" />
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Ánimo</h2>
          <button className="section-link" onClick={() => setMoodOpen(true)}>
            Detalles
          </button>
        </div>
        <div className="mood-card" style={{ ['--mood' as string]: moodSwatch(mood) }}>
          <MoodSlider
            key={day}
            score={moodScore(mood)}
            onCommit={(sc) => setMood(day, { value: moodFromScore(sc).value, score: sc, tags: mood?.tags ?? [], note: mood?.note })}
          />
          {mood && mood.tags.length > 0 && (
            <div className="chips wrap" style={{ marginTop: 10 }}>
              {mood.tags.map((t) => (
                <span key={t} className="pill-tag">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: 2, marginTop: 14 }} aria-label="Ánimo de los últimos 30 días">
            {moodMonth.map((d) => (
              <motion.span
                key={d}
                title={d}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.01 * moodMonth.indexOf(d), type: 'spring', stiffness: 300, damping: 20 }}
                style={{ height: 18, borderRadius: 5, transformOrigin: 'bottom', background: moodSwatch(moods[d]) ?? 'color-mix(in oklab, var(--ink) 8%, transparent)' }}
              />
            ))}
          </div>
          <div className="row-between tiny muted" style={{ marginTop: 4 }}>
            <span>hace 30 días</span>
            <span>hoy</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Momentos</h2>
          <span className="small muted">fotos y videos cortos</span>
        </div>
        <MediaGrid
          ids={entry.media ?? []}
          onDelete={(id) => removeJournalMedia(day, id)}
          add={<AddMedia purpose="moment" videos multiple onAdded={(m) => addJournalMedia(day, m)} label="Añadir" />}
        />
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Gratitud</h2>
          <span className="small muted">3 cosas · +15 XP</span>
        </div>
        <div className="stack-8">
          {gratitude.map((g, i) => (
            <div key={`${day}-${i}`} className="row">
              <span className="display" style={{ width: 22, fontSize: '1.3rem', color: 'var(--chicle)' }}>
                {i + 1}
              </span>
              <div className="grow">
                <AutoText
                  value={g}
                  onSave={(v) => {
                    const cur = useStore.getState().journal[day]?.gratitude ?? []
                    const next = [0, 1, 2].map((k) => cur[k] ?? '')
                    next[i] = v
                    setJournal(day, { gratitude: next })
                  }}
                  placeholder={['Algo pequeño que disfruté…', 'Alguien que me ayudó…', 'Algo de mí que valoro…'][i]}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Bitácora</h2>
          <span className="small muted">• tarea ○ evento – nota</span>
        </div>
        {pendingOld.length > 0 && day === today && (
          <div className="card row" style={{ marginBottom: 10 }}>
            <CalendarClock size={20} />
            <div className="grow small">
              <b>{pendingOld.length} tareas abiertas</b> de días anteriores. ¿Las migras a hoy?
            </div>
            <button className="btn sm" onClick={() => pendingOld.forEach((b) => migrate(b.id, today))}>
              Migrar
            </button>
          </div>
        )}
        <div className="card">
          <BulletList day={day} list={dayBullets} today={today} />
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Reflexión</h2>
          <span className="small muted">+20 XP</span>
        </div>
        <div className="card" style={{ marginBottom: 10, background: 'var(--uva-soft)' }}>
          <div className="row">
            <Sparkles size={18} color="var(--uva)" />
            <span className="quote">
              {prompt}
            </span>
          </div>
        </div>
        <div className="stack-8">
          <AutoText key={`ref-${day}`} multiline rows={5} value={entry.reflection ?? ''} onSave={(v) => setJournal(day, { reflection: v })} placeholder="Escribe sin filtro. Nadie más lo va a leer." />
          <AutoText key={`hl-${day}`} value={entry.highlight ?? ''} onSave={(v) => setJournal(day, { highlight: v })} placeholder="El mejor momento del día" />
          <AutoText key={`ls-${day}`} value={entry.lesson ?? ''} onSave={(v) => setJournal(day, { lesson: v })} placeholder="Una lección que me llevo" />
        </div>
      </section>

      <MoodSheet open={moodOpen} onClose={() => setMoodOpen(false)} day={day} />
    </div>
  )
}

function BulletList({ day, list, today }: { day: DateKey; list: Bullet[]; today: DateKey }) {
  const add = useStore((s) => s.addBullet)
  const cycle = useStore((s) => s.cycleBullet)
  const update = useStore((s) => s.updateBullet)
  const migrate = useStore((s) => s.migrateBullet)
  const del = useStore((s) => s.deleteBullet)
  const [text, setText] = useState('')
  const [type, setType] = useState<BulletType>('task')
  const [sel, setSel] = useState<string | null>(null)

  const submit = () => {
    const raw = text.trim()
    if (!raw) return
    const priority = raw.startsWith('*') || raw.startsWith('!')
    add({ date: day, type, text: priority ? raw.slice(1).trim() : raw, priority })
    setText('')
  }

  const done = useMemo(() => list.filter((b) => b.status === 'done').length, [list])
  const tasks = list.filter((b) => b.type === 'task').length

  return (
    <div>
      {list.length === 0 && <p className="muted small" style={{ padding: '4px 2px 8px' }}>Registro rápido: escribe en frases cortas. Empieza con * para marcar prioridad.</p>}
      <AnimatePresence initial={false}>
        {list.map((b) => (
          <motion.div key={b.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
            <div className={cx('bullet', b.status)}>
              <button className="sig" onClick={() => (b.type === 'task' && b.status !== 'migrated' ? cycle(b.id) : setSel(sel === b.id ? null : b.id))} aria-label="Cambiar estado">
                {b.type === 'task' && b.status === 'done' ? '×' : b.status === 'migrated' ? '>' : SIG[b.type]}
              </button>
              <button className="b-text" style={{ textAlign: 'left' }} onClick={() => setSel(sel === b.id ? null : b.id)}>
                {b.priority && <span className="prio">✱ </span>}
                {b.text}
              </button>
            </div>
            <AnimatePresence>
              {sel === b.id && (
                <motion.div className="chips wrap" style={{ padding: '0 0 10px 36px' }} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <button className="chip" onClick={() => update(b.id, { priority: !b.priority })}>
                    <Star size={14} /> {b.priority ? 'Quitar prioridad' : 'Prioridad'}
                  </button>
                  {b.type === 'task' && b.status === 'open' && (
                    <button className="chip" onClick={() => { migrate(b.id, day === today ? addDays(today, 1) : today); setSel(null) }}>
                      <ArrowRight size={14} /> {day === today ? 'A mañana' : 'A hoy'}
                    </button>
                  )}
                  {b.type === 'task' && b.status === 'open' && (
                    <button className="chip" onClick={() => update(b.id, { status: 'cancelled' })}>
                      <X size={14} /> Ya no importa
                    </button>
                  )}
                  <button className="chip" style={{ color: 'var(--bad)' }} onClick={() => del(b.id)}>
                    <Trash2 size={14} /> Borrar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="bullet-input">
        <div className="type-pick" role="radiogroup" aria-label="Tipo">
          {(Object.keys(SIG) as BulletType[]).map((t) => (
            <button key={t} className={cx(type === t && 'on')} onClick={() => setType(t)} aria-label={t}>
              {SIG[t]}
            </button>
          ))}
        </div>
        <input
          className="input grow"
          placeholder={type === 'task' ? 'Nueva tarea…' : type === 'event' ? 'Algo que pasó…' : 'Una idea, una nota…'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          enterKeyHint="send"
        />
      </div>
      {tasks > 0 && <p className="tiny muted" style={{ marginTop: 8 }}>{done}/{tasks} tareas hechas</p>}
    </div>
  )
}

export function ReviewSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const today = useToday()
  const week = startOfWeek(today)
  const existing = useStore((s) => s.reviews[week])
  const save = useStore((s) => s.saveReview)
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [wins, setWins] = useState(existing?.wins ?? '')
  const [lessons, setLessons] = useState(existing?.lessons ?? '')
  const [nextFocus, setNext] = useState(existing?.nextFocus ?? '')
  useEffect(() => {
    if (open) {
      setRating(existing?.rating ?? 0)
      setWins(existing?.wins ?? '')
      setLessons(existing?.lessons ?? '')
      setNext(existing?.nextFocus ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Revisión semanal"
      footer={
        <button
          className="btn primary block"
          disabled={!rating}
          onClick={() => {
            save(week, { rating, wins, lessons, nextFocus })
            onClose()
          }}
        >
          Guardar revisión
        </button>
      }
    >
      <div className="stack-12">
        <p className="muted small">Cinco minutos para mirar atrás y elegir hacia dónde ir. Es el hábito que alimenta a todos los demás.</p>
        <div className="label-title">¿Cómo fue tu semana?</div>
        <div className="row" style={{ justifyContent: 'center', gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.button key={n} whileTap={{ scale: 0.85 }} onClick={() => setRating(n)} aria-label={`${n} estrellas`}>
              <Star size={38} fill={n <= rating ? 'var(--gold)' : 'none'} color={n <= rating ? 'var(--gold)' : 'var(--faint)'} />
            </motion.button>
          ))}
        </div>
        <label className="field">
          <span>🏆 Mis victorias</span>
          <textarea className="textarea" rows={3} value={wins} onChange={(e) => setWins(e.target.value)} placeholder="Lo que salió bien, por pequeño que sea" />
        </label>
        <label className="field">
          <span>🧭 Qué aprendí / qué cambiaría</span>
          <textarea className="textarea" rows={3} value={lessons} onChange={(e) => setLessons(e.target.value)} placeholder="Sin juzgarte: solo observa" />
        </label>
        <label className="field">
          <span>🎯 Mi foco para la próxima semana</span>
          <textarea className="textarea" rows={2} value={nextFocus} onChange={(e) => setNext(e.target.value)} placeholder="Una sola cosa que haría que la semana valga la pena" />
        </label>
      </div>
    </Sheet>
  )
}
