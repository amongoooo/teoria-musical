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

## Parte 1 — Ritmo: ✅ TERMINADA

Todo en `main`: la base (memoria `tiendaRitmo`, `theory/ritmo.js`, `iniciarPista`/`golpeAhora`, `PiezasRitmo`,
`CabeceraEntrenador`, `PanelEntrenamiento`, arranque generalizado, ritmo en «Tu progreso») y la pantalla:
**`src/pages/Ritmo.jsx`** (panel + entrenador Seguir/Eco, tal como estaba pensado: pista por compases con `tipos[k]`,
reloj con `requestAnimationFrame`, evaluación al pasar el último `toca` + la gracia, pausa sin toques, repaso con la
bocina, barra espaciadora, retraso del dispositivo), la ruta `#/ritmo` y el bloque real en Inicio (`BloqueRacha`).
Detalle en la última entrada de `docs/HISTORIAL.md`. Prueba: `docs/pruebas/ritmo.mjs` (Playwright, 375 px, claro y
oscuro). Ideas que quedaron fuera (si el usuario las pide): modos «Leer» y «Pulso interno»; conservar la prueba de
las funciones puras como `src/theory/ritmo.test.mjs`.

## Parte 2 — Analizar letras: ✅ TERMINADA

Motor en `src/letras/` (`silabas.js`, `rima.js`, `analisis.js`; pruebas `node src/letras/letras.test.mjs`), pantalla
`pages/Letras.jsx` (`#/letras` cuaderno, `#/letras/ID` Escribir / Analizar + ficha de palabra), memoria
`progress/letras.js`, colores `rima-1…8`, ícono `Pluma` y bloque Letras en Inicio. Detalle en `docs/HISTORIAL.md`.
Quedó para después: buscar rimas en la lista de 50 000 palabras (va con vocabulario) y marcar en el texto las rimas
multisilábicas palabra por palabra (hoy solo se ve «multi N» en el verso).

## Parte 3 — Vocabulario: ✅ TERMINADA

Lista curada en `src/letras/vocabulario/` (4 temas × 30: noche, calle, amor y desamor, dinero; `ejercicios.js`,
`repaso.js` con cajas 1, 2, 4, 8, 16 días y 10 nuevas al día), memoria `progress/vocabulario.js` (`tiendaVocab`,
racha propia, repaso en «Tu progreso»), pantalla `pages/Vocabulario.jsx` (`#/letras/vocabulario` panel y
`/repaso`, `/significado`, `/sinonimos`, `/verso`), entrada desde el cuaderno, y diccionario de rimas
(`scripts/diccionario.mjs` → `src/letras/diccionario.js`, cargado con `import()` al entrar a Letras; crédito en
Opciones → Créditos). Pruebas: `node src/letras/vocabulario.test.mjs` y `docs/pruebas/vocabulario.mjs`.
**Para sumar temas** (tiempo, mar, fuego, cuerpo, camino, ciudad): un archivo de 30 palabras con la misma forma y
añadirlo a `TEMAS` en `vocabulario/index.js` (las pruebas exigen 30 por tema y que el verso lleve la palabra).

## Parte 4 — Flow: ✅ TERMINADA

Tercera pestaña «Flow» de cada letra (`components/Flow.jsx` + motor `src/letras/flow.js`, pruebas
`node src/letras/flow.test.mjs` y `docs/pruebas/flow.mjs`): elegir verso, tempo 75/90/105, rejilla de 16 casillas
(32 si no caben), grabar tocando el pad sobre el beat (una sílaba por toque), Repartir (tónicas en el pulso), mover
sílabas, Escuchar, «acentos en el pulso» y guardado en la letra (`flows`). Ideas para después (si el usuario las pide):
varios beats (trap a medio tiempo, boom bap), voz que diga las sílabas (síntesis), flow de una estrofa entera
seguida, y conectar con el entrenamiento de ritmo (evaluar si repites tu flow a tiempo).

**Plan «Ritmo y Letras» completo.**

## Resumen técnico (como se pensó)

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

Al escribir `golpeAhora` se vio que `noteOn`/`noteOff` usaban `Tone.now()` (suma 0,1 s de margen): las teclas del
piano sonaban ~100 ms tarde. **Ya está arreglado en `main`** (PR #47, `Tone.immediate()`); le quedan unas pruebas
pendientes, anotadas en `CLAUDE.md` («También pendiente») y en su entrada de `docs/HISTORIAL.md`.
