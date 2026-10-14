import { useEffect, useState } from 'react'
import { useStore } from '../store'
import type { Mood } from '../store/types'
import type { DateKey } from '../lib/date'
import { MOOD_TAGS } from '../lib/seed'
import { cx } from '../lib/util'
import { Sheet } from './ui'

export const MOODS: { v: Mood['value']; face: string; label: string; color: string }[] = [
  { v: 1, face: '😣', label: 'Fatal', color: '#8b7fc7' },
  { v: 2, face: '😕', label: 'Bajo', color: '#7fa8d6' },
  { v: 3, face: '😐', label: 'Normal', color: '#b9b2a4' },
  { v: 4, face: '🙂', label: 'Bien', color: '#7cc79a' },
  { v: 5, face: '🤩', label: 'Genial', color: '#ffb547' },
]

export function MoodPicker({ value, onPick }: { value?: number; onPick: (v: Mood['value']) => void }) {
  return (
    <div className="moods">
      {MOODS.map((m) => (
        <button key={m.v} className={cx('mood', value === m.v && 'on')} onClick={() => onPick(m.v)} aria-label={m.label}>
          <span className="face">{m.face}</span>
          {m.label}
        </button>
      ))}
    </div>
  )
}

export function MoodSheet({ open, onClose, day }: { open: boolean; onClose: () => void; day: DateKey }) {
  const current = useStore((s) => s.moods[day])
  const setMood = useStore((s) => s.setMood)
  const [value, setValue] = useState<Mood['value'] | undefined>(current?.value)
  const [tags, setTags] = useState<string[]>(current?.tags ?? [])
  const [note, setNote] = useState(current?.note ?? '')

  useEffect(() => {
    if (open) {
      setValue(current?.value)
      setTags(current?.tags ?? [])
      setNote(current?.note ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const save = () => {
    if (!value) return
    setMood(day, { value, tags, note: note.trim() || undefined })
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="¿Cómo te sientes?"
      footer={
        <button className="btn primary block" disabled={!value} onClick={save}>
          Guardar
        </button>
      }
    >
      <div className="stack-12">
        <MoodPicker value={value} onPick={setValue} />
        <div className="eyebrow" style={{ marginTop: 18 }}>
          ¿Qué está influyendo?
        </div>
        <div className="chips wrap">
          {MOOD_TAGS.map((t) => (
            <button key={t} className={cx('chip', tags.includes(t) && 'on')} onClick={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}>
              {t}
            </button>
          ))}
        </div>
        <textarea className="textarea" placeholder="Una línea sobre tu día (opcional)" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
      </div>
    </Sheet>
  )
}
