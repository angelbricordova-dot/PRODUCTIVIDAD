import { useEffect, useState } from 'react'
import { Trash2, Archive } from 'lucide-react'
import { useStore } from '../store'
import type { Difficulty, Habit, Schedule, TimeOfDay } from '../store/types'
import { DIFFICULTY } from '../lib/game'
import { TEMPLATES } from '../lib/seed'
import { TIME_OF_DAY } from '../lib/habits'
import { WEEKDAYS_SHORT } from '../lib/date'
import { cx } from '../lib/util'
import { EmojiPicker, Field, Segmented, Sheet, Stepper } from './ui'

type Draft = Omit<Habit, 'id' | 'createdAt' | 'order' | 'archived'>

const blank = (areaId: string): Draft => ({
  name: '',
  emoji: '✨',
  areaId,
  timeOfDay: 'morning',
  schedule: { type: 'daily' },
  target: 1,
  difficulty: 2,
})

export function HabitEditor({ open, onClose, id }: { open: boolean; onClose: () => void; id?: string }) {
  const habits = useStore((s) => s.habits)
  const areas = useStore((s) => s.areas)
  const addHabit = useStore((s) => s.addHabit)
  const updateHabit = useStore((s) => s.updateHabit)
  const deleteHabit = useStore((s) => s.deleteHabit)
  const archiveHabit = useStore((s) => s.archiveHabit)
  const existing = habits.find((h) => h.id === id)
  const [d, setD] = useState<Draft>(blank(areas[0]?.id ?? ''))
  const [step, setStep] = useState<'pick' | 'edit'>('pick')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    if (!open) return
    setConfirmDel(false)
    setEmojiOpen(false)
    if (existing) {
      const { id: _i, createdAt: _c, order: _o, archived: _a, ...rest } = existing
      setD(rest)
      setStep('edit')
    } else {
      setD(blank(areas[0]?.id ?? ''))
      setStep('pick')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))
  const setSchedule = (s: Schedule) => set('schedule', s)

  const save = () => {
    if (!d.name.trim()) return
    const clean = { ...d, name: d.name.trim(), cue: d.cue?.trim() || undefined, why: d.why?.trim() || undefined, unit: d.unit?.trim() || undefined }
    if (existing) updateHabit(existing.id, clean)
    else addHabit(clean)
    onClose()
  }

  const usedNames = new Set(habits.map((h) => h.name))

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={existing ? 'Editar hábito' : step === 'pick' ? 'Nuevo hábito' : 'Diseña tu hábito'}
      footer={
        step === 'edit' ? (
          <button className="btn primary block" disabled={!d.name.trim()} onClick={save}>
            {existing ? 'Guardar cambios' : 'Crear hábito'}
          </button>
        ) : (
          <button className="btn soft block" onClick={() => setStep('edit')}>
            Crear desde cero
          </button>
        )
      }
    >
      {step === 'pick' ? (
        <div className="stack-12">
          <p className="muted small">Elige una plantilla y ajústala, o crea el tuyo desde cero.</p>
          {areas.map((a) => {
            const list = TEMPLATES.filter((t) => t.areaId === a.id && !usedNames.has(t.name))
            if (!list.length) return null
            return (
              <div key={a.id}>
                <div className="eyebrow" style={{ margin: '14px 4px 8px' }}>
                  {a.emoji} {a.name}
                </div>
                <div className="list">
                  {list.map((t) => (
                    <button
                      key={t.name}
                      className="list-item"
                      onClick={() => {
                        setD({
                          name: t.name,
                          emoji: t.emoji,
                          areaId: t.areaId,
                          timeOfDay: t.timeOfDay,
                          schedule: t.schedule ?? { type: 'daily' },
                          target: t.target ?? 1,
                          unit: t.unit,
                          difficulty: t.difficulty,
                          minutes: t.minutes,
                          cue: t.cue,
                          why: t.why,
                        })
                        setStep('edit')
                      }}
                    >
                      <span className="emoji-tile">{t.emoji}</span>
                      <span className="grow">
                        <span className="bold" style={{ display: 'block' }}>
                          {t.name}
                        </span>
                        <span className="tiny muted">
                          {TIME_OF_DAY[t.timeOfDay].label} · {DIFFICULTY[t.difficulty].label}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="stack-12">
          <div className="row">
            <button className="emoji-tile xl" onClick={() => setEmojiOpen((x) => !x)} aria-label="Cambiar emoji">
              {d.emoji}
            </button>
            <input className="input big grow" placeholder="Ej. Meditar 10 minutos" value={d.name} onChange={(e) => set('name', e.target.value)} autoFocus={!existing} enterKeyHint="done" />
          </div>
          {emojiOpen && <EmojiPicker value={d.emoji} onChange={(e) => set('emoji', e)} />}

          <Field label="Área de vida">
            <div className="chips wrap">
              {areas.map((a) => (
                <button key={a.id} className={cx('chip', d.areaId === a.id && 'on')} onClick={() => set('areaId', a.id)}>
                  {a.emoji} {a.name}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Momento del día">
            <div className="chips wrap">
              {(Object.keys(TIME_OF_DAY) as TimeOfDay[]).map((t) => (
                <button key={t} className={cx('chip', d.timeOfDay === t && 'on')} onClick={() => set('timeOfDay', t)}>
                  {TIME_OF_DAY[t].emoji} {TIME_OF_DAY[t].label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Frecuencia">
            <Segmented
              value={d.schedule.type}
              onChange={(v) => setSchedule(v === 'daily' ? { type: 'daily' } : v === 'days' ? { type: 'days', days: [0, 1, 2, 3, 4] } : { type: 'weekly', times: 3 })}
              options={[
                { value: 'daily', label: 'Diario' },
                { value: 'days', label: 'Días' },
                { value: 'weekly', label: 'Por semana' },
              ]}
            />
          </Field>
          {d.schedule.type === 'days' && (
            <div className="daystrip">
              {WEEKDAYS_SHORT.map((w, i) => {
                const s = d.schedule as { type: 'days'; days: number[] }
                const on = s.days.includes(i)
                return (
                  <button
                    key={w}
                    className={cx('day', on && 'on')}
                    onClick={() => {
                      const days = on ? s.days.filter((x) => x !== i) : [...s.days, i]
                      if (days.length) setSchedule({ type: 'days', days })
                    }}
                  >
                    <b>{w}</b>
                  </button>
                )
              })}
            </div>
          )}
          {d.schedule.type === 'weekly' && (
            <div className="row-between card flat pad-sm">
              <span className="bold">Veces por semana</span>
              <Stepper value={d.schedule.times} min={1} max={7} onChange={(times) => setSchedule({ type: 'weekly', times })} />
            </div>
          )}

          <div className="row-between card flat pad-sm">
            <div>
              <div className="bold">Meta diaria</div>
              <div className="tiny muted">1 = sí/no. Más de 1 = contador (vasos, páginas…)</div>
            </div>
            <Stepper value={d.target} min={1} max={99} onChange={(v) => set('target', v)} />
          </div>
          {d.target > 1 && <input className="input" placeholder="Unidad (vasos, páginas, km…)" value={d.unit ?? ''} onChange={(e) => set('unit', e.target.value)} />}

          <Field label="Dificultad (más XP cuanto más cuesta)">
            <Segmented
              value={String(d.difficulty)}
              onChange={(v) => set('difficulty', Number(v) as Difficulty)}
              options={([1, 2, 3] as Difficulty[]).map((k) => ({ value: String(k), label: `${DIFFICULTY[k].label} · ${DIFFICULTY[k].xp}` }))}
            />
          </Field>

          <div className="row-between card flat pad-sm">
            <div>
              <div className="bold">Duración</div>
              <div className="tiny muted">Para el temporizador del modo ritual</div>
            </div>
            <Stepper value={d.minutes ?? 0} min={0} max={180} step={5} suffix="′" onChange={(v) => set('minutes', v || undefined)} />
          </div>

          <Field label="Disparador · “Después de…, haré esto”">
            <input className="input" placeholder="Después de servirme el café" value={d.cue ?? ''} onChange={(e) => set('cue', e.target.value)} />
          </Field>
          <Field label="¿Por qué te importa?">
            <textarea className="textarea" rows={2} style={{ minHeight: 76 }} placeholder="Quiero tener energía para lo que amo." value={d.why ?? ''} onChange={(e) => set('why', e.target.value)} />
          </Field>

          {existing && (
            <div className="row" style={{ marginTop: 8 }}>
              <button
                className="btn soft grow"
                onClick={() => {
                  archiveHabit(existing.id, !existing.archived)
                  onClose()
                }}
              >
                <Archive size={16} /> {existing.archived ? 'Reactivar' : 'Pausar'}
              </button>
              <button
                className="btn danger grow"
                onClick={() => {
                  if (!confirmDel) return setConfirmDel(true)
                  deleteHabit(existing.id)
                  onClose()
                }}
              >
                <Trash2 size={16} /> {confirmDel ? '¿Seguro? Toca otra vez' : 'Eliminar'}
              </button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}
