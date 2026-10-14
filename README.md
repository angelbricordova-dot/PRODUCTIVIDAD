# Alba — tu vida, nivel a nivel

App personal de productividad para **Alejandro Gabriel Lamont Bencomo**. Junta hábitos, diario (bullet journal), finanzas, relaciones y metas en un solo lugar, y lo convierte en un juego: cada paso pequeño da XP y monedas, subes de nivel y canjeas las monedas por recompensas que eliges tú.

Es una PWA pensada para instalarse en la pantalla de inicio del iPhone. Funciona sin conexión y los datos viven en el dispositivo.

## Qué incluye

| Sección | Funciones |
|---|---|
| **Hoy** | Cielo animado según la hora (amanecer, día, atardecer, noche), nivel y XP, racha, % del día, monedas. Misiones diarias, rituales de mañana, tarde y noche, accesos rápidos (ánimo, respirar, enfoque, gasto, hábito), frase del día y día de descanso. |
| **Modo ritual** | Al estilo Fabulous: recorre los hábitos pendientes uno a uno, con temporizador si tienen duración y confeti al terminar. |
| **Hábitos** | Plantillas por área, frecuencia diaria, por días o N veces por semana, contadores (vasos, páginas…), dificultad (más XP), disparador "después de…" y "mi porqué". Mapa de calor, rachas, % a 30 días, corrección de días pasados, pausar y ordenar. |
| **Diario** | Intención del día, ánimo con etiquetas (estilo Daylio), 3 gratitudes, bitácora tipo Bullet Journal (• tarea, ○ evento, – nota, ✱ prioridad, migrar a mañana), reflexión con pregunta guía y revisión semanal. |
| **Vida → Dinero** | Balance del mes, ingresos y gastos, teclado rápido para registrar, presupuesto por categoría (estilo YNAB), metas de ahorro con aportes, días sin gastar y tasa de ahorro. |
| **Vida → Gente** | CRM personal: con qué frecuencia quieres hablar con cada persona, quién "toca" contactar, cumpleaños cercanos, notas e historial de llamadas, mensajes y encuentros. |
| **Vida → Metas** | Metas con hitos, fecha objetivo, área y porqué (+40 XP por hito, +200 por meta). |
| **Calma** | Respiración guiada (caja 4·4·4·4, 4·7·8, coherencia 5·5) y temporizador de enfoque tipo Pomodoro. |
| **Yo** | Nivel y títulos (Semilla → Leyenda), radar de áreas de vida (tu "personaje"), XP por día, mapa de constancia, 27 logros, tienda de recompensas, historial y ajustes. |
| **Ajustes** | Nombre, avatar, lema, tema claro/oscuro/auto, 6 colores de acento, sonidos, hora de inicio del día, moneda, áreas de vida editables, exportar e importar copia de seguridad. |

## Decisiones de diseño (lo aprendido de otras apps)

- **Sin castigos (contra el error de Habitica).** La XP nunca baja. No hay "vida" que perder.
- **"Nunca falles dos veces" (contra la ansiedad de racha de Duolingo).** Un fallo cada 7 días no rompe la racha; dos seguidos, sí. Además hay días de descanso.
- **Rituales y no listas (Fabulous).** Los hábitos se agrupan por momento del día y se pueden hacer en modo guiado.
- **Calidez visual (Headspace).** Paleta de amanecer, tipografía suave (Fraunces + Figtree), cielo ilustrado y animaciones con muelle.
- **Recompensas reales.** Las monedas se gastan en cosas que tú defines, no en objetos virtuales.
- **Tus datos son tuyos.** Sin cuentas ni servidores; exporta tu copia cuando quieras (las apps que pierden la racha al reinstalar son una de las quejas más comunes).
- **Se siente nativa en iPhone.** Áreas seguras, sin zoom en los campos, sin destello al tocar, hojas que se arrastran, sonido pentatónico al completar y háptica en iOS 18+.

## Desarrollo

```bash
npm install
npm run dev        # servidor local (también accesible desde el móvil por IP)
npm test           # pruebas del motor de juego (niveles, rachas, fechas)
npm run build      # compila a dist/
```

Stack: React 19, TypeScript, Vite, Zustand (persistido en IndexedDB), Framer Motion y vite-plugin-pwa.

```
src/
  store/        estado, tipos y acciones (único punto que escribe datos)
  lib/          motor de juego: niveles, rachas, misiones, logros, fechas
  components/   piezas reutilizables (hojas, anillos, gráficos, cielo…)
  screens/      Hoy, Hábitos, Diario, Vida, Yo, Bienvenida
  styles/       sistema visual con tokens (claro/oscuro y acentos)
```

El esquema de datos tiene versión (`SCHEMA_VERSION` en `src/store/index.ts`) con un punto de migración, así que se puede ampliar sin perder lo que ya tienes guardado.

## Publicar en Vercel

1. Entra en [vercel.com/new](https://vercel.com/new) e importa este repositorio.
2. Vercel detecta Vite solo (`vercel.json` ya trae el comando de compilación, la carpeta `dist` y las reglas para la PWA).
3. Pulsa **Deploy**.

## Instalar en el iPhone

1. Abre la URL de Vercel en **Safari**.
2. Toca **Compartir** → **Añadir a pantalla de inicio**.
3. Ábrela desde el icono: pantalla completa, funciona sin conexión y los datos quedan protegidos.

> Consejo: de vez en cuando exporta una copia desde **Yo → Ajustes → Exportar** y guárdala en iCloud Drive.

## Ideas para siguientes versiones

- Sincronización entre dispositivos (por ejemplo, con Supabase) manteniendo el modo local.
- Recordatorios con notificaciones push (iOS 16.4+ en apps instaladas).
- Widgets de pantalla de inicio y atajos de Siri.
- Desafíos de varios días ("viajes") al estilo Fabulous.
