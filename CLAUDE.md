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
  content/              # Contenido de módulos y lecciones (datos)
  components/           # Componentes reutilizables
    Piano.jsx           # Piano táctil (multitouch, glissando, octavas)
    exercises/          # Ejercicios interactivos
  audio/engine.js       # Motor de audio (Tone.js): initPiano, noteOn, noteOff…
  theory/               # Lógica de teoría musical
  progress/             # Guardado del progreso (localStorage)
  pages/Inicio.jsx      # Página inicial
public/samples/         # Samples de audio propios
.github/workflows/deploy.yml  # Despliegue automático a GitHub Pages
```

## Notas técnicas

- `vite.config.js` usa `base: '/teoria-musical/'` (necesario para GitHub Pages). Las rutas a archivos de `public/` deben usar `import.meta.env.BASE_URL`.
- El audio solo puede empezar tras un gesto del usuario: `Tone.start()` se llama en el primer toque (iOS lo exige). Ver `startAudio()` en `src/audio/engine.js`.
- El piano usa Pointer Events, `touch-action: none`, sin selección de texto ni menú contextual; `elementFromPoint` en `pointermove` para deslizar entre teclas. En pantallas angostas (< 560 px) muestra 1 octava con botones ◀ ▶.
- **Despliegue automático**: cada push a `main` ejecuta `.github/workflows/deploy.yml` (Node 20, `npm ci`, `npm run build`, publica `dist`). En Settings → Pages → Source debe estar seleccionado **GitHub Actions**.
- Comandos: `npm run dev`, `npm run build`, `npm run preview` (abre `/teoria-musical/`).

## Estado del proyecto

**Avance: ~5 %** — Proyecto base hecho (Vite + React + Tailwind, piano Tone.js apto para celular, despliegue a Pages).

**Siguiente tarea:** Fase 1 — lección 1.1 del módulo 1 (según el plan).
