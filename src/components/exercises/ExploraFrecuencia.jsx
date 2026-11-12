import { useEffect, useRef, useState } from 'react'
import { toneSet, toneStart, toneStop } from '../../audio/engine.js'
import { Check } from '../../ui/Iconos.jsx'

/**
 * Pad de frecuencia: mantener el dedo y deslizar arriba/abajo cambia los Hz
 * de una onda pura. Arriba = agudo (como en el Piano Roll de FL Studio).
 *
 * paso.min / paso.max: rango en Hz (escala logarítmica, como el oído).
 * Se completa al visitar la zona más grave y la más aguda del pad.
 */
export default function ExploraFrecuencia({ paso, setAccion, siguiente }) {
  const min = paso.min ?? 80
  const max = paso.max ?? 1200
  const padRef = useRef(null)
  const activo = useRef(null) // pointerId que está sonando
  const [pos, setPos] = useState(null) // 0 (abajo) – 1 (arriba), null = en silencio
  const [ultimoHz, setUltimoHz] = useState(440)
  const [visitado, setVisitado] = useState({ grave: false, agudo: false })
  const listo = visitado.grave && visitado.agudo

  const hzDe = (p) => min * (max / min) ** p

  useEffect(() => () => toneStop(), [])

  useEffect(() => {
    setAccion({
      label: 'Continuar',
      avanza: true,
      disabled: !listo,
      ayuda: listo ? null : 'Llega hasta abajo del todo y hasta arriba del todo',
      feedback: listo
        ? {
            tipo: 'bien',
            titulo: '¡Lo escuchaste!',
            texto: `Abajo, ${min} vibraciones por segundo: grave. Arriba, ${max}: agudo. Subir la frecuencia sube la altura.`,
          }
        : null,
      onClick: siguiente,
    })
  }, [listo, min, max, setAccion, siguiente])

  const posDe = (e) => {
    const rect = padRef.current.getBoundingClientRect()
    const p = 1 - (e.clientY - rect.top) / rect.height
    return Math.min(1, Math.max(0, p))
  }

  const actualizar = (p) => {
    const f = hzDe(p)
    setPos(p)
    setUltimoHz(f)
    if (p < 0.12) setVisitado((v) => (v.grave ? v : { ...v, grave: true }))
    if (p > 0.88) setVisitado((v) => (v.agudo ? v : { ...v, agudo: true }))
    return f
  }

  const onDown = (e) => {
    e.preventDefault()
    if (activo.current !== null) return
    activo.current = e.pointerId
    padRef.current.setPointerCapture?.(e.pointerId)
    toneStart(actualizar(posDe(e)))
  }

  const onMove = (e) => {
    if (activo.current !== e.pointerId) return
    toneSet(actualizar(posDe(e)))
  }

  const onUp = (e) => {
    if (activo.current !== e.pointerId) return
    activo.current = null
    setPos(null)
    toneStop()
  }

  const sonando = pos !== null
  // Cuántos ciclos dibujar: proporcional a la frecuencia (log, para que se vea bien).
  const ciclos = 1.5 + 10 * (Math.log(ultimoHz / min) / Math.log(max / min))

  return (
    <div
      ref={padRef}
      role="slider"
      aria-label="Frecuencia"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(ultimoHz)}
      className="relative h-72 w-full overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-b from-sky-100 via-white to-zinc-100 select-none"
      style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Zona arriba ok={visitado.agudo} texto="Agudo" />
      <Zona ok={visitado.grave} texto="Grave" />

      <div className="pointer-events-none absolute inset-x-0 top-[14%] flex flex-col items-center gap-1 px-4">
        <div className="font-dato text-4xl font-medium tabular-nums tracking-tight">
          {Math.round(ultimoHz)} <span className="text-xl font-semibold text-zinc-400">Hz</span>
        </div>
        <div className="text-sm text-zinc-500">{sonando ? 'vibraciones por segundo' : 'Mantén el dedo aquí y desliza ↕'}</div>
        <Onda ciclos={ciclos} activa={sonando} />
      </div>

      {sonando && (
        <div
          className="pointer-events-none absolute inset-x-0 h-1 -translate-y-1/2 bg-sky-500"
          style={{ top: `${(1 - pos) * 100}%` }}
        >
          <span className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/30" />
        </div>
      )}
    </div>
  )
}

function Zona({ arriba = false, ok, texto }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 flex h-[12%] items-center justify-between px-4 text-sm font-semibold ${
        arriba ? 'top-0' : 'bottom-0'
      } ${ok ? 'bg-bien-suave text-bien-tinta' : 'bg-zinc-900/5 text-zinc-500'}`}
    >
      <span>{texto}</span>
      {ok && <Check className="size-5" />}
    </div>
  )
}

/** Dibujo de una onda: más ciclos = más frecuencia. */
function Onda({ ciclos, activa }) {
  const W = 320
  const H = 64
  const puntos = []
  for (let x = 0; x <= W; x += 2) {
    const y = H / 2 - Math.sin((x / W) * ciclos * 2 * Math.PI) * (H / 2 - 6)
    puntos.push(`${x},${y.toFixed(1)}`)
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-14 w-full" aria-hidden preserveAspectRatio="none">
      <polyline
        points={puntos.join(' ')}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className={`transition-colors ${activa ? 'stroke-sky-500' : 'stroke-zinc-300'}`}
      />
    </svg>
  )
}
