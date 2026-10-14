import { Pencil, Flame, Trophy, Target, CheckCheck } from 'lucide-react'
import { useStore } from '../store'
import { useUI } from '../store/ui'
import { useToday } from '../lib/hooks'
import { habitRate, habitStreak, isDone, isScheduled, scheduleLabel, TIME_OF_DAY, countOn } from '../lib/habits'
import { lastNDays, WEEKDAYS_SHORT, weekdayMon, fromKey } from '../lib/date'
import { DIFFICULTY } from '../lib/game'
import { cx } from '../lib/util'
import { Sheet } from './ui'
import { Heatmap } from './charts'
import { AddMedia, MediaGrid } from './MediaUI'

export function HabitDetail({ open, onClose, id }: { open: boolean; onClose: () => void; id?: string }) {
  const habit = useStore((s) => s.habits.find((h) => h.id === id))
  const logs = useStore((s) => s.logs)
  const restDays = useStore((s) => s.restDays)
  const area = useStore((s) => s.areas.find((a) => a.id === habit?.areaId))
  const setHabitCount = useStore((s) => s.setHabitCount)
  const habitPhotos = useStore((s) => s.habitPhotos)
  const addHabitPhoto = useStore((s) => s.addHabitPhoto)
  const removeHabitPhoto = useStore((s) => s.removeHabitPhoto)
  const openOverlay = useUI((s) => s.open)
  const today = useToday()

  if (!habit) return <Sheet open={false} onClose={onClose}>{null}</Sheet>

  const streak = habitStreak(habit, logs, restDays, today)
  const rate30 = habitRate(habit, logs, lastNDays(today, 30))
  const total = Object.values(logs).filter((d) => (d[habit.id] ?? 0) >= habit.target).length
  const color = area?.color ?? 'var(--a)'
  const todayPhotos = habitPhotos[`${habit.id}:${today}`] ?? []
  const olderPhotos = Object.entries(habitPhotos)
    .filter(([k]) => k.startsWith(`${habit.id}:`) && k !== `${habit.id}:${today}`)
    .sort(([a], [b]) => b.localeCompare(a))
    .flatMap(([k, ids]) => ids.map((id) => ({ id, day: k.split(':')[1] })))
    .slice(0, 12)
  const week = lastNDays(today, 7)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <span className="row">
          <span className="emoji-tile" style={{ background: `color-mix(in oklab, ${color} 18%, var(--surface))` }}>
            {habit.emoji}
          </span>
          <span className="ellipsis" style={{ fontSize: 20 }}>
            {habit.name}
          </span>
        </span>
      }
      right={
        <button className="icon-btn soft sm" aria-label="Editar" onClick={() => openOverlay({ type: 'habit', id: habit.id })}>
          <Pencil size={16} />
        </button>
      }
    >
      <div className="stack-12">
        <div className="chips wrap">
          <span className="pill-tag">{area ? `${area.emoji} ${area.name}` : 'Sin área'}</span>
          <span className="pill-tag">{TIME_OF_DAY[habit.timeOfDay].emoji} {TIME_OF_DAY[habit.timeOfDay].label}</span>
          <span className="pill-tag">{scheduleLabel(habit)}</span>
          <span className="pill-tag">{DIFFICULTY[habit.difficulty].label} · {DIFFICULTY[habit.difficulty].xp} XP</span>
        </div>

        <div className="grid-2">
          <div className="stat-tile">
            <span><Flame size={13} /> Racha actual</span>
            <b style={{ color: 'var(--warn)' }}>{streak.current}</b>
          </div>
          <div className="stat-tile">
            <span><Trophy size={13} /> Mejor racha</span>
            <b>{streak.best}</b>
          </div>
          <div className="stat-tile">
            <span><Target size={13} /> Últimos 30 días</span>
            <b>{Math.round(rate30 * 100)}%</b>
          </div>
          <div className="stat-tile">
            <span><CheckCheck size={13} /> Veces completado</span>
            <b>{total}</b>
          </div>
        </div>

        <div className="card">
          <div className="label-title" style={{ marginBottom: 10 }}>Esta semana · toca para corregir</div>
          <div className="daystrip">
            {week.map((d) => {
              const done = isDone(habit, logs, d)
              const sched = isScheduled(habit, d)
              return (
                <button
                  key={d}
                  className={cx('day', done && 'on')}
                  style={done ? { background: color } : sched ? undefined : { opacity: 0.4 }}
                  onClick={() => setHabitCount(habit.id, d, done ? 0 : habit.target)}
                >
                  {WEEKDAYS_SHORT[weekdayMon(d)]}
                  <b>{fromKey(d).getDate()}</b>
                  {habit.target > 1 && !done && <span className="tiny num">{countOn(logs, habit.id, d)}</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="label-title">Prueba de hoy</div>
          <p className="small muted" style={{ marginBottom: 10 }}>Una foto de tu comida, del gimnasio, de la página que leíste… +5 XP.</p>
          <MediaGrid
            ids={todayPhotos}
            onDelete={(mid) => removeHabitPhoto(habit.id, today, mid)}
            add={<AddMedia purpose="proof" onAdded={(m) => addHabitPhoto(habit.id, today, m)} label="Foto" />}
          />
          {olderPhotos.length > 0 && (
            <>
              <div className="label-title" style={{ marginTop: 14 }}>Fotos anteriores</div>
              <MediaGrid ids={olderPhotos.map((x) => x.id)} onDelete={(mid) => { const o = olderPhotos.find((x) => x.id === mid); if (o) removeHabitPhoto(habit.id, o.day, mid) }} />
            </>
          )}
        </div>

        <div className="card">
          <div className="label-title" style={{ marginBottom: 12 }}>Historial</div>
          <Heatmap
            today={today}
            weeks={20}
            color={color}
            value={(d) => (d < habit.createdAt ? null : Math.min(1, countOn(logs, habit.id, d) / habit.target))}
          />
        </div>

        {(habit.cue || habit.why) && (
          <div className="card flat stack-8">
            {habit.cue && (
              <p>
                <b>Disparador</b>
                <br />
                {habit.cue}, haré: <b>{habit.name.toLowerCase()}</b>.
              </p>
            )}
            {habit.why && (
              <p>
                <b>Mi porqué</b>
                <br />
                <span className="quote">{habit.why}</span>
              </p>
            )}
          </div>
        )}
        <p className="tiny muted center" style={{ padding: '0 12px' }}>
          Regla “nunca falles dos veces”: un fallo cada 7 días no rompe tu racha. Dos seguidos, sí.
        </p>
      </div>
    </Sheet>
  )
}
