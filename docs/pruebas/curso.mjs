// Prueba el CURSO COMPLETO (content/curso.js, pages/Curso.jsx) a 375 px en claro y oscuro:
//  - Inicio: el botón «Curso completo» (anillo en tres colores, «x de 40») en lugar de la tarjeta de «Continuar».
//  - #/curso: tarjeta de avance (%, filas por área), «Sigue aquí», carrusel de bloques (abre centrado en el bloque
//    actual, se desliza con el dedo, puntitos para saltar, «Próximamente» al final) y «Tus rutas»; sin «Cuando quieras».
//  - #/curso/bloque/2: camino de islas (insignia + 12 pasos + la 3.6 opcional), cada puntito del color de su ruta,
//    la opcional punteada con «Opcional»; lineal (la 3.1 hecha sale bloqueada si falta el bloque 1); la opcional no
//    cuenta; deslizar de lado pasa al bloque 3 y después del 3 no hay más.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/curso.mjs [carpeta-de-capturas]
import { createRequire } from 'node:module'
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
const hecha = { paso: 0, completada: true, aciertos: 5, total: 5 }
const lecciones = (...ids) => Object.fromEntries(ids.map((id) => [id, hecha]))
const hoy = new Date().toISOString().slice(0, 10)
const VOCAB = { version: 1, dias: {}, mejorRacha: 0, modos: {}, repaso: Object.fromEntries(noche.slice(0, 10).map((w) => [w.p, [1, hoy]])) }
const LETRA = { version: 1, letras: [{ id: 'a1', titulo: 'Prueba', texto: 'Me late fuerte el corazón\ny no le encuentro la razón', creada: 1, editada: 1 }] }
const RITMO = { version: 1, dias: {}, mejorRacha: 0, modos: { seguir: { nivel: 2, nivelMax: 2 }, eco: { nivel: 3, nivelMax: 3 } } }
// Todo el bloque 1 (11 pasos): 7 lecciones + Seguir 2, Eco 3, Vocabulario · Noche y la primera letra.
const BLOQUE1 = { lecciones: lecciones('1.1', '2.1', 'L1', '1.2', '1.3', '2.2', '1.4'), ritmo: RITMO, vocab: VOCAB, letras: LETRA }

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, hasTouch: true })
  const foto = (n, completa = false) => carpeta && page.screenshot({ path: `${carpeta}/curso-${n}-${tema}.png`, fullPage: completa })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))

  const preparar = async ({ lecciones = {}, ritmo = null, vocab = null, letras = null } = {}, ruta = '') => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, lecciones, ritmo, vocab, letras]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones, retos: {} }))
        if (ritmo) localStorage.setItem('teoria-musical:ritmo:v1', JSON.stringify(ritmo))
        if (vocab) localStorage.setItem('teoria-musical:letras-vocab:v1', JSON.stringify(vocab))
        if (letras) localStorage.setItem('teoria-musical:letras:v1', JSON.stringify(letras))
      },
      [tema, lecciones, ritmo, vocab, letras],
    )
    await page.goto(BASE + ruta)
    await page.reload()
    await espera(1800)
  }
  const posicion = () => page.$eval('[data-carrusel-bloques]', (e) => Number(e.dataset.posicion))
  const deslizar = async (desde, hasta, y, pasos = 24) => {
    await page.mouse.move(desde, y)
    await page.mouse.down()
    for (let k = 1; k <= pasos; k++) {
      await page.mouse.move(desde + ((hasta - desde) * k) / pasos, y)
      await espera(16)
    }
    await espera(120) // quieto antes de soltar: sin gesto rápido
    await page.mouse.up()
    await espera(1500)
  }

  // 1. Inicio sin nada hecho: el botón del curso y ya no la tarjeta de «Continuar».
  await preparar()
  comprobar(r, 'inicio: botón «Curso completo»', (await page.locator('[data-boton-curso]').count()) === 1)
  comprobar(r, 'inicio: sin la tarjeta de «Continuar»', (await page.locator('[data-siguiente]').count()) === 0)
  comprobar(r, 'inicio: «0 de 40 · 3 rutas»', /0 de 40 · 3 rutas/.test(await page.locator('[data-boton-curso]').textContent()))
  comprobar(r, 'inicio: anillo con 4 arcos (tres áreas + las tres)', (await page.locator('[data-arco-curso]').count()) === 4)
  await foto('inicio')

  // 2. Con 1.1, 2.1, L1 y la 3.1 hecha (fuera de orden).
  await preparar({ lecciones: lecciones('1.1', '2.1', 'L1', '3.1') })
  comprobar(r, 'inicio: «3 de 40» (la 3.1 aún no cuenta: lineal)', /3 de 40/.test(await page.locator('[data-boton-curso]').textContent()))
  await page.locator('[data-boton-curso]').click()
  await espera(1500)
  comprobar(r, 'el botón abre #/curso', page.url().endsWith('#/curso'), page.url())
  comprobar(r, 'curso: 8 %', (await page.locator('[data-porcentaje]').textContent()) === '8%', await page.locator('[data-porcentaje]').textContent())
  comprobar(r, 'curso: barra de la cabecera', (await page.locator('[data-barra-curso]').count()) === 1)
  comprobar(r, 'curso: tres filas de área', (await page.locator('[data-area]').count()) === 3)
  comprobar(r, 'curso: Armonía 1/19', /1\/19/.test(await page.locator('[data-area="acordes"]').textContent()))
  comprobar(r, 'curso: «Sigue aquí» = 1.2', (await page.getAttribute('[data-sigue-aqui]', 'data-sigue-aqui')) === '1.2')
  comprobar(r, 'curso: sin «Cuando quieras»', (await page.getByText('Cuando quieras').count()) === 0)
  comprobar(r, 'curso: «Tus rutas» con 3 tarjetas', (await page.locator('[data-tarjeta-ruta]').count()) === 3)
  comprobar(r, 'carrusel: 3 bloques + «Próximamente»', (await page.locator('[data-tarjeta-bloque]').count()) === 4)
  comprobar(r, 'carrusel: abre en el bloque 1', Math.abs(await posicion()) < 0.01, String(await posicion()))
  comprobar(r, 'bloque 1: chip «Ahora»', (await page.getAttribute('[data-tarjeta-bloque="1"]', 'data-estado')) === 'ahora')
  // Tarjeta compacta (pedido del usuario): solo «Bloque N», el título y la barra con x/y.
  const t1 = await page.textContent('[data-tarjeta-bloque="1"]')
  comprobar(r, 'bloque 1: «Bloque 1», título y 1/11', /Bloque 1/.test(t1) && /Arrancar/.test(t1) && /\d+\/11/.test(t1) && !/Meta|Ver los/.test(t1), t1)
  const alto = (await page.locator('[data-tarjeta-bloque="1"]').boundingBox()).height
  comprobar(r, 'tarjeta compacta (< 140 px)', alto < 140, String(alto))
  // Tocar una tarjeta (aunque esté a un lado) entra directo a su bloque.
  await page.locator('[data-carrusel-bloques]').scrollIntoViewIfNeeded()
  await espera(400)
  const lado = await page.locator('[data-tarjeta-bloque="2"]').boundingBox()
  await page.mouse.click(lado.x + 24, lado.y + 30)
  await espera(1500)
  comprobar(r, 'tocar la de al lado: entra al bloque 2', page.url().endsWith('#/curso/bloque/2'), page.url())
  await page.locator('[data-volver-curso]').click()
  await espera(1500)
  comprobar(r, 'la flechita ‹ vuelve al curso', page.url().endsWith('#/curso'), page.url())
  await page.locator('[data-punto-bloque="0"]').click()
  await espera(900)
  await foto('pagina', true)
  await page.locator('[data-carrusel-bloques]').scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, 120))
  await espera(400)
  const c = await page.locator('[data-carrusel-bloques]').boundingBox()
  await deslizar(300, 210, c.y + c.height / 2, 30)
  comprobar(r, 'carrusel: deslizar a la izquierda → bloque 2', Math.abs((await posicion()) - 1) < 0.01, String(await posicion()))
  await page.locator('[data-punto-bloque="3"]').click()
  await espera(1200)
  comprobar(r, 'carrusel: el puntito lleva a «Próximamente»', Math.abs((await posicion()) - 3) < 0.01, String(await posicion()))
  await foto('pronto')

  // 3. Lineal: la 3.1 está hecha pero el bloque 1 no → en el bloque 2 sale bloqueada.
  await page.goto(BASE + '#/curso/bloque/2')
  await espera(2000)
  comprobar(r, 'bloque 2: insignia + 13 islas', (await page.locator('[data-punto]').count()) === 14, String(await page.locator('[data-punto]').count()))
  comprobar(r, 'bloque 2: la 3.1 hecha sale bloqueada (lineal)', (await page.getByRole('button', { name: /^Tono y semitono\. Bloqueada/ }).count()) === 1)
  comprobar(r, 'bloque 2: «Opcional» bajo la 3.6', (await page.locator('[data-opcional]').count()) === 1)
  const color = (i) => page.$eval(`[data-punto="${i}"] span`, (e) => `${e.style.backgroundColor}|${e.style.border}`)
  comprobar(r, 'puntito de la 3.6: hueco gris', /transparent/.test(await color(13)) && /dashed|solid/.test(await color(13)), await color(13))
  await foto('bloque2-cerrado')

  // 4. Bloque 1 completo + la 3.6: el bloque 1 «Hecho», el carrusel abre en el 2, la 3.6 no cuenta.
  await preparar({ ...BLOQUE1, lecciones: { ...BLOQUE1.lecciones, '3.6': hecha } }, '#/curso')
  comprobar(r, 'bloque 1 completo: 11 de 40 (la 3.6 no cuenta)', /11 de 40/.test(await page.locator('[data-avance-curso]').textContent()))
  comprobar(r, 'bloque 1: «Hecho»', (await page.getAttribute('[data-tarjeta-bloque="1"]', 'data-estado')) === 'hecha')
  comprobar(r, 'carrusel: abre en el bloque 2', Math.abs((await posicion()) - 1) < 0.01, String(await posicion()))
  comprobar(r, '«Sigue aquí» = 3.1', (await page.getAttribute('[data-sigue-aqui]', 'data-sigue-aqui')) === '3.1')
  await foto('bloque1-hecho')
  await page.locator('[data-ver-bloque="2"]').click()
  await espera(2200)
  comprobar(r, 'tocar la tarjeta del centro abre el bloque 2', page.url().endsWith('#/curso/bloque/2'), page.url())
  // En el bloque, la flechita ‹ (en lugar de la casita) vuelve al Curso completo.
  comprobar(r, 'bloque: flechita en lugar de la casita', (await page.locator('[data-volver-curso]').count()) === 1 && (await page.getAttribute('[data-volver-curso]', 'href')) === '#/curso' && (await page.locator('a[aria-label="Inicio"]').count()) === 0)
  comprobar(r, 'bloque 2: 0/12', /0\/12/.test(await page.locator('[data-pagina-bloque] header').textContent()))
  comprobar(r, 'puntito de la 3.1: color de acordes (M4)', /modulo-4/.test(await color(1)), await color(1))
  comprobar(r, 'puntito de la 2.3: gris (bloqueada)', /zinc-300/.test(await color(2)), await color(2))
  comprobar(r, 'la 3.6 hecha: sin «Opcional» y con ✓', (await page.locator('[data-opcional]').count()) === 0 && /modulo-4/.test(await color(13)))
  // La insignia abierta: meta del bloque y «Ver todos los bloques».
  await page.getByRole('button', { name: /^Bloque 2:/ }).first().click()
  await espera(1400)
  comprobar(r, 'insignia: meta del bloque', /Se abre el Flow/.test((await page.locator('[data-meta-bloque]').textContent()) ?? ''))
  await foto('insignia')
  await page.keyboard.press('Escape')
  await espera(800)
  // Deslizar la página de lado pasa al bloque 3; del 3 ya no se pasa.
  await page.evaluate(() => window.scrollTo(0, 0))
  await espera(300)
  await deslizar(340, 30, 420)
  comprobar(r, 'deslizar: bloque 2 → bloque 3', page.url().endsWith('#/curso/bloque/3'), page.url())
  await deslizar(340, 30, 420)
  comprobar(r, 'deslizar: del bloque 3 no hay más', page.url().endsWith('#/curso/bloque/3'), page.url())
  comprobar(r, 'bloque 3: insignia + 18 islas', (await page.locator('[data-punto]').count()) === 19, String(await page.locator('[data-punto]').count()))
  await foto('bloque3')

  comprobar(r, 'sin errores de la página', errores.length === 0, errores.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLOS` : 'TODO OK')
process.exit(fallos ? 1 : 0)
