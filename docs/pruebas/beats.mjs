// Prueba el área Producción (propuesta aprobada: https://claude.ai/artifact/EqP6ik7JikQGsfGUnek2uT) a 375 px en claro y oscuro:
//  - node: módulos de Producción (P1 = 12, P2 = 13, P3 = 14, P4 = 10), códigos P1.1 y P4.1, catálogo de la 12.1, banco de la
//    prueba rápida, ruta de Beats (4 tramos, 22 paradas, al final del bucle), la Caja de ritmos se abre con la 12.1, código S1;
//  - los 12 pasos de la P1.1 se ven, sin errores ni scroll de lado;
//  - paso 1 (capas): Reproducir, silenciar con las luces hasta oír cada sonido solo → «Continuar»;
//  - paso 4 (backbeat): un error → oro con el paso de más tachado; arreglado → «¡Así suena!»;
//  - paso 5 (hats): arrastrar el dedo pinta la fila; dos errores → «Así queda.» con la solución;
//  - paso 7 (dictado): «Escuchar el original» y el bombo de oído → «¡Así suena!»;
//  - Herramientas: la Caja de ritmos con candado y, con la P1.1 hecha, abierta; en #/caja el tempo se guarda;
//  - Aprender › Rutas: Beats y, punteadas, Sound design y Mezcla y máster; #/ruta/beats con la 12.2 «Próximamente».
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/beats.mjs [carpeta-de-capturas]
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
const PASOS = 12

// ——— Datos (node) ———
{
  const r = (resultados.datos = {})
  const { MODULOS_POR_AREA, codigoLeccion, nombreModulo, getModulo } = await import('../../src/content/index.js')
  const prod = MODULOS_POR_AREA.filter((m) => m.area === 'produccion').map((m) => `${nombreModulo(m)}=${m.numero}`).join(' ')
  comprobar(r, 'Producción 1–4 = módulos 12, 13, 14 y 10', prod === 'Producción 1=12 Producción 2=13 Producción 3=14 Producción 4=10', prod)
  comprobar(r, 'códigos P1.1 y P4.1', codigoLeccion('12.1') === 'P1.1' && codigoLeccion('10.1') === 'P4.1', `${codigoLeccion('12.1')} ${codigoLeccion('10.1')}`)
  comprobar(r, 'Producción 1 con 5 lecciones', getModulo(12)?.lecciones.length === 5)
  const { CATALOGO } = await import('../../src/content/catalogo.js')
  const c = CATALOGO['12.1']
  comprobar(r, 'catálogo: 12.1 ← 2.2 (Producción, Ritmo)', c?.areas.join() === 'produccion,ritmo' && c.requiere.join() === '2.2', JSON.stringify(c))
  const banco = (await import('../../src/content/pruebas/modulo-12.js')).default
  comprobar(r, 'prueba rápida: 3 preguntas de la 12.1', banco['12.1']?.length === 3)
  const { RUTAS, ORDEN_RUTAS, RUTAS_PROXIMAS, HERRAMIENTAS } = await import('../../src/content/rutas.js')
  const beats = RUTAS.beats
  comprobar(r, 'ruta de Beats: 4 tramos y 22 paradas', beats.tramos.length === 4 && beats.paradas.length === 22, `${beats.tramos.length} ${beats.paradas.length}`)
  comprobar(r, 'Beats al final del bucle de rutas', ORDEN_RUTAS.at(-1) === 'beats')
  comprobar(r, 'Sound design y Mezcla y máster próximamente', RUTAS_PROXIMAS.map((x) => x.nombre).join() === 'Sound design,Mezcla y máster')
  comprobar(r, 'Caja de ritmos ← 12.1', HERRAMIENTAS.caja?.leccion === '12.1')
  const tramo3 = beats.paradas.filter((p) => p.tramo === 'acordes-beat' && p.tipo === 'leccion').map((p) => p.id).join(' ')
  comprobar(r, 'tramo 3 con 4.5, 5.4 y 5.6', tramo3 === '4.5 5.4 5.6', tramo3)
  const leccion = (await import('../../src/content/modulo-12/leccion-12-1.js')).default
  comprobar(r, `lección: ${PASOS} pasos, el último un reto`, leccion.pasos.length === PASOS && leccion.pasos.at(-1).tipo === 'reto')
  const { codigoPaso } = await import('../../src/content/actividad.js')
  comprobar(r, 'código S1', codigoPaso(leccion.pasos[1]) === 'S1')
  const { comparar, avisoRack } = await import('../../src/theory/rack.js')
  const cmp = comparar({ kick: [0, 3] }, { kick: [0, 7, 10] }, ['kick'])
  comprobar(r, 'aviso sin decir dónde', avisoRack(cmp, ['kick']) === 'Al bombo le faltan 2 golpes y le sobra 1.', avisoRack(cmp, ['kick']))
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: carpeta ? 2 : 1, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${tema}.png`, fullPage: true })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const preparar = async (progreso, ruta) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, progreso]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify(progreso))
      },
      [tema, progreso],
    )
    await page.goto(BASE + ruta)
    await page.reload()
    await espera(700)
  }
  const irAlPaso = async (n) => {
    await preparar({ lecciones: { '12.1': { paso: n } }, retos: {} }, '#/leccion/12.1/guiada')
    await page.waitForSelector('[data-boton-accion]')
  }
  const boton = () => page.locator('[data-boton-accion] button').first()
  const info = () => page.locator('[data-tarjeta-info]').textContent().catch(() => '')
  const celda = (fila, paso) => page.locator(`[data-fila="${fila}"] [data-paso="${paso}"]`)
  const encendidos = (fila) => page.locator(`[data-fila="${fila}"] [data-on]`).count()

  // ——— Los 12 pasos ———
  for (let n = 0; n < PASOS; n++) {
    await irAlPaso(n)
    const titulo = await page.locator('h1, h2').first().textContent()
    comprobar(r, `paso ${n} se ve`, !!titulo, titulo)
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
    comprobar(r, `paso ${n} sin scroll de lado`, ancho <= 376, String(ancho))
    await foto(`12.1-paso-${String(n).padStart(2, '0')}`)
  }

  // ——— Paso 1: escuchar cada capa sola ———
  await irAlPaso(1)
  comprobar(r, 'capas: Continuar deshabilitado al empezar', await boton().isDisabled())
  await page.locator('[data-rack-play]').click()
  await espera(300)
  comprobar(r, 'capas: suena y el cabezal corre', (await page.locator('[data-rack="sonando"]').count()) === 1)
  const luces = ['kick', 'clap', 'hat', 'tom']
  for (const sola of luces) {
    for (const f of luces) {
      const muda = (await page.locator(`[data-fila="${f}"][data-muda]`).count()) > 0
      if ((f === sola) === muda) await page.locator(`[data-luz="${f}"]`).click()
    }
    await espera(2200) // más de medio compás a 90 BPM
    comprobar(r, `capas: ${sola} sola`, (await page.locator(`[data-capa="${sola}"][data-oida]`).count()) === 1)
  }
  await foto('12.1-capas')
  comprobar(r, 'capas: Continuar listo', !(await boton().isDisabled()) && /Cuatro capas/.test(await info()), await info())

  // ——— Paso 4: backbeat con un error ———
  await irAlPaso(4)
  await celda('clap', 0).click()
  await celda('clap', 12).click()
  await boton().click()
  await espera(400)
  comprobar(r, 'backbeat: 1.er error en oro', /Casi/.test(await info()) && /palmas le falta 1 golpe y le sobra 1/.test(await info()), await info())
  comprobar(r, 'backbeat: el de más, tachado', (await page.locator('[data-marca="sobra"]').count()) === 1)
  await foto('12.1-backbeat-oro')
  await celda('clap', 0).click()
  await celda('clap', 4).click()
  await boton().click()
  await espera(400)
  comprobar(r, 'backbeat: ¡Así suena!', /Así suena/.test(await info()), await info())

  // ——— Paso 5: arrastrar pinta; dos errores → la solución ———
  await irAlPaso(5)
  const a = await celda('hat', 0).boundingBox()
  const b = await celda('hat', 15).boundingBox()
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 })
  await page.mouse.up()
  comprobar(r, 'hats: arrastrar pinta los 16 pasos', (await encendidos('hat')) === 16, String(await encendidos('hat')))
  await boton().click()
  await espera(300)
  comprobar(r, 'hats: 8 de más tachados', (await page.locator('[data-marca="sobra"]').count()) === 8)
  await celda('hat', 1).click() // apaga uno: sigue mal
  await boton().click()
  await espera(400)
  comprobar(r, 'hats: 2.º error → «Así queda.»', /Así queda/.test(await info()), await info())
  comprobar(r, 'hats: la solución en corcheas', (await encendidos('hat')) === 8)
  await foto('12.1-hats-rojo')

  // ——— Paso 7: dictado del bombo ———
  await irAlPaso(7)
  comprobar(r, 'dictado: «Escuchar el original»', (await page.getByRole('button', { name: /Escuchar el original/ }).count()) === 1)
  for (const p of [0, 7, 10]) await celda('kick', p).click()
  await boton().click()
  await espera(400)
  comprobar(r, 'dictado: ¡Así suena!', /Así suena/.test(await info()), await info())

  // ——— Herramientas y Caja de ritmos ———
  await preparar({ lecciones: {}, retos: {} }, '#/herramientas')
  comprobar(r, 'Caja de ritmos con candado', (await page.locator('[data-tarjeta-caja="bloqueada"]').count()) === 1)
  await preparar({ lecciones: { '12.1': { completada: true } }, retos: {} }, '#/herramientas')
  comprobar(r, 'Caja de ritmos abierta con la P1.1', (await page.locator('[data-tarjeta-caja="abierta"]').count()) === 1)
  await foto('herramientas')
  await page.locator('[data-tarjeta-caja="abierta"]').click()
  await espera(700)
  comprobar(r, 'Caja: el boom bap al empezar', (await encendidos('kick')) === 3 && (await encendidos('hat')) === 8)
  await page.getByRole('button', { name: 'Más rápido' }).click()
  await page.locator('[data-inicio="vacio"]').click()
  await celda('kick', 0).click()
  await page.reload()
  await espera(700)
  comprobar(r, 'Caja: tempo y patrón guardados', (await page.locator('[data-bpm="95"]').count()) === 1 && (await encendidos('kick')) === 1)
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
  comprobar(r, 'Caja sin scroll de lado', ancho <= 376, String(ancho))
  await foto('caja')

  // ——— Aprender › Rutas y la ruta de Beats ———
  await preparar({ lecciones: {}, retos: {} }, '#/aprender/rutas')
  const fila = page.locator('[data-area-rutas="produccion"]')
  comprobar(r, 'Rutas: Beats y dos próximas', /Beats/.test(await fila.textContent()) && (await fila.locator('[data-ruta-proxima]').count()) === 2, await fila.textContent())
  await foto('aprender-rutas')
  await preparar({ lecciones: { '2.2': { completada: true }, '12.1': { completada: true } }, retos: {} }, '#/ruta/beats')
  comprobar(r, 'ruta de Beats se abre', /Beats/.test(await page.locator('[data-titulo-modulo]').textContent()))
  await foto('ruta-beats')
  await preparar({ lecciones: {}, retos: {} }, '#/aprender/modulos')
  await foto('aprender-modulos')

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLAS` : 'TODO BIEN')
process.exit(fallos ? 1 : 0)
