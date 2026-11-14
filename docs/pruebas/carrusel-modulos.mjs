// Prueba el carrusel «Módulos y prácticas» de las rutas y de los bloques del Curso completo (pedido del usuario: al tocar
// el botón de encima de la barra de puntitos, se resalta y las islas se cambian por los módulos y las prácticas en
// carruseles de lado; arriba/abajo cambia de fila; tocar o subir el botón abre; tocarlo otra vez vuelve a las islas).
// A 375 px en claro, oscuro y con «reducir movimiento», y a 1280 px:
//  - #/ruta/acordes: el botón se resalta (data-modulos-abierto) y el camino se oculta; filas Módulos (1, 3, 4) y
//    Prácticas (Intervalos, Acordes, Oído absoluto); deslizar de lado pasa de módulo; deslizar hacia arriba pasa a
//    Prácticas; tocar una tarjeta de al lado la trae al centro; tocar el botón otra vez vuelve a las islas.
//  - Subir el botón (gesto) abre la tarjeta del centro: Intervalos → #/oido/intervalos; un toque en la del centro abre el módulo.
//  - Con una isla abierta, el botón la cierra.
//  - #/curso/bloque/1: Módulos 1 y 2; Prácticas agrupadas por tipo (Seguir, Eco | Vocabulario, Tus letras).
//  - La barra de puntitos sigue al carrusel: un puntito por tarjeta de la fila (el del centro marcado), las prácticas
//    con un hueco entre grupos; tocar un puntito lleva a su tarjeta; deslizar la barra arriba/abajo cambia de fila.
//  Sin errores en la consola.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/carrusel-modulos.mjs [carpeta-de-capturas]
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

for (const [tema, reducir, ancho] of [['claro', false, 375], ['oscuro', false, 375], ['claro', true, 375], ['claro', false, 1280]]) {
  const r = (resultados[`${tema} ${ancho}px${reducir ? ' (reducir movimiento)' : ''}`] = {})
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: ancho, height: ancho > 600 ? 800 : 740 }, deviceScaleFactor: 2, hasTouch: true })
  if (reducir) await page.emulateMedia({ reducedMotion: 'reduce' })
  const foto = (n) => carpeta && !reducir && page.screenshot({ path: `${carpeta}/carrusel-${n}-${tema}-${ancho}.png` })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))
  const arrastrar = async (x0, y0, x1, y1, pasos = 14) => {
    await page.mouse.move(x0, y0)
    await page.mouse.down()
    for (let i = 1; i <= pasos; i++) {
      await page.mouse.move(x0 + ((x1 - x0) * i) / pasos, y0 + ((y1 - y0) * i) / pasos)
      await espera(16)
    }
    await page.mouse.up()
    await espera(800)
  }
  const ir = async (ruta) => {
    await page.goto(BASE)
    await page.evaluate((tema) => {
      localStorage.clear()
      localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
      localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones: { '1.1': { paso: 0, completada: true } }, retos: {} }))
    }, tema)
    await page.goto(BASE + ruta)
    await page.reload()
    await espera(1500)
  }
  const boton = page.locator('[data-encima-barra]')
  const carrusel = page.locator('[data-carrusel-modulos]')
  const tarjetas = async (fila) => page.locator(`[data-fila="${fila}"] [data-tarjeta-modulo]`).evaluateAll((els) => els.map((e) => e.dataset.tarjetaModulo))
  const centro = async () => page.locator('[data-carrusel-modulos] [data-centro]').getAttribute('data-tarjeta-modulo')

  // 1) Ruta de acordes: con una isla abierta, el botón la cierra y cambia las islas por el carrusel.
  await ir('#/ruta/acordes')
  await page.locator('[data-punto]').nth(2).click()
  await espera(900)
  await boton.click()
  await espera(900)
  comprobar(r, 'botón resaltado', (await boton.getAttribute('data-modulos-abierto')) === '')
  comprobar(r, 'camino oculto', (await page.locator('[data-camino-oculto]').count()) === 1)
  comprobar(r, 'filas: módulos 1, 3, 4', (await tarjetas('modulos')).join() === 'modulo-1,modulo-3,modulo-4', (await tarjetas('modulos')).join())
  comprobar(r, 'prácticas de oído', (await tarjetas('practicas')).join() === 'oido-intervalos,oido-acordes,oido-absoluto', (await tarjetas('practicas')).join())
  comprobar(r, 'empieza en Módulo 1', (await centro()) === 'modulo-1')
  // La otra fila espera abajo, chiquita y desenfocada (como las cartas en la mano).
  const mano = await page.locator('[data-fila="practicas"]').evaluate((e) => ({ mano: e.hasAttribute('data-mano'), filtro: e.style.filter, alto: e.getBoundingClientRect().height, top: e.getBoundingClientRect().top }))
  const grande = await page.locator('[data-fila="modulos"]').boundingBox()
  comprobar(r, 'Prácticas abajo, chiquita' + (reducir ? '' : ' y desenfocada'), mano.mano && mano.top > grande.y + grande.height - 4 && mano.alto < grande.height * 0.5 && (reducir || mano.filtro.includes('blur')), JSON.stringify(mano))
  // La vecina de lado deja ver su símbolo (su cuadrito queda dentro de la pantalla).
  const simbolo = await page.locator('[data-tarjeta-modulo="modulo-3"] [aria-hidden]').first().boundingBox()
  comprobar(r, 'se ve el símbolo de la vecina', simbolo && simbolo.x + simbolo.width <= ancho + 1, JSON.stringify(simbolo))
  await foto('modulos')

  // 2) Deslizar de lado pasa de módulo; hacia arriba, a Prácticas.
  const caja = await carrusel.boundingBox()
  const cy = caja.y + caja.height / 2
  const cx = caja.x + caja.width / 2
  await arrastrar(cx + 100, cy, cx - 60, cy)
  comprobar(r, 'de lado: Módulo 3', (await centro()) === 'modulo-3', await centro())
  await arrastrar(cx, cy + 60, cx, cy - 150)
  comprobar(r, 'hacia arriba: Prácticas', (await carrusel.getAttribute('data-fila-actual')) === 'practicas')
  comprobar(r, 'Prácticas empieza en Intervalos', (await centro()) === 'oido-intervalos', await centro())
  await foto('practicas')
  // Tocar la de al lado la trae al centro (no la abre).
  const vecina = await page.locator('[data-tarjeta-modulo="oido-acordes"]').boundingBox()
  await page.mouse.click(Math.min(vecina.x + vecina.width - 16, ancho - 6), vecina.y + vecina.height / 2) // asoma detrás, a la derecha
  await espera(800)
  comprobar(r, 'tocar la vecina: Acordes al centro', (await centro()) === 'oido-acordes' && page.url().includes('#/ruta/acordes'), page.url())
  await arrastrar(cx, cy - 60, cx, cy + 150)
  comprobar(r, 'hacia abajo también saca la de abajo: Módulos (guarda el Módulo 3)', (await carrusel.getAttribute('data-fila-actual')) === 'modulos' && (await centro()) === 'modulo-3')
  // Tocar la mano saca esa fila (y guarda su tarjeta: Acordes).
  const enMano = await page.locator('[data-fila="practicas"][data-mano] [data-tarjeta-modulo="oido-acordes"]').boundingBox()
  await page.mouse.click(enMano.x + enMano.width / 2, enMano.y + enMano.height / 2)
  await espera(900)
  comprobar(r, 'tocar la mano: Prácticas en Acordes', (await carrusel.getAttribute('data-fila-actual')) === 'practicas' && (await centro()) === 'oido-acordes', await centro())
  await page.keyboard.press('ArrowDown')
  await espera(800)

  // 3) Tocar el botón otra vez: vuelven las islas.
  await boton.click()
  await espera(900)
  comprobar(r, 'tocar otra vez: islas', (await carrusel.count()) === 0 && (await page.locator('[data-camino-oculto]').count()) === 0 && (await boton.getAttribute('data-modulos-abierto')) === null)

  // 4) Tocar la del centro abre el módulo.
  await boton.click()
  await espera(900)
  await page.locator('[data-carrusel-modulos] [data-centro]').click()
  await espera(900)
  comprobar(r, 'tocar la del centro: #/modulo/1', page.url().endsWith('#/modulo/1'), page.url())

  // 5) Subir el botón abre la tarjeta del centro (Prácticas → Intervalos).
  await ir('#/ruta/acordes')
  await boton.click()
  await espera(900)
  await page.keyboard.press('ArrowDown')
  await espera(700)
  const b = await boton.boundingBox()
  await page.mouse.move(b.x + 22, b.y + 22)
  await page.mouse.down()
  for (let i = 1; i <= 16; i++) {
    await page.mouse.move(b.x + 22, b.y + 22 - i * 6)
    await espera(20)
  }
  await espera(300)
  comprobar(r, 'subir: la del centro, lista', (await page.locator('[data-centro][data-tarjeta-modulo="oido-intervalos"]').count()) === 1 && (await page.locator('[data-listo]').count()) === 1)
  await foto('subir')
  await page.mouse.up()
  await espera(900)
  comprobar(r, 'subir el botón: #/oido/intervalos', page.url().includes('#/oido/intervalos'), page.url())


  // 7) Bloque 1 del curso.
  await ir('#/curso/bloque/1')
  await boton.click()
  await espera(900)
  comprobar(r, 'bloque 1: módulos 1 y 2', (await tarjetas('modulos')).join() === 'modulo-1,modulo-2', (await tarjetas('modulos')).join())
  comprobar(r, 'bloque 1: prácticas agrupadas', (await tarjetas('practicas')).join() === 'ritmo-seguir,ritmo-eco,letras-vocabulario,letras-cuaderno', (await tarjetas('practicas')).join())
  const puntos = page.locator('[data-puntos-dummy], [data-puntitos] [data-punto]')
  const marcado = async () => page.locator('[data-puntitos] [data-punto][aria-current]').getAttribute('data-punto')
  comprobar(r, 'barra: 2 puntitos (módulos 1 y 2), el 1 marcado', (await puntos.count()) === 2 && (await marcado()) === '0')
  await foto('bloque')
  await puntos.nth(1).click()
  await espera(800)
  comprobar(r, 'tocar el 2.º puntito: Módulo 2 al centro', (await centro()) === 'modulo-2' && (await marcado()) === '1', await centro())
  const barra = await page.locator('[data-puntitos] [role=group]').boundingBox()
  const bx = barra.x + barra.width / 2
  const by = barra.y + barra.height / 2
  await arrastrar(bx, by, bx, by - 50, 8)
  comprobar(r, 'barra hacia arriba: Prácticas', (await carrusel.getAttribute('data-fila-actual')) === 'practicas')
  comprobar(r, 'barra: 4 puntitos con hueco antes de letras', (await puntos.count()) === 4 && (await page.locator('[data-puntitos] [data-punto="2"][data-inicio-tramo]').count()) === 1 && (await page.locator('[data-puntitos] [data-inicio-tramo]').count()) === 1)
  await foto('bloque-practicas')
  await arrastrar(bx, by, bx, by + 50, 8)
  comprobar(r, 'barra hacia abajo: Módulos', (await carrusel.getAttribute('data-fila-actual')) === 'modulos' && (await puntos.count()) === 2)
  await page.keyboard.press('ArrowDown')
  await espera(600)
  await page.keyboard.press('ArrowRight')
  await espera(700)
  comprobar(r, 'el carrusel mueve el puntito marcado', (await marcado()) === '1')
  await boton.click()
  await espera(900)
  comprobar(r, 'al volver a las islas: insignia + 11 paradas', (await puntos.count()) === 12, String(await puntos.count()))

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} fallos` : 'Todo bien')
process.exit(fallos ? 1 : 0)
