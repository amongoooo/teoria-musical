// Prueba el ÁRBOL DE GÉNEROS (Entrenar › Ritmo; propuesta aprobada: https://claude.ai/artifact/DMYBitpKtAtAoQ6fx8yfqE)
// a 375 px en claro y oscuro:
//  - node: árbol (4 troncos, ramas, dos padres), estados (bloqueado, abierto, necesita lección, dominado), opciones y
//    rondas de «Reconócelo», swing (retrasoSwing, sonidoRack), progreso en bits y su combinación;
//  - Entrenar › Ritmo: la tarjeta con candado sin la P1.2 y abierta con ella (con su vista previa y «0/19»);
//  - árbol: troncos, nodos, líneas, ficha; «Escúchalo» = el rack pasa del padre al hijo con oro y, tras una vuelta, ✓;
//  - «Reconócelo»: 5 rondas; con 4 bien pasa;
//  - «Prográmalo»: desde el padre (Pop → Rock: un bombo más); 1.er error en oro, bien → pasa; con las tres, Pop
//    dominado: Rock y Funk se abren con destello; líneas verdes; «2» en el moombahton; «Se abre con la P1.4»;
//  - perilla de Swing en la Caja de ritmos (arrastrar sube, se guarda) y «Empezar con» los géneros abiertos;
//  - sin errores ni scroll de lado.
// Uso: npm run dev -- --port 5199   y   node docs/pruebas/arbol.mjs [carpeta-de-capturas]
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
  const { GENEROS, sonidoRack, retrasoSwing } = await import('../../src/theory/rack.js')
  const G = await import('../../src/theory/generos.js')
  comprobar(r, '4 troncos', G.TRONCOS.join() === 'pop,boomBap,house,dembow')
  comprobar(r, '19 géneros', Object.keys(GENEROS).length === 19, Object.keys(GENEROS).length)
  const primeras = ['rock', 'funk', 'lofi', 'dnb', 'techno', 'garage', 'dominicano', 'moombah', 'afro']
  comprobar(r, 'primeras ramas sin lección extra', primeras.every((id) => GENEROS[id]?.padres && !GENEROS[id].leccion))
  comprobar(r, 'moombahton: dos padres', GENEROS.moombah.padres.join() === 'dembow,house')
  comprobar(r, 'todos con cambio y tronco', Object.values(GENEROS).every((g) => g.cambio && G.TRONCOS.includes(g.tronco)))
  comprobar(r, 'niveles del boom bap', JSON.stringify(G.nivelesDe('boomBap')) === '[["boomBap"],["lofi","trap","dnb"],["drill","phonk"]]')
  const sin = { lecciones: {} }
  const con = { lecciones: { '12.2': { completada: true } } }
  const dom = (lista) => (x) => lista.includes(x)
  comprobar(r, 'sin la P1.2 todo bloqueado', Object.keys(GENEROS).every((id) => G.estadoGenero(id, { domina: dom([]), progreso: sin }) === 'bloqueado'))
  comprobar(r, 'con la P1.2: los 5 abiertos', ['pop', 'boomBap', 'trap', 'house', 'dembow'].every((id) => G.estadoGenero(id, { domina: dom([]), progreso: con }) === 'abierto'))
  comprobar(r, 'rock bloqueado hasta dominar el pop', G.estadoGenero('rock', { domina: dom([]), progreso: con }) === 'bloqueado' && G.estadoGenero('rock', { domina: dom(['pop']), progreso: con }) === 'abierto')
  comprobar(r, 'moombahton pide los dos', G.estadoGenero('moombah', { domina: dom(['dembow']), progreso: con }) === 'bloqueado' && G.estadoGenero('moombah', { domina: dom(['dembow', 'house']), progreso: con }) === 'abierto')
  comprobar(r, 'reggaetón espera la P1.4', G.estadoGenero('reggaeton', { domina: dom(['dembow']), progreso: con }) === 'leccion')
  comprobar(r, 'admin: todo abierto', G.estadoGenero('drill', { domina: dom([]), progreso: sin, admin: true }) === 'abierto')
  comprobar(r, 'se abren con el pop: rock y funk', G.seAbrenCon('pop', { domina: dom(['pop']), progreso: con }).join() === 'rock,funk')
  comprobar(r, 'opciones del rock', G.opcionesReconoce('rock').join() === 'rock,pop,funk')
  comprobar(r, 'opciones del pop = troncos', G.opcionesReconoce('pop').join() === 'pop,boomBap,house,dembow')
  let ok = true
  for (let i = 0; i < 200; i++) {
    const rs = G.rondasReconoce('trap')
    if (rs.length !== 5 || rs.filter((x) => x === 'trap').length < 2 || rs.some((x, k) => k && x === rs[k - 1])) ok = false
  }
  comprobar(r, 'rondas: 5, el buscado 2+ veces, sin repetir seguido', ok)
  comprobar(r, 'swing: solo los pasos impares', retrasoSwing(1, 1) === 1 / 3 && retrasoSwing(2, 1) === 0 && retrasoSwing(3, 0.5) === 1 / 6)
  const s = sonidoRack({ hat: [0, 1] }, { swing: 0.6 })
  comprobar(r, 'sonidoRack con swing', s.groove.find((e) => e.inicio > 1)?.inicio === 1.2)
  const P = await import('../../src/progress/generos.js')
  comprobar(r, 'combinar = O de bits', JSON.stringify(P.combinarGeneros({ rock: 1, pop: 7 }, { rock: 6, nada: 7, funk: 9 })) === '{"rock":7,"pop":7,"funk":1}')
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
  const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: carpeta ? 2 : 1, hasTouch: true })
  const foto = (n) => carpeta && page.screenshot({ path: `${carpeta}/${n}-${tema}.png`, fullPage: true })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))
  const avisos = []
  page.on('console', (m) => m.type() === 'error' && /key|React/.test(m.text()) && avisos.push(m.text().slice(0, 160)))
  const sinScroll = async (nombre) => {
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
    comprobar(r, `${nombre}: sin scroll de lado`, ancho <= 375, ancho)
  }

  const preparar = async ({ progreso = {}, generos = null, ruta }) => {
    await page.goto(BASE)
    await page.evaluate(
      ([tema, progreso, generos]) => {
        localStorage.clear()
        localStorage.setItem('teoria-musical:opciones:v1', JSON.stringify({ tema }))
        localStorage.setItem('teoria-musical:progreso:v1', JSON.stringify({ lecciones: {}, retos: {}, ...progreso }))
        if (generos) localStorage.setItem('teoria-musical:generos:v1', JSON.stringify({ pruebas: generos }))
      },
      [tema, progreso, generos],
    )
    await page.goto(BASE + ruta)
    await page.reload()
    await espera(700)
  }
  const P12 = { lecciones: { '12.1': { completada: true }, '12.2': { completada: true } } }

  // Entrenar › Ritmo: con candado y abierta
  await preparar({ ruta: '#/entrenar/ritmo' })
  const tarjeta = page.locator('[data-ejercicio-entrenar="generos"]')
  comprobar(r, 'Entrenar: con candado sin la P1.2', (await tarjeta.getAttribute('data-bloqueado')) !== null && (await tarjeta.textContent()).includes('Termina la P1.2'))
  await preparar({ progreso: P12, ruta: '#/entrenar/ritmo' })
  comprobar(r, 'Entrenar: abierta con la P1.2 y «0/19»', (await tarjeta.getAttribute('data-bloqueado')) === null && (await tarjeta.textContent()).includes('0/19'))
  comprobar(r, 'vista previa del árbol', (await page.locator('[data-vista-previa="generos"]').count()) === 1)
  await sinScroll('Entrenar')
  await foto('arbol-entrenar')
  await tarjeta.click()
  await espera(600)
  comprobar(r, 'la tarjeta abre el árbol', page.url().endsWith('#/generos'))

  // Árbol del pop
  await espera(400)
  comprobar(r, 'tronco Pop elegido', (await page.locator('[data-tronco="pop"]').getAttribute('aria-selected')) === 'true')
  comprobar(r, 'pop abierto, rock y funk bloqueados', (await page.locator('[data-genero="pop"]').getAttribute('data-estado')) === 'abierto' && (await page.locator('[data-genero="rock"]').getAttribute('data-estado')) === 'bloqueado')
  comprobar(r, 'dos líneas grises', (await page.locator('[data-linea]').count()) === 2 && (await page.locator('[data-linea][data-viva]').count()) === 0)
  comprobar(r, 'ficha del pop con sus 3 pruebas', (await page.locator('[data-ficha="pop"] [data-prueba]').count()) === 3)
  await sinScroll('árbol')
  await foto('arbol-pop')
  // Rock bloqueado: aviso
  await page.locator('[data-genero="rock"]').click()
  await espera(300)
  comprobar(r, 'rock: «Domina Pop para abrirlo.»', (await page.locator('[data-aviso-bloqueo]').textContent()).includes('Domina Pop para abrirlo'))
  // Escúchalo en el pop (tronco): una vuelta → ✓
  await page.locator('[data-genero="pop"]').click()
  await espera(300)
  await page.locator('[data-ficha="pop"] [data-rack-play]').click()
  await page.waitForSelector('[data-ficha="pop"] [data-prueba="escucha"][data-ok]', { timeout: 8000 }).catch(() => null)
  comprobar(r, 'Escúchalo: ✓ tras una vuelta', (await page.locator('[data-ficha="pop"] [data-prueba="escucha"][data-ok]').count()) === 1)
  await page.locator('[data-ficha="pop"] [data-rack-play]').click()

  // Reconócelo (pop): 5 rondas, todas bien (se lee la respuesta del texto «¡Eso es!»: se responde con la buena)
  await page.locator('[data-ficha="pop"] [data-prueba="reconoce"] a').click()
  await page.waitForSelector('[data-prueba-reconoce="pop"]')
  await espera(700)
  await sinScroll('Reconócelo')
  comprobar(r, 'Reconócelo: opciones bloqueadas antes de escuchar', await page.locator('[data-opcion]').first().isDisabled())
  const nombres = { Pop: 'pop', 'Boom bap': 'boomBap', House: 'house', Dembow: 'dembow' }
  for (let k = 0; k < 5; k++) {
    if (k === 0) await page.locator('[data-escuchar]').click()
    await espera(200)
    // Para saber cuál suena, se prueba con la primera opción; si falla, el aviso dice «Era X».
    const ronda = await page.evaluate(() => window.__rondaGenero ?? null)
    const opcion = ronda ? page.locator(`[data-opcion="${ronda}"]`) : page.locator('[data-opcion]').first()
    await opcion.click()
    await espera(250)
    if (k === 0) await foto('arbol-reconoce')
    await page.locator('[data-boton-accion] button').first().click()
    await espera(250)
  }
  void nombres
  comprobar(r, 'Reconócelo: 5/5 y pasa', (await page.locator('[data-fin-reconoce="pasa"]').count()) === 1)
  await page.locator('[data-boton-accion] button').first().click()
  await espera(700)
  comprobar(r, 'vuelve al árbol con el pop', page.url().endsWith('#/generos') && (await page.locator('[data-ficha="pop"]').count()) === 1)
  comprobar(r, 'dos de tres puntitos', (await page.locator('[data-ficha="pop"] [data-prueba][data-ok]').count()) === 2)

  // Prográmalo (pop, tronco: desde cero) con un error primero
  await page.locator('[data-ficha="pop"] [data-prueba="programa"] a').click()
  await page.waitForSelector('[data-prueba-programa="pop"]')
  await espera(700)
  const celda = (fila, paso) => page.locator(`[data-prueba-programa] [data-fila="${fila}"] [data-paso="${paso}"]`)
  comprobar(r, 'Prográmalo: el tronco empieza vacío', (await page.locator('[data-prueba-programa] [data-fila] [data-on]').count()) === 0)
  for (const p of [0, 8, 3]) await celda('kick', p).click()
  for (const p of [4, 12]) await celda('snare', p).click()
  for (const p of [0, 2, 4, 6, 8, 10, 12, 14]) await celda('hat', p).click()
  await page.locator('[data-boton-accion] button').first().click()
  await espera(300)
  comprobar(r, '1.er error: oro tachado en el que sobra', (await celda('kick', 3).getAttribute('data-marca')) === 'sobra')
  comprobar(r, '1.er error: aviso del bombo', (await page.locator('[data-tarjeta-info]').textContent()).includes('Al bombo le sobra 1'))
  await foto('arbol-programa')
  await celda('kick', 3).click()
  await page.locator('[data-boton-accion] button').first().click()
  await espera(300)
  comprobar(r, 'Prográmalo: «¡Así suena!»', (await page.locator('[data-tarjeta-info]').textContent()).includes('¡Así suena!'))
  await page.locator('[data-boton-accion] button').first().click()
  await espera(900)
  comprobar(r, 'pop dominado', (await page.locator('[data-genero="pop"]').getAttribute('data-estado')) === 'dominado')
  comprobar(r, '«¡Pop dominado! Se abren: Rock y Funk.»', ((await page.locator('[data-logro]').textContent().catch(() => '')) ?? '').includes('Se abren: Rock y Funk'))
  comprobar(r, 'rock y funk abiertos', (await page.locator('[data-genero="rock"]').getAttribute('data-estado')) === 'abierto' && (await page.locator('[data-genero="funk"]').getAttribute('data-estado')) === 'abierto')
  comprobar(r, 'líneas verdes', (await page.locator('[data-linea][data-viva]').count()) === 2)
  comprobar(r, 'tronco con ✓ en el selector', (await page.locator('[data-tronco="pop"] [data-tronco-dominado]').count()) === 1)
  await foto('arbol-dominado')

  // Rock: el rack pasa del pop al rock con el bombo nuevo en oro
  await page.locator('[data-genero="rock"]').click()
  await espera(300)
  comprobar(r, 'rock: el rack empieza con el padre', (await page.locator('[data-rack-genero="rock"]').getAttribute('data-fase')) === 'padre')
  await page.locator('[data-ficha="rock"] [data-rack-play]').click()
  await page.waitForSelector('[data-rack-genero="rock"][data-fase="hijo"]', { timeout: 6000 }).catch(() => null)
  const cambios = await page.locator('[data-ficha="rock"] [data-cambio]').evaluateAll((l) => l.map((e) => e.closest('[data-fila]').dataset.fila + ':' + e.closest('[data-paso]').dataset.paso))
  comprobar(r, 'pop → rock: oro solo en el bombo de la «y» del 3', cambios.join() === 'kick:10', cambios.join())
  await page.locator('[data-ficha="rock"] [data-rack-play]').click()

  // Prográmalo del rock: empieza con el pop
  await page.goto(BASE + '#/generos/rock/programa')
  await page.waitForSelector('[data-prueba-programa="rock"]')
  await espera(700)
  comprobar(r, 'rock: Prográmalo empieza con el pop', (await celda('kick', 0).getAttribute('data-on')) !== null && (await celda('kick', 8).getAttribute('data-on')) !== null)
  comprobar(r, 'Comprobar apagado sin cambios', await page.locator('[data-boton-accion] button').first().isDisabled())

  // Dembow: moombahton con «2» y la P1.4
  await preparar({ progreso: P12, generos: { dembow: 7 }, ruta: '#/generos' })
  await page.locator('[data-tronco="dembow"]').click()
  await espera(400)
  comprobar(r, 'moombahton: «2» y bloqueado (falta el house)', (await page.locator('[data-genero="moombah"]').getAttribute('data-estado')) === 'bloqueado' && (await page.locator('[data-genero="moombah"]').textContent()).includes('2'))
  comprobar(r, 'reggaetón: necesita la P1.4', (await page.locator('[data-genero="reggaeton"]').getAttribute('data-estado')) === 'leccion' && (await page.locator('[data-genero="reggaeton"]').textContent()).includes('P1.4'))
  comprobar(r, 'línea punteada desde el house', (await page.locator('[data-linea="house-moombah"]').count()) === 1)
  await page.locator('[data-genero="reggaeton"]').click()
  await espera(300)
  comprobar(r, 'reggaetón: «Se abre con la P1.4.»', (await page.locator('[data-aviso-bloqueo]').textContent()).includes('Se abre con la P1.4'))
  await page.locator('[data-genero="moombah"]').click()
  await espera(300)
  comprobar(r, 'moombahton: «Domina House para abrirlo.»', (await page.locator('[data-aviso-bloqueo]').textContent()).includes('Domina House'))
  comprobar(r, 'un solo árbol a la vez', (await page.locator('[data-ramas]').count()) === 1)
  await sinScroll('dembow')
  await foto('arbol-dembow')
  // Afrobeats: la perilla de swing (solo se ve)
  await page.locator('[data-genero="afro"]').click()
  await espera(300)
  await page.locator('[data-ficha="afro"] [data-rack-play]').click()
  await page.waitForSelector('[data-rack-genero="afro"][data-fase="hijo"]', { timeout: 6000 }).catch(() => null)
  comprobar(r, 'afrobeats: perilla de swing a 30 %', (await page.locator('[data-ficha="afro"] [data-perilla="swing"]').getAttribute('data-valor')) === '30')
  await page.locator('[data-ficha="afro"] [data-rack-play]').click()

  // Boom bap: tres filas del árbol
  await page.locator('[data-tronco="boomBap"]').click()
  await espera(400)
  await sinScroll('boom bap')
  await foto('arbol-boombap')

  // Caja de ritmos: perilla de swing y «Empezar con» los abiertos
  await preparar({ progreso: P12, generos: { pop: 7 }, ruta: '#/caja' })
  const inicios = await page.locator('[data-inicio]').evaluateAll((l) => l.map((e) => e.dataset.inicio))
  comprobar(r, 'Caja: «Empezar con» los abiertos', inicios.join() === 'pop,rock,funk,boomBap,trap,house,dembow,vacio', inicios.join())
  const perilla = page.locator('[data-perilla="swing"] [role="slider"]')
  const caja = await perilla.boundingBox()
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2)
  await page.mouse.down()
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2 - 80, { steps: 8 })
  await page.mouse.up()
  const valor = Number(await page.locator('[data-perilla="swing"]').getAttribute('data-valor'))
  comprobar(r, 'Caja: arrastrar hacia arriba sube el swing', valor >= 45 && valor <= 55, valor)
  await espera(300)
  const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('teoria-musical:caja:v1')).swing)
  comprobar(r, 'Caja: el swing se guarda', Math.round(guardado * 100) === valor, guardado)
  await page.locator('[data-inicio="rock"]').click()
  await espera(200)
  comprobar(r, 'Caja: rock a 120 y swing 0', (await page.locator('[data-bpm]').getAttribute('data-bpm')) === '120' && (await page.locator('[data-perilla="swing"]').getAttribute('data-valor')) === '0')
  await sinScroll('Caja')
  await foto('arbol-caja')

  comprobar(r, 'sin errores', errores.length === 0, errores.join(' | '))
  comprobar(r, 'sin avisos de React', avisos.length === 0, avisos.join(' | '))
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 2))
console.log(fallos ? `${fallos} FALLAS` : 'TODO BIEN')
process.exit(fallos ? 1 : 0)
