// Prueba las pantallas con audio en vivo, en claro y oscuro, a 375 px (sintetizador de respaldo):
//  1. Pad de frecuencias (lección 1.1, 3.er paso): retraso del dedo al sonido, sigue sonando al deslizar,
//     silencio al soltar; toneStart + toneStop en el mismo instante también suena.
//  2. Paso «tocar» (lección 1.1, 5.º paso): retraso de la tecla y silencio al final.
//  3. Piano de respuesta del entrenador de oído absoluto: retraso de la tecla y silencio al final.
// Uso: npm run dev -- --port 5199  (o BASE=http://localhost:4173/teoria-musical/ con npm run preview)
//      node docs/pruebas/audio/pantallas.mjs [carpeta-de-capturas]
import { abrir, desde, espera, marca, ms, picoReciente, tecla, toque } from './lib.mjs'

const carpeta = process.argv[2] || null
const resultados = {}

async function retrasoTecla(page, cdp, nota) {
  const m = await marca(page)
  await toque(cdp, await tecla(page, nota), 300)
  await espera(2200)
  const d = await desde(page, m)
  const down = d.eventos.find((e) => e.tipo === 'down')
  return { retrasoMs: d.inicio == null ? null : ms(d.inicio - down.t), pico: +d.max.toFixed(3), silencioAlFinal: +(await picoReciente(page)).toFixed(4) }
}

for (const tema of ['claro', 'oscuro']) {
  const r = (resultados[tema] = {})

  // 1 y 2: lección 1.1
  {
    const progreso = { lecciones: { '1.1': { paso: 2, completada: false } }, retos: {} }
    const { browser, page, cdp, errores } = await abrir({ tema, progreso, ruta: '#/leccion/1.1' })
    const pad = page.locator('[role="slider"][aria-label="Frecuencia"]')
    await pad.waitFor()
    const b = await pad.boundingBox()
    const punto = (p) => ({ x: b.x + b.width / 2, y: b.y + b.height * (1 - p) })
    // Calentar (activa el audio).
    await toque(cdp, punto(0.5), 150)
    await espera(1500)

    r.pad = []
    for (let i = 0; i < 3; i++) {
      const m = await marca(page)
      const ini = punto(0.3)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...ini, id: 1 }] })
      for (let k = 1; k <= 10; k++) {
        await espera(40)
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...punto(0.3 + k * 0.04), id: 1 }] })
      }
      const sonandoAlDeslizar = +(await picoReciente(page, 150)).toFixed(3)
      if (i === 0 && carpeta) await page.screenshot({ path: `${carpeta}/pad-${tema}.png` })
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await espera(1500)
      const d = await desde(page, m)
      const down = d.eventos.find((e) => e.tipo === 'down')
      r.pad.push({ retrasoMs: d.inicio == null ? null : ms(d.inicio - down.t), sonandoAlDeslizar, silencioAlFinal: +(await picoReciente(page)).toFixed(4) })
    }
    // toneStart y toneStop en la misma hora de audio.
    let hay = true
    {
      const m = await marca(page)
      hay = await page.evaluate(async () => {
        // Solo en desarrollo: en el build de producción el código fuente no se sirve suelto.
        const e = await import('/teoria-musical/src/audio/engine.js').catch(() => null)
        if (!e) return false
        e.toneStart(440)
        e.toneStop()
        return true
      })
      await espera(1500)
      const d = await desde(page, m)
      r.padMismoInstante = !hay ? 'solo en desarrollo' : { pico: +d.max.toFixed(3), silencioAlFinal: +(await picoReciente(page)).toFixed(4) }
    }

    // En producción, el import() de la prueba de arriba falla (error de la prueba, no de la app).
    r.erroresPad = errores.filter((e) => !e.includes('ERR_FAILED') && (hay || !e.includes('Failed to load module script')))
    await browser.close()
  }
  {
    // Paso «tocar» (índice 4).
    const progreso = { lecciones: { '1.1': { paso: 4, completada: false } }, retos: {} }
    const { browser, page, cdp, errores } = await abrir({ tema, progreso, ruta: '#/leccion/1.1' })
    await page.locator('[data-note="C4"]').first().waitFor()
    await toque(cdp, await tecla(page, 'A4'), 150) // calentar
    await espera(1500)
    if (carpeta) await page.screenshot({ path: `${carpeta}/tocar-${tema}.png` })
    r.tocar = []
    for (const nota of ['C4', 'E4', 'G4']) r.tocar.push(await retrasoTecla(page, cdp, nota))
    r.erroresTocar = errores.filter((e) => !e.includes('ERR_FAILED'))
    await browser.close()
  }

  // 3: entrenador de oído absoluto, respuesta con el piano.
  {
    const { browser, page, cdp, errores } = await abrir({ tema, ruta: '#/oido/absoluto' })
    await page.getByText('Empezar').first().waitFor()
    await page.getByText('Empezar').first().click()
    await espera(3500) // suena la pregunta (borrador + nota)
    await page.locator('[data-note]').first().waitFor()
    const notas = await page.locator('[data-note]').evaluateAll((els) => els.map((e) => e.getAttribute('data-note')))
    const nota = notas.includes('C4') ? 'C4' : notas[0]
    if (carpeta) await page.screenshot({ path: `${carpeta}/oido-${tema}.png` })
    r.oido = await retrasoTecla(page, cdp, nota)
    if (carpeta) await page.screenshot({ path: `${carpeta}/oido-respuesta-${tema}.png` })
    r.oido.notaTocada = nota
    r.erroresOido = errores.filter((e) => !e.includes('ERR_FAILED'))
    await browser.close()
  }
}

console.log(JSON.stringify(resultados, null, 1))
