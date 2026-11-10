---
name: diseno
description: Sistema de diseño de Teoría Musical (colores, tipografía, espacios, componentes y movimiento tipo iOS con resortes). Úsala SIEMPRE antes de crear o cambiar cualquier pantalla, componente, ejercicio o animación de la app, y actualízala cuando el usuario apruebe un cambio de estilo.
---

# Diseño de Teoría Musical

App para aprender música **desde el celular** (el usuario usa Android; pensar también en iPhone).
Objetivo: que se vea limpia y que **se sienta bien al tacto**, como una app nativa de iOS:
todo responde al instante, se hunde al tocarlo y se mueve con resortes, nunca con animaciones lineales.

> Esta skill crece con la app. Cuando el usuario apruebe un estilo nuevo («me gusta así»,
> «agrega a la skill que…»), anótalo aquí en la sección que toque y en el **Registro** del final.

## 1. Principios

1. **Mobile-first**: se diseña a 375 px y luego se amplía (`sm:`). Nada depende de hover ni de teclado.
2. **Una acción principal por pantalla**: el botón grande negro de abajo (`BarraAccion`).
3. **Calma**: fondo claro, mucho espacio, tipografía grande. El color se usa para guiar, no para decorar.
4. **El error no castiga**: los fallos usan ámbar (no rojo) y siempre explican la respuesta.
5. **Respuesta inmediata**: todo lo tocable reacciona en el mismo frame (se hunde) y el sonido sale enseguida.

## 2. Tokens

### Color
| Uso | Valor |
|---|---|
| Fondo de página | `#fafafa` (también en cabeceras pegajosas: `bg-[#fafafa]/95 backdrop-blur`) |
| Superficie (tarjetas) | `bg-white` + `border border-zinc-200` |
| Texto principal | `#18181b` (`text-zinc-900`) |
| Texto secundario | `text-zinc-500` / `text-zinc-600` en párrafos |
| Acción principal | `bg-zinc-900 text-white`; desactivado `bg-zinc-300 text-zinc-500` |
| Acierto | `bg-emerald-50 text-emerald-900`, botón `bg-emerald-600` |
| Error / pista | `bg-amber-50 text-amber-900` (nunca rojo) |
| Nota marcada en el piano | ámbar (`bg-amber-200` blancas, `bg-amber-500` negras); tecla pulsada: azul cielo |
| Acento de módulo | `acento` en `src/content/modulos.js` (p. ej. M1 `#0ea5e9`) |

**Contraste**: el acento puro sirve para barras, puntos y bordes. Si lleva **texto blanco encima**
(tarjeta destacada, número del módulo) usa el acento oscurecido:
`color-mix(in oklab, ACENTO 72%, black)` → helper **`oscuro()`** de `src/ui/color.js`. Objetivo ≥ 4.5:1.
También para **texto de color** sobre blanco (p. ej. «Nivel 1», «Módulo 1»): `oscuro(acento)`, nunca el acento puro.
Fondo suave de iconos: **`claro(acento)`** (acento al 14 % sobre blanco).
Grises: `text-zinc-500` es el más claro permitido para texto que hay que leer; `text-zinc-400` solo decorativo (p. ej. `›`).

### Tipografía
- Fuente: Inter / system-ui (`--font-sans` en `src/index.css`).
- Título de página: `text-4xl font-bold tracking-tight` (Inicio) o `text-3xl` (otras).
- Título de paso: `text-2xl font-bold leading-tight tracking-tight sm:text-4xl`.
- Sección: `text-2xl font-bold tracking-tight`.
- Cuerpo: `text-lg leading-relaxed text-zinc-600`. Mínimo `text-base` en lo que hay que leer; `text-sm` solo para datos secundarios. **Nunca `text-xs`.**
- Etiquetas pequeñas en mayúsculas: `text-sm font-semibold uppercase tracking-wider`.

### Espacio y forma
- Contenedor: `mx-auto max-w-2xl px-5`. Separación entre secciones `gap-10`; dentro de una sección `gap-4`; dentro de una tarjeta `gap-3`/`gap-4`.
- Esquinas: tarjetas `rounded-3xl`, botones `rounded-2xl`, chips `rounded-full`, iconos de tarjeta `rounded-2xl size-12`.
- Barras de progreso: componente **`BarraProgreso`** (`h-2.5`–`h-3`, carril `bg-zinc-200` o `bg-zinc-100` dentro de tarjetas blancas; `h-1.5` para mini barras dentro de una tarjeta).
- Deja espacio abajo (`pb-64`) en pantallas con `BarraAccion` fija.

### Tamaño táctil
- Todo lo tocable mide **al menos 44 × 44 px**: botón principal `min-h-14`, tarjetas `min-h-20`, botones de icono `size-11`.
- Separación mínima de 8 px entre controles.
- `touch-action: manipulation` en botones (ya lo pone `Pulsable`) para que no haya retraso por doble toque.

## 3. Movimiento (tipo iOS)

Librería: **`motion`** (Framer Motion), `import { motion } from 'motion/react'`.
Presets en **`src/ui/movimiento.js`**; no inventes valores sueltos, usa estos:

| Resorte | Para | Valores |
|---|---|---|
| `RESORTE.pulsar` | respuesta al dedo (botones, tarjetas) | stiffness 600, damping 32, mass 0.6 |
| `RESORTE.suave` | paneles que aparecen, barras de progreso, listas | stiffness 320, damping 30 |
| `RESORTE.pantalla` | cambio de pantalla o de paso | stiffness 380, damping 36, mass 0.9 |

Presets de entrada (también en `movimiento.js`):
- **`ENTRA_DERECHA`**: algo nuevo dentro de un paso (pregunta, ronda) entra desde la derecha: `<motion.div key={r} {...ENTRA_DERECHA}>`.
- **`SUBE`**: aparece subiendo 16 px (botón o panel que se desbloquea).
- **`SALTO`**: celebración `scale: [1, 1.05, 1]`: `animate={ok ? SALTO : { scale: 1 }}` (opción correcta, casilla ✓, «Lo hice»).

Reglas:
1. **Todo lo tocable se hunde**: usa **`<Pulsable>`** (`src/ui/Pulsable.jsx`) en lugar de `<button>`/`<a>`.
   `tipo="boton"` se hunde a 0.96; `tipo="tarjeta"` a 0.98 (superficies grandes). No uses `active:scale-*` de Tailwind.
2. **Pantallas**: `App.jsx` las anima con `AnimatePresence`. Al avanzar (más profundo: Inicio → Módulo → Lección)
   la nueva entra desde la derecha; al volver, desde la izquierda. La profundidad de cada ruta está en `profundidad()`.
3. **Pasos de lección**: cada paso entra desde la derecha (`x: 40 → 0`) con `RESORTE.pantalla`.
4. **Feedback** (acierto/error): sube 16 px y crece de 0.98 a 1 con `RESORTE.suave`. El título va en su propia línea.
5. **Barras de progreso**: usa `BarraProgreso` (`src/ui/BarraProgreso.jsx`). Por defecto se llena desde 0 al aparecer
   (resorte suave, 200 ms de retraso); con `alAparecer={false}` solo anima los cambios (cabeceras de lección/entrenador).
6. **Listas**: entrada escalonada con las variantes `lista` / `itemLista` (40 ms entre elementos). Solo al entrar a la pantalla.
7. **Celebraciones**: lección completada → resorte con rebote (damping ~16) en el icono. Respuesta correcta en el
   entrenador → la opción correcta da un «salto» (`scale: [1, 1.05, 1]`). Días de la racha → aparecen uno tras otro con
   `RESORTE.pulsar`. Con moderación: nada que se repita en bucle.
7b. **Preguntas del entrenador**: cada pregunta nueva entra desde la derecha como un paso de lección; el teclado de
   repaso sube 16 px con `RESORTE.suave`. Colores de estado (opciones, puntos de la ventana) cambian con un fundido de 200–250 ms.
8. Anima **solo `transform` y `opacity`** (y `width` en barras finas). Nada de animar `height` de bloques grandes ni sombras.
9. Duración percibida: respuestas al dedo < 150 ms, transiciones < 400 ms. Nada debe hacer esperar al usuario.
10. **Reducir movimiento**: `App.jsx` envuelve todo en `<MotionConfig reducedMotion="user">`, así que si el teléfono
    pide reducir movimiento se quitan desplazamientos y escalas y solo quedan fundidos. Para animaciones CSS, añade
    su regla en `@media (prefers-reduced-motion: reduce)` de `src/index.css`.
11. No uses vibración (`navigator.vibrate`): no funciona en iPhone y el usuario no la necesita.

## 4. Componentes

- **`BarraAccion`** (`pages/Leccion.jsx`, también en Oído): barra fija abajo con feedback + ayuda + botón grande. Respeta `env(safe-area-inset-bottom)`.
- **Cabecera de lección/entrenador**: pegajosa, botón ✕ (`Pulsable`, `size-11`), `BarraProgreso alAparecer={false}` con el acento, contador `tabular-nums`.
- **`Volver`** (`src/ui/Volver.jsx`): enlace «‹ Inicio» de arriba en pantallas de nivel 1 (Módulo, panel de Oído). Área de 44 px y se hunde.
- **Pantalla tipo lista** (Inicio, Módulo, panel de Oído, portada del entrenador): `motion.main` con `variants={lista}` y cada bloque con `variants={itemLista}`.
- **Chips seleccionables** (niveles, dirección): `Pulsable` `min-h-12 border-2`; activo `bg-zinc-900 text-white`, inactivo `bg-white border-zinc-200`.
- **Tarjeta de navegación**: `Pulsable tipo="tarjeta"`, `rounded-3xl border bg-white`, icono `size-12 rounded-2xl` a la izquierda, título `text-lg font-semibold`, subtítulo `text-sm text-zinc-500`, `›` gris a la derecha.
- **Tarjeta destacada** (siguiente lección): fondo = acento oscurecido, texto blanco, botón blanco dentro.
- **Contenido futuro** ("Próximamente"): muchos elementos → lista compacta dentro de un recuadro con borde punteado (Inicio);
  pocos (una lección dentro de un módulo) → tarjeta con `border-dashed border-zinc-300` sin `›` y texto `zinc-500`.
- **Lección a medias**: mini `BarraProgreso` (`h-1.5 w-24`) bajo «Continuar donde lo dejaste».
- **Piano** (`components/Piano.jsx`): Pointer Events, `touch-action: none`, `compacto` en lecciones, 1 octava con ◀ ▶ en < 560 px.
- **Opciones de respuesta**: `min-h-16 rounded-2xl border-2`, en rejilla de 2 (o 3 si hay > 4). En lecciones son `Pulsable tipo="tarjeta"` y la correcta da un `SALTO`.
- **Rondas** (`components/exercises/Rondas.jsx`): puntos de progreso de un ejercicio; la ronda actual crece en vertical con `RESORTE.pulsar`, el color cambia con fundido.
- **Mini Piano Roll** (`components/PianoRoll.jsx`): tarjeta `rounded-3xl` con teclado a la izquierda (`w-14`, filas negras `bg-zinc-800`), números de tiempo arriba, líneas más marcadas cada tiempo, filas de teclas negras en `bg-zinc-100`. Notas = acento del módulo, más claras cuanta menos velocity (`color-mix`), aparecen con `RESORTE.pulsar`; las notas guía («fantasma») son contornos punteados grises (verdes al resolver). Filas `h-10` si hay ≤ 6, `h-8` si hay más. Las casillas miden ~35 × 32 px: excepción aceptada, como las teclas del piano (es una rejilla para arrastrar, no botones sueltos). Botón «Reproducir» como `BotonSonido`; el cabezal es una columna azul que avanza por casillas (sin animación: funciona igual con «reducir movimiento»). Selector de nombres «Esta app / FL Studio»: control segmentado `bg-zinc-100 p-1`, opción activa `bg-white shadow-sm`.
- **`useSobreBarra(ref)`** (`src/ui/useSobreBarra.js`): si la barra inferior crece y tapa el piano o el roll, desplaza la página lo justo. Úsalo en cualquier elemento interactivo que viva cerca de la barra.

## 5. Evitar

- Gradientes por defecto, glassmorphism, sombras grandes, todo centrado, decoración sin función.
- Rojo para errores, textos grises demasiado claros (`text-zinc-400` solo para elementos decorativos o desactivados).
- Animaciones lineales (`ease-linear`) o largas; animar al hacer scroll.
- Enlaces o botones con área táctil menor de 44 px (p. ej. "‹ Inicio" solo texto).

## 6. Cómo comprobar

1. `npm run build` sin errores.
2. Captura a 375 × 740 (y 768 px) con Playwright de las pantallas tocadas; revisa contraste, espacios y que nada quede bajo la barra inferior.
3. Prueba con `reducedMotion: 'reduce'` en Playwright (`page.emulateMedia({ reducedMotion: 'reduce' })`) que la app sigue funcionando.

## 7. Pendiente (de la revisión de diseño)

- Emojis como iconos (👂 🎯 🎹 ↕️): valorar iconos propios sencillos más adelante.
- Las filas del teclado del Piano Roll son `<button>` con `onPointerDown` (sonido inmediato, como teclas); no se hunden a propósito.

## Registro de decisiones

- 2026-11-10: Lección 1.4 y **mini Piano Roll** táctil (ver componentes). Todos los ejercicios pasan a `Pulsable` + `motion` (`ENTRA_DERECHA`, `SUBE`, `SALTO`, `Rondas`); se elimina la animación CSS `animate-entrada`. Pantalla final de lección con entrada escalonada del resumen. Hook `useSobreBarra` compartido por Piano y Piano Roll.

- 2026-11-10: Módulo y Entrenamiento de oído con la skill: `Volver`, `BarraProgreso`, helpers `oscuro`/`claro` en `src/ui/color.js`, entrada escalonada, opciones con `Pulsable` y salto de la correcta, días de racha que aparecen uno a uno, mini barra en lecciones a medias. Prohibido `text-xs`; texto de color con `oscuro()`. Feedback de oído absoluto: «Era Sol. Elegiste Do. Sonó Sol4 (392 Hz).».
- 2026-11-10: Se crea la skill. Movimiento con `motion` y resortes, `Pulsable`, transiciones entre pantallas y pasos, contraste del acento oscurecido, "Próximamente" compacto en Inicio.
