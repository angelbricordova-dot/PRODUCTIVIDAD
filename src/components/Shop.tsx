import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { useCoins, useToday } from '../lib/hooks'
import { relativeDay } from '../lib/date'
import { uid, cx } from '../lib/util'
import { Coin, CountUp, EmojiPicker, Field, Sheet } from './ui'
import type { Reward } from '../store/types'

export function Shop({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rewards = useStore((s) => s.rewards)
  const redemptions = useStore((s) => s.redemptions)
  const redeem = useStore((s) => s.redeem)
  const coins = useCoins()
  const today = useToday()
  const [edit, setEdit] = useState<Reward | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const sorted = [...rewards].sort((a, b) => a.cost - b.cost)

  return (
    <>
      <Sheet open={open && !edit} onClose={onClose} title="Tienda">
        <div className="stack-12">
          <div className="wallet">
            <div>
              <div className="eyebrow" style={{ color: 'inherit', opacity: 0.7 }}>Tus monedas</div>
              <b><CountUp value={coins} /></b>
            </div>
            <Coin lg />
          </div>
          <p className="small muted">
            Ganas monedas con cada hábito, misión y logro. Gástalas en recompensas que tú mismo eliges. Disfrutar también es parte del sistema.
          </p>
          <div className="list">
            {sorted.map((r) => {
              const can = coins >= r.cost
              const pct = Math.min(1, coins / r.cost)
              return (
                <div key={r.id} className="reward">
                  <span className="emoji-tile lg">{r.emoji}</span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="bold">{r.name}</div>
                    {!can && (
                      <div className="budget-bar" style={{ maxWidth: 140 }}>
                        <i style={{ width: `${pct * 100}%`, background: 'var(--gold)' }} />
                      </div>
                    )}
                    {r.note && <div className="tiny muted">{r.note}</div>}
                  </div>
                  <button className="icon-btn plain sm" aria-label="Editar" onClick={() => setEdit(r)}>
                    <Pencil size={15} />
                  </button>
                  <button
                    className={cx('buy', can && 'can')}
                    disabled={!can}
                    onClick={() => {
                      if (confirm !== r.id) return setConfirm(r.id)
                      redeem(r.id)
                      setConfirm(null)
                    }}
                  >
                    <Coin /> {confirm === r.id ? '¿Canjear?' : r.cost}
                  </button>
                </div>
              )
            })}
          </div>
          <button className="btn soft block" onClick={() => setEdit({ id: '', name: '', emoji: '🎁', cost: 100 })}>
            <Plus size={18} /> Crear recompensa
          </button>
          {redemptions.length > 0 && (
            <>
              <div className="eyebrow" style={{ marginTop: 10 }}>Canjeadas</div>
              <div className="list">
                {[...redemptions].reverse().slice(0, 20).map((r) => (
                  <div key={r.id} className="list-item">
                    <span className="emoji-tile">{r.emoji}</span>
                    <span className="grow bold">{r.name}</span>
                    <span className="tiny muted">{relativeDay(r.date, today)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Sheet>
      <RewardEditor reward={edit} onClose={() => setEdit(null)} />
    </>
  )
}

function RewardEditor({ reward, onClose }: { reward: Reward | null; onClose: () => void }) {
  const upsert = useStore((s) => s.upsertReward)
  const del = useStore((s) => s.deleteReward)
  const [r, setR] = useState<Reward | null>(null)
  useEffect(() => setR(reward), [reward])
  return (
    <Sheet
      open={!!reward}
      onClose={onClose}
      title={reward?.id ? 'Editar recompensa' : 'Nueva recompensa'}
      footer={
        <button
          className="btn primary block"
          disabled={!r?.name.trim() || !r?.cost}
          onClick={() => {
            if (r) upsert({ ...r, id: r.id || uid(), name: r.name.trim() })
            onClose()
          }}
        >
          Guardar
        </button>
      }
    >
      {r && (
        <div className="stack-12">
          <input className="input big" placeholder="Ver una peli con palomitas" value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} />
          <Field label="Precio en monedas">
            <input className="input" inputMode="numeric" value={r.cost || ''} onChange={(e) => setR({ ...r, cost: parseInt(e.target.value) || 0 })} />
          </Field>
          <p className="tiny muted">Referencia: un día con todos tus hábitos ≈ 50–80 monedas.</p>
          <Field label="Nota (opcional)">
            <input className="input" value={r.note ?? ''} onChange={(e) => setR({ ...r, note: e.target.value })} />
          </Field>
          <EmojiPicker value={r.emoji} onChange={(emoji) => setR({ ...r, emoji })} />
          {r.id && (
            <button className="btn danger block" onClick={() => { del(r.id); onClose() }}>
              <Trash2 size={16} /> Eliminar
            </button>
          )}
        </div>
      )}
    </Sheet>
  )
}
