import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { bucleRack, golpeAhora, latenciaAudio, tiempoAudio } from '../audio/engine.js'
import { FILAS_RACK, PASOS, POR_TIEMPO, conPaso, encendido, velocidad } from '../theory/rack.js'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { IconoPlay } from './BotonSonido.jsx'

/**
 * CHANNEL RACK táctil (Producción 1; S1 en content/INTERACCIONES.md), como el de FL Studio: una fila por sonido y
 * 16 pasos en 4 grupos de tono alterno (uno por tiempo). Tocar un paso lo enciende o lo apaga; arrastrar el dedo por
 * la fila pinta (o borra) todos los que cruza, como en FL. «Reproducir» lo repite en bucle y el cabezal azul lo
 * recorre; lo que cambias se oye al tiempo siguiente. La luz de cada fila la silencia (como el botón verde de FL).
 *
 * Props:
 *  - filas: ['kick', 'clap', 'hat', 'tom'] (theory/rack.js → FILAS_RACK)
 *  - patron: { kick: [0, 7, 10], … } (controlado) · onCambio(patron): sin él, solo se escucha
 *  - fijas: filas que no se pueden cambiar (las que ya vienen dadas en un ejercicio)
 *  - mudas / onMudas: filas silenciadas (controlado; sin onMudas, la luz no se toca)
 *  - bpm, color (el acento del área)
 *  - guia: patrón con contorno punteado (lo que hay que poner) · marcas: { 'kick:7': 'sobra' | 'mal' }
 *      'sobra' = paso de más (oro, tachado: primer error) · 'mal' = el que faltaba (contorno rojo grueso sobre rojo
 *      suave: segundo error; no relleno, porque el rojo coral de Producción es el de los pasos encendidos)
 *  - alPaso(paso, audibles): cuando se OYE cada paso del bucle (audibles = filas que suenan en ese momento)
 *      'cambio' = paso que acaba de cambiar al pasar de un género a otro (contorno de oro que se apaga solo; P1.2)
 *  - extra: algo más en la barra de arriba (el tempo de la Caja de ritmos)
 *  - api: ref que recibe { empezar, sonando } (para arrancar el bucle desde fuera, p. ej. al elegir un género)
 */
export default function ChannelRack({ filas, patron, onCambio, fijas = [], mudas = [], onMudas, bpm = 90, color = 'var(--color-produccion)', guia = null, marcas = null, alPaso, extra = null, api = null }) {
  const [sonando, setSonando] = useState(false)
  const [cabezal, setCabezal] = useState(null)
  const bucle = useRef(null)
  const reloj = useRef(0)
  const actual = useRef({ patron, mudas, filas, alPaso })
  actual.current = { patron, mudas, filas, alPaso }
  const editable = Boolean(onCambio)

  const parar = () => bucle.current?.parar()
  useEffect(() => () => parar(), [])
  // El tempo cambia: el bucle vuelve a empezar con el nuevo (solo si ya sonaba).
  useEffect(() => {
    if (bucle.current) empezar()
  }, [bpm]) // eslint-disable-line react-hooks/exhaustive-deps

  const empezar = () => {
    cancelAnimationFrame(reloj.current)
    const b = bucleRack(
      (p) => {
        const { patron: pa, mudas: mu, filas: fi } = actual.current
        return fi.filter((f) => !mu.includes(f) && encendido(pa, f, p)).map((f) => ({ nota: f, velocity: velocidad(f, p) }))
      },
      {
        bpm,
        alParar: () => {
          if (bucle.current === b) bucle.current = null
          cancelAnimationFrame(reloj.current)
          setSonando(false)
          setCabezal(null)
        },
      },
    )
    bucle.current = b
    setSonando(true)
    let ultimo = -1
    const tic = () => {
      if (bucle.current !== b) return
      const pos = (tiempoAudio() - b.inicio - latenciaAudio()) / b.paso
      if (pos >= 0) {
        const s = Math.floor(pos) % PASOS
        if (s !== ultimo) {
          ultimo = s
          setCabezal(s)
          const { mudas: mu, filas: fi, alPaso: ap } = actual.current
          ap?.(s, fi.filter((f) => !mu.includes(f)))
        }
      }
      reloj.current = requestAnimationFrame(tic)
    }
    reloj.current = requestAnimationFrame(tic)
  }

  const alternar = () => (sonando ? parar() : empezar())
  if (api) api.current = { empezar: () => !bucle.current && empezar(), sonando: () => Boolean(bucle.current) }

  // ----- Pintar con el dedo -----
  const arrastre = useRef(null)
  // El paso bajo el dedo (los grupos tienen hueco entre ellos: se busca la casilla; si el dedo cae en un hueco o fuera,
  // la más cercana por su posición en la fila).
  const pasoDe = (e, el) => {
    const casilla = document.elementFromPoint?.(e.clientX, e.clientY)?.closest?.('[data-paso]')
    if (casilla && el.contains(casilla)) return Number(casilla.dataset.paso)
    const r = el.getBoundingClientRect()
    return Math.min(PASOS - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * PASOS)))
  }
  const poner = (fila, paso, valor) => {
    const { patron: pa } = actual.current
    if (encendido(pa, fila, paso) === valor) return
    if (valor && !bucle.current) golpeAhora(fila, velocidad(fila, paso))
    const nuevo = conPaso(pa, fila, paso, valor)
    actual.current.patron = nuevo
    onCambio(nuevo)
  }
  const onDown = (fila) => (e) => {
    if (!editable || fijas.includes(fila)) return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const p = pasoDe(e, e.currentTarget)
    const valor = !encendido(actual.current.patron, fila, p)
    arrastre.current = { fila, valor, pointer: e.pointerId, ultimo: p }
    poner(fila, p, valor)
  }
  const onMove = (e) => {
    const a = arrastre.current
    if (!a || a.pointer !== e.pointerId) return
    const p = pasoDe(e, e.currentTarget)
    if (p === a.ultimo) return
    // Si el dedo va rápido, también los pasos que saltó.
    const [de, a2] = p > a.ultimo ? [a.ultimo + 1, p] : [p, a.ultimo - 1]
    for (let i = de; i <= a2; i++) poner(a.fila, i, a.valor)
    a.ultimo = p
  }
  const onUp = (e) => {
    if (arrastre.current?.pointer === e.pointerId) arrastre.current = null
  }
  const teclado = (fila, paso) => (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (editable && !fijas.includes(fila)) poner(fila, paso, !encendido(patron, fila, paso))
  }

  const silenciar = (fila) => {
    const muda = mudas.includes(fila)
    onMudas(muda ? mudas.filter((f) => f !== fila) : [...mudas, fila])
    if (muda && !sonando) golpeAhora(fila, velocidad(fila, 0))
  }

  const tiempoActual = cabezal === null ? null : Math.floor(cabezal / POR_TIEMPO)
  const sinToque = { touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }

  return (
    <div className="flex flex-col gap-3" data-rack={sonando ? 'sonando' : 'quieto'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Pulsable
          onClick={alternar}
          data-rack-play
          aria-pressed={sonando}
          className={`flex min-h-12 items-center gap-3 rounded-2xl border py-1.5 pl-2 pr-4 text-base font-medium transition-colors duration-200 ${
            sonando ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-zinc-200 bg-white text-zinc-800'
          }`}
        >
          <IconoPlay sonando={sonando} />
          {sonando ? 'Parar' : 'Reproducir'}
        </Pulsable>
        {extra ?? <span className="font-dato text-base font-medium tabular-nums text-zinc-600">{bpm} BPM</span>}
      </div>

      <div className="flex flex-col gap-1.5 rounded-3xl border border-zinc-200 bg-white p-2 select-none" onContextMenu={(e) => e.preventDefault()}>
        {/* Números de los tiempos: el que suena se marca */}
        <div className="flex items-center gap-2" aria-hidden>
          <span className="w-[4.75rem] shrink-0" />
          <div className="grid flex-1 grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((t) => (
              <span key={t} className={`pl-0.5 font-dato text-sm font-medium tabular-nums transition-colors duration-150 ${tiempoActual === t ? 'text-sky-600' : 'text-zinc-500'}`}>
                {t + 1}
              </span>
            ))}
          </div>
        </div>

        {filas.map((f) => {
          const muda = mudas.includes(f)
          const info = FILAS_RACK[f]
          return (
            <div key={f} className="flex items-center gap-2" data-fila={f} data-muda={muda || undefined}>
              {onMudas ? (
                <Pulsable
                  onClick={() => silenciar(f)}
                  aria-pressed={!muda}
                  aria-label={`${info.nombre}: ${muda ? 'silenciado, toca para que suene' : 'suena, toca para silenciarlo'}`}
                  data-luz={f}
                  className={`flex h-11 w-[4.75rem] shrink-0 items-center gap-1.5 rounded-xl px-2 text-left transition-colors duration-200 ${muda ? 'bg-zinc-100 text-zinc-500' : 'bg-zinc-100 text-zinc-900'}`}
                >
                  <Luz encendida={!muda} />
                  <span className="truncate text-sm font-bold">{info.fl}</span>
                </Pulsable>
              ) : (
                <span className="flex h-11 w-[4.75rem] shrink-0 items-center gap-1.5 rounded-xl bg-zinc-100 px-2 text-zinc-900" title={info.nombre}>
                  <Luz encendida />
                  <span className="truncate text-sm font-bold">{info.fl}</span>
                </span>
              )}
              <div
                className={`grid h-11 flex-1 grid-cols-4 gap-1.5 transition-opacity duration-200 ${muda ? 'opacity-35' : ''}`}
                style={editable && !fijas.includes(f) ? sinToque : undefined}
                onPointerDown={onDown(f)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                role="group"
                aria-label={`${info.nombre}: 16 pasos`}
              >
                {[0, 1, 2, 3].map((t) => (
                  <div key={t} className="grid grid-cols-4 gap-[2px]">
                    {[0, 1, 2, 3].map((s) => {
                      const p = t * POR_TIEMPO + s
                      return (
                        <Paso
                          key={p}
                          fila={f}
                          paso={p}
                          on={encendido(patron, f, p)}
                          oscuro={t % 2 === 1}
                          color={color}
                          suena={cabezal === p}
                          guia={guia ? encendido(guia, f, p) : false}
                          marca={marcas?.[`${f}:${p}`]}
                          onKeyDown={teclado(f, p)}
                          editable={editable && !fijas.includes(f)}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** La luz de la fila: verde = suena (como el botón del canal en FL); gris hueca = silenciada. */
function Luz({ encendida }) {
  return <span aria-hidden className={`size-3 shrink-0 rounded-full border-2 transition-colors duration-200 ${encendida ? 'border-bien bg-bien' : 'border-zinc-400 bg-transparent'}`} />
}

/** Un paso del rack. */
function Paso({ fila, paso, on, oscuro, color, suena, guia, marca: m, onKeyDown, editable }) {
  const cambio = m === 'cambio'
  const marca = cambio ? undefined : m
  const fondo =
    marca === 'mal' ? 'var(--color-mal-suave)' : marca === 'sobra' ? 'var(--color-fijate)' : on ? color : oscuro ? 'var(--color-zinc-300)' : 'var(--color-zinc-200)'
  return (
    <motion.button
      type="button"
      tabIndex={editable ? 0 : -1}
      onKeyDown={onKeyDown}
      data-paso={paso}
      data-on={on || undefined}
      data-marca={marca}
      aria-pressed={on}
      aria-label={`${FILAS_RACK[fila].nombre}, paso ${paso + 1}${marca === 'sobra' ? ', sobra' : marca === 'mal' ? ', faltaba' : ''}`}
      initial={false}
      animate={{ scale: on && suena ? 1.12 : 1 }}
      transition={RESORTE.pulsar}
      className={`relative h-full min-w-0 rounded-[5px] outline-offset-1 ${suena ? 'ring-2 ring-sky-500' : ''} ${marca === 'mal' ? 'border-[3px] border-mal' : guia && !on ? 'border-2 border-dashed border-zinc-500' : ''}`}
      style={{ backgroundColor: fondo, touchAction: 'none', cursor: editable ? 'pointer' : 'default' }}
    >
      {cambio && (
        // Lo que cambió al pasar de un género a otro: contorno de oro que aparece con un pop y se apaga.
        <motion.span
          aria-hidden
          data-cambio
          className="pointer-events-none absolute -inset-[3px] rounded-[7px] border-[3px] border-fijate"
          initial={{ opacity: 0, scale: 1.25 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [1.25, 1, 1, 1] }}
          transition={{ duration: 1.3, times: [0, 0.15, 0.7, 1] }}
        />
      )}
      {marca === 'sobra' && (
        // Tachado: lo elegido que sobra (primer error, en oro)
        <span aria-hidden className="absolute inset-0 rounded-[5px]" style={{ background: 'linear-gradient(to top right, transparent calc(50% - 1.5px), var(--color-fijate-tinta) calc(50% - 1.5px), var(--color-fijate-tinta) calc(50% + 1.5px), transparent calc(50% + 1.5px))' }} />
      )}
    </motion.button>
  )
}
