import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, TrendingDown, TrendingUp, PiggyBank } from 'lucide-react'
import { useStore } from '../../store'
import { useToday } from '../../lib/hooks'
import { addDays, lastNDays, monthKey, relativeDay, shortDate, fromKey, MONTHS } from '../../lib/date'
import { money, sum, uid, cx } from '../../lib/util'
import { Bars } from '../../components/charts'
import { EmojiPicker, Empty, Field, Ring, Sheet } from '../../components/ui'
import { TransactionSheet } from '../../components/TransactionSheet'
import type { FinanceCategory, SavingsGoal } from '../../store/types'

export function Finance() {
  const tx = useStore((s) => s.transactions)
  const categories = useStore((s) => s.categories)
  const savings = useStore((s) => s.savings)
  const currency = useStore((s) => s.profile.currency)
  const deleteTx = useStore((s) => s.deleteTransaction)
  const deposit = useStore((s) => s.depositSavings)
  const today = useToday()
  const [txOpen, setTxOpen] = useState(false)
  const [catEdit, setCatEdit] = useState<FinanceCategory | null>(null)
  const [goalEdit, setGoalEdit] = useState<SavingsGoal | null>(null)
  const [depositFor, setDepositFor] = useState<SavingsGoal | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)

  const month = monthKey(today)
  const prevMonth = monthKey(addDays(`${month}-01`, -1))
  const inMonth = tx.filter((t) => monthKey(t.date) === month)
  const income = sum(inMonth.filter((t) => t.kind === 'income'), (t) => t.amount)
  const expense = sum(inMonth.filter((t) => t.kind === 'expense'), (t) => t.amount)
  const prevExpense = sum(tx.filter((t) => monthKey(t.date) === prevMonth && t.kind === 'expense'), (t) => t.amount)
  const fmt = (n: number) => money(n, currency)

  const byCat = useMemo(() => {
    const m: Record<string, number> = {}
    for (const t of inMonth) if (t.kind === 'expense') m[t.categoryId] = (m[t.categoryId] ?? 0) + t.amount
    return m
  }, [inMonth])

  const days14 = lastNDays(today, 14)
  const daily = days14.map((d) => ({
    key: d,
    label: String(fromKey(d).getDate()),
    value: sum(tx.filter((t) => t.date === d && t.kind === 'expense'), (t) => t.amount),
  }))
  const noSpendStreak = (() => {
    let n = 0
    for (let d = addDays(today, -1); n < 365; d = addDays(d, -1)) {
      if (tx.some((t) => t.date === d && t.kind === 'expense')) break
      if (!tx.some((t) => t.date <= d)) break
      n++
    }
    return n
  })()

  const recent = [...tx].sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts).slice(0, 20)
  const expenseCats = categories.filter((c) => c.kind === 'expense').sort((a, b) => (byCat[b.id] ?? 0) - (byCat[a.id] ?? 0))

  return (
    <div>
      <motion.div className="money-hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Balance de {MONTHS[fromKey(`${month}-15`).getMonth()]}
        </div>
        <div className="big">{fmt(income - expense)}</div>
        <div className="sub">
          <div className="pill">
            <span>
              <TrendingUp size={12} /> Ingresos
            </span>
            <b>{fmt(income)}</b>
          </div>
          <div className="pill">
            <span>
              <TrendingDown size={12} /> Gastos
            </span>
            <b>{fmt(expense)}</b>
          </div>
        </div>
        {prevExpense > 0 && (
          <p className="small" style={{ marginTop: 12, opacity: 0.85 }}>
            {expense <= prevExpense
              ? `Vas ${fmt(prevExpense - expense)} por debajo de lo que gastaste el mes pasado. 👏`
              : `Llevas ${fmt(expense - prevExpense)} más que todo el mes pasado.`}
          </p>
        )}
      </motion.div>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="stat-tile">
          <span>Días sin gastar seguidos</span>
          <b>{noSpendStreak} 🛡️</b>
        </div>
        <div className="stat-tile">
          <span>Tasa de ahorro</span>
          <b>{income > 0 ? `${Math.max(0, Math.round(((income - expense) / income) * 100))}%` : '—'}</b>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Últimos 14 días</h2>
        </div>
        <div className="card">
          <Bars data={daily} highlight={today} height={90} format={fmt} />
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Metas de ahorro</h2>
          <button className="section-link" onClick={() => setGoalEdit({ id: '', name: '', emoji: '🐷', target: 0, saved: 0, createdAt: today })}>
            Nueva
          </button>
        </div>
        {savings.length === 0 ? (
          <div className="card">
            <Empty emoji="🐷" title="Ahorra con propósito">
              Un fondo de emergencia, un viaje, un portátil… ponle nombre y verás cómo crece.
            </Empty>
          </div>
        ) : (
          <div className="stack-8">
            {savings.map((g) => {
              const p = g.target ? g.saved / g.target : 0
              return (
                <div key={g.id} className="card row">
                  <Ring value={p} size={58} stroke={6} color={p >= 1 ? 'var(--good)' : 'url(#ringGrad)'}>
                    <span style={{ fontSize: 22 }}>{g.emoji}</span>
                  </Ring>
                  <button className="grow" style={{ textAlign: 'left', minWidth: 0 }} onClick={() => setGoalEdit(g)}>
                    <div className="bold ellipsis">{g.name}</div>
                    <div className="small muted num">
                      {fmt(g.saved)} de {fmt(g.target)} · {Math.round(p * 100)}%
                    </div>
                    {g.deadline && <div className="tiny muted">Para el {shortDate(g.deadline)}</div>}
                  </button>
                  <button className="btn sm primary" onClick={() => setDepositFor(g)}>
                    <PiggyBank size={16} /> Aportar
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Presupuesto del mes</h2>
          <span className="small muted">toca para ajustar</span>
        </div>
        <div className="list">
          {expenseCats.map((c) => {
            const spent = byCat[c.id] ?? 0
            const p = c.budget ? spent / c.budget : 0
            return (
              <button key={c.id} className="list-item" onClick={() => setCatEdit(c)} style={{ alignItems: 'center' }}>
                <span className="emoji-tile">{c.emoji}</span>
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="row-between">
                    <span className="bold">{c.name}</span>
                    <span className="small num">
                      {fmt(spent)}
                      {c.budget > 0 && <span className="muted"> / {fmt(c.budget)}</span>}
                    </span>
                  </span>
                  {c.budget > 0 && (
                    <span className="budget-bar" style={{ display: 'block' }}>
                      <i className={cx(p >= 1 ? 'over' : p >= 0.8 && 'warn')} style={{ width: `${Math.min(100, p * 100)}%` }} />
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Movimientos</h2>
        </div>
        {recent.length === 0 ? (
          <div className="card">
            <Empty emoji="🧾" title="Sin movimientos">
              Registrar cada gasto toma 5 segundos y te da +5 XP. Lo que se mide, mejora.
            </Empty>
          </div>
        ) : (
          <div className="list">
            {recent.map((t) => {
              const c = categories.find((x) => x.id === t.categoryId)
              return (
                <button key={t.id} className="list-item" onClick={() => setConfirm(confirm === t.id ? null : t.id)}>
                  <span className="emoji-tile">{c?.emoji ?? '📦'}</span>
                  <span className="grow" style={{ minWidth: 0 }}>
                    <span className="bold ellipsis" style={{ display: 'block' }}>
                      {t.note || c?.name || 'Movimiento'}
                    </span>
                    <span className="tiny muted">
                      {relativeDay(t.date, today)} · {c?.name}
                    </span>
                  </span>
                  {confirm === t.id ? (
                    <span
                      className="btn sm danger"
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTx(t.id)
                        setConfirm(null)
                      }}
                    >
                      <Trash2 size={14} /> Borrar
                    </span>
                  ) : (
                    <span className="bold num" style={{ color: t.kind === 'income' ? 'var(--good)' : 'var(--ink)' }}>
                      {t.kind === 'income' ? '+' : '−'}
                      {fmt(t.amount)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </section>

      <button className="fab" onClick={() => setTxOpen(true)} aria-label="Nuevo movimiento">
        <Plus size={26} strokeWidth={2.6} />
      </button>

      <TransactionSheet open={txOpen} onClose={() => setTxOpen(false)} />
      <CategorySheet cat={catEdit} onClose={() => setCatEdit(null)} />
      <SavingsSheet goal={goalEdit} onClose={() => setGoalEdit(null)} />
      <DepositSheet goal={depositFor} onClose={() => setDepositFor(null)} onDeposit={(n) => depositFor && deposit(depositFor.id, n)} />
    </div>
  )
}

function CategorySheet({ cat, onClose }: { cat: FinanceCategory | null; onClose: () => void }) {
  const upsert = useStore((s) => s.upsertCategory)
  const [budget, setBudget] = useState('')
  const currency = useStore((s) => s.profile.currency)
  const open = !!cat
  useEffect(() => {
    if (cat) setBudget(cat.budget ? String(cat.budget) : '')
  }, [cat])
  return (
    <Sheet
      open={open}
      onClose={() => {
        setBudget('')
        onClose()
      }}
      title={cat ? `${cat.emoji} ${cat.name}` : ''}
      footer={
        <button
          className="btn primary block"
          onClick={() => {
            if (cat) upsert({ ...cat, budget: Math.max(0, parseFloat(budget) || 0) })
            setBudget('')
            onClose()
          }}
        >
          Guardar presupuesto
        </button>
      }
    >
      <Field label={`Presupuesto mensual (${currency}). 0 = sin límite`}>
        <input className="input big" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value.replace(',', '.'))} placeholder="0" />
      </Field>
      <p className="small muted" style={{ marginTop: 12 }}>
        Consejo estilo YNAB: dale a cada dinero un trabajo antes de que llegue el mes.
      </p>
    </Sheet>
  )
}

function SavingsSheet({ goal, onClose }: { goal: SavingsGoal | null; onClose: () => void }) {
  const upsert = useStore((s) => s.upsertSavings)
  const del = useStore((s) => s.deleteSavings)
  const [g, setG] = useState<SavingsGoal | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  useEffect(() => {
    if (goal) setG(goal)
  }, [goal])
  const close = () => {
    setG(null)
    setEmojiOpen(false)
    onClose()
  }
  return (
    <Sheet
      open={!!goal}
      onClose={close}
      title={goal?.id ? 'Editar meta' : 'Nueva meta de ahorro'}
      footer={
        <button
          className="btn primary block"
          disabled={!g?.name.trim() || !g?.target}
          onClick={() => {
            if (g) upsert({ ...g, id: g.id || uid(), name: g.name.trim() })
            close()
          }}
        >
          Guardar
        </button>
      }
    >
      {g && (
        <div className="stack-12">
          <div className="row">
            <button className="emoji-tile xl" onClick={() => setEmojiOpen((x) => !x)}>
              {g.emoji}
            </button>
            <input className="input big grow" placeholder="Fondo de emergencia" value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} />
          </div>
          {emojiOpen && <EmojiPicker value={g.emoji} onChange={(emoji) => setG({ ...g, emoji })} />}
          <Field label="Objetivo">
            <input className="input" inputMode="decimal" value={g.target || ''} onChange={(e) => setG({ ...g, target: parseFloat(e.target.value.replace(',', '.')) || 0 })} placeholder="1000" />
          </Field>
          <Field label="Ya ahorrado">
            <input className="input" inputMode="decimal" value={g.saved || ''} onChange={(e) => setG({ ...g, saved: parseFloat(e.target.value.replace(',', '.')) || 0 })} placeholder="0" />
          </Field>
          <Field label="Fecha límite (opcional)">
            <input className="input" type="date" value={g.deadline ?? ''} onChange={(e) => setG({ ...g, deadline: e.target.value || undefined })} />
          </Field>
          {g.id && (
            <button
              className="btn danger block"
              onClick={() => {
                del(g.id)
                close()
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

function DepositSheet({ goal, onClose, onDeposit }: { goal: SavingsGoal | null; onClose: () => void; onDeposit: (n: number) => void }) {
  const [v, setV] = useState('')
  const currency = useStore((s) => s.profile.currency)
  const go = (n: number) => {
    if (n) onDeposit(n)
    setV('')
    onClose()
  }
  return (
    <Sheet open={!!goal} onClose={() => { setV(''); onClose() }} title={goal ? `${goal.emoji} ${goal.name}` : ''}>
      <div className="stack-12">
        <div className="grid-3">
          {[10, 25, 50, 100, 250, 500].map((n) => (
            <button key={n} className="btn soft" onClick={() => go(n)}>
              +{money(n, currency, true)}
            </button>
          ))}
        </div>
        <div className="row">
          <input className="input grow" inputMode="decimal" placeholder="Otra cantidad" value={v} onChange={(e) => setV(e.target.value.replace(',', '.'))} />
          <button className="btn primary" onClick={() => go(parseFloat(v) || 0)}>
            Aportar
          </button>
        </div>
        <button className="btn ghost block" onClick={() => go(-(parseFloat(v) || 0))} disabled={!parseFloat(v)}>
          Retirar esa cantidad
        </button>
      </div>
    </Sheet>
  )
}
