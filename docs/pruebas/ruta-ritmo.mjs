// Prueba la ruta de ritmo (página igual a la de un módulo), el orden de Inicio y el Piano libre en tarjetita, a 375 px
// en claro y oscuro (y con «reducir movimiento»):
//  - Inicio: Módulos · Prácticas · Rutas · Herramientas; el cuadrito de la ruta de Ritmo dice 0/10 y los de Letras y
//    Acordes van con candado; el Piano abre #/piano con su teclado.
//  - #/ruta/ritmo: cabecera fija con 10 segmentos, «RUTA · Ritmo», la barra de puntitos (insignia + 10 paradas) y las
//    islas del camino; con 2.1, 2.2 y Seguir nivel 2: 3/10; tocar el puntito de «Eco · nivel 3» abre su globo con
//    «Tu nivel» y «Practicar» (lleva a #/ritmo/eco); una bloqueada dice «Antes: …»; la insignia abierta tiene
//    «Módulos y prácticas»; la tarjetita del final abre la hoja con el Módulo 2 y Seguir / Eco.
//  - Flow con candado sin la 2.4 (no cambia al tocarlo); con todo el módulo 2: 9/10, «Lo hice» en el reto → 10/10.
//  - El panel de #/ritmo lleva a la ruta. Sin errores en la consola.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/ruta-ritmo.mjs [carpeta-de-capturas]
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
const completadas = (ids) => Object.fromEntries(ids.map((id) => [id, { paso: 0, completada: true, aciertos: 1, total: 1 }]))
const ritmo = (seguir, eco = 1) => ({ version: 1, dias: {}, mejorRacha: 0, modos: { seguir: { nivel: seguir, nivelMax: seguir }, eco: { nivel: eco, nivelMax: eco } } })

for (const [tema, reducir] of [['claro', false], ['oscuro', false], ['claro', true]]) {
  const r = (resultados[`${tema}${reducir ? ' (reducir movimiento)' : ''}`] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  if (reducir) await page.emulateMedia({ reducedMotion: 'reduce' })
  const foto = (n, completa = false) => carpeta && !reducir && page.screenshot({ path: `${carpeta}/ruta-${n}-${tema}.png`, fullPage: completa })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const preparar = async ({ lecciones = {}, retos = {}, nivelSeguir = 1, nivelEco = 1, ruta = '' } = {}) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, lecciones, retos, datosRitmo]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones, retos }))
        localStorage.setItem('teoria-musical:ritmo:v1', JSON.stringify(datosRitmo))
      },
      [tema, lecciones, retos, ritmo(nivelSeguir, nivelEco)],
    )
    await page.goto(BASE + ruta)
    await page.reload()
    await espera(1400)
  }
  const avance = () => page.getAttribute('[role="progressbar"], [data-pildora-cabecera] [aria-label]', 'aria-label')
  const punto = (i) => page.locator(`[data-punto="${i}"]`)

  // 1) Inicio sin progreso.
  await preparar()
  const titulos = await page.$$eval('h2', (hs) => hs.map((h) => h.textContent.trim()))
  comprobar(r, 'Inicio: Módulos · Prácticas · Rutas · Herramientas', titulos.join('|').includes('Módulos|Prácticas|Rutas|Herramientas'), titulos.join(' | '))
  comprobar(r, 'ruta de Ritmo 0/10', (await page.textContent('[data-ruta-inicio="ritmo"]')).includes('0/10'))
  comprobar(r, 'Letras y Acordes con candado', (await page.locator('div[data-cuadrito-ruta="letras"]').count()) === 1 && (await page.locator('div[data-cuadrito-ruta="acordes"]').count()) === 1)
  await page.locator('[data-cuadrito-ruta="ritmo"]').scrollIntoViewIfNeeded()
  await espera(300)
  await foto('inicio-rutas')
  await page.locator('[data-tarjeta-piano]').scrollIntoViewIfNeeded()
  await page.locator('[data-tarjeta-piano]').click()
  await page.waitForSelector('[data-piano-libre]')
  await espera(400)
  comprobar(r, 'el Piano abre #/piano con su teclado', page.url().includes('#/piano') && (await page.locator('[data-note]').count()) > 0)

  // 2) Desde Inicio a la ruta: página igual a la de un módulo.
  await preparar({ lecciones: completadas(['2.1', '2.2']), nivelSeguir: 2 })
  await page.locator('[data-cuadrito-ruta="ritmo"]').scrollIntoViewIfNeeded()
  await page.locator('[data-cuadrito-ruta="ritmo"]').click()
  await page.waitForSelector('[data-pagina-ruta="ritmo"]')
  await espera(1600)
  comprobar(r, 'abre #/ruta/ritmo', page.url().includes('#/ruta/ritmo'))
  comprobar(r, 'título «Ritmo» y etiqueta «Ruta»', (await page.textContent('[data-titulo-modulo]')).trim() === 'Ritmo')
  comprobar(r, 'cabecera con 10 segmentos', (await page.locator('[data-segmento]').count()) === 10, String(await page.locator('[data-segmento]').count()))
  comprobar(r, 'barra de puntitos: insignia + 10', (await page.locator('[data-punto]').count()) === 11)
  const etiquetaCab = await page.getAttribute('[data-pildora-cabecera] [aria-label]', 'aria-label')
  comprobar(r, 'cabecera: 3 de 10 paradas', (etiquetaCab ?? '').includes('3 de 10'), etiquetaCab)
  await foto('ruta-cerrada')

  // 3) Abrir «Eco · nivel 3» (nodo 4) desde su puntito.
  await punto(4).click()
  await espera(1200)
  const globo = page.getByRole('group', { name: 'Eco · nivel 3' })
  comprobar(r, 'globo de la práctica con «Tu nivel»', (await globo.textContent()).includes('Tu nivel: 1'))
  await foto('globo-meta')
  // Una bloqueada (Seguir · nivel 5 = nodo 6).
  await punto(6).click()
  await espera(1000)
  comprobar(r, 'bloqueada dice «Antes: Eco · nivel 3»', (await page.getByRole('group', { name: 'Seguir · nivel 5' }).textContent()).includes('Antes: Eco · nivel 3'))
  // La insignia.
  await punto(0).click()
  await espera(1000)
  const insignia = page.getByRole('group', { name: 'Ruta de ritmo' })
  comprobar(r, 'insignia con «Módulos y prácticas»', (await insignia.textContent()).includes('Módulos y prácticas'))
  await foto('insignia')
  // «Practicar» de la meta.
  await punto(4).click()
  await espera(1000)
  await page.getByRole('group', { name: 'Eco · nivel 3' }).getByRole('button', { name: 'Practicar' }).click()
  await espera(800)
  comprobar(r, '«Practicar» lleva a #/ritmo/eco', page.url().includes('#/ritmo/eco'), page.url())

  // 4) La tarjetita del final y su hoja.
  await page.goto(BASE + '#/ruta/ritmo')
  await espera(1400)
  await page.locator('[data-tarjeta-modulos]').scrollIntoViewIfNeeded()
  await espera(300)
  await foto('tarjeta-final')
  await page.locator('[data-tarjeta-modulos]').click()
  await page.waitForSelector('[data-hoja-modulos]')
  await espera(600)
  const hoja = await page.textContent('[data-hoja-modulos]')
  comprobar(r, 'hoja: Módulo 2 y Seguir / Eco', hoja.includes('Ritmo y groove') && (await page.locator('[data-practica="seguir"]').count()) === 1 && (await page.locator('[data-practica="eco"]').count()) === 1, hoja)
  await foto('hoja-modulos')

  // 5) El panel de ritmo lleva a la ruta.
  await page.goto(BASE + '#/ritmo')
  await espera(900)
  await page.locator('[data-entrada-ruta="ritmo"]').scrollIntoViewIfNeeded()
  comprobar(r, 'panel de ritmo: entrada a la ruta 3/10', (await page.textContent('[data-entrada-ruta="ritmo"]')).includes('3/10'))

  // 6) Flow con candado sin la 2.4.
  await preparar({ ruta: '#/letras' })
  await page.click('[data-nueva-letra]')
  await espera(600)
  const flow = page.locator('[role="radio"]', { hasText: 'Flow' })
  comprobar(r, 'Flow con candado sin la 2.4', (await flow.getAttribute('data-bloqueado')) === 'true')
  await flow.click({ force: true }) // aria-disabled: Playwright no lo toca sin force
  await espera(400)
  comprobar(r, 'tocar Flow bloqueado no cambia', (await flow.getAttribute('aria-checked')) === 'false')

  // 7) Todo el módulo 2, Seguir 5 y Eco 3: falta el reto.
  await preparar({ ruta: '#/ruta/ritmo', lecciones: completadas(['2.1', '2.2', '2.3', '2.4', '2.5']), nivelSeguir: 5, nivelEco: 3 })
  const cab = await page.getAttribute('[data-pildora-cabecera] [aria-label]', 'aria-label')
  comprobar(r, '9 de 10', (cab ?? '').includes('9 de 10'), cab)
  await punto(10).click()
  await espera(1200)
  await foto('globo-reto')
  await page.getByRole('group', { name: 'Tu groove con swing' }).getByRole('button', { name: 'Lo hice' }).click()
  await espera(600)
  const cab2 = await page.getAttribute('[data-pildora-cabecera] [aria-label]', 'aria-label')
  comprobar(r, 'con el reto: 10 de 10', (cab2 ?? '').includes('10 de 10'), cab2)
  await foto('ruta-completa')
  await page.goto(BASE + '#/letras')
  await espera(500)
  await page.click('[data-nueva-letra]')
  await espera(600)
  comprobar(r, 'Flow abierto con la 2.4', (await page.locator('[role="radio"]', { hasText: 'Flow' }).getAttribute('data-bloqueado')) === null)

  comprobar(r, 'sin errores en la consola', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} fallos` : 'Todo bien')
process.exit(fallos ? 1 : 0)
