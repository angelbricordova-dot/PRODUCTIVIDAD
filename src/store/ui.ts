import { create } from 'zustand'
import { uid } from '../lib/util'

export interface Toast {
  id: string
  title: string
  subtitle?: string
  emoji?: string
  xp?: number
  coins?: number
  tone?: 'xp' | 'info' | 'achievement' | 'warn'
}

export interface Celebration {
  kind: 'level' | 'area' | 'achievement' | 'reward' | 'perfect'
  title: string
  subtitle?: string
  emoji?: string
  level?: number
}

export type Tab = 'hoy' | 'habitos' | 'diario' | 'vida' | 'yo'

export type Overlay =
  | { type: 'ritual'; part: 'morning' | 'afternoon' | 'evening' | 'anytime' }
  | { type: 'calm'; mode: 'focus' | 'breath' }
  | { type: 'settings' }
  | { type: 'shop' }
  | { type: 'habit'; id?: string }
  | { type: 'habitDetail'; id: string }
  | { type: 'review' }
  | null

interface UIState {
  tab: Tab
  setTab: (t: Tab) => void
  overlay: Overlay
  open: (o: Overlay) => void
  close: () => void
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
  celebration: Celebration | null
  celebrate: (c: Celebration) => void
  closeCelebration: () => void
  queue: Celebration[]
}

export const useUI = create<UIState>((set, get) => ({
  tab: 'hoy',
  setTab: (tab) => set({ tab }),
  overlay: null,
  open: (overlay) => set({ overlay }),
  close: () => set({ overlay: null }),
  toasts: [],
  toast: (t) => {
    const id = uid()
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }))
    setTimeout(() => get().dismiss(id), 2600)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  celebration: null,
  queue: [],
  celebrate: (c) => {
    if (get().celebration) set((s) => ({ queue: [...s.queue, c] }))
    else set({ celebration: c })
  },
  closeCelebration: () => {
    const [next, ...rest] = get().queue
    set({ celebration: next ?? null, queue: rest })
  },
}))
