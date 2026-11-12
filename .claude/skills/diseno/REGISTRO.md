# Registro de decisiones de diseño

De la más reciente a la más antigua. Las reglas vigentes están en `SKILL.md`; aquí queda el porqué y cuándo.

- 2026-11-12: (pedido del usuario) El Piano se toca con el **teclado del computador como en FL Studio** (Z…M y, en el piano libre, Q…U); las teclas **se desvanecen** (300 ms) al soltarlas.
- 2026-11-12: (pedido del usuario) La **matraca** de la barra de puntitos se siente **como si el dedo la jalara**: la inclinación depende también de si el dedo está por encima (derecha → antihorario) o por debajo (derecha → horario) del eje; sobre el eje, o sin dedo (flechas, deslizar las islas), solo un **golpe lateral**.
- 2026-11-12: (pedido del usuario) **Opciones ordenadas por grupos** (Pantalla · Piano · Tu progreso, tarjetas tipo Ajustes de iOS con frases cortas); la **hoja se arrastra con eventos táctiles propios** (con el contenido arriba del todo, tirar hacia abajo la arrastra; ya no «se suelta» en Android); el aviso **«Siguiente · Módulo N» sale por encima de la barra de puntitos**.
- 2026-11-12: (pedido del usuario) **Escuchar y ver**: al pulsar un «Escuchar…», cada nota se ilumina en el teclado (que va a su octava) y su casilla lleva aro celeste mientras suena.
- 2026-11-12: (pedido del usuario) Opción **Barra de octavas del piano: Mover la vista / Mover las teclas** en Opciones: con «Mover las teclas» la barra va 5 · 4 · 3 y deslizar a la derecha arrastra el teclado hacia las graves.
- 2026-11-12: (pedido del usuario) Una isla abierta ya no se cierra al «subir la página» sino **cuando ella y su tarjetita dejan la mitad de la pantalla** (por arriba o por abajo); con el dedo aún apoyado, volver a la mitad **la reabre**; al soltar cerrada, queda cerrada.
- 2026-11-12: (pedido del usuario) Nueva animación general **«temblar»** (`useTemblor` + `TEMBLOR`): x, y y giro en ~0,25 s, amplitud inversa al tamaño en cada eje, giro inverso al tamaño, sentido e inicio al azar por movimiento; con reducir movimiento, parpadeo. Reemplaza el temblor solo en x de `Casilla`. En «Encuentra la nota» las **casillas también son botones** (gris = solo suena; verde = el piano va a su tecla y la ilumina). El **Piano va en una tira** que se recorre con resorte entre octavas y acompaña al dedo en la barra de octavas (sustituye al fundido de teclas al cambiar de octava).
- 2026-11-12: (pedido del usuario) La píldora de la **barra de octavas nunca se queda entre dos valores** (salta con resorte); al cambiar de octava las **teclas pintadas se desvanecen**; una casilla ya conseguida **tiembla** si se vuelve a tocar su nota; pasos P4 **compactos** («Encuentra la nota», sin texto explicativo).
- 2026-11-12: (pedido del usuario) Con una isla abierta, **subir la página** (dedo hacia abajo o rueda hacia arriba) **cierra la isla** y vuelve la vista completa; los desplazamientos automáticos, deslizar de lado y bajar la página no la cierran.
- 2026-11-11: (pedido del usuario) **Barra de octavas** debajo del Piano (control segmentado delgado que también es slider) en lugar de las flechas ‹ ›; **casillas de objetivo** del teclado más grandes, sin ✓ ni círculo: al acertar dan un `POP` y se rellenan de verde.
- 2026-11-11: (pedido del usuario) **Tres materiales**: vidrio = la app (flota y navega), superficie = la lección, color = el significado. La **barra de abajo pasa a panel de vidrio** y su botón **«se llena»** (vidrio vacío desactivado → negro/verde listo, con fundido y `SALTO`); el indicador de cambio de módulo y la cabecera de las hojas al desplazar, de vidrio. Nueva opción **Opciones → Vidrio: Desenfoque / Opaco** (clase `opaco`).
- 2026-11-11: Lección 3.2: interacción nueva **Emparejar** (O6: filas sonido + hueco, banco de nombres que viajan con `layoutId`), **fichas que suenan** (tabla de intervalos con su canción y los semitonos en DM Mono) y **Construir un intervalo** (P7, «Medir un paso» con intervalos con nombre).
- 2026-11-11: **Ícono de la app** (PWA): teclado Do-Re-Mi-Fa con las teclas en los colores de los módulos 1–4 sobre el neutro oscuro; sustituye al favicon con emoji 🎹.
- 2026-11-11: Lección 3.1 (abre el módulo 3, turquesa): ejercicios de teclado **Medir un paso** (P5) y **Seguir la fórmula** (P6) con la fila de la fórmula (T gris, S oro) y la prop `ir` del Piano. Teoría con **Tonal.js** en `src/theory/intervalos.js`.

- 2026-11-11: (pedido del usuario) **Regla del vidrio**: todo botón de solo ícono que sea función de la app (✕, casita, Opciones, cerrar, ‹ ›) es un círculo de vidrio; la **cabecera de las lecciones** y del entrenador de oído pasa a vidrio (✕ + píldora con la barra y el contador). La Hoja va en un portal por encima de todo.

- 2026-11-11: (pedido del usuario) Con una isla abierta, la página se queda **arriba del todo si la isla y su tarjetita caben** (título grande); si no, centradas. Al pasar de isla, la página se acomoda **a la vez**, sin esperar a soltar el dedo o el cursor.

- 2026-11-11: (pedido del usuario) Al abrir una isla (o pasar a otra), **la isla y su tarjetita se centran** en la pantalla. El **título grande se esconde** en cuanto toca la píldora de la cabecera y aparece el chico (nunca los dos).

- 2026-11-11: (pedido del usuario) La barra de puntitos de **vidrio** se ve **siempre** en el módulo (sin desvanecido); la **cabecera de Módulo** (casita, barra de progreso en una píldora, Opciones) y los botones de Inicio/Atrás/Opciones también son de **vidrio** (`src/ui/vidrio.js`). **Tocar la isla abierta la cierra** y al cerrar vuelve la **vista completa** sin desenfoque (se quita el modo foco).

- 2026-11-11: (pedido del usuario) La barra de puntitos transparente pasa a **vidrio** (contorno blanco delgado, desenfoque de lo de detrás, brillo arriba) para que no se pierda sobre el camino.

- 2026-11-11: (pedido del usuario) **Modo foco**: al cerrar la tarjetita, la barra de puntitos se queda **transparente** para recorrer las islas sin abrirlas (isla en foco nítida y un poco más grande, las demás desenfocadas); tocar la isla la abre, tocar fuera la esconde.

- 2026-11-11: (pedido del usuario) **Desenfoque por distancia** a la isla abierta (islas, títulos y líneas; antes era por tamaño y solo de un lado), **insignia en el carrusel** (su puntito en la barra y su tarjetita al abrirla), **cambio de módulo con una isla abierta** desde la insignia (anterior) o Retos (siguiente) y **matraca** con el doble de inclinación (3°) y la mitad de tiempo.

- 2026-11-11: (pedido del usuario) En computadora, **islas más grandes** que llenan el espacio (camino hasta 1400 px de ancho, zoom 1,8× cerrado y 1,5× con una isla abierta) y **desenfoque** de las islas cuanto más pequeñas.

- 2026-11-11: Rediseño unido a main: **Tu progreso** y **Cargar progreso** con la paleta nueva (`bien-*` en «¡Copiado!», el ✓ y el interruptor; `fijate-*` en los avisos), `Check`/`Bombilla` de `Iconos.jsx` (los mosaicos quedan solo con texto) y `T4` «Comparar versiones» para `explorar` con versiones con nombre y números con `font-dato`. Etiquetas de paso de las lecciones 2.4 y 2.5 en `actividad.js`.

- 2026-11-11: (pedido del usuario, artefacto «Íconos, colores y fuentes» v5) **Paleta Lospec500 repartida en papeles**:
  gris = estructura y bloqueado (con candado), verde = bien (con ✓), oro = fíjate (con bombilla) y un color por módulo
  (M10 `#5e5b8c`), con variables por significado en `src/index.css` (claro y oscuro) y `acento: 'var(--color-modulo-N)'`
  en `modulos.js`. **Íconos mínimos** propios en `src/ui/Iconos.jsx` (oreja, teclas, trofeo, ✓, bombilla, candado +
  reproducir, cerrar, inicio, opciones); fuera los emojis; **etiqueta de cada paso** = ícono de actividad + nombre del
  ejercicio. **Fuentes por rol** con @fontsource: Bricolage Grotesque (títulos), Figtree (texto), DM Mono (datos),
  Pixelify Sans (racha y niveles). Islas y cuadritos hechos muestran su número con un ✓ verde en la esquina; la pantalla
  de lección completada usa el verde. Opciones → Apariencia solo con texto.

- 2026-11-11: Lección 2.5: contador en **tresillo** para el swing (dos filas de 6), opciones con nombre en «explorar» (cuánto swing) y notas fuera de la rejilla en el Piano Roll.

- 2026-11-11: **Tu progreso** en Opciones (copiar código, compartir link, QR, pegar código) y pantalla **Cargar progreso**; la **Hoja** se desplaza por dentro si no cabe.

- 2026-11-11: (pedido del usuario) La inclinación de la matraca vuelve a los **0,1 s** (antes 0,25 s).

- 2026-11-11: (pedido del usuario) Matraca: el **sentido y la magnitud** dependen solo del **puntito de llegada** (izquierda = antihorario, derecha = horario; 0° en el centro y 1,5° en las orillas), ya no del dedo.

- 2026-11-11: Arreglo: al cambiar de módulo la rueda de Opciones se desplazaba y el segmento nuevo salía detrás de ella. Causa: la página que entra desde la derecha ensanchaba la pantalla en el celular. **`#root { position: relative; overflow-x: clip }`** (lo que se sale por los lados —también la página que sale, en posición absoluta— nunca ensancha la pantalla), la zona de la barra con ancho fijo y los indicadores del swipe de página dentro de una capa fija `inset-0 overflow-hidden` (escondidos fuera del borde derecho también ensanchaban la pantalla). **Regla**: nada debe salirse por los lados de la pantalla; si algo se esconde fuera del borde, que sea dentro de un contenedor que recorte.

- 2026-11-11: (pedido del usuario) Cabecera de Módulo **fija con desvanecido**, **título en pequeño** al bajar, **Opciones** en lugar de «x/y» y **barra por lecciones** (un segmento por lección con su avance). El indicador de tirar desde arriba sale por debajo de la cabecera.

- 2026-11-11: (pedido del usuario) Zona de «tirar para recargar» = **del borde de arriba hasta el final del título del módulo**; por debajo del título, tirar desde arriba lleva al módulo anterior (antes: solo el 25 % de abajo).

- 2026-11-11: (pedido del usuario) Al abrir una isla, **primero se desplaza la página y luego se abre** (globos grandes nunca bajo la barra). Matraca: **1,5° sobre el eje, 3° por encima**. Arrastrar por la barra de puntitos va **directo a la isla del puntito más cercano** (siempre gana una).

- 2026-11-10: (pedido del usuario, aclarado) Barra de puntitos **flotante** (sigue al dedo con resistencia y vuelve al soltar) + **matraca** (golpe de inclinación al pasar de puntito, más fuerte cuanto más lejos del eje está el dedo; solo la inclinación vuelve a los 0,25 s). Reemplaza el tilt de «salta y vuelve».

- 2026-11-10: (pedido del usuario) Tilt de la barra de puntitos **proporcional a la distancia del dedo al centro** (también funciona en los puntitos del centro); el desplazamiento vertical sigue igual.

- 2026-11-10: (pedido del usuario) El **tilt** es sobre todo de la **barra de puntitos**: arrastrarla arriba/abajo (o de lado en un extremo) la inclina y desplaza un poco hacia el dedo y vuelve a los 0,25 s; nunca se mueve. Arreglado que la barra se escondiera abajo en Android (estirón del navegador al pasar del borde → `overscroll-behavior-y: none` en `html` y `body` con una isla abierta). Se mantiene el tilt de la isla en los extremos.

- 2026-11-10: (pedido del usuario) **Cabecera de Módulo fija entre módulos** (la barra solo cambia de color y valor), **casita** en lugar de «‹ Inicio», puntitos **grises** para islas bloqueadas, **desvanecido** bajo la barra de puntitos y **tilt** de la isla en los extremos en lugar de goma (arregla que la isla de Retos se fuera bajo la barra).

- 2026-11-10: (pedido del usuario) Swipe de página con **«Suelta para ir»**: pasado el punto aparece el aviso y solo cambia de módulo al soltar; si se regresa el dedo, no pasa nada. (Las islas siguen con imán sin soltar.)
- 2026-11-10: (pedido del usuario) **Tirar desde arriba** → módulo anterior, solo si el gesto empieza por debajo del 75 % de la pantalla; más arriba, el navegador recarga la página.
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
