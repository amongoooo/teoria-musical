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

En los textos se puede usar `**negrita**` y `*cursiva*` (sin anidar: `*co-ra-**zón***` no funciona).

**Lecciones que viven en una RUTA** (no en un módulo; p. ej. las 5 de la ruta de letras): archivo en
`src/content/ruta-ID/` con `ruta: 'letras'` en lugar de `modulo` e `id` corto (`'L1'`, lo que se ve en la isla);
regístrala en `src/content/index.js` y ponla en las `paradas` de la ruta (`content/rutas.js`) con su `titulo`. Toma
el color de la ruta, ✕ y «Volver a la ruta» llevan a `#/ruta/ID` y la ruta la abre en orden (no `estadoLeccion`).

**Antes de escribir una lección**, ver `INTERACCIONES.md`: catálogo de interacciones (L1–L6, O1–O5,
P1–P4, F1, R1–R3, T1–T4, X1) y la plantilla de orden de los pasos.

## Campos comunes de cada paso

- `tipo` (obligatorio): uno de los de abajo.
- `titulo`: título grande del paso.
- `intro`: texto corto bajo el título.
- `pista` (opcional): texto que NO se ve al entrar; sale con el botón de bombilla junto a la etiqueta del paso (cómo hacer el ejercicio, sin dar la respuesta). Úsalo en lugar de `intro` en los pasos de piano.
- **Se puede fallar**: en los pasos que puntúan, cada ronda tiene dos intentos; al segundo fallo la respuesta sale en rojo y esa ronda vuelve en el **repaso** del final de la lección. La `pista` de una ronda (`elegir`, `circulo`) sale con el primer error.

## Sonidos

Donde se pida un sonido:

```js
{ notas: ['C4', 'E4', 'G4'], modo: 'secuencia' | 'acorde', velocidad: 0.8, intervalo: 0.45, duracion: 0.9, etiqueta: 'Escuchar' }
{ notas: [['C3', 'C4'], ['E3', 'E4']] }                  // en secuencia, un array = notas a la vez (p. ej. doblar a la octava)
{ frecuencia: 440, duracion: 1.2, etiqueta: '440 Hz' }   // onda pura
{ groove: 'basico', bpm: 90, compases: 2 }              // groove de theory/bateria.js (lista abajo)
{ groove: [{ nota: 'click', inicio: 0, velocity: 1 }, …], tiempos: 3, porTiempo: 2 }  // patrón propio
```

En los pasos `texto` y `siente`, cada sonido sale con **lo que suena** a la vista (`components/VerSonido.jsx`): un groove
trae su metrónomo (`bpm`) y un pad por instrumento; las notas, un teclado que las enciende; una frecuencia, su onda. En las
preguntas no. Solo suena uno a la vez.

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

Escalas y grados (lección 3.3): `theory/escalas.js` (Tonal `Scale`): `MAYOR` (T T S T T T S), `escalaMayor('G3')` (8 notas
con octava; `{ bajando: true }`), `escalaCambiada('C4', { grado: 3, semitonos: -1 })` (para «¿mayor u otra cosa?»),
`grado('D', 7)` → `'C#'`, `alteraciones`, `armadura('D')` → `'2♯'`, `nombresEscala('D')` → «Re · Mi · Fa♯ · …», `GRADOS` y `ordinal`.
Menor natural y relativas (lección 3.4): `MENOR` (T S T T S T T), `escalaMenor('E4')`, `relativaMenor('G')` → `'E'` (6.º grado),
`relativaMayor('D')` → `'F'` (3.er grado de la menor), `melodia('C4', [5, 6, 7, 8, 5, 3, 2, 1], 'minor')` (una melodía por grados:
la misma forma en mayor, en su paralela menor o en la relativa). `grado`, `alteraciones`, `armadura` y `nombresEscala` aceptan `tipo: 'minor'`.
Tonalidad y círculo de quintas (lección 3.5, Tonal `Key`): `CIRCULO` (las 12 mayores en el sentido del reloj desde Do: C G D A E B F# Db Ab Eb Bb F),
`armaduraMayor('A')` → `{ cantidad: 3, signo: '♯', notas: ['F#', 'C#', 'G#'] }`, `dominante('D')` → `'A'`, `subdominante('Eb')` → `'Ab'` y
`conArmadura(notas, 'G')` (las mismas notas con la armadura de otra mayor: cada letra toma su alteración; para «¿vecina o lejana?»).
Pentatónicas (lección 3.6): `PENTA_MAYOR` (T T T½ T T½), `PENTA_MENOR` (T½ T T T½ T), `GRADOS_PENTA_MAYOR` (1 2 3 5 6 1) y
`GRADOS_PENTA_MENOR` (1 ♭3 4 5 ♭7 1), `pentaMayor('C4')` / `pentaMenor('A3')` (6 notas con la octava; `escala()` usa el largo real
de la escala) y `nombresEscala('A', { tipo: 'minor pentatonic' })` → «La · Do · Re · Mi · Sol». `alteraciones` acepta esos `tipo`.
Menores armónica y melódica (lección 3.7): `MENOR_ARMONICA` (T S T T S T½ S), `MENOR_MELODICA` (T S T T T T S), `GRADOS_ARMONICA` / `GRADOS_MELODICA`,
`escalaArmonica('A3')`, `escalaMelodica('A3')`, `melodicaClasica('A3')` (sube melódica y baja natural); `grado`, `melodia` y `nombresEscala`
aceptan `tipo: 'harmonic minor'` y `'melodic minor'`. En `formula()` (P6), el T½ de una escala de 7 pasos se escribe como 2.ª aumentada (Fa → Sol♯).

Acordes (lección 4.1, Tonal `Chord`): `theory/acordes.js`: `TRIADAS` (mayor, menor, dis, aum: terceras, cifrado, carácter),
`triada('D4', 'menor')` → `['D4', 'F4', 'A4']`, `arpegioYAcorde(notas)` (de una en una y luego juntas, para un sonido),
`nombreAcorde('B3', 'dis')` → «Si disminuido», `cifrado('F#4', 'menor')` → «F♯m», `TERCERA` (3 → 3m, 4 → 3M).
Acordes de la tonalidad e inversiones (lecciones 4.3 y 4.4, Tonal `Key`): `diatonicos('C4')` → las 7 tríadas
(`{ grado, romano, raiz, tipo, notas, cifrado }`, de I a vii°; `{ menor: true }` = menor natural), `ROMANOS`
(I ii iii IV V vi vii°) y `ROMANOS_MENOR` (i ii° III iv v VI VII), `acordeDeGrado('G3', 'vi')` → Em (E4…),
`inversion(['C4', 'E4', 'G4'], 1)` → `['E4', 'G4', 'C5']`, `cifradoInversion('G3', 'mayor', 1)` → «G/B», `INVERSIONES` y
`APILADO` (3 → 3m, 4 → 3M, 5 → 4J; 7 → 5J, 8 → 6m, 9 → 6M). Voicings (lección 4.5): `abierto(['C3', 'E3', 'G3'])` →
`['C3', 'G3', 'E4']` (la 3.ª sube una octava); en P8, la ronda `{ raiz: 'C3', tipo: 'mayor', voicing: 'abierto' }` pide esas notas con su octava.
Séptimas y resolución (lección 5.2): `SEPTIMAS` (`dom7` = mayor + 7.ª menor, cifrado «7»; `maj7` = mayor + 7.ª mayor y `m7` = menor + 7.ª menor, de la 5.5) y
`TIPOS_ACORDE` (tríadas + séptimas): `triada('G3', 'dom7')` → `['G3', 'B3', 'D4', 'F4']`, `cifrado('G3', 'dom7')` → «G7»,
`nombreAcorde` → «Sol séptima», `acordeDeGrado('F4', 'V7')` → C7 (en menor, `{ menor: true }`, también mayor con 7.ª: E7 en La menor); con cualquier grado + '7' o 'maj7'
(5.5): `'ii7'` → Dm7, `'Imaj7'` → Cmaj7, `'I7'` / `'IV7'` → C7 / F7 (sobre mayor, '7' = de dominante; sobre menor, m7),
`TRITONO` (6) y `resolucionV7('G3')` → `{ v7, tonica: 'C4', sensible: { desde: 'B3', hacia: 'C4' }, septima: { desde: 'F4', hacia: 'E4' }, acordes }`
(`menor: true`: la 7.ª baja un tono; `acordes` = el V7 y el acorde al que llega, para el sonido).
Cadencias (lección 5.3): `CADENCIAS` (`autentica`, `plagal`, `semi`, `rota`: `formula` «V → I», `nombre`, `corto`, `intensidad` del fondo de su caja),
`ORDEN_CADENCIAS` y `cadenciaDe('V7', 'vi')` → 'rota' (los dos últimos grados de una frase; otra cosa → null).

Notas en notación inglesa con octava (`C4` = Do central, `F#4`, `Bb3`). Golpes de batería:
`'kick'` (bombo), `'snare'` (caja), `'hat'` (hi-hat), `'clap'` (palmas), `'click'` (metrónomo):
sirven en `notas`, en los patrones y como filas del Piano Roll (`filas: ['hat', 'snare', 'kick']`).

## Preguntas de la prueba rápida («¿Ya lo sabes?»)

Cada lección lleva **3 preguntas** en el banco de su módulo: `src/content/pruebas/modulo-N.js` (las de la ruta de
letras, en `pruebas/letras.js`), con la forma `{ '3.3': [ronda, ronda, ronda] }`. Cada una es una **ronda de
`elegir`** (O1–O4: `pregunta`, `sonidos`, `opciones`, `correcta`, `roll`, `letra`, `explicacion`…) o de `circulo`
con `tipo: 'circulo'`. La prueba (`pruebas/index.js` → `armarPreguntas`) toma **una al azar** de cada lección
pendiente; si una lección no tiene banco, no entra en la prueba. Reglas: al nivel del **final** de la lección, con
3+ opciones (o dos sonidos parecidos) y `explicacion` corta. `docs/pruebas/prueba-rapida.mjs` comprueba el banco.

## Tipos de paso

| tipo | Componente | Para qué |
|---|---|---|
| `texto` | `components/pasos/PasoTexto.jsx` | Explicación: `parrafos: []`, `sonidos: []`, `nota` |
| `siente` | `components/pasos/PasoSiente.jsx` | Tarjeta "¿Qué se siente?": `lados: [{ etiqueta, emociones, ejemplos, sonido }]`, `nota` |
| `elegir` | `components/exercises/EscuchaElige.jsx` | Escucha y elige / quiz, por rondas |
| `emparejar` | `components/exercises/Emparejar.jsx` | Emparejar varios sonidos con su nombre a la vez, por rondas |
| `clasificar` | `components/exercises/Clasificar.jsx` | Mandar fichas que suenan a su caja (funciones T · S · D), por rondas |
| `analizar` | `components/exercises/Analizar.jsx` | Poner el número (I, ii… vi) a cada compás de una rejilla que suena, por rondas |
| `circulo` | `components/exercises/EligeEnCirculo.jsx` | Responder tocando una tonalidad del círculo de quintas, por rondas |
| `tocar` | `components/exercises/TocaEnPiano.jsx` | Responder tocando el piano |
| `frecuencia` | `components/exercises/ExploraFrecuencia.jsx` | Pad para deslizar Hz: `min`, `max` |
| `reto` | `components/exercises/RetoFL.jsx` | Reto en FL Studio con "Lo hice" y reflexión |
| `pianoroll` | `components/exercises/PianoRollEjercicio.jsx` | Mini Piano Roll táctil: dibujar, copiar, velocity |
| `pulso` | `components/exercises/Pulso.jsx` | Ritmo en bucle: tocar al pulso, tap tempo, explorar tempos |
| `marcar` | `components/exercises/MarcaPalabras.jsx` | Tocar palabras o sílabas en unos versos (ruta de letras) |
| `flow` | `components/exercises/FlowEjercicio.jsx` | Acomodar las sílabas de un verso para que las tónicas caigan en el pulso |
| `rack` | `components/exercises/RackEjercicio.jsx` | Channel rack de FL Studio (S1): oír cada capa, copiar un patrón (con guía o de oído) o hacer uno libre |
| `generos` | `components/pasos/PasoGeneros.jsx` | Rack que cambia de género (L11): fichas de géneros sobre el Channel rack; se sigue al escuchar `minimo` |

### `marcar`

```js
{
  tipo: 'marcar',
  rondas: [
    { pregunta: 'Toca las que riman en **consonante** con *corazón*.', texto: 'Te escribo esta canción\ncon todo el corazón',
      fijas: ['corazón'], correctas: ['canción'], explicacion: '…' },
    { pregunta: 'Toca las tónicas.', unidad: 'silaba', texto: 'Camino de noche por la avenida', correctas: 'tonicas' },
  ],
}
```

Palabras: `correctas` = las palabras (todas sus apariciones); `fijas` se ven en gris y no se tocan; las débiles
(*la*, *de*, *con*…) salen como texto. Sílabas: `'tonicas'` = la tónica de cada palabra que suena fuerte, o claves
`'verso.palabra.silaba'` (desde 0). Exacto = acierto; al comprobar, faltan en oro y sobran tachadas.

### `flow`

```js
{ tipo: 'flow', titulo: 'Acomoda el flow', intro: '…', verso: 'Camino de noche por la avenida', explicacion: '…' }
```

El verso empieza repartido parejo (`repartir` de `letras/flow.js`); elige uno en el que así **no** queden todas las
tónicas en el pulso (`acentosATiempo`). Comprobar exige todas en casilla par; al fallar enseña `repartirConAcentos`.

`texto` acepta además `fichas`: una lista de filas que suenan al tocarlas (nombre, texto y un dato a la derecha
en DM Mono), p. ej. la tabla de intervalos con su canción de referencia:

```js
fichas: { nombre: 'Intervalo', dato: 'Semitonos', filas: [{ nombre: '3.ª mayor', texto: '«When the Saints»', dato: 4, sonido: { notas: ['C4', 'E4'] } }] }
```

`texto` acepta además `funciones`: el **mapa de funciones** (`components/MapaFunciones.jsx`, lección 5.1): los 7 acordes de una
tonalidad mayor en tres columnas **T · S · D** (casa, salir, tensión); el jefe de cada una (I, IV, V) con borde y, en los
demás, las notas que comparten con él en oro. Cada acorde suena al tocarlo (los parientes, después de su jefe):

```js
funciones: { tonalidad: 'C4' }   // ayudas en theory/acordes.js: FUNCIONES, FUNCION_GRADO, funcionDe('vi') → 'T', notasComunes, funcionesDe('C4')
```

`texto` acepta además `rejilla`: la **rejilla de compases** (`components/Rejilla.jsx`, L10, lección 5.5): filas de 4 compases
con su número, el cifrado en grande y el grado, cada uno con el fondo de su función (T · S · D, como el mapa). El botón de
arriba toca toda la forma y **enciende cada compás cuando suena**; tocar una casilla toca solo ese compás. Un acorde por compás:

```js
rejilla: { etiqueta: 'Escuchar los 12 compases', compases: [{ cifrado: 'C7', grado: 'I7' }, …], sonido: { notas: [['C3', 'E4', 'G4', 'Bb4'], …], intervalo: 0.75, duracion: 0.7 } }
```

**Rejilla con duraciones** (lección 5.6, ritmo armónico): en vez de `compases`, `acordes` con lo que dura cada uno (en tiempos) y
el sonido hecho con `conBeat` (los mismos acordes sobre la batería). Cada acorde es un bloque tan largo como dura; debajo,
los tiempos de cada compás laten; un acorde con `adelanto` (0.5 = en la «y» del 4) empieza antes de la línea con el borde en oro.
Con `versiones`, un control segmentado cambia entre versiones del mismo loop (los bloques se estiran o se parten):

```js
const acordes = [{ cifrado: 'C', grado: 'I', notas: ['C3', 'C4', 'E4', 'G4'], tiempos: 4, adelanto: 0.5 }, …]
rejilla: { acordes, sonido: conBeat(acordes, { groove: 'basico', bpm: 90, vueltas: 2, etiqueta: 'Escuchar sobre el beat' }) }
rejilla: { versiones: [{ nombre: 'Lento', acordes, sonido: conBeat(acordes), etiqueta: 'Un acorde cada 2 compases' }, …] }
```

`conBeat(acordes, { groove, bpm, vueltas, etiqueta })` (`theory/bateria.js`) sirve como cualquier sonido (`sonidos`, rondas de
`elegir`, `siente`) y como groove de `pulso`: `{ groove: s.groove, tiempos: s.tiempos, porTiempo: s.porTiempo, toques: cambiosAcordes(acordes) }`
= «Toca en cada cambio». `groove: null` = sin batería; `'click'` = solo el metrónomo.

`texto` acepta además `circulo`: el **círculo de quintas** táctil (`components/CirculoQuintas.jsx`); tocar una tonalidad la elige
y suena su escala, y el centro dice su armadura y su relativa:

```js
circulo: { inicial: 'G', menores: false, armaduras: true, resaltar: ['G', 'D', 'A'] }  // ids: mayor 'D', menor 'Em' / 'F#m' / 'Bbm'
```

`texto` y las rondas de `elegir` aceptan además `letra`: unos **versos analizados** con el motor de `src/letras/`
(`components/LetraAnalizada.jsx`, lo mismo que la pestaña Analizar del cuaderno). Se enciende solo lo ya enseñado:

```js
letra: { texto: 'Me late fuerte el corazón\ny no le encuentro la razón', colores: true, esquema: false, silabas: false, multis: false, leyenda: false }
```

`colores` = rima consonante rellena y asonante subrayada · `esquema` = A/B a la izquierda · `silabas` = número de
sílabas a la derecha y la sinalefa como «‿» · `multis` = «multi N» · `leyenda` = qué es cada marca.
Comprueba siempre con el motor que el análisis dice lo que dice la lección (`analizar(texto)` en node).

`texto` y las rondas de `elegir` aceptan además `roll: { …config, notas }` para mostrar un
Piano Roll de **solo lectura** (con botón Reproducir) junto al texto o la pregunta.

### `elegir`

```js
{
  tipo: 'elegir',
  rondas: [
    {
      pregunta: '¿Cuál es más agudo?',   // admite **negritas**
      sonidos: [{ notas: ['C4'] }, { notas: ['G4'] }],
      // sin `opciones`: las tarjetas de sonido son las respuestas (A, B…)
      opciones: ['texto 1', 'texto 2'],   // opcional; SE BARAJAN cada vez que se abre el paso (la buena no queda
                                          // siempre en el mismo lugar), salvo si tienen orden natural: números que suben
                                          // («60 · 90 · 120 BPM»), «Ninguna · Una · Dos», «La versión A · B»
      ordenFijo: true,      // opcional: no barajar las opciones de texto
      correcta: 1,          // índice de la opción (o del sonido) TAL COMO SE ESCRIBIÓ (no importa dónde se vea)
      mezclar: true,        // orden de los sonidos al azar
      mostrarNotas: true,   // al responder, enseña nota y Hz de cada tarjeta
      explicacion: '…',     // se muestra al comprobar (acierto o error)
    },
  ],
}
```

### `emparejar`

```js
{
  tipo: 'emparejar',
  rondas: [
    {
      pregunta: 'Desde Do, subiendo',          // corta (cabe todo en el celular)
      parejas: [                               // 3–4 parejas (más no caben a 375 px sin desplazar)
        { sonido: { notas: ['C4', 'E4'], intervalo: 0.7 }, nombre: '3.ª mayor', detalle: 'Do → Mi · 4 semitonos' },
      ],
      explicacion: '…',                        // en la barra al comprobar
      mezclar: true,                           // (por defecto) sonidos y nombres en orden al azar
    },
  ],
}
```

Cada sonido es una fila (A, B…) con su botón de escuchar y un hueco; abajo, los nombres. Tocar un nombre lo lleva al
hueco activo (el que se acaba de escuchar o el primero vacío); tocar un hueco lleno lo devuelve. Al comprobar, cada
fila dice si está bien (✓) o cuál era (bombilla) y muestra su `detalle`. Puntúa una pareja por acierto.

### `clasificar`

```js
{
  tipo: 'clasificar',
  cajas: ['T', 'S', 'D'],                  // ids de FUNCIONES (theory/acordes.js): fondo y letra de cada función
                                           // o de CADENCIAS: ['autentica', 'plagal', 'semi', 'rota'] (5.3; rejilla 2 × 2)
  ayuda: 'Toca un final y luego su caja',  // opcional: lo que dice la barra antes de empezar
  rondas: [
    {
      pregunta: 'Los 7 acordes de **Do mayor**',
      fichas: [{ nombre: 'Am', detalle: 'vi', sonido: { … }, caja: 'T' }],   // sin `nombre` = de oído (A, B, C…)
      explicacion: '…',
    },
  ],
}
```

Las fichas salen abajo en orden al azar. Tocar una la elige (y suena); tocar una caja, o una ficha que ya está en ella, la
manda ahí (con cadencias, la caja muestra la fórmula —V → I— y el nombre; `cadenciaDe('V7', 'I')` da la caja de una ficha); sin ninguna elegida, tocar una ya puesta la devuelve. Con todas puestas, «Comprobar»: las bien en verde con ✓,
las mal pasan a su caja en oro con bombilla. Puntúa una ficha por acierto. 7 fichas caben a 375 px.

### `analizar`

```js
{
  tipo: 'analizar',
  opciones: ['I', 'ii', 'iii', 'IV', 'V', 'vi'],   // opcional (estos son los de por defecto)
  rondas: [
    {
      pregunta: 'En **Do mayor**',
      compases: [{ cifrado: 'C', grado: 'I', notas: ['C3', 'C4', 'E4', 'G4'] }, …],   // un acorde por compás
      dados: [0],                                   // los que vienen puestos (la casa)
      sonido: { etiqueta: 'Escuchar', notas: [un acorde por compás…], intervalo: 0.9, duracion: 0.85 },
      pista: '…',                                   // opcional: sin ella, la del 1.er error dice el bajo del compás que falló
      explicacion: '…',
    },
  ],
}
```

**Analiza la rejilla** (O9, `components/exercises/Analizar.jsx`, lección 5.7): la rejilla de compases por llenar. Escuchar
enciende cada compás al sonar; se toca un compás vacío (el cursor empieza en el primero) y luego su número: la casilla toma
el fondo de su función y el cursor salta al siguiente vacío. Tocar un compás lo toca solo. El cifrado sale al comprobar.
Dos intentos como en todo: al 1.º los bien quedan fijos y los mal vuelven vacíos en oro con lo tachado; al 2.º, el correcto
en rojo y la ronda al repaso. Puntúa un compás por acierto. 8 compases (2 filas) caben a 375 px.

### `circulo`

```js
{
  tipo: 'circulo',
  rondas: [
    {
      pregunta: '¿Qué tonalidad mayor tiene **2 sostenidos**?',
      correcta: 'D',             // mayor 'D' o menor 'Em' (tónica + 'm')
      anillo: 'mayor',           // qué anillo responde: 'mayor' | 'menor' | 'ambos' (por defecto, el de la respuesta)
      armaduras: false,          // «2♯» bajo cada mayor (por defecto no: suele ser la pregunta)
      menores: false,            // anillo de dentro (por defecto, si la respuesta o el anillo son menores)
      resaltar: ['G'],           // casillas en el tono suave del módulo (p. ej. de dónde se parte)
      sonidos: [],               // opcional: botones de sonido encima
      explicacion: '…',
    },
  ],
}
```

Tocar una casilla la elige (y suena su tónica); al comprobar, la correcta en verde, la elegida en oro y el centro dice la
respuesta con su armadura.

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
  // objetivo: { tipo: 'paso', rondas: [{ desde: 'E4', paso: 'S' | 'T', direccion: 'sube' | 'baja', pista }] }
  //   → tocar la nota a un semitono / un tono de `desde` (calculada con Tonal en theory/intervalos.js;
  //     vale cualquier nombre de la misma tecla). `pista` se añade al fallar; al 2.º fallo la nota buscada se abre en rojo y la ronda va al repaso.
  //   Con `intervalo` (nombre de Tonal: '2m','2M','3m','3M','4P','4A' = tritono,'5P','6m','6M','7m','7M','8P') en lugar
  //   de `paso` → construir ese intervalo (P7): { desde: 'D4', intervalo: '3M', direccion: 'sube', pista, mensaje }.
  //   Nombres y semitonos: INTERVALOS / nombreIntervalo / notaIntervalo de theory/intervalos.js.
  //   `grado: 'la dominante'` (con `intervalo`) cambia la frase a «Toca la dominante de Do4» (3.5: grados con nombre).
  // objetivo: { tipo: 'formula', rondas: [{ desde: 'C4', pasos: ['T','T','S','T','T','T','S'], titulo, mensaje }] }
  //   → tocar en orden las notas de la fórmula (T = tono, S = semitono) desde `desde` (que ya viene marcada).
  //     Encima, una fila de casillas con los pasos; el teclado pasa solo a la octava de la siguiente nota.
  //     Pasos: 'T', 'S' y 'T½' (tono y medio = 3 semitonos, el salto de las pentatónicas, 3.6; casilla en oro como la S).
  //     `grados: true` → debajo de cada casilla, su grado (1 … 7 y la octava otra vez 1); o una lista propia
  //     (`grados: ['1', '♭3', '4', '5', '♭7', '1']`, pentatónicas). Volver a tocar una
  //     nota ya tocada no es fallo: su casilla tiembla (también con la fórmula completa).
  // objetivo: { tipo: 'acorde', rondas: [{ raiz: 'D4', tipo: 'mayor' | 'menor' | 'dis' | 'aum', titulo, mensaje, pista }] }
  //   → construir la tríada (P8, 4.1): la fundamental viene marcada (y en verde en su casilla); se tocan la 3.ª y la 5.ª
  //     en cualquier orden y en cualquier octava (la tecla tocada queda marcada). Casillas «1 · 3 · 5» y, encima, la 3.ª
  //     que separa cada pareja (3M / 3m). Al completarlo suena el acorde. El fallo dice cuántos semitonos se subió y a
  //     cuántos están la 3.ª y la 5.ª; tras 2 fallos seguidos marca las que faltan.
  //     `guia: false` = sin las terceras encima · `cifrado: true` = pide «Dm» en lugar de «Re menor» ·
  //     `escuchar: true` = «Escucha y construye»: suena el acorde, no se dice cuál es ni hay guía (4.2).
  //     `revelar: true` + `tonalidad: 'C'` = «Apila sobre Re4 con las notas de Do mayor» (4.3): no dice el tipo; la guía
  //       y el nombre salen al completarlo. Al fallar: «nota sí, nota no» o «Fa♯ no está en Do mayor».
  //     `romano: 'vi'` + `tonalidad: 'C4'` (en lugar de raiz/tipo; `menor: true` para i ii° III…) = «Construye el vi de
  //       Do mayor» (4.3): no viene ninguna nota; se tocan las tres (cualquier octava). Suena la tónica de referencia.
  //     `inversion: 1 | 2` = la tecla marcada es el BAJO (la 3.ª o la 5.ª) y las otras dos van ENCIMA de ella (4.4); las
  //       casillas van de abajo arriba (3 · 5 · 1 o 5 · 1 · 3) con 3m / 3M / 4J entre ellas; con `cifrado`, pide «C/E».
  //     `voicing: 'abierto'` = «Abre Do mayor desde Do3» (4.5): encima de la fundamental, la 5.ª y la 3.ª UNA OCTAVA
  //       arriba (C3 · G3 · E4); solo vale la nota exacta (en otra octava es un fallo que lo explica); casillas
  //       1 · 5 · 3 con 5J / 6M (o 6m). Pon el piano en 2 octavas (`startOctave` = la de la fundamental).
  //     `tipo: 'dom7'` = con séptima (5.2): cuatro casillas 1 · 3 · 5 · 7 y guía 3M · 3m · 3m; se tocan la 3.ª, la 5.ª y
  //       la 7.ª. También `romano: 'V7'` + `tonalidad` («Construye el V7 de Fa mayor»: las cuatro, sin nota dada).
  //     `tipo: 'm7' | 'maj7'` (5.5) igual, con su guía (3m 3M 3m / 3M 3m 3M); y `romano: 'ii7' | 'Imaj7' | 'I7'…` + `tonalidad`
  //       («Construye el ii7 de Fa mayor» → Gm7). Con `romano`, no uses I7 / IV7 si la ronda dice «no está en Do mayor».
  // objetivo: { tipo: 'resolver', rondas: [{ raiz: 'G3', menor: false, mensaje }] }
  //   → «Resuelve la tensión» (P9, 5.2): el V7 de `raiz` va marcado en el teclado; arriba, la sensible y la 7.ª en oro
  //     (Si ↑, Fa ↓) y, debajo, con candado, adónde van. Se tocan las dos EN SU OCTAVA (la sensible sube medio tono; la
  //     7.ª baja medio tono, o un tono con `menor: true`). Con las dos suena V7 → I. El fallo explica: «Fa subió a Fa♯:
  //     la 7.ª baja», «Do, pero en otra octava». Dos fallos seguidos: las que faltan en rojo y la ronda va al repaso.
  //     Elige raíces cuyas dos metas caigan en una octava (G3, D4, C4, A3 menor): a 375 px se ve una (`ir` = la tónica).
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
  // `escuchar: { notas: [...], intervalo, duracion }` = botón «Escuchar el original» encima del roll: dictado de oído (5.7, el bajo)
  // Al fallar explica qué falta/sobra/dura distinto; tras 2 fallos avisa «Si vuelve a fallar, verás la solución» y el tercer «Comprobar» fallido la muestra.
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

### `generos` (rack que cambia de género, P1.2)

```js
{ tipo: 'generos', titulo: 'Cinco géneros, un kit', intro: '…', generos: ['pop', 'boomBap', 'trap', 'house', 'dembow'],
  minimo: 3, tituloBien: '¡Mismo kit, otro género!', mensaje: 'Cambian tres cosas: …' }
```

Los géneros viven en `theory/rack.js` → **`GENEROS`** (`{ id, nombre, bpm, rango, patron, huella, padre? }`): los troncos del
árbol de géneros (pop, boom bap, house, dembow) más el trap (`padre: 'boomBap'`). Ayudas: `sonidoGenero(id, { etiqueta })`
(el género a su tempo), `filasDeGeneros(ids)` (las filas que hacen falta), `cambiosPatron(antes, despues, filas)`
(los pasos que cambian; el rack los marca con `marcas: { 'kick:7': 'cambio' }`, contorno de oro que se apaga solo) y
`CUATRO` (bombo en los cuatro tiempos). Fila **`ohat`** (hat abierto, «O.Hat»; un `hat` cerrado lo corta) y
`FILAS_CAJA` (las 6 filas de la Caja de ritmos, que empieza con cualquier género a su tempo).

### `rack` (Channel rack, Producción)

```js
import { CORCHEAS, sinFila, sonidoRack } from '../../theory/rack.js'
{
  tipo: 'rack',
  titulo: 'Pon el backbeat',
  // filas: 'kick' (Kick, bombo), 'clap' (Clap, palmas), 'snare' (Snare, caja), 'hat' (Hat), 'tom' (Perc, percusión)
  rack: { filas: ['kick', 'clap'], bpm: 90, patron: { kick: [0, 8] }, fijas: ['kick'] },  // patron = lo que ya viene puesto
  objetivo: {
    tipo: 'copiar',              // 'capas' = oír cada fila sola (silenciando las demás) · 'libre' = `golpes: 6` encendidos
    instruccion: 'El bombo ya está. Pon las **palmas** en el **2** y en el **4**.',
    patron: { clap: [4, 12] },   // pasos 0–15 (0 = el 1; 4 = el 2; 8 = el 3; 12 = el 4); solo cuentan las filas no `fijas`
    guia: false,                 // true = contorno punteado de lo que va
    escuchar: false,             // true = dictado: botón «Escuchar el original» (el patrón entero, sin verlo)
    pista: '…',                  // sale con el 1.er error, junto a «Al bombo le faltan 2 golpes y le sobra 1.»
    explicacion: '…',
  },
}
```

**Pinceles: rolls y golpes suaves** (P1.3): con `rack: { …, pinceles: true }` sale encima de las filas el **pincel**
(Golpe · Suave · ×2 · ×3). En el patrón, lo que no es un golpe normal va aparte, en `tipo` (por fila, paso → `'s'`, `2` o
`3`): `{ hat: SEMICORCHEAS, tipo: { hat: { 1: 's', 14: 2, 15: 2 } } }`. Sirve igual en `rack.patron`, `objetivo.patron`
(la fila del objetivo reemplaza a la de `rack.patron` con sus rolls: `mezclar`), en `sonidoRack` y en `GENEROS`. Un roll
de N suena con N golpes repartidos en la casilla, creciendo; un suave, con menos velocity. El aviso del 1.er error
también habla de rolls y suaves («A los hats les falta un roll.»). En `libre`, `rolls: 1` y `suaves: 1` piden al menos
uno de cada (`cuantos(patron, 'roll' | 's')`).

Un patrón también sirve como **sonido** de cualquier paso: `sonidoRack(patron, { bpm, compases, etiqueta, mudas })` (un groove
de 16 casillas; `sinFila(patron, 'hat')` = el mismo sin una fila, para «¿Qué le falta?»). Ejemplos en `PATRONES` de
`theory/rack.js` (`boomBap`, `pop`) y `CORCHEAS` / `SEMICORCHEAS` para los hats.

## Crear un tipo de paso nuevo

1. Crea el componente en `src/components/exercises/`. Recibe
   `{ paso, leccionId, setAccion, siguiente, completar }`.
2. Usa `setAccion({ label, onClick, disabled, ayuda, feedback, avanza })` para controlar el
   botón grande de abajo (`feedback: { tipo: 'bien' | 'mal', titulo, texto }`).
   **Solo dos palabras**: `label` es «Comprobar» o «Continuar» (también en la última ronda y en el último paso; la
   tercera palabra del botón, «Atrás», solo sale con el gesto).
   **`avanza: true`** cuando ese botón pasa al paso siguiente (el paso ya está resuelto): así el gesto del botón
   deja avanzar sin modo administrador. Si no usa `setAccion`, se muestra «Continuar» (y el paso cuenta como resuelto).
3. Llama a `completar({ aciertos, total })` si el paso puntúa, y `siguiente()` para avanzar.
4. Regístralo en el objeto `PASOS` de `src/pages/Leccion.jsx`.
