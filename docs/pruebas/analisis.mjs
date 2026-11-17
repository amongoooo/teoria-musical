// Prueba la lección 5.7 «Análisis de canciones» a 375 px en claro y oscuro:
//  - node: banco de la prueba rápida, catálogo (← 5.3, 5.5, 5.6), tramo «Progresiones» (5.7, Funciones 5, reto), bloque 5
//    del curso (etapa 3, 15 pasos) y el curso con 70 pasos;
//  - los 15 pasos se ven, sin errores en la consola ni scroll de lado;
//  - paso 1: la rejilla de «Let It Be» con 8 compases;
//  - paso 5: dictado del bajo con «Escuchar el original» → «Perfecto»;
//  - paso 8: «Analiza la rejilla»: la casa dada, el cursor salta, Escuchar enciende un compás, el 1.er error queda en oro
//    (tachado) y al arreglarlo «¡Análisis completo!»; en la 2.ª ronda, dos errores → el correcto en rojo.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/analisis.mjs [carpeta-de-capturas]
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
const PASOS = 15

// ——— Datos (node) ———
{
  const r = (resultados.datos = {})
  const banco = (await import('../../src/content/pruebas/modulo-5.js')).default
  comprobar(r, 'prueba rápida: 3 preguntas de la 5.7', banco['5.7']?.length === 3)
  const { CATALOGO } = await import('../../src/content/catalogo.js')
  const c = CATALOGO['5.7']
  comprobar(r, 'catálogo: 5.7 ← 5.3, 5.5, 5.6 (Armonía)', JSON.stringify(c?.requiere) === '["5.3","5.5","5.6"]' && c?.areas.join() === 'armonia', JSON.stringify(c))
  const { TRAMOS } = await import('../../src/content/rutas.js')
  const paradas = TRAMOS.progresiones.paradas.map((p) => p.id ?? `${p.modo}:${p.nivel}`).join(' ')
  comprobar(r, 'tramo «Progresiones»: termina con 5.7, Funciones 5 y el reto', paradas.endsWith('5.6 5.7 funciones:5 ruta-progresiones'), paradas)
  const { BLOQUES } = await import('../../src/content/curso.js')
  const b5 = BLOQUES.find((b) => b.numero === 5)
  comprobar(r, 'curso: bloque 5 en la etapa 3 con 15 pasos', b5?.etapa === 3 && b5.paradas.length === 15, String(b5?.paradas.length))
  const ids = b5.paradas.filter((p) => p.tipo === 'leccion').map((p) => p.id).join(' ')
  comprobar(r, 'bloque 5: 5.5, 5.6 y 5.7', ids === '5.5 5.6 5.7', ids)
  const total = BLOQUES.flatMap((b) => b.paradas).filter((p) => !p.opcional).length
  comprobar(r, 'curso: 70 pasos', total === 70, String(total))
  const metas = b5.paradas.filter((p) => p.clave).map((p) => `${p.clave}:${p.palabras ?? p.letras}`).join(' ')
  comprobar(r, 'metas de Letras con más cantidad', metas === 'vocab:20 vocab:20 letra:2', metas)
  const leccion = (await import('../../src/content/modulo-05/leccion-5-7.js')).default
  comprobar(r, `lección: ${PASOS} pasos, el último un reto`, leccion.pasos.length === PASOS && leccion.pasos.at(-1).tipo === 'reto')
  const rej = leccion.pasos[8].rondas.map((x) => x.compases.map((k) => k.cifrado).join('-')).join(' | ')
  comprobar(r, 'rondas de la rejilla', rej === 'C-Am-F-G | G-D-Em-C | C-G-Am-F-C-G-F-C | C-F-G-Am', rej)
  const { codigoPaso } = await import('../../src/content/actividad.js')
  comprobar(r, 'código O9 y L10', codigoPaso(leccion.pasos[8]) === 'O9' && codigoPaso(leccion.pasos[1]) === 'L10')
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: carpeta ? 2 : 1, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${tema}.png`, fullPage: true })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const irAlPaso = async (n) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, n]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones: { '5.7': { paso: n } }, retos: {} }))
      },
      [tema, n],
    )
    await page.goto(BASE + '#/leccion/5.7/guiada')
    await page.reload()
    await page.waitForSelector('[data-boton-accion]')
    await espera(700)
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const info = () => page.locator('[data-tarjeta-info]').textContent().catch(() => '')

  // ——— Los 15 pasos ———
  for (let n = 0; n < PASOS; n++) {
    await irAlPaso(n)
    const titulo = await page.locator('h1, h2').first().textContent()
    comprobar(r, `paso ${n} se ve`, !!titulo, titulo)
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
    comprobar(r, `paso ${n} sin scroll de lado`, ancho <= 376, String(ancho))
    await foto(`5.7-paso-${String(n).padStart(2, '0')}`)
  }

  // ——— Paso 1: Let It Be analizada ———
  await irAlPaso(1)
  comprobar(r, 'paso 1: 8 compases', (await page.locator('[data-rejilla-compases] [data-compas]').count()) === 8)

  // ——— Paso 5: dictado del bajo ———
  await irAlPaso(5)
  comprobar(r, 'dictado: botón «Escuchar el original»', (await page.getByRole('button', { name: /Escuchar el original/ }).count()) === 1)
  await page.locator('[data-rejilla]').evaluate((e) => e.scrollIntoView({ block: 'center' }))
  await espera(300)
  const g = await page.locator('[data-rejilla]').boundingBox()
  const celda = (col, fila) => [g.x + ((col + 0.5) / 8) * g.width, g.y + ((fila + 0.5) / 4) * g.height]
  // Filas: Do3, La2, Sol2, Fa2. El bajo: La (0), Fa (2), Do (4), Sol (6), dos casillas cada una.
  for (const [col, fila] of [[0, 1], [2, 3], [4, 0], [6, 2]]) {
    const [x, y] = celda(col, fila)
    const [x2] = celda(col + 1, fila)
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x2, y, { steps: 6 })
    await page.mouse.up()
    await espera(250)
  }
  await boton().click()
  await espera(600)
  comprobar(r, 'dictado: el bajo de Am – F – C – G', /Perfecto/.test(await info()), await info())

  // ——— Paso 8: Analiza la rejilla ———
  await irAlPaso(8)
  const rej = page.locator('[data-analizar]')
  const estado = (i) => rej.locator(`[data-compas="${i}"]`).getAttribute('data-estado')
  comprobar(r, 'la casa viene dada', (await estado(1)) === 'dado')
  comprobar(r, 'el cursor empieza en el compás 2', (await rej.locator('[data-elegido]').getAttribute('data-compas')) === '2')
  comprobar(r, 'Comprobar deshabilitado al empezar', await boton().isDisabled())
  await rej.getByRole('button', { name: /^Escuchar/ }).click()
  await espera(1300)
  comprobar(r, 'Escuchar enciende un compás', (await rej.locator('[data-suena]').count()) === 1)
  const opcion = (g) => page.locator(`[data-opcion="${g}"]`)
  await opcion('vi').click()
  comprobar(r, 'el cursor salta al 3', (await rej.locator('[data-elegido]').getAttribute('data-compas')) === '3')
  await opcion('IV').click()
  await opcion('I').click() // mal: es el V
  await foto('5.7-analizar-lleno')
  await boton().click()
  await espera(500)
  comprobar(r, '1.er error en oro, con lo tachado', (await estado(4)) === 'oro' && (await rej.locator('[data-tachado]').textContent()) === 'I')
  comprobar(r, 'los bien quedan fijos', (await estado(2)) === 'bien' && (await estado(3)) === 'bien')
  comprobar(r, 'aviso en oro con el bajo del compás que falló', /2 de 3 bien/.test(await info()) && /Compás 4: su bajo es Sol/.test(await info()), await info())
  await foto('5.7-analizar-oro')
  await opcion('V').click()
  await boton().click()
  await espera(500)
  comprobar(r, '¡Análisis completo!', /Análisis completo/.test(await info()), await info())
  await boton().click()
  await espera(600)
  // Ronda 2 (Sol: G – D – Em – C): dos veces mal en el compás 2.
  await opcion('IV').click()
  await opcion('vi').click()
  await opcion('IV').click()
  await boton().click()
  await espera(400)
  await opcion('ii').click()
  await boton().click()
  await espera(500)
  comprobar(r, '2.º error: el correcto en rojo', (await estado(2)) === 'mal' && /el V, D/.test(await rej.locator('[data-compas="2"]').getAttribute('aria-label')))
  comprobar(r, 'aviso rojo', /2 de 3 bien/.test(await info()), await info())
  await foto('5.7-analizar-rojo')
  await boton().click()
  await espera(600)
  comprobar(r, 'ronda 3: Let It Be con 8 compases', (await rej.locator('[data-compas]').count()) === 8)
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
  comprobar(r, 'ronda 3 sin scroll de lado', ancho <= 376, String(ancho))

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLAS` : 'TODO BIEN')
process.exit(fallos ? 1 : 0)
