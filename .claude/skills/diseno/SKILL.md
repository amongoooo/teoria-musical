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

Todas las distancias son fracciones de **X** (la distancia de un paso, punto 7).

1. **Zona muerta REAL** (`zonaMuerta`, 14 px): mientras el dedo o el ratón no se aleje más de eso de donde se apoyó, **no se mueve NADA**.
2. **Resistencia de inicio fuerte** (`inicio`, `resistencia`): del final de la zona muerta al **30 % de X** el contenido **casi no se mueve**: como mucho el 6,5 % de X, con una curva que se aplana (cada vez más dura). Se nota claramente que cuesta arrancar.
3. **Alcanza al dedo al 30 %**: al pasar el 30 % el contenido llega a la posición exacta del dedo con un resorte rápido (`RESORTE.pulsar`, ~130 ms, sin salto brusco) y desde ahí lo sigue **1:1**. Si el dedo regresa por debajo del 26 % (`sigueSale`), vuelve la resistencia (con resorte).
4. **Imán al 50 %, sin soltar y sin histéresis** (`iman`): por **encima del 50 %** de X el contenido se **pega al vecino** con `RESORTE.pantalla` y ese pasa a ser el actual; si el dedo vuelve **por debajo del 50 %**, se queda en el de antes y **se pega a él** con el mismo imán. Pegado, apenas se mueve (un tirón suave hacia el dedo).
5. **Avance continuo** (`continuo`): ya pegado al vecino, con el dedo a partir del **75 %** de X pasa isla por isla sola, y la espera depende de **dónde esté el dedo**: 75–85 % → **1000 ms**, 85–90 % → **700**, 90–95 % → **500**, 95–98 % → **350**, 98–100 % (o más) → **250** (máximo 4 por segundo). Si el dedo cambia de zona, la espera cambia en el acto. Cada paso automático se anima con `RESORTE.pantalla` en el carrusel continuo. Para **al soltar**, **al bajar del 75 %** o **al llegar al extremo** (ahí, goma).
6. **Al soltar**: si no se había pegado (antes del 50 %), vuelve a su sitio con `RESORTE.pantalla`. **Gesto rápido**: si se suelta a ≥ `velocidad` (0,45 px/ms) en esa dirección, pasa uno. Si estaba pegado, se asienta en ese.
6b. **Tope de velocidad suave** (`velocidadMax` 1,2 px/ms + `alcance`): solo frena lo **automático** (resortes del imán, pasos automáticos, soltar), nunca lo que sigue al dedo. Si se queda atrás, el tope crece (0,012 px/ms por cada px de retraso): alcanza con suavidad, sin ir «a tirones» a velocidad fija. Medido: ~1,44 px/ms en el avance continuo.
6c. **Modo rápido** (`veloz`: entra a 0,8 px/ms y sale por debajo de 0,4; en la barra de puntitos 0,25 / 0,12 porque están más juntos): con el dedo deprisa, el contenido lo sigue de forma continua, sin la resistencia inicial ni pegarse en cada isla o puntito (eso es lo que hacía que se sintiera trabado). Al frenar (se revisa a los 60 ms aunque no lleguen eventos), vuelven las reglas con resorte.
6d. Un resorte reemplazado no debe escribir su último valor (motion llama a `onUpdate` al pararlo): `asentar` lo ignora con un contador. Si no, se perdía la compensación del cambio de isla y el contenido daba un tirón.
7. **Distancia X**: en pantallas anchas `umbralAncho` (240 px); en el celular `umbralCelular` × ancho del carrusel (35 %, mínimo 100 px).
8. **Extremos**: si no hay más, resistencia tipo goma (`goma`, se satura en 1/4 de X).
9. **Carrusel continuo**: mientras se arrastra, **todo se mueve con el dedo**: lo que se va se encoge y se desplaza, lo que llega crece y se acerca al centro, interpolando posiciones y tamaños según el progreso (0 → 1). Sin cortes ni cambios de golpe al pasar.
10. Si el gesto empieza más vertical que horizontal, se ignora (deja hacer scroll). El contenedor lleva `touch-action: pan-y`.
11. Tras arrastrar, el «click» de soltar no activa botones.
12. Mismas reglas en **todos** los carruseles: camino de islas y pestaña de **Módulos**. Cada carrusel escribe su posición continua en `data-posicion` (sirve para medir el gesto con Playwright).

**Swipe de página** (cambiar de módulo; `components/CambioModulo.jsx` → `useCambioModulo`, en la pantalla de Módulo): con el camino **cerrado** (ninguna isla abierta), **deslizar de lado** pasa de módulo (a la izquierda → el siguiente; a la derecha → el anterior) y, en el celular, **tirar «más abajo» del final de la página** (`ui/useTirarAbajo.js`, eventos táctiles) pasa al siguiente. Mismas reglas que el resto (zona muerta, **resistencia fuerte hasta el 30 %**, alcanza al dedo y lo sigue 1:1, **pasa al 50 % sin soltar**), pero con una **X más larga** (`DESLIZAR.pagina`: 60 % del ancho en el celular, 320 px en ancho, 240 px en vertical) y **sin gesto rápido ni avance continuo** (cambiar de página tiene que ser a propósito). Toda la página (`<main>`) se desplaza con el dedo y por el borde **asoma el módulo de destino** (cuadrito de 56 px + «Siguiente / Anterior · Módulo N» sobre `bg-fondo/90`), que entra del todo justo en el punto en que pasa. Si el vecino no tiene lecciones: goma y el indicador dice «Próximamente» (se ve entero con poco recorrido). Al pasar, lo visible se congela y la página nueva entra con la transición de pantalla **desde el lado del gesto** (`App.jsx`: entre módulos, el siguiente entra por la derecha y el anterior por la izquierda). Con una isla abierta, el swipe lateral es del camino (islas). Mientras se está en un módulo, `html` lleva `overscroll-behavior-y: none` (sin rebote propio del navegador). Los gestos que empiezan en una hoja o en la barra de puntitos (portales) no cuentan.

**Barra de puntitos** (paginador): cuando hay un carrusel abierto (p. ej. una isla), **sube desde abajo** con `RESORTE.pantalla`, fija en la parte inferior y respetando `env(safe-area-inset-bottom)`; al cerrar, baja y se oculta. Píldora blanca `rounded-full border shadow-sm`, un puntito por elemento en celdas de **44 × 56 px** (`DESLIZAR.puntitos.separacion`). Hechos: opacos (`oscuro(acento)`); pendientes: atenuados (acento al 35 %). El del elemento actual mide 16 px y los demás 8 px, y el tamaño **sigue al progreso** del carrusel (crece/encoge con el resorte). **Tocar** un puntito va directo a ese elemento. **Arrastrar** por encima (`useDeslizar` con `sentido: 1`, `cadena: true`, zona muerta 8 px desde donde se apoya; X = 44 px, la separación entre puntitos; el gesto se mide desde el **centro del puntito tocado** (`origen`), así la isla es siempre la del puntito **más cercano** al dedo) pasa **una isla por cada puntito que se cruza**: entre puntito y puntito se repite la curva nueva (zona muerta, resistencia hasta el 30 %, 1:1, imán al 50 % igual en los dos sentidos: por encima pasa, por debajo se queda pegada al puntito de antes) y **sin avance continuo**. `touch-action: none` en la barra.

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
- **Módulos en Inicio**: rejilla de **cuadritos** (`Cuadrito` de `components/NavegadorModulos.jsx`: `rounded-3xl` de 76 px, número sobre `oscuro(acento)` con labio; punteado si aún no existe) con el título debajo y `hechas/total` o «Próximamente». 3 columnas en el celular, 5 en ancho. Tocar uno abre el módulo y sus islas **se despliegan** desde la insignia.
- **Camino de lecciones** (`components/CaminoLecciones.jsx`, pantalla de Módulo): islas estilo Duolingo que empiezan con una **insignia** (cuadrado `rounded-3xl` de 72 px con el número del módulo). Al entrar, las islas **salen de la insignia** una tras otra (70 ms entre ellas, ~0,5 s con un rebote al llegar) y el camino se estira con ellas. **Tocar la insignia** abre la pestaña de **Módulos** (hoja con un carrusel lateral de tarjetas, una por módulo, con las reglas de swipe; flechas ‹ › y «Módulo N de 10»; «Ir al módulo N» / «Estás aquí» / «Próximamente»). Al final del camino (lado opuesto a la insignia) está la isla de **Retos**: trofeo con borde del acento (rellena cuando todos están hechos); abierta muestra el reto del módulo y «Ver retos», que abre una hoja con el reto del módulo («Lo hice») y el reto de FL de cada lección (abre la lección directo en su reto: `#/leccion/1.1/reto`). En la barra de puntitos, el de Retos es un cuadradito. Celular (< 560 px): vertical en zigzag con el título **debajo**; ancho: horizontal ondulado con el título **encima**. Isla = círculo de 80 px con **labio** inferior sólido (`box-shadow: 0 6px 0` del acento al 45 % con negro; relieve plano, no sombra difusa). Estados: hecha (acento oscurecido + ✓), actual (número + anillo `claro(acento)` con arco de avance), bloqueada (`#e4e4e7` + candado), próximamente (blanca, borde punteado, «…»). Camino: curva SVG punteada gris; los tramos hacia islas alcanzables se pintan con el acento. Títulos sobre fondo `#fafafa` para que el camino pase por detrás.
- **Isla abierta = «isla + bocadillo»** (elegida por el usuario entre 4 propuestas): al tocar una isla, **crece hasta 112 px** (`BOLA`, con su labio y el **aro de avance** alrededor: pista `claro(acento)`, arco del acento) y debajo **sale un globo** (`Globo`) que apunta a ella con un **piquito**. El globo sale de la isla con `--contenido` (fundido + baja 14 px + escala 0,94 → 1). El centro de la bola queda en el punto del camino; la altura real del globo se **mide** (ResizeObserver) y las islas de abajo se apartan lo justo. Globo: `rounded-3xl p-5`, ancho `min(ancho − 24, 340)` en el celular y 320 en ancho; título `text-xl font-bold` (deja sitio a la ✕ de 44 px arriba a la derecha), una línea de estado (`~14 min · 16 pasos` / `Paso 7 de 16 · 38 % · ~14 min` / `✓ Completada · 19/20 a la primera` / candado + «Termina la 2.1 antes» / «Llega pronto») y **botones a lo ancho** (`BotonGlobo`: principal `min-h-13` relleno, secundario `min-h-12` con borde). Colores del globo: disponible → `oscuro(acento)` con `text-blanco` y botón `bg-blanco` con texto del acento; bloqueada → gris (`zinc-200`) con botón negro; próximamente → blanco con borde punteado; **Retos** → trofeo en la bola, globo blanco con borde del acento (relleno del acento cuando están todos hechos), reto del módulo, «x/y hechos» y «Ver retos». Al abrir, la página se desplaza lo justo para que bola y globo queden por encima de la barra de puntitos. Con una abierta, el camino es un **carrusel continuo** (ver «Gestos»): la abierta vuelve a su tamaño mientras la vecina crece; la isla pequeña y la bola se cruzan opacas y el globo aparece después. Flechas ← → del teclado también cambian de isla. Se cierra con ✕, tocando fuera o con Escape.
- **Hoja inferior** (`src/ui/Hoja.jsx`): bottom sheet tipo iOS disponible para detalles y confirmaciones (de momento sin uso: el módulo usa la isla abierta). Fondo `bg-black/40` con fundido; la hoja sube con `RESORTE.pantalla`, `rounded-t-3xl`, asa gris arriba y ✕ de 44 px; se cierra tocando el fondo, con Escape o **arrastrándola hacia abajo**. En pantallas anchas flota centrada (`max-w-lg`, `rounded-3xl`). Botones apilados a lo ancho: principal negro y secundario con borde. El primer botón lleva `data-foco` (recibe el foco al abrir).
- **Lección a medias**: mini `BarraProgreso` (`h-1.5 w-24`) bajo «Continuar donde lo dejaste».
- **Piano** (`components/Piano.jsx`): Pointer Events, `touch-action: none`, `compacto` en lecciones, 1 octava con ◀ ▶ en < 560 px.
- **Opciones de respuesta**: `min-h-16 rounded-2xl border-2`, en rejilla de 2 (o 3 si hay > 4). En lecciones son `Pulsable tipo="tarjeta"` y la correcta da un `SALTO`.
- **Rondas** (`components/exercises/Rondas.jsx`): puntos de progreso de un ejercicio; la ronda actual crece en vertical con `RESORTE.pulsar`, el color cambia con fundido.
- **Mini Piano Roll** (`components/PianoRoll.jsx`): tarjeta `rounded-3xl` con teclado a la izquierda (`w-14`, filas negras `bg-zinc-800`), números de tiempo arriba, líneas más marcadas cada tiempo, filas de teclas negras en `bg-zinc-100`. Notas = acento del módulo, más claras cuanta menos velocity (`color-mix`), aparecen con `RESORTE.pulsar`; las notas guía («fantasma») son contornos punteados grises (verdes al resolver). Filas `h-10` si hay ≤ 6, `h-8` si hay más. Las casillas miden ~35 × 32 px: excepción aceptada, como las teclas del piano (es una rejilla para arrastrar, no botones sueltos). Botón «Reproducir» como `BotonSonido`; el cabezal es una columna azul que avanza por casillas (sin animación: funciona igual con «reducir movimiento»). Selector de nombres «Esta app / FL Studio»: control segmentado `bg-zinc-100 p-1`, opción activa `bg-white shadow-sm`.
- **Pad de pulso** (`exercises/Pulso.jsx`): botón enorme (`h-40 rounded-3xl`, fondo `oscuro(acento)`, texto blanco) que responde en `onPointerDown` (no en `click`, para medir el tiempo). Con ayuda visual, un círculo blanco late en cada tiempo (fundido de 350 ms). Encima, el **medidor antes/tarde**: carril `h-10 rounded-full bg-zinc-100` con la zona buena en `emerald-100`, línea central y una bola que se desplaza con `RESORTE.pulsar` (verde a tiempo, ámbar fuera). Debajo del medidor, puntos de aciertos que dan un `SALTO`. Botón Empezar/Parar: `min-h-14 border-2`, negro al empezar y blanco mientras suena.
- **Contador del compás** (`Contador` en `exercises/Pulso.jsx`, ronda con `contar`): fila de casillas `h-12 rounded-2xl border-2` a lo ancho, una por tiempo («1 2 3 4») o por corchea («1 y 2 y…»); los números `text-xl font-bold`, las «y» más pequeñas. La que suena se llena con `oscuro(acento)` y `text-blanco` (fundido de 100 ms); las que hay que tocar llevan **aro** del acento oscurecido. Va entre «Empezar» y el medidor. En semicorcheas (`contar: 'e'`, «1 e y a») son 16 casillas en **dos filas de 8** (rejilla `grid-cols-8`); los números van en `zinc-900` y las sílabas en `zinc-600`.
- **Piano Roll con nombres propios** (`roll.nombres`): la columna de la izquierda muestra un texto (p. ej. «Redonda», «Semicorchea») en `text-sm font-semibold` y se ensancha a `w-[6.5rem]`. Sirve para la pirámide de figuras (solo lectura; con 16 columnas las casillas quedan estrechas, por eso no se usa para dibujar).
- **Piano Roll con compás** (`roll.compas`): los números de arriba vuelven a 1 en cada compás (el 1 en negrita) y la línea de inicio de compás es más oscura (`border-zinc-500`).
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

- 2026-11-10: (pedido del usuario) **Swipe de página** para cambiar de módulo: lateral (los dos sentidos) y tirando más allá del final de la página, con resistencia antes de pasar (sección 3b).

- 2026-11-10: Lección 2.3: contador en **semicorcheas** («1 e y a», dos filas de 8) y **nombres propios de fila** en el Piano Roll (pirámide de figuras). Los ejercicios de dibujar siguen con ≤ 8 columnas para que las casillas midan ~33 px a 375 px.

- 2026-11-10: (elegido por el usuario en un artefacto con 4 propuestas) La isla abierta pasa de disco grande a **«isla + bocadillo»**: bola de 112 px con aro de avance y globo con piquito, botones a lo ancho; también la isla de Retos.

- 2026-11-10: Lección 2.2: **contador del compás** en el pad de pulso (casilla que suena llena del acento, las que hay que tocar con aro) y Piano Roll con **líneas de compás** (`roll.compas`).

- 2026-11-10: (pedido del usuario) Barra de puntitos medida desde el **centro del puntito** (la isla = el puntito más cercano al cursor). Al ir rápido ya no se traba: el tope de velocidad pasa a ser **suave y solo para lo automático**, **modo rápido** que sigue al dedo sin paradas y arreglo del resorte reemplazado que pisaba la compensación.

- 2026-11-10: (pedido del usuario) Swipe: **sin histéresis** (imán al 50 % en los dos sentidos: por debajo se queda y se pega al de antes, también en la barra de puntitos), **tope de velocidad** del contenido (1,2 px/ms) y **avance continuo por zonas** desde el 75 %: 1000 / 700 / 500 / 350 / 250 ms según dónde esté el dedo.

- 2026-11-10: (pedido del usuario) **Nuevas reglas de swipe** para toda la app: resistencia fuerte hasta el 30 % de X (≤ 6,5 % de X), alcanza al dedo con resorte rápido y sigue 1:1, **imán al 50 % sin soltar** con histéresis (vuelve por debajo del 40 %), **avance continuo** con el dedo más allá del 95 % (1 s y acelera hasta 4 por segundo). Se quitan la barrera del 75 %, «pasa al 100 %», «una isla por swipe», el regreso de 1/5 y el imán al soltar. Barra de puntitos con la misma curva entre puntitos (`cadena`), sin avance continuo.

- 2026-11-10: Inicio con módulos en **cuadritos** que despliegan sus islas; la insignia abre la pestaña de **Módulos** (carrusel lateral); isla de **Retos** al final del camino; fuera «¿Qué se siente?» y el reto del módulo como texto. Swipe: **resistencia al empezar** (primer 25 % de X) e **imán del 50 %** al soltar.

- 2026-11-10: **Modo oscuro** con botón de **Opciones** en Inicio (Claro / Oscuro / Automático) redefiniendo la paleta en `.dark`; `text-blanco`, `bg-fondo`, `tinta()` y `tema-claro` (sección «Modo oscuro»). En Módulo se quitan la descripción y el texto «Toca una isla…».

- 2026-11-10: (pedido del usuario) Swipe corregido y ampliado para toda la app: **zona muerta real**, **barrera del 75 %** con fuerza en contra, pasa al 100 %, **una isla por swipe**, regreso de 1/5 con su zona muerta y barrera, X = 240 px en ancho / 35 % en el celular, **carrusel continuo** (todo sigue al dedo) y **barra de puntitos** inferior para tocar o arrastrar entre islas (sección 3b).

- 2026-11-10: (según bocetos del usuario) Camino con **insignia del módulo**, títulos encima en horizontal, **isla abierta** que crece en lugar de la hoja inferior, y **reglas de swipe** para toda la app (sección 3b, `useDeslizar`). `Volver` pasa a píldora gris; cabecera de Módulo con barra arriba y título centrado.

- 2026-11-10: Módulo como **camino de islas** (vertical en el celular, horizontal en pantallas anchas) con desbloqueo progresivo dentro del módulo, y **hoja inferior** al tocar una isla (Empezar / Continuar / Empezar de cero / Repetir; bloqueada → ir a la anterior). Se admite el «labio» sólido bajo las islas como relieve táctil.

- 2026-11-10: Lección 2.1 y ejercicio **Pulso** (pad de pulso con medidor antes/tarde, tap tempo, selector de tempos). El Piano Roll admite filas de batería (Bombo, Caja, Hi-hat) con columna de nombres más ancha. Los latidos visuales usan fundidos cortos con `easeOut` (marcan el tiempo, no son respuesta al dedo).

- 2026-11-10: Lección 1.4 y **mini Piano Roll** táctil (ver componentes). Todos los ejercicios pasan a `Pulsable` + `motion` (`ENTRA_DERECHA`, `SUBE`, `SALTO`, `Rondas`); se elimina la animación CSS `animate-entrada`. Pantalla final de lección con entrada escalonada del resumen. Hook `useSobreBarra` compartido por Piano y Piano Roll.

- 2026-11-10: Módulo y Entrenamiento de oído con la skill: `Volver`, `BarraProgreso`, helpers `oscuro`/`claro` en `src/ui/color.js`, entrada escalonada, opciones con `Pulsable` y salto de la correcta, días de racha que aparecen uno a uno, mini barra en lecciones a medias. Prohibido `text-xs`; texto de color con `oscuro()`. Feedback de oído absoluto: «Era Sol. Elegiste Do. Sonó Sol4 (392 Hz).».
- 2026-11-10: Se crea la skill. Movimiento con `motion` y resortes, `Pulsable`, transiciones entre pantallas y pasos, contraste del acento oscurecido, "Próximamente" compacto en Inicio.
