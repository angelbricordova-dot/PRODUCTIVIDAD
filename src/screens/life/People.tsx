import { useEffect, useState } from 'react'
import { Plus, Phone, MessageCircle, Users, Video, Gift, Trash2, Cake } from 'lucide-react'
import { useStore } from '../../store'
import { useToday } from '../../lib/hooks'
import { diffDays, relativeDay, MONTHS, type DateKey } from '../../lib/date'
import { uid, cx } from '../../lib/util'
import { EmojiPicker, Empty, Field, Sheet, Stepper } from '../../components/ui'
import type { InteractionType, Person, RelationKind } from '../../store/types'

const KINDS: { v: RelationKind; label: string; emoji: string; cadence: number }[] = [
  { v: 'familia', label: 'Familia', emoji: '🏡', cadence: 7 },
  { v: 'pareja', label: 'Pareja', emoji: '❤️', cadence: 1 },
  { v: 'amistad', label: 'Amistad', emoji: '🤝', cadence: 14 },
  { v: 'trabajo', label: 'Trabajo', emoji: '💼', cadence: 30 },
  { v: 'mentor', label: 'Mentor', emoji: '🦉', cadence: 30 },
  { v: 'otro', label: 'Otro', emoji: '✨', cadence: 21 },
]

const ACTIONS: { t: InteractionType; label: string; icon: typeof Phone }[] = [
  { t: 'llamada', label: 'Llamada', icon: Phone },
  { t: 'mensaje', label: 'Mensaje', icon: MessageCircle },
  { t: 'en persona', label: 'En persona', icon: Users },
  { t: 'videollamada', label: 'Video', icon: Video },
  { t: 'detalle', label: 'Detalle', icon: Gift },
]

export function lastContact(p: Person): DateKey | undefined {
  return p.interactions.reduce<DateKey | undefined>((m, i) => (!m || i.date > m ? i.date : m), undefined)
}

export function daysUntilBirthday(p: Person, today: DateKey): number | null {
  if (!p.birthday) return null
  const y = Number(today.slice(0, 4))
  let next = `${y}-${p.birthday}`
  if (next < today) next = `${y + 1}-${p.birthday}`
  return diffDays(next, today)
}

export function dueness(p: Person, today: DateKey) {
  const last = lastContact(p)
  const since = last ? diffDays(today, last) : diffDays(today, p.createdAt) + p.cadenceDays
  return { last, since, due: since >= p.cadenceDays, ratio: Math.min(1, since / p.cadenceDays) }
}

export function People() {
  const people = useStore((s) => s.people)
  const today = useToday()
  const [edit, setEdit] = useState<Person | null>(null)
  const [view, setView] = useState<string | null>(null)

  const sorted = [...people].sort((a, b) => dueness(b, today).ratio - dueness(a, today).ratio)
  const due = sorted.filter((p) => dueness(p, today).due)
  const birthdays = people
    .map((p) => ({ p, d: daysUntilBirthday(p, today) }))
    .filter((x) => x.d !== null && x.d <= 30)
    .sort((a, b) => (a.d ?? 0) - (b.d ?? 0))

  const newPerson = (): Person => ({ id: '', name: '', emoji: '🙂', kind: 'amistad', cadenceDays: 14, interactions: [], createdAt: today })

  return (
    <div>
      {people.length === 0 ? (
        <div className="card">
          <Empty emoji="💞" title="Tu gente importa">
            Añade a las personas que quieres cuidar. Alba te recordará cuándo hace tiempo que no hablan, para que ninguna relación se enfríe.
          </Empty>
          <button className="btn primary block" onClick={() => setEdit(newPerson())}>
            <Plus size={18} /> Añadir a alguien
          </button>
        </div>
      ) : (
        <>
          {due.length > 0 && (
            <section>
              <div className="section-head">
                <h2 className="section-title">Toca conectar</h2>
                <span className="small muted">+15 XP cada vez</span>
              </div>
              <div className="stack-8">
                {due.slice(0, 4).map((p) => {
                  const d = dueness(p, today)
                  return (
                    <div key={p.id} className="card pad-sm row">
                      <button className="emoji-tile lg" onClick={() => setView(p.id)}>
                        {p.emoji}
                      </button>
                      <button className="grow" style={{ textAlign: 'left' }} onClick={() => setView(p.id)}>
                        <div className="bold">{p.name}</div>
                        <div className="tiny person-due">{d.last ? `Hace ${d.since} días` : 'Aún sin registrar'}</div>
                      </button>
                      <QuickLog person={p} />
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {birthdays.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Cumpleaños cerca</h2>
              </div>
              <div className="list">
                {birthdays.map(({ p, d }) => (
                  <button key={p.id} className="list-item" onClick={() => setView(p.id)}>
                    <span className="emoji-tile">🎂</span>
                    <span className="grow bold">{p.name}</span>
                    <span className={cx('small bold', d === 0 ? 'person-ok' : 'muted')}>{d === 0 ? '¡Hoy!' : d === 1 ? 'Mañana' : `En ${d} días`}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Mi gente</h2>
              <button className="section-link" onClick={() => setEdit(newPerson())}>
                Añadir
              </button>
            </div>
            <div className="list">
              {sorted.map((p) => {
                const d = dueness(p, today)
                const kind = KINDS.find((k) => k.v === p.kind)
                return (
                  <button key={p.id} className="list-item" onClick={() => setView(p.id)}>
                    <span className="emoji-tile">{p.emoji}</span>
                    <span className="grow" style={{ minWidth: 0 }}>
                      <span className="bold ellipsis" style={{ display: 'block' }}>
                        {p.name}
                      </span>
                      <span className="tiny muted">
                        {kind?.emoji} {kind?.label} · cada {p.cadenceDays === 1 ? 'día' : `${p.cadenceDays} días`}
                      </span>
                    </span>
                    <span className={cx('tiny', d.due ? 'person-due' : 'person-ok')}>{d.last ? relativeDay(d.last, today) : '—'}</span>
                  </button>
                )
              })}
            </div>
          </section>
        </>
      )}

      {people.length > 0 && (
        <button className="fab" onClick={() => setEdit(newPerson())} aria-label="Añadir persona">
          <Plus size={26} strokeWidth={2.6} />
        </button>
      )}

      <PersonEditor person={edit} onClose={() => setEdit(null)} />
      <PersonView id={view} onClose={() => setView(null)} onEdit={(p) => { setView(null); setEdit(p) }} />
    </div>
  )
}

function QuickLog({ person }: { person: Person }) {
  const log = useStore((s) => s.logInteraction)
  const today = useToday()
  return (
    <div className="row" style={{ gap: 6 }}>
      <button className="icon-btn soft sm" aria-label="Registrar llamada" onClick={() => log(person.id, { date: today, type: 'llamada' })}>
        <Phone size={16} />
      </button>
      <button className="icon-btn soft sm" aria-label="Registrar mensaje" onClick={() => log(person.id, { date: today, type: 'mensaje' })}>
        <MessageCircle size={16} />
      </button>
    </div>
  )
}

function PersonView({ id, onClose, onEdit }: { id: string | null; onClose: () => void; onEdit: (p: Person) => void }) {
  const p = useStore((s) => s.people.find((x) => x.id === id))
  const log = useStore((s) => s.logInteraction)
  const delI = useStore((s) => s.deleteInteraction)
  const today = useToday()
  const [note, setNote] = useState('')
  useEffect(() => setNote(''), [id])
  if (!p) return <Sheet open={false} onClose={onClose}>{null}</Sheet>
  const d = dueness(p, today)
  const bday = daysUntilBirthday(p, today)
  return (
    <Sheet
      open={!!id}
      onClose={onClose}
      title={
        <span className="row">
          <span className="emoji-tile">{p.emoji}</span>
          {p.name}
        </span>
      }
      right={
        <button className="btn soft sm" onClick={() => onEdit(p)}>
          Editar
        </button>
      }
    >
      <div className="stack-12">
        <div className="grid-2">
          <div className="stat-tile">
            <span>Último contacto</span>
            <b style={{ fontSize: 20 }} className={d.due ? 'person-due' : undefined}>
              {d.last ? relativeDay(d.last, today) : 'Nunca'}
            </b>
          </div>
          <div className="stat-tile">
            <span>
              <Cake size={12} /> Cumpleaños
            </span>
            <b style={{ fontSize: 20 }}>{p.birthday ? `${Number(p.birthday.slice(3))} ${MONTHS[Number(p.birthday.slice(0, 2)) - 1].slice(0, 3)}` : '—'}</b>
            {bday !== null && bday <= 30 && <span className="tiny">{bday === 0 ? '¡Hoy!' : `en ${bday} días`}</span>}
          </div>
        </div>
        {p.notes && <div className="card flat small" style={{ whiteSpace: 'pre-wrap' }}>{p.notes}</div>}
        <div className="eyebrow">Registrar un momento</div>
        <input className="input" placeholder="¿De qué hablaron? (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {ACTIONS.map((a) => (
            <button
              key={a.t}
              className="card pad-sm center"
              style={{ padding: '10px 2px' }}
              onClick={() => {
                log(p.id, { date: today, type: a.t, note: note.trim() || undefined })
                setNote('')
              }}
            >
              <a.icon size={20} style={{ margin: '0 auto' }} />
              <div className="tiny bold" style={{ marginTop: 4 }}>
                {a.label}
              </div>
            </button>
          ))}
        </div>
        {p.interactions.length > 0 && (
          <>
            <div className="eyebrow" style={{ marginTop: 8 }}>
              Historial
            </div>
            <div className="list">
              {p.interactions.slice(0, 30).map((i) => (
                <div key={i.id} className="list-item">
                  <span className="emoji-tile" style={{ fontSize: 16 }}>
                    {{ llamada: '📞', mensaje: '💬', 'en persona': '🫂', videollamada: '🎥', detalle: '🎁' }[i.type]}
                  </span>
                  <span className="grow" style={{ minWidth: 0 }}>
                    <span className="bold" style={{ display: 'block', textTransform: 'capitalize' }}>
                      {i.type}
                    </span>
                    {i.note && <span className="small muted">{i.note}</span>}
                  </span>
                  <span className="tiny muted">{relativeDay(i.date, today)}</span>
                  <button className="icon-btn plain sm" aria-label="Borrar" onClick={() => delI(p.id, i.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Sheet>
  )
}

function PersonEditor({ person, onClose }: { person: Person | null; onClose: () => void }) {
  const upsert = useStore((s) => s.upsertPerson)
  const del = useStore((s) => s.deletePerson)
  const [p, setP] = useState<Person | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  useEffect(() => {
    setP(person)
    setEmojiOpen(false)
    setConfirm(false)
  }, [person])
  return (
    <Sheet
      open={!!person}
      onClose={onClose}
      title={person?.id ? 'Editar persona' : 'Nueva persona'}
      footer={
        <button
          className="btn primary block"
          disabled={!p?.name.trim()}
          onClick={() => {
            if (p) upsert({ ...p, id: p.id || uid(), name: p.name.trim() })
            onClose()
          }}
        >
          Guardar
        </button>
      }
    >
      {p && (
        <div className="stack-12">
          <div className="row">
            <button className="emoji-tile xl" onClick={() => setEmojiOpen((x) => !x)}>
              {p.emoji}
            </button>
            <input className="input big grow" placeholder="Nombre" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} autoComplete="off" />
          </div>
          {emojiOpen && <EmojiPicker value={p.emoji} onChange={(emoji) => setP({ ...p, emoji })} />}
          <Field label="Relación">
            <div className="chips wrap">
              {KINDS.map((k) => (
                <button key={k.v} className={cx('chip', p.kind === k.v && 'on')} onClick={() => setP({ ...p, kind: k.v, cadenceDays: p.id ? p.cadenceDays : k.cadence })}>
                  {k.emoji} {k.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="row-between card flat pad-sm">
            <div>
              <div className="bold">Quiero hablar cada…</div>
              <div className="tiny muted">días</div>
            </div>
            <Stepper value={p.cadenceDays} min={1} max={365} onChange={(cadenceDays) => setP({ ...p, cadenceDays })} />
          </div>
          <Field label="Cumpleaños">
            <input
              className="input"
              type="date"
              value={p.birthday ? `2000-${p.birthday}` : ''}
              onChange={(e) => setP({ ...p, birthday: e.target.value ? e.target.value.slice(5) : undefined })}
            />
          </Field>
          <Field label="Notas (gustos, nombres de sus hijos, temas pendientes…)">
            <textarea className="textarea" rows={3} value={p.notes ?? ''} onChange={(e) => setP({ ...p, notes: e.target.value })} />
          </Field>
          {p.id && (
            <button
              className="btn danger block"
              onClick={() => {
                if (!confirm) return setConfirm(true)
                del(p.id)
                onClose()
              }}
            >
              <Trash2 size={16} /> {confirm ? '¿Seguro? Toca otra vez' : 'Eliminar'}
            </button>
          )}
        </div>
      )}
    </Sheet>
  )
}


