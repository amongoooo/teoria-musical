# Teoría Musical — guía para Claude

App web gratuita (GitHub Pages) para aprender teoría musical y producción en FL Studio, al estilo Brilliant: 10 módulos, lecciones cortas e interactivas con audio y retos prácticos en FL Studio.

- Plan completo: https://claude.ai/artifact/BPJh8PxMqQw6NAyuBgD16i
- Página publicada: https://amongoooo.github.io/teoria-musical/

## Preferencias del usuario (¡seguir siempre!)

- **Responder siempre en español.**
- **Indicar el porcentaje de avance del proyecto en cada respuesta**, y también el **avance aproximado de la tarea en curso** (p. ej. «Tarea actual: ~40 %»).
- **Hacer push después de cada commit.**
- **Al terminar una tarea, mandar el link de la página:** https://amongoooo.github.io/teoria-musical/
- **Al terminar, recomendar** para la siguiente tarea: chat (seguir en el mismo o abrir uno nuevo), modelo, nivel de esfuerzo y el prompt listo para copiar.
- El usuario trabaja **casi siempre desde el celular**: evitar pasos que necesiten terminal. Todo debe poder hacerse desde GitHub web o pidiéndoselo a Claude.
- **Diseño pensado primero para celular** (mobile-first): botones grandes, nada que dependa de hover o teclado físico.

## Stack

- **Vite + React en JavaScript** (`.jsx`, sin TypeScript).
- **Tailwind CSS v4** (plugin `@tailwindcss/vite`, configurado en `src/index.css`).
- **Tone.js** para el audio (piano con samples Salamander + sintetizador de respaldo).
- **motion** (Framer Motion) para animaciones con resortes: presets en `src/ui/movimiento.js`, botón/enlace que se hunde `src/ui/Pulsable.jsx`.
- Previstos: **Tonal.js** (teoría: escalas, acordes, intervalos), **@tonejs/midi** (leer/exportar MIDI).
- **localStorage** para el progreso del usuario.

Estilo visual: minimalista, fondo blanco/gris muy claro (`#fafafa`), tipografía grande (Inter / system-ui), mucho espacio.

**Diseño: antes de tocar cualquier pantalla, usar la skill del proyecto `.claude/skills/diseno/SKILL.md`** (tokens, componentes y movimiento tipo iOS). Actualizarla cuando el usuario apruebe un estilo nuevo.

## Estructura de carpetas

```
src/
  App.jsx               # Elige la página según la ruta (hash)
  router.js             # Rutas por hash: #/  #/modulo/1  #/leccion/1.1
  content/              # Contenido (datos), ver content/FORMATO.md
    modulos.js          # Los 10 módulos y sus lecciones (título, acento, reto…)
    index.js            # Registro de lecciones disponibles (getLeccion, getModulo…)
    modulo-01/leccion-1-1.js
  components/
    Piano.jsx           # Piano táctil (multitouch, glissando, octavas, teclas marcadas)
    CaminoLecciones.jsx # Camino de islas de un módulo (vertical en celular, horizontal en ancho; carrusel + barra de puntitos)
    PianoRoll.jsx       # Mini Piano Roll táctil (dibujar/alargar/borrar notas, velocity, nombres app/FL)
    BotonSonido.jsx     # Botón que reproduce un sonido del contenido
    NavegadorModulos.jsx # Pestaña de módulos (hoja con carrusel lateral) y `Cuadrito` del módulo
    Opciones.jsx        # Botón de Opciones (engranaje) + hoja con Apariencia: Claro / Oscuro / Automático
    Rich.jsx            # Texto con **negritas**
    pasos/              # Pasos no interactivos: PasoTexto, PasoSiente, Nota
    exercises/          # EscuchaElige, TocaEnPiano, ExploraFrecuencia, RetoFL, PianoRollEjercicio, Pulso, Rondas
  audio/engine.js       # Tone.js: initPiano, noteOn/Off, playNotes, playPattern, iniciarRitmo/pararRitmo, tiempoAudio/latenciaAudio, playFrequency, toneStart/Set/Stop
  audio/bateria.js      # Batería sintetizada: golpe('kick' | 'snare' | 'hat' | 'clap' | 'click')
  audio/sonido.js       # reproducir({ notas | frecuencia }) para el contenido
  theory/notas.js       # midi, frecuencia, nombre en español, compararAltura
  theory/bateria.js     # Nombres de percusión, claveNota y GROOVES (click, basico, bombo)
  progress/progreso.js  # localStorage: useProgreso, guardarPaso, completarLeccion, guardarReto
  theory/oido.js        # Modos del entrenamiento de oído: niveles, opciones y generar preguntas
  progress/opciones.js  # localStorage de opciones (tema); aplicarTema() pone la clase `dark` en <html>
  progress/oido.js      # localStorage del entrenamiento de oído: racha, minutos del día, niveles, estadísticas
  pages/                # Inicio, Modulo, Leccion (visor paso a paso), Oido (panel + entrenador)
  ui/                   # movimiento.js (resortes, ENTRA_DERECHA/SUBE/SALTO, DESLIZAR), useDeslizar.js (swipe con zona muerta, barrera y progreso continuo), Hoja.jsx (bottom sheet), useSobreBarra.js, Pulsable.jsx (se hunde al tocar), BarraProgreso.jsx, Volver.jsx, color.js (oscuro/claro)
.claude/skills/diseno/  # Skill de diseño del proyecto
public/samples/         # Samples de audio propios
.github/workflows/deploy.yml  # Despliegue automático a GitHub Pages
```

## Notas técnicas

- `vite.config.js` usa `base: '/teoria-musical/'` (necesario para GitHub Pages). Las rutas a archivos de `public/` deben usar `import.meta.env.BASE_URL`.
- El audio solo puede empezar tras un gesto del usuario: `Tone.start()` se llama en el primer toque (iOS lo exige). Ver `startAudio()` en `src/audio/engine.js`.
- El piano usa Pointer Events, `touch-action: none`, sin selección de texto ni menú contextual; `elementFromPoint` en `pointermove` para deslizar entre teclas. En pantallas angostas (< 560 px) muestra 1 octava con botones ◀ ▶.
- **Despliegue automático**: cada push a `main` ejecuta `.github/workflows/deploy.yml` (Node 20, `npm ci`, `npm run build`, publica `dist`). En Settings → Pages → Source debe estar seleccionado **GitHub Actions**.
- Comandos: `npm run dev`, `npm run build`, `npm run preview` (abre `/teoria-musical/`).
- **Lecciones**: cada lección es un archivo de datos en `src/content/modulo-XX/` registrado en `src/content/index.js`. Formato completo y tipos de paso en `src/content/FORMATO.md`. El visor (`pages/Leccion.jsx`) muestra un paso por pantalla, barra de progreso arriba y un único botón grande abajo que cada ejercicio controla con `setAccion` (Comprobar → retroalimentación → Siguiente/Continuar). El error nunca castiga: muestra la respuesta y la explica.
- **Desbloqueo**: `estadoLeccion(id, progreso)` en `content/index.js` → `proximamente | hecha | empezada | nueva | bloqueada`. Progresivo **dentro de cada módulo** (la 1.ª lección de cada módulo siempre abierta; cada una se abre al completar la anterior). Entre módulos no se bloquea. Las URLs directas a una lección no se bloquean.
- **Progreso**: `localStorage` clave `teoria-musical:progreso:v1` → `{ lecciones: { '1.1': { paso, completada, aciertos, total } }, retos: { '1.1': { hecho, nota }, 'M1': { hecho } } }` (`M1` = reto del módulo 1). Se guarda el paso actual para continuar donde se dejó.
- En las lecciones el piano usa `compacto` (teclas más bajas) para que quepa sobre la barra inferior en el celular.

## Decisiones de contenido

- **Módulo 1 (sonido, notas y teclado) se mantiene** como repaso: el usuario ya sabe algo de música. Mantener las lecciones ágiles e incluir ejercicios de oído desde el principio. Más adelante: una prueba rápida al inicio de cada módulo para saltar lo que ya se domina.
- **Sección aparte «Entrenamiento de oído»** (práctica diaria de ~5 min, fuera de las lecciones; ✅ hecha, ver Estado):
  - Oído relativo (lo principal): intervalos, acordes mayor/menor, grados de la escala.
  - Reto de «oído absoluto» tipo juego: adivinar la nota sin referencia, empezando con 2 notas y sumando más según los aciertos, con estadísticas. Sin prometer que se adquiera (en adultos es difícil); se presenta como juego.

## Estado del proyecto

**Avance: ~43 %** (módulo 1 completo; módulo 2: 1 de 5 lecciones)

- ✅ Fase 0: proyecto base (Vite + React + Tailwind, piano Tone.js apto para celular, despliegue a Pages).
- ✅ Fase 1 (parte 1): motor de lecciones — formato de contenido, visor paso a paso, navegación Inicio → Módulo → Lección, progreso en localStorage, ejercicios Escucha y elige, Toca en el teclado, pad de frecuencia y Reto en FL Studio.
- ✅ Lección 1.1 «Qué es una nota: frecuencia y altura» (11 pasos).
- ✅ Lección 1.2 «Las 12 notas y la octava» (12 pasos): nuevo objetivo `octavas` en TocaEnPiano (tocar una nota en todas las octavas), teclado sin etiquetas (`showLabels: false`), sonidos con notas dobladas a la octava.
- ✅ Audio en iPhone más robusto: `navigator.audioSession = 'playback'` (suena con el interruptor de silencio) y desbloqueo del audio también al soltar el dedo. En lecciones, si la barra inferior crece y tapa el piano, la página se desplaza sola.

- ✅ **Entrenamiento de oído** (`#/oido`, tarjeta en Inicio con racha y avance del día): meta de 5 min/día, racha de días (fecha local), últimos 7 días y estadísticas por elemento. Tres modos con niveles que suben al acertar 8 de las últimas 10: **Intervalos** (8 niveles, de 3ªM y 5ªJ al tritono; subiendo, bajando o a la vez), **Acordes** mayor/menor (arpegio + acorde → solo acorde → inversiones y registros), **Oído absoluto** como juego (empieza con Do y Sol y suma una nota por nivel hasta las 12; cambia de octava desde 5 notas). Tras responder se puede tocar cada opción para comparar y se ve en el Piano. Reutiliza `BarraAccion` de `Leccion.jsx`, `reproducir()`, `Piano`. Datos en `localStorage` clave `teoria-musical:oido:v1`.
- ✅ Oído absoluto sin trampa: entre pregunta y pregunta suena un «borrador» (ráfaga de notas cromáticas al azar de Do2 a Do6 + soplo de ruido rosa y un silencio) con `limpiarOido()` de `engine.js`; el modo lo activa con `limpiar: true`. Mientras suena, las opciones están desactivadas. `playNotes`/`reproducir` aceptan `retraso`.
- ✅ Lección 1.3 «Teclas blancas y negras: sostenidos y bemoles» (11 pasos): semitono y tono, ♯/♭, enarmonía, ejercicio principal encontrar **Do♯/Re♭** en todas las octavas (con y sin nombres), más Fa♯, Si♭, Mi♭; oído «¿semitono o tono?», quiz, «¿Qué se siente?» y reto en FL. El Piano resalta `marcadas` por altura (así `Db4` marca la tecla de `C#4`).
- ✅ **Diseño tipo iOS (primera parte)**: revisión de diseño a 375 px; skill de diseño del proyecto; `motion` con resortes; transiciones entre pantallas según la dirección (App.jsx, `MotionConfig reducedMotion="user"`); en Inicio entrada escalonada, tarjeta destacada con contraste corregido (acento oscurecido), módulos «Próximamente» compactos y barras animadas; en el visor de lecciones pasos que entran con resorte, barra de progreso con resorte, feedback con título en su línea y todos los botones con `Pulsable`. Pendientes de la revisión en la sección 7 de la skill.
- ✅ **Diseño tipo iOS (segunda parte)**: Módulo y Entrenamiento de oído (panel, portada y entrenador) con la skill: `Volver` de 44 px, `BarraProgreso` con resorte (también mini barra en lecciones a medias), entrada escalonada, todo lo tocable con `Pulsable`, preguntas que entran desde la derecha, la opción correcta da un salto, días de racha que aparecen uno a uno, contraste corregido (sin `text-xs` ni `zinc-400` en texto, color con `oscuro()`), feedback de oído absoluto sin repetir la nota.

- ✅ **Lección 1.4 «Leer el Piano Roll»** (13 pasos, cierra el módulo 1): filas = notas, columnas = tiempo, duración, velocity y la octava de FL (Do4 de la app = **C5** en FL; regla «FL = app + 1»). Nuevo tipo de paso **`pianoroll`** con el **mini Piano Roll** táctil (`components/PianoRoll.jsx`): tocar = crear, arrastrar = alargar, tocar nota = borrar, carril de velocity, Reproducir con cabezal, nombres app/FL. Objetivos `libre`, `copiar` (con notas fantasma, explica qué falta/sobra y ofrece la solución tras 2 fallos) y `velocity` (acentos). `texto` y `elegir` aceptan `roll` de solo lectura. `playPattern()` en `engine.js`.
- ✅ Ejercicios con la skill (pendiente de la sección 7): `Pulsable` en todas las opciones, tarjetas, retos, `BotonSonido` y flechas del Piano; preguntas que entran con `ENTRA_DERECHA`, `SALTO` al acertar, `Rondas` animadas; sin `animate-entrada`. Resumen de la pantalla final con entrada escalonada.

- ✅ **Lección 2.1 «Pulso y tempo»** (11 pasos, abre el módulo 2): pulso, tiempos, BPM, tempos por género, tap tempo y el beat básico (bombo 1 y 3, caja 2 y 4, hi-hat en corcheas). **Batería sintetizada** (`audio/bateria.js`, sin samples) que se puede usar como «nota» en todo (`playNotes`, `playPattern`, Piano Roll). Sonidos `{ groove, bpm, compases }`. Nuevo tipo de paso **`pulso`** (`exercises/Pulso.jsx`): **seguir** (tocar al pulso con medidor antes/tarde y compensación automática del retraso del dispositivo), **tempo** (tap tempo; medio/doble tempo cuenta como bien) y **explorar** (mismo beat a varios BPM). `iniciarRitmo()` programa el bucle con el reloj de audio (preciso aunque el navegador vaya lento). El Piano Roll acepta filas de batería.
- ✅ **Módulo como camino de islas** (tipo Duolingo): `CaminoLecciones` vertical en zigzag en el celular y horizontal en pantallas anchas, tramos coloreados al completar, anillo con el avance de la lección actual, desbloqueo progresivo dentro del módulo. Al tocar una isla se abre una **hoja inferior** (`ui/Hoja.jsx`) con detalles y acciones: **Empezar**, **Continuar / Empezar de cero** (a medias), **Repetir lección** (completada), **Ir a la lección anterior** (bloqueada). `reiniciarLeccion(id)` en `progreso.js`.
- ✅ **Camino según los bocetos del usuario**: insignia con el número del módulo al inicio, títulos encima (horizontal) o debajo (celular); al tocar una isla **crece en un círculo grande** con info, botones (Empezar / Continuar + Empezar de cero / Repetir; bloqueada → Ir a la anterior) y % de avance, y las demás se apartan. Con una abierta, **swipe lateral** pasa de isla. **Reglas de swipe para toda la app** en `ui/useDeslizar.js` + `DESLIZAR`, documentadas en la skill (sección 3b; ver las reglas actuales más abajo). La hoja inferior (`ui/Hoja.jsx`) queda disponible pero sin uso.
- ✅ **Swipe corregido y carrusel continuo**: `useDeslizar` devuelve un `progreso` en «pasos» (0 = en su sitio, ±1 = el vecino); X = 240 px en ancho y 35 % del ancho en el celular (`DESLIZAR` en `movimiento.js`). (Sus primeras reglas —barrera del 75 %, una isla por gesto— se reemplazaron; ver «Nuevas reglas de swipe».) `CaminoLecciones` es un **carrusel continuo**: posición real `p`, cada isla se interpola entre las disposiciones «abierta = floor(p)» y «ceil(p)» y crece según su cercanía (escrito en el DOM en cada fotograma, sin re-render). **Barra de puntitos** fija abajo (portal, safe-area): tocar va a la isla, arrastrar pasa de una en una. Probado con Playwright (ratón 1280 px y táctil 375 px).
- ✅ **Opciones y modo oscuro**: botón de engranaje arriba a la derecha en Inicio que abre una hoja «Opciones» con **Apariencia: Claro / Oscuro / Automático** (sigue al teléfono). Guardado en `localStorage` clave `teoria-musical:opciones:v1`; `index.html` aplica el tema antes de pintar. El tema oscuro redefine la paleta en `.dark` (`src/index.css`), así las clases de siempre sirven; `text-blanco` para texto sobre el acento, `bg-fondo`, `tinta(acento)` para texto de color y `tema-claro` para las teclas del piano. En Módulo se quitaron la descripción y el texto de ayuda bajo el camino.
- ✅ **Módulos en cuadritos, pestaña de módulos y Retos**: en Inicio los módulos son cuadritos con su título (los que no existen, punteados); al tocarlos se abre el módulo y las islas **se despliegan desde la insignia**. Tocar la insignia abre la **pestaña de Módulos** (`NavegadorModulos.jsx`, carrusel lateral con las reglas de swipe). Al final del camino, la **isla de Retos**: reto del módulo (se marca con «Lo hice», clave `retos['M1']`) y retos de FL de cada lección (ruta `#/leccion/1.1/reto` abre la lección directo en su reto y al continuar vuelve al módulo). Se quitaron «¿Qué se siente?» y el reto como texto de la pantalla de Módulo. (El swipe de entonces se reemplazó por las nuevas reglas.)
- ✅ **Nuevas reglas de swipe** (toda la app: islas, barra de puntitos y pestaña de Módulos; skill sección 3b): zona muerta de 14 px; **resistencia fuerte** hasta el 30 % de X (≤ 6,5 % de X); al pasar el 30 % **alcanza al dedo** con un resorte rápido y lo sigue 1:1; **imán al 50 % sin soltar y sin histéresis** (por encima se pega a la siguiente; por debajo se queda pegada a la de antes); soltar antes del 50 % vuelve (gesto rápido pasa uno); **avance continuo por zonas** ya pegado: dedo al 75–85 % de X → una isla cada 1000 ms, 85–90 → 700, 90–95 → 500, 95–98 → 350, 98–100 → 250; para al soltar, al bajar del 75 % o en el extremo; **tope de velocidad suave** solo para lo automático (`velocidadMax` 1,2 px/ms, crece si se queda atrás); **modo rápido** (`veloz`): con el dedo deprisa lo sigue sin resistencia ni paradas, así no se traba. La barra de puntitos mide desde el **centro del puntito tocado** (`origen`): la isla es siempre la del puntito más cercano al dedo. Barra de puntitos: `cadena` (misma curva y mismo 50 % entre puntitos, una isla por puntito, sin avance continuo). Los carruseles escriben `data-posicion`; medido con Playwright (ratón y táctil, 375 y 1280 px).

**Siguiente tarea:** lección 2.2 «Compás y tiempos fuertes» (4/4 y 3/4, tiempo fuerte, contar «1 y 2 y», medio tiempo del trap), reutilizando `pulso` y el Piano Roll de batería. Pendiente: prueba rápida al inicio de cada módulo para saltar lo que ya se domina.
