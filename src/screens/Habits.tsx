import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Flame, ChevronUp, ChevronDown } from 'lucide-react'
import { useStore } from '../store'
import { useUI } from '../store/ui'
import { useToday } from '../lib/hooks'
import { habitRate, habitStreak, isDone, isScheduled, scheduleLabel, completionRate } from '../lib/habits'
import { lastNDays, WEEKDAYS_SHORT, weekdayMon } from '../lib/date'
import { cx } from '../lib/util'
import { Empty, Segmented } from '../components/ui'
import { Goals } from './Goals'
import type { Habit } from '../store/types'

export function Habits() {
  const [view, setView] = useState<'habitos' | 'metas'>('habitos')
  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">{view === 'habitos' ? 'Hábitos' : 'Metas'}</h1>
      </div>
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'habitos', label: 'Hábitos' },
          { value: 'metas', label: 'Metas' },
        ]}
      />
      <div style={{ marginTop: 18 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={view} initial={{ opacity: 0, x: view === 'metas' ? 24 : -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }}>
            {view === 'habitos' ? <HabitList /> : <Goals />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function HabitList() {
  const habits = useStore((s) => s.habits)
  const areas = useStore((s) => s.areas)
  const logs = useStore((s) => s.logs)
  const open = useUI((s) => s.open)
  const today = useToday()
  const [filter, setFilter] = useState<string>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [reorder, setReorder] = useState(false)
  const moveHabit = useStore((s) => s.moveHabit)

  const active = useMemo(() => habits.filter((h) => !h.archived).sort((a, b) => a.order - b.order), [habits])
  const archived = habits.filter((h) => h.archived)
  const list = filter === 'all' ? active : active.filter((h) => h.areaId === filter)
  const week = lastNDays(today, 7)
  const rate7 = completionRate(active, logs, week)
  const rate30 = completionRate(active, logs, lastNDays(today, 30))

  return (
    <div>
      <div className="grid-2">
        <div className="tile c-menta">
          <span>Esta semana</span>
          <b>{Math.round(rate7 * 100)}%</b>
          <div className="xpbar thin c" style={{ marginTop: 8 }}>
            <i style={{ width: `${rate7 * 100}%`, position: 'absolute' }} />
          </div>
        </div>
        <div className="tile c-cielo">
          <span>Últimos 30 días</span>
          <b>{Math.round(rate30 * 100)}%</b>
          <div className="xpbar thin c" style={{ marginTop: 8 }}>
            <i style={{ width: `${rate30 * 100}%`, position: 'absolute' }} />
          </div>
        </div>
      </div>

      <div className="chips" style={{ marginTop: 18 }}>
        <button className={cx('chip', filter === 'all' && 'on')} onClick={() => setFilter('all')}>
          Todos
        </button>
        {areas.map((a) => (
          <button key={a.id} className={cx('chip', filter === a.id && 'on')} onClick={() => setFilter(a.id)}>
            {a.emoji} {a.name}
          </button>
        ))}
      </div>

      <div className="section">
        <div className="section-head">
          <h2 className="section-title">Activos · {list.length}</h2>
          <button className="section-link" onClick={() => setReorder((r) => !r)}>
            {reorder ? 'Listo' : 'Ordenar'}
          </button>
        </div>
        {list.length === 0 ? (
          <div className="card">
            <Empty title="Nada por aquí todavía">
              Crea un hábito para esta área. Empieza tan pequeño que sea imposible fallar.
            </Empty>
          </div>
        ) : (
          <div className="list">
            <AnimatePresence initial={false}>
              {list.map((h) => (
                <motion.div key={h.id} layout transition={{ type: 'spring', stiffness: 500, damping: 40 }}>
                  <HabitLine habit={h} week={week} reorder={reorder} onMove={(d) => moveHabit(h.id, d)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {archived.length > 0 && (
        <div className="section">
          <button className="section-head" style={{ width: '100%' }} onClick={() => setShowArchived((x) => !x)}>
            <span className="section-title">En pausa ({archived.length})</span>
            <span className="section-link">{showArchived ? 'Ocultar' : 'Ver'}</span>
          </button>
          {showArchived && (
            <div className="list">
              {archived.map((h) => (
                <button key={h.id} className="list-item" onClick={() => open({ type: 'habit', id: h.id })} style={{ opacity: 0.7 }}>
                  <span className="emoji-tile">{h.emoji}</span>
                  <span className="grow bold">{h.name}</span>
                  <span className="small muted">Reactivar</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}



      <button className="fab" onClick={() => open({ type: 'habit' })} aria-label="Nuevo hábito">
        <Plus size={26} strokeWidth={2.6} />
      </button>
    </div>
  )
}

function HabitLine({ habit, week, reorder, onMove }: { habit: Habit; week: string[]; reorder: boolean; onMove: (d: -1 | 1) => void }) {
  const logs = useStore((s) => s.logs)
  const restDays = useStore((s) => s.restDays)
  const area = useStore((s) => s.areas.find((a) => a.id === habit.areaId))
  const setHabitCount = useStore((s) => s.setHabitCount)
  const open = useUI((s) => s.open)
  const today = week[week.length - 1]
  const streak = habitStreak(habit, logs, restDays, today)
  const rate = habitRate(habit, logs, lastNDays(today, 30))
  const color = area?.color ?? 'var(--a)'

  return (
    <div className="list-item" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 10 }}>
      <div className="row" style={{ width: '100%' }}>
        <button className="row grow" style={{ textAlign: 'left', minWidth: 0 }} onClick={() => open({ type: 'habitDetail', id: habit.id })}>
          <span className="emoji-tile" style={{ background: `color-mix(in oklab, ${color} 16%, var(--surface))` }}>
            {habit.emoji}
          </span>
          <span className="grow" style={{ minWidth: 0 }}>
            <span className="bold ellipsis" style={{ display: 'block' }}>
              {habit.name}
            </span>
            <span className="tiny muted bold">
              {scheduleLabel(habit)} · {Math.round(rate * 100)}% en 30 días
            </span>
          </span>
        </button>
        {reorder ? (
          <span className="row" style={{ gap: 4 }}>
            <button className="icon-btn soft sm" onClick={() => onMove(-1)} aria-label="Subir">
              <ChevronUp size={18} />
            </button>
            <button className="icon-btn soft sm" onClick={() => onMove(1)} aria-label="Bajar">
              <ChevronDown size={18} />
            </button>
          </span>
        ) : (
          streak.current > 0 && (
            <span className="row bold" style={{ gap: 2, color: 'var(--warn)', fontSize: 14 }}>
              <Flame size={15} /> {streak.current}
            </span>
          )
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, width: '100%', paddingLeft: 52 }}>
        {week.map((d) => {
          const done = isDone(habit, logs, d)
          const sched = isScheduled(habit, d) && habit.schedule.type !== 'weekly'
          return (
            <button
              key={d}
              onClick={() => setHabitCount(habit.id, d, done ? 0 : habit.target)}
              aria-label={`${d} ${done ? 'hecho' : 'pendiente'}`}
              style={{
                height: 28,
                borderRadius: 9,
                fontSize: 10.5,
                fontWeight: 800,
                background: done ? color : sched ? 'var(--surface-2)' : 'transparent',
                color: done ? '#fff' : 'var(--muted)',
                boxShadow: d === today && !done ? 'inset 0 0 0 1.5px var(--line-2)' : undefined,
                transition: 'background 200ms',
              }}
            >
              {WEEKDAYS_SHORT[weekdayMon(d)]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
