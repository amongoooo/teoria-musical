import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { iniciarRitmo, latenciaAudio, tiempoAudio } from '../../audio/engine.js'
import { getModulo } from '../../content/index.js'
import { formaGroove } from '../../theory/bateria.js'
import { oscuro } from '../../ui/color.js'
import { ENTRA_DERECHA, RESORTE, SALTO } from '../../ui/movimiento.js'
import Pulsable from '../../ui/Pulsable.jsx'
import Rondas from './Rondas.jsx'

/**
 * Paso `pulso`: ejercicios de pulso y tempo con un ritmo que suena en bucle.
 *
 * paso.objetivo:
 *  - { tipo: 'seguir', rondas: [{ bpm, groove, meta: 8, visual: true, mensaje, cada, desfase, contar }] }
 *      → tocar el botón grande al pulso; cuenta los toques «a tiempo» (±90 ms).
 *        cada: tiempos entre toque y toque (1 = cada tiempo, 0.5 = «1 y 2 y», 4 = solo el 1 en 4/4).
 *        desfase: en qué tiempo cae el primer toque (0 = en el 1; 2 = en el 3).
 *        contar: 'tiempos' | 'y' → muestra la cuenta del compás («1 2 3 4» o «1 y 2 y…»).
 *  - { tipo: 'tempo', rondas: [{ bpm, groove }] }
 *      → tap tempo: marcar el pulso de un ritmo y adivinar sus BPM.
 *  - { tipo: 'explorar', tempos: [{ bpm, genero }], minimo: 3, mensaje }
 *      → escuchar el mismo groove a distintos tempos.
 */
export default function Pulso(props) {
  const { objetivo } = props.paso
  if (objetivo.tipo === 'seguir') return <Seguir {...props} />
  if (objetivo.tipo === 'tempo') return <TapTempo {...props} />
  if (objetivo.tipo === 'explorar') return <Explorar {...props} />
  return <p>Objetivo desconocido: {objetivo.tipo}</p>
}

const TOLERANCIA = 0.09 // segundos de margen para contar un toque «a tiempo»
const RANGO = 0.25 // el medidor muestra ±250 ms
const MAX_AJUSTE = 0.2 // retraso máximo del dispositivo que se compensa solo

// ---------------------------------------------------------------------------
// Utilidades compartidas
// ---------------------------------------------------------------------------

/** Ritmo en bucle ligado al componente: se para al desmontar. */
function useRitmo() {
  const [ritmo, setRitmo] = useState(null)
  const ref = useRef(null)
  const empezar = useCallback((groove, bpm, opciones) => {
    ref.current?.parar()
    const { eventos, casillas, porTiempo } = formaGroove(groove, opciones)
    const r = iniciarRitmo(eventos, { bpm, casillas, porTiempo })
    ref.current = r
    setRitmo(r)
    return r
  }, [])
  const parar = useCallback(() => {
    ref.current?.parar()
    ref.current = null
    setRitmo(null)
  }, [])
  useEffect(() => () => ref.current?.parar(), [])
  return { ritmo, empezar, parar }
}

/**
 * Número de latido que se está oyendo ahora (‑1 antes de empezar).
 * `periodo` y `desfase` en tiempos: (0.5) cuenta corcheas; (4, 2) cuenta cada compás desde el tiempo 3.
 */
function useLatido(ritmo, periodo = 1, desfase = 0) {
  const [latido, setLatido] = useState(-1)
  useEffect(() => {
    if (!ritmo) return setLatido(-1)
    let frame = 0
    const tic = () => {
      const b = Math.floor((tiempoAudio() - latenciaAudio() - ritmo.inicio - desfase * ritmo.pulso) / (periodo * ritmo.pulso))
      setLatido((prev) => (prev === b ? prev : b))
      frame = requestAnimationFrame(tic)
    }
    tic()
    return () => cancelAnimationFrame(frame)
  }, [ritmo, periodo, desfase])
  return latido
}

/** Momento del toque en el reloj de audio, descontando lo que tardó en llegar el evento. */
function momentoToque(e) {
  const retraso = e?.timeStamp ? Math.max(0, (performance.now() - e.timeStamp) / 1000) : 0
  return tiempoAudio() - retraso
}

const mediana = (xs) => {
  const a = [...xs].sort((x, y) => x - y)
  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}

function useColor(leccionId) {
  return getModulo(Number(String(leccionId).split('.')[0]))?.acento ?? '#18181b'
}

/** Botón grande para tocar al pulso. Late con cada tiempo si `latido` >= 0. */
function Pad({ onToque, latido, mostrarLatido, color, texto = 'Toca aquí al pulso', disabled }) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        if (disabled) return
        e.preventDefault()
        onToque(e)
      }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={RESORTE.pulsar}
      className="relative grid h-40 w-full place-items-center overflow-hidden rounded-3xl text-xl font-semibold text-blanco select-none disabled:opacity-40"
      style={{ backgroundColor: oscuro(color), touchAction: 'manipulation', WebkitTouchCallout: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {mostrarLatido && latido >= 0 && (
        <motion.span
          key={latido}
          aria-hidden
          className="absolute size-32 rounded-full bg-white"
          initial={{ scale: 1.15, opacity: 0.45 }}
          animate={{ scale: 0.9, opacity: 0.08 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      )}
      <span className="relative">{texto}</span>
    </motion.button>
  )
}

function BotonEmpezar({ sonando, onClick }) {
  return (
    <Pulsable
      onClick={onClick}
      className={`flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 px-5 text-lg font-semibold transition-colors duration-200 ${
        sonando ? 'border-zinc-200 bg-white text-zinc-800' : 'border-zinc-900 bg-zinc-900 text-white'
      }`}
    >
      <span aria-hidden>{sonando ? '■' : '▶'}</span>
      {sonando ? 'Parar' : 'Empezar'}
    </Pulsable>
  )
}

// ---------------------------------------------------------------------------
// Seguir el pulso
// ---------------------------------------------------------------------------

function Seguir({ paso, leccionId, setAccion, siguiente }) {
  const rondas = paso.objetivo.rondas
  const [r, setR] = useState(0)
  const ronda = rondas[r]
  const meta = ronda.meta ?? 8
  const cada = ronda.cada ?? 1
  const desfase = ronda.desfase ?? 0
  const { ritmo, empezar, parar } = useRitmo()
  const latido = useLatido(ritmo, cada, desfase)
  const division = ronda.contar === 'y' ? 2 : 1
  const sub = useLatido(ritmo, 1 / division)
  const color = useColor(leccionId)
  const [toques, setToques] = useState([]) // errores (s) ya compensados
  const [buenos, setBuenos] = useState(0)
  const crudos = useRef([])
  const compensacion = useRef(0)
  const [ajustado, setAjustado] = useState(false)
  const hecho = buenos >= meta
  const ultima = r === rondas.length - 1

  const onToque = (e) => {
    if (!ritmo || hecho) return
    const periodo = cada * ritmo.pulso
    const rel = momentoToque(e) - latenciaAudio() - ritmo.inicio - desfase * ritmo.pulso
    const k = Math.round(rel / periodo)
    if (k < 0) return
    const bruto = rel - k * periodo
    crudos.current.push(bruto)
    // Auriculares bluetooth y algunos móviles suenan con retraso: si todos los toques
    // caen igual de desplazados, lo tomamos como retraso del dispositivo y lo descontamos.
    if (crudos.current.length >= 6) {
      const ult = crudos.current.slice(-6)
      const med = mediana(ult)
      const constante = Math.max(...ult) - Math.min(...ult) < 0.15
      if (constante && Math.abs(med - compensacion.current) > TOLERANCIA && Math.abs(med) <= MAX_AJUSTE) {
        compensacion.current = med
        setAjustado(true)
      }
    }
    const err = bruto - compensacion.current
    setToques((t) => [...t.slice(-7), err])
    if (Math.abs(err) <= TOLERANCIA) {
      const n = buenos + 1
      setBuenos(n)
      if (n >= meta) parar()
    }
  }

  useEffect(() => {
    if (!hecho) {
      setAccion({
        label: ultima ? 'Continuar' : 'Siguiente',
        disabled: true,
        ayuda: ritmo ? `${ronda.ayuda ?? 'Toca al pulso'}: ${buenos}/${meta} a tiempo` : 'Pulsa «Empezar» y toca al ritmo',
        onClick: () => {},
      })
      return
    }
    const media = Math.round((toques.reduce((a, x) => a + Math.abs(x), 0) / toques.length) * 1000)
    setAccion({
      label: ultima ? 'Continuar' : 'Siguiente',
      feedback: {
        tipo: 'bien',
        titulo: '¡Tienes pulso!',
        texto: `En tus últimos toques te desviaste de media **${media} ms**. ${ronda.mensaje ?? ''}`.trim(),
      },
      onClick: () => {
        if (ultima) return siguiente()
        setR(r + 1)
        setToques([])
        setBuenos(0)
      },
    })
  }, [hecho, ritmo, buenos, meta, toques, ronda, ultima, r, setAccion, siguiente])

  const ultimo = toques[toques.length - 1]

  return (
    <div className="flex flex-col gap-4">
      <Rondas total={rondas.length} actual={r} hecha={hecho} />
      <motion.div key={r} {...ENTRA_DERECHA} className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xl font-semibold leading-snug">{ronda.pregunta ?? 'Toca con el pulso'}</p>
          <span className="shrink-0 text-base font-semibold tabular-nums text-zinc-500">{ronda.bpm} BPM</span>
        </div>
        {!hecho && <BotonEmpezar sonando={Boolean(ritmo)} onClick={() => (ritmo ? parar() : empezar(ronda.groove ?? 'click', ronda.bpm, ronda))} />}
        {ronda.contar && <Contador tiempos={formaGroove(ronda.groove ?? 'click', ronda).tiempos} division={division} actual={ritmo ? sub : -1} cada={cada} desfase={desfase} color={color} />}
        <Medidor error={ultimo} />
        <Puntos total={meta} hechos={buenos} />
        <Pad onToque={onToque} latido={latido} mostrarLatido={ronda.visual !== false} color={color} disabled={!ritmo} texto={ritmo ? ronda.boton ?? 'Toca aquí al pulso' : 'Primero, Empezar'} />
        {ajustado && <p className="text-base text-zinc-500">Ajustamos el retraso de tu teléfono o tus auriculares para medirte mejor.</p>}
      </motion.div>
    </div>
  )
}

/**
 * Cuenta del compás: «1 2 3 4» (o «1 y 2 y…» con division 2). Se ilumina la casilla que suena;
 * las que hay que tocar llevan un aro del acento. El 1 (tiempo fuerte) va más grande.
 */
function Contador({ tiempos, division, actual, cada, desfase, color }) {
  const total = tiempos * division
  const pos = actual >= 0 ? actual % total : -1
  const objetivo = (i) => {
    const x = (i / division - desfase) / cada
    return Math.abs(x - Math.round(x)) < 1e-6
  }
  return (
    <div className="flex gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const tiempo = i % division === 0
        const encendida = i === pos
        const marca = objetivo(i)
        return (
          <span
            key={i}
            className={`grid h-12 min-w-0 flex-1 place-items-center rounded-2xl border-2 tabular-nums transition-colors duration-100 ${
              tiempo ? 'text-xl font-bold' : 'text-base font-semibold'
            } ${encendida ? 'text-blanco' : i === 0 ? 'bg-white text-zinc-900' : 'bg-white text-zinc-600'}`}
            style={{
              backgroundColor: encendida ? oscuro(color) : undefined,
              borderColor: marca ? oscuro(color) : 'var(--color-zinc-200)',
            }}
          >
            {tiempo ? i / division + 1 : 'y'}
          </span>
        )
      })}
    </div>
  )
}

/** Medidor horizontal: dónde cayó el último toque respecto al pulso. */
function Medidor({ error }) {
  const hay = error !== undefined
  const bien = hay && Math.abs(error) <= TOLERANCIA
  const pos = hay ? 50 + (Math.max(-RANGO, Math.min(RANGO, error)) / RANGO) * 50 : 50
  const ms = hay ? Math.round(Math.abs(error) * 1000) : 0
  const texto = !hay ? 'Aquí verás si tocas antes o después' : bien ? (ms < 30 ? '¡Justo!' : `A tiempo (${ms} ms)`) : error < 0 ? `Antes de tiempo (${ms} ms)` : `Tarde (${ms} ms)`
  const zona = (TOLERANCIA / RANGO) * 50
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <div className="relative h-10 overflow-hidden rounded-full bg-zinc-100">
        <div className="absolute inset-y-0 bg-emerald-100" style={{ left: `${50 - zona}%`, width: `${zona * 2}%` }} />
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-emerald-600" />
        {hay && (
          <motion.div
            className={`absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm transition-colors duration-200 ${bien ? 'bg-emerald-600' : 'bg-amber-500'}`}
            initial={false}
            animate={{ left: `${pos}%` }}
            transition={RESORTE.pulsar}
          />
        )}
      </div>
      <div className="flex justify-between text-sm text-zinc-500">
        <span>‹ Antes</span>
        <span className={`text-base font-semibold ${!hay ? 'text-zinc-500' : bien ? 'text-emerald-700' : 'text-amber-700'}`}>{texto}</span>
        <span>Tarde ›</span>
      </div>
    </div>
  )
}

function Puntos({ total, hechos }) {
  return (
    <div className="flex justify-center gap-2" aria-label={`${hechos} de ${total} a tiempo`}>
      {Array.from({ length: total }, (_, i) => (
        <motion.span
          key={i}
          initial={false}
          animate={i < hechos ? { ...SALTO, opacity: 1 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`size-4 rounded-full transition-colors duration-200 ${i < hechos ? 'bg-emerald-600' : 'bg-zinc-200'}`}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tap tempo: ¿a cuántos BPM va?
// ---------------------------------------------------------------------------

function TapTempo({ paso, leccionId, setAccion, siguiente, completar }) {
  const rondas = paso.objetivo.rondas
  const [r, setR] = useState(0)
  const ronda = rondas[r]
  const { ritmo, empezar, parar } = useRitmo()
  const color = useColor(leccionId)
  const [tiempos, setTiempos] = useState([])
  const [resultado, setResultado] = useState(null) // { ok, estimado, mitad }
  const aciertos = useRef(0)
  const ultima = r === rondas.length - 1
  const estimado = tiempos.length >= 2 ? estimar(tiempos) : null
  const listo = tiempos.length >= 6

  const onToque = (e) => {
    if (resultado) return
    const t = momentoToque(e)
    setTiempos((prev) => {
      // Una pausa larga empieza una cuenta nueva.
      const base = prev.length && t - prev[prev.length - 1] > 2 ? [] : prev
      return [...base.slice(-8), t]
    })
  }

  useEffect(() => {
    if (resultado) {
      const { ok, estimado: est, mitad } = resultado
      setAccion({
        label: ultima ? 'Continuar' : 'Siguiente',
        feedback: ok
          ? {
              tipo: 'bien',
              titulo: `¡Sí! Va a ${ronda.bpm} BPM.`,
              texto: mitad
                ? `Marcaste **${est} BPM**: ${mitad}. Es válido sentirlo así, pero el tempo oficial es **${ronda.bpm}**.`
                : `Marcaste **${est} BPM**. ${est === ronda.bpm ? '¡Exacto!' : '¡Muy cerca!'}`,
            }
          : {
              tipo: 'mal',
              titulo: `Iba a ${ronda.bpm} BPM.`,
              texto: `Marcaste **${est} BPM**. ${est < ronda.bpm ? 'Tus toques iban algo más lentos' : 'Tus toques iban algo más rápidos'}: escucha el bombo y la caja y toca con cada tiempo.`,
            },
        onClick: () => {
          if (ultima) return siguiente()
          setR(r + 1)
          setTiempos([])
          setResultado(null)
        },
      })
      return
    }
    setAccion({
      label: 'Comprobar',
      disabled: !listo,
      ayuda: !ritmo && !tiempos.length ? 'Pulsa «Empezar» y marca el pulso' : listo ? null : `Sigue marcando el pulso (${tiempos.length}/6 toques)`,
      onClick: () => {
        const est = Math.round(estimar(tiempos))
        const tol = Math.max(4, ronda.bpm * 0.05)
        let mitad = null
        let ok = Math.abs(est - ronda.bpm) <= tol
        if (!ok && Math.abs(est * 2 - ronda.bpm) <= tol) mitad = 'tocaste solo uno de cada dos tiempos (la mitad)'
        if (!ok && Math.abs(est / 2 - ronda.bpm) <= tol) mitad = 'tocaste el doble de rápido'
        ok = ok || Boolean(mitad)
        if (ok) aciertos.current += 1
        if (ultima) completar({ aciertos: aciertos.current, total: rondas.length })
        parar()
        setResultado({ ok, estimado: est, mitad })
      },
    })
  }, [resultado, listo, ritmo, tiempos, ronda, ultima, r, rondas.length, parar, setAccion, siguiente, completar])

  return (
    <div className="flex flex-col gap-4">
      <Rondas total={rondas.length} actual={r} hecha={Boolean(resultado)} />
      <motion.div key={r} {...ENTRA_DERECHA} className="flex flex-col gap-4">
        <p className="text-xl font-semibold leading-snug">{ronda.pregunta ?? '¿A cuántos BPM va este ritmo?'}</p>
        {!resultado && <BotonEmpezar sonando={Boolean(ritmo)} onClick={() => (ritmo ? parar() : empezar(ronda.groove ?? 'basico', ronda.bpm))} />}
        <div className="flex items-baseline justify-center gap-2 py-1" aria-live="polite">
          <span className="text-5xl font-bold tabular-nums tracking-tight">{estimado ? Math.round(estimado) : '—'}</span>
          <span className="text-xl font-semibold text-zinc-500">BPM</span>
        </div>
        <Pad onToque={onToque} mostrarLatido={false} latido={-1} color={color} disabled={!ritmo} texto={ritmo ? 'Marca el pulso aquí' : resultado ? '¡Hecho!' : 'Primero, Empezar'} />
      </motion.div>
    </div>
  )
}

/** BPM a partir de los instantes de los toques (mediana de los intervalos). */
function estimar(tiempos) {
  const intervalos = tiempos.slice(1).map((t, i) => t - tiempos[i])
  return 60 / mediana(intervalos)
}

// ---------------------------------------------------------------------------
// Explorar tempos
// ---------------------------------------------------------------------------

function Explorar({ paso, leccionId, setAccion, siguiente }) {
  const { tempos, minimo = 3, groove = 'basico', mensaje } = paso.objetivo
  const { ritmo, empezar, parar } = useRitmo()
  const latido = useLatido(ritmo)
  const color = useColor(leccionId)
  const [actual, setActual] = useState(null)
  const [probados, setProbados] = useState(() => new Set())
  const listo = probados.size >= minimo

  const elegir = (t) => {
    if (ritmo && actual === t.bpm) {
      parar()
      return setActual(null)
    }
    empezar(groove, t.bpm)
    setActual(t.bpm)
    setProbados((p) => new Set(p).add(t.bpm))
  }

  useEffect(() => {
    setAccion({
      label: 'Continuar',
      disabled: !listo,
      ayuda: listo ? null : `Prueba ${minimo} tempos distintos (${probados.size}/${minimo})`,
      feedback: listo ? { tipo: 'bien', titulo: 'Mismo beat, otra energía.', texto: mensaje } : null,
      onClick: () => {
        parar()
        siguiente()
      },
    })
  }, [listo, probados.size, minimo, mensaje, parar, setAccion, siguiente])

  const elegido = tempos.find((t) => t.bpm === actual)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-5 rounded-3xl border border-zinc-200 bg-white p-5">
        <div className="relative grid size-20 shrink-0 place-items-center">
          <span className="absolute inset-0 rounded-full bg-zinc-100" />
          {ritmo && latido >= 0 && (
            <motion.span
              key={latido}
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: color }}
              initial={{ scale: 1, opacity: latido % ritmo.tiempos === 0 ? 0.9 : 0.55 }}
              animate={{ scale: 0.55, opacity: 0.15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          )}
          <span className="relative text-base font-semibold tabular-nums text-zinc-800">{ritmo && latido >= 0 ? (latido % ritmo.tiempos) + 1 : '·'}</span>
        </div>
        <div className="flex flex-col gap-0.5" aria-live="polite">
          <span className="text-4xl font-bold tabular-nums tracking-tight">
            {elegido ? elegido.bpm : '—'} <span className="text-xl font-semibold text-zinc-500">BPM</span>
          </span>
          <span className="text-base text-zinc-600">{elegido ? `${elegido.genero} · ${(elegido.bpm / 60).toFixed(1).replace('.', ',')} pulsos por segundo` : 'Elige un tempo'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tempos.map((t) => {
          const activo = ritmo && actual === t.bpm
          return (
            <Pulsable
              key={t.bpm}
              tipo="tarjeta"
              onClick={() => elegir(t)}
              aria-pressed={Boolean(activo)}
              className={`flex min-h-20 flex-col items-start justify-center gap-0.5 rounded-2xl border-2 px-4 py-3 text-left transition-colors duration-200 ${
                activo ? 'border-zinc-900 bg-zinc-900 text-white' : probados.has(t.bpm) ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-200 bg-white text-zinc-900'
              }`}
            >
              <span className="text-2xl font-bold tabular-nums">{t.bpm}</span>
              <span className={`text-sm ${activo ? 'text-zinc-200' : 'text-zinc-500'}`}>{t.genero}</span>
            </Pulsable>
          )
        })}
      </div>
    </div>
  )
}
