// Prueba la lección 5.1 «Funciones: tónica, subdominante, dominante» y el modo Funciones del entrenador de oído, a
// 375 px en claro y oscuro:
//  - recorre los 11 pasos sin errores en la consola (modo administrador para pasar los que piden responder);
//  - L9 (paso 3): el mapa de funciones con T · S · D, 7 acordes, los jefes C, F, G con borde y 8 notas en común en oro;
//  - O8 «Ordena la familia» (paso 5): se elige un acorde y se toca su caja; tocar una ficha ya puesta con otra elegida
//    la manda a esa caja; Comprobar con B° en S → 6 bien y B° en oro dentro de D; la ronda 3 es de oído (A, B, C, D);
//  - R2 «Cambia una sola nota» (paso 7): Do4 → Re4 en el segundo acorde = C – Dm – G – C, bien a la primera;
//  - Practicar y el panel de Oído: Funciones con candado («Termina la 5.1») y, con la 5.1 hecha, abierto;
//  - el arranque de Funciones: la rueda se llama «Tonalidad» (las de octavas, «Octavas»), y una pregunta: T, S o D;
//  - la ruta de acordes: el tramo 5 «Funciones y cadencias» con la 5.1 y la meta «Funciones · nivel 3».
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/funciones.mjs [carpeta-de-capturas]
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')

const BASE = process.env.BASE || 'http://localhost:5199/teoria-musical/'
const carpeta = process.argv[2] || null
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
const resultados = {}
let fallos = 0
const comprobar = (r, nombre, ok, detalle = '') => {
  r[nombre] = ok ? 'ok' : `FALLA ${detalle}`
  if (!ok) fallos++
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${tema}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const preparar = async ({ lecciones = {}, admin = false } = {}) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, lecciones, admin]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema, admin }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones, retos: {} }))
      },
      [tema, lecciones, admin],
    )
  }
  const irAlPaso = async (n, opciones = {}) => {
    await preparar({ lecciones: { '5.1': { paso: n } }, ...opciones })
    await page.goto(BASE + '#/leccion/5.1/guiada')
    await page.reload()
    await page.waitForSelector('[data-boton-accion]')
    await espera(800)
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const info = () => page.locator('[data-tarjeta-info]').textContent().catch(() => '')

  // ——— Todos los pasos (administrador: el botón pasa sin responder) ———
  await irAlPaso(0, { admin: true })
  let pasos = 0
  for (let i = 0; i < 11; i++) {
    const titulo = await page.locator('h1').first().textContent()
    if (titulo) pasos++
    if (i < 10) {
      // Pasar con el gesto del botón: mantener el borde derecho 0,5 s.
      const caja = await page.locator('[data-boton-accion]').boundingBox()
      await page.mouse.move(caja.x + caja.width - 20, caja.y + caja.height / 2)
      await page.mouse.down()
      await espera(750)
      await page.mouse.up()
      await espera(700)
    }
  }
  comprobar(r, '11 pasos', pasos === 11, String(pasos))

  // ——— Paso 3: el mapa de funciones ———
  await irAlPaso(3)
  const funciones = await page.locator('[data-funcion]').evaluateAll((es) => es.map((e) => e.dataset.funcion).join(''))
  comprobar(r, 'mapa: T · S · D', funciones === 'TSD', funciones)
  comprobar(r, 'mapa: 7 acordes', (await page.locator('[data-mapa-funciones] [data-acorde]').count()) === 7)
  const jefes = await page.locator('[data-jefe]').evaluateAll((es) => es.map((e) => e.dataset.acorde).join(','))
  comprobar(r, 'mapa: jefes C, F, G', jefes === 'C,F,G', jefes)
  comprobar(r, 'mapa: 8 notas en común', (await page.locator('[data-comun]').count()) === 8)
  await page.locator('[data-acorde="Am"]').click()
  await espera(200)
  comprobar(r, 'mapa: Am suena', (await page.locator('[data-acorde="Am"][data-suena]').count()) === 1)
  await foto('mapa')

  // ——— Paso 5: Ordena la familia ———
  await irAlPaso(5)
  const poner = async (ficha, caja) => {
    await page.locator(`[data-ficha="${ficha}"]`).first().tap()
    await espera(150)
    await page.locator(`[data-caja="${caja}"]`).tap()
    await espera(350)
  }
  for (const [f, c] of [['C', 'T'], ['Am', 'T'], ['Em', 'T'], ['F', 'S'], ['Dm', 'S'], ['G', 'D'], ['B°', 'S']]) await poner(f, c)
  comprobar(r, 'clasificar: mano vacía', (await page.locator('[data-ficha][data-estado="mano"]').count()) === 0)
  await foto('clasificar')
  await boton().click()
  await espera(700)
  const estados = await page.locator('[data-ficha]').evaluateAll((es) => Object.fromEntries(es.map((e) => [e.dataset.ficha, e.dataset.estado])))
  comprobar(r, 'clasificar: 6 bien', Object.values(estados).filter((e) => e === 'bien').length === 6, JSON.stringify(estados))
  comprobar(r, 'clasificar: B° en oro, en D', estados['B°'] === 'mal' && (await page.locator('[data-caja="D"] [data-ficha="B°"]').count()) === 1)
  comprobar(r, 'clasificar: «6 de 7 bien»', /6 de 7 bien/.test(await info()))
  await foto('clasificar-comprobado')
  await boton().click()
  await espera(700)
  // Ronda 2 (Sol): se ponen todas bien.
  for (const [f, c] of [['G', 'T'], ['Em', 'T'], ['Bm', 'T'], ['C', 'S'], ['Am', 'S'], ['D', 'D'], ['F♯°', 'D']]) await poner(f, c)
  await boton().click()
  await espera(700)
  comprobar(r, 'clasificar Sol: todas bien', /Todas en su lugar/.test(await info()))
  await boton().click()
  await espera(700)
  const deOido = await page.locator('[data-ficha]').evaluateAll((es) => es.map((e) => e.dataset.ficha).join(''))
  comprobar(r, 'clasificar: ronda de oído A B C D', deOido === 'ABCD', deOido)

  // ——— Paso 7: cambia una sola nota ———
  await irAlPaso(7)
  const rejilla = await page.locator('[data-rejilla]').boundingBox()
  const celda = async (col, fila) => {
    await page.mouse.click(rejilla.x + ((col + 0.5) / 4) * rejilla.width, rejilla.y + ((fila + 0.5) / 7) * rejilla.height)
    await espera(250)
  }
  await celda(1, 5) // borra Do4 del segundo acorde
  await celda(1, 4) // pone Re4
  await boton().click()
  await espera(600)
  comprobar(r, 'roll: C – Dm – G – C', /Perfecto/.test(await info()), await info())
  await foto('roll')

  // ——— Funciones en Practicar y en el panel de Oído ———
  await preparar()
  await page.goto(BASE + '#/practicar')
  await page.reload()
  await espera(900)
  comprobar(r, 'practicar: Funciones con candado', (await page.locator('[data-modo-practica="funciones"][data-bloqueado]').count()) === 1)
  await page.goto(BASE + '#/oido')
  await espera(900)
  const bloqueada = page.locator('[data-ejercicio="funciones"][data-bloqueado]')
  comprobar(r, 'oído: Funciones con candado', (await bloqueada.count()) === 1 && /Termina la 5\.1/.test(await bloqueada.textContent()))
  await preparar({ lecciones: { '5.1': { completada: true } } })
  await page.goto(BASE + '#/oido')
  await page.reload()
  await espera(900)
  comprobar(r, 'oído: Funciones abierto con la 5.1', (await page.locator('[data-ejercicio="funciones"]:not([data-bloqueado])').count()) === 1)

  // ——— El arranque y una pregunta ———
  await page.goto(BASE + '#/oido/funciones')
  await espera(1000)
  await page.locator('text=Configurar').first().click()
  await espera(600)
  comprobar(r, 'arranque: rueda «Tonalidad»', (await page.locator('#dificultad').textContent()) === 'Tonalidad')
  await foto('arranque')
  await boton().click()
  await espera(2600)
  const opciones = await page.locator('main button:has-text(" · ")').allTextContents()
  comprobar(r, 'nivel 1: T o D', opciones.join('|') === 'Tónica · T|Dominante · D', opciones.join('|'))
  await page.locator('main button:has-text("Dominante")').click()
  await espera(800)
  comprobar(r, 'pregunta: explica el grado', /es el .+ de Do mayor/.test(await info()), await info())
  await foto('pregunta')
  await page.goto(BASE + '#/oido/intervalos')
  await espera(1000)
  await page.locator('text=Configurar').first().click()
  await espera(600)
  comprobar(r, 'intervalos: rueda «Octavas»', (await page.locator('#dificultad').textContent()) === 'Octavas')

  // ——— La ruta de acordes ———
  await page.goto(BASE + '#/ruta/acordes')
  await espera(1200)
  const letreros = await page.locator('[data-letrero]').allTextContents().catch(() => [])
  comprobar(r, 'ruta: tramo «Funciones y cadencias»', letreros.some((t) => /Funciones y cadencias/.test(t)), letreros.join(' | '))

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLAS` : 'TODO BIEN')
process.exit(fallos ? 1 : 0)
