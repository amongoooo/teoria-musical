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
```

Notas en notación inglesa con octava (`C4` = Do central, `F#4`, `Bb3`).

## Tipos de paso

| tipo | Componente | Para qué |
|---|---|---|
| `texto` | `components/pasos/PasoTexto.jsx` | Explicación: `parrafos: []`, `sonidos: []`, `nota` |
| `siente` | `components/pasos/PasoSiente.jsx` | Tarjeta "¿Qué se siente?": `lados: [{ etiqueta, emociones, ejemplos, sonido }]`, `nota` |
| `elegir` | `components/exercises/EscuchaElige.jsx` | Escucha y elige / quiz, por rondas |
| `tocar` | `components/exercises/TocaEnPiano.jsx` | Responder tocando el piano |
| `frecuencia` | `components/exercises/ExploraFrecuencia.jsx` | Pad para deslizar Hz: `min`, `max` |
| `reto` | `components/exercises/RetoFL.jsx` | Reto en FL Studio con "Lo hice" y reflexión |

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

## Crear un tipo de paso nuevo

1. Crea el componente en `src/components/exercises/`. Recibe
   `{ paso, leccionId, setAccion, siguiente, completar }`.
2. Usa `setAccion({ label, onClick, disabled, ayuda, feedback })` para controlar el
   botón grande de abajo (`feedback: { tipo: 'bien' | 'mal', titulo, texto }`).
   Si no lo usa, se muestra "Continuar".
3. Llama a `completar({ aciertos, total })` si el paso puntúa, y `siguiente()` para avanzar.
4. Regístralo en el objeto `PASOS` de `src/pages/Leccion.jsx`.
