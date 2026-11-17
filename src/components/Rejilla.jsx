import { motion } from 'motion/react'
import { useEffect, useId, useMemo, useState } from 'react'
import { pararProgramado } from '../audio/engine.js'
import { reproducir } from '../audio/sonido.js'
import { funcionDe } from '../theory/acordes.js'
import { tramosAcordes } from '../theory/bateria.js'
import { oscuro, tinta } from '../ui/color.js'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import BotonSonido from './BotonSonido.jsx'
import { fondoFuncion } from './MapaFunciones.jsx'

/**
 * «Rejilla de compases» (L10, lección 5.5): una forma de canción en filas de 4 compases (el blues de 12 compases).
 * Cada casilla lleva su número, el cifrado en grande y el grado; su fondo es el de su función (T · S · D, como el mapa
 * de la A2.1: el grado sin la séptima dice cuál). Al tocar Escuchar, cada compás se ENCIENDE cuando suena (color lleno y
 * crece un poco); tocar una casilla toca solo ese compás.
 * rejilla: { compases: [{ cifrado: 'C7', grado: 'I7' }…], sonido: { notas: [un acorde por compás…], intervalo, duracion },
 *   etiqueta: 'Escuchar los 12 compases' }
 */
export default function Rejilla({ rejilla, color }) {
  if (rejilla.compases) return <RejillaCompases rejilla={rejilla} color={color} />
  return <RejillaBloques rejilla={rejilla} color={color} />
}

/** La función (T · S · D) de un grado, sin su séptima: 'V7' → 'D'. */
const funcionGrado = (grado) => funcionDe(grado.replace(/maj7|7$/, '')) ?? 'T'

function RejillaCompases({ rejilla, color }) {
  const [actual, setActual] = useState(-1)
  const [suelto, setSuelto] = useState(null)
  const { compases, sonido } = rejilla
  const encendido = suelto ?? actual

  useEffect(() => () => suelto != null && pararProgramado(), [suelto])

  const tocarCompas = (i) => {
    setActual(-1)
    setSuelto(i)
    const acorde = sonido.notas[i]
    reproducir({ notas: [acorde], duracion: Math.max(0.9, sonido.duracion ?? 0.9) }, { alParar: () => setSuelto((x) => (x === i ? null : x)) })
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-3" data-rejilla-compases>
      <BotonSonido
        sonido={sonido}
        etiqueta={rejilla.etiqueta}
        className="w-full"
        onPlay={() => setSuelto(null)}
        onNotas={(_, i) => setActual(i)}
        onParar={() => setActual(-1)}
      />
      <div className="grid grid-cols-4 gap-1.5" role="list">
        {compases.map((c, i) => {
          const f = funcionGrado(c.grado)
          const on = encendido === i
          return (
            <Pulsable
              key={i}
              tipo="tarjeta"
              role="listitem"
              onClick={() => tocarCompas(i)}
              aria-label={`Compás ${i + 1}: ${c.cifrado}, el ${c.grado}`}
              data-compas={i + 1}
              data-suena={on ? '' : undefined}
              className="min-w-0"
            >
              <motion.span
                animate={{ scale: on ? 1.06 : 1 }}
                transition={RESORTE.pulsar}
                className="flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 px-1 pb-1.5 pt-1 transition-colors duration-150"
                style={{
                  background: on ? oscuro(color) : fondoFuncion(color, f),
                  borderColor: on ? oscuro(color) : 'transparent',
                }}
              >
                <span className={`self-start pl-1 font-dato text-xs leading-none ${on ? 'text-blanco' : 'text-zinc-500'}`}>{i + 1}</span>
                <span className={`font-titulo text-xl font-extrabold leading-tight ${on ? 'text-blanco' : ''}`} style={on ? undefined : { color: tinta(color) }}>
                  {c.cifrado}
                </span>
                <span className={`font-dato text-xs leading-none ${on ? 'text-blanco' : 'text-zinc-600'}`}>{c.grado}</span>
              </motion.span>
            </Pulsable>
          )
        })}
      </div>
    </div>
  )
}

const RITMO = 'var(--color-ritmo)'

/**
 * RITMO ARMÓNICO (lección 5.6): la rejilla con BLOQUES que duran lo que dura su acorde. Filas de 4 compases; cada acorde
 * ocupa sus tiempos (medio compás, uno, dos…) con el fondo de su función; un acorde ADELANTADO empieza antes de la
 * línea del compás y lleva el borde izquierdo en oro («fíjate»). Debajo, cada compás con su número y sus tiempos, que
 * laten con el beat (en el color de Ritmo). Con `versiones`, un control segmentado cambia de versión y los bloques se
 * estiran o se parten con un resorte (`layoutId`). Al escuchar se enciende el acorde que suena; tocar un bloque lo toca.
 * rejilla: { acordes: [{ cifrado, grado, notas, tiempos, adelanto? }], sonido: conBeat(acordes, …), etiqueta, metro: 4 }
 *       o { versiones: [{ nombre, acordes, sonido, etiqueta }], metro }
 */
function RejillaBloques({ rejilla, color }) {
  const versiones = rejilla.versiones ?? [{ acordes: rejilla.acordes, sonido: rejilla.sonido, etiqueta: rejilla.etiqueta }]
  const [v, setV] = useState(0)
  const ver = versiones[v]
  const metro = rejilla.metro ?? ver.sonido.metro ?? 4
  const [pos, setPos] = useState(-1) // tiempo que suena, dentro de la vuelta
  const [suelto, setSuelto] = useState(null)
  const uid = useId()

  const { tramos, ciclo } = useMemo(
    () => ({ tramos: tramosAcordes(ver.acordes, { ciclo: true }), ciclo: ver.acordes.reduce((s, a) => s + a.tiempos, 0) }),
    [ver],
  )
  useEffect(() => () => suelto != null && pararProgramado(), [suelto])

  // El acorde que suena: el que contiene `pos` (lo que queda al final de la vuelta es el primero, si se adelanta).
  const suena = useMemo(() => {
    if (pos < 0) return -1
    const t = tramos[0].inicio < 0 && pos >= ciclo + tramos[0].inicio ? pos - ciclo : pos
    return tramos.findIndex((x) => t >= x.inicio - 1e-6 && t < x.fin - 1e-6)
  }, [pos, tramos, ciclo])
  const encendido = suelto ?? suena

  const cambiar = (i) => {
    if (i === v) return
    pararProgramado()
    setPos(-1)
    setSuelto(null)
    setV(i)
  }
  const tocarAcorde = (i) => {
    setPos(-1)
    setSuelto(i)
    reproducir({ notas: [ver.acordes[i].notas], duracion: 1.2 }, { alParar: () => setSuelto((x) => (x === i ? null : x)) })
  }

  const porFila = 4 * metro
  const filas = Math.ceil(ciclo / porFila)
  const unidades = porFila * 2 // medios tiempos por fila

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-3" data-rejilla-bloques>
      {versiones.length > 1 && (
        <div className="grid gap-1 rounded-2xl bg-zinc-100 p-1" style={{ gridTemplateColumns: `repeat(${versiones.length}, minmax(0, 1fr))` }} role="radiogroup" aria-label="Versión">
          {versiones.map((x, i) => (
            <Pulsable
              key={x.nombre}
              role="radio"
              aria-checked={i === v}
              data-version={x.nombre}
              onClick={() => cambiar(i)}
              className={`min-h-11 rounded-xl px-2 text-base font-semibold transition-colors duration-200 ${i === v ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600'}`}
            >
              {x.nombre}
            </Pulsable>
          ))}
        </div>
      )}
      <BotonSonido
        key={v}
        sonido={ver.sonido}
        etiqueta={ver.etiqueta ?? ver.sonido.etiqueta}
        className="w-full"
        onPlay={() => setSuelto(null)}
        onEvento={(e) => e.casilla != null && setPos((e.casilla / ver.sonido.porTiempo) % ciclo)}
        onParar={() => setPos(-1)}
      />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: filas }, (_, f) => {
          const desde = f * porFila
          const hasta = desde + porFila
          // Los trozos de cada acorde en esta fila (un acorde que cruza de fila se parte; el texto va en el trozo más largo).
          const trozos = ver.acordes.flatMap((a, i) => {
            const ini = Math.max(0, tramos[i].inicio)
            const fin = i === ver.acordes.length - 1 ? ciclo : tramos[i].fin
            const partes = []
            for (let r = Math.floor(ini / porFila); r * porFila < fin; r++) partes.push([Math.max(ini, r * porFila), Math.min(fin, (r + 1) * porFila)])
            const largo = Math.max(...partes.map(([x, y]) => y - x))
            return partes
              .map(([x, y], k) => ({ a, i, k, x, y, texto: y - x === largo && partes.findIndex(([p, q]) => q - p === largo) === k, primero: k === 0 }))
              .filter((t) => t.x >= desde && t.y <= hasta && t.y > t.x)
          })
          return (
            <div key={f} className="flex flex-col gap-1">
              <div className="grid gap-y-0" style={{ gridTemplateColumns: `repeat(${unidades}, minmax(0, 1fr))`, columnGap: 0 }} role="list">
                {trozos.map(({ a, i, k, x, y, texto, primero }) => {
                  const on = encendido === i
                  const adelantado = primero && (a.adelanto ?? 0) > 0
                  return (
                    <motion.div
                      key={`${i}-${k}`}
                      layout
                      layoutId={`${uid}-${i}-${k}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={RESORTE.suave}
                      className="min-w-0 px-[1.5px]"
                      style={{ gridColumn: `${(x - desde) * 2 + 1} / span ${(y - x) * 2}` }}
                      role="listitem"
                    >
                      <Pulsable
                        tipo="tarjeta"
                        onClick={() => tocarAcorde(i)}
                        aria-label={`${a.cifrado}, el ${a.grado}: ${a.tiempos} tiempos${adelantado ? ', adelantado' : ''}`}
                        data-bloque={i}
                        data-cifrado={a.cifrado}
                        data-tiempos={a.tiempos}
                        data-adelanto={adelantado ? a.adelanto : undefined}
                        data-suena={on ? '' : undefined}
                        className="block w-full"
                      >
                        <motion.span
                          animate={{ scale: on ? 1.04 : 1 }}
                          transition={RESORTE.pulsar}
                          className="flex min-h-16 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 px-0.5 transition-colors duration-150"
                          style={{
                            background: on ? oscuro(color) : fondoFuncion(color, funcionGrado(a.grado)),
                            borderColor: on ? oscuro(color) : 'transparent',
                            boxShadow: adelantado ? 'inset 5px 0 0 var(--color-fijate)' : undefined,
                          }}
                        >
                          {texto && (
                            <>
                              <span className={`font-titulo text-lg font-extrabold leading-tight ${on ? 'text-blanco' : ''}`} style={on ? undefined : { color: tinta(color) }}>
                                {a.cifrado}
                              </span>
                              {y - x >= 1 && <span className={`font-dato text-xs leading-none ${on ? 'text-blanco' : 'text-zinc-600'}`}>{a.grado}</span>}
                            </>
                          )}
                        </motion.span>
                      </Pulsable>
                    </motion.div>
                  )
                })}
              </div>
              <div className="grid grid-cols-4" aria-hidden>
                {Array.from({ length: 4 }, (_, c) => {
                  const compas = f * 4 + c
                  if (compas * metro >= ciclo) return <span key={c} />
                  return (
                    <span key={c} className="flex items-center gap-1.5 px-1.5" data-compas-tiempos={compas + 1}>
                      <span className="font-dato text-xs leading-none text-zinc-500">{compas + 1}</span>
                      <span className="flex flex-1 items-center justify-between">
                        {Array.from({ length: metro }, (_, t) => {
                          const on = pos >= 0 && Math.floor(pos + 1e-6) === compas * metro + t
                          return (
                            <motion.span
                              key={t}
                              data-tiempo={t + 1}
                              data-late={on || undefined}
                              className={`rounded-full ${t === 0 ? 'size-2' : 'size-1.5'}`}
                              initial={false}
                              animate={{ backgroundColor: on ? oscuro(RITMO) : t === 0 ? 'var(--color-zinc-400)' : 'var(--color-zinc-300)', scale: on ? 1.5 : 1 }}
                              transition={{ duration: 0.08 }}
                            />
                          )
                        })}
                      </span>
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
