// Prueba los TRAMOS de las rutas (content/rutas.js → TRAMOS) a 375 px en claro y oscuro y a 1280 px:
//  - #/ruta/acordes: 18 paradas en 4 tramos; un letrero por tramo («Tramo N», nombre, «x/y» y mini barra) y la
//    barra de puntitos agrupada (4 huecos: `data-inicio-tramo`).
//  - Con el módulo 1 hecho, el tramo 1 sale 3/3 con ✓ y la isla actual es la 3.1 (lo del curso cuenta solo).
//  - Al abrir una isla, los letreros se desvanecen; al cerrarla vuelven.
//  - La ruta de ritmo (un solo tramo) no lleva letreros ni huecos.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/tramos.mjs [carpeta-de-capturas]
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
const hecha = { paso: 0, completada: true, aciertos: 5, total: 5 }

for (const [tema, ancho] of [['claro', 375], ['oscuro', 375], ['claro', 1280]]) {
  const nombre = `${tema}-${ancho}`
  const r = (resultados[nombre] = {})
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: ancho, height: ancho > 600 ? 820 : 740 }, deviceScaleFactor: 1, hasTouch: ancho < 600 })
  const foto = (n, completa = false) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${nombre}.png`, fullPage: completa })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const preparar = async (lecciones = {}) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, lecciones]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones, retos: {} }))
      },
      [tema, lecciones],
    )
  }
  const visibles = () =>
    page.$$eval('[data-letrero]', (els) => els.filter((e) => getComputedStyle(e).visibility === 'visible' && Number(e.style.opacity) > 0.9).length)

  // Ruta de acordes sin nada hecho.
  await preparar()
  await page.goto(BASE + '#/ruta/acordes')
  await page.reload()
  await espera(2500)
  comprobar(r, 'acordes: 4 letreros', (await page.locator('[data-letrero]').count()) === 4)
  comprobar(r, 'acordes: los 4 a la vista (camino cerrado)', (await visibles()) === 4, String(await visibles()))
  comprobar(r, 'puntitos: insignia + 18', (await page.locator('[data-punto]').count()) === 19)
  comprobar(r, 'puntitos: 4 grupos', (await page.locator('[data-inicio-tramo]').count()) === 4)
  const l1 = await page.locator('[data-letrero="notas-teclado"]').textContent()
  comprobar(r, 'tramo 1: «Tramo 1 · 0/3 · Notas y teclado»', /Tramo 1/.test(l1) && /0\/3/.test(l1) && /Notas y teclado/.test(l1), l1)
  // Que el letrero no se encime con las islas ni con los títulos (en el celular: entre la isla de antes y la suya).
  if (ancho < 600) {
    const choques = await page.evaluate(() => {
      const cajas = (sel) => [...document.querySelectorAll(sel)].map((e) => e.getBoundingClientRect())
      const letreros = [...document.querySelectorAll('[data-letrero] > div')].map((e) => e.getBoundingClientRect())
      const islas = cajas('[data-nodo] [aria-expanded="false"]')
      const se = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
      return letreros.reduce((t, l) => t + islas.filter((i) => se(l, i)).length, 0)
    })
    comprobar(r, 'letreros sin encimarse con islas', choques === 0, String(choques))
  }
  await foto('acordes-vacia', true)

  // Con el módulo 1 hecho: el tramo 1 lleno, la actual es la 3.1.
  await preparar({ '1.1': hecha, '1.2': hecha, '1.3': hecha, '1.4': hecha })
  await page.goto(BASE + '#/ruta/acordes')
  await page.reload()
  await espera(2500)
  const t1 = await page.locator('[data-letrero="notas-teclado"]').textContent()
  comprobar(r, 'módulo 1 hecho → tramo 1 3/3', /3\/3/.test(t1), t1)
  const cab = await page.locator('[aria-label*="paradas"]').first().getAttribute('aria-label').catch(() => '')
  comprobar(r, 'cabecera: 3 de 18 paradas', /3 de 18/.test(cab ?? ''), cab)
  await foto('acordes-modulo1', true)

  // Abrir la isla de la 3.1 (parada 3 → puntito 4): los letreros se desvanecen.
  await page.locator('[data-punto="4"]').click()
  await espera(1500)
  comprobar(r, 'isla abierta: letreros ocultos', (await visibles()) === 0, String(await visibles()))
  const globo = await page.locator('[role=group][aria-label="Tono y semitono"]').count()
  comprobar(r, 'isla abierta: la 3.1', globo === 1)
  await foto('acordes-isla')
  await page.keyboard.press('Escape')
  await espera(1200)
  comprobar(r, 'al cerrar: letreros de vuelta', (await visibles()) === 4, String(await visibles()))

  // Ruta de ritmo: un solo tramo → sin letreros ni grupos.
  await page.goto(BASE + '#/ruta/ritmo')
  await espera(2000)
  comprobar(r, 'ritmo: sin letreros', (await page.locator('[data-letrero]').count()) === 0)
  comprobar(r, 'ritmo: sin grupos de puntitos', (await page.locator('[data-inicio-tramo]').count()) === 0)
  comprobar(r, 'ritmo: insignia + 10 puntitos', (await page.locator('[data-punto]').count()) === 11)

  comprobar(r, 'sin errores de JS', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} fallos` : 'Todo bien')
process.exit(fallos ? 1 : 0)
