// Mide el retraso de las teclas, el toque rápido y lo programado, con sintetizador y con Sampler.
import { abrir, desde, espera, marca, motor, ms, picoReciente, tecla, toque } from './lib.mjs'

const resultados = {}

for (const samples of ['no', 'si']) {
  const nombre = samples === 'si' ? 'sampler' : 'sintetizador'
  const r = (resultados[nombre] = {})
  const { browser, page, cdp, errores, avisos } = await abrir({ samples, ruta: '#/piano' })
  await page.locator('[data-note="C4"]').first().waitFor()
  const do4 = await tecla(page, 'C4')
  const mi4 = await tecla(page, 'E4')
  const sol4 = await tecla(page, 'G4')

  // Calentar: el primer toque activa el audio.
  await toque(cdp, do4, 150)
  await espera(2600)
  r.estado = await motor(page, 'getStatus')
  r.sondaLista = await page.evaluate(() => window.__tap.listo)
  r.silencioInicial = await picoReciente(page)

  // 1. Retraso: del dedo al primer sonido (tecla mantenida 400 ms), 5 veces.
  r.retrasoMs = []
  r.colaTrasSoltarMs = []
  for (let i = 0; i < 5; i++) {
    const m = await marca(page)
    await toque(cdp, do4, 400)
    await espera(2600)
    const d = await desde(page, m)
    const down = d.eventos.find((e) => e.tipo === 'down')
    const up = d.eventos.find((e) => e.tipo === 'up')
    r.retrasoMs.push(ms(d.inicio - down.t))
    r.colaTrasSoltarMs.push(ms(d.fin - up.t))
  }

  // 2. Toque rapidísimo (apoyar y soltar seguido): ¿suena? ¿queda en silencio?
  r.toqueRapido = []
  for (let i = 0; i < 5; i++) {
    const m = await marca(page)
    await toque(cdp, mi4, 0)
    await espera(2600)
    const d = await desde(page, m)
    const down = d.eventos.find((e) => e.tipo === 'down')
    const up = d.eventos.find((e) => e.tipo === 'up')
    r.toqueRapido.push({ dedoMs: ms(up.t - down.t), retrasoMs: d.inicio == null ? null : ms(d.inicio - down.t), pico: +d.max.toFixed(3), silencioAlFinal: +(await picoReciente(page)).toFixed(4) })
  }

  // 3. Peor caso: noteOn y noteOff en el mismo instante (misma hora de audio).
  {
    const m = await marca(page)
    await page.evaluate(async () => {
      const e = await import('/teoria-musical/src/audio/engine.js')
      e.noteOn('G4')
      e.noteOff('G4')
    })
    await espera(2600)
    const d = await desde(page, m)
    r.mismoInstante = { pico: +d.max.toFixed(3), retrasoMs: d.inicio == null ? null : ms(d.inicio - m.t), silencioAlFinal: +(await picoReciente(page)).toFixed(4) }
  }

  // 4. Ráfaga: 16 toques muy rápidos en teclas distintas y acordes de 3 dedos soltados al instante.
  {
    const m = await marca(page)
    for (let i = 0; i < 16; i++) await toque(cdp, [do4, mi4, sol4][i % 3], 0)
    for (let i = 0; i < 4; i++) await toque(cdp, [do4, mi4, sol4], 0)
    for (let i = 0; i < 4; i++) await toque(cdp, [do4, mi4, sol4], 30)
    await espera(3000)
    const d = await desde(page, m)
    r.rafaga = { pico: +d.max.toFixed(3), silencioAlFinal: +(await picoReciente(page)).toFixed(4) }
  }

  // 5. Lo programado: playNotes debe empezar igual que antes (ahora + margen + 0,05 s).
  r.programadoMs = []
  for (let i = 0; i < 3; i++) {
    const m = await marca(page)
    const t0 = await page.evaluate(async () => {
      const e = await import('/teoria-musical/src/audio/engine.js')
      const t = window.__tap.ctx.currentTime
      e.playNotes('A4', { duracion: 0.3 })
      return t
    })
    await espera(2200)
    const d = await desde(page, m)
    r.programadoMs.push(ms(d.inicio - t0))
  }
  // Ritmo en bucle: el primer tiempo va 0,15 s después.
  {
    const m = await marca(page)
    const dato = await page.evaluate(async () => {
      const e = await import('/teoria-musical/src/audio/engine.js')
      const t = e.tiempoAudio()
      const ritmo = e.iniciarRitmo([{ nota: 'click', inicio: 0 }], { bpm: 120, casillas: 8, porTiempo: 2 })
      await new Promise((r) => setTimeout(r, 700))
      ritmo.parar()
      return { t, inicio: ritmo.inicio }
    })
    await espera(600)
    const d = await desde(page, m)
    r.ritmo = { inicioProgramadoMs: ms(dato.inicio - dato.t), primerSonidoMs: ms(d.inicio - dato.t) }
  }

  r.errores = errores
  r.avisos = avisos
  await browser.close()
}

console.log(JSON.stringify(resultados, null, 1))
