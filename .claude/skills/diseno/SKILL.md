---
name: diseno
description: Sistema de diseño de Teoría Musical (colores, tipografía, espacios, componentes y movimiento tipo iOS con resortes). Úsala SIEMPRE antes de crear o cambiar cualquier pantalla, componente, ejercicio o animación de la app, y actualízala cuando el usuario apruebe un cambio de estilo.
---

# Diseño de Teoría Musical

App para aprender música **desde el celular** (el usuario usa Android; pensar también en iPhone).
Objetivo: que se vea limpia y que **se sienta bien al tacto**, como una app nativa de iOS:
todo responde al instante, se hunde al tocarlo y se mueve con resortes, nunca con animaciones lineales.

> Esta skill crece con la app. Cuando el usuario apruebe un estilo nuevo («me gusta así»,
> «agrega a la skill que…»), anótalo aquí en la sección que toque y añade una línea arriba de **`REGISTRO.md`** (misma carpeta).

## 1. Principios

1. **Mobile-first**: se diseña a 375 px y luego se amplía (`sm:`). Nada depende de hover ni de teclado.
2. **Una acción principal por pantalla**: el botón grande de abajo (`BarraAccion`), que «se llena» cuando hay algo que hacer.
3. **Calma**: fondo claro, mucho espacio, tipografía grande. El color se usa para guiar, no para decorar.
4. **El error no castiga**: los fallos usan el oro de «fíjate» con bombilla (nunca rojo) y siempre explican la respuesta.
5. **Respuesta inmediata**: todo lo tocable reacciona en el mismo frame (se hunde) y el sonido sale enseguida.

## 2. Tokens

### Color: paleta Lospec500 repartida en papeles (artefacto «Íconos, colores y fuentes», v5)

**El color solo dice dos cosas: el ESTADO y el MÓDULO.** El texto nombra las cosas, el tono dice cuánto
y el ícono solo aparece donde se entiende sin explicación. Todas las variables están en **`src/index.css`**
con **nombre de significado** (cambiar de paleta = tocar una sola lista), en claro y en oscuro:

| Papel | Variables (clases `bg-…`, `text-…`, `border-…`) | Claro | Va siempre con |
|---|---|---|---|
| **Gris = estructura** (fondo, superficies, bordes, texto, botón principal) y **bloqueado** | `fondo`, `white` (= superficie), escala `zinc-*` (alias `superficie`, `borde`, `suelo`, `texto`, `texto-2`, `texto-3`) | neutro `#10121c` mezclado con blanco; fondo `#f4f4f5` | candado (si es bloqueado) |
| **Verde = bien / hecho** | `bien` (barras, bordes) · `bien-relleno` (fondo con `text-blanco`) · `bien-tinta` (texto) · `bien-suave` (fondo suave) | `#5ab552` · `#3c7c36` · `#377332` · `#e7f4e5` | **✓** |
| **Oro = fíjate** (pistas, errores explicados, teclas marcadas, «Nuevo») | `fijate` (relleno con **texto oscuro**) · `fijate-tinta` · `fijate-suave` · `fijate-claro` (tecla blanca marcada) | `#dab163` · `#816838` · `#faf3e8` · `#f0dcae` | **bombilla** |
| **Módulo N** (un color cada uno, con su número, **sin ícono**) | `modulo-N` · `modulo-N-relleno` · `modulo-N-tinta` · `modulo-N-suave` | ver tabla de abajo | su número |
| Lo que suena ahora (tecla pulsada, botón sonando, cabezal) | `sky-*` (redefinidos con azules de Lospec) | `#3388de` | — |

Colores de módulo (barra; los demás se calcularon con contraste ≥ 4.5:1 en cada tema):
M1 `#3388de` azul · M2 `#e98537` naranja · M3 `#008b8b` turquesa · M4 `#8c78a5` morado · M5 `#ec273f` rojo ·
M6 `#c878af` rosa · M7 `#3859b3` índigo · M8 `#6e4c30` tierra · M9 `#36c5f4` celeste · **M10 `#5e5b8c`** (ajustado a mano).
Los modos del entrenamiento de oído usan el color del módulo con el que se relacionan: Intervalos → M3, Acordes → M4, Oído absoluto → M1.

**Reglas**
1. **Lo importante va doble**: acierto = ✓ + verde, pista = bombilla + oro, bloqueado = candado + gris. Se entiende aunque no se distingan los colores. (Excepción pedida por el usuario: las **casillas de objetivo del teclado** —«La3», «La más grave»— no llevan ✓: la segunda señal es que pasan de contorno a **relleno sólido** con un «pop».)
2. **Un color = un significado** en toda la app: el verde nunca decora, el oro nunca es «módulo». Nada de colores sueltos (`emerald`, `amber`, `orange`, hex a mano): usa las variables.
3. **El tono dice cuánto**: oscuro = fuerte, grave o importante; claro = suave, agudo o de fondo (velocity, batería, avance).
4. En `src/content/modulos.js` el `acento` de cada módulo es **`var(--color-modulo-N)`**. Los helpers de **`src/ui/color.js`**
   devuelven la variante calculada: **`oscuro(acento)`** → `-relleno` (fondo con `text-blanco`), **`tinta(acento)`** → `-tinta`
   (texto de color), **`claro(acento)`** → `-suave` (fondo de iconos y anillos), **`labio(acento)`** → relieve bajo islas y cuadritos.
   Con cualquier otro color hacen una mezcla `color-mix`. El acento puro solo para barras, puntos, bordes y trazos.
5. Las variables van en **`@theme static`** (si no, Tailwind elimina las que no usa ninguna clase y los `var()` de JS quedan vacíos).
6. En SVG, el color de un trazo va en `style={{ stroke }}` (no en el atributo) cuando es una variable.
7. Grises: `text-zinc-500` es el más claro permitido para texto que hay que leer; `text-zinc-400` solo decorativo (p. ej. `›`).

### Materiales: vidrio, superficie y color (pedido del usuario)

| Material | Qué dice | Dónde |
|---|---|---|
| **Vidrio** (`VIDRIO`, `VIDRIO_PANEL` de `src/ui/vidrio.js`) | «Esto es la app»: navegar, salir, ajustar, avanzar | Solo lo que **flota fijo** sobre contenido que se mueve: cabeceras de Módulo, lección y entrenador; barra de puntitos; botones de casita, Atrás, Opciones y ✕; **barra de abajo** (`BarraAccion`); indicador «Siguiente · Módulo N»; cabecera de las hojas al desplazar |
| **Superficie** (blanca/gris) | «Esto es la lección»: lo que lees, escuchas y tocas para responder | Opciones de respuesta, Emparejar, piano (y sus flechas de octava), roll, fichas, tarjetas, botones de las pantallas sin nada detrás (final de lección, Importar) |
| **Color** (relleno) | El significado: módulo, bien, fíjate, acción lista | Islas y globos, mensajes de bien/fíjate, el botón principal cuando está listo |

Reglas: (1) **el vidrio necesita algo detrás**: nunca en lo que no flota (se vería gris sucio). (2) **El vidrio no lleva el
significado**: dentro de un vidrio, el verde, el oro y el negro del botón listo van sólidos. (3) **Como mucho ~3 piezas de vidrio
a la vez** en pantalla (el desenfoque gasta batería y puede ir a tirones en Android de gama baja). (4) Botones y píldoras usan
`VIDRIO` (casi transparente); los **paneles con texto** usan `VIDRIO_PANEL` (más esmerilado y teñido con la superficie del tema,
`bg-white/70` + `backdrop-blur-xl`), para que el texto se lea aunque pase el piano por detrás. (5) Si un elemento con
desenfoque se desvanece, la opacidad va **en el propio elemento**, no en un antecesor (si no, el desenfoque deja de ver lo de detrás).

**Opciones → Vidrio**: «**Desenfoque**» (predeterminado) u «**Opaco**». En opaco, `<html>` lleva la clase **`opaco`**
(`src/progress/opciones.js` → `vidrio`, aplicada antes de pintar en `index.html`) y todo lo que lleva la clase **`vidrio`** pasa a
superficie sólida con borde `zinc-200` y sin desenfoque (reglas al final de `src/index.css`); el vidrio sobre una tarjeta de color
lleva además `vidrio-color` (en opaco, un velo blanco al 20 %). No se pasa entre dispositivos con «Tu progreso» (depende del teléfono).

### Modo oscuro (Opciones → Apariencia)
La app tiene tema **Claro** (predeterminado), **Oscuro** y **Automático** (sigue al teléfono). Se guarda en
`localStorage` (`teoria-musical:opciones:v1`, `src/progress/opciones.js`) y pone la clase **`dark`** en `<html>`;
`index.html` lo aplica antes de pintar (sin destello) y ajusta `<meta name="theme-color">`.

**Cómo funciona**: `src/index.css` **redefine las variables** dentro de `.dark` (los `zinc` se invierten,
`white` pasa a ser la superficie oscura `#1d1f29`, el fondo `#07080f`; los `-suave` pasan a tonos oscuros y las `-tinta` a claras). Así **casi nunca hace falta `dark:`**: escribe las clases
de siempre y cada pareja fondo/texto conserva su contraste. Reglas:
- Fondo de página y cabeceras pegajosas: **`bg-fondo`** (`bg-fondo/95`), nunca `#fafafa` a mano.
- Texto **sobre un relleno de color** (`oscuro(acento)`, `bg-bien-relleno`, `sky-500`…): **`text-blanco`** (blanco fijo),
  no `text-white` (que en oscuro se vuelve oscuro). Botón blanco dentro de una tarjeta de color: `bg-blanco text-negro`.
- Botón principal `bg-zinc-900 text-white`: se deja así (en oscuro queda claro con texto oscuro, como iOS).
- Acento como **color de texto**: **`tinta(acento)`** (`src/ui/color.js`; oscurecido en claro, aclarado en oscuro).
  `oscuro(acento)` es solo para **fondos** con `text-blanco`. `claro(acento)` se mezcla con la superficie del tema.
- Colores en estilos JS: variables (`var(--color-zinc-200)`, `var(--color-white)`), no hex fijos.
- Lo que debe verse **siempre claro** (teclas del Piano, columna de teclas del Piano Roll): clase **`tema-claro`**,
  que restaura la paleta clara en ese bloque (grises, `fijate-*` y `sky-*`).
- Si algo necesita un ajuste solo en oscuro: variante `dark:` (p. ej. opción activa del control segmentado `dark:bg-zinc-300`).
- Al cambiar de tema, los colores pasan con un fundido de 250 ms (clase temporal `cambiando-tema`).

### Tipografía: una fuente = un tipo de información (como mucho 3 a la vez en pantalla)
Archivos propios con **@fontsource** (importados al principio de `src/index.css`, sin Google Fonts):

| Rol | Fuente | Clase | Para |
|---|---|---|---|
| Texto (por defecto) | **Figtree** (variable) | `font-sans` | explicaciones, preguntas, botones |
| Títulos | **Bricolage Grotesque** (variable, con tamaño óptico) | **`font-titulo`** | títulos de pantalla, de paso, de sección y de tarjeta; número de isla, insignia y cuadrito |
| Datos musicales | **DM Mono** (400/500) | **`font-dato`** | notas del Piano Roll, BPM, Hz, contadores «1 y 2 y», «x/y», minutos, «Octava 4», pasos del Channel rack: si está en esta letra, es un dato que verás igual en FL |
| Juego y logros | **Pixelify Sans** (variable) | **`font-juego`** | **solo** racha («12 días») y niveles del entrenamiento de oído |

- Título de página: `font-titulo text-4xl font-extrabold tracking-tight` (Inicio, Módulo, Oído) o `text-3xl font-bold` (otras).
- Título de paso: `font-titulo text-2xl font-bold leading-tight tracking-tight sm:text-4xl`.
- Sección: `font-titulo text-2xl font-bold tracking-tight`.
- Cuerpo: `text-lg leading-relaxed text-zinc-600`. Mínimo `text-base` en lo que hay que leer; `text-sm` solo para datos secundarios. **Nunca `text-xs`.**
- Datos con `font-dato` en peso `font-medium` (DM Mono no tiene negrita) y `tabular-nums`.
- Etiquetas pequeñas en mayúsculas: `text-sm font-semibold uppercase tracking-wider`.

### Íconos (`src/ui/Iconos.jsx`): los mínimos
SVG propios, 24 × 24, **trazo de 2 px con puntas redondeadas** (como Figtree), sin librerías. **Solo 6 que hay que conocer**,
y se explican solos; **siempre con texto al lado** (o `aria-label` en el botón). Un ícono = un significado; no se añade uno
sin quitar otro. Todo lo demás se dice con **texto** o con **color** (sin emojis como íconos).

| Grupo | Componentes | Significado |
|---|---|---|
| Qué te pide el paso | `Oreja` · `Teclas` · `Trofeo` | oído · practicar (teclado, roll, ritmo, frecuencia) · reto en FL (también isla y hoja de Retos) |
| Cómo va (con su color) | `Check` (verde) · `Bombilla` (oro) · `Candado` (gris) | bien/hecho · fíjate/pista · bloqueado |
| Controles de siempre | `Reproducir` · `Cerrar` · `Inicio` · `Opciones` | — |

- **`MarcaBien`**: ✓ blanco en un círculo `bg-bien-relleno` para poner sobre cualquier fondo (esquina de islas y cuadritos
  hechos, «Completada» en el globo). Con `aro="var(--color-fondo)"` se separa del color de debajo.
- **Módulos sin ícono**: color + número (islas, insignia, cuadritos, barras).
- **Etiqueta del paso** (visor de lecciones, encima del título): ícono de su **actividad** + nombre del ejercicio en texto,
  p. ej. «Oído · Escuchar y elegir», «Practica · Dar acentos», «Reto en FL». Píldora `bg-zinc-100 text-sm font-bold`,
  ícono de 18 px. Las **explicaciones** (L1–L6) no llevan etiqueta. El código de cada paso sale de
  **`src/content/actividad.js`** (`codigoPaso`, `etiquetaPaso`), según el catálogo de `src/content/INTERACCIONES.md`.
- Feedback de la barra inferior: título con `Check` (bien) o `Bombilla` (fíjate).
- Flechas de navegación (‹ ›) y «…» son texto, no íconos.

### Ícono de la app (`public/iconos/`)
Un trozo de teclado (Do Re Mi Fa) con cada tecla blanca en el color de un módulo (M1 azul, M2 naranja, M3 turquesa, M4 morado),
las dos negras recortadas en el neutro `#10121c` y ese mismo neutro de fondo. Teclas rectas arriba y redondeadas abajo.
Fuente de verdad: `icono.svg` (esquinas `rx` 112) e `icono-enmascarable.svg` (fondo a sangre, dibujo al 80 % para la zona segura
de Android). Los PNG (192, 512, enmascarables, `apple-touch-icon` 180, favicon 64) se generan desde esos SVG.

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
- **`POP`**: «pop» más marcado `scale: [1, 1.14, 0.97, 1]` (0,4 s) al conseguir una casilla de objetivo.
- **Temblar** (`useTemblor`, `src/ui/useTemblor.js`, valores en `TEMBLOR` de `movimiento.js`; pedido del usuario): para «esto ya está» (se vuelve a pedir algo ya hecho, p. ej. una casilla ya conseguida). Uso: `const [ref, temblar] = useTemblor()`, `ref` en un **envoltorio** que no anime x / y / rotate por su cuenta (el `POP` o el hundirse van dentro) y `temblar()` cuando toque.
  - Se mueve en **x**, en **y** y **gira sobre su eje**, **~0,25 s en total**, oscilando `[1, −0,6, 0,3, 0]` × amplitud.
  - **Amplitud en cada eje inversamente proporcional al tamaño en ese eje**: `300 / ancho` px en x y `300 / alto` px en y (un cuadrado tiembla igual en x e y; un rectángulo acostado, más en y que en x). Límites 0,8–8 px.
  - **Giro inversamente proporcional al tamaño**: `240 / √(ancho × alto)` grados (un cuadrado chico gira más que uno grande). Límites 0,5–6°. Medido en una casilla de 106 × 64 px: 2,8 px en x, 4,7 px en y, 2,8°.
  - **Sentido e inicio al azar en cada movimiento** (x, y y giro por separado: sentido ±, desfase de 0–60 ms dentro de los 0,25 s): dos objetos iguales tiemblan en la misma zona y con el mismo tilt, pero a destiempo y en sentidos distintos.
  - Con **reducir movimiento** no se mueve: **parpadea** (opacidad a 0,45 y vuelve) para que siga habiendo respuesta.

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
8. **Extremos**: si no hay más, resistencia tipo goma (`goma`, se satura en 1/4 de X). En el **camino de islas** no hay goma: al deslizar la isla abierta, **no se mueve**, hace un **«tilt»** (3°) y un desplazamiento corto (12 px) hacia donde va el dedo con `RESORTE.pulsar` y a los **0,25 s** vuelve a su sitio con `RESORTE.suave` (`alTope` de `useDeslizar`, `TILT` en `CaminoLecciones.jsx`). Al arrastrar por la **barra de puntitos** contra un extremo, quien hace el tilt es **la barra** (10 px y 2°).
9. **Carrusel continuo**: mientras se arrastra, **todo se mueve con el dedo**: lo que se va se encoge y se desplaza, lo que llega crece y se acerca al centro, interpolando posiciones y tamaños según el progreso (0 → 1). Sin cortes ni cambios de golpe al pasar.
10. Si el gesto empieza más vertical que horizontal, se ignora (deja hacer scroll). El contenedor lleva `touch-action: pan-y`.
11. Tras arrastrar, el «click» de soltar no activa botones.
12. Mismas reglas en **todos** los carruseles: camino de islas y pestaña de **Módulos**. Cada carrusel escribe su posición continua en `data-posicion` (sirve para medir el gesto con Playwright).

**Swipe de página** (cambiar de módulo; `components/CambioModulo.jsx` → `useCambioModulo`, en la pantalla de Módulo): con el camino **cerrado** (ninguna isla abierta), **deslizar de lado** pasa de módulo (a la izquierda → el siguiente; a la derecha → el anterior) y, en el celular, **tirar «más abajo» del final de la página** (`ui/useTirarBordes.js`, eventos táctiles) pasa al siguiente. **Tirar hacia abajo estando arriba del todo** pasa al **anterior**, pero **solo si el dedo se apoyó por debajo del título del módulo** (`limiteRecarga` = borde de abajo del `<h1 data-titulo-modulo>`; ≈ el 78–80 % de abajo de la pantalla en el celular; respaldo `DESLIZAR.pagina.recarga`); si se apoya **sobre el título o más arriba** (zona de recarga), el gesto no es nuestro y el navegador hace su **«tirar para recargar»** de siempre. Cuando el gesto es nuestro se cancela el `touchmove` (sin recarga ni rebote a la vez). Mismas reglas que el resto (zona muerta, **resistencia fuerte hasta el 30 %**, alcanza al dedo y lo sigue 1:1), pero con **«soltar para pasar»**: pasado el **50 %** el indicador dice **«Suelta para ir»** (texto con `tinta(acento)` del destino y el cuadrito crece a 1,12 con `RESORTE.pulsar`), la página sigue al dedo con goma y **solo cambia al soltar ahí**; si el dedo vuelve por debajo del 50 % antes de soltar, vuelve a «Siguiente/Anterior» y al soltar regresa a su sitio (así no hay cambios por error). Opción `soltarParaPasar` de `useDeslizar` (y `listo`, ±1 cuando soltar pasaría); `useTirarBordes` hace lo mismo en vertical. Además, **X más larga** (`DESLIZAR.pagina`: 60 % del ancho en el celular, 320 px en ancho, 240 px en vertical) y **sin gesto rápido ni avance continuo** (cambiar de página tiene que ser a propósito). Toda la página (`<main>`) se desplaza con el dedo y por el borde **asoma el módulo de destino** (cuadrito de 56 px + «Siguiente / Anterior · Módulo N» en un **panel de vidrio** `VIDRIO_PANEL` `rounded-3xl`), que entra del todo justo en el punto en que ya se puede soltar. Si el vecino no tiene lecciones: goma y el indicador dice «Próximamente» (se ve entero con poco recorrido). Al pasar, lo visible se congela y la página nueva entra con la transición de pantalla **desde el lado del gesto** (`App.jsx`: entre módulos, el siguiente entra por la derecha y el anterior por la izquierda). Con una isla abierta, el swipe lateral es del camino (islas), **salvo hacia fuera desde los extremos** (pedido del usuario): con la **insignia** abierta (primer nodo), deslizar hacia la derecha o **tirar desde arriba** pasa al módulo **anterior**; con **Retos** abierta (último), deslizar a la izquierda o tirar más abajo del final pasa al **siguiente** (mismas reglas, «Suelta para ir»). Se reparten el gesto con `acepta(dir)` (en `useDeslizar` y `useTirarBordes`): al decidir el gesto, el camino ignora esa dirección y la toma la página; si el módulo vecino aún no existe, el camino hace su «tilt» como siempre. Con una isla abierta no hay rebote del navegador (`rebote: false`). Mientras se está en un módulo, `html` lleva `overscroll-behavior-y: none` cuando la página no está arriba del todo (sin rebote propio del navegador al final) y `auto` arriba del todo (para que funcione «tirar para recargar»). El indicador de arriba («Anterior · Módulo N») baja desde el borde superior respetando `safe-area-inset-top`. Los gestos que empiezan en una hoja o en la barra de puntitos (portales) no cuentan.

**Barra de puntitos** (paginador): **siempre a la vista** abajo en la pantalla de Módulo (pedido del usuario; también con el camino cerrado: tocar un puntito abre esa isla), **de vidrio** (`VIDRIO` de `src/ui/vidrio.js`), sin desvanecido debajo: el camino pasa por detrás desenfocado. Sube desde abajo con `RESORTE.pantalla` al entrar al módulo, respeta `env(safe-area-inset-bottom)` y, al cambiar de módulo, la de la página que se va se desvanece (`useIsPresent`) para que nunca haya dos. Píldora `rounded-full` con un puntito por elemento (el **primero es la insignia del módulo**: cuadradito del color del módulo, siempre opaco; el último, Retos, también cuadradito) en celdas de **44 × 56 px** (`DESLIZAR.puntitos.separacion`; si no caben —9 puntitos a 375 px— se estrechan a `(100vw − 56 px) / n` para que la barra nunca se salga). Hechos: opacos (`oscuro(acento)`); pendientes: atenuados (acento al 35 %); **aún no desbloqueados (o sin contenido): grises** (`zinc-300`). **La barra flota y hace de matraca** (dos capas en `BarraPuntitos`; constantes `FLOTA` y `MATRACA` en `CaminoLecciones.jsx`):
- **Flota**: mientras el dedo está apoyado, la barra **sigue al dedo** con resistencia (cada vez más duro, nunca más de ~14 px): en vertical siempre; en horizontal solo si el dedo sale más allá del primer o del último puntito. Se queda donde está mientras no se suelte; **al soltar** vuelve a su sitio con `RESORTE.suave`. Si se vuelve a apoyar mientras regresa, sigue desde ahí (sin saltos).
- **Matraca**: cada vez que el dedo **llega a otro puntito**, la barra da un **golpe de inclinación** con un resorte como `RESORTE.pulsar` pero **el doble de rápido** (rigidez ×4, amortiguación ×2: `MATRACA.golpe`) que depende **solo de la posición de ese puntito en la barra** (no del dedo ni del sentido del movimiento): los de la **izquierda** del centro giran en sentido **antihorario** y los de la **derecha** en sentido **horario**; la magnitud crece con la distancia al centro, de **0° en el central a 3° en las orillas** (con 7 puntitos: 3 · 2 · 1 · 0 · 1 · 2 · 3; `gradosMatraca(i, total)`). **Solo la inclinación** vuelve a 0 a los **0,05 s** (con `MATRACA.vuelta`, el `RESORTE.suave` el doble de rápido) (golpe seco, como una matraca). Contra un extremo (medio puntito más allá del primero o del último) da el golpe del puntito de esa orilla.
`html` y `body` llevan `overscroll-behavior-y: none` (salvo arriba del todo con el camino cerrado, para «tirar para recargar»; con una isla abierta, siempre): en Android, Chrome «estiraba» la página al pasar del borde y eso empujaba la barra fija fuera de la pantalla. Tras cambiar de isla (y al soltar el dedo), la página se desplaza lo justo para que la bola y el globo queden **por encima de la barra** (`BARRA_ALTO`). El del elemento actual mide 16 px y los demás 8 px, y el tamaño **sigue al progreso** del carrusel (crece/encoge con el resorte). **Tocar** un puntito va directo a ese elemento. **Arrastrar** por encima va **directo a la isla del puntito más cercano al dedo** (cambia al cruzar la mitad entre dos puntitos) con `RESORTE.pantalla`: **siempre gana una**, nunca se quedan dos islas a medio abrir con el dedo quieto entre puntitos (pedido del usuario; el carrusel continuo que sigue al dedo es solo al deslizar la **isla**). `touch-action: none` en la barra.

## 4. Componentes

- **Botón de Opciones** (`components/Opciones.jsx`, arriba a la derecha en Inicio): círculo de **vidrio** `size-11` (`VIDRIO`) con engranaje; abre la **Hoja** «Opciones» con **Apariencia**, **Vidrio** (Desenfoque / Opaco, control segmentado de 2) y Tu progreso. Apariencia = control segmentado (`Segmentado`) de 3 (`grid-cols-3 rounded-2xl bg-zinc-100 p-1`, opciones `min-h-16` con icono y texto; la activa con fondo `bg-white shadow-sm` que se desliza con `layoutId` y `RESORTE.pulsar`) y una frase que explica la opción.
- **Tu progreso** (`components/TuProgreso.jsx`, sección de Opciones bajo Apariencia): texto corto + **3 mosaicos de acción** en `grid-cols-3 gap-2` (`Pulsable tipo="tarjeta"`, `min-h-20 rounded-2xl bg-zinc-100`, **solo texto**: sin íconos propios, que no están entre los mínimos): **Copiar código**, **Compartir link** (`navigator.share`; si no hay, copia el link) y **Código QR** (activo = `bg-zinc-900 text-white`, despliega el QR con `SUBE`). Al copiar, el mosaico pasa a `bg-bien-suave text-bien-tinta` con `Check` y «¡Copiado!» y da un `SALTO` (vuelve a los 2,2 s); si no se pudo, `bg-fijate-suave` sin ícono. El QR (`components/CodigoQR.jsx`, SVG) va **siempre negro sobre blanco** (también en oscuro) dentro de una tarjeta. Debajo, «¿Tienes un código de otro dispositivo?»: campo `min-h-12 rounded-2xl border-2` (`text-base`, así iOS no hace zoom) + botón negro «Cargar»; si no vale, aviso `bg-fijate-suave text-fijate-tinta` con `Bombilla` que se desplaza a la vista.
- **Cargar progreso** (`pages/Importar.jsx`, `#/importar/CÓDIGO`): casita, título `font-titulo`, frase «se combina, no se borra nada», lista `rounded-3xl divide-y` con lo que trae (número `font-dato text-2xl font-medium tabular-nums`), interruptor «Usar también su apariencia» (solo si es distinta; `role="switch"`, pista `h-8 w-13` `bg-bien-relleno`/gris y bolita con `RESORTE.pulsar`) y botones apilados «Combinar con mi progreso» (negro) / «Ahora no» (borde). Error: tarjeta `bg-fijate-suave` con `Bombilla`. Al terminar: círculo `bg-bien-relleno` con `Check` que entra con rebote y «Ahora tienes» con los números dando un `SALTO` uno tras otro.
- **`BarraAccion`** (`pages/Leccion.jsx`, también en Oído): **panel de vidrio que flota** abajo (`VIDRIO_PANEL`, `rounded-[1.625rem] p-2.5`, a 12 px de los bordes; respeta `env(safe-area-inset-bottom)`; el margen alrededor deja pasar los toques) con feedback (sólido: `bien-suave`/`fijate-suave`) + ayuda (`text-sm font-medium text-zinc-600`) + botón grande. **El botón «se llena»**: desactivado = **vidrio vacío** (`bg-zinc-900/[0.06]`, anillo `zinc-900/10`, texto `zinc-500`); listo = `bg-zinc-900 text-white`; acierto = `bg-bien-relleno text-blanco`. Al pasar de vacío a lleno, fundido de color (200 ms) y un `SALTO`.
- **Regla del vidrio** (pedido del usuario): **todo botón de solo ícono que sea una función de la app** (salir ✕, volver/casita, Opciones, cerrar una hoja o una tarjetita, flechas ‹ › de la pestaña de Módulos) es un **círculo de vidrio** `size-11 rounded-full` con `VIDRIO` (`src/ui/vidrio.js`) y el ícono en `text-zinc-700` (o `text-blanco` sobre una tarjeta de color). Los controles de un ejercicio (flechas de octava del Piano, Reproducir…) no.
- **Cabecera de lección/entrenador** (`Leccion.jsx`, entrenador de `Oido.jsx`): pegajosa y **de vidrio**, sin fondo propio (el paso pasa por detrás, desenfocado): ✕ en un círculo de vidrio y, al lado, una **píldora de vidrio** `h-11` con la barra (`h-3`, el acento) y el contador `font-dato tabular-nums text-zinc-600`.
- **`Volver`** (`src/ui/Volver.jsx`): píldora de **vidrio** «‹ Atrás» (`VIDRIO`). Área de 44 px y se hunde.
- **`BotonInicio`** (`src/ui/Volver.jsx`): para volver a Inicio, **solo una casita** en un círculo de **vidrio** `size-11` (`VIDRIO`, `aria-label="Inicio"`), arriba a la izquierda en Módulo y en el panel de Oído (pedido del usuario: botón más chico).
- **Cabecera de Módulo** (`components/CabeceraModulo.jsx`): fila con la **casita** + **barra de progreso por lecciones** + botón de **Opciones** (engranaje, el mismo de Inicio). **Fija arriba** (`fixed`, respeta `safe-area-inset-top`) y **de vidrio** (pedido del usuario): casita y Opciones en círculos de vidrio y la barra dentro de una **píldora de vidrio** (`h-11 px-4`); sin desvanecido: al bajar la página, lo que pasa por debajo se ve desenfocado a través del vidrio. En cuanto el **título grande** del módulo **toca la píldora**, se **esconde** (fundido de 180 ms; también «MÓDULO N» con su propia línea) y aparece **en pequeño** bajo la barra, dentro de la píldora; nunca se ven los dos ni queda el grande a medias detrás del vidrio (`text-sm font-semibold`, la barra sube 8 px para dejarle sitio, con `RESORTE.suave`). La barra tiene **un segmento por lección** (`gap-1.5`, `h-2.5`, carril `zinc-200`); cada segmento se llena con el avance de su lección (completada = lleno, a medias = paso / pasos). **Vive en `App.jsx`, fuera de la transición de páginas**: al pasar de un módulo a otro se queda quieta; el color cambia con un fundido de 350 ms, los rellenos con resorte y, si cambia el número de lecciones, los segmentos crecen o se encogen (`flexGrow`) **dentro** de la barra (la zona de la barra es `flex-1 basis-0 min-w-0`; la casita y la rueda nunca se mueven). La página de Módulo le deja su hueco (`h-11`). Al venir de Inicio o ir a una lección, entra/sale con la página. El indicador «Anterior · Módulo N» de tirar desde arriba sale **por debajo** de la cabecera (`ALTO_CABECERA`).
- **Pantalla tipo lista** (Inicio, Módulo, panel de Oído, portada del entrenador): `motion.main` con `variants={lista}` y cada bloque con `variants={itemLista}`.
- **Chips seleccionables** (niveles, dirección): `Pulsable` `min-h-12 border-2`; activo `bg-zinc-900 text-white`, inactivo `bg-white border-zinc-200`.
- **Tarjeta de navegación**: `Pulsable tipo="tarjeta"`, `rounded-3xl border bg-white`, icono `size-12 rounded-2xl` a la izquierda, título `text-lg font-semibold`, subtítulo `text-sm text-zinc-500`, `›` gris a la derecha.
- **Tarjeta destacada** (siguiente lección): fondo = acento oscurecido, texto blanco, botón blanco dentro.
- **Contenido futuro** ("Próximamente"): muchos elementos → lista compacta dentro de un recuadro con borde punteado (Inicio);
  pocos (una lección dentro de un módulo) → tarjeta con `border-dashed border-zinc-300` sin `›` y texto `zinc-500`.
- **Módulos en Inicio**: rejilla de **cuadritos** (`Cuadrito` de `components/NavegadorModulos.jsx`: `rounded-3xl` de 76 px, número sobre `oscuro(acento)` con labio; punteado si aún no existe) con el título debajo y `hechas/total` o «Próximamente». 3 columnas en el celular, 5 en ancho. Tocar uno abre el módulo y sus islas **se despliegan** desde la insignia.
- **Camino de lecciones** (`components/CaminoLecciones.jsx`, pantalla de Módulo): islas estilo Duolingo que empiezan con una **insignia** (cuadrado `rounded-3xl` de 72 px con el número del módulo). Al entrar, las islas **salen de la insignia** una tras otra (70 ms entre ellas, ~0,5 s con un rebote al llegar) y el camino se estira con ellas. La **insignia es el primer nodo del carrusel**: al tocarla se abre como las islas (cuadrito grande + **tarjetita** con el título del módulo, «Módulo N · x/y lecciones», la descripción, «Ir a la 2.2» —o «Ver retos» si ya están todas— y «Ver todos los módulos», que abre la pestaña de **Módulos**: hoja con un carrusel lateral de tarjetas, una por módulo, con las reglas de swipe; flechas ‹ › y «Módulo N de 10»; «Ir al módulo N» / «Estás aquí» / «Próximamente»). Internamente el carrusel va por **nodos**: 0 = insignia, isla i = nodo i + 1. Al final del camino (lado opuesto a la insignia) está la isla de **Retos**: trofeo con borde del acento (rellena cuando todos están hechos); abierta muestra el reto del módulo y «Ver retos», que abre una hoja con el reto del módulo («Lo hice») y el reto de FL de cada lección (abre la lección directo en su reto: `#/leccion/1.1/reto`). En la barra de puntitos, el de Retos es un cuadradito. Celular (< 560 px): vertical en zigzag con el título **debajo**; ancho: horizontal ondulado con el título **encima**. Isla = círculo de 80 px con **labio** inferior sólido (`box-shadow: 0 6px 0` del acento al 45 % con negro; relieve plano, no sombra difusa). Estados: hecha (relleno del módulo + **su número** + `MarcaBien` en la esquina), actual (número + anillo `claro(acento)` con arco de avance), bloqueada (`zinc-200` + candado), próximamente (blanca, borde punteado, «…»). Camino: curva SVG punteada gris; los tramos hacia islas alcanzables se pintan con el acento. Títulos sobre `bg-fondo` para que el camino pase por detrás.
- **Camino en pantallas anchas (≥ 560 px): ampliado y con desenfoque** (pedido del usuario): el camino se sale del ancho del texto (sección con `marginInline` negativo, hasta **1400 px** dejando 20 px a cada lado) y **todo se amplía** con una capa `lienzo` escalada (`ZOOM` en `CaminoLecciones.jsx`): con el camino **cerrado** según la columna de cada isla (130 px sin ampliar), hasta **1,8×**; con una isla **abierta**, además que quepan el globo y sus vecinas (760 px) y que la bola y el globo quepan sobre la barra de puntitos, hasta **1,5×** (el globo no queda gigante). Al abrir o cerrar, el zoom pasa de uno a otro con el mismo resorte (las posiciones se mezclan en píxeles reales).  En el celular nada cambia (zoom 1).
- **Cerrar una isla = vista completa** (pedido del usuario): la isla abierta se cierra con la ✕, **tocando la propia isla** (la bola se hunde y la cierra), tocando fuera, con Escape o **desplazando la página hasta que la isla deja la mitad de la pantalla** (pedido del usuario; `MITAD_CIERRA` en `CaminoLecciones.jsx`): con el dedo, la rueda o la inercia, la isla se cierra **justo cuando ella y su tarjetita quedan enteras por encima o por debajo de la mitad de la pantalla** (si al abrirse no tapaban la mitad, la línea se mete 8 px dentro de ellas). **Con el dedo aún apoyado**, si se vuelve a traer la isla a la mitad, **se abre otra vez**; si se **suelta** con la isla cerrada, ya no se reabre hasta abrirla a mano (con la rueda o la inercia tampoco se reabre). Mientras el dedo sigue apoyado el relleno de abajo compensa lo que se acorta el camino (sin el hueco de la tarjetita), para que la página no salte; se quita al soltar. Se mira el **gesto**, no cualquier scroll: los desplazamientos automáticos (al abrir o al pasar de isla) no la cierran, deslizar de lado (cambiar de isla) tampoco, y la posición se calcula con `scrollY` (no con lo que se ve), así «tirar más allá del borde» para cambiar de módulo no cuenta. Los gestos que empiezan en la barra de puntitos o en una hoja no cuentan; al cerrarse, el camino vuelve a la **vista completa**, sin desenfoque ni nada resaltado (la barra de puntitos sigue a la vista, de vidrio). (Hubo un «modo foco» con la barra transparente; se quitó.)
- **Desenfoque con una isla abierta** (pedido del usuario; celular y computadora): como fuera de foco, según la **distancia en islas** a la abierta (con decimales, sigue al carrusel y a la apertura): `DESENFOQUE.pasos` = 0 · **1** · 2,2 · 3,4 · 4,5 px (antes del zoom). Las de al lado apenas (su número se sigue leyendo), las siguientes más, y así; también la insignia y los títulos. Cada **línea** del camino se desenfoca como la **media de sus dos islas** (filtro SVG `feGaussianBlur` por tramo, con la zona justa de la línea).
- **Isla abierta = «isla + bocadillo»** (elegida por el usuario entre 4 propuestas): al tocar una isla, **crece hasta 112 px** (`BOLA`, con su labio y el **aro de avance** alrededor: pista `claro(acento)`, arco del acento) y debajo **sale un globo** (`Globo`) que apunta a ella con un **piquito**. El globo sale de la isla con `--contenido` (fundido + baja 14 px + escala 0,94 → 1). El centro de la bola queda en el punto del camino; la altura real del globo se **mide** (ResizeObserver) y las islas de abajo se apartan lo justo. Globo: `rounded-3xl p-5`, ancho `min(ancho − 24, 340)` en el celular y 320 en ancho; título `text-xl font-bold` (deja sitio a la ✕ de 44 px arriba a la derecha), una línea de estado (`~14 min · 16 pasos` / `Paso 7 de 16 · 38 % · ~14 min` / `✓ Completada · 19/20 a la primera` / candado + «Termina la 2.1 antes» / «Llega pronto») y **botones a lo ancho** (`BotonGlobo`: principal `min-h-13` relleno, secundario `min-h-12` con borde). Colores del globo: disponible → `oscuro(acento)` con `text-blanco` y botón `bg-blanco` con texto del acento; bloqueada → gris (`zinc-200`) con botón negro; próximamente → blanco con borde punteado; **Retos** → trofeo en la bola, globo blanco con borde del acento (relleno del acento cuando están todos hechos), reto del módulo, «x/y hechos» y «Ver retos». **Dónde queda la página con una isla abierta** (pedido del usuario; `scrollPara(k)`, calculado con la disposición): si la isla (con su aro) y su tarjetita **caben enteras con la página arriba del todo**, la página se queda **arriba del todo** (así el título del módulo se ve grande); si no, quedan **centradas** en la zona libre entre la píldora de la cabecera y la barra de puntitos (si tampoco caben, pegadas arriba de esa zona). Con el camino cerrado, **la página se desplaza primero** (scroll suave) y **la isla se abre cuando ya está en su sitio**. Al **pasar a otra isla**, la página va **a la vez** que el carrusel (cada fotograma, mezclando el sitio de las dos islas según el progreso), **también con el dedo o el cursor aún apoyado** en la isla o en la barra: al llegar, ya está en su lugar. Si al final de la página no hay sitio, se añade un relleno debajo del camino. Con una abierta, el camino es un **carrusel continuo** (ver «Gestos»): la abierta vuelve a su tamaño mientras la vecina crece; la isla pequeña y la bola se cruzan opacas y el globo aparece después. Flechas ← → del teclado también cambian de isla. Se cierra con ✕, tocando la isla abierta, tocando fuera o con Escape (vuelve la vista completa, sin desenfoque).
- **Hoja inferior** (`src/ui/Hoja.jsx`): bottom sheet tipo iOS (Opciones, Módulos, Retos). El cuerpo es sólido; la **cabecera** (asa + ✕, `h-14`, encima del contenido) se vuelve **de vidrio** (`bg-white/70` + desenfoque y una línea `zinc-200` abajo) en cuanto el contenido se desplaza por debajo. Se pinta en un **portal en `<body>`** con `z-[60]`/`z-[70]`, por encima de la cabecera fija y de la barra de puntitos (aunque la abra un botón de la cabecera); su ✕ es un círculo de vidrio. Mide como mucho el alto de la pantalla − 24 px; si el contenido no cabe, **se desplaza dentro** (`data-desplazable`, `overscroll-contain`) y entonces solo el asa arrastra la hoja (los campos de texto nunca la arrastran). Los hijos van en columna con `gap-5`. Fondo `bg-black/40` con fundido; la hoja sube con `RESORTE.pantalla`, `rounded-t-3xl`, asa gris arriba y ✕ de 44 px; se cierra tocando el fondo, con Escape o **arrastrándola hacia abajo**. En pantallas anchas flota centrada (`max-w-lg`, `rounded-3xl`). Botones apilados a lo ancho: principal negro y secundario con borde. El primer botón lleva `data-foco` (recibe el foco al abrir).
- **Lección a medias**: mini `BarraProgreso` (`h-1.5 w-24`) bajo «Continuar donde lo dejaste».
- **Piano** (`components/Piano.jsx`): Pointer Events, `touch-action: none`, `compacto` en lecciones, 1 octava en < 560 px. **El teclado completo va en una tira** (`data-tira`, `octaves / visibles` veces el ancho del teclado, teclas por nota) que se **recorre con `RESORTE.pantalla`** hasta la octava elegida (pedido del usuario: nada de cambiar las teclas de golpe); la posición es un `MotionValue` en octavas (`pos`) y la tira se mueve con `x` en % de su propio ancho. Si no caben todas las octavas, **debajo del teclado** va la **barra de octavas** (`components/SelectorOctava.jsx`, pedido del usuario en lugar de las flechas ‹ ›): control segmentado delgado como el de Apariencia (`h-11 rounded-full bg-zinc-100 p-1`, una opción por octava en `font-dato text-sm`, «Octava 3»; la activa con píldora `bg-white shadow-sm`, `dark:bg-zinc-300`). **Tocar** una octava va a ella; **deslizar** el dedo por la barra es un **slider**: tras 6 px de zona muerta, **la tira acompaña al dedo** (posición continua, `onSeguir(p)`, resorte `RESORTE.pulsar` que se reapunta en cada movimiento) y **al soltar se ajusta** a la octava más cercana con `RESORTE.pantalla` (`onSeguir(null)`); la **píldora**, en cambio, **nunca se queda entre dos octavas** (pedido del usuario, como la barra de puntitos): al cruzar la mitad de un segmento salta a él. Lo mismo cuando la octava cambia por la prop `ir` o por **`senalar`** (`{ nota, n }`: va a la octava de esa nota e **ilumina** su tecla 600 ms en celeste, como si se tocara, sin llamar a `onNoteOn`). El multitouch y deslizar entre teclas siguen igual (`elementFromPoint` sobre la tira movida); al recorrer la tira no se sueltan las notas. Con **reducir movimiento** la tira y la píldora saltan sin recorrido (solo el arrastre sigue al dedo). **Sentido** (pedido del usuario; Opciones → **Barra de octavas del piano**: `octavas` = `vista` | `teclas`): por defecto 3 · 4 · 5 (deslizar a la derecha mueve la *vista* hacia las agudas); con **«Mover las teclas»** la barra va al revés (5 · 4 · 3): deslizar a la derecha **arrastra el teclado** con el dedo y trae las graves (`invertida` en `SelectorOctava`, que traduce posición en la barra ↔ octava real). `touch-action: pan-y` en la barra (deja hacer scroll vertical). `useSobreBarra` vigila todo el bloque (teclado + barra).
- **Escuchar y ver** (pedido del usuario): todo botón «Escuchar…» que convive con un teclado o con casillas **señala cada nota justo cuando suena**: `BotonSonido` con `onNotas(notas, i)` (usa `seguirNotas` de `audio/sonido.js`, que reparte los tiempos igual que `playNotes`), el Piano la recibe en **`senalar`** (`{ notas, n }`: va a la octava de la primera nota y **ilumina sus teclas en celeste** `BRILLO_MS` = 550 ms, +300 ms si tuvo que viajar de octava para que se vea ya quieta) y las casillas que suenan llevan **aro celeste** (`ring-4 ring-sky-300`, `dark:ring-sky-500`; celeste = «suena», como la tecla pulsada y el botón sonando) con un `SALTO` (en `Casilla`; en la fila de la fórmula, solo el aro, por posición). En `TocaEnPiano` lo reparte el hook `useSenal` (botones de referencia «Do4», «Escuchar Do → Re», «Escuchar las 3 La», «Escuchar lo que tocaste»); en el entrenador de oído, al tocar una opción ya respondida, sus notas se iluminan en el teclado de repaso.
- **Casillas de objetivo del teclado** (`Casilla` en `TocaEnPiano.jsx`: «La3 · La4 · La5» en P4, «La más grave / La más aguda» en P2; pedido del usuario): grandes (`min-h-16 rounded-2xl border-2 text-xl font-semibold`, texto centrado), **sin ✓ ni círculo**. Pendiente = contorno `zinc-200` sobre blanco; al tocar la tecla correcta da un **`POP`** (`scale: [1, 1.14, 0.97, 1]`, 0,4 s, en `movimiento.js`) y se **rellena de verde** (`bg-bien-relleno text-blanco`, fundido de 200 ms). Si se vuelve a tocar en el piano una nota **ya conseguida**, su casilla **tiembla** (`useTemblor`, sección 3) para que se vea cuál es, también cuando ya están todas. En «Todas las octavas» (P4) **las casillas también son botones** (`Pulsable`; pedido del usuario): **gris** → solo suena su nota (no se marca ni se mueve el teclado: no se regala la respuesta); **verde** → suena, el piano va a su octava y la tecla se ilumina (`senalar`), para repasar aunque ya estén todas. En los pasos «Todas las octavas» (P4) el título es corto (**«Encuentra la nota»**) y sin `intro`: la consigna va en la frase «Toca todas las La del teclado».
- **Opciones de respuesta**: `min-h-16 rounded-2xl border-2`, en rejilla de 2 (o 3 si hay > 4). En lecciones son `Pulsable tipo="tarjeta"` y la correcta da un `SALTO`.
- **Rondas** (`components/exercises/Rondas.jsx`): puntos de progreso de un ejercicio; la ronda actual crece en vertical con `RESORTE.pulsar`, el color cambia con fundido.
- **Mini Piano Roll** (`components/PianoRoll.jsx`): tarjeta `rounded-3xl` con teclado a la izquierda (`w-14`, filas negras `bg-zinc-800`), números de tiempo arriba, líneas más marcadas cada tiempo, filas de teclas negras en `bg-zinc-100`. Notas = acento del módulo, más claras cuanta menos velocity (`color-mix`), aparecen con `RESORTE.pulsar`; las notas guía («fantasma») son contornos punteados grises (verdes al resolver). Filas `h-10` si hay ≤ 6, `h-8` si hay más. Las casillas miden ~35 × 32 px: excepción aceptada, como las teclas del piano (es una rejilla para arrastrar, no botones sueltos). Botón «Reproducir» como `BotonSonido`; el cabezal es una columna azul que avanza por casillas (sin animación: funciona igual con «reducir movimiento»). Selector de nombres «Esta app / FL Studio»: control segmentado `bg-zinc-100 p-1`, opción activa `bg-white shadow-sm`.
- **Pad de pulso** (`exercises/Pulso.jsx`; BPM y contador con `font-dato`): botón enorme (`h-40 rounded-3xl`, fondo `oscuro(acento)`, texto blanco) que responde en `onPointerDown` (no en `click`, para medir el tiempo). Con ayuda visual, un círculo blanco late en cada tiempo (fundido de 350 ms). Encima, el **medidor antes/tarde**: carril `h-10 rounded-full bg-zinc-100` con la zona buena en `bien-suave`, línea central y una bola que se desplaza con `RESORTE.pulsar` (verde a tiempo, oro fuera). Debajo del medidor, puntos de aciertos que dan un `SALTO`. Botón Empezar/Parar: `min-h-14 border-2`, negro al empezar y blanco mientras suena.
- **Contador del compás** (`Contador` en `exercises/Pulso.jsx`, ronda con `contar`): fila de casillas `h-12 rounded-2xl border-2` a lo ancho, una por tiempo («1 2 3 4») o por corchea («1 y 2 y…»); los números `text-xl font-bold`, las «y» más pequeñas. La que suena se llena con `oscuro(acento)` y `text-blanco` (fundido de 100 ms); las que hay que tocar llevan **aro** del acento oscurecido. Va entre «Empezar» y el medidor. Con un patrón irregular (`toques`, p. ej. síncopas o el dembow) llevan aro solo las casillas del patrón y el pad late solo en esos golpes. En semicorcheas (`contar: 'e'`, «1 e y a») son 16 casillas en **dos filas de 8**; con swing (`contar: 'swing'`, «1 · y», el tiempo en tresillo) 12 casillas en **dos filas de 6** (cada fila = 2 tiempos; columnas con `gridTemplateColumns`); los números van en `zinc-900` y las sílabas en `zinc-600`.
- **Medir un paso** (`tocar` → `paso`, P5): como «Comparar»: frase `text-xl font-semibold` («Sube **un tono** desde Mi4», con el paso subrayado en `decoration-fijate` y la nota en `bg-fijate-claro`) + `BotonSonido` de la nota de salida; en el Piano la salida va marcada (oro) y, **tras 2 fallos, también la meta**. Al acertar sube con `SUBE` un `BotonSonido` a lo ancho «Escuchar Mi → Fa♯». El fallo dice cuánto se movió («De Mi4 a Fa4 hay **un semitono**»).
- **Fila de la fórmula** (`tocar` → `formula`, P6; `FilaFormula` en `TocaEnPiano.jsx`): una rejilla con una casilla por nota (`h-11 rounded-xl border-2 text-sm font-semibold`; tocada = `bien` con su nombre y `SALTO`, la que toca = borde `zinc-900`, pendientes «?») y encima, **entre cada pareja**, una pastilla redonda con el paso en `font-dato` (**T** en `bg-zinc-100`, **S** en `bg-fijate-suave text-fijate-tinta`: el semitono es el paso en el que hay que fijarse). Ocho notas caben en una fila a 375 px. El Piano sigue a la siguiente nota con la prop **`ir`** (pasa solo a su octava si no se ve).
- **Construir un intervalo** (`tocar` → `paso` con `intervalo`, P7): el mismo componente que «Medir un paso», con el intervalo con nombre subrayado («Sube **una 5.ª justa** desde Do4»). El fallo dice qué intervalo se tocó («De Do4 a La♯4 hay 10 semitonos (una 7.ª menor)») y lo que se busca; tras 2 fallos marca la tecla.
- **Emparejar** (`emparejar`, O6; `exercises/Emparejar.jsx`): una **fila por sonido** (`gap-2`): a la izquierda un botón `w-[4.75rem] rounded-2xl border-2` con `IconoPlay` + la letra (A, B…; azul `sky` mientras suena) y a la derecha el **hueco** `min-h-14 rounded-2xl border-2` (vacío = punteado «Vacío»; activo = borde `zinc-900` «Toca su nombre»; lleno = el nombre en `text-lg font-semibold`). Debajo, «NOMBRES» (`text-sm uppercase`) y los nombres en `grid-cols-2 gap-2`, `min-h-12 rounded-2xl border-2`; el nombre **viaja** al hueco y vuelve con `layoutId` (`RESORTE.suave`) y deja un hueco punteado en el banco. Tocar un hueco lleno lo devuelve. Al escuchar, la página sube lo justo para que los nombres no queden bajo la barra. Al comprobar, el banco desaparece y cada hueco va en verde con ✓ (`SALTO` escalonado) o en oro con bombilla, «Era **…**» y el `detalle` en `text-sm`. Pensado para 3–4 parejas: así filas y nombres caben juntos a 375 px.
- **Fichas que suenan** (`texto` → `fichas`; `pasos/Fichas.jsx`): tarjeta `rounded-3xl border` con cabecera `text-sm uppercase` («INTERVALO · SEMITONOS») y filas `divide-y`; **cada fila entera es un botón** (`Pulsable tipo="tarjeta"`, `min-h-16`): `IconoPlay`, nombre `text-lg font-semibold` + texto `text-zinc-500` (la canción de referencia) y el dato a la derecha en `font-dato text-2xl`. Mientras suena, la fila se tiñe de `sky-50`.
- **Explorar versiones** (`pulso` → `explorar` con `titulo` en cada opción): mismas tarjetas que el selector de tempos, pero con un nombre (`text-xl font-bold`: «Recto», «Tresillo»…) en lugar de los BPM; arriba el nombre en `text-3xl` y «descripción · 90 BPM».
- **Notas fuera de la rejilla** (swing, humanizar): en el Piano Roll de solo lectura se dibujan corridas de su línea (posición con decimales); su barra de velocity va en la columna más cercana.
- **Piano Roll con nombres propios** (`roll.nombres`): la columna de la izquierda muestra un texto (p. ej. «Redonda», «Semicorchea») en `text-sm font-semibold` y se ensancha a `w-[6.5rem]`. Sirve para la pirámide de figuras (solo lectura; con 16 columnas las casillas quedan estrechas, por eso no se usa para dibujar).
- **Piano Roll con compás** (`roll.compas`): los números de arriba vuelven a 1 en cada compás (el 1 en negrita) y la línea de inicio de compás es más oscura (`border-zinc-500`).
- **Selector de tempos**: tarjetas `Pulsable tipo="tarjeta"` en 2 columnas (BPM grande + género en `text-sm`); activa en negro. Arriba, tarjeta con el BPM en `text-4xl` y un círculo del acento que late en cada tiempo (más intenso en el 1).
- **`useSobreBarra(ref)`** (`src/ui/useSobreBarra.js`): si la barra inferior crece y tapa el piano o el roll, desplaza la página lo justo. Úsalo en cualquier elemento interactivo que viva cerca de la barra.

## 5. Evitar

- Gradientes por defecto, glassmorphism (única excepción aprobada: el **vidrio** de `src/ui/vidrio.js`, ver «Materiales», para lo que flota sobre el contenido: barra de puntitos, cabeceras, barra de abajo y botones de Inicio/Atrás/Opciones), sombras grandes, todo centrado, decoración sin función.
- Rojo para errores, emojis como íconos, colores fuera de las variables de significado, textos grises demasiado claros (`text-zinc-400` solo para elementos decorativos o desactivados).
- Animaciones lineales (`ease-linear`) o largas; animar al hacer scroll.
- Enlaces o botones con área táctil menor de 44 px (p. ej. "‹ Inicio" solo texto).

## 6. Cómo comprobar

1. `npm run build` sin errores.
2. Captura a 375 × 740 (y 768 px) con Playwright de las pantallas tocadas; revisa contraste, espacios y que nada quede bajo la barra inferior.
3. Prueba con `reducedMotion: 'reduce'` en Playwright (`page.emulateMedia({ reducedMotion: 'reduce' })`) que la app sigue funcionando.

## 7. Pendiente (de la revisión de diseño)

- Las filas del teclado del Piano Roll son `<button>` con `onPointerDown` (sonido inmediato, como teclas); no se hunden a propósito.

## Registro de decisiones

Las decisiones de diseño, con fecha, están en **`REGISTRO.md`** (en esta misma carpeta), de la más reciente a la más antigua.
Cuando el usuario apruebe un estilo nuevo: cámbialo en la sección que toque de esta skill y **añade una línea arriba de `REGISTRO.md`**.
