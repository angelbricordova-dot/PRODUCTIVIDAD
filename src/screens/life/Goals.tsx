import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Check, Trash2, Trophy, CalendarDays } from 'lucide-react'
import { useStore } from '../../store'
import { useToday } from '../../lib/hooks'
import { diffDays, shortDate } from '../../lib/date'
import { uid, cx } from '../../lib/util'
import { EmojiPicker, Empty, Field, Ring, Sheet } from '../../components/ui'
import type { Goal } from '../../store/types'

export function Goals() {
  const goals = useStore((s) => s.goals)
  const areas = useStore((s) => s.areas)
  const toggle = useStore((s) => s.toggleMilestone)
  const complete = useStore((s) => s.completeGoal)
  const upsert = useStore((s) => s.upsertGoal)
  const today = useToday()
  const [edit, setEdit] = useState<Goal | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newMs, setNewMs] = useState('')

  const active = goals.filter((g) => !g.done)
  const done = goals.filter((g) => g.done)
  const fresh = (): Goal => ({ id: '', title: '', emoji: '🏔️', areaId: areas[0]?.id ?? '', milestones: [], done: false, createdAt: today })

  return (
    <div>
      {goals.length === 0 ? (
        <div className="card">
          <Empty emoji="🏔️" title="Metas grandes, pasos pequeños">
            Define a dónde quieres llegar y divídelo en hitos. Cada hito da +40 XP; cumplir la meta, +200.
          </Empty>
          <button className="btn primary block" onClick={() => setEdit(fresh())}>
            <Plus size={18} /> Crear una meta
          </button>
        </div>
      ) : (
        <div className="stack-12">
          {active.map((g) => {
            const total = g.milestones.length
            const n = g.milestones.filter((m) => m.done).length
            const p = total ? n / total : 0
            const area = areas.find((a) => a.id === g.areaId)
            const left = g.deadline ? diffDays(g.deadline, today) : null
            const isOpen = expanded === g.id
            return (
              <motion.div key={g.id} layout className="goal-card">
                <button className="row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setExpanded(isOpen ? null : g.id)}>
                  <Ring value={p} size={56} stroke={6}>
                    <span style={{ fontSize: 22 }}>{g.emoji}</span>
                  </Ring>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="bold" style={{ fontSize: 16.5 }}>
                      {g.title}
                    </div>
                    <div className="tiny muted bold">
                      {area ? `${area.emoji} ${area.name} · ` : ''}
                      {total ? `${n}/${total} hitos` : 'Sin hitos aún'}
                      {left !== null && (
                        <span style={{ color: left < 0 ? 'var(--bad)' : left < 14 ? 'var(--warn)' : undefined }}>
                          {' · '}
                          <CalendarDays size={11} style={{ verticalAlign: '-1px' }} /> {left < 0 ? `venció hace ${-left} d` : left === 0 ? 'vence hoy' : `quedan ${left} d`}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      {g.why && <p className="quote" style={{ fontSize: 15, margin: '12px 0 4px' }}>“{g.why}”</p>}
                      <div style={{ marginTop: 8 }}>
                        {g.milestones.map((m) => (
                          <button key={m.id} className={cx('milestone', m.done && 'done')} onClick={() => toggle(g.id, m.id)}>
                            <span className="box">{m.done && <Check size={15} strokeWidth={3} />}</span>
                            <span>{m.text}</span>
                          </button>
                        ))}
                      </div>
                      <div className="row" style={{ marginTop: 6 }}>
                        <input
                          className="input grow"
                          style={{ minHeight: 44, padding: '10px 14px' }}
                          placeholder="Añadir hito…"
                          value={newMs}
                          onChange={(e) => setNewMs(e.target.value)}
                          enterKeyHint="done"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newMs.trim()) {
                              upsert({ ...g, milestones: [...g.milestones, { id: uid(), text: newMs.trim(), done: false }] })
                              setNewMs('')
                            }
                          }}
                        />
                      </div>
                      <div className="row" style={{ marginTop: 12 }}>
                        <button className="btn soft sm grow" onClick={() => setEdit(g)}>
                          Editar
                        </button>
                        <button className="btn primary sm grow" onClick={() => complete(g.id, true)}>
                          <Trophy size={15} /> ¡La cumplí!
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
          {done.length > 0 && (
            <>
              <div className="eyebrow" style={{ margin: '16px 4px 0' }}>
                Cumplidas · {done.length}
              </div>
              <div className="list">
                {done.map((g) => (
                  <button key={g.id} className="list-item" onClick={() => complete(g.id, false)} title="Toca para reabrir">
                    <span className="emoji-tile">{g.emoji}</span>
                    <span className="grow bold">{g.title}</span>
                    <span className="tiny muted">{g.doneAt ? shortDate(g.doneAt) : ''} 🏆</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {goals.length > 0 && (
        <button className="fab" onClick={() => setEdit(fresh())} aria-label="Nueva meta">
          <Plus size={26} strokeWidth={2.6} />
        </button>
      )}
      <GoalEditor goal={edit} onClose={() => setEdit(null)} />
    </div>
  )
}

function GoalEditor({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const upsert = useStore((s) => s.upsertGoal)
  const del = useStore((s) => s.deleteGoal)
  const areas = useStore((s) => s.areas)
  const [g, setG] = useState<Goal | null>(null)
  const [ms, setMs] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  useEffect(() => {
    setG(goal)
    setMs('')
    setEmojiOpen(false)
  }, [goal])
  const addMs = () => {
    if (!g || !ms.trim()) return
    setG({ ...g, milestones: [...g.milestones, { id: uid(), text: ms.trim(), done: false }] })
    setMs('')
  }
  return (
    <Sheet
      open={!!goal}
      onClose={onClose}
      title={goal?.id ? 'Editar meta' : 'Nueva meta'}
      footer={
        <button
          className="btn primary block"
          disabled={!g?.title.trim()}
          onClick={() => {
            if (g) upsert({ ...g, id: g.id || uid(), title: g.title.trim() })
            onClose()
          }}
        >
          Guardar meta
        </button>
      }
    >
      {g && (
        <div className="stack-12">
          <div className="row">
            <button className="emoji-tile xl" onClick={() => setEmojiOpen((x) => !x)}>
              {g.emoji}
            </button>
            <input className="input big grow" placeholder="Correr un medio maratón" value={g.title} onChange={(e) => setG({ ...g, title: e.target.value })} />
          </div>
          {emojiOpen && <EmojiPicker value={g.emoji} onChange={(emoji) => setG({ ...g, emoji })} />}
          <Field label="Área">
            <div className="chips wrap">
              {areas.map((a) => (
                <button key={a.id} className={cx('chip', g.areaId === a.id && 'on')} onClick={() => setG({ ...g, areaId: a.id })}>
                  {a.emoji} {a.name}
                </button>
              ))}
            </div>
          </Field>
          <Field label="¿Por qué es importante para ti?">
            <textarea className="textarea" rows={2} style={{ minHeight: 76 }} value={g.why ?? ''} onChange={(e) => setG({ ...g, why: e.target.value })} />
          </Field>
          <Field label="Fecha objetivo (opcional)">
            <input className="input" type="date" value={g.deadline ?? ''} onChange={(e) => setG({ ...g, deadline: e.target.value || undefined })} />
          </Field>
          <Field label="Hitos">
            <div className="stack-8">
              {g.milestones.map((m) => (
                <div key={m.id} className="row card flat pad-sm" style={{ padding: '8px 8px 8px 14px' }}>
                  <span className="grow">{m.text}</span>
                  <button className="icon-btn plain sm" aria-label="Quitar" onClick={() => setG({ ...g, milestones: g.milestones.filter((x) => x.id !== m.id) })}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <div className="row">
                <input className="input grow" placeholder="Ej. Correr 10 km sin parar" value={ms} onChange={(e) => setMs(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addMs()} enterKeyHint="done" />
                <button className="icon-btn soft" onClick={addMs} aria-label="Añadir hito">
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </Field>
          {g.id && (
            <button
              className="btn danger block"
              onClick={() => {
                del(g.id)
                onClose()
              }}
            >
              <Trash2 size={16} /> Eliminar meta
            </button>
          )}
        </div>
      )}
    </Sheet>
  )
}
