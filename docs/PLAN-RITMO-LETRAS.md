# Plan «Ritmo y Letras» — estado y cómo seguir

Dos entrenamientos nuevos que al final se conectan (flow = rimar sobre el beat). Plan aprobado por el usuario:
https://claude.ai/artifact/4E4w6oNu8rJ1qvtrdJkW63

**Orden:** 1) Ritmo → 2) Analizar letras → 3) Vocabulario → 4) Flow (si alcanza).
Al terminar CADA parte: Playwright a 375 px en claro y oscuro, capturas al usuario, `docs/HISTORIAL.md`, `CLAUDE.md`,
skill de diseño si cambió el estilo, commit, push, PR y merge a `main`.

## Lo que decidió el usuario

| Tema | Decisión |
|---|---|
| Modos de ritmo | **Seguir** y **Eco** (Leer y Pulso interno quedan fuera) |
| Cómo responde | **Un pad grande** (y la barra espaciadora en la computadora) |
| Precisión | La **rueda de Dificultad es el margen**: ±120, ±95, ±75, ±55 y ±40 ms. El tempo va con el nivel |
| Racha y minutos | **Cada entrenamiento la suya**, con su meta de 5 min |
| Idioma de las letras | **Solo español**, con seseo y yeísmo de México |
| Estilo | **Rap / trap** y **canción** (poesía clásica no) |
| Palabras | Lista **escrita por Claude** para aprender + las **50 000 más usadas** (FrequencyWords, CC BY-SA 4.0, crédito en Opciones) para buscar rimas. Se descarga de `https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt` (accesible desde el entorno) |
| Ejercicios de vocabulario | **¿Qué significa?**, **Sinónimos** y **Completa el verso** («¿Cuál rima?» no) |
| Tipo de palabras | **Por temas de letras**: noche, calle, amor y desamor, dinero, tiempo, mar, fuego, cuerpo, camino, ciudad |
| Letras pegadas | **Cuaderno en el dispositivo** (`teoria-musical:letras:v1`); no viaja en el código/QR |
| Sílabas por verso | **Como se dicen** (sinalefa) + interruptor «palabra por palabra» |

Decisiones de Claude que el usuario vio en el plan y no objetó: 10 niveles de ritmo; ronda buena = 4 de cada 5 golpes
dentro del margen y como mucho un toque de sobra; 8 rondas buenas para subir; Letras = tercer bloque de Entrenamientos
en rosa (Módulo 6) con ícono de pluma; colores de rima = familia nueva siempre con su letra (consonante = relleno,
asonante = subrayado punteado); primera entrega de vocabulario ≈ 120 palabras (4 temas × 30).

## Parte 1 — Ritmo: qué está HECHO (ya en `main`, sin pantalla todavía)

Todo esto está probado (compila; prueba de humo de oído y del pad de la lección 2.1 a 375 px en claro y oscuro) y
**no cambia nada de lo que ve el usuario**: el bloque Ritmo de Inicio sigue en «Pronto».

- `src/progress/entrenamiento.js` — `crearEntrenamiento(clave)`: la memoria de un entrenamiento (racha, días, niveles
  por modo, `registrarRespuesta`…). `progress/oido.js` es ahora una envoltura (`tiendaOido` + los mismos nombres de
  siempre) y `progress/ritmo.js` crea `tiendaRitmo` (`teoria-musical:ritmo:v1`) y lleva el **retraso del dispositivo**
  (`compensacionActual()`, `apuntarError(bruto, margen)`: en memoria, se ajusta cuando 6 toques caen juntos).
- `src/theory/ritmo.js` — los 10 niveles (`NIVELES`: negras, silencios, corcheas, mezcla, contratiempo, síncopa,
  semicorcheas, síncopa de semicorchea, swing, todo), patrones al azar, `MARGENES`/`margenDe`, `eventosCompas(tipo,
  ronda)` (entrada | demo | toca | cierre), `objetivosDe`, `margenEfectivo`, **`evaluar(objetivos, toques, { margen,
  compensacion, paso })`** y `explicar(ev)` (título y texto del resultado), y los modos `modoSeguir` / `modoEco`
  (`MODOS_RITMO`, `getModoRitmo`) con la forma que espera el arranque (`puntosNivel`, `puntosDificultad`,
  `claveDificultad: 'dificultad'`, `bloques` = pad con sonido o mudo).
- `src/audio/bateria.js` — sonido `tom` (programado) y `toque` (el mismo, en otra voz, para el pad en vivo).
- `src/audio/engine.js` — **`iniciarPista(porCompas, { bpm, tiempos })`** (pregunta los sonidos de cada compás poco
  antes de que empiece y programa cada sonido 0,25 s antes: `parar()` corta casi al instante) y **`golpeAhora(nombre)`**
  (sin los 100 ms de margen de `Tone.now()`).
- `src/components/PiezasRitmo.jsx` — sacado de `exercises/Pulso.jsx` (que ahora lo importa): `Pad` (acepta `children`,
  `atenuado`, `ref`), `Contador` (nuevo: `estados[i]` = bien | casi | falta | sobra, y `colorCabezal`), `Medidor`
  (nuevo: `tolerancia`, `vacio`), `useRitmo`, `useLatido`, `momentoToque`, `mediana`, `DIVISION`, `TOLERANCIA`.
- `src/components/CabeceraEntrenador.jsx` — la cabecera de vidrio del entrenador (‹, barra de aciertos + vidas, bocina,
  golpe rojo), sacada de `pages/Oido.jsx`. Props: `volver`, `etiquetaVolver`, `golpes`, `barra`, `vidas`, `bocina`.
- `src/components/PanelEntrenamiento.jsx` — el panel del día (racha, 5 min, semana, ejercicios, estadísticas), sacado
  de `pages/Oido.jsx`. Props: `titulo`, `descripcion`, `sugerencia`, `nombre`, `tienda`, `modos`, `ruta`, `Icono`.
- `src/components/ArranqueOido.jsx` — ahora sirve a cualquier entrenamiento: props `tienda` (por defecto la de oído) e
  `Icono`; `modo.claveDificultad`, `modo.puntosDificultad`, `puntos.desdeArriba` y `modo.bloques` (con dibujitos en
  `DIBUJOS_BLOQUE`). `AJUSTES_ABSOLUTO.dificultad` en `theory/oido.js`.
- `src/progress/sincronizar.js` — el código de «Tu progreso» lleva también `r` (ritmo); los códigos viejos se leen
  igual. `Importar.jsx` muestra «Días de práctica de ritmo».

Prueba de las funciones puras (crear el archivo y correrlo con `node`): genera 300 rondas por nivel y comprueba
`evaluar` con toques clavados, con retraso compensado, tarde, de sobra y sin tocar. Estaba en el scratchpad de la
sesión (no en el repo); conviene rehacerla como `src/theory/ritmo.test.mjs` si se quiere conservar.

## Parte 1 — Ritmo: qué FALTA (siguiente paso exacto)

1. **`src/pages/Ritmo.jsx`** (no existe): `Ritmo({ modo })` → sin modo, `<PanelEntrenamiento titulo="Entrenamiento de
   ritmo" tienda={tiendaRitmo} modos={MODOS_RITMO} ruta={rutas.ritmo} Icono={Metronomo} nombre="ritmo" …/>`; con modo,
   el `Entrenador` (calcar la estructura de `pages/Oido.jsx`: `CabeceraEntrenador`, `ArranqueOido` con
   `tienda={tiendaRitmo}` e `Icono={Metronomo}`, `BarraAccion`, vidas igual que el oído «Normal», al abrir el nivel es
   el más alto alcanzado).
2. **Ruta**: `router.js` (`#/ritmo`, `#/ritmo/seguir`, `#/ritmo/eco`, `rutas.ritmo`), `App.jsx` (`Pagina`) y
   `profundidad()` en `ui/movimiento.js` (igual que `oido`).
3. **Inicio**: cambiar `BloqueProximo nombre="Ritmo"` por un bloque real como `BloqueOido` (racha + barra de 5 min,
   acento `var(--color-modulo-2)`, `tiendaRitmo`); lo más limpio es generalizar `BloqueOido` a un `BloqueRacha`.
4. Probar, capturas, docs (añadir a la skill de diseño el entrenador de ritmo y los estados del `Contador`), PR y merge.

### Diseño ya pensado del Entrenador de ritmo

**Una ronda es una pista de compases** (4 tiempos) hecha con `iniciarPista`; cada compás tiene un tipo:

- **Seguir**: `entrada` (un compás de clic) → `toca` × 2 (suena el fondo; se tocan los golpes con aro) → `cierre`
  (el 1 del fondo, para acabar). Con la bocina: `entrada` → `demo` → `toca` × 2 → `cierre`.
- **Eco**: `entrada` → (`demo` → `toca`) en bucle hasta que en un `toca` haya algún toque; entonces `cierre`. Tras 6
  ciclos sin tocar, se para y queda en pausa (botón «Continuar» que la reinicia). Así «escuchar otra vez» es no tocar.
- **Repaso** (bocina ya evaluada): `entrada` → `demo` → `cierre`, sin evaluar.
- El tipo de cada compás se decide cuando la pista lo pide (≈ 0,25 s antes): guardar `tipos[k]` en un ref.

**Reloj y toques**: posición = `tiempoAudio() − latenciaAudio() − pista.inicio`; compás `k = floor(rel / pista.compas)`,
casilla = `floor(resto / (pulso / porTiempo))`. Un bucle `requestAnimationFrame` actualiza fase y cabezal. El toque
(pad `onPointerDown` o barra espaciadora sin repetición) vale `momentoToque(e) − latenciaAudio() − pista.inicio`; suena
con `golpeAhora('toque')` si `ajustes.pad !== 'mudo'`. Solo cuentan los toques de los compases `toca` (aceptando media
casilla antes de que empiecen). Con cada toque emparejado, `apuntarError(bruto, margen)`; si la compensación cambia,
se vuelve a pintar todo con ella (guardar los tiempos brutos y derivar los estados con `evaluar` al pintar).

**Evaluar**: al empezar el compás siguiente al último `toca` + una gracia de `min(margen, media casilla)`. Sin ningún
toque: Seguir → pausa (no castiga); Eco → sigue el bucle. Con toques: `evaluar(...)` →
`tiendaRitmo.registrarRespuesta(modo.id, { item: ronda.item, bien: ev.buena, niveles: modo.niveles, carga: { acierto:
1, fallo: 1, partes: PARTES_NIVEL } })` → vidas (fallo −1; subir a un nivel nuevo +1) → feedback con `explicar(ev)`.
Al ocultarse la pestaña (`visibilitychange`), parar y dejar en pausa.

**Pantalla jugando** (de arriba abajo, todo debe caber sobre la barra a 375 × 740): fila «Ritmo · Seguir» con
`Metronomo` + «Nivel N» (`font-juego`); `h1` con `modo.pregunta` + «80 BPM» (`font-dato`); `Contador` (division =
`ronda.porTiempo`, `patron` = casillas / porTiempo; en Eco el patrón se oculta hasta evaluar, salvo en modo
administrador; cabezal celeste en `demo`, del acento en `toca`); en Seguir, `Medidor` con `tolerancia` = margen
efectivo y `vacio=""`; historial de puntitos (Seguir: una fila por pasada, verde / oro / contorno de oro si faltó; Eco
mientras se toca: un puntito neutro por toque); `Pad` (en `entrada` muestra la cuenta 1-2-3-4 en grande; en `demo` va
`atenuado` con la `Oreja`; en `toca` dice «Toca»; late en cada tiempo). Al evaluar, el `Contador` muestra lo peor de
las dos pasadas por casilla y los toques de sobra como `sobra`.

**Barra de abajo**: «Empezar» (flotante) → «Continuar» desactivado con ayuda corta por fase («Entra después de la
cuenta», «Escucha el patrón», «Tu turno: repítelo», «Toca los golpes con aro») → feedback verde u oro + «Continuar».
El gesto del botón solo pasa a la siguiente ronda ya evaluada. Barra de vidrio de arriba: `datos.carga /
PARTES_NIVEL`, del color de la dificultad (`var(--color-dificultad-N)`).

## Partes 2 a 4 — sin empezar

Ver el plan (artifact). Resumen técnico:

- **Letras** (`#/letras`): motor en `src/letras/` (silabeo, vocal tónica, rima por sonido con seseo/yeísmo/b=v/h muda,
  asonancia, sinalefa, esquema por estrofa, rimas internas y multis para rap) con pruebas en `node`; pantalla con la
  letra coloreada, esquema, sílabas por verso, tocar una palabra (sílabas, acento, rimas) y cuaderno en localStorage.
  Colores `rima-1…8` nuevos en `src/index.css` (de los colores de módulo), ícono `Pluma`, bloque rosa en Inicio.
- **Vocabulario** (`#/letras/vocabulario`): lista curada en `src/letras/vocabulario/` (palabra, definición, verso de
  ejemplo, sinónimos, tema), tres ejercicios, repaso espaciado (1, 2, 4, 8, 16 días) y racha propia con
  `crearEntrenamiento('teoria-musical:letras-vocab:v1')`. La lista de 50 000 palabras se limpia (nombres propios,
  groserías sueltas), se guarda como archivo aparte y se carga con `import()` solo al entrar a Letras.
- **Flow**: un verso del cuaderno sobre las 16 casillas del compás; colocar las sílabas tocando el pad o repartirlas
  solas y moverlas; usa `iniciarPista`, `Pad` y el motor de sílabas.

## Aparte (no es de este plan)

`noteOn`/`noteOff` de `src/audio/engine.js` usan `Tone.now()`, que suma 0,1 s de margen (`lookAhead`): las teclas del
piano suenan ~100 ms tarde. Se arregla con `Tone.immediate()`; quedó propuesto como tarea aparte.
