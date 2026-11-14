// Prueba la ruta de ritmo (página igual a la de un módulo), el orden de Inicio y el Piano libre en tarjetita, a 375 px
// en claro y oscuro (y con «reducir movimiento»):
//  - Inicio: Rutas · Prácticas · Herramientas · Módulos (pedido del usuario: las rutas arriba, los módulos abajo); el cuadrito de la ruta de Ritmo dice 0/10, el de Letras 0/10 y
//    el de Acordes va con candado; el Piano abre #/piano con su teclado.
//  - #/ruta/ritmo: cabecera fija con una barra LISA (un solo segmento), «RUTA · Ritmo», la barra de puntitos (insignia + 10 paradas) y las
//    islas del camino; con 2.1, 2.2 y Seguir nivel 2: 3/10; tocar el puntito de «Eco · nivel 3» abre su globo con
//    «Tu nivel» y «Practicar» (lleva a #/ritmo/eco); una bloqueada dice «Antes: …»; la insignia abierta tiene
//    «Módulos y prácticas»; el botón de vidrio sobre la barra de puntitos (ya no hay tarjetita al final) cambia las islas
//    por el carrusel con el Módulo 2 y Seguir / Eco (más en carrusel-modulos.mjs). Ruta LINEAL: con Seguir nivel 5 pero sin Eco 3, «Seguir · nivel 5» sigue bloqueada.
//  - Flow con candado sin la 2.4 (no cambia al tocarlo); con todo el módulo 2: 9/10, «Lo hice» en el reto → 10/10.
//  - El panel de #/ritmo lleva a la ruta. Sin errores en la consola.
//  - Computadora: como mucho 6 nodos a la vista; la tira se arrastra de lado y con la rueda.
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
  comprobar(r, 'Inicio: Rutas · Prácticas · Herramientas · Módulos', titulos.join('|').includes('Rutas|Prácticas|Herramientas|Módulos'), titulos.join(' | '))
  comprobar(r, 'ruta de Ritmo 0/10', (await page.textContent('[data-ruta-inicio="ritmo"]')).includes('0/10'))
  comprobar(r, 'Letras 0/10 y Acordes 0/18', (await page.textContent('[data-ruta-inicio="letras"]')).includes('0/10') && (await page.textContent('[data-ruta-inicio="acordes"]')).includes('0/18'))
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
  // Con lecciones por saltar sube la hoja de la ruta (prueba rápida «¿Ya lo sabes?»): «Seguir» entra.
  await espera(600)
  if (await page.locator('[data-entrar]').count()) await page.locator('[data-entrar]').click()
  await page.waitForSelector('[data-pagina-ruta="ritmo"]')
  await espera(1600)
  comprobar(r, 'abre #/ruta/ritmo', page.url().includes('#/ruta/ritmo'))
  comprobar(r, 'título «Ritmo» y etiqueta «Ruta»', (await page.textContent('[data-titulo-modulo]')).trim() === 'Ritmo')
  comprobar(r, 'cabecera con barra lisa', (await page.locator('[data-segmento]').count()) === 1, String(await page.locator('[data-segmento]').count()))
  comprobar(r, 'barra de puntitos: insignia + 10', (await page.locator('[data-punto]').count()) === 11)
  const etiquetaCab = await page.getAttribute('[data-pildora-cabecera] [aria-label]', 'aria-label')
  comprobar(r, 'cabecera: 3 de 10 paradas', (etiquetaCab ?? '').includes('3 de 10'), etiquetaCab)
  await foto('ruta-cerrada')

  // 3) Abrir «Eco · nivel 3» (nodo 4) desde su puntito.
  await punto(4).dispatchEvent("click")
  await espera(1200)
  const globo = page.getByRole('group', { name: 'Eco · nivel 3' })
  comprobar(r, 'globo de la práctica con «Tu nivel»', (await globo.textContent()).includes('Tu nivel: 1'))
  await foto('globo-meta')
  // Una bloqueada (Seguir · nivel 5 = nodo 6).
  await punto(6).dispatchEvent("click")
  await espera(1000)
  comprobar(r, 'bloqueada dice «Antes: Eco · nivel 3»', (await page.getByRole('group', { name: 'Seguir · nivel 5' }).textContent()).includes('Antes: Eco · nivel 3'))
  // La insignia.
  await punto(0).dispatchEvent("click")
  await espera(1000)
  const insignia = page.getByRole('group', { name: 'Ruta de ritmo' })
  comprobar(r, 'insignia con «Módulos y prácticas»', (await insignia.textContent()).includes('Módulos y prácticas'))
  await foto('insignia')
  // «Practicar» de la meta.
  await punto(4).dispatchEvent("click")
  await espera(1000)
  await page.getByRole('group', { name: 'Eco · nivel 3' }).getByRole('button', { name: 'Practicar' }).click()
  await espera(800)
  comprobar(r, '«Practicar» lleva a #/ritmo/eco', page.url().includes('#/ritmo/eco'), page.url())

  // 4) El botón «Módulos y prácticas» sobre la barra de puntitos y su hoja (la tarjetita del final ya no está).
  await page.goto(BASE + '#/ruta/ritmo')
  await espera(1400)
  comprobar(r, 'sin la tarjetita del final', (await page.locator('[data-tarjeta-modulos]').count()) === 0)
  const caja = await page.locator('[data-encima-barra]').boundingBox()
  const barra = await page.locator('[data-puntitos] [role=group]').boundingBox()
  comprobar(r, 'botón de 44 px encima de la barra', caja && Math.round(caja.width) === 44 && caja.y + caja.height <= barra.y, JSON.stringify({ caja, barra }))
  comprobar(r, 'barra de puntitos de 44 px', Math.round(barra.height) === 44, String(barra.height))
  await foto('boton-modulos')
  await page.locator('[data-encima-barra]').click()
  await page.waitForSelector('[data-carrusel-modulos]')
  await espera(600)
  const hoja = await page.textContent('[data-carrusel-modulos]')
  comprobar(r, 'carrusel: Módulo 2 y Seguir / Eco', hoja.includes('Ritmo y groove') && (await page.locator('[data-tarjeta-modulo="ritmo-seguir"]').count()) === 1 && (await page.locator('[data-tarjeta-modulo="ritmo-eco"]').count()) === 1, hoja)
  await foto('carrusel-modulos')

  // 4b) Ruta lineal: Seguir nivel 5 alcanzado, pero sin Eco 3 → «Seguir · nivel 5» bloqueada y 3/10.
  await preparar({ ruta: '#/ruta/ritmo', lecciones: completadas(['2.1', '2.2']), nivelSeguir: 5 })
  const cabLineal = await page.getAttribute('[data-pildora-cabecera] [aria-label]', 'aria-label')
  comprobar(r, 'lineal: 3 de 10 aunque Seguir 5 ya se alcanzó', (cabLineal ?? '').includes('3 de 10'), cabLineal)
  await punto(6).dispatchEvent("click")
  await espera(1000)
  comprobar(r, 'lineal: «Seguir · nivel 5» bloqueada', (await page.getByRole('group', { name: 'Seguir · nivel 5' }).textContent()).includes('Antes: Eco · nivel 3'))

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
  await punto(10).dispatchEvent("click")
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

// 8) Computadora (1440 × 900): como mucho 6 nodos a la vez; el camino cerrado es una TIRA que se arrastra de lado
//    (con el ratón o la rueda) sin cambiar de ruta, y al cerrar una isla lejana la tira la deja a la vista.
{
  const r = (resultados['computadora'] = {})
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))
  await page.goto(BASE)
  await page.evaluate(() => localStorage.clear())
  await page.goto(BASE + '#/ruta/ritmo')
  await page.reload()
  await espera(1600)
  const tira = () => page.getAttribute('[data-tira]', 'data-tira')
  comprobar(r, 'tira al inicio (0)', (await tira()) === '0', await tira())
  const caja = await page.locator('[data-tira]').boundingBox()
  const visibles = await page.$$eval('[data-punto]', (ps) => ps.length)
  comprobar(r, 'barra con los 11 puntitos', visibles === 11)
  await page.mouse.move(caja.x + caja.width * 0.8, caja.y + caja.height / 2)
  await page.mouse.down()
  for (let k = 1; k <= 30; k++) {
    await page.mouse.move(caja.x + caja.width * (0.8 - (0.4 * k) / 30), caja.y + caja.height / 2)
    await espera(16)
  }
  await page.mouse.up()
  await espera(900)
  comprobar(r, 'arrastrar corre la tira', Number(await tira()) >= 1, await tira())
  comprobar(r, 'arrastrar no cambia de ruta', page.url().endsWith('#/ruta/ritmo'), page.url())
  const antes = Number(await tira())
  await page.mouse.wheel(120, 0)
  await espera(800)
  comprobar(r, 'la rueda de lado corre una columna', Number(await tira()) === antes + 1, await tira())
  await page.locator('[data-punto="0"]').click()
  await espera(1000)
  await page.keyboard.press('Escape')
  await espera(900)
  comprobar(r, 'al cerrar la insignia, la tira vuelve al inicio', (await tira()) === '0', await tira())
  await page.goto(BASE + '#/modulo/1')
  await espera(1400)
  comprobar(r, 'módulo 1 (6 nodos): sin tira', (await page.locator('[data-tira]').count()) === 0)
  comprobar(r, 'sin errores en la consola', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} fallos` : 'Todo bien')
process.exit(fallos ? 1 : 0)
