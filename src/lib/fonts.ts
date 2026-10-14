// Parejas tipográficas que el usuario puede elegir en Ajustes.
// Cada fuente se descarga solo cuando se elige (import dinámico) y luego queda en caché offline.

import type { FontId } from '../store/types'

export interface FontPair {
  id: FontId
  name: string
  note: string
  display: string
  body: string
  displayWeight: number
  /** Peso de títulos de sección (algunas fuentes solo tienen un peso). */
  headWeight: number
  tracking: string
  /** Ajuste óptico: algunas fuentes se ven más grandes o pequeñas a igual tamaño. */
  displayScale: number
  load: () => Promise<unknown>
}

const SYSTEM = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"

export const FONT_PAIRS: FontPair[] = [
  {
    id: 'alba',
    name: 'Alba',
    note: 'Redonda y alegre, con cuerpo limpio',
    display: "'Fredoka Variable', 'Fredoka', ui-rounded, " + SYSTEM,
    body: "'Figtree Variable', 'Figtree', " + SYSTEM,
    displayWeight: 600,
    headWeight: 600,
    tracking: '-0.01em',
    displayScale: 1,
    load: () => Promise.all([import('@fontsource-variable/fredoka'), import('@fontsource-variable/figtree')]),
  },
  {
    id: 'retro',
    name: 'Retro',
    note: 'Cursiva gruesa de los 70, muy de juego',
    display: "'Shrikhand', 'Rubik Variable', " + SYSTEM,
    body: "'Rubik Variable', 'Rubik', " + SYSTEM,
    displayWeight: 400,
    headWeight: 400,
    tracking: '0em',
    displayScale: 0.9,
    load: () => Promise.all([import('@fontsource/shrikhand'), import('@fontsource-variable/rubik')]),
  },
  {
    id: 'moderna',
    name: 'Moderna',
    note: 'Grotesca con carácter, ancha en los títulos',
    display: "'Bricolage Grotesque Variable', " + SYSTEM,
    body: "'Bricolage Grotesque Variable', " + SYSTEM,
    displayWeight: 750,
    headWeight: 700,
    tracking: '-0.03em',
    displayScale: 1,
    load: () => import('@fontsource-variable/bricolage-grotesque'),
  },
  {
    id: 'redonda',
    name: 'Redonda',
    note: 'Suave de principio a fin',
    display: "'Nunito Variable', 'Nunito', ui-rounded, " + SYSTEM,
    body: "'Nunito Variable', 'Nunito', ui-rounded, " + SYSTEM,
    displayWeight: 850,
    headWeight: 800,
    tracking: '-0.015em',
    displayScale: 1,
    load: () => import('@fontsource-variable/nunito'),
  },
  {
    id: 'clasica',
    name: 'Clásica',
    note: 'Serifa cálida para un diario de papel',
    display: "'Young Serif', Georgia, serif",
    body: "'Onest Variable', 'Onest', " + SYSTEM,
    displayWeight: 400,
    headWeight: 400,
    tracking: '-0.015em',
    displayScale: 0.94,
    load: () => Promise.all([import('@fontsource/young-serif'), import('@fontsource-variable/onest')]),
  },
  {
    id: 'geometrica',
    name: 'Geométrica',
    note: 'Ancha y contundente, tipo videojuego',
    display: "'Unbounded Variable', 'Unbounded', " + SYSTEM,
    body: "'Manrope Variable', 'Manrope', " + SYSTEM,
    displayWeight: 600,
    headWeight: 600,
    tracking: '-0.02em',
    displayScale: 0.82,
    load: () => Promise.all([import('@fontsource-variable/unbounded'), import('@fontsource-variable/manrope')]),
  },
  {
    id: 'mano',
    name: 'A mano',
    note: 'Títulos escritos a mano, como tu libreta',
    display: "'Caveat Variable', 'Caveat', cursive",
    body: "'Figtree Variable', 'Figtree', " + SYSTEM,
    displayWeight: 700,
    headWeight: 700,
    tracking: '0em',
    displayScale: 1.22,
    load: () => Promise.all([import('@fontsource-variable/caveat'), import('@fontsource-variable/figtree')]),
  },
  {
    id: 'iphone',
    name: 'iPhone',
    note: 'La letra del sistema (SF Rounded). No descarga nada',
    display: 'ui-rounded, ' + SYSTEM,
    body: SYSTEM,
    displayWeight: 700,
    headWeight: 650,
    tracking: '-0.02em',
    displayScale: 1,
    load: () => Promise.resolve(),
  },
]

export const TEXT_SCALES = { sm: 15, md: 16, lg: 17.5 } as const

export function fontPair(id: FontId | undefined): FontPair {
  return FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[0]
}

/** Aplica la pareja al documento. Las variables CSS cambian al instante; la fuente llega cuando termina de descargarse. */
export function applyFont(id: FontId | undefined, scale: keyof typeof TEXT_SCALES = 'md') {
  const f = fontPair(id)
  const root = document.documentElement.style
  root.setProperty('--font-display', f.display)
  root.setProperty('--font-body', f.body)
  root.setProperty('--display-weight', String(f.displayWeight))
  root.setProperty('--head-weight', String(f.headWeight))
  root.setProperty('--display-tracking', f.tracking)
  root.setProperty('--display-scale', String(f.displayScale))
  document.documentElement.style.fontSize = `${TEXT_SCALES[scale] ?? 16}px`
  return f.load().catch(() => undefined)
}

/** Carga todas para la vista previa de Ajustes. */
export function preloadAllFonts() {
  return Promise.all(FONT_PAIRS.map((f) => f.load().catch(() => undefined)))
}
