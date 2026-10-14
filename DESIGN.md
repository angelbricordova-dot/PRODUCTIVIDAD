# Alba — diseño

Mundo: **Ilustrado juguetón**. Es un juego de bolsillo cálido, en la línea de Headspace y Finch: colores planos con nombre, formas redondas, botones que se hunden al tocarlos y una mascota que reacciona a tu día. Lo eligió el usuario el 14‑oct‑2026.

## Principios visuales

- **Color plano y con nombre.** No hay degradados decorativos. El único degradado está en el cielo, que es una ilustración, y en el carril del ánimo, que es una escala de datos.
- **Táctil.** Los controles principales tienen una base de 3–5 px en el tono profundo de su color. Al pulsarlos bajan (`translateY`) y la base se reduce.
- **Una mascota, un lenguaje.** Alba, el sol con cara, aparece en el cielo de "Hoy", en la bienvenida, en las pantallas vacías y al subir de nivel. El deslizador de ánimo dibuja la misma cara.
- **Sin etiquetas sobre los títulos.** El título habla solo. Los grupos de formularios usan `.label-title` (frase normal, sin mayúsculas).
- **Iconos dibujados para la interfaz.** Se usa lucide con trazo 2.2–2.6. Los emoji solo aparecen en contenido que elige el usuario: hábitos, áreas, recompensas, personas y avatar.

## Paleta (`src/styles/app.css`)

| Rol | Token | Claro | Uso |
|---|---|---|---|
| Mandarina | `--mandarina` | #f26a2e | rachas, acento por defecto, mañana |
| Girasol | `--girasol` | #ffc23d | monedas, tienda, tarde |
| Cielo | `--cielo` | #2f7bf5 | nivel, información |
| Menta | `--menta` | #12a07c | hecho, éxito |
| Chicle | `--chicle` | #f0468e | personas, cariño |
| Uva | `--uva` | #7b5cf5 | noche, calma, logros |

Cada color tiene `-soft` (fondo de bloque) y `-deep` (base táctil). Las clases `.c-<color>` exponen `--c`, `--c-soft` y `--c-deep` a cualquier componente. El suelo es lavanda claro `--paper` (#f3f1fb) y las superficies son blancas. En modo oscuro el suelo es índigo (#13112a) y los `-soft` se oscurecen. El usuario elige el acento entre los seis colores.

## Tipografía

El usuario elige la pareja tipográfica en Ajustes (`src/lib/fonts.ts`). Todo lee `--font-display`, `--font-body`, `--display-weight`, `--head-weight`, `--display-tracking` y `--display-scale`, y el tamaño base se adapta al ajuste de letra (15, 16 o 17,5 px). Los tamaños van en `rem` y los campos de texto nunca bajan de 16 px, para que iOS no haga zoom.

| Id | Títulos | Texto |
|---|---|---|
| alba (por defecto) | Fredoka | Figtree |
| retro | Shrikhand | Rubik |
| moderna | Bricolage Grotesque | Bricolage Grotesque |
| redonda | Nunito | Nunito |
| clasica | Young Serif | Onest |
| geometrica | Unbounded | Manrope |
| mano | Caveat | Figtree |
| iphone | SF Rounded (sistema) | SF (sistema) |

Las fuentes se cargan bajo demanda (import dinámico) y el service worker las guarda en caché con CacheFirst.

## Forma y profundidad

- Radios: tarjetas 24 px, bloques 18 px, píldoras 999.
- Los bloques de estado usan esquinas orgánicas asimétricas (`26px 22px 28px 20px`).
- Profundidad: una sola sombra flotante (`--lift`) para la barra de pestañas, las hojas y el botón flotante. Todo lo demás es plano sobre el suelo.

## Movimiento

- Muelles de framer-motion para la entrada de bloques, el check (relleno, marca y confeti de 12 partículas), el despliegue de rituales, las hojas arrastrables y las celebraciones.
- El rebote (`--spring`, cubic-bezier con sobreimpulso) es intencionado en interruptores, iconos de pestañas y caras: es parte del mundo de juego. No se usa en transiciones de contenido.
- La mascota parpadea, sus rayos giran despacio (40 s por vuelta) y flota 6 px.
- Se respeta `prefers-reduced-motion`.

## Firmas

1. **El cielo de Hoy.** Cambia según la hora (amanecer, día, tarde, atardecer, noche). Alba recorre el arco derecho y sonríe más cuanto más avanzas. De noche es una luna dormida.
2. **El deslizador de ánimo.** La cara cambia de gesto en vivo (cejas, boca, mejillas, lágrima), el color se mezcla en OKLCH, la tarjeta se tiñe, la palabra cambia con desenfoque y el móvil vibra en cada nivel.
3. **Botones de juguete** con base que se hunde.
