// Prueba la lección 5.3 «Cadencias» a 375 px en claro y oscuro:
//  - los 14 pasos se ven, sin errores en la consola;
//  - P9 «Cierra con una auténtica» (paso 4): A7 → D, B♭7 → E♭ (con bemoles) y B7 → Em (en menor);
//  - R2 «Rompe la cadencia» (paso 8): de G7 → C a G7 → Am cambiando Sol por La → «Perfecto»;
//  - O8 con cuatro cajas (paso 10): rejilla 2 × 2 con la fórmula (V → I…), una ficha mal → oro y luego rojo en su
//    caja; ronda de Sol sin números; ronda de oído A B C D;
//  - node: teoría (CADENCIAS, cadenciaDe), banco de la prueba rápida, catálogo y tramo «Funciones y cadencias».
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/cadencias.mjs [carpeta-de-capturas]
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
  const { CADENCIAS, cadenciaDe } = await import('../../src/theory/acordes.js')
  comprobar(r, 'teoría: 4 cadencias', Object.keys(CADENCIAS).length === 4)
  const casos = [['V7', 'I', 'autentica'], ['V', 'I', 'autentica'], ['IV', 'I', 'plagal'], ['iv', 'I', 'plagal'], ['ii', 'V', 'semi'], ['I', 'V', 'semi'], ['V7', 'vi', 'rota'], ['I', 'IV', null]]
  comprobar(r, 'teoría: cadenciaDe', casos.every(([a, b, c]) => cadenciaDe(a, b) === c))
  const banco = (await import('../../src/content/pruebas/modulo-5.js')).default
  comprobar(r, 'prueba rápida: 3 preguntas de la 5.3', banco['5.3']?.length === 3)
  const { CATALOGO } = await import('../../src/content/catalogo.js').catch(() => ({}))
  if (CATALOGO) comprobar(r, 'catálogo: 5.3 ← 5.2', JSON.stringify(CATALOGO['5.3']?.requiere) === '["5.2"]', JSON.stringify(CATALOGO['5.3']))
  const { TRAMOS } = await import('../../src/content/rutas.js')
  const paradas = TRAMOS.funciones.paradas.map((p) => p.id ?? `${p.modo}:${p.nivel}`).join(' ')
  comprobar(r, 'tramo: … 5.2, Acordes 5, 5.3', paradas === '5.1 funciones:3 5.2 acordes:5 5.3', paradas)
  const leccion = (await import('../../src/content/modulo-05/leccion-5-3.js')).default
  const cajas = leccion.pasos[10].rondas.flatMap((r) => r.fichas.map((f) => f.caja))
  comprobar(r, 'clasificar: toda ficha tiene caja', cajas.every(Boolean), cajas.join(' '))
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
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones: { '5.3': { paso: n } }, retos: {} }))
      },
      [tema, n],
    )
    await page.goto(BASE + '#/leccion/5.3/guiada')
    await page.reload()
    await page.waitForSelector('[data-boton-accion]')
    await espera(700)
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const info = () => page.locator('[data-tarjeta-info]').textContent().catch(() => '')
  const tocar = async (nota) => {
    const t = await page.locator(`[data-note="${nota}"]`).first().boundingBox()
    await page.touchscreen.tap(t.x + t.width / 2, t.y + t.height * 0.85)
    await espera(350)
  }

  // ——— Los 14 pasos ———
  for (let n = 0; n < 14; n++) {
    await irAlPaso(n)
    const titulo = await page.locator('h1, h2').first().textContent()
    comprobar(r, `paso ${n} se ve`, !!titulo, titulo)
    await foto(`5.3-paso-${String(n).padStart(2, '0')}`)
  }

  // ——— Paso 4: Cierra con una auténtica ———
  await irAlPaso(4)
  comprobar(r, 'P9: «A7 → D»', /A7 → D/.test(await page.locator('[data-frase-resolver]').textContent()))
  await tocar('D4')
  await tocar('F#4')
  comprobar(r, 'P9: ¡A7 → D!', /¡A7 → D!/.test(await info()), await info())
  await boton().click()
  await espera(700)
  comprobar(r, 'P9: «B♭7 → E♭»', /B♭7 → E♭/.test(await page.locator('[data-frase-resolver]').textContent()), await page.locator('[data-frase-resolver]').textContent())
  await tocar('D#4')
  await tocar('G4')
  comprobar(r, 'P9: ¡B♭7 → E♭!', /¡B♭7 → E♭!/.test(await info()), await info())
  await foto('5.3-p9-bb7')
  await boton().click()
  await espera(700)
  await tocar('E4')
  await tocar('G4')
  comprobar(r, 'P9: ¡B7 → Em!', /¡B7 → Em!/.test(await info()), await info())

  // ——— Paso 8: Rompe la cadencia ———
  await irAlPaso(8)
  const rejilla = await page.locator('[data-rejilla]').boundingBox()
  const celda = async (col, fila) => {
    await page.mouse.click(rejilla.x + ((col + 0.5) / 2) * rejilla.width, rejilla.y + ((fila + 0.5) / 7) * rejilla.height)
    await espera(250)
  }
  await celda(1, 1) // borra Sol4
  await celda(1, 0) // dibuja La4
  await boton().click()
  await espera(600)
  comprobar(r, 'roll: G7 → Am', /Perfecto/.test(await info()), await info())
  await foto('5.3-roll')

  // ——— Paso 10: Ordena las cadencias ———
  await irAlPaso(10)
  const cajas = await page.locator('[data-caja]').evaluateAll((es) => es.map((e) => e.dataset.caja).join(' '))
  comprobar(r, 'clasificar: 4 cajas', cajas === 'autentica plagal semi rota', cajas)
  const formulas = (await page.locator('[data-caja]').allTextContents()).join('|')
  comprobar(r, 'clasificar: fórmulas', /V → I/.test(formulas) && /IV → I/.test(formulas) && /… → V/.test(formulas) && /V → vi/.test(formulas), formulas)
  const [a, b, c] = await Promise.all(['autentica', 'plagal', 'semi'].map((x) => page.locator(`[data-caja="${x}"]`).boundingBox()))
  comprobar(r, 'clasificar: rejilla 2 × 2', Math.abs(a.y - b.y) < 2 && c.y > a.y + a.height - 2 && a.x + a.width < b.x + 1, JSON.stringify([a, b, c]))
  const poner = async (ficha, caja) => {
    await page.locator(`[data-ficha="${ficha}"]`).first().tap()
    await espera(150)
    await page.locator(`[data-caja="${caja}"]`).tap()
    await espera(350)
  }
  const ronda1 = { 'G7 → C': 'autentica', 'G → C': 'autentica', 'F → C': 'plagal', 'Dm → G': 'semi', 'F → G': 'semi', 'G7 → Am': 'autentica' }
  for (const [f, k] of Object.entries(ronda1)) await poner(f, k)
  await foto('5.3-clasificar')
  await boton().click()
  await espera(600)
  let estados = await page.locator('[data-ficha]').evaluateAll((es) => Object.fromEntries(es.map((e) => [e.dataset.ficha, e.dataset.estado])))
  comprobar(r, 'clasificar: G7 → Am vuelve a la mano', estados['G7 → Am'] === 'mano', JSON.stringify(estados))
  comprobar(r, 'clasificar: «5 de 6 bien»', /5 de 6 bien/.test(await info()), await info())
  await poner('G7 → Am', 'semi')
  await boton().click()
  await espera(600)
  estados = await page.locator('[data-ficha]').evaluateAll((es) => Object.fromEntries(es.map((e) => [e.dataset.ficha, e.dataset.estado])))
  comprobar(r, 'clasificar: G7 → Am en rojo, en Rota', estados['G7 → Am'] === 'mal' && (await page.locator('[data-caja="rota"] [data-ficha="G7 → Am"]').count()) === 1, JSON.stringify(estados))
  await foto('5.3-clasificar-rojo')
  await boton().click()
  await espera(700)
  const ronda2 = { 'D7 → G': 'autentica', 'C → G': 'plagal', 'Am → D': 'semi', 'C → D': 'semi', 'D7 → Em': 'rota' }
  for (const [f, k] of Object.entries(ronda2)) await poner(f, k)
  await boton().click()
  await espera(600)
  comprobar(r, 'clasificar Sol: todas bien', /Todas en su lugar/.test(await info()), await info())
  await boton().click()
  await espera(700)
  const deOido = await page.locator('[data-ficha]').evaluateAll((es) => es.map((e) => e.dataset.ficha).join(''))
  comprobar(r, 'clasificar: ronda de oído A B C D', deOido === 'ABCD', deOido)
  await foto('5.3-clasificar-oido')

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLAS` : 'TODO BIEN')
process.exit(fallos ? 1 : 0)
