import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { useUI } from './store/ui'
import { setSoundEnabled } from './lib/feedback'
import { applyFont } from './lib/fonts'
import { questsFor } from './lib/quests'
import { ACHIEVEMENTS, makeCtx } from './lib/achievements'
import { todayKey } from './lib/date'
import { TabBar } from './components/TabBar'
import { Toasts, CelebrationLayer } from './components/Feedback'
import { HabitEditor } from './components/HabitEditor'
import { HabitDetail } from './components/HabitDetail'
import { Shop } from './components/Shop'
import { SettingsSheet } from './components/SettingsSheet'
import { Calm } from './components/Calm'
import { RitualPlayer } from './components/RitualPlayer'
import { Today } from './screens/Today'
import { Habits } from './screens/Habits'
import { Journal, ReviewSheet } from './screens/Journal'
import { People } from './screens/People'
import { Me } from './screens/Me'
import { Onboarding } from './screens/Onboarding'

function useTheme() {
  const theme = useStore((s) => s.profile.theme)
  const accent = useStore((s) => s.profile.accent)
  const sound = useStore((s) => s.profile.sound)
  const font = useStore((s) => s.profile.font)
  const textScale = useStore((s) => s.profile.textScale)
  useEffect(() => setSoundEnabled(sound), [sound])
  useEffect(() => {
    void applyFont(font, textScale)
  }, [font, textScale])
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'auto' && mq.matches)
      const root = document.documentElement
      root.dataset.theme = dark ? 'dark' : 'light'
      root.dataset.accent = accent
      const color = dark ? '#13112a' : '#f3f1fb'
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', color))
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme, accent])
}

/** Motor del juego: tras cada cambio, premia misiones y logros que se hayan cumplido. */
function useGameEngine() {
  const hydrated = useStore((s) => s.hydrated)
  useEffect(() => {
    if (!hydrated) return
    let t: number | undefined
    const check = () => {
      const s = useStore.getState()
      if (!s.profile.onboarded) return
      const day = todayKey(s.profile.dayStartHour)
      const claimed = s.quests[day] ?? []
      for (const q of questsFor(s, day)) {
        if (!claimed.includes(q.id) && q.progress(s, day) >= 1) s.claimQuest(day, q.id, q.title)
      }
      const fresh = useStore.getState()
      const ctx = makeCtx(fresh, day)
      for (const a of ACHIEVEMENTS) {
        if (!fresh.achievements[a.id] && a.check(fresh, ctx)) fresh.unlockAchievement(a.id)
      }
    }
    const unsub = useStore.subscribe((s, prev) => {
      if (s.events === prev.events && s.logs === prev.logs && s.journal === prev.journal && s.moods === prev.moods && s.bullets === prev.bullets && s.people === prev.people && s.media === prev.media && s.habitPhotos === prev.habitPhotos && s.focus === prev.focus && s.goals === prev.goals && s.redemptions === prev.redemptions && s.reviews === prev.reviews) return
      clearTimeout(t)
      t = window.setTimeout(check, 450)
    })
    check()
    return () => {
      unsub()
      clearTimeout(t)
    }
  }, [hydrated])
}

export default function App() {
  const hydrated = useStore((s) => s.hydrated)
  const onboarded = useStore((s) => s.profile.onboarded)
  const tab = useUI((s) => s.tab)
  const overlay = useUI((s) => s.overlay)
  const open = useUI((s) => s.open)
  const close = useUI((s) => s.close)
  useTheme()
  useGameEngine()

  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {})
  }, [])

  if (!hydrated) {
    return (
      <div className="splash">
        <div className="splash-sun" />
      </div>
    )
  }

  if (!onboarded) return <Onboarding />

  const habitDetailId = overlay?.type === 'habitDetail' ? overlay.id : undefined

  return (
    <div className="app">
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transitionEnd: { transform: 'none' } }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        >
          {tab === 'hoy' && <Today />}
          {tab === 'habitos' && <Habits />}
          {tab === 'diario' && <Journal />}
          {tab === 'gente' && <People />}
          {tab === 'yo' && <Me />}
        </motion.main>
      </AnimatePresence>
      <TabBar />

      <HabitDetail open={overlay?.type === 'habitDetail'} id={habitDetailId} onClose={close} />
      <HabitEditor
        open={overlay?.type === 'habit'}
        id={overlay?.type === 'habit' ? overlay.id : undefined}
        onClose={() => {
          const id = overlay?.type === 'habit' ? overlay.id : undefined
          if (id && useStore.getState().habits.some((h) => h.id === id && !h.archived)) open({ type: 'habitDetail', id })
          else close()
        }}
      />
      <Shop open={overlay?.type === 'shop'} onClose={close} />
      <SettingsSheet open={overlay?.type === 'settings'} onClose={close} />
      <ReviewSheet open={overlay?.type === 'review'} onClose={close} />
      <AnimatePresence>
        {overlay?.type === 'calm' && <Calm key="calm" mode={overlay.mode} onClose={close} />}
        {overlay?.type === 'ritual' && <RitualPlayer key="ritual" part={overlay.part} onClose={close} />}
      </AnimatePresence>

      <Toasts />
      <CelebrationLayer />
    </div>
  )
}
