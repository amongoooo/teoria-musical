// Prueba la lección 5.2 «Tensión y resolución» a 375 px en claro y oscuro:
//  - los 13 pasos se ven, sin errores en la consola;
//  - P8 con séptima (paso 4): «Construye G7 desde Sol3», cuatro casillas 1 · 3 · 5 · 7 con la guía 3M · 3m · 3m;
//    Si, Re y Fa (en cualquier octava) → «¡G7!»; el V7 de Fa mayor sin nota dada → «¡V7 = C7!»;
//  - P9 «Resuelve la tensión» (paso 7): G7 → C con un error (Si → La: «bajó») y luego Do y Mi; D7 → G; en C7 → F dos
//    fallos = las dos casillas en rojo; A7 → Dm (Do♯ → Re, Sol → Fa);
//  - R2 (paso 8): C dibujado tras G7 sin la 5.ª → «Perfecto»;
//  - node: banco de la prueba rápida (3 preguntas), catálogo y el tramo «Funciones y cadencias» con la 5.2 y la meta.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/tension.mjs [carpeta-de-capturas]
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

// ——— Datos (node) ———
{
  const r = (resultados.datos = {})
  const banco = (await import('../../src/content/pruebas/modulo-5.js')).default
  comprobar(r, 'prueba rápida: 3 preguntas de la 5.2', banco['5.2']?.length === 3)
  const { CATALOGO } = await import('../../src/content/catalogo.js').catch(() => ({}))
  if (CATALOGO) comprobar(r, 'catálogo: 5.2 ← 5.1, 4.4', JSON.stringify(CATALOGO['5.2']?.requiere) === '["5.1","4.4"]', JSON.stringify(CATALOGO['5.2']))
  const { TRAMOS } = await import('../../src/content/rutas.js')
  const paradas = TRAMOS.funciones.paradas.map((p) => p.id ?? `${p.modo}:${p.nivel}`).join(' ')
  comprobar(r, 'tramo: 5.1, Funciones 3, 5.2, Acordes 5', paradas.startsWith('5.1 funciones:3 5.2 acordes:5'), paradas)
  const { resolucionV7, acordeDeGrado } = await import('../../src/theory/acordes.js')
  const g7 = resolucionV7('G3')
  comprobar(r, 'teoría: G7 → C (Si → Do, Fa → Mi)', g7.sensible.hacia === 'C4' && g7.septima.hacia === 'E4')
  comprobar(r, 'teoría: V7 de Fa = C7', acordeDeGrado('F4', 'V7').cifrado === 'C7')
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${tema}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const irAlPaso = async (n) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, n]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones: { '5.2': { paso: n } }, retos: {} }))
      },
      [tema, n],
    )
    await page.goto(BASE + '#/leccion/5.2/guiada')
    await page.reload()
    await page.waitForSelector('[data-boton-accion]')
    await espera(700)
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const info = () => page.locator('[data-tarjeta-info]').textContent().catch(() => '')
  const octava = async (o) => {
    await page.locator(`[aria-label="Octava ${o}"]`).click()
    await espera(700)
  }
  const tocar = async (nota) => {
    const t = await page.locator(`[data-note="${nota}"]`).first().boundingBox()
    await page.touchscreen.tap(t.x + t.width / 2, t.y + t.height * 0.85)
    await espera(350)
  }

  // ——— Los 13 pasos ———
  for (let n = 0; n < 13; n++) {
    await irAlPaso(n)
    const titulo = await page.locator('h1, h2').first().textContent()
    comprobar(r, `paso ${n} se ve`, !!titulo, titulo)
    await foto(`5.2-paso-${String(n).padStart(2, '0')}`)
  }

  // ——— Paso 4: P8 con séptima ———
  await irAlPaso(4)
  comprobar(r, 'P8: «Construye G7 desde Sol3»', /Construye G7 desde Sol3/.test(await page.locator('[data-frase-acorde]').textContent()))
  comprobar(r, 'P8: 4 casillas', (await page.locator('[data-fila-acorde] li').count()) === 4)
  const partes = (await page.locator('[data-partes-acorde]').textContent()).replace(/\s/g, '')
  comprobar(r, 'P8: 1 · 3 · 5 · 7', partes === '1357', partes)
  const guia = (await page.locator('[data-guia-acorde]').textContent()).replace(/\s/g, '')
  comprobar(r, 'P8: guía 3M · 3m · 3m', guia === '3M3m3m', guia)
  for (const n of ['B3', 'D3', 'F3']) await tocar(n)
  comprobar(r, 'P8: ¡G7!', /¡G7!/.test(await info()), await info())
  await foto('5.2-p8-g7')
  await boton().click()
  await espera(700)
  await tocar('D4')
  await octava(4)
  for (const n of ['F#4', 'A4', 'C4']) await tocar(n)
  comprobar(r, 'P8: ¡D7!', /¡D7!/.test(await info()), await info())
  await boton().click()
  await espera(700)
  comprobar(r, 'P8: «Construye el V7 de Fa mayor»', /V7 de Fa mayor/.test(await page.locator('[data-frase-acorde]').textContent()))
  for (const n of ['C4', 'E4', 'G4', 'A#4']) await tocar(n)
  comprobar(r, 'P8: ¡V7 = C7!', /V7 = C7/.test(await info()), await info())

  // ——— Paso 7: Resuelve la tensión ———
  await irAlPaso(7)
  comprobar(r, 'P9: «G7 → C»', /G7 → C/.test(await page.locator('[data-frase-resolver]').textContent()))
  comprobar(r, 'P9: Si ↑ y Fa ↓ en oro', (await page.locator('[data-fila-resolver] [data-casilla="dada"]').allTextContents()).join('|') === 'Si ↑|Fa ↓')
  await octava(3)
  await tocar('A3')
  comprobar(r, 'P9: «Si bajó a La»', /bajó a la/i.test(await info()), await info())
  await octava(4)
  await tocar('C4')
  await tocar('E4')
  comprobar(r, 'P9: ¡G7 → C!', /¡G7 → C!/.test(await info()), await info())
  await foto('5.2-p9-g7')
  await boton().click()
  await espera(700)
  await tocar('G4')
  await tocar('B4')
  comprobar(r, 'P9: ¡D7 → G!', /¡D7 → G!/.test(await info()), await info())
  await boton().click()
  await espera(700)
  await tocar('B4') // Si♭ → Si: la 7.ª subió
  comprobar(r, 'P9: «subió»', /subió/.test(await info()), await info())
  await tocar('D4')
  comprobar(r, 'P9: dos fallos = dos en rojo', (await page.locator('[data-fila-resolver] [data-casilla="mal"]').count()) === 2)
  await foto('5.2-p9-rojo')
  await boton().click()
  await espera(700)
  await tocar('D4')
  await tocar('F4')
  comprobar(r, 'P9: ¡A7 → Dm!', /¡A7 → Dm!/.test(await info()), await info())

  // ——— Paso 8: escríbelo en el roll ———
  await irAlPaso(8)
  const rejilla = await page.locator('[data-rejilla]').boundingBox()
  const celda = async (col, fila) => {
    await page.mouse.click(rejilla.x + ((col + 0.5) / 2) * rejilla.width, rejilla.y + ((fila + 0.5) / 6) * rejilla.height)
    await espera(250)
  }
  for (const fila of [4, 2, 0]) await celda(1, fila) // Do4, Mi4, Sol4
  await boton().click()
  await espera(600)
  comprobar(r, 'roll: G7 → C', /Perfecto/.test(await info()), await info())
  await foto('5.2-roll')

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLAS` : 'TODO BIEN')
process.exit(fallos ? 1 : 0)
