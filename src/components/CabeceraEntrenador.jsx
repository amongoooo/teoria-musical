import { animate, motion, useMotionValue } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Atras, Bocina } from '../ui/Iconos.jsx'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import useTemblor from '../ui/useTemblor.js'
import { VIDRIO } from '../ui/vidrio.js'

/**
 * Cabecera de vidrio de un entrenador (oído y ritmo): la flechita ‹ para volver a su panel, la píldora con la barra
 * de aciertos para subir de nivel (y, ya jugando, debajo la de vidas) y la bocina para escuchar otra vez.
 *  - barra: { clave, avance, lleno, reloj, parado, acento } (ver BarraAciertos)
 *  - vidas: { actual, max } o null (con ∞ o sin jugar no sale)
 *  - bocina: { onClick, disabled, sonando } o null (sin jugar no sale)
 *  - golpes: cuántas vidas se han perdido (cada vez que sube, los vidrios brillan en rojo y tiemblan)
 */
export default function CabeceraEntrenador({ volver, etiquetaVolver, golpes = 0, barra, vidas, bocina }) {
  return (
    <header className="pointer-events-none sticky top-0 z-10">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-3 pb-2">
        <Golpe n={golpes}>
          <Pulsable
            href={volver}
            aria-label={etiquetaVolver}
            className={`pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full text-zinc-700 ${VIDRIO}`}
          >
            <Atras className="size-6" />
          </Pulsable>
        </Golpe>
        <Golpe n={golpes} className="min-w-0 flex-1">
          {/* Píldora de vidrio: arriba los aciertos y, ya jugando, debajo las vidas (barra roja lisa; con ∞ no sale). */}
          <div className={`flex min-h-11 w-full min-w-0 flex-col justify-center gap-1.5 rounded-full px-4 py-2 ${VIDRIO}`}>
            <BarraAciertos key={barra.clave} avance={barra.avance} lleno={barra.lleno} reloj={barra.reloj} parado={barra.parado} acento={barra.acento} />
            {vidas && <BarraVidas actual={vidas.actual} max={vidas.max} />}
          </div>
        </Golpe>
        {/* Escuchar otra vez: solo la bocina (pedido del usuario). */}
        {bocina && (
          <Golpe n={golpes}>
            <Pulsable
              onClick={bocina.onClick}
              disabled={bocina.disabled}
              aria-label="Escuchar otra vez"
              data-escuchar
              className={`pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${VIDRIO} ${
                bocina.sonando ? 'text-sky-500' : 'text-zinc-700'
              }`}
            >
              <Bocina className="size-6" />
            </Pulsable>
          </Golpe>
        )}
      </div>
    </header>
  )
}

/**
 * Barra de arriba del entrenador (pedido del usuario): se llena con los aciertos que faltan para subir de nivel.
 * En Contrarreloj tiene doble función: mientras se borra la referencia sigue mostrando los aciertos y, justo antes de
 * que suene la nota, se vacía; al sonar se va llenando con el tiempo, en amarillo (`fijate`). Al responder —o si se
 * llena: fallo— primero vuelve a donde estaba, ahí recupera el color de la dificultad, y luego suma (o pierde) el
 * acierto. Al subir de nivel se llena del todo y vuelve a empezar.
 */
function BarraAciertos({ avance, lleno, reloj, parado, acento }) {
  const w = useMotionValue(avance)
  const previo = useRef(avance)
  const [tono, setTono] = useState('aciertos') // aciertos | tiempo
  const [modoBarra, setModoBarra] = useState('aciertos')
  const corriendo = Boolean(reloj) && !parado

  useEffect(() => {
    let cancelado = false
    let anim = null
    let raf = 0
    const ir = (v, t = RESORTE.suave) =>
      new Promise((listo) => {
        anim = animate(w, v, { ...t, onComplete: listo })
      })
    const espera = (ms) => new Promise((listo) => setTimeout(listo, ms))
    if (corriendo) {
      // Se vacía y, al sonar la nota, se llena con el tiempo.
      ;(async () => {
        // Espera a que esté por acabar el borrador de la referencia: no se vacía antes.
        const VACIAR = 300
        const falta = reloj.desde - VACIAR - performance.now()
        if (falta > 0) await espera(falta)
        if (cancelado) return
        setModoBarra('tiempo')
        await ir(0, { duration: VACIAR / 1000, ease: 'easeOut' })
        if (cancelado) return
        setTono('tiempo')
        const paso = () => {
          if (cancelado) return
          const f = Math.max(0, Math.min(1, (performance.now() - reloj.desde) / (reloj.hasta - reloj.desde)))
          w.set(f)
          if (f < 1) raf = requestAnimationFrame(paso)
        }
        paso()
      })()
    } else {
      ;(async () => {
        // Primero vuelve a donde estaba (si el reloj la movió) y luego suma o resta el acierto.
        if (Math.abs(w.get() - previo.current) > 0.001) {
          await ir(previo.current, RESORTE.pantalla)
          if (cancelado) return
        }
        setTono('aciertos')
        setModoBarra('aciertos')
        if (lleno) {
          await ir(1)
          if (cancelado) return
          await espera(250)
          if (cancelado) return
          w.set(0)
        }
        await ir(avance)
        if (!cancelado) previo.current = avance
      })()
    }
    return () => {
      cancelado = true
      anim?.stop()
      cancelAnimationFrame(raf)
    }
  }, [corriendo, reloj, avance, lleno, w])

  const color = tono === 'tiempo' ? 'var(--color-fijate)' : acento
  return (
    <div
      className="h-3 w-full shrink-0 overflow-hidden rounded-full bg-zinc-200"
      role="progressbar"
      aria-label={modoBarra === 'tiempo' ? 'Tiempo para responder' : 'Aciertos para subir de nivel'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(avance * 100)}
      data-barra-aciertos={modoBarra}
    >
      <motion.div
        className="h-full w-full origin-left rounded-full transition-colors duration-200"
        style={{ scaleX: w, backgroundColor: color }}
      />
    </div>
  )
}

/**
 * Vidas de la partida (pedido del usuario): barra roja LISA debajo de la de aciertos (no en partes); se acorta o
 * crece con un resorte. Solo sale jugando y con vidas contadas (con ∞, no).
 */
function BarraVidas({ actual, max }) {
  return (
    <motion.div
      className="h-2 overflow-hidden rounded-full bg-zinc-200"
      role="img"
      aria-label={`${actual} de ${max} vidas`}
      data-vidas={actual}
      data-vidas-max={max}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 8 }}
      transition={RESORTE.suave}
    >
      <motion.div
        className="h-full w-full origin-left rounded-full bg-vida"
        initial={false}
        animate={{ scaleX: Math.max(0, actual) / max }}
        transition={RESORTE.pulsar}
      />
    </motion.div>
  )
}

/**
 * Al perder una vida (pedido del usuario): el vidrio de dentro brilla levemente en rojo y tiembla (`useTemblor`, la
 * misma animación de toda la app). `n` cuenta los golpes: cada vez que sube, brilla y tiembla.
 */
function Golpe({ n, className = 'shrink-0', children }) {
  const [ref, temblar] = useTemblor()
  const antes = useRef(n)
  useEffect(() => {
    if (n > antes.current) temblar()
    antes.current = n
  }, [n, temblar])
  return (
    <div ref={ref} className={`relative ${className}`} data-golpes={n}>
      {children}
      {n > 0 && (
        <motion.span
          key={n}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ backgroundColor: 'color-mix(in oklab, var(--color-vida) 14%, transparent)', boxShadow: '0 0 14px 1px color-mix(in oklab, var(--color-vida) 55%, transparent)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, times: [0, 0.2, 1] }}
        />
      )}
    </div>
  )
}
