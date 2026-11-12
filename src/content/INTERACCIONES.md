# Catálogo de interacciones de las lecciones

Lista cerrada de **todo lo que el usuario puede hacer** dentro de una lección (sacada de las
lecciones 1.1–1.4, 2.1–2.5 y 3.1–3.3) y la **plantilla** que siguen. Al escribir una lección nueva, cada
paso debe ser una de estas interacciones; si hace falta una que no está, se añade aquí
(y en `FORMATO.md` si es un tipo de paso nuevo).

Cómo leerlo: cada interacción tiene un código (`L1`, `O2`…), qué hace el usuario, cómo se
escribe en el contenido (`tipo` + opciones, detalle en `FORMATO.md`) y para qué sirve.

## A. Leer y escuchar (no puntúan)

| Código | Interacción | Qué hace el usuario | Contenido | Para qué |
|---|---|---|---|---|
| **L1** | Texto solo | Lee y pulsa Continuar | `texto` con `parrafos` | Una idea corta sin ejemplo sonoro (raro: casi siempre conviene L2) |
| **L2** | Texto + sonidos | Lee y toca botones de sonido para escuchar los ejemplos | `texto` + `sonidos: []` | **La explicación normal**: cada concepto con su sonido |
| **L3** | Texto + Piano Roll de lectura | Lee, mira el roll y pulsa Reproducir (cabezal) | `texto` + `roll` | Ver una idea en el tiempo: duración, ritmo, pirámide de figuras |
| **L4** | Dato / nota al pie | Lee un recuadro gris («Dato:», «En producción:») | `nota` en `texto` o `siente` | Curiosidad, aclaración o truco de FL; nunca la idea principal |
| **L5** | ¿Qué se siente? | Compara 2 tarjetas (emociones, ejemplos, sonido) | `siente` con `lados` | Unir el concepto con la emoción que produce |
| **L6** | Resumen final | Lee «Lo que aprendiste» al terminar | `resumen` de la lección | Cierre: 3–5 frases con lo esencial |

## B. Oído y comprensión: elegir (puntúan)

Todas usan `elegir` (`EscuchaElige`), van por **rondas** y al comprobar muestran `explicacion`
(acierto o error: el error nunca castiga).

| Código | Interacción | Qué hace el usuario | Contenido | Ejemplo |
|---|---|---|---|---|
| **O1** | Elegir entre sonidos | Escucha 2+ tarjetas de sonido y elige una (A, B…) | rondas con `sonidos` y **sin** `opciones` (`mezclar`, `mostrarNotas`) | «¿Cuál es más agudo?», «¿Cuál va más rápido?» |
| **O2** | Escuchar y elegir respuesta | Escucha un sonido y elige entre 2–4 textos | `sonidos` + `opciones` | «¿4/4 o 3/4?», «¿Semitono o tono?», «¿Qué figura suena?», «¿Escala mayor u otra cosa?», «¿Termina en casa?» (3.3) |
| **O3** | Quiz de texto | Lee la pregunta y elige (sin audio) | solo `opciones` | «Comprueba la idea» |
| **O4** | Leer el roll y elegir | Mira (y reproduce) un Piano Roll y elige | `roll` en la ronda + `opciones` | «Lee el roll», «¿Dónde está el silencio?» |
| **O5** | Gancho de oído | 1 ronda de O1 al empezar, antes de explicar nada | `elegir` con 1 ronda | «Empecemos con el oído» (1.1, 1.2, 1.3) |
| **O6** | Emparejar | Escucha 3–4 sonidos (A, B…) y pone a cada uno su nombre tocando los nombres de abajo; al comprobar, cada fila dice si está bien o cuál era | `emparejar` con `parejas` (`sonido`, `nombre`, `detalle`) | «Empareja sonido y nombre» (intervalos, 3.2) |

## C. Teclado (puntúan al cumplir el objetivo)

`tocar` (`TocaEnPiano`); `piano: { startOctave, octaves, showLabels }`. `showLabels: false` = más difícil.

| Código | Interacción | Qué hace el usuario | Objetivo |
|---|---|---|---|
| **P1** | Explorar el teclado | Toca N teclas distintas libremente | `explorar` (`cantidad`) |
| **P2** | Extremos | Toca la tecla más grave y la más aguda | `extremos` |
| **P3** | Comparar con referencia | Oye una nota y toca una más aguda / más grave | `comparar` (`referencia`, `direccion`) |
| **P4** | Encontrar en todas las octavas | Toca una nota en todas las octavas visibles (título corto «Encuentra la nota», sin `intro`: pedido del usuario) | `octavas` (`nota`, `pista`) |
| **P5** | Medir un paso | Desde una nota marcada, toca la que está a un semitono o un tono (sube / baja); al fallar dice cuánto se movió y tras 2 fallos marca la tecla | `paso` (`desde`, `paso: 'S' \| 'T'`, `direccion`, `pista`) |
| **P6** | Seguir la fórmula | Desde una nota dada, toca en orden las notas de una fórmula de pasos (T T S T T T S…); la fila de casillas se llena al acertar y, si vuelve a tocar una ya tocada, esa casilla tiembla | `formula` (`desde`, `pasos`, `titulo`, `mensaje`, `grados`: número de grado bajo cada casilla) |
| **P7** | Construir un intervalo | Desde una nota marcada, toca la que forma un intervalo con nombre (3.ª mayor, 5.ª justa, tritono…); el fallo dice qué intervalo tocó y tras 2 fallos marca la tecla | `paso` con `intervalo` (`desde`, `intervalo: '3M'`, `direccion`, `pista`, `mensaje`) |

## D. Sonido continuo

| Código | Interacción | Qué hace el usuario | Contenido |
|---|---|---|---|
| **F1** | Pad de frecuencia | Desliza el dedo y oye cómo cambia la altura (Hz) | `frecuencia` (`min`, `max`) |

## E. Piano Roll (puntúan)

`pianoroll` (`PianoRollEjercicio`). Gestos: tocar = crear, arrastrar = alargar, tocar nota = borrar, carril «Vel.».

| Código | Interacción | Qué hace el usuario | Objetivo |
|---|---|---|---|
| **R1** | Dibujar libre | Dibuja N notas como quiera | `libre` (`cantidad`) |
| **R2** | Copiar un patrón | Dibuja exactamente unas notas (con guía punteada o sin ella); explica fallos y tras 2 ofrece la solución | `copiar` (`notas`, `fantasma`) |
| **R3** | Dar acentos (velocity) | Sube la fuerza de unas notas y baja la de otras | `velocity` (`fuertes`) |

Variantes del roll: notas de piano o **filas de batería** (`filas: ['hat','snare','kick']`),
`compas: 3`, nombres de FL (`etiquetas: 'fl'`, `alternar`), `nombres` propios por fila.

## F. Ritmo (puntúan)

`pulso` (`Pulso`): un ritmo suena en bucle con Empezar/Parar.

| Código | Interacción | Qué hace el usuario | Objetivo |
|---|---|---|---|
| **T1** | Tocar al pulso | Toca el botón grande a tiempo; medidor «antes / tarde» | `seguir` (`cada`, `desfase`, `contar`, `porTiempo`) |
| **T2** | Tap tempo | Marca el pulso de un beat y adivina los BPM | `tempo` |
| **T3** | Explorar tempos | Pasa el mismo beat por varios BPM / géneros | `explorar` (`tempos`) |
| **T4** | Comparar versiones | El mismo beat en varias versiones con nombre (p. ej. cuánto swing) | `explorar` (`tempos` con `titulo` y `groove`) |

Variantes de T1 ya usadas: solo en el 1 (`cada: 4`), «1 y 2 y» (`cada: 0.5`), en la «y» o en el 3
(`desfase`), semicorcheas «1 e y a» (`contar: 'e'`, `porTiempo: 4`).

## G. Práctica en FL Studio

| Código | Interacción | Qué hace el usuario | Contenido |
|---|---|---|---|
| **X1** | Reto en FL Studio | Sigue pasos en FL, marca «Lo hice» y responde una reflexión | `reto` (`minutos`, `objetivo`, `pasos`, `consejo`, `reflexion`) |

---

## Plantilla de lección

Orden que siguen las lecciones (10–16 pasos, 8–15 min). Alternar **explicar → hacer → oír**:
nunca dos explicaciones seguidas sin una interacción en medio (salvo cuando la segunda es muy corta).

1. **Gancho** — `O5` (un sonido que plantea la pregunta de la lección) o, si el tema no se oye, `L2`/`L3`.
2. **Bloque de concepto** (se repite 2–4 veces, uno por idea):
   - Explicar: `L2` (o `L3` si es de tiempo/ritmo).
   - Hacer: `P1–P4`, `R1–R3`, `T1–T4` o `F1` (con las manos).
   - Oír: `O1`/`O2` (3–5 rondas) para fijarlo con el oído.
3. **Comprueba la idea** — `O3`/`O4`, 3–5 rondas con lo esencial.
4. **¿Qué se siente?** — `L5`.
5. **Reto en FL Studio** — `X1` (siempre el último paso).
6. **Resumen** — `L6` (pantalla final).

Reglas:
- Cada concepto debe **oírse** (L2/O1/O2) además de leerse.
- Al menos una interacción «con las manos» (C, D, E o F) por lección.
- Dificultad creciente dentro del bloque: con nombres → sin nombres, con guía → sin guía, lento → rápido.
- `explicacion` en todas las rondas: di por qué, no solo «correcto».

### Desviaciones actuales (para revisar)

- **2.1, 2.2 y 2.3 no empiezan con gancho de oído** (empiezan con texto).
- **2.2 y 2.3 no tienen «¿Qué se siente?»** (`L5`).
- Explicaciones seguidas en 2.3 (pasos 1–2 y 11–12).
- 1.2, paso 7 («El mapa de las teclas negras»): texto sin sonido (`L1`).

## Interacciones que faltarán (módulos 3–10)

Ideas para cuando lleguen esos temas; aún **no existen** (Emparejar ya existe: `O6`):

- **Tocar un acorde en el piano** (varias teclas a la vez) — módulo 4. (Tocar una escala en orden ya existe: `P6`.)
- **Ordenar** (arrastrar tarjetas: grados de una escala, partes de una canción) — módulos 3, 8.
- **Dictado**: oír una melodía corta y dibujarla en el Piano Roll (R2 sin guía y sin verla).
- **Mezclador / perillas** (volumen, filtro, paneo con antes/después) — módulos de producción.
- **Prueba rápida de módulo** (5–8 preguntas O1–O4 para saltar lo que ya se domina) — pendiente del plan.
