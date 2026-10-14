import { motion } from 'framer-motion'
import { Sun, Repeat, BookOpen, Users, UserRound } from 'lucide-react'
import { Avatar } from './MediaUI'
import { dueness } from '../screens/People'
import { useUI, type Tab } from '../store/ui'
import { useStore } from '../store'
import { useToday } from '../lib/hooks'
import { dayStats } from '../lib/habits'
import { cx } from '../lib/util'
import { haptic } from '../lib/feedback'

const TABS: { id: Tab; label: string; icon: typeof Sun }[] = [
  { id: 'hoy', label: 'Hoy', icon: Sun },
  { id: 'habitos', label: 'Hábitos', icon: Repeat },
  { id: 'diario', label: 'Diario', icon: BookOpen },
  { id: 'gente', label: 'Gente', icon: Users },
  { id: 'yo', label: 'Yo', icon: UserRound },
]

export function TabBar() {
  const tab = useUI((s) => s.tab)
  const setTab = useUI((s) => s.setTab)
  const habits = useStore((s) => s.habits)
  const logs = useStore((s) => s.logs)
  const journal = useStore((s) => s.journal)
  const people = useStore((s) => s.people)
  const today = useToday()
  const stats = dayStats(habits, logs, today)
  const badges: Partial<Record<Tab, boolean>> = {
    hoy: stats.total > 0 && stats.done < stats.total && tab !== 'hoy',
    diario: !journal[today] && new Date().getHours() >= 19,
    gente: tab !== 'gente' && people.some((p) => dueness(p, today).due),
  }

  return (
    <nav className="tabbar" aria-label="Secciones">
      {TABS.map((t) => {
        const on = tab === t.id
        return (
          <button
            key={t.id}
            className={cx('tab', on && 'on')}
            aria-current={on ? 'page' : undefined}
            onClick={() => {
              if (tab === t.id) window.scrollTo({ top: 0, behavior: 'smooth' })
              else {
                haptic('light')
                setTab(t.id)
                window.scrollTo({ top: 0 })
              }
            }}
          >
            {on && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            {t.id === 'yo' ? <Avatar size={26} /> : <t.icon size={22} strokeWidth={on ? 2.6 : 2.2} />}
            {t.label}
            {badges[t.id] && <span className="badge" />}
          </button>
        )
      })}
    </nav>
  )
}
