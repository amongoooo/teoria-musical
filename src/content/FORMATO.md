# Formato de las lecciones

Cada lección es un archivo `.js` en `src/content/modulo-XX/` que exporta un objeto.
Para publicarla: regístrala en `src/content/index.js` (objeto `LECCIONES`). Su `id`
debe coincidir con el de `src/content/modulos.js`; si no está registrada, la app la
muestra como "Próximamente".

```js
export default {
  id: '1.1',            // igual que en modulos.js
  modulo: 1,
  titulo: 'Qué es una nota',
  subtitulo: 'Frecuencia y altura',
  minutos: 8,
  resumen: ['…', '…'],  // "Lo que aprendiste" en la pantalla final
  pasos: [ /* una idea por paso */ ],
}
```

En los textos se puede usar `**negrita**`.

## Campos comunes de cada paso

- `tipo` (obligatorio): uno de los de abajo.
- `titulo`: título grande del paso.
- `intro`: texto corto bajo el título.

## Sonidos

Donde se pida un sonido:

```js
{ notas: ['C4', 'E4', 'G4'], modo: 'secuencia' | 'acorde', velocidad: 0.8, intervalo: 0.45, duracion: 0.9, etiqueta: 'Escuchar' }
{ notas: [['C3', 'C4'], ['E3', 'E4']] }                  // en secuencia, un array = notas a la vez (p. ej. doblar a la octava)
{ frecuencia: 440, duracion: 1.2, etiqueta: '440 Hz' }   // onda pura
{ groove: 'basico', bpm: 90, compases: 2 }              // batería: 'click' | 'basico' | 'bombo' (theory/bateria.js)
```

Notas en notación inglesa con octava (`C4` = Do central, `F#4`, `Bb3`). Golpes de batería:
`'kick'` (bombo), `'snare'` (caja), `'hat'` (hi-hat), `'clap'` (palmas), `'click'` (metrónomo):
sirven en `notas`, en los patrones y como filas del Piano Roll (`filas: ['hat', 'snare', 'kick']`).

## Tipos de paso

| tipo | Componente | Para qué |
|---|---|---|
| `texto` | `components/pasos/PasoTexto.jsx` | Explicación: `parrafos: []`, `sonidos: []`, `nota` |
| `siente` | `components/pasos/PasoSiente.jsx` | Tarjeta "¿Qué se siente?": `lados: [{ etiqueta, emociones, ejemplos, sonido }]`, `nota` |
| `elegir` | `components/exercises/EscuchaElige.jsx` | Escucha y elige / quiz, por rondas |
| `tocar` | `components/exercises/TocaEnPiano.jsx` | Responder tocando el piano |
| `frecuencia` | `components/exercises/ExploraFrecuencia.jsx` | Pad para deslizar Hz: `min`, `max` |
| `reto` | `components/exercises/RetoFL.jsx` | Reto en FL Studio con "Lo hice" y reflexión |
| `pianoroll` | `components/exercises/PianoRollEjercicio.jsx` | Mini Piano Roll táctil: dibujar, copiar, velocity |
| `pulso` | `components/exercises/Pulso.jsx` | Ritmo en bucle: tocar al pulso, tap tempo, explorar tempos |

`texto` y las rondas de `elegir` aceptan además `roll: { …config, notas }` para mostrar un
Piano Roll de **solo lectura** (con botón Reproducir) junto al texto o la pregunta.

### `elegir`

```js
{
  tipo: 'elegir',
  rondas: [
    {
      pregunta: '¿Cuál es más agudo?',
      sonidos: [{ notas: ['C4'] }, { notas: ['G4'] }],
      // sin `opciones`: las tarjetas de sonido son las respuestas (A, B…)
      opciones: ['texto 1', 'texto 2'],   // opcional
      correcta: 1,          // índice de la opción (o del sonido)
      mezclar: true,        // orden de los sonidos al azar
      mostrarNotas: true,   // al responder, enseña nota y Hz de cada tarjeta
      explicacion: '…',     // se muestra al comprobar (acierto o error)
    },
  ],
}
```

### `tocar`

```js
{
  tipo: 'tocar',
  piano: { startOctave: 4, octaves: 2, showLabels: true },  // showLabels: false = teclas sin nombre
  objetivo: { tipo: 'explorar', cantidad: 5, mensaje: '…' }, // N teclas distintas (mensaje: texto al terminar)
  // objetivo: { tipo: 'extremos' }                    // la más grave y la más aguda
  // objetivo: { tipo: 'comparar', rondas: [{ referencia: 'G4', direccion: 'agudo' | 'grave' }] }
  // objetivo: { tipo: 'octavas', rondas: [{ nota: 'A', pista: '…' }] }
  //   → tocar esa nota en TODAS las octavas del teclado (con 3 octavas: La3, La4, La5).
  //     `pista` (opcional) se muestra al tocar una nota equivocada.
}
```

### `reto`

```js
{
  tipo: 'reto',
  titulo: 'Reto en FL Studio: …',
  minutos: 15,
  objetivo: '…',
  pasos: ['…', '…'],
  consejo: '…',
  reflexion: '¿Qué sentiste…?',
}
```

### `pianoroll` (y `roll`)

Configuración del roll (componente `components/PianoRoll.jsx`):

```js
roll: {
  rango: ['C4', 'C5'], soloBlancas: true,  // filas de la más aguda (arriba) a la más grave
  // filas: ['C5', 'B4', …]                // o la lista exacta de filas
  columnas: 8, porTiempo: 2, bpm: 100,     // 8 casillas = 4 tiempos (cada casilla, medio tiempo)
  etiquetas: 'app' | 'fl' | 'ambas',       // 'fl' = nombres de FL Studio (Do4 → C5)
  alternar: true,                          // selector «Esta app / FL Studio»
  velocity: true,                          // carril de velocity abajo
  notas: [{ nota: 'C4', inicio: 0, duracion: 2, velocity: 0.8 }],  // inicio/duración en casillas
}
```

Objetivos del paso `pianoroll`:

```js
objetivo: { tipo: 'libre', cantidad: 4, mensaje: '…' }   // dibujar N notas
objetivo: { tipo: 'copiar', notas: [...], fantasma: true, instruccion: '…', pista: '…', explicacion: '…' }
  // dibujar exactamente esas notas (fantasma: contornos punteados de guía).
  // Al fallar explica qué falta/sobra/dura distinto; tras 2 fallos ofrece «Ver la solución».
objetivo: { tipo: 'velocity', fuertes: [0, 4], explicacion: '…' }
  // con las notas de roll.notas: subir la velocity de las que empiezan en esas casillas (≥ 0.75)
  // y dejar las demás por debajo de la mitad (≤ 0.55). Solo se edita la velocity.
```

Gestos (pensados para el dedo): tocar casilla vacía = crear nota; arrastrar a la derecha =
alargarla; tocar una nota = borrarla; deslizar arriba/abajo en el carril «Vel.» = velocity.

### `pulso`

Un ritmo suena en bucle (`iniciarRitmo()` de `engine.js`) con un botón Empezar/Parar.

```js
objetivo: { tipo: 'seguir', rondas: [{ pregunta, bpm: 90, groove: 'click', meta: 8, visual: true, mensaje }] }
  // tocar el botón grande al pulso; cuenta los toques a ±90 ms. Medidor «antes / tarde».
  // Si todos los toques caen igual de desplazados (auriculares bluetooth), compensa solo (máx. 200 ms).
objetivo: { tipo: 'tempo', rondas: [{ bpm: 100, groove: 'basico', pregunta }] }
  // tap tempo: marcar el pulso (≥ 6 toques) y comprobar los BPM (±5 %; medio o doble tempo cuenta como bien).
objetivo: { tipo: 'explorar', groove: 'basico', minimo: 3, tempos: [{ bpm: 90, genero: 'Hip hop' }], mensaje }
  // el mismo groove a distintos tempos, con un círculo que late en cada tiempo.
```

## Crear un tipo de paso nuevo

1. Crea el componente en `src/components/exercises/`. Recibe
   `{ paso, leccionId, setAccion, siguiente, completar }`.
2. Usa `setAccion({ label, onClick, disabled, ayuda, feedback })` para controlar el
   botón grande de abajo (`feedback: { tipo: 'bien' | 'mal', titulo, texto }`).
   Si no lo usa, se muestra "Continuar".
3. Llama a `completar({ aciertos, total })` si el paso puntúa, y `siguiente()` para avanzar.
4. Regístralo en el objeto `PASOS` de `src/pages/Leccion.jsx`.
