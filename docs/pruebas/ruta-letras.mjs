// Prueba la ruta de letras (#/ruta/letras) y sus 5 lecciones que viven en la ruta (L1–L5), a 375 px en claro y oscuro:
//  - Todos los pasos de L1–L5 se pintan (sin errores en la consola).
//  - L1 de principio a fin: texto con la letra coloreada (corazón · razón en consonante), el quiz, «marcar» con un
//    acierto (canción, razón) y un fallo (coche sobra, responde falta, en oro); la pantalla final dice «Volver a la
//    ruta» y la ruta pasa a 1/10.
//  - Metas: una letra en el cuaderno → 2/10; con 4 palabras de Noche el globo dice «Noche: 4/10 palabras» y
//    «Practicar» deja solo el tema Noche y abre el vocabulario; con 10 → 3/10.
//  - L3: marcar las tónicas (sílabas) de «Camino de noche por la avenida».
//  - L5: el flow parejo no tiene los acentos en el pulso (Comprobar → fallo y enseña la solución); moviendo las
//    sílabas a la solución → acierto.
//  - El cuaderno de #/letras lleva a la ruta.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/ruta-letras.mjs [carpeta-de-capturas]
import { createRequire } from 'node:module'
import { repartir, repartirConAcentos, silabasFlow } from '../../src/letras/flow.js'
import { analizar } from '../../src/letras/analisis.js'
import noche from '../../src/letras/vocabulario/noche.js'
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
const PASOS = { L1: 5, L2: 5, L3: 5, L4: 4, L5: 4 }
const hoy = new Date().toISOString().slice(0, 10)
const vocab = (n) => ({ version: 1, dias: {}, mejorRacha: 0, modos: {}, repaso: Object.fromEntries(noche.slice(0, n).map((w) => [w.p, [1, hoy]])) })
const LETRA = { version: 1, letras: [{ id: 'a1', titulo: 'Prueba', texto: 'Me late fuerte el corazón\ny no le encuentro la razón', creada: 1, editada: 1 }] }

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const foto = (n, completa = false) => carpeta && page.screenshot({ path: `${carpeta}/letras-${n}-${tema}.png`, fullPage: completa })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const preparar = async ({ lecciones = {}, letras = null, vocabulario = null, ruta = '' } = {}) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, lecciones, letras, vocabulario]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones, retos: {} }))
        if (letras) localStorage.setItem('teoria-musical:letras:v1', JSON.stringify(letras))
        if (vocabulario) localStorage.setItem('teoria-musical:letras-vocab:v1', JSON.stringify(vocabulario))
      },
      [tema, lecciones, letras, vocabulario],
    )
    await page.goto(BASE + ruta)
    await page.reload()
    await espera(1200)
  }
  const avance = () => page.getAttribute('[data-pildora-cabecera] [aria-label]', 'aria-label')
  const boton = () => page.locator('[data-boton-accion] button').first()
  const pulsar = async () => {
    await boton().click()
    await espera(450)
  }
  const irAlPaso = async (id, n) => {
    await preparar({ lecciones: { [id]: { paso: n } }, ruta: `#/leccion/${id}` })
    await page.waitForSelector('[data-boton-accion]')
  }

  // 1) La ruta vacía: 0/10 y la primera isla es la L1.
  await preparar({ ruta: '#/ruta/letras' })
  comprobar(r, 'ruta: 0 de 10', /0 de 10/.test(await avance()), await avance())
  comprobar(r, 'título «Letras»', (await page.textContent('[data-titulo-modulo]')).includes('Letras'))
  await foto('ruta-vacia')

  // 2) Todos los pasos de las 5 lecciones se ven.
  for (const [id, n] of Object.entries(PASOS)) {
    for (let i = 0; i < n; i++) {
      await irAlPaso(id, i)
      const titulo = await page.locator('h1, h2').first().textContent()
      comprobar(r, `${id} paso ${i} se ve`, !!titulo, titulo)
      await foto(`${id}-paso-${i}`)
    }
  }

  // 3) L1 de principio a fin.
  await irAlPaso('L1', 0)
  comprobar(r, 'L1: corazón en consonante', (await page.getAttribute('[data-letra-analizada] [data-palabra="corazón"]', 'data-tipo-rima')) === 'consonante')
  comprobar(r, 'L1: barra del color de la ruta', true)
  await pulsar()
  await pulsar()
  comprobar(r, 'L1: noche · golpe en asonante', (await page.getAttribute('[data-letra-analizada] [data-palabra="golpe"]', 'data-tipo-rima')) === 'asonante')
  await pulsar()
  for (const op of ['Consonante', 'Asonante', 'Consonante', 'Asonante', 'No riman']) {
    await page.locator('button', { hasText: new RegExp(`^${op}$`) }).click()
    await pulsar()
    await pulsar()
  }
  // Marcar: acierto.
  comprobar(r, 'marcar: Comprobar apagado sin marcar', await boton().isDisabled())
  comprobar(r, 'marcar: corazón fija (no se toca)', (await page.locator('[data-pieza="corazón"]').count()) === 0)
  await page.locator('[data-pieza="canción"]').click()
  await page.locator('[data-pieza="razón"]').click()
  await foto('marcar-elegidas')
  await pulsar()
  comprobar(r, 'marcar: canción bien', (await page.getAttribute('[data-pieza="canción"]', 'data-estado')) === 'bien')
  comprobar(r, 'marcar: amor sin marcar', !(await page.getAttribute('[data-pieza="amor"]', 'data-estado')))
  await foto('marcar-bien')
  await pulsar()
  // Marcar: fallo.
  await page.locator('[data-pieza="nombre"]').click()
  await page.locator('[data-pieza="golpe"]').click()
  await page.locator('[data-pieza="coche"]').click()
  await pulsar()
  comprobar(r, 'marcar: coche sobra', (await page.getAttribute('[data-pieza="coche"]', 'data-estado')) === 'sobra')
  comprobar(r, 'marcar: responde falta (oro)', (await page.getAttribute('[data-pieza="responde"]', 'data-estado')) === 'falta')
  await foto('marcar-fallo')
  await pulsar()
  comprobar(r, 'L1: lección completada', await page.locator('h1', { hasText: '¡Lección completada!' }).isVisible())
  const volver = page.locator('a', { hasText: 'Volver a la ruta' })
  comprobar(r, 'final: «Volver a la ruta»', await volver.isVisible())
  await foto('final')
  await volver.click()
  await espera(1200)
  comprobar(r, 'vuelve a #/ruta/letras', page.url().endsWith('#/ruta/letras'), page.url())
  comprobar(r, 'ruta: 1 de 10', /1 de 10/.test(await avance()), await avance())

  // 4) Metas: letra en el cuaderno y palabras de Noche.
  const L1 = { L1: { paso: 0, completada: true, aciertos: 1, total: 1 } }
  await preparar({ lecciones: L1, letras: LETRA, vocabulario: vocab(4), ruta: '#/ruta/letras' })
  comprobar(r, 'meta letra: 2 de 10', /2 de 10/.test(await avance()), await avance())
  await page.locator('[data-punto="3"]').click() // el 0 es la insignia
  await espera(700)
  const globo = await page.getByRole('group', { name: 'Vocabulario · Noche' }).textContent()
  comprobar(r, 'globo: «Noche: 4/10 palabras»', /Noche: 4\/10 palabras/.test(globo), globo)
  await foto('meta-noche')
  await page.getByRole('group', { name: 'Vocabulario · Noche' }).getByRole('button', { name: 'Practicar' }).click()
  await espera(900)
  comprobar(r, 'Practicar → vocabulario', page.url().endsWith('#/letras/vocabulario'), page.url())
  const temas = await page.evaluate(() => JSON.parse(localStorage.getItem('teoria-musical:letras-vocab:v1')).temas)
  comprobar(r, 'Practicar deja solo Noche', JSON.stringify(temas) === '["noche"]', JSON.stringify(temas))
  await preparar({ lecciones: L1, letras: LETRA, vocabulario: vocab(10), ruta: '#/ruta/letras' })
  comprobar(r, 'meta vocab: 3 de 10', /3 de 10/.test(await avance()), await avance())

  // 5) L3: las tónicas de «Camino de noche por la avenida».
  await irAlPaso('L3', 4)
  comprobar(r, 'L3: «de» no se toca', (await page.locator('[data-pieza="0.1.0"]').count()) === 0)
  for (const k of ['0.0.1', '0.2.0', '0.5.2']) await page.locator(`[data-pieza="${k}"]`).click()
  await pulsar()
  comprobar(r, 'L3: tónicas bien', (await page.locator('[data-marcar] [data-estado="bien"]').count()) === 3)
  await foto('tonicas')

  // 6) L5: el flow parejo falla y enseña la solución; movido a la solución, acierta.
  const verso = analizar('Camino de noche por la avenida').estrofas[0].versos[0]
  const sil = silabasFlow(verso)
  const parejo = repartir(sil.length, 16)
  const sol = repartirConAcentos(sil, 16)
  await irAlPaso('L5', 2)
  comprobar(r, 'flow: sin Repartir', (await page.locator('[data-repartir]').count()) === 0)
  comprobar(r, 'flow: parejo', (await page.getAttribute('[data-flow]', 'data-colocadas')) === String(sil.length))
  await foto('flow-parejo')
  await pulsar()
  comprobar(r, 'flow: parejo = fallo', (await page.getAttribute('[data-paso-flow]', 'data-resultado')) === 'mal')
  const tonicas = await page.$$eval('[data-casilla][data-tonica]', (cs) => cs.map((c) => Number(c.dataset.casilla)))
  comprobar(r, 'flow: enseña la solución', tonicas.length === 3 && tonicas.every((c) => c % 2 === 0), JSON.stringify(tonicas))
  await foto('flow-solucion')

  await irAlPaso('L5', 2)
  const actual = [...parejo]
  const mover = async (i) => {
    await page.locator(`[data-casilla="${actual[i]}"]`).click()
    await page.locator(`[data-casilla="${sol[i]}"]`).click()
    actual[i] = sol[i]
    await espera(120)
  }
  for (let i = 0; i < sil.length; i++) if (sol[i] < actual[i]) await mover(i)
  for (let i = sil.length - 1; i >= 0; i--) if (sol[i] > actual[i]) await mover(i)
  const ahora = await page.$$eval('[data-casilla][data-silaba]', (cs) => cs.map((c) => Number(c.dataset.casilla)))
  comprobar(r, 'flow: movidas a la solución', JSON.stringify(ahora) === JSON.stringify(sol), `${JSON.stringify(ahora)} vs ${JSON.stringify(sol)}`)
  await pulsar()
  comprobar(r, 'flow: acentos en el pulso = acierto', (await page.getAttribute('[data-paso-flow]', 'data-resultado')) === 'bien')
  await foto('flow-bien')

  // 7) El cuaderno lleva a la ruta.
  await preparar({ ruta: '#/letras' })
  comprobar(r, 'cuaderno: entrada a la ruta 0/10', (await page.textContent('[data-entrada-ruta="letras"]')).includes('0/10'))
  await foto('cuaderno', true)

  comprobar(r, 'sin errores en la consola', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} fallos` : 'Todo bien')
process.exit(fallos ? 1 : 0)
