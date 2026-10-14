import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Upload, Trash2, Plus, Share, Check, Type } from 'lucide-react'
import { useStore, exportData } from '../store'
import { useUI } from '../store/ui'
import type { AccentName, AppData, Area, FontId, TextScale, ThemeMode } from '../store/types'
import { toKey } from '../lib/date'
import { uid, cx } from '../lib/util'
import { FONT_PAIRS, preloadAllFonts } from '../lib/fonts'
import { allMediaKeys, blobToDataUrl, dataUrlToBlob, formatBytes, getBlob, putBlob } from '../lib/media'
import { EmojiPicker, Field, Segmented, Sheet, Stepper, Toggle } from './ui'
import { AddMedia, Avatar } from './MediaUI'

export const ACCENTS: { v: AccentName; label: string; color: string }[] = [
  { v: 'mandarina', label: 'Mandarina', color: '#f26a2e' },
  { v: 'girasol', label: 'Girasol', color: '#ffc23d' },
  { v: 'chicle', label: 'Chicle', color: '#f0468e' },
  { v: 'uva', label: 'Uva', color: '#7b5cf5' },
  { v: 'cielo', label: 'Cielo', color: '#2f7bf5' },
  { v: 'menta', label: 'Menta', color: '#12a07c' },
]

const AREA_COLORS = ['#FF7A3D', '#8B6CFF', '#22B892', '#FF5C9E', '#3E8BFF', '#FFC23D', '#7BC67E', '#E5484D', '#A1887F', '#00A6B4']

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const profile = useStore((s) => s.profile)
  const areas = useStore((s) => s.areas)
  const media = useStore((s) => s.media)
  const setProfile = useStore((s) => s.setProfile)
  const addMedia = useStore((s) => s.addMedia)
  const deleteMedia = useStore((s) => s.deleteMedia)
  const upsertArea = useStore((s) => s.upsertArea)
  const deleteArea = useStore((s) => s.deleteArea)
  const importData = useStore((s) => s.importData)
  const resetAll = useStore((s) => s.resetAll)
  const toast = useUI((s) => s.toast)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [areaEdit, setAreaEdit] = useState<Area | null>(null)
  const [resetStep, setResetStep] = useState(0)
  const [busy, setBusy] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) void preloadAllFonts()
  }, [open])

  const mediaBytes = Object.values(media).reduce((a, m) => a + m.bytes, 0)
  const savedBytes = Object.values(media).reduce((a, m) => a + Math.max(0, m.originalBytes - m.bytes), 0)

  const doExport = async () => {
    setBusy('Preparando copia…')
    try {
      const files: Record<string, string> = {}
      for (const key of await allMediaKeys()) {
        const [id, size] = key.split(':')
        const b = await getBlob(id, size as 'full' | 'thumb')
        if (b) files[key] = await blobToDataUrl(b)
      }
      const json = JSON.stringify({ ...exportData(), __files: files })
      const name = `alba-copia-${toKey(new Date())}.json`
      const blob = new Blob([json], { type: 'application/json' })
      const f = new File([blob], name, { type: 'application/json' })
      try {
        if (navigator.canShare?.({ files: [f] })) {
          await navigator.share({ files: [f], title: 'Copia de seguridad de Alba' })
          return
        }
      } catch {
        /* cancelado: seguimos con la descarga */
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } finally {
      setBusy(null)
    }
  }

  const doImport = async (f: File) => {
    setBusy('Restaurando…')
    try {
      const raw = JSON.parse(await f.text()) as AppData & { __files?: Record<string, string> }
      if (!raw.profile || !Array.isArray(raw.habits)) throw new Error('formato')
      const { __files, ...data } = raw
      for (const [key, url] of Object.entries(__files ?? {})) await putBlob(key, await dataUrlToBlob(url))
      importData(data as AppData)
      toast({ title: 'Copia restaurada', icon: Check, tone: 'info' })
      onClose()
    } catch {
      toast({ title: 'Ese archivo no es una copia válida de Alba', tone: 'warn' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Sheet open={open && !areaEdit} onClose={onClose} title="Ajustes">
        <div className="stack-16">
          <section>
            <h3 className="label-title">Tú</h3>
            <div className="card stack-12">
              <div className="row">
                <button onClick={() => setAvatarOpen((x) => !x)} aria-label="Cambiar avatar">
                  <Avatar size={78} />
                </button>
                <div className="grow stack-8">
                  <input className="input" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} placeholder="¿Cómo te llamo?" aria-label="Nombre corto" />
                  <input className="input" value={profile.fullName} onChange={(e) => setProfile({ fullName: e.target.value })} placeholder="Nombre completo" aria-label="Nombre completo" />
                </div>
              </div>
              <div className="row wrap">
                <AddMedia
                  purpose="avatar"
                  className="media-add inline"
                  label={profile.avatarMedia ? 'Cambiar foto' : 'Usar una foto mía'}
                  onAdded={(m) => {
                    addMedia(m)
                    if (profile.avatarMedia) deleteMedia(profile.avatarMedia)
                    setProfile({ avatarMedia: m.id })
                  }}
                />
                {profile.avatarMedia && (
                  <button
                    className="btn ghost sm"
                    onClick={() => {
                      deleteMedia(profile.avatarMedia!)
                      setProfile({ avatarMedia: undefined })
                    }}
                  >
                    Volver al emoji
                  </button>
                )}
              </div>
              {avatarOpen && <EmojiPicker value={profile.avatar} onChange={(avatar) => setProfile({ avatar })} />}
              <Field label="Tu lema">
                <input className="input" value={profile.motto} onChange={(e) => setProfile({ motto: e.target.value })} />
              </Field>
            </div>
          </section>

          <section>
            <h3 className="label-title">
              <Type size={16} style={{ verticalAlign: '-2px' }} /> Tipografía
            </h3>
            <div className="font-list">
              {FONT_PAIRS.map((f) => {
                const on = profile.font === f.id
                return (
                  <motion.button key={f.id} className={cx('font-opt', on && 'on')} onClick={() => setProfile({ font: f.id as FontId })} whileTap={{ scale: 0.98 }}>
                    <span className="fo-sample" style={{ fontFamily: f.display, fontWeight: f.displayWeight, fontSize: `${2 * f.displayScale}rem` }}>
                      Aa
                    </span>
                    <span className="grow">
                      <span className="fo-name" style={{ display: 'block', fontFamily: f.display, fontWeight: f.headWeight, fontSize: `${1.15 * f.displayScale}rem`, letterSpacing: f.tracking }}>
                        {f.name}
                      </span>
                      <span className="fo-note" style={{ fontFamily: f.body }}>
                        {f.note}
                      </span>
                    </span>
                    {on && <Check size={20} color="var(--a)" strokeWidth={3} />}
                  </motion.button>
                )
              })}
            </div>
            <div style={{ marginTop: 12 }}>
              <Segmented<TextScale>
                value={profile.textScale}
                onChange={(textScale) => setProfile({ textScale })}
                options={[
                  { value: 'sm', label: 'Letra pequeña' },
                  { value: 'md', label: 'Normal' },
                  { value: 'lg', label: 'Grande' },
                ]}
              />
            </div>
          </section>

          <section>
            <h3 className="label-title">Colores</h3>
            <div className="card stack-12">
              <Segmented<ThemeMode>
                value={profile.theme}
                onChange={(theme) => setProfile({ theme })}
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'light', label: 'Claro' },
                  { value: 'dark', label: 'Oscuro' },
                ]}
              />
              <div className="swatches">
                {ACCENTS.map((a) => (
                  <button key={a.v} className={cx('swatch', profile.accent === a.v && 'on')} style={{ background: a.color }} onClick={() => setProfile({ accent: a.v })} aria-label={a.label} title={a.label} />
                ))}
              </div>
            </div>
          </section>

          <section>
            <h3 className="label-title">Preferencias</h3>
            <div className="list">
              <div className="list-item">
                <span className="grow li-title">Sonidos y vibración</span>
                <Toggle on={profile.sound} onChange={(sound) => setProfile({ sound })} label="Sonidos" />
              </div>
              <div className="list-item">
                <span className="grow">
                  <span className="li-title">Mi día empieza a las</span>
                  <span className="li-sub">Lo que hagas antes cuenta para el día anterior</span>
                </span>
                <Stepper value={profile.dayStartHour} min={0} max={8} suffix="h" onChange={(dayStartHour) => setProfile({ dayStartHour })} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="label-title">Áreas de vida</h3>
            <div className="list">
              {areas.map((a) => (
                <button key={a.id} className="list-item" onClick={() => setAreaEdit(a)}>
                  <span className="emoji-tile" style={{ background: `color-mix(in oklab, ${a.color} 20%, var(--surface))` }}>
                    {a.emoji}
                  </span>
                  <span className="grow li-title">{a.name}</span>
                  <span style={{ width: 14, height: 14, borderRadius: 99, background: a.color }} />
                </button>
              ))}
              <button className="list-item" onClick={() => setAreaEdit({ id: '', name: '', emoji: '⭐️', color: AREA_COLORS[areas.length % AREA_COLORS.length] })}>
                <span className="emoji-tile">
                  <Plus size={18} />
                </span>
                <span className="grow li-title">Añadir área</span>
              </button>
            </div>
          </section>

          <section>
            <h3 className="label-title">Tus datos</h3>
            <div className="card small stack-8">
              <p>Todo vive en este iPhone, sin cuentas ni servidores. Exporta una copia de vez en cuando (por ejemplo, a iCloud Drive). Incluye tus fotos.</p>
              {mediaBytes > 0 && (
                <p className="muted">
                  Fotos y videos: {formatBytes(mediaBytes)}. La compresión te ha ahorrado {formatBytes(savedBytes)}.
                </p>
              )}
            </div>
            <div className="grid-2" style={{ marginTop: 10 }}>
              <button className="btn soft" onClick={doExport} disabled={!!busy}>
                <Download size={17} /> Exportar
              </button>
              <button className="btn soft" onClick={() => file.current?.click()} disabled={!!busy}>
                <Upload size={17} /> Importar
              </button>
            </div>
            {busy && <p className="small muted center" style={{ marginTop: 8 }}>{busy}</p>}
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
          </section>

          <section>
            <h3 className="label-title">Instalar en tu iPhone</h3>
            <div className="card small">
              Abre Alba en <b>Safari</b>, toca <Share size={13} style={{ verticalAlign: '-2px' }} /> <b>Compartir</b> y elige <b>Añadir a pantalla de inicio</b>. Se abrirá a pantalla completa y funcionará sin conexión.
            </div>
          </section>

          <button
            className="btn danger block"
            onClick={() => {
              if (resetStep < 2) return setResetStep(resetStep + 1)
              resetAll()
              setResetStep(0)
              onClose()
            }}
          >
            <Trash2 size={16} /> {['Borrar todos los datos', '¿Seguro? No se puede deshacer', 'Toca otra vez para borrar todo'][resetStep]}
          </button>
          <p className="tiny muted center">Alba · hecha para {profile.fullName || profile.name}</p>
        </div>
      </Sheet>

      <AreaEditor area={areaEdit} onClose={() => setAreaEdit(null)} onSave={upsertArea} onDelete={deleteArea} canDelete={areas.length > 1} />
    </>
  )
}

function AreaEditor({ area, onClose, onSave, onDelete, canDelete }: { area: Area | null; onClose: () => void; onSave: (a: Area) => void; onDelete: (id: string) => void; canDelete: boolean }) {
  const [a, setA] = useState<Area | null>(null)
  useEffect(() => setA(area), [area])
  return (
    <Sheet
      open={!!area}
      onClose={onClose}
      title={area?.id ? 'Editar área' : 'Nueva área'}
      footer={
        <button
          className="btn primary block"
          disabled={!a?.name.trim()}
          onClick={() => {
            if (a) onSave({ ...a, id: a.id || uid(), name: a.name.trim() })
            onClose()
          }}
        >
          Guardar
        </button>
      }
    >
      {a && (
        <div className="stack-12">
          <input className="input big" placeholder="Creatividad" value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} />
          <div className="swatches">
            {AREA_COLORS.map((c) => (
              <button key={c} className={cx('swatch', a.color === c && 'on')} style={{ background: c }} onClick={() => setA({ ...a, color: c })} aria-label={c} />
            ))}
          </div>
          <EmojiPicker value={a.emoji} onChange={(emoji) => setA({ ...a, emoji })} />
          {a.id && canDelete && (
            <button
              className="btn danger block"
              onClick={() => {
                onDelete(a.id)
                onClose()
              }}
            >
              <Trash2 size={16} /> Eliminar área (sus hábitos pasan a otra)
            </button>
          )}
        </div>
      )}
    </Sheet>
  )
}
