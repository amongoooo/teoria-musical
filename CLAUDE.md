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
- **Tonal.js** (`tonal`) para la teoría: intervalos, fórmulas y escalas (`src/theory/intervalos.js`). Previsto: **@tonejs/midi**.
- **localStorage** para progreso, opciones y entrenamiento de oído (sin servidor ni cuentas).
- Estilo: minimalista, mucho espacio, tipografía grande. **Paleta Lospec500 por significado** (gris = estructura/bloqueado, verde = bien con ✓, oro = fíjate con bombilla, un color por módulo), **íconos mínimos** propios, **fuentes por rol** (Bricolage Grotesque `font-titulo`, Figtree texto, DM Mono `font-dato`, Pixelify Sans `font-juego`) y **vidrio** para lo que flota. Todo en la skill de diseño.

## Dónde está cada cosa

```
src/
  App.jsx, router.js    # Página según la ruta (hash): #/  #/modulo/1  #/leccion/1.1  #/leccion/1.1/reto  #/oido  #/importar/CÓDIGO
  content/              # CONTENIDO (datos): FORMATO.md, INTERACCIONES.md
    modulos.js          # Los 10 módulos y sus lecciones (título, acento = var(--color-modulo-N), reto…)
    index.js            # Registro de lecciones (getLeccion, getModulo, estadoLeccion…) ← registrar aquí cada lección nueva
    actividad.js        # Código de interacción de cada paso (L1…X1) y su etiqueta (ícono + nombre)
    modulo-0N/leccion-N-M.js   # Hechas: 1.1–1.4, 2.1–2.5, 3.1
  pages/                # Inicio, Modulo, Leccion (visor paso a paso + BarraAccion), Oido (panel + entrenador), Importar
  components/
    exercises/          # Un componente por tipo de paso: EscuchaElige (elegir), TocaEnPiano (tocar), ExploraFrecuencia,
                        #   PianoRollEjercicio (pianoroll), Pulso (pulso), RetoFL (reto) + Rondas
    pasos/              # Pasos sin puntuación: PasoTexto (texto), PasoSiente (siente), Nota
    Piano.jsx           # Piano táctil (multitouch, octavas, `marcadas`, `ir`, `compacto`, `showLabels`)
    PianoRoll.jsx       # Mini Piano Roll táctil (dibujar, alargar, borrar, velocity, nombres app/FL)
    CaminoLecciones.jsx # Camino de islas del módulo (carrusel, isla + globo, barra de puntitos, Retos)
    CabeceraModulo.jsx, CambioModulo.jsx, NavegadorModulos.jsx   # Cabecera fija, swipe entre módulos, pestaña de módulos
    Opciones.jsx, TuProgreso.jsx, CodigoQR.jsx                   # Opciones (tema) y progreso entre dispositivos
    BotonSonido.jsx, Rich.jsx                                    # Botón de sonido; texto con **negritas**
  audio/                # engine.js (Tone.js: notas, patrones, ritmo en bucle), bateria.js (golpes sintetizados), sonido.js (reproducir() del contenido)
  theory/               # notas.js (midi, Hz, nombre en español), intervalos.js (Tonal), bateria.js (GROOVES, swing, humanizar), oido.js (modos del entrenador)
  progress/             # progreso.js (lecciones y retos), opciones.js (tema), oido.js (racha y niveles), sincronizar.js (código de progreso y combinar)
  ui/                   # movimiento.js, useDeslizar.js / useTirarBordes.js (gestos), Hoja.jsx, Pulsable.jsx, BarraProgreso.jsx,
                        #   Volver.jsx, color.js (oscuro/tinta/claro/labio), Iconos.jsx, vidrio.js, useSobreBarra.js
.claude/skills/diseno/  # Skill de diseño (SKILL.md) + REGISTRO.md
docs/HISTORIAL.md       # Historial detallado de todas las tareas
.github/workflows/deploy.yml  # Despliegue automático a GitHub Pages
```

## Notas técnicas

- `vite.config.js` usa `base: '/teoria-musical/'` (GitHub Pages). Las rutas a archivos de `public/` usan `import.meta.env.BASE_URL`.
- El audio solo empieza tras un gesto del usuario (`startAudio()` en `src/audio/engine.js`; iOS lo exige).
- **Despliegue automático**: cada push a `main` ejecuta `.github/workflows/deploy.yml` (Node 20, `npm ci`, `npm run build`, publica `dist`; en Settings → Pages → Source debe estar **GitHub Actions**).
- Comandos: `npm run dev`, `npm run build`, `npm run preview` (abre `/teoria-musical/`).
- **Lecciones**: un archivo de datos por lección en `src/content/modulo-XX/`, registrado en `src/content/index.js`. El visor muestra un paso por pantalla y un botón grande abajo que cada ejercicio controla con `setAccion` (Comprobar → retroalimentación → Siguiente). El error nunca castiga: muestra la respuesta y la explica.
- **Desbloqueo** (`estadoLeccion` en `content/index.js` → `proximamente | hecha | empezada | nueva | bloqueada`): progresivo dentro de cada módulo; entre módulos no se bloquea; las URLs directas no se bloquean.
- **localStorage**: `teoria-musical:progreso:v1` → `{ lecciones: { '1.1': { paso, completada, aciertos, total } }, retos: { '1.1': { hecho, nota }, 'M1': { hecho } } }` · `teoria-musical:opciones:v1` (tema) · `teoria-musical:oido:v1` (entrenador).
- **Probar** con Playwright (ya instalado en el entorno) a **375 px en claro y oscuro**; tema con `localStorage` `teoria-musical:opciones:v1` = `{ "tema": "oscuro" }`. Los samples del piano no cargan en el entorno de pruebas (suena el sintetizador): es normal.

## Decisiones de contenido

- **Módulo 1** (sonido, notas y teclado) es un repaso ágil con ejercicios de oído desde el principio: el usuario ya sabe algo de música.
- **Entrenamiento de oído** aparte de las lecciones (~5 min al día): intervalos, acordes mayor/menor y oído absoluto como juego (sin prometer que se adquiera).
- Pendiente: una **prueba rápida al inicio de cada módulo** para saltar lo que ya se domina.

## Estado del proyecto

**Avance: ~62 %** — detalle de cada tarea en `docs/HISTORIAL.md`.

- ✅ **Base**: Vite + React + Tailwind, despliegue automático, motor de lecciones (visor paso a paso, progreso, desbloqueo), audio robusto en iPhone.
- ✅ **Módulo 1** completo (1.1–1.4): frecuencia y altura, las 12 notas y la octava, sostenidos y bemoles, leer el Piano Roll.
- ✅ **Módulo 2** completo (2.1–2.5): pulso y tempo, compás, figuras, síncopa, swing/groove/velocity (batería sintetizada, pad de pulso, grooves).
- 🟡 **Módulo 3** «Intervalos y escalas»: ✅ 3.1 «Tono y semitono» (Tonal.js; ejercicios P5 «Medir un paso» y P6 «Seguir la fórmula»). Faltan 3.2–3.7.
- ✅ **Entrenamiento de oído** (`#/oido`): intervalos, acordes y oído absoluto, con racha y niveles.
- ✅ **Diseño**: tipo iOS con resortes, modo oscuro, paleta/íconos/fuentes con significado, regla del vidrio, camino de islas con swipe y barra de puntitos, cabecera fija, swipe entre módulos.
- ✅ **Tu progreso** entre dispositivos sin servidor (código, link y QR que se combinan).
- ⬜ Módulos 4–10, prueba rápida por módulo, MIDI.

**Siguiente tarea:** lección 3.2 «Los intervalos y su carácter» (nombrar intervalos por semitonos con Tonal.js, emparejar sonido ↔ nombre), o la prueba rápida al inicio de cada módulo.

**Al terminar cada tarea:** añade su entrada al final de `docs/HISTORIAL.md`, actualiza esta sección (avance, línea del módulo y siguiente tarea) y, si cambió el diseño, la skill y su `REGISTRO.md`.
