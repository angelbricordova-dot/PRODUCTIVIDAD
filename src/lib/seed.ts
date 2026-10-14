import type { Area, FinanceCategory, Habit, Reward, TimeOfDay, Difficulty, Schedule } from '../store/types'

export const DEFAULT_AREAS: Area[] = [
  { id: 'cuerpo', name: 'Cuerpo', emoji: '💪', color: '#FF8A65' },
  { id: 'mente', name: 'Mente', emoji: '🧠', color: '#9B8CFF' },
  { id: 'calma', name: 'Calma', emoji: '🌿', color: '#5CC8A8' },
  { id: 'finanzas', name: 'Finanzas', emoji: '💰', color: '#F5B841' },
  { id: 'vinculos', name: 'Vínculos', emoji: '💞', color: '#FF7BA9' },
  { id: 'proposito', name: 'Propósito', emoji: '🚀', color: '#4FA8F0' },
]

export interface HabitTemplate {
  name: string
  emoji: string
  areaId: string
  timeOfDay: TimeOfDay
  difficulty: Difficulty
  target?: number
  unit?: string
  minutes?: number
  schedule?: Schedule
  cue?: string
  why?: string
}

export const TEMPLATES: HabitTemplate[] = [
  // Cuerpo
  { name: 'Beber un vaso de agua al despertar', emoji: '💧', areaId: 'cuerpo', timeOfDay: 'morning', difficulty: 1, cue: 'Después de apagar la alarma', why: 'Tu cuerpo lleva 8 horas sin agua.' },
  { name: 'Beber agua', emoji: '🥤', areaId: 'cuerpo', timeOfDay: 'anytime', difficulty: 1, target: 8, unit: 'vasos' },
  { name: 'Entrenar', emoji: '🏋️', areaId: 'cuerpo', timeOfDay: 'afternoon', difficulty: 3, minutes: 45, schedule: { type: 'weekly', times: 4 } },
  { name: 'Caminar 8.000 pasos', emoji: '🚶', areaId: 'cuerpo', timeOfDay: 'anytime', difficulty: 2 },
  { name: 'Estirar', emoji: '🤸', areaId: 'cuerpo', timeOfDay: 'morning', difficulty: 1, minutes: 5 },
  { name: 'Dormir antes de las 23:30', emoji: '😴', areaId: 'cuerpo', timeOfDay: 'evening', difficulty: 2 },
  { name: 'Comer fruta o verdura', emoji: '🥗', areaId: 'cuerpo', timeOfDay: 'anytime', difficulty: 1 },
  { name: 'Tender la cama', emoji: '🛏️', areaId: 'cuerpo', timeOfDay: 'morning', difficulty: 1, cue: 'Al levantarme' },
  // Mente
  { name: 'Leer', emoji: '📚', areaId: 'mente', timeOfDay: 'evening', difficulty: 2, target: 20, unit: 'páginas' },
  { name: 'Aprender inglés', emoji: '🗣️', areaId: 'mente', timeOfDay: 'anytime', difficulty: 2, minutes: 15 },
  { name: 'Sin redes la primera hora', emoji: '📵', areaId: 'mente', timeOfDay: 'morning', difficulty: 2 },
  { name: 'Bloque de trabajo profundo', emoji: '🎯', areaId: 'proposito', timeOfDay: 'morning', difficulty: 3, minutes: 50, schedule: { type: 'days', days: [0, 1, 2, 3, 4] } },
  // Calma
  { name: 'Meditar', emoji: '🧘', areaId: 'calma', timeOfDay: 'morning', difficulty: 2, minutes: 10 },
  { name: 'Escribir en el diario', emoji: '✍️', areaId: 'calma', timeOfDay: 'evening', difficulty: 1 },
  { name: 'Respirar 2 minutos', emoji: '🌬️', areaId: 'calma', timeOfDay: 'afternoon', difficulty: 1, minutes: 2 },
  { name: 'Pantallas fuera 30 min antes de dormir', emoji: '🌙', areaId: 'calma', timeOfDay: 'evening', difficulty: 2 },
  // Finanzas
  { name: 'Registrar gastos del día', emoji: '🧾', areaId: 'finanzas', timeOfDay: 'evening', difficulty: 1 },
  { name: 'Día sin gastos innecesarios', emoji: '🛡️', areaId: 'finanzas', timeOfDay: 'anytime', difficulty: 2 },
  { name: 'Revisar presupuesto', emoji: '📊', areaId: 'finanzas', timeOfDay: 'anytime', difficulty: 1, schedule: { type: 'days', days: [6] } },
  { name: 'Apartar ahorro', emoji: '🐷', areaId: 'finanzas', timeOfDay: 'anytime', difficulty: 2, schedule: { type: 'weekly', times: 1 } },
  // Vínculos
  { name: 'Escribir a alguien que quiero', emoji: '💌', areaId: 'vinculos', timeOfDay: 'anytime', difficulty: 1 },
  { name: 'Llamar a la familia', emoji: '📞', areaId: 'vinculos', timeOfDay: 'evening', difficulty: 2, schedule: { type: 'weekly', times: 2 } },
  { name: 'Tiempo de calidad sin móvil', emoji: '🫶', areaId: 'vinculos', timeOfDay: 'evening', difficulty: 2, schedule: { type: 'weekly', times: 3 } },
  // Propósito
  { name: 'Planear el día', emoji: '🗺️', areaId: 'proposito', timeOfDay: 'morning', difficulty: 1, minutes: 5, why: 'Un día planeado es un día ganado.' },
  { name: 'Avanzar en mi proyecto', emoji: '🚀', areaId: 'proposito', timeOfDay: 'anytime', difficulty: 3, minutes: 30 },
]

export const STARTER = [
  'Beber un vaso de agua al despertar',
  'Tender la cama',
  'Planear el día',
  'Meditar',
  'Entrenar',
  'Leer',
  'Registrar gastos del día',
  'Escribir a alguien que quiero',
  'Escribir en el diario',
]

export const DEFAULT_REWARDS: Reward[] = [
  { id: 'r-serie', name: 'Un episodio de mi serie', emoji: '🍿', cost: 40 },
  { id: 'r-cafe', name: 'Café de especialidad', emoji: '☕️', cost: 80 },
  { id: 'r-juego', name: '1 hora de videojuegos sin culpa', emoji: '🎮', cost: 120 },
  { id: 'r-cena', name: 'Cena en mi sitio favorito', emoji: '🍣', cost: 350 },
  { id: 'r-libre', name: 'Tarde libre total', emoji: '🏖️', cost: 600 },
  { id: 'r-capricho', name: 'Ese capricho que llevo tiempo queriendo', emoji: '🎁', cost: 1500 },
]

export const DEFAULT_CATEGORIES: FinanceCategory[] = [
  { id: 'c-comida', name: 'Comida', emoji: '🍽️', budget: 0, kind: 'expense' },
  { id: 'c-super', name: 'Súper', emoji: '🛒', budget: 0, kind: 'expense' },
  { id: 'c-transporte', name: 'Transporte', emoji: '🚗', budget: 0, kind: 'expense' },
  { id: 'c-casa', name: 'Casa', emoji: '🏠', budget: 0, kind: 'expense' },
  { id: 'c-ocio', name: 'Ocio', emoji: '🎉', budget: 0, kind: 'expense' },
  { id: 'c-salud', name: 'Salud', emoji: '💊', budget: 0, kind: 'expense' },
  { id: 'c-suscripciones', name: 'Suscripciones', emoji: '🔁', budget: 0, kind: 'expense' },
  { id: 'c-ropa', name: 'Ropa', emoji: '👕', budget: 0, kind: 'expense' },
  { id: 'c-educacion', name: 'Educación', emoji: '🎓', budget: 0, kind: 'expense' },
  { id: 'c-regalos', name: 'Regalos', emoji: '🎁', budget: 0, kind: 'expense' },
  { id: 'c-otros', name: 'Otros', emoji: '📦', budget: 0, kind: 'expense' },
  { id: 'i-salario', name: 'Salario', emoji: '💼', budget: 0, kind: 'income' },
  { id: 'i-extra', name: 'Ingreso extra', emoji: '✨', budget: 0, kind: 'income' },
]

export const MOOD_TAGS = [
  'Trabajo', 'Familia', 'Amigos', 'Pareja', 'Ejercicio', 'Descanso', 'Comida',
  'Dinero', 'Salud', 'Estudio', 'Naturaleza', 'Música', 'Logro', 'Estrés', 'Soledad',
]

export const PROMPTS = [
  '¿Qué hizo que hoy valiera la pena?',
  '¿Qué harías distinto si repitieras el día?',
  '¿De qué te sientes orgulloso hoy?',
  '¿Qué te dio energía y qué te la quitó?',
  '¿Qué aprendiste de ti mismo hoy?',
  '¿A quién le debes un gracias?',
  '¿Qué pequeño paso te acerca a la persona que quieres ser?',
  '¿Qué preocupación puedes soltar esta noche?',
  'Si mañana fuera perfecto, ¿cómo empezaría?',
  '¿Qué momento de hoy quieres recordar dentro de un año?',
]

export const QUOTES: [string, string][] = [
  ['No subes al nivel de tus metas, caes al nivel de tus sistemas.', 'James Clear'],
  ['Somos lo que hacemos repetidamente.', 'Will Durant'],
  ['La disciplina es elegir entre lo que quieres ahora y lo que más quieres.', 'Abraham Lincoln (atribuida)'],
  ['Un pequeño paso cada día sigue siendo un paso.', 'Anónimo'],
  ['Nunca falles dos veces.', 'James Clear'],
  ['El mejor momento para plantar un árbol fue hace 20 años. El segundo mejor es ahora.', 'Proverbio chino'],
  ['La motivación te pone en marcha. El hábito te mantiene.', 'Jim Ryun'],
  ['Cuida tus mañanas y tu vida se cuidará sola.', 'Fabulous'],
  ['Lo que se mide, mejora.', 'Peter Drucker'],
  ['Sé paciente contigo. Nada en la naturaleza florece todo el año.', 'Anónimo'],
  ['El éxito es la suma de pequeños esfuerzos repetidos día tras día.', 'Robert Collier'],
  ['Hazlo tan fácil que no puedas decir que no.', 'Leo Babauta'],
]

export function templateToHabit(t: HabitTemplate, id: string, order: number, createdAt: string): Habit {
  return {
    id,
    name: t.name,
    emoji: t.emoji,
    areaId: t.areaId,
    timeOfDay: t.timeOfDay,
    schedule: t.schedule ?? { type: 'daily' },
    target: t.target ?? 1,
    unit: t.unit,
    difficulty: t.difficulty,
    minutes: t.minutes,
    cue: t.cue,
    why: t.why,
    archived: false,
    createdAt,
    order,
  }
}
