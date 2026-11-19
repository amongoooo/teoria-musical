# Catálogo de interacciones de las lecciones

Lista cerrada de **todo lo que el usuario puede hacer** dentro de una lección (sacada de las
lecciones 1.1–1.4, 2.1–2.5, 3.1–3.7, 4.1–4.5 y 5.1–5.7) y la **plantilla** que siguen. Al escribir una lección nueva, cada
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
| **L8** | Texto + letra analizada | Lee unos versos con sus rimas en color (y, si la lección ya lo enseñó, el esquema, las sílabas con «‿» o «multi N») | `texto` + `letra` (`texto`, `colores`, `esquema`, `silabas`, `multis`, `leyenda`) | Rima consonante / asonante, esquemas, sinalefa, multis (ruta de letras) |
| **L7** | Texto + círculo de quintas | Lee y toca tonalidades del círculo: cada una suena y el centro dice su armadura y su relativa | `texto` + `circulo` (`inicial`, `menores`, `armaduras`, `resaltar`) | El círculo de quintas, sostenidos y bemoles, relativas y vecinas (3.5) |
| **L9** | Texto + mapa de funciones | Lee y toca los acordes de una tonalidad repartidos en tres columnas (T · S · D); las notas que comparten con su jefe van en oro | `texto` + `funciones` (`tonalidad`) | Funciones tonales: casa, salir, tensión (5.1) |
| **L10** | Texto + rejilla de compases | Lee una forma de canción en filas de 4 compases (cifrado, grado y el fondo de su función); al escuchar, cada compás se enciende cuando suena; tocar uno lo toca | `texto` + `rejilla` (`compases`, `sonido`, `etiqueta`); **con duraciones**: `acordes` (cada uno sus `tiempos` y `adelanto`) + `sonido: conBeat(…)`, o `versiones` con control segmentado | El blues de 12 compases (5.5); el mismo loop lento / normal / rápido, el pre-coro que acelera y el acorde adelantado (5.6); «Let It Be» ya analizada (5.7); otras formas (verso, coro) en el módulo 7 |
| **L11** | Rack que cambia de género | Un Channel rack con los géneros en fichas arriba: tocar una transforma el beat sin dejar de sonar, lo que cambió brilla en oro, el tempo se desliza en una regla de BPM y abajo sale la huella del género (bombilla). Se sigue al escuchar `minimo` géneros (un compás entero cada uno) | `generos` (`generos: ['pop', 'boomBap', …]` de `theory/rack.js` → `GENEROS`, `minimo`, `mensaje`, `tituloBien`) | «Cinco géneros, un kit» (P1.2); después, el árbol de géneros (ramas que se abren al dominar al padre) |

## B. Oído y comprensión: elegir (puntúan)

Todas usan `elegir` (`EscuchaElige`), van por **rondas** y al comprobar muestran `explicacion`
(acierto o error: dos intentos; el 1.º error es oro y el 2.º enseña la respuesta en rojo y va al repaso del final).

| Código | Interacción | Qué hace el usuario | Contenido | Ejemplo |
|---|---|---|---|---|
| **O1** | Elegir entre sonidos | Escucha 2+ tarjetas de sonido y elige una (A, B…) | rondas con `sonidos` y **sin** `opciones` (`mezclar`, `mostrarNotas`) | «¿Cuál es más agudo?», «¿Cuál va más rápido?», «¿Cuál camina?» (bajo que camina, 4.4), «¿Cuál es el tritono?», «¿En cuál se cierra?» y «¿Cuál lleva la séptima?» (5.2), «¿Cuál es el amén?» y «¿En cuál te engaña?» (5.3), «¿Cuál pide volver?» (i–iv–V contra i–iv–v, 5.4), «¿Cuál suena más a jazz?», «¿Cuál es I–vi–IV–V?» (5.5) |
| **O2** | Escuchar y elegir respuesta | Escucha un sonido y elige entre 2–4 textos | `sonidos` + `opciones` | «¿4/4 o 3/4?», «¿Semitono o tono?», «¿Qué figura suena?», «¿Escala mayor u otra cosa?», «¿Termina en casa?» (3.3), «¿Mayor o menor?», «¿La mayor o su relativa?» (3.4), «¿En qué grado termina?», «¿Vecina o lejana?» (3.5), «¿Mayor o menor?» con acordes y «¿Cuál de los cuatro es menor?» en una progresión (4.2), «¿Mayor o menor?» dentro de Do e «¿IV o V?» (4.3), «¿Qué nota está en el bajo?» (4.4), «¿Cinco o siete?», «¿Dónde está la casa?» (pentatónica mayor o su relativa menor) y «¿Se coló una nota?» (melodía sobre el acorde de Do, 3.6), «¿Natural o armónica?» y «¿Cuál de las tres menores?» (siempre subiendo, 3.7), «¿Punto o coma?» (5.3), «¿Qué loop suena?» (I–V–vi–IV, vi–IV–I–V, I–IV–V–IV, i–iv–v; 5.4), «¿Qué séptima suena?» (maj7, m7, 7), «¿Adónde fue?» (el blues hasta que cambia) y «¿Qué progresión suena?» (5.5) |
| **O3** | Quiz de texto | Lee la pregunta y elige (sin audio) | solo `opciones` | «Comprueba la idea» |
| **O4** | Leer el roll y elegir | Mira (y reproduce) un Piano Roll y elige | `roll` en la ronda + `opciones` | «Lee el roll», «¿Dónde está el silencio?», «¿Qué acorde es?» (C, C/E o C/G, 4.4) |
| **O5** | Gancho de oído | 1 ronda de O1 al empezar, antes de explicar nada | `elegir` con 1 ronda | «Empecemos con el oído» (1.1, 1.2, 1.3; en la 3.6, dos melodías sobre el acorde de Do: «¿cuál nunca choca?») |
| **O6** | Emparejar | Escucha 3–4 sonidos (A, B…) y pone a cada uno su nombre tocando los nombres de abajo; al comprobar, cada fila dice si está bien o cuál era | `emparejar` con `parejas` (`sonido`, `nombre`, `detalle`) | «Empareja sonido y nombre» (intervalos, 3.2); «Empareja la rotación» (loops que empiezan en C, G, Am o F; 5.4) |
| **O7** | Encontrar en el círculo | Toca una tonalidad del círculo de quintas como respuesta; al comprobar, la correcta en verde y la elegida en oro | `circulo` con `rondas` (`correcta: 'D'` o `'Em'`, `anillo`, `armaduras`, `resaltar`) | «¿Qué mayor tiene 2♯?», «La dominante de Re», «La relativa de Si♭» (3.5) |
| **O8** | Clasificar | Toca una ficha que suena (con nombre o de oído) y luego su caja; al comprobar, las bien en verde y las mal pasan a su caja en oro | `clasificar` con `cajas` y `rondas` (`fichas`: `nombre`, `detalle`, `sonido`, `caja`) | «Ordena la familia»: los 7 acordes en T, S o D, en Do, en Sol y de oído (5.1); «Ordena las cadencias»: 4 cajas en rejilla 2 × 2 (`cajas: ['autentica', 'plagal', 'semi', 'rota']`, la fórmula V → I en grande) con finales «G7 → C» y, de oído, frases enteras (5.3) |
| **O9** | Analiza la rejilla | Escucha una progresión en la rejilla de compases (cada compás se enciende al sonar), toca un compás vacío y luego su número (I, ii, iii, IV, V, vi); la casilla toma el color de su función y el cursor salta al siguiente; al comprobar sale el cifrado | `analizar` con `rondas` (`compases`: `cifrado`, `grado`, `notas`; `dados`, `sonido`) | «Analiza la rejilla»: en Do, en Sol, «Let It Be» (8 compases) y «Hallelujah» (5.7) |

## C. Teclado (puntúan al cumplir el objetivo)

`tocar` (`TocaEnPiano`); `piano: { startOctave, octaves, showLabels }`. `showLabels: false` = más difícil.
A 375 px se ve **una octava** y el teclado va a la de `desde`: en P5/P7 elige `desde` y meta **en la misma octava**
(p. ej. «Encuentra la relativa» de la 3.4: Do4 → La4 subiendo una 6.ª, no Do5 → La4 bajando una 3.ª).

| Código | Interacción | Qué hace el usuario | Objetivo |
|---|---|---|---|
| **P1** | Explorar el teclado | Toca N teclas distintas libremente | `explorar` (`cantidad`) |
| **P2** | Extremos | Toca la tecla más grave y la más aguda | `extremos` |
| **P3** | Comparar con referencia | Oye una nota y toca una más aguda / más grave | `comparar` (`referencia`, `direccion`) |
| **P4** | Encontrar en todas las octavas | Toca una nota en todas las octavas visibles (título corto «Encuentra la nota», sin `intro`: pedido del usuario) | `octavas` (`nota`, `pista`) |
| **P5** | Medir un paso | Desde una nota marcada, toca la que está a un semitono o un tono (sube / baja); dos recuadros: la salida y la buscada con candado, que se abre al tocarla; al fallar dice cuánto se movió y tras 2 fallos marca la tecla | `paso` (`desde`, `paso: 'S' \| 'T'`, `direccion`, `pista`) |
| **P6** | Seguir la fórmula | Desde una nota dada, toca en orden las notas de una fórmula de pasos (T T S T T T S…); la fila de casillas se llena al acertar y, si vuelve a tocar una ya tocada, esa casilla tiembla | `formula` (`desde`, `pasos`, `titulo`, `mensaje`, `grados`: número de grado bajo cada casilla, o una lista propia); paso **`T½`** = tono y medio («salta dos teclas»): pentatónicas T T T½ T T½ y T½ T T T½ T (3.6); en una fórmula de 7 pasos el T½ avanza una letra (2.ª aumentada): menor armónica T S T T S T½ S (Fa → Sol♯) y melódica T S T T T T S (3.7) |
| **P7** | Construir un intervalo | Desde una nota marcada, toca la que forma un intervalo con nombre (3.ª mayor, 5.ª justa, tritono…); el fallo dice qué intervalo tocó y tras 2 fallos marca la tecla | `paso` con `intervalo` (`desde`, `intervalo: '3M'`, `direccion`, `pista`, `mensaje`); en la 3.4, «Encuentra la relativa» (sube una 6.ª mayor / baja una 3.ª menor); en la 3.5, con `grado: 'la dominante'` = «Encuentra el grado» y «Gira el círculo» (sube una 5.ª); en la 3.7, «Encuentra la sensible» (`grado: 'la sensible'`, baja una 2.ª menor desde la tónica menor) |
| **P8** | Construir un acorde | La fundamental viene marcada; toca la 3.ª y la 5.ª (en cualquier orden y octava). Casillas 1 · 3 · 5 que se llenan y, encima, la 3.ª entre cada pareja (3M / 3m); al completarlo suena el acorde. El fallo dice cuántos semitonos subió; tras 2 fallos marca las que faltan | `acorde` (`raiz`, `tipo`: mayor \| menor \| dis \| aum, `guia`, `cifrado`, `escuchar`); 4.1 «Apila terceras», «Construye mayores / menores», «Lee el cifrado»; 4.2 «Escucha y construye» (`escuchar: true`); 4.3 «Apila sobre cada grado» (`revelar`: no dice el tipo) y «Construye el grado» (`romano`: sin nota dada, las tres); 4.4 «Construye la inversión» y «Encadena» (`inversion`: la marcada es el bajo y las otras van encima); 4.5 «Abre el acorde» (`voicing: 'abierto'`: la 5.ª encima y la 3.ª una octava arriba, octava exacta); 5.2 «Construye el V7» (`tipo: 'dom7'`: cuatro casillas 1 · 3 · 5 · 7; y `romano: 'V7'`); 5.4 «Construye el loop» (`romano` en Re y, con `menor: true`, i · VI · III · VII en Mi menor); 5.5 «Construye las séptimas» (`tipo: 'm7' | 'dom7' | 'maj7'`), «El ii–V–I de Fa» (`romano: 'ii7' | 'V7' | 'Imaj7'`) y «Los acordes del blues» (C7, F7, G7) |
| **P9** | Resolver la tensión | Ve un V7 marcado y, en oro, sus dos notas tensas con flecha (la sensible ↑, la 7.ª ↓); toca adónde va cada una (en su octava). Con las dos suena V7 → I; el fallo dice si subió o bajó al revés | `resolver` (`raiz`, `menor`, `mensaje`); 5.2 «Resuelve la tensión»: G7 → C, D7 → G, C7 → F, A7 → Dm; 5.3 «Cierra con una auténtica»: A7 → D, B♭7 → E♭, B7 → Em |

## D. Sonido continuo

| Código | Interacción | Qué hace el usuario | Contenido |
|---|---|---|---|
| **F1** | Pad de frecuencia | Desliza el dedo y oye cómo cambia la altura (Hz) | `frecuencia` (`min`, `max`) |

## E. Piano Roll (puntúan)

`pianoroll` (`PianoRollEjercicio`). Gestos: tocar = crear, arrastrar = alargar, tocar nota = borrar, carril «Vel.».

| Código | Interacción | Qué hace el usuario | Objetivo |
|---|---|---|---|
| **R1** | Dibujar libre | Dibuja N notas como quiera | `libre` (`cantidad`) |
| **R2** | Copiar un patrón | Dibuja exactamente unas notas (con guía punteada o sin ella); explica fallos y tras 2 ofrece la solución. **Dictado**: con `escuchar`, un botón «Escuchar el original» y se saca de oído (el bajo de un loop, 5.7) | `copiar` (`notas`, `fantasma`, `escuchar`) |
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
**Toca en cada cambio** (5.6): el groove es un loop de acordes sobre el beat (`conBeat`) y `toques: cambiosAcordes(acordes)`: se toca cuando cambia el acorde (cada compás, dos por compás o cada 2 compases; el pad late en cada cambio, o sin ayuda con `visual: false`).

## G. Práctica en FL Studio

| Código | Interacción | Qué hace el usuario | Contenido |
|---|---|---|---|
| **X1** | Reto en FL Studio | Sigue pasos en FL, marca «Lo hice» y responde una reflexión | `reto` (`minutos`, `objetivo`, `pasos`, `consejo`, `reflexion`) |

---

## H. Letras (puntúan; ruta de letras)

| Código | Interacción | Qué hace el usuario | Contenido |
|---|---|---|---|
| **E1** | Marcar palabras | Toca en unos versos las palabras que pide la pregunta (p. ej. las que riman en consonante con *corazón*); al comprobar: bien en verde con ✓, las que faltaban en oro y las que sobraban tachadas | `marcar` con `rondas` (`texto`, `correctas: ['razón']`, `fijas`) |
| **E2** | Marcar sílabas | Igual, tocando sílabas (cada palabra partida en sílabas): «toca las tónicas» | `marcar` con `unidad: 'silaba'` y `correctas: 'tonicas'` (o claves `'verso.palabra.silaba'`) |
| **E3** | Acomodar el flow | Un verso repartido parejo en las 16 casillas del compás; mueve sílabas o graba con el pad hasta que las tónicas caigan en el pulso (número o «y»); al fallar enseña una solución | `flow` (`verso`, `explicacion`) |

El quiz O3 también lee versos: `letra` en una ronda de `elegir` («¿Qué esquema tiene?», «¿Cuántas sílabas?»).

## I. Producción (puntúan)

| Código | Nombre | Qué hace el usuario | Tipo en el contenido | Ejemplos |
|---|---|---|---|---|
| **S1** | Channel rack | El Channel rack de FL Studio en el celular (`components/ChannelRack.jsx`): una fila por sonido (Kick, Clap, Snare, Hat, O.Hat = hat abierto, Perc) y 16 pasos en 4 grupos de tono alterno. Tocar un paso lo enciende o lo apaga; arrastrar el dedo pinta la fila. «Reproducir» lo repite en bucle (lo que cambias se oye al tiempo siguiente) y la luz de cada fila la silencia. Al 1.er error, lo de más tachado en oro y cuántos golpes faltan o sobran por fila (sin decir dónde); al 2.º, la solución con lo que faltaba con borde rojo | `rack` con `rack: { filas, bpm, patron, fijas }` y `objetivo`: `capas` (oír cada sonido solo), `copiar` (`patron`, `guia`, `escuchar` = dictado), `libre` | P1.1: «Escucha cada capa», «Pon el backbeat», «Los hats, el motor» (con guía), «Escucha y copia el bombo» y «Copia el beat entero» (dictados); P1.2: four on the floor, el hat abierto, la caja del dembow, «Del pop al boom bap» (empieza con otro patrón puesto), la caja del trap y el trap entero; P1.3 con **pincel** (`rack.pinceles`: Golpe · Suave · ×2 · ×3; `tipo` en el patrón): «Hats con mano» (suaves con guía), «Tu primer roll» (×2 con guía), «Escucha y copia el roll» y «Programa los hats del drill» (dictados), «Tu fila de hats» (libre con `rolls` y `suaves`) |
| **S2** | Piano roll del 808 | El mini Piano roll con la voz del **808** (`roll.instrumento: '808'`, Mi2–Do3): la fila del **Bombo** fija arriba para alinear, el beat de fondo al reproducir y la **cola que pisa un bombo tachada en oro**. Con `roll.slide`, el pincel **Nota · Slide**: tocar una nota con Slide la marca (triangulito de FL y rampa desde la nota anterior) y el 808 se desliza hasta ella. Comprobar mira también el glide («le falta el glide») | `pianoroll` con `roll: { instrumento: '808', bombo, fondo, slide }` y `objetivo` `copiar` (con `fantasma` o `escuchar` = dictado) o `libre` (`cantidad`, `slides`) | P1.4: «Tu primer 808» (con cada bombo, guía), «Que respire» (recortar la cola), «Escucha y copia el 808» (dictado, un compás por acorde), «Haz un glide» (pincel Slide), «Tu 808» (libre: 4 notas y un glide) |

## Prueba rápida «¿Ya lo sabes?» (hecha)

Al tocar el cuadrito de un módulo o de una ruta sube una hoja con «¿Ya lo sabes?»: **una pregunta por lección
pendiente** (O1–O4, u O7 en la 3.5), con «No lo sé». Las acertadas se pueden **saltar** (cuentan como hechas).
**Cada lección nueva trae 3 preguntas de prueba** en `src/content/pruebas/` (ver FORMATO.md → «Preguntas de la
prueba rápida»): al nivel del final de la lección y con 3+ opciones o dos sonidos parecidos, para que no se adivinen.

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

Ideas para cuando lleguen esos temas; aún **no existen** (Emparejar ya existe: `O6`; construir un acorde: `P8`; clasificar: `O8`):

- **Ordenar** (arrastrar tarjetas: grados de una escala, partes de una canción) — módulos 3, 8.
- **Dictado**: oír una melodía corta y dibujarla en el Piano Roll (R2 sin guía y sin verla).
- **Mezclador / perillas** (volumen, filtro, paneo con antes/después) — Producción 2 y 3 (Sound design, Mezcla y máster).
