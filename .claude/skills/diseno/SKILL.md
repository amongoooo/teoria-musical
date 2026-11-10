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

### Modo oscuro (Opciones → Apariencia)
La app tiene tema **Claro** (predeterminado), **Oscuro** y **Automático** (sigue al teléfono). Se guarda en
`localStorage` (`teoria-musical:opciones:v1`, `src/progress/opciones.js`) y pone la clase **`dark`** en `<html>`;
`index.html` lo aplica antes de pintar (sin destello) y ajusta `<meta name="theme-color">`.

**Cómo funciona**: `src/index.css` **redefine la paleta** dentro de `.dark` (los `zinc` se invierten,
`white` pasa a ser la superficie oscura `#1c1c1f`, los fondos de estado claros —`emerald-50`, `amber-50`, `sky-50`…—
pasan a tonos oscuros y sus textos `-900` a claros). Así **casi nunca hace falta `dark:`**: escribe las clases
de siempre y cada pareja fondo/texto conserva su contraste. Reglas:
- Fondo de página y cabeceras pegajosas: **`bg-fondo`** (`bg-fondo/95`), nunca `#fafafa` a mano.
- Texto **sobre el acento, `emerald-600`, `sky-500`…** (fondos que no cambian): **`text-blanco`** (blanco fijo),
  no `text-white` (que en oscuro se vuelve oscuro). Botón blanco dentro de una tarjeta de color: `bg-blanco text-negro`.
- Botón principal `bg-zinc-900 text-white`: se deja así (en oscuro queda claro con texto oscuro, como iOS).
- Acento como **color de texto**: **`tinta(acento)`** (`src/ui/color.js`; oscurecido en claro, aclarado en oscuro).
  `oscuro(acento)` es solo para **fondos** con `text-blanco`. `claro(acento)` se mezcla con la superficie del tema.
- Colores en estilos JS: variables (`var(--color-zinc-200)`, `var(--color-white)`), no hex fijos.
- Lo que debe verse **siempre claro** (teclas del Piano, columna de teclas del Piano Roll): clase **`tema-claro`**,
  que restaura la paleta clara en ese bloque.
- Si algo necesita un ajuste solo en oscuro: variante `dark:` (p. ej. opción activa del control segmentado `dark:bg-zinc-300`).
- Al cambiar de tema, los colores pasan con un fundido de 250 ms (clase temporal `cambiando-tema`).

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

## 3b. Gestos (swipe)

**Todos los deslizamientos de la app** usan el hook **`useDeslizar`** (`src/ui/useDeslizar.js`) con las constantes `DESLIZAR` de `movimiento.js`.
El hook no mueve píxeles: devuelve **`progreso`** (MotionValue en «pasos», 0 = en su sitio, ±1 = el vecino ya en su lugar) y la pantalla dibuja la posición continua `índice + progreso`.

1. **Zona muerta REAL** (`zonaMuerta`, 14 px): mientras el dedo o el ratón no se aleje más de eso de donde se apoyó, **no se mueve NADA** (ni una curva suave). Al salir, el movimiento empieza **desde 0**, sin salto.
2. **Barrera del 75 %** (`barrera`, `fuerza`): del 0 al 75 % de la distancia X el contenido sigue al dedo **1:1**; del 75 % al 100 % una fuerza en contra hace que avance cada vez menos que el dedo (la pendiente baja de 1 a 0,2). Se nota que hay una barrera… que se puede pasar.
3. **Al 100 % pasa sin soltar**, y el contenido completa el cambio con `RESORTE.pantalla` (sin salto: el progreso se compensa y se asienta).
4. **Una isla por swipe** (`unaPorGesto`): un mismo gesto nunca se aleja más de un elemento del de partida; si se sigue arrastrando, goma. Para pasar otra hay que soltar y volver a deslizar.
5. **Regreso**: ya pasado, si en el mismo gesto se regresa **1/5 de X** (`retorno`) vuelve al anterior. Ese regreso tiene **su propia zona muerta** (desde el punto donde pasó) y **su barrera del 75 %**.
6. **Gesto rápido**: si se suelta antes de X pero a ≥ `velocidad` (0,45 px/ms) en esa dirección, también pasa (solo uno). Al soltar, lo que quede vuelve o se completa con `RESORTE.pantalla` heredando la velocidad del dedo.
7. **Distancia X**: en pantallas anchas `umbralAncho` (240 px); en el celular `umbralCelular` × ancho (35 %, mínimo 100 px).
8. **Extremos**: si no hay más, resistencia tipo goma (`goma`, se satura en 1/4 de X).
9. **Carrusel continuo**: mientras se arrastra, **todo se mueve con el dedo**: lo que se va se encoge y se desplaza, lo que llega crece y se acerca al centro, interpolando posiciones y tamaños según el progreso (0 → 1). Sin cortes ni cambios de golpe al pasar.
10. Si el gesto empieza más vertical que horizontal, se ignora (deja hacer scroll). El contenedor lleva `touch-action: pan-y`.
11. Tras arrastrar, el «click» de soltar no activa botones.

**Barra de puntitos** (paginador): cuando hay un carrusel abierto (p. ej. una isla), **sube desde abajo** con `RESORTE.pantalla`, fija en la parte inferior y respetando `env(safe-area-inset-bottom)`; al cerrar, baja y se oculta. Píldora blanca `rounded-full border shadow-sm`, un puntito por elemento en celdas de **44 × 56 px** (`DESLIZAR.puntitos.separacion`). Hechos: opacos (`oscuro(acento)`); pendientes: atenuados (acento al 35 %). El del elemento actual mide 16 px y los demás 8 px, y el tamaño **sigue al progreso** del carrusel (crece/encoge con el resorte). **Tocar** un puntito va directo a ese elemento. **Arrastrar** por encima (`useDeslizar` con `sentido: 1`, `unaPorGesto: false`, `anclaExacta: true`, zona muerta 8 px) pasa de uno en uno: entre puntito y puntito se ve la zona muerta y la barrera del 75 %, y pasa al cruzar el siguiente puntito. `touch-action: none` en la barra.

## 4. Componentes

- **Botón de Opciones** (`components/Opciones.jsx`, arriba a la derecha en Inicio): círculo gris `size-11 bg-zinc-200/70` con engranaje; abre la **Hoja** «Opciones». Apariencia = control segmentado de 3 (`grid-cols-3 rounded-2xl bg-zinc-100 p-1`, opciones `min-h-16` con icono y texto; la activa con fondo `bg-white shadow-sm` que se desliza con `layoutId` y `RESORTE.pulsar`) y una frase que explica la opción.
- **`BarraAccion`** (`pages/Leccion.jsx`, también en Oído): barra fija abajo con feedback + ayuda + botón grande. Respeta `env(safe-area-inset-bottom)`.
- **Cabecera de lección/entrenador**: pegajosa, botón ✕ (`Pulsable`, `size-11`), `BarraProgreso alAparecer={false}` con el acento, contador `tabular-nums`.
- **`Volver`** (`src/ui/Volver.jsx`): píldora gris «‹ Inicio» (`bg-zinc-200/70`) arriba a la izquierda en pantallas de nivel 1 (Módulo, panel de Oído). Área de 44 px y se hunde.
- **Cabecera de Módulo**: fila con `Volver` + barra de progreso del módulo centrada; debajo, «Módulo N» y el título grande centrado (`text-4xl sm:text-6xl`). Sin descripción ni texto de ayuda bajo el camino (lo pidió el usuario: que todo quepa mejor). La pantalla de Módulo usa `max-w-5xl` para que el camino respire.
- **Pantalla tipo lista** (Inicio, Módulo, panel de Oído, portada del entrenador): `motion.main` con `variants={lista}` y cada bloque con `variants={itemLista}`.
- **Chips seleccionables** (niveles, dirección): `Pulsable` `min-h-12 border-2`; activo `bg-zinc-900 text-white`, inactivo `bg-white border-zinc-200`.
- **Tarjeta de navegación**: `Pulsable tipo="tarjeta"`, `rounded-3xl border bg-white`, icono `size-12 rounded-2xl` a la izquierda, título `text-lg font-semibold`, subtítulo `text-sm text-zinc-500`, `›` gris a la derecha.
- **Tarjeta destacada** (siguiente lección): fondo = acento oscurecido, texto blanco, botón blanco dentro.
- **Contenido futuro** ("Próximamente"): muchos elementos → lista compacta dentro de un recuadro con borde punteado (Inicio);
  pocos (una lección dentro de un módulo) → tarjeta con `border-dashed border-zinc-300` sin `›` y texto `zinc-500`.
- **Camino de lecciones** (`components/CaminoLecciones.jsx`, pantalla de Módulo): islas estilo Duolingo que empiezan con una **insignia** (cuadrado `rounded-3xl` de 72 px con el número del módulo). Celular (< 560 px): vertical en zigzag con el título **debajo**; ancho: horizontal ondulado con el título **encima**. Isla = círculo de 80 px con **labio** inferior sólido (`box-shadow: 0 6px 0` del acento al 45 % con negro; relieve plano, no sombra difusa). Estados: hecha (acento oscurecido + ✓), actual (número + anillo `claro(acento)` con arco de avance), bloqueada (`#e4e4e7` + candado), próximamente (blanca, borde punteado, «…»). Camino: curva SVG punteada gris; los tramos hacia islas alcanzables se pintan con el acento. Títulos sobre fondo `#fafafa` para que el camino pase por detrás.
- **Isla abierta**: al tocar una isla crece (escala desde 80 px, `RESORTE.pantalla`) hasta un círculo grande (≤ 320 px en el celular, ~340 en ancho) con número, título, minutos y pasos, botón blanco principal (▶ Empezar / Continuar / ↻ Repetir), «Empezar de cero» si está a medias y el **%** abajo; anillo exterior con el avance. Las demás islas se apartan con resorte (en horizontal se encogen hasta 0.55 y esconden el título si no caben). Con la isla abierta, el camino es un **carrusel continuo** (ver «Gestos»): deslizar de lado o arrastrar por la **barra de puntitos** de abajo mueve todas las islas con el dedo; la abierta se encoge y vuelve a su sitio del camino mientras la vecina crece. Al cruzarse, primero el **disco** grande tapa la isla pequeña y después aparece su **contenido** (nunca dos círculos translúcidos uno encima de otro); los títulos se ocultan pronto. En el celular, la página se desplaza para que la isla abierta pase siempre por el mismo sitio de la pantalla, y la que se va sale un poco hacia el lado del dedo. Flechas ← → del teclado también cambian de isla. Se cierra con ✕, tocando fuera o con Escape. Bloqueada: «Termina la X antes» + «Ir a la X».
- **Hoja inferior** (`src/ui/Hoja.jsx`): bottom sheet tipo iOS disponible para detalles y confirmaciones (de momento sin uso: el módulo usa la isla abierta). Fondo `bg-black/40` con fundido; la hoja sube con `RESORTE.pantalla`, `rounded-t-3xl`, asa gris arriba y ✕ de 44 px; se cierra tocando el fondo, con Escape o **arrastrándola hacia abajo**. En pantallas anchas flota centrada (`max-w-lg`, `rounded-3xl`). Botones apilados a lo ancho: principal negro y secundario con borde. El primer botón lleva `data-foco` (recibe el foco al abrir).
- **Lección a medias**: mini `BarraProgreso` (`h-1.5 w-24`) bajo «Continuar donde lo dejaste».
- **Piano** (`components/Piano.jsx`): Pointer Events, `touch-action: none`, `compacto` en lecciones, 1 octava con ◀ ▶ en < 560 px.
- **Opciones de respuesta**: `min-h-16 rounded-2xl border-2`, en rejilla de 2 (o 3 si hay > 4). En lecciones son `Pulsable tipo="tarjeta"` y la correcta da un `SALTO`.
- **Rondas** (`components/exercises/Rondas.jsx`): puntos de progreso de un ejercicio; la ronda actual crece en vertical con `RESORTE.pulsar`, el color cambia con fundido.
- **Mini Piano Roll** (`components/PianoRoll.jsx`): tarjeta `rounded-3xl` con teclado a la izquierda (`w-14`, filas negras `bg-zinc-800`), números de tiempo arriba, líneas más marcadas cada tiempo, filas de teclas negras en `bg-zinc-100`. Notas = acento del módulo, más claras cuanta menos velocity (`color-mix`), aparecen con `RESORTE.pulsar`; las notas guía («fantasma») son contornos punteados grises (verdes al resolver). Filas `h-10` si hay ≤ 6, `h-8` si hay más. Las casillas miden ~35 × 32 px: excepción aceptada, como las teclas del piano (es una rejilla para arrastrar, no botones sueltos). Botón «Reproducir» como `BotonSonido`; el cabezal es una columna azul que avanza por casillas (sin animación: funciona igual con «reducir movimiento»). Selector de nombres «Esta app / FL Studio»: control segmentado `bg-zinc-100 p-1`, opción activa `bg-white shadow-sm`.
- **Pad de pulso** (`exercises/Pulso.jsx`): botón enorme (`h-40 rounded-3xl`, fondo `oscuro(acento)`, texto blanco) que responde en `onPointerDown` (no en `click`, para medir el tiempo). Con ayuda visual, un círculo blanco late en cada tiempo (fundido de 350 ms). Encima, el **medidor antes/tarde**: carril `h-10 rounded-full bg-zinc-100` con la zona buena en `emerald-100`, línea central y una bola que se desplaza con `RESORTE.pulsar` (verde a tiempo, ámbar fuera). Debajo del medidor, puntos de aciertos que dan un `SALTO`. Botón Empezar/Parar: `min-h-14 border-2`, negro al empezar y blanco mientras suena.
- **Selector de tempos**: tarjetas `Pulsable tipo="tarjeta"` en 2 columnas (BPM grande + género en `text-sm`); activa en negro. Arriba, tarjeta con el BPM en `text-4xl` y un círculo del acento que late en cada tiempo (más intenso en el 1).
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

- 2026-11-10: **Modo oscuro** con botón de **Opciones** en Inicio (Claro / Oscuro / Automático) redefiniendo la paleta en `.dark`; `text-blanco`, `bg-fondo`, `tinta()` y `tema-claro` (sección «Modo oscuro»). En Módulo se quitan la descripción y el texto «Toca una isla…».

- 2026-11-10: (pedido del usuario) Swipe corregido y ampliado para toda la app: **zona muerta real**, **barrera del 75 %** con fuerza en contra, pasa al 100 %, **una isla por swipe**, regreso de 1/5 con su zona muerta y barrera, X = 240 px en ancho / 35 % en el celular, **carrusel continuo** (todo sigue al dedo) y **barra de puntitos** inferior para tocar o arrastrar entre islas (sección 3b).

- 2026-11-10: (según bocetos del usuario) Camino con **insignia del módulo**, títulos encima en horizontal, **isla abierta** que crece en lugar de la hoja inferior, y **reglas de swipe** para toda la app (sección 3b, `useDeslizar`). `Volver` pasa a píldora gris; cabecera de Módulo con barra arriba y título centrado.

- 2026-11-10: Módulo como **camino de islas** (vertical en el celular, horizontal en pantallas anchas) con desbloqueo progresivo dentro del módulo, y **hoja inferior** al tocar una isla (Empezar / Continuar / Empezar de cero / Repetir; bloqueada → ir a la anterior). Se admite el «labio» sólido bajo las islas como relieve táctil.

- 2026-11-10: Lección 2.1 y ejercicio **Pulso** (pad de pulso con medidor antes/tarde, tap tempo, selector de tempos). El Piano Roll admite filas de batería (Bombo, Caja, Hi-hat) con columna de nombres más ancha. Los latidos visuales usan fundidos cortos con `easeOut` (marcan el tiempo, no son respuesta al dedo).

- 2026-11-10: Lección 1.4 y **mini Piano Roll** táctil (ver componentes). Todos los ejercicios pasan a `Pulsable` + `motion` (`ENTRA_DERECHA`, `SUBE`, `SALTO`, `Rondas`); se elimina la animación CSS `animate-entrada`. Pantalla final de lección con entrada escalonada del resumen. Hook `useSobreBarra` compartido por Piano y Piano Roll.

- 2026-11-10: Módulo y Entrenamiento de oído con la skill: `Volver`, `BarraProgreso`, helpers `oscuro`/`claro` en `src/ui/color.js`, entrada escalonada, opciones con `Pulsable` y salto de la correcta, días de racha que aparecen uno a uno, mini barra en lecciones a medias. Prohibido `text-xs`; texto de color con `oscuro()`. Feedback de oído absoluto: «Era Sol. Elegiste Do. Sonó Sol4 (392 Hz).».
- 2026-11-10: Se crea la skill. Movimiento con `motion` y resortes, `Pulsable`, transiciones entre pantallas y pasos, contraste del acento oscurecido, "Próximamente" compacto en Inicio.
