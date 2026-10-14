import { useEffect, useRef, useState } from 'react'
import { Download, Upload, Trash2, Plus, Share } from 'lucide-react'
import { useStore, exportData } from '../store'
import { useUI } from '../store/ui'
import type { AccentName, AppData, Area, ThemeMode } from '../store/types'
import { toKey } from '../lib/date'
import { uid, cx } from '../lib/util'
import { EmojiPicker, Field, Segmented, Sheet, Stepper, Toggle } from './ui'

export const ACCENTS: { v: AccentName; label: string; a: string; b: string }[] = [
  { v: 'amanecer', label: 'Amanecer', a: '#ff7a59', b: '#ffb547' },
  { v: 'coral', label: 'Coral', a: '#f2506f', b: '#ff9a62' },
  { v: 'lavanda', label: 'Lavanda', a: '#7d5cff', b: '#e07cf0' },
  { v: 'oceano', label: 'Océano', a: '#3d7bfd', b: '#47c9d4' },
  { v: 'bosque', label: 'Bosque', a: '#23955f', b: '#9ccf5b' },
  { v: 'oro', label: 'Oro', a: '#d98a00', b: '#ffcf4d' },
]

const AREA_COLORS = ['#FF8A65', '#9B8CFF', '#5CC8A8', '#F5B841', '#FF7BA9', '#4FA8F0', '#7BC67E', '#E57373', '#A1887F', '#64B5F6']
const CURRENCIES = ['USD', 'EUR', 'MXN', 'COP', 'VES', 'ARS', 'CLP', 'PEN', 'DOP', 'GBP']

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const profile = useStore((s) => s.profile)
  const areas = useStore((s) => s.areas)
  const setProfile = useStore((s) => s.setProfile)
  const upsertArea = useStore((s) => s.upsertArea)
  const deleteArea = useStore((s) => s.deleteArea)
  const importData = useStore((s) => s.importData)
  const resetAll = useStore((s) => s.resetAll)
  const toast = useUI((s) => s.toast)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [areaEdit, setAreaEdit] = useState<Area | null>(null)
  const [resetStep, setResetStep] = useState(0)
  const file = useRef<HTMLInputElement>(null)

  const doExport = async () => {
    const json = JSON.stringify(exportData(), null, 2)
    const name = `alba-backup-${toKey(new Date())}.json`
    const blob = new Blob([json], { type: 'application/json' })
    const f = new File([blob], name, { type: 'application/json' })
    try {
      if (navigator.canShare?.({ files: [f] })) {
        await navigator.share({ files: [f], title: 'Copia de seguridad de Alba' })
        return
      }
    } catch {
      /* el usuario canceló: seguimos con la descarga */
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  const doImport = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as AppData
      if (!data.profile || !Array.isArray(data.habits)) throw new Error('formato')
      importData(data)
      toast({ title: 'Copia restaurada', emoji: '✅', tone: 'info' })
      onClose()
    } catch {
      toast({ title: 'Ese archivo no es una copia válida de Alba', emoji: '⚠️', tone: 'warn' })
    }
  }

  return (
    <>
      <Sheet open={open && !areaEdit} onClose={onClose} title="Ajustes">
        <div className="stack-12">
          <div className="eyebrow">Perfil</div>
          <div className="card stack-12">
            <div className="row">
              <button className="emoji-tile xl" onClick={() => setAvatarOpen((x) => !x)} aria-label="Cambiar avatar">
                {profile.avatar}
              </button>
              <div className="grow stack-8">
                <input className="input" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} placeholder="¿Cómo te llamo?" aria-label="Nombre corto" />
                <input className="input" value={profile.fullName} onChange={(e) => setProfile({ fullName: e.target.value })} placeholder="Nombre completo" aria-label="Nombre completo" />
              </div>
            </div>
            {avatarOpen && <EmojiPicker value={profile.avatar} onChange={(avatar) => setProfile({ avatar })} />}
            <Field label="Tu lema">
              <input className="input" value={profile.motto} onChange={(e) => setProfile({ motto: e.target.value })} />
            </Field>
          </div>

          <div className="eyebrow" style={{ marginTop: 10 }}>Apariencia</div>
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
                <button
                  key={a.v}
                  className={cx('swatch', profile.accent === a.v && 'on')}
                  style={{ background: `linear-gradient(135deg, ${a.a}, ${a.b})` }}
                  onClick={() => setProfile({ accent: a.v })}
                  aria-label={a.label}
                  title={a.label}
                />
              ))}
            </div>
          </div>

          <div className="eyebrow" style={{ marginTop: 10 }}>Preferencias</div>
          <div className="list">
            <div className="list-item">
              <span className="emoji-tile">🔊</span>
              <span className="grow bold">Sonidos y vibración</span>
              <Toggle on={profile.sound} onChange={(sound) => setProfile({ sound })} label="Sonidos" />
            </div>
            <div className="list-item">
              <span className="emoji-tile">🌗</span>
              <span className="grow">
                <span className="bold" style={{ display: 'block' }}>Mi día empieza a las</span>
                <span className="tiny muted">Lo que hagas antes cuenta para el día anterior</span>
              </span>
              <Stepper value={profile.dayStartHour} min={0} max={8} suffix="h" onChange={(dayStartHour) => setProfile({ dayStartHour })} />
            </div>
            <div className="list-item">
              <span className="emoji-tile">💱</span>
              <span className="grow bold">Moneda</span>
              <select className="select" style={{ width: 110, minHeight: 40, padding: '8px 12px' }} value={profile.currency} onChange={(e) => setProfile({ currency: e.target.value })}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="eyebrow" style={{ marginTop: 10 }}>Áreas de vida</div>
          <div className="list">
            {areas.map((a) => (
              <button key={a.id} className="list-item" onClick={() => setAreaEdit(a)}>
                <span className="emoji-tile" style={{ background: `color-mix(in oklab, ${a.color} 20%, var(--surface))` }}>
                  {a.emoji}
                </span>
                <span className="grow bold">{a.name}</span>
                <span style={{ width: 14, height: 14, borderRadius: 99, background: a.color }} />
              </button>
            ))}
            <button className="list-item" onClick={() => setAreaEdit({ id: '', name: '', emoji: '⭐️', color: AREA_COLORS[areas.length % AREA_COLORS.length] })}>
              <span className="emoji-tile"><Plus size={18} /></span>
              <span className="grow bold">Añadir área</span>
            </button>
          </div>

          <div className="eyebrow" style={{ marginTop: 10 }}>Tus datos</div>
          <div className="card flat small">
            Todo vive en este dispositivo, sin cuentas ni servidores. Exporta una copia de vez en cuando (por ejemplo, a iCloud Drive) para no perder nada.
          </div>
          <div className="grid-2">
            <button className="btn soft" onClick={doExport}>
              <Download size={17} /> Exportar
            </button>
            <button className="btn soft" onClick={() => file.current?.click()}>
              <Upload size={17} /> Importar
            </button>
          </div>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />

          <div className="eyebrow" style={{ marginTop: 10 }}>Instalar en tu iPhone</div>
          <div className="card flat small stack-8">
            <p>
              1. Abre Alba en <b>Safari</b>. 2. Toca <Share size={13} style={{ verticalAlign: '-2px' }} /> <b>Compartir</b>. 3. Elige <b>“Añadir a pantalla de inicio”</b>.
            </p>
            <p className="muted">Se abrirá a pantalla completa, funciona sin conexión y tus datos quedan protegidos.</p>
          </div>

          <button
            className="btn danger block"
            style={{ marginTop: 14 }}
            onClick={() => {
              if (resetStep < 2) return setResetStep(resetStep + 1)
              resetAll()
              setResetStep(0)
              onClose()
            }}
          >
            <Trash2 size={16} /> {['Borrar todos los datos', '¿Seguro? Esto no se puede deshacer', 'Toca una vez más para borrar todo'][resetStep]}
          </button>
          <p className="tiny muted center" style={{ marginTop: 6 }}>
            Alba · hecho con cariño para {profile.fullName || profile.name}
          </p>
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
            <button className="btn danger block" onClick={() => { onDelete(a.id); onClose() }}>
              <Trash2 size={16} /> Eliminar área (sus hábitos pasan a otra)
            </button>
          )}
        </div>
      )}
    </Sheet>
  )
}
