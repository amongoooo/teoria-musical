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

En los textos se puede usar `**negrita**` y `*cursiva*`.

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
{ groove: 'basico', bpm: 90, compases: 2 }              // groove de theory/bateria.js (lista abajo)
{ groove: [{ nota: 'click', inicio: 0, velocity: 1 }, …], tiempos: 3, porTiempo: 2 }  // patrón propio
```

Grooves (`GROOVES` de `theory/bateria.js`; `formaGroove()` da su compás y resolución):
`click`, `basico`, `bombo` (4/4) · `click3`, `vals`, `valsPiano` (3/4) · `marchaPiano` (4/4 al piano) ·
`trap` (medio tiempo, caja en el 3) y `trapNormal` (caja en 2 y 4), ambos en semicorcheas ·
`dembow` (reguetón: bombo en cada tiempo, caja en 3, 6, 11, 14) y `bounce` (hip hop: bombo en 0, 7, 10; caja en 2 y 4), en semicorcheas ·
`shuffle` (el beat básico con swing de tresillo) · en semicorcheas (boom bap: bombo 0, 8, 10; caja en 2 y 4):
`boomBapPlano` (hi-hats todas iguales), `boomBap` (hi-hats con acentos), `boomBapGhost` (+ ghost notes de caja en 7, 9, 15),
`boomBapSwing` y `boomBapGhostSwing` (con el Swing del Channel rack: las «e» y las «a» retrasadas).
Un patrón propio puede indicar `tiempos` (tiempos por vuelta, 4 por defecto) y `porTiempo` (casillas por tiempo, 2).
Los eventos pueden tener `inicio` con decimales (notas fuera de la rejilla). Ayudas de `theory/bateria.js`:
`conSwing(eventos, cantidad = SWING)` retrasa las casillas impares (`SWING` = 1/3 de casilla = swing de tresillo) y
`humanizar(eventos, { tiempo, fuerza, semilla })` varía al azar (pero siempre igual) el tiempo y la velocity.
En el Piano Roll de solo lectura, esas notas se dibujan corridas de su línea.

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
  compas: 3,                               // opcional: tiempos por compás (numera «1 2 3 1 2 3» y marca la línea de compás)
  etiquetas: 'app' | 'fl' | 'ambas',       // 'fl' = nombres de FL Studio (Do4 → C5)
  alternar: true,                          // selector «Esta app / FL Studio»
  velocity: true,                          // carril de velocity abajo
  nombres: { C4: 'Redonda', E4: 'Blanca' }, // opcional: texto propio en la columna de la izquierda (más ancha)
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
  // maxSuave: 0.33 → las suaves tienen que quedar muy suaves (ghost notes).
```

Gestos (pensados para el dedo): tocar casilla vacía = crear nota; arrastrar a la derecha =
alargarla; tocar una nota = borrarla; deslizar arriba/abajo en el carril «Vel.» = velocity.

### `pulso`

Un ritmo suena en bucle (`iniciarRitmo()` de `engine.js`) con un botón Empezar/Parar.

```js
objetivo: { tipo: 'seguir', rondas: [{ pregunta, bpm: 90, groove: 'click', meta: 8, visual: true, mensaje }] }
  // tocar el botón grande al pulso; cuenta los toques a ±90 ms. Medidor «antes / tarde».
  // Si todos los toques caen igual de desplazados (auriculares bluetooth), compensa solo (máx. 200 ms).
  // Opcionales de cada ronda:
  //   cada: 4        → tiempos entre toque y toque (4 = solo en el 1 de un 4/4; 0.5 = «1 y 2 y»)
  //   desfase: 2     → en qué tiempo cae el primer toque, contando desde 0 (2 = en el 3; 0.5 = en la «y»)
  //   contar: 'tiempos' | 'y' | 'e' | 'swing'  → muestra la cuenta del compás («1 2 3 4», «1 y 2 y…»,
  //                    «1 e y a 2 e y a…» en dos filas de 8 o «1 · y 2 · y…» —el tiempo en tresillo,
  //                    para el swing— en dos filas de 6); se ilumina lo que suena y las casillas que
  //                    hay que tocar llevan aro. Con swing: toques: [0, 2/3, 1, 5/3, …]
  //   toques: [0, 1.5, 3] → patrón irregular, en tiempos dentro de cada compás (aquí el tresillo:
  //                    1, «y» del 2 y 4). Manda sobre cada/desfase; cada toque se mide contra el golpe
  //                    del patrón más cercano y el pad late solo en esos golpes. Sin `contar`, resolución de semicorchea.
  //   groove + porTiempo → un patrón propio con otra resolución (p. ej. hi-hat en semicorcheas, porTiempo: 4)
  //   ayuda, boton   → textos de la barra («Toca en el 1: 2/4 a tiempo») y del botón grande
objetivo: { tipo: 'tempo', rondas: [{ bpm: 100, groove: 'basico', pregunta }] }
  // tap tempo: marcar el pulso (≥ 6 toques) y comprobar los BPM (±5 %; medio o doble tempo cuenta como bien).
objetivo: { tipo: 'explorar', groove: 'basico', minimo: 3, tempos: [{ bpm: 90, genero: 'Hip hop' }], mensaje }
  // el mismo groove a distintos tempos, con un círculo que late en cada tiempo.
  // Cada opción puede traer su `groove` (y el objetivo un `porTiempo` común) y un `titulo` que se
  // muestra en lugar de los BPM: así sirve también para comparar versiones (p. ej. cuánto swing).
  // Textos opcionales: elige ('Elige cuánto swing'), prueba ('Prueba 3 cantidades de swing'), tituloBien.
```

## Crear un tipo de paso nuevo

1. Crea el componente en `src/components/exercises/`. Recibe
   `{ paso, leccionId, setAccion, siguiente, completar }`.
2. Usa `setAccion({ label, onClick, disabled, ayuda, feedback })` para controlar el
   botón grande de abajo (`feedback: { tipo: 'bien' | 'mal', titulo, texto }`).
   Si no lo usa, se muestra "Continuar".
3. Llama a `completar({ aciertos, total })` si el paso puntúa, y `siguiente()` para avanzar.
4. Regístralo en el objeto `PASOS` de `src/pages/Leccion.jsx`.
