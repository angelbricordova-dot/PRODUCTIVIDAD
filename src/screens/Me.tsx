import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, ShoppingBag, Flame, Trophy, Zap, CalendarCheck, ChevronRight, Gift, ScrollText } from 'lucide-react'
import { Avatar } from '../components/MediaUI'
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
        <h1 className="page-title">Tu personaje</h1>
        <button className="icon-btn" aria-label="Ajustes" onClick={() => open({ type: 'settings' })}>
          <Settings size={20} />
        </button>
      </div>

      {/* Ficha de jugador */}
      <motion.div className="card c-uva player-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 22 }}>
        <div className="row" style={{ gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <Avatar size={84} />
            <motion.span className="player-level display" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.2 }}>
              {level.level}
            </motion.span>
          </div>
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="display ellipsis" style={{ fontSize: 'calc(1.6rem * var(--display-scale))', lineHeight: 1.1 }}>
              {profile.name}
            </div>
            <span className="pill-tag" style={{ marginTop: 6, background: 'var(--surface)' }}>
              {level.title}
              {level.nextAt ? ` · nuevo título en nivel ${level.nextAt}` : ''}
            </span>
            <div className="small" style={{ marginTop: 6, color: 'var(--ink-2)', fontWeight: 600 }}>
              {profile.motto}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <XPBar value={level.progress} colored />
          <div className="row-between tiny bold" style={{ marginTop: 6, color: 'var(--ink-2)' }}>
            <span className="num">
              <CountUp value={level.xpInto} /> / {level.xpNeeded} XP
            </span>
            <span className="num">
              <CountUp value={level.total} /> XP en total
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="stat-blob c-mandarina">
          <span className="sb-icon">
            <Flame size={17} />
          </span>
          <b>{streak.current}</b>
          <span>días seguidos · mejor {streak.best}</span>
        </div>
        <button className="stat-blob c-girasol" onClick={() => open({ type: 'shop' })}>
          <span className="sb-icon">
            <ShoppingBag size={17} />
          </span>
          <b className="row" style={{ gap: 6 }}>
            {coins}
          </b>
          <span>monedas · abrir tienda</span>
        </button>
        <div className="stat-blob c-menta">
          <span className="sb-icon">
            <CalendarCheck size={17} />
          </span>
          <b>{habitsDone}</b>
          <span>hábitos cumplidos</span>
        </div>
        <div className="stat-blob c-cielo">
          <span className="sb-icon">
            <Zap size={17} />
          </span>
          <b>{focusHours.toFixed(1)}</b>
          <span>horas de enfoque</span>
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
              <button key={a.id} className={cx('badge-item', `c-${a.color}`, !!unlocked[a.id] && 'on')} onClick={() => setBadge(a.id)}>
                <span className="medal">
                  <a.icon size={26} strokeWidth={2.2} />
                </span>
                <span>{a.title}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="list">
          <button className="list-item" onClick={() => open({ type: 'shop' })}>
            <span className="icon-tile c-girasol" style={{ background: 'var(--c-soft)', color: 'var(--c-deep)' }}><Gift size={20} /></span>
            <span className="grow bold">Tienda de recompensas</span>
            <ChevronRight size={18} className="muted" />
          </button>
          <button className="list-item" onClick={() => setHistoryOpen(true)}>
            <span className="icon-tile c-uva" style={{ background: 'var(--c-soft)', color: 'var(--c-deep)' }}><ScrollText size={20} /></span>
            <span className="grow bold">Historial de experiencia</span>
            <ChevronRight size={18} className="muted" />
          </button>
          <button className="list-item" onClick={() => open({ type: 'settings' })}>
            <span className="icon-tile c-cielo" style={{ background: 'var(--c-soft)', color: 'var(--c-deep)' }}><Settings size={20} /></span>
            <span className="grow bold">Ajustes y copia de seguridad</span>
            <ChevronRight size={18} className="muted" />
          </button>
        </div>
      </section>

      <Sheet open={!!sel} onClose={() => setBadge(null)}>
        {sel && (
          <div className="center" style={{ padding: '10px 0 8px' }}>
            <div className={cx('badge-item', `c-${sel.color}`, !!unlocked[sel.id] && 'on')} style={{ display: 'grid', placeItems: 'center' }}>
              <span className="medal" style={{ width: 96, height: 96 }}>
                <sel.icon size={46} />
              </span>
            </div>
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
              <span className="tiny bold num" style={{ color: 'var(--a)' }}>+{e.xp} XP</span>
              <span className="tiny bold num row" style={{ gap: 3 }}><Coin />{e.coins}</span>
            </div>
          ))}
          {events.length === 0 && <div className="empty"><Trophy /> <b>Aún no hay nada</b>Completa tu primer hábito.</div>}
        </div>
      </Sheet>
    </div>
  )
}
