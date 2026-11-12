# Teoría Musical — guía para Claude

App web gratuita (GitHub Pages) para aprender teoría musical y producción en FL Studio, al estilo Brilliant: 10 módulos, lecciones cortas e interactivas con audio y retos prácticos en FL Studio.

- Plan completo: https://claude.ai/artifact/BPJh8PxMqQw6NAyuBgD16i
- Página publicada: https://amongoooo.github.io/teoria-musical/

## Preferencias del usuario (¡seguir siempre!)

- **Responder siempre en español.**
- **Indicar el porcentaje de avance del proyecto en cada respuesta**, y también el **avance aproximado de la tarea en curso** (p. ej. «Tarea actual: ~40 %»).
- **Hacer push después de cada commit.**
- **Hacer merge a `main` siempre que se pueda** (crear el PR de la rama y unirlo al terminar cada tarea, para que se publique).
- **Al terminar una tarea, mandar el link de la página:** https://amongoooo.github.io/teoria-musical/
- **Al terminar, recomendar** para la siguiente tarea: chat (seguir en el mismo o abrir uno nuevo), modelo, nivel de esfuerzo y el prompt listo para copiar.
- El usuario trabaja **casi siempre desde el celular**: evitar pasos que necesiten terminal. Todo debe poder hacerse desde GitHub web o pidiéndoselo a Claude.
- **Explicar lo mínimo cómo funciona la app**: que sea intuitiva (resaltar, color, movimiento) en vez de textos de instrucciones.
- **Diseño pensado primero para celular** (mobile-first): botones grandes, nada que dependa de hover o teclado físico.

## Qué leer según la tarea

Este archivo es el **mapa**; el detalle está en estos documentos (léelos solo cuando la tarea los necesite):

| Si vas a… | Lee primero |
|---|---|
| Tocar cualquier pantalla, componente, ejercicio o animación | **Skill `.claude/skills/diseno/SKILL.md`** (tokens, componentes, movimiento, gestos). Su historial: `REGISTRO.md` en la misma carpeta |
| Escribir o cambiar una lección | **`src/content/FORMATO.md`** (tipos de paso y sonidos) + **`src/content/INTERACCIONES.md`** (catálogo L1…X1 y plantilla de orden) |
| Saber cómo se hizo algo antes (nombres, decisiones, cómo se probó) | **`docs/HISTORIAL.md`** (todas las tareas hechas, con detalle) |
| Ver el contenido del curso (módulos, lecciones, retos) | `src/content/modulos.js` |

## Stack

- **Vite + React en JavaScript** (`.jsx`, sin TypeScript) · **Tailwind CSS v4** (`@tailwindcss/vite`, tema en `src/index.css`).
- **Tone.js** para el audio (piano con samples Salamander + sintetizador de respaldo; batería sintetizada).
- **motion** (Framer Motion) con resortes: presets en `src/ui/movimiento.js`; todo lo tocable es `src/ui/Pulsable.jsx`.
- **Tonal.js** (`tonal`) para la teoría: intervalos, fórmulas y escalas (`src/theory/intervalos.js`: pasos, fórmulas e intervalos con nombre; `src/theory/escalas.js`: escalas mayor y menor, grados, relativas y melodías por grados con `Scale`). Previsto: **@tonejs/midi**.
- **localStorage** para progreso, opciones y entrenamiento de oído (sin servidor ni cuentas).
- Estilo: minimalista, mucho espacio, tipografía grande. **Paleta Lospec500 por significado** (gris = estructura/bloqueado, verde = bien con ✓, oro = fíjate con bombilla, un color por módulo), **íconos mínimos** propios, **fuentes por rol** (Bricolage Grotesque `font-titulo`, Figtree texto, DM Mono `font-dato`, Pixelify Sans `font-juego`) y **tres materiales**: vidrio = la app (lo que flota: cabeceras, botón principal de la barra de abajo, botones de navegar), superficie = la lección, color = el significado (con opción «Opaco» en Opciones). Todo en la skill de diseño.

## Dónde está cada cosa

```
src/
  App.jsx, router.js    # Página según la ruta (hash): #/  #/modulo/1  #/leccion/1.1  #/leccion/1.1/reto  #/oido  #/importar/CÓDIGO
  content/              # CONTENIDO (datos): FORMATO.md, INTERACCIONES.md
    modulos.js          # Los 10 módulos y sus lecciones (título, acento = var(--color-modulo-N), reto…)
    index.js            # Registro de lecciones (getLeccion, getModulo, estadoLeccion…) ← registrar aquí cada lección nueva
    actividad.js        # Código de interacción de cada paso (L1…X1) y su etiqueta (ícono + nombre)
    modulo-0N/leccion-N-M.js   # Hechas: 1.1–1.4, 2.1–2.5, 3.1–3.4
  pages/                # Inicio, Modulo, Leccion (visor paso a paso + BarraAccion), Oido (panel + entrenador), Importar
  components/
    exercises/          # Un componente por tipo de paso: EscuchaElige (elegir), Emparejar (emparejar), TocaEnPiano (tocar), ExploraFrecuencia,
                        #   PianoRollEjercicio (pianoroll), Pulso (pulso), RetoFL (reto) + Rondas
    pasos/              # Pasos sin puntuación: PasoTexto (texto, con Fichas que suenan), PasoSiente (siente), Nota
    Piano.jsx           # Piano táctil en una tira que se desliza entre octavas (multitouch, teclado del computador como FL Studio, `marcadas`, `ir`, `senalar`, `tecladoArriba`, `compacto`, `showLabels`) + SelectorOctava.jsx (barra de octavas: tocar o deslizar)
    PianoRoll.jsx       # Mini Piano Roll táctil (dibujar, alargar, borrar, velocity, nombres app/FL)
    CaminoLecciones.jsx # Camino de islas del módulo (carrusel, isla + globo, barra de puntitos, Retos)
    CabeceraModulo.jsx, CambioModulo.jsx, NavegadorModulos.jsx   # Cabecera fija, swipe entre módulos, pestaña de módulos
    ArranqueOido.jsx    # Arranque del entrenador de oído (pantalla de «iniciar nivel»: modos, rueda de nivel, cajita de notas)
    Opciones.jsx, ProgramarTema.jsx, TuProgreso.jsx, CodigoQR.jsx  # Opciones (tema —con «Programar»: claro/oscuro por horas en la barra del día—, vidrio, sentido de la barra de octavas, gesto del botón, modo administrador) y progreso entre dispositivos
    BotonSonido.jsx, Rich.jsx                                    # Botón de sonido (onNotas: señala cada nota al sonar); texto con **negritas**
  audio/                # engine.js (Tone.js: notas, patrones, ritmo en bucle), bateria.js (golpes sintetizados), sonido.js (reproducir() del contenido)
  theory/               # notas.js (midi, Hz, nombre en español), intervalos.js (Tonal), escalas.js (Tonal Scale: escala mayor y menor, grados, alteraciones, relativas, melodías por grados), bateria.js (GROOVES, swing, humanizar), oido.js (modos del entrenador)
  progress/             # progreso.js (lecciones y retos), opciones.js (tema, vidrio, admin), admin.js (PIN del modo administrador), oido.js (racha y niveles), sincronizar.js (código de progreso y combinar)
  pwa/                  # App instalable y sin internet: registrar.js (registra sw.js) y sw-plantilla.js (el service worker)
  ui/                   # movimiento.js, useDeslizar.js / useTirarBordes.js / useGestoBoton.js (gestos; el último, el del botón de la lección), useTemblor.js (animación «temblar»), Hoja.jsx, Pulsable.jsx, BarraProgreso.jsx,
                        #   Volver.jsx, color.js (oscuro/tinta/claro/labio), Iconos.jsx, vidrio.js (VIDRIO, VIDRIO_PANEL), useSobreBarra.js
public/                 # manifest.webmanifest (PWA) e iconos/ (ícono de la app: SVG + PNG 192/512, enmascarables y apple-touch-icon)
.claude/skills/diseno/  # Skill de diseño (SKILL.md) + REGISTRO.md
docs/HISTORIAL.md       # Historial detallado de todas las tareas
.github/workflows/deploy.yml  # Despliegue automático a GitHub Pages
```

## Notas técnicas

- `vite.config.js` usa `base: '/teoria-musical/'` (GitHub Pages). Las rutas a archivos de `public/` usan `import.meta.env.BASE_URL`.
- El audio solo empieza tras un gesto del usuario (`startAudio()` en `src/audio/engine.js`; iOS lo exige).
- **Despliegue automático**: cada push a `main` ejecuta `.github/workflows/deploy.yml` (Node 20, `npm ci`, `npm run build`, publica `dist`; en Settings → Pages → Source debe estar **GitHub Actions**).
- **App instalable (PWA) y sin internet**: `public/manifest.webmanifest` + íconos en `public/iconos/`; en `npm run build` el plugin `swApp` de `vite.config.js` genera `dist/sw.js` desde `src/pwa/sw-plantilla.js` con la lista de archivos del build y una versión (hash). Guarda toda la app y los samples del piano (`src/audio/salamander.js`); páginas: primero la red (4 s) y sin red la copia; archivos: primero la copia. Cada despliegue con cambios crea una versión nueva y borra la vieja. Solo se registra en producción (no en `npm run dev`). Si cambias los íconos, regenera los PNG desde los SVG.
- **Versión de la app** (arriba en Opciones): `v.1.AA.MM.DD.HHMM` con la fecha y hora de compilación en la hora del usuario (Ciudad de México, UTC−6); la calcula `versionApp()` en `vite.config.js` y llega como `__VERSION_APP__` (`define`). Se actualiza sola en cada despliegue.
- Comandos: `npm run dev`, `npm run build`, `npm run preview` (abre `/teoria-musical/`).
- **Lecciones**: un archivo de datos por lección en `src/content/modulo-XX/`, registrado en `src/content/index.js`. El visor muestra un paso por pantalla y un botón grande abajo que cada ejercicio controla con `setAccion` (Comprobar → retroalimentación → Continuar; solo esas dos palabras, más «Atrás» con el gesto; `avanza: true` = el paso está resuelto). El botón también pasa de paso con un gesto (`useGestoBoton`): volver siempre; avanzar si está resuelto (o en modo administrador). El error nunca castiga: muestra la respuesta y la explica.
- **Desbloqueo** (`estadoLeccion` en `content/index.js` → `proximamente | hecha | empezada | nueva | bloqueada`): progresivo dentro de cada módulo; entre módulos no se bloquea; las URLs directas no se bloquean.
- **Modo administrador** (Opciones → Administrador, con PIN; huella SHA-256 en `progress/admin.js`): ninguna lección bloqueada y, en una lección, la barra de pasos abre «Ir al paso» para saltar entre pasos; el gesto del botón avanza sin responder.
- **localStorage**: `teoria-musical:progreso:v1` → `{ lecciones: { '1.1': { paso, completada, aciertos, total } }, retos: { '1.1': { hecho, nota }, 'M1': { hecho } } }` · `teoria-musical:opciones:v1` (`tema`: claro | oscuro | sistema | programa, `programa`: `{ claro, oscuro }` en minutos, `reloj`: 24 | 12, `vidrio`: desenfoque | opaco, `octavas`: vista | teclas, `gesto`: pagina | invertido, `admin`: modo administrador) · `teoria-musical:oido:v1` (entrenador).
- **Probar** con Playwright (ya instalado en el entorno) a **375 px en claro y oscuro**; tema con `localStorage` `teoria-musical:opciones:v1` = `{ "tema": "oscuro" }`. Los samples del piano no cargan en el entorno de pruebas (suena el sintetizador): es normal.

## Decisiones de contenido

- **Módulo 1** (sonido, notas y teclado) es un repaso ágil con ejercicios de oído desde el principio: el usuario ya sabe algo de música.
- **Entrenamiento de oído** aparte de las lecciones (~5 min al día): intervalos, acordes mayor/menor y oído absoluto como juego (sin prometer que se adquiera).
- Pendiente: una **prueba rápida al inicio de cada módulo** para saltar lo que ya se domina.

## Estado del proyecto

**Avance: ~75 %** — detalle de cada tarea en `docs/HISTORIAL.md`.

- ✅ **Base**: Vite + React + Tailwind, despliegue automático, motor de lecciones (visor paso a paso, progreso, desbloqueo), audio robusto en iPhone.
- ✅ **Módulo 1** completo (1.1–1.4): frecuencia y altura, las 12 notas y la octava, sostenidos y bemoles, leer el Piano Roll.
- ✅ **Módulo 2** completo (2.1–2.5): pulso y tempo, compás, figuras, síncopa, swing/groove/velocity (batería sintetizada, pad de pulso, grooves).
- 🟡 **Módulo 3** «Intervalos y escalas»: ✅ 3.1 «Tono y semitono» (Tonal.js; P5 «Medir un paso», P6 «Seguir la fórmula») · ✅ 3.2 «Los intervalos y su carácter» (canciones de referencia; O6 «Emparejar», P7 «Construir un intervalo», fichas que suenan) · ✅ 3.3 «La escala mayor» (Do, Sol, Re, Fa; grados con Tonal `Scale`; «¿mayor u otra cosa?», «¿termina en casa?», escribirla en el roll; casillas de la fórmula que tiemblan y con grados) · ✅ 3.4 «La escala menor natural y la relativa» (La, Mi, Re y Sol menor; relativa = 6.º grado con `relativaMenor`; «¿mayor o menor?», «¿la mayor o su relativa?», «Encuentra la relativa» con P7; la misma melodía en mayor, paralela y relativa con `melodia()`). Faltan 3.5–3.7.
- ✅ **Entrenamiento de oído** (`#/oido`): intervalos, acordes y oído absoluto, con racha y niveles. El oído absoluto es un juego: se responde con el piano (notas bloqueadas con candado) o con botones, círculo de nivel de 8 partes y modos Normal / Rápido / Contrarreloj; bocina arriba para escuchar otra vez. Su **arranque** es una pantalla de «iniciar nivel» de videojuego (`components/ArranqueOido.jsx`: burbuja ⓘ, modos en bloques, rueda vertical de nivel con la cajita de notas Do ↔ C, vista pequeña de «Responder con»); falta pasar intervalos y acordes a ese arranque.
- ✅ **Diseño**: tipo iOS con resortes, modo oscuro, paleta/íconos/fuentes con significado, tres materiales (vidrio/superficie/color; opción Desenfoque/Opaco), camino de islas con swipe y barra de puntitos, cabecera fija, swipe entre módulos, animación «temblar» general (`useTemblor`), piano que se desliza entre octavas (sentido de la barra elegible en Opciones), «Escuchar…» que señala cada nota en el teclado y las casillas, isla que se cierra al dejar la mitad de la pantalla, Opciones ordenadas por grupos (hoja que se arrastra bien con el dedo), matraca de la barra de puntitos que se jala con el dedo, piano con el teclado del computador (Z…M / Q…U como FL Studio) y teclas que se desvanecen al soltarlas, modo administrador con PIN (todas las islas abiertas, «Ir al paso» en las lecciones), **barra de acción** con panel sólido y botón de vidrio que cambia de color (tarjeta que crece desde el centro), solo «Comprobar»/«Continuar» (y «Atrás» con el gesto), y **gesto del botón** para pasar de paso (deslizar o mantener un borde 0,5 s; por defecto derecha → izquierda = siguiente; opción «Invertir el gesto»); vidrio del botón con reflejo; barra de lecciones del módulo que se vacía y se llena en orden al cambiar de módulo.
- ✅ **Apariencia programada**: claro y oscuro a ciertas horas (sol y luna sobre la barra del día, con imán y zoom).
- ✅ **Tu progreso** entre dispositivos sin servidor (código, link y QR que se combinan).
- ✅ **App instalable** (manifiesto + ícono propio: teclado Do-Re-Mi-Fa con los colores de los módulos) y **sin internet** (service worker).
- ⬜ Módulos 4–10, prueba rápida por módulo, MIDI.

**Siguiente tarea:** pasar intervalos y acordes al nuevo arranque del entrenador de oído; luego la lección 3.5 «Grados, tonalidad y círculo de quintas» (armaduras, el orden de los ♯ y ♭, tonalidades vecinas y relativas en el círculo), o la prueba rápida al inicio de cada módulo.

**Al terminar cada tarea:** añade su entrada al final de `docs/HISTORIAL.md`, actualiza esta sección (avance, línea del módulo y siguiente tarea) y, si cambió el diseño, la skill y su `REGISTRO.md`.
