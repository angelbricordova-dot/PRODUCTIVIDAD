# Alba — tu vida, nivel a nivel

App personal de productividad para **Alejandro Gabriel Lamont Bencomo**. Junta hábitos, diario (bullet journal), relaciones y metas en un solo lugar, y lo convierte en un juego: cada paso pequeño da XP y monedas, subes de nivel y canjeas las monedas por recompensas que eliges tú.

Es una PWA pensada para instalarse en la pantalla de inicio del iPhone. Funciona sin conexión y los datos viven en el dispositivo.

## Qué incluye

| Sección | Funciones |
|---|---|
| **Hoy** | Cielo animado con Alba, la mascota (un sol que sonríe más cuanto más avanzas; de noche, una luna dormida). Racha, monedas y nivel; deslizador de ánimo con cara animada; rituales de mañana, tarde y noche; misiones diarias; respirar y enfoque. |
| **Modo ritual** | Recorre los hábitos pendientes uno a uno, con temporizador y confeti al terminar. |
| **Hábitos y Metas** | Plantillas, frecuencia diaria, por días o N veces por semana, contadores, dificultad, disparador y "mi porqué". Mapa de calor, rachas, corrección de días pasados y **foto como prueba**. Metas con hitos en la misma pestaña. |
| **Diario** | Intención, ánimo con deslizador, **momentos con fotos y videos**, 3 gratitudes, bitácora tipo Bullet Journal, reflexión guiada y revisión semanal. |
| **Gente** | Cada cuánto quieres hablar con cada persona, quién "toca" contactar, cumpleaños, notas, historial y **foto de cada persona**. |
| **Yo** | Ficha de jugador con tu foto, nivel, títulos, radar de áreas de vida, XP, constancia, 26 logros y tienda de recompensas. |
| **Ajustes** | **8 tipografías** con vista previa, tamaño de letra, tema claro/oscuro/auto, 6 colores, foto de perfil, áreas editables, sonidos y copia de seguridad (incluye fotos). |

### Fotos y videos

- Cada foto se **comprime en el iPhone** antes de guardarse: se redimensiona (1600 px los momentos, 1280 px las pruebas, 512 px los avatares) y se re-codifica en WebP o JPEG. Una foto de 4032×3024 pasa de unos 600 KB a unos 50 KB.
- Los videos se guardan tal cual, hasta 60 segundos y 80 MB, con portada generada. Safari no permite recomprimir video de forma fiable en el navegador.
- Todo vive en IndexedDB del dispositivo. No se sube nada a ningún servidor.

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

Stack: React 19, TypeScript, Vite, Zustand (persistido en IndexedDB), Framer Motion y vite-plugin-pwa. El sistema visual está en `DESIGN.md` y el producto en `PRODUCT.md`.

```
src/
  store/        estado, tipos y acciones (único punto que escribe datos)
  lib/          motor de juego: niveles, rachas, misiones, logros, fechas
  components/   piezas reutilizables (hojas, anillos, gráficos, cielo…)
  screens/      Hoy, Hábitos (+Metas), Diario, Gente, Yo, Bienvenida
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
