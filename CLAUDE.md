# Teoría Musical — guía para Claude

App web gratuita (GitHub Pages) para aprender teoría musical y producción en FL Studio, al estilo Brilliant: 10 módulos, lecciones cortas e interactivas con audio y retos prácticos en FL Studio.

- Plan completo: https://claude.ai/artifact/BPJh8PxMqQw6NAyuBgD16i
- Página publicada: https://amongoooo.github.io/teoria-musical/

## Preferencias del usuario (¡seguir siempre!)

- **Responder siempre en español.**
- **Indicar el porcentaje de avance del proyecto en cada respuesta.**
- **Hacer push después de cada commit.**
- **Al terminar una tarea, mandar el link de la página:** https://amongoooo.github.io/teoria-musical/
- **Al terminar, recomendar** para la siguiente tarea: chat (seguir en el mismo o abrir uno nuevo), modelo, nivel de esfuerzo y el prompt listo para copiar.
- El usuario trabaja **casi siempre desde el celular**: evitar pasos que necesiten terminal. Todo debe poder hacerse desde GitHub web o pidiéndoselo a Claude.
- **Diseño pensado primero para celular** (mobile-first): botones grandes, nada que dependa de hover o teclado físico.

## Stack

- **Vite + React en JavaScript** (`.jsx`, sin TypeScript).
- **Tailwind CSS v4** (plugin `@tailwindcss/vite`, configurado en `src/index.css`).
- **Tone.js** para el audio (piano con samples Salamander + sintetizador de respaldo).
- Previstos: **Tonal.js** (teoría: escalas, acordes, intervalos), **@tonejs/midi** (leer/exportar MIDI), **Framer Motion** (animaciones), **localStorage** (progreso del usuario).

Estilo visual: minimalista, fondo blanco/gris muy claro (`#fafafa`), tipografía grande (Inter / system-ui), mucho espacio.

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
    BotonSonido.jsx     # Botón que reproduce un sonido del contenido
    Rich.jsx            # Texto con **negritas**
    pasos/              # Pasos no interactivos: PasoTexto, PasoSiente, Nota
    exercises/          # EscuchaElige, TocaEnPiano, ExploraFrecuencia, RetoFL
  audio/engine.js       # Tone.js: initPiano, noteOn/Off, playNotes, playFrequency, toneStart/Set/Stop
  audio/sonido.js       # reproducir({ notas | frecuencia }) para el contenido
  theory/notas.js       # midi, frecuencia, nombre en español, compararAltura
  progress/progreso.js  # localStorage: useProgreso, guardarPaso, completarLeccion, guardarReto
  pages/                # Inicio, Modulo, Leccion (visor paso a paso)
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
- **Progreso**: `localStorage` clave `teoria-musical:progreso:v1` → `{ lecciones: { '1.1': { paso, completada, aciertos, total } }, retos: { '1.1': { hecho, nota } } }`. Se guarda el paso actual para continuar donde se dejó.
- En las lecciones el piano usa `compacto` (teclas más bajas) para que quepa sobre la barra inferior en el celular.

## Estado del proyecto

**Avance: ~12 %**

- ✅ Fase 0: proyecto base (Vite + React + Tailwind, piano Tone.js apto para celular, despliegue a Pages).
- ✅ Fase 1 (parte 1): motor de lecciones — formato de contenido, visor paso a paso, navegación Inicio → Módulo → Lección, progreso en localStorage, ejercicios Escucha y elige, Toca en el teclado, pad de frecuencia y Reto en FL Studio.
- ✅ Lección 1.1 «Qué es una nota: frecuencia y altura» (11 pasos).

**Siguiente tarea:** lección 1.2 «Las 12 notas y la octava» (toca la misma nota en 3 octavas), reutilizando los ejercicios existentes.
