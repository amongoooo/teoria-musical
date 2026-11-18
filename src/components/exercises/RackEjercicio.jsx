import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { acentoLeccion } from '../../content/index.js'
import { FILAS_BASICAS, FILAS_RACK, avisoRack, comparar, golpes, normalizar, sonidoRack } from '../../theory/rack.js'
import { POP } from '../../ui/movimiento.js'
import BotonSonido from '../BotonSonido.jsx'
import ChannelRack from '../ChannelRack.jsx'
import Rich from '../Rich.jsx'

/**
 * Paso `rack` (S1 «Channel rack», Producción 1): el Channel rack de FL Studio en el celular (components/ChannelRack.jsx).
 *
 * paso.rack: { filas: ['kick', 'clap', 'hat', 'tom'], bpm: 90, patron (lo que ya viene puesto), fijas: ['kick'] }
 * paso.objetivo:
 *  - { tipo: 'capas', mensaje }                       → escuchar cada fila SOLA (silenciando las demás) mientras suena
 *  - { tipo: 'copiar', patron, guia, escuchar, explicacion, pista }
 *        poner exactamente ese patrón en las filas que no son `fijas`. `guia: true` = contorno punteado de lo que va;
 *        `escuchar: true` = dictado: botón «Escuchar el original» (el patrón, sin verlo).
 *        Se puede fallar: al 1.er error, los pasos de más tachados en oro y cuántos faltan o sobran por fila (sin decir
 *        dónde); al 2.º, la solución con lo que faltaba en rojo, y va al repaso.
 *  - { tipo: 'libre', golpes: 6, mensaje }            → encender al menos N pasos
 */
export default function RackEjercicio(props) {
  const { objetivo } = props.paso
  if (objetivo.tipo === 'capas') return <Capas {...props} />
  if (objetivo.tipo === 'libre') return <Libre {...props} />
  return <Copiar {...props} />
}

const filasDe = (paso) => paso.rack?.filas ?? FILAS_BASICAS

function Instruccion({ texto }) {
  if (!texto) return null
  return (
    <p className="text-lg font-semibold leading-snug">
      <Rich>{texto}</Rich>
    </p>
  )
}

// ---------------------------------------------------------------------------
// Capas: escuchar cada sonido solo
// ---------------------------------------------------------------------------

/** Pasos seguidos que una fila tiene que sonar sola para contar como escuchada (medio compás). */
const PASOS_SOLA = 8

function Capas({ paso, leccionId, setAccion, siguiente }) {
  const filas = filasDe(paso)
  const [patron] = useState(() => normalizar(paso.rack?.patron, filas))
  const [mudas, setMudas] = useState([])
  const [oidas, setOidas] = useState([])
  const racha = useRef({ fila: null, n: 0 })
  const conGolpes = filas.filter((f) => patron[f].length)
  const listo = conGolpes.every((f) => oidas.includes(f))

  const alPaso = useCallback(
    (_, audibles) => {
      const solas = audibles.filter((f) => patron[f].length)
      const sola = solas.length === 1 ? solas[0] : null
      const r = racha.current
      r.n = sola && sola === r.fila ? r.n + 1 : sola ? 1 : 0
      r.fila = sola
      if (sola && r.n >= PASOS_SOLA) setOidas((o) => (o.includes(sola) ? o : [...o, sola]))
    },
    [patron],
  )

  useEffect(() => {
    setAccion({
      label: 'Continuar',
      avanza: true,
      disabled: !listo,
      ayuda: listo ? null : `Escucha cada sonido solo (${oidas.length}/${conGolpes.length})`,
      feedback: listo ? { tipo: 'bien', titulo: '¡Cuatro capas, un beat!', texto: paso.objetivo.mensaje } : null,
      onClick: siguiente,
    })
  }, [listo, oidas.length, conGolpes.length, paso.objetivo.mensaje, setAccion, siguiente])

  return (
    <div className="flex flex-col gap-4">
      <Instruccion texto={paso.objetivo.instruccion} />
      <ChannelRack filas={filas} patron={patron} mudas={mudas} onMudas={setMudas} bpm={paso.rack?.bpm ?? 90} color={acentoLeccion(leccionId)} alPaso={alPaso} />
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Sonidos escuchados solos">
        {conGolpes.map((f) => {
          const ok = oidas.includes(f)
          return (
            <li key={f}>
              <motion.div
                initial={false}
                animate={ok ? POP : { scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                data-capa={f}
                data-oida={ok || undefined}
                className={`grid min-h-12 place-items-center rounded-2xl border-2 px-2 text-center text-base font-semibold transition-colors duration-200 ${
                  ok ? 'border-bien-relleno bg-bien-relleno text-blanco' : 'border-zinc-200 bg-white text-zinc-700'
                }`}
              >
                {FILAS_RACK[f].nombre}
              </motion.div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Copiar (con guía o de oído)
// ---------------------------------------------------------------------------

function Copiar({ paso, leccionId, setAccion, siguiente, completar, fallo }) {
  const { objetivo } = paso
  const filas = filasDe(paso)
  const fijas = paso.rack?.fijas ?? []
  const editables = filas.filter((f) => !fijas.includes(f))
  const meta = normalizar({ ...normalizar(paso.rack?.patron, filas), ...objetivo.patron }, filas)
  const [patron, setPatron] = useState(() => normalizar(paso.rack?.patron, filas))
  const [mudas, setMudas] = useState([])
  const [intentos, setIntentos] = useState(0)
  const [resultado, setResultado] = useState(null) // null | { ok, faltan, sobran, texto }
  const [solucion, setSolucion] = useState(false)
  const color = acentoLeccion(leccionId)
  const terminado = resultado?.ok || solucion

  const cambiar = (p) => {
    setPatron(p)
    if (resultado && !resultado.ok) setResultado(null)
  }

  useEffect(() => {
    if (terminado) {
      setAccion({
        label: 'Continuar',
        avanza: true,
        feedback: resultado?.ok
          ? { tipo: 'bien', titulo: '¡Así suena!', texto: objetivo.explicacion ?? 'Dale a Reproducir para escucharlo.' }
          : { tipo: 'error', titulo: 'Así queda.', texto: [objetivo.explicacion, Object.keys(resultado?.faltan ?? {}).length ? 'Con borde rojo, lo que faltaba.' : null].filter(Boolean).join(' ') },
        onClick: siguiente,
      })
      return
    }
    const comprobar = () => {
      const r = comparar(patron, meta, editables)
      const total = intentos + 1
      setIntentos(total)
      if (r.ok) {
        setResultado(r)
        completar({ aciertos: intentos === 0 ? 1 : 0, total: 1 })
      } else if (total >= 2) {
        // «Ahora sí se puede fallar»: al segundo fallo, la solución (lo que faltaba en rojo) y al repaso.
        completar({ aciertos: 0, total: 1 })
        fallo?.(0)
        setResultado({ ...r, rojo: true })
        setPatron(meta)
        setSolucion(true)
      } else setResultado({ ...r, texto: avisoRack(r, editables) })
    }
    const mal = resultado && !resultado.ok
    const vacio = editables.every((f) => !patron[f]?.length)
    setAccion({
      label: 'Comprobar',
      disabled: vacio,
      ayuda: vacio ? 'Toca los pasos para encenderlos' : null,
      feedback: mal ? { tipo: 'mal', titulo: 'Casi.', texto: [resultado.texto, objetivo.pista].filter(Boolean).join(' ') } : null,
      onClick: comprobar,
    })
  }, [patron, resultado, intentos, terminado, objetivo, setAccion, siguiente, completar, fallo]) // eslint-disable-line react-hooks/exhaustive-deps

  // Marcas: en el 1.er error, lo que sobra tachado en oro; con la solución, lo que faltaba en rojo.
  let marcas = null
  if (resultado && !resultado.ok) {
    marcas = {}
    if (resultado.rojo) for (const [f, l] of Object.entries(resultado.faltan)) for (const p of l) marcas[`${f}:${p}`] = 'mal'
    else for (const [f, l] of Object.entries(resultado.sobran)) for (const p of l) marcas[`${f}:${p}`] = 'sobra'
  }

  return (
    <div className="flex flex-col gap-4">
      <Instruccion texto={objetivo.instruccion} />
      {objetivo.escuchar && (
        <BotonSonido sonido={sonidoRack(meta, { bpm: paso.rack?.bpm ?? 90, compases: 2 })} etiqueta="Escuchar el original" className="w-full" />
      )}
      <ChannelRack
        filas={filas}
        patron={patron}
        onCambio={terminado ? undefined : cambiar}
        fijas={fijas}
        mudas={mudas}
        onMudas={setMudas}
        bpm={paso.rack?.bpm ?? 90}
        color={color}
        guia={objetivo.guia && !terminado ? meta : null}
        marcas={marcas}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Libre
// ---------------------------------------------------------------------------

function Libre({ paso, leccionId, setAccion, siguiente }) {
  const filas = filasDe(paso)
  const [patron, setPatron] = useState(() => normalizar(paso.rack?.patron, filas))
  const [mudas, setMudas] = useState([])
  const meta = paso.objetivo.golpes ?? 6
  const n = golpes(patron)
  const listo = n >= meta

  useEffect(() => {
    setAccion({
      label: 'Continuar',
      avanza: true,
      disabled: !listo,
      ayuda: listo ? null : `Enciende ${meta} pasos (${Math.min(n, meta)}/${meta})`,
      feedback: listo ? { tipo: 'bien', titulo: '¡Tu beat!', texto: paso.objetivo.mensaje } : null,
      onClick: siguiente,
    })
  }, [listo, n, meta, paso.objetivo.mensaje, setAccion, siguiente])

  return (
    <div className="flex flex-col gap-4">
      <Instruccion texto={paso.objetivo.instruccion} />
      <ChannelRack filas={filas} patron={patron} onCambio={setPatron} mudas={mudas} onMudas={setMudas} bpm={paso.rack?.bpm ?? 90} color={acentoLeccion(leccionId)} />
    </div>
  )
}

