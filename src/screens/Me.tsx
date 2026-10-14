import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, ShoppingBag, Flame, Trophy, Zap, CalendarCheck, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { useUI } from '../store/ui'
import { useCoins, useGlobalStreak, useLevel, useToday } from '../lib/hooks'
import { areaXp, xpByDay } from '../store/selectors'
import { AREA_SCALE, levelInfo } from '../lib/game'
import { dayStats } from '../lib/habits'
import { lastNDays, fromKey, relativeDay, toKey, WEEKDAYS_SHORT, weekdayMon } from '../lib/date'
import { ACHIEVEMENTS } from '../lib/achievements'
import { Bars, Heatmap, Radar } from '../components/charts'
import { Coin, CountUp, Segmented, Sheet, XPBar } from '../components/ui'
import { cx } from '../lib/util'

export function Me() {
  const profile = useStore((s) => s.profile)
  const events = useStore((s) => s.events)
  const areas = useStore((s) => s.areas)
  const habits = useStore((s) => s.habits)
  const logs = useStore((s) => s.logs)
  const unlocked = useStore((s) => s.achievements)
  const focus = useStore((s) => s.focus)
  const open = useUI((s) => s.open)
  const today = useToday()
  const level = useLevel()
  const coins = useCoins()
  const streak = useGlobalStreak()
  const [range, setRange] = useState<'7' | '30'>('7')
  const [badge, setBadge] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const perArea = useMemo(() => areaXp(events), [events])
  const byDay = useMemo(() => xpByDay(events), [events])
  const radarItems = areas.map((a) => {
    const info = levelInfo(perArea[a.id] ?? 0, AREA_SCALE)
    return { label: a.name, emoji: a.emoji, color: a.color, level: info.level, raw: info.level + info.progress }
  })
  const maxRaw = Math.max(3, ...radarItems.map((r) => r.raw))
  const days = lastNDays(today, Number(range))
  const xpData = days.map((d) => ({ key: d, value: byDay[d] ?? 0, label: range === '7' ? WEEKDAYS_SHORT[weekdayMon(d)] : fromKey(d).getDate() % 5 === 0 ? String(fromKey(d).getDate()) : '' }))
  const xpWeek = lastNDays(today, 7).reduce((a, d) => a + (byDay[d] ?? 0), 0)
  const xpPrevWeek = lastNDays(lastNDays(today, 8)[0], 7).reduce((a, d) => a + (byDay[d] ?? 0), 0)
  const focusHours = focus.filter((f) => f.kind === 'focus').reduce((a, f) => a + f.minutes, 0) / 60
  const habitsDone = Object.values(logs).reduce((a, d) => a + Object.keys(d).filter((id) => {
    const h = habits.find((x) => x.id === id)
    return h && d[id] >= h.target
  }).length, 0)
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length
  const sel = ACHIEVEMENTS.find((a) => a.id === badge)

  return (
    <div className="page">
      <div className="page-head">
        <div className="row">
          <div className="emoji-tile xl" style={{ background: 'linear-gradient(145deg, var(--a-soft), var(--surface))', boxShadow: 'var(--shadow-sm)' }}>
            {profile.avatar}
          </div>
          <div>
            <div className="eyebrow">
              {level.title} {level.emoji}
            </div>
            <h1 className="page-title" style={{ fontSize: 28 }}>
              {profile.name}
            </h1>
            <div className="small muted">{profile.motto}</div>
          </div>
        </div>
        <button className="icon-btn" aria-label="Ajustes" onClick={() => open({ type: 'settings' })}>
          <Settings size={20} />
        </button>
      </div>

      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ overflow: 'hidden' }}>
        <div className="row-between">
          <div>
            <div className="eyebrow">Nivel</div>
            <div className="display" style={{ fontSize: 56, lineHeight: 1, fontWeight: 700 }}>
              <CountUp value={level.level} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">XP total</div>
            <div className="display num" style={{ fontSize: 26, fontWeight: 600 }}>
              <CountUp value={level.total} />
            </div>
            <div className="tiny muted">
              {level.nextAt ? `Nivel ${level.nextAt}: nuevo título` : 'Título máximo alcanzado'}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <XPBar value={level.progress} />
          <div className="row-between tiny muted bold" style={{ marginTop: 6 }}>
            <span className="num">{level.xpInto} / {level.xpNeeded} XP</span>
            <span>faltan {level.xpNeeded - level.xpInto} para el {level.level + 1}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="stat-tile">
          <span><Flame size={13} /> Racha · mejor {streak.best}</span>
          <b style={{ color: 'var(--warn)' }}>{streak.current} {streak.current === 1 ? 'día' : 'días'}</b>
        </div>
        <button className="stat-tile" style={{ textAlign: 'left' }} onClick={() => open({ type: 'shop' })}>
          <span><ShoppingBag size={13} /> Tienda</span>
          <b className="row" style={{ gap: 6 }}><Coin lg /> {coins}</b>
        </button>
        <div className="stat-tile">
          <span><CalendarCheck size={13} /> Hábitos cumplidos</span>
          <b>{habitsDone}</b>
        </div>
        <div className="stat-tile">
          <span><Zap size={13} /> Horas de enfoque</span>
          <b>{focusHours.toFixed(1)}</b>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Tu personaje</h2>
          <span className="small muted">nivel por área</span>
        </div>
        <div className="card">
          <Radar items={radarItems.map((r) => ({ ...r, value: r.raw / maxRaw }))} />
          <p className="tiny muted center" style={{ marginTop: 6 }}>
            Cada hábito sube el área a la que pertenece. Busca equilibrio, no perfección.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Experiencia</h2>
          <div style={{ width: 130 }}>
            <Segmented value={range} onChange={setRange} options={[{ value: '7', label: '7d' }, { value: '30', label: '30d' }]} />
          </div>
        </div>
        <div className="card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div>
              <div className="display num" style={{ fontSize: 26, fontWeight: 600 }}>{xpWeek} XP</div>
              <div className="tiny muted bold">esta semana</div>
            </div>
            {xpPrevWeek > 0 && (
              <span className="pill-tag" style={{ color: xpWeek >= xpPrevWeek ? 'var(--good)' : 'var(--bad)' }}>
                {xpWeek >= xpPrevWeek ? '▲' : '▼'} {Math.abs(Math.round(((xpWeek - xpPrevWeek) / xpPrevWeek) * 100))}% vs anterior
              </span>
            )}
          </div>
          <Bars data={xpData} highlight={today} />
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Constancia</h2>
          <span className="small muted">% de hábitos por día</span>
        </div>
        <div className="card">
          <Heatmap today={today} weeks={22} value={(d) => {
            const s = dayStats(habits, logs, d)
            return s.total ? s.ratio : null
          }} />
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Logros</h2>
          <span className="small muted num">{unlockedCount}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="card">
          <div className="badges">
            {ACHIEVEMENTS.map((a) => (
              <button key={a.id} className={cx('badge-item', !!unlocked[a.id] && 'on')} onClick={() => setBadge(a.id)}>
                <span className="medal">{a.emoji}</span>
                <span>{a.title}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="list">
          <button className="list-item" onClick={() => open({ type: 'shop' })}>
            <span className="emoji-tile">🎁</span>
            <span className="grow bold">Tienda de recompensas</span>
            <ChevronRight size={18} className="muted" />
          </button>
          <button className="list-item" onClick={() => setHistoryOpen(true)}>
            <span className="emoji-tile">📜</span>
            <span className="grow bold">Historial de experiencia</span>
            <ChevronRight size={18} className="muted" />
          </button>
          <button className="list-item" onClick={() => open({ type: 'settings' })}>
            <span className="emoji-tile">⚙️</span>
            <span className="grow bold">Ajustes y copia de seguridad</span>
            <ChevronRight size={18} className="muted" />
          </button>
        </div>
      </section>

      <Sheet open={!!sel} onClose={() => setBadge(null)}>
        {sel && (
          <div className="center" style={{ padding: '10px 0 8px' }}>
            <div style={{ fontSize: 72, filter: unlocked[sel.id] ? undefined : 'grayscale(1)', opacity: unlocked[sel.id] ? 1 : 0.5 }}>{sel.emoji}</div>
            <div className="display" style={{ fontSize: 26, fontWeight: 600, marginTop: 8 }}>{sel.title}</div>
            <p className="muted" style={{ marginTop: 6 }}>{sel.desc}</p>
            <p className="small bold" style={{ marginTop: 12, color: unlocked[sel.id] ? 'var(--good)' : 'var(--muted)' }}>
              {unlocked[sel.id] ? `Desbloqueado ${relativeDay(toKey(new Date(unlocked[sel.id])), today).toLowerCase()}` : sel.xp ? `Recompensa: +${sel.xp} XP` : 'Aún bloqueado'}
            </p>
          </div>
        )}
      </Sheet>

      <Sheet open={historyOpen} onClose={() => setHistoryOpen(false)} title="Historial">
        <div className="list">
          {[...events].reverse().slice(0, 120).map((e) => (
            <div key={e.id} className="list-item">
              <span className="grow" style={{ minWidth: 0 }}>
                <span className="bold ellipsis" style={{ display: 'block' }}>{e.label}</span>
                <span className="tiny muted">{relativeDay(e.date, today)}</span>
              </span>
              <span className="tiny bold num" style={{ color: 'var(--a1)' }}>+{e.xp} XP</span>
              <span className="tiny bold num row" style={{ gap: 3 }}><Coin />{e.coins}</span>
            </div>
          ))}
          {events.length === 0 && <div className="empty"><Trophy /> <b>Aún no hay nada</b>Completa tu primer hábito.</div>}
        </div>
      </Sheet>
    </div>
  )
}
