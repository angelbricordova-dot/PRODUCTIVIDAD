import { useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Play, Trash2, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { addFile, formatBytes, useMediaUrl, type MediaPurpose } from '../lib/media'
import { useStore } from '../store'
import { useUI } from '../store/ui'
import type { MediaMeta } from '../store/types'
import { cx } from '../lib/util'

/** Botón que abre la cámara/galería, comprime y entrega los archivos ya listos. */
export function AddMedia({
  purpose,
  onAdded,
  multiple = false,
  videos = false,
  children,
  className = 'media-add',
  label = 'Añadir foto',
}: {
  purpose: MediaPurpose
  onAdded: (m: MediaMeta) => void
  multiple?: boolean
  videos?: boolean
  children?: ReactNode
  className?: string
  label?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const toast = useUI((s) => s.toast)

  const handle = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    let saved = 0
    let original = 0
    for (const f of Array.from(files)) {
      try {
        const m = await addFile(f, purpose)
        saved += m.bytes
        original += m.originalBytes
        onAdded(m)
      } catch (e) {
        toast({ title: e instanceof Error ? e.message : 'No se pudo guardar el archivo', tone: 'warn' })
      }
    }
    setBusy(false)
    if (input.current) input.current.value = ''
    if (original > saved && saved > 0)
      toast({ title: `Comprimida: ${formatBytes(original)} → ${formatBytes(saved)}`, tone: 'info' })
  }

  return (
    <>
      <button type="button" className={className} onClick={() => input.current?.click()} disabled={busy} aria-label={label}>
        {busy ? <Loader2 size={20} className="spin" /> : children ?? <Camera size={20} />}
        {!children && <span>{busy ? 'Comprimiendo…' : label}</span>}
      </button>
      <input
        ref={input}
        type="file"
        hidden
        accept={videos ? 'image/*,video/*' : 'image/*'}
        multiple={multiple}
        onChange={(e) => handle(e.target.files)}
      />
    </>
  )
}

export function MediaThumb({ id, onClick, className }: { id: string; onClick?: () => void; className?: string }) {
  const meta = useStore((s) => s.media[id])
  const url = useMediaUrl(id, 'thumb')
  return (
    <button type="button" className={cx('media-thumb', className)} onClick={onClick} aria-label={meta?.kind === 'video' ? 'Ver video' : 'Ver foto'}>
      {url ? <img src={url} alt="" draggable={false} /> : <span className="media-skeleton" />}
      {meta?.kind === 'video' && (
        <span className="media-badge">
          <Play size={11} fill="currentColor" /> {Math.round(meta.duration ?? 0)}″
        </span>
      )}
    </button>
  )
}

export function MediaGrid({ ids, onDelete, add }: { ids: string[]; onDelete: (id: string) => void; add?: ReactNode }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <>
      <div className="media-grid">
        <AnimatePresence initial={false}>
          {ids.map((id, i) => (
            <motion.div key={id} layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
              <MediaThumb id={id} onClick={() => setOpen(i)} />
            </motion.div>
          ))}
        </AnimatePresence>
        {add}
      </div>
      <Lightbox
        ids={ids}
        index={open}
        onIndex={setOpen}
        onDelete={(id) => {
          onDelete(id)
          setOpen(null)
        }}
      />
    </>
  )
}

function Full({ id }: { id: string }) {
  const meta = useStore((s) => s.media[id])
  const url = useMediaUrl(id, 'full')
  if (!url) return <Loader2 className="spin" size={28} color="#fff" />
  return meta?.kind === 'video' ? (
    <video src={url} controls playsInline autoPlay className="lightbox-media" />
  ) : (
    <img src={url} alt="" className="lightbox-media" draggable={false} />
  )
}

export function Lightbox({ ids, index, onIndex, onDelete }: { ids: string[]; index: number | null; onIndex: (i: number | null) => void; onDelete: (id: string) => void }) {
  const [confirm, setConfirm] = useState(false)
  const id = index !== null ? ids[index] : undefined
  const meta = useStore((s) => (id ? s.media[id] : undefined))
  const go = (d: number) => {
    if (index === null) return
    setConfirm(false)
    onIndex((index + d + ids.length) % ids.length)
  }
  return (
    <AnimatePresence>
      {id && (
        <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="lightbox-bar">
            <button className="icon-btn ghost-dark" onClick={() => onIndex(null)} aria-label="Cerrar">
              <X size={20} />
            </button>
            {meta && (
              <span className="small">
                {formatBytes(meta.bytes)}
                {meta.originalBytes > meta.bytes && ` · antes ${formatBytes(meta.originalBytes)}`}
              </span>
            )}
            <button
              className={cx('btn sm', confirm ? 'danger-solid' : 'ghost-dark')}
              onClick={() => (confirm ? onDelete(id) : setConfirm(true))}
            >
              <Trash2 size={16} /> {confirm ? '¿Borrar?' : ''}
            </button>
          </div>
          <motion.div
            key={id}
            className="lightbox-stage"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            drag={ids.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70) go(1)
              else if (info.offset.x > 70) go(-1)
            }}
          >
            <Full id={id} />
          </motion.div>
          {ids.length > 1 && (
            <div className="lightbox-nav">
              <button className="icon-btn ghost-dark" onClick={() => go(-1)} aria-label="Anterior">
                <ChevronLeft size={22} />
              </button>
              <span className="small">
                {(index ?? 0) + 1} / {ids.length}
              </span>
              <button className="icon-btn ghost-dark" onClick={() => go(1)} aria-label="Siguiente">
                <ChevronRight size={22} />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Avatar del usuario: foto si la hay, si no el emoji. */
export function Avatar({ size = 40, className }: { size?: number; className?: string }) {
  const avatar = useStore((s) => s.profile.avatar)
  const mediaId = useStore((s) => s.profile.avatarMedia)
  const url = useMediaUrl(mediaId, 'full')
  return (
    <span className={cx('avatar', className)} style={{ width: size, height: size, fontSize: size * 0.55 }}>
      {mediaId && url ? <img src={url} alt="" /> : avatar}
    </span>
  )
}

export function PersonFace({ photo, emoji, size = 40 }: { photo?: string; emoji: string; size?: number }) {
  const url = useMediaUrl(photo, 'full')
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.52 }}>
      {photo && url ? <img src={url} alt="" /> : emoji}
    </span>
  )
}
