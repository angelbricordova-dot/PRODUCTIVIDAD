import { useEffect, useState } from 'react'
import { Delete } from 'lucide-react'
import { useStore } from '../store'
import { useToday } from '../lib/hooks'
import { cx } from '../lib/util'
import { Segmented, Sheet } from './ui'

export function TransactionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const categories = useStore((s) => s.categories)
  const currency = useStore((s) => s.profile.currency)
  const add = useStore((s) => s.addTransaction)
  const today = useToday()
  const [kind, setKind] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [cat, setCat] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setAmount('')
      setNote('')
      setKind('expense')
    }
  }, [open])

  const list = categories.filter((c) => c.kind === kind)
  useEffect(() => {
    if (!list.some((c) => c.id === cat)) setCat(list[0]?.id ?? '')
  }, [kind, list, cat])

  const press = (k: string) => {
    setAmount((a) => {
      if (k === '⌫') return a.slice(0, -1)
      if (k === ',') return a.includes('.') ? a : (a || '0') + '.'
      const [, dec] = a.split('.')
      if (dec !== undefined && dec.length >= 2) return a
      if (a === '0') return k
      return (a + k).slice(0, 9)
    })
  }

  const value = parseFloat(amount || '0')
  const save = () => {
    if (!value || !cat) return
    add({ date: today, amount: value, kind, categoryId: cat, note: note.trim() || undefined })
    onClose()
  }

  const symbol = (() => {
    try {
      return new Intl.NumberFormat('es-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency
    } catch {
      return currency
    }
  })()

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={kind === 'expense' ? 'Nuevo gasto' : 'Nuevo ingreso'}
      footer={
        <button className="btn primary block" disabled={!value || !cat} onClick={save}>
          Registrar · +5 XP
        </button>
      }
    >
      <div className="stack-12">
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: 'expense', label: 'Gasto' },
            { value: 'income', label: 'Ingreso' },
          ]}
        />
        <div className="center display num" style={{ fontSize: 48, fontWeight: 600, padding: '8px 0', color: kind === 'income' ? 'var(--good)' : 'var(--ink)' }}>
          {kind === 'income' ? '+' : ''}
          {symbol}
          {amount || '0'}
        </div>
        <div className="chips">
          {list.map((c) => (
            <button key={c.id} className={cx('chip', c.id === cat && 'on')} onClick={() => setCat(c.id)}>
              <span>{c.emoji}</span>
              {c.name}
            </button>
          ))}
        </div>
        <input className="input" placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'].map((k) => (
            <button key={k} onClick={() => press(k)} aria-label={k === '⌫' ? 'Borrar' : k}>
              {k === '⌫' ? <Delete size={20} style={{ margin: 'auto' }} /> : k}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}
