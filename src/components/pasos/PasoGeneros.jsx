import { motion, useSpring, useTransform } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { acentoLeccion } from '../../content/index.js'
import { GENEROS, PASOS, cambiosPatron, filasDeGeneros } from '../../theory/rack.js'
import { Bombilla, Check } from '../../ui/Iconos.jsx'
import { ENTRA_DERECHA, RESORTE } from '../../ui/movimiento.js'
import Pulsable from '../../ui/Pulsable.jsx'
import ChannelRack from '../ChannelRack.jsx'
import Rich from '../Rich.jsx'

/** Cuánto dura el contorno de oro de lo que cambió (ms). */
const DURA_CAMBIO = 1300

/**
 * RACK QUE CAMBIA DE GÉNERO (paso `generos`, L11; P1.2; propuesta aprobada: https://claude.ai/artifact/DMYBitpKtAtAoQ6fx8yfqE).
 * Un solo Channel rack con los géneros en fichas arriba: al tocar una, el beat se transforma SIN DEJAR DE SONAR (si no
 * sonaba, empieza), los pasos que cambiaron se marcan en oro un momento y el tempo se desliza en la regla de BPM. Abajo,
 * la huella del género (bombilla). Un género cuenta como escuchado tras un compás entero sonando; con `minimo`, se sigue.
 *
 * paso: { tipo: 'generos', titulo, intro? (lo pone el visor), generos: ['pop', 'boomBap', …] (theory/rack.js → GENEROS), minimo: 3, mensaje }
 */
export default function PasoGeneros({ paso, leccionId, setAccion, siguiente }) {
  const ids = paso.generos
  const filas = useMemo(() => filasDeGeneros(ids), [ids])
  const minimo = Math.min(paso.minimo ?? 3, ids.length)
  const color = acentoLeccion(leccionId)
  const [actual, setActual] = useState(ids[0])
  const [oidos, setOidos] = useState([])
  const [marcas, setMarcas] = useState(null)
  const api = useRef(null)
  const cuenta = useRef({ id: ids[0], n: 0 })
  const borrar = useRef(0)
  useEffect(() => () => clearTimeout(borrar.current), [])

  const genero = GENEROS[actual]
  const listo = oidos.length >= minimo

  const elegir = (id) => {
    if (id !== actual) {
      const cambios = cambiosPatron(GENEROS[actual].patron, GENEROS[id].patron, filas)
      setMarcas(Object.fromEntries(Object.keys(cambios).map((k) => [k, 'cambio'])))
      clearTimeout(borrar.current)
      borrar.current = setTimeout(() => setMarcas(null), DURA_CAMBIO)
      cuenta.current = { id, n: 0 }
      setActual(id)
    }
    // Elegir un género también lo hace sonar (el bucle sigue y cambia al tempo nuevo).
    api.current?.empezar()
  }

  // Un compás entero sonando = escuchado.
  const alPaso = useCallback((s) => {
    const c = cuenta.current
    c.n += 1
    if (c.n >= PASOS) setOidos((o) => (o.includes(c.id) ? o : [...o, c.id]))
  }, [])

  useEffect(() => {
    setAccion({
      label: 'Continuar',
      avanza: true,
      disabled: !listo,
      ayuda: listo ? null : `Escucha ${minimo} géneros (${oidos.length}/${minimo})`,
      feedback: listo ? { tipo: 'bien', titulo: paso.tituloBien ?? '¡Mismo kit, otro género!', texto: paso.mensaje } : null,
      onClick: siguiente,
    })
  }, [listo, oidos.length, minimo, paso.mensaje, paso.tituloBien, setAccion, siguiente])

  return (
    <div className="flex flex-col gap-4">

      <div className="flex flex-wrap gap-2" role="group" aria-label="Géneros">
        {ids.map((id) => {
          const sel = id === actual
          const oido = oidos.includes(id)
          return (
            <Pulsable
              key={id}
              onClick={() => elegir(id)}
              aria-pressed={sel}
              data-genero={id}
              data-oido={oido || undefined}
              className={`flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-base font-semibold transition-colors duration-200 ${
                sel ? 'text-blanco' : 'border-zinc-200 bg-white text-zinc-800'
              }`}
              style={sel ? { backgroundColor: color, borderColor: color } : undefined}
            >
              {oido && <Check className="size-4" />}
              {GENEROS[id].nombre}
            </Pulsable>
          )
        })}
      </div>

      <ReglaTempo ids={ids} actual={actual} color={color} />

      <ChannelRack filas={filas} patron={genero.patron} bpm={genero.bpm} color={color} marcas={marcas} alPaso={alPaso} api={api} />

      <motion.p key={actual} {...ENTRA_DERECHA} className="flex items-start gap-3 text-lg leading-snug text-zinc-700" data-huella>
        <Bombilla className="mt-0.5 size-6 shrink-0 text-fijate-tinta" />
        <span>
          <Rich>{genero.huella}</Rich>
        </span>
      </motion.p>
    </div>
  )
}

/** La regla de tempo: el BPM (que cuenta hasta el nuevo con un resorte) y un puntito por género sobre la línea. */
function ReglaTempo({ ids, actual, color }) {
  const bpms = ids.map((id) => GENEROS[id].bpm)
  const min = Math.floor((Math.min(...bpms) - 10) / 10) * 10
  const max = Math.ceil((Math.max(...bpms) + 10) / 10) * 10
  const pos = (b) => `${((b - min) / (max - min)) * 100}%`
  const marcas = []
  for (let v = min + 10; v < max; v += 20) marcas.push(v)
  const bpm = GENEROS[actual].bpm
  const resorte = useSpring(bpm, RESORTE.suave)
  const texto = useTransform(resorte, (v) => Math.round(v))
  useEffect(() => resorte.set(bpm), [bpm, resorte])

  return (
    <div className="flex items-center gap-4 rounded-3xl border border-zinc-200 bg-white px-4 py-3" data-regla>
      <p className="w-20 shrink-0 font-dato leading-none" aria-live="polite">
        <motion.span className="block text-3xl font-medium tabular-nums" data-bpm>
          {texto}
        </motion.span>
        <span className="text-sm text-zinc-500">BPM</span>
      </p>
      <div className="relative h-11 min-w-0 flex-1" aria-hidden>
        <div className="absolute inset-x-0 top-3 h-1.5 rounded-full bg-zinc-200" />
        {ids.map((id) => (
          <motion.span
            key={id}
            className="absolute top-3 -ml-1.5 -mt-[3px] size-3 rounded-full"
            style={{ left: pos(GENEROS[id].bpm), backgroundColor: id === actual ? color : 'var(--color-zinc-400)' }}
            initial={false}
            animate={{ scale: id === actual ? 1.6 : 1 }}
            transition={RESORTE.pulsar}
          />
        ))}
        {marcas.map((v) => (
          <span key={v} className="absolute top-6 -translate-x-1/2 font-dato text-xs text-zinc-500" style={{ left: pos(v) }}>
            {v}
          </span>
        ))}
      </div>
    </div>
  )
}
