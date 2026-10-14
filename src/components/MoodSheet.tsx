import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import type { DateKey } from '../lib/date'
import { MOOD_TAGS } from '../lib/seed'
import { cx } from '../lib/util'
import { Sheet } from './ui'
import { MoodSlider, moodFromScore, scoreFromValue } from './MoodSlider'
import { moodColor } from './Alba'

export function moodScore(m: { value: number; score?: number } | undefined) {
  if (!m) return undefined
  return m.score ?? scoreFromValue(m.value as 1 | 2 | 3 | 4 | 5)
}

export function moodSwatch(m: { value: number; score?: number } | undefined) {
  const s = moodScore(m)
  return s === undefined ? undefined : moodColor(s / 100)
}

export function MoodSheet({ open, onClose, day }: { open: boolean; onClose: () => void; day: DateKey }) {
  const current = useStore((s) => s.moods[day])
  const setMood = useStore((s) => s.setMood)
  const [score, setScore] = useState<number | undefined>(moodScore(current))
  const [tags, setTags] = useState<string[]>(current?.tags ?? [])
  const [note, setNote] = useState(current?.note ?? '')

  useEffect(() => {
    if (open) {
      setScore(moodScore(current))
      setTags(current?.tags ?? [])
      setNote(current?.note ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const save = () => {
    if (score === undefined) return
    setMood(day, { value: moodFromScore(score).value, score, tags, note: note.trim() || undefined })
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Tu ánimo"
      footer={
        <button className="btn primary block" disabled={score === undefined} onClick={save}>
          Guardar
        </button>
      }
    >
      <div className="stack-16">
        <MoodSlider score={score} onCommit={setScore} />
        <div>
          <h3 className="label-title">¿Qué está influyendo?</h3>
          <div className="chips wrap">
            {MOOD_TAGS.map((t, i) => {
              const on = tags.includes(t)
              return (
                <motion.button
                  key={t}
                  className={cx('chip', on && 'on')}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: open ? i * 0.015 : 0, duration: 0.25 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}
                >
                  {t}
                </motion.button>
              )
            })}
          </div>
        </div>
        <textarea className="textarea" placeholder="Una línea sobre tu día (opcional)" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
      </div>
    </Sheet>
  )
}
