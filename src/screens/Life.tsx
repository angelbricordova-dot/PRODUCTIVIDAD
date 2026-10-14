import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Segmented } from '../components/ui'
import { Finance } from './life/Finance'
import { People } from './life/People'
import { Goals } from './life/Goals'

type Section = 'finanzas' | 'personas' | 'metas'

const TITLES: Record<Section, { title: string; sub: string }> = {
  finanzas: { title: 'Finanzas', sub: 'Tu dinero, con intención' },
  personas: { title: 'Vínculos', sub: 'Cuida a quien te cuida' },
  metas: { title: 'Metas', sub: 'Hacia dónde vas' },
}

export function Life() {
  const [section, setSection] = useState<Section>(() => {
    try {
      return (localStorage.getItem('alba:life') as Section) || 'finanzas'
    } catch {
      return 'finanzas'
    }
  })
  const change = (s: Section) => {
    setSection(s)
    try {
      localStorage.setItem('alba:life', s)
    } catch {
      /* sin almacenamiento */
    }
  }
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{TITLES[section].sub}</div>
          <h1 className="page-title">{TITLES[section].title}</h1>
        </div>
      </div>
      <Segmented
        value={section}
        onChange={change}
        options={[
          { value: 'finanzas', label: '💰 Dinero' },
          { value: 'personas', label: '💞 Gente' },
          { value: 'metas', label: '🏔️ Metas' },
        ]}
      />
      <div style={{ marginTop: 18 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>
            {section === 'finanzas' && <Finance />}
            {section === 'personas' && <People />}
            {section === 'metas' && <Goals />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
