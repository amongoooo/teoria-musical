import { animate, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MODULOS, moduloDisponible } from '../content/index.js'
import { useProgreso } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import { labio, oscuro, tinta } from '../ui/color.js'
import { MarcaBien, Saltar } from '../ui/Iconos.jsx'
import { pruebaModulo } from '../content/pruebas/index.js'
import { pendientesModulo } from './HojaEntrada.jsx'
import Hoja from '../ui/Hoja.jsx'
import { DESLIZAR, RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import useDeslizar from '../ui/useDeslizar.js'
import useRuedaMouse from '../ui/useRuedaMouse.js'
import { VIDRIO } from '../ui/vidrio.js'

const lerp = (a, b, t) => a + (b - a) * t
const limitar = (v, a, b) => Math.min(b, Math.max(a, v))

/**
 * «Pestaña» de módulos: hoja inferior que se abre al tocar la insignia del módulo (el cuadrito
 * con su número, al inicio del camino). Es un carrusel lateral con una tarjeta por módulo:
 * deslizar (reglas de la skill, sección 3b) o las flechas ‹ › pasan de módulo; «Ir al módulo» lo abre.
 * Si la prueba rápida puede saltar algo del módulo, debajo va «¿Ya lo sabes?» (como en su hoja de Inicio).
 */
export default function NavegadorModulos({ abierta, onCerrar, actual }) {
  return (
    <Hoja abierta={abierta} onCerrar={onCerrar} etiqueta="Módulos">
      <h2 className="font-titulo text-2xl font-bold tracking-tight">Módulos</h2>
      <Carrusel actual={actual} onCerrar={onCerrar} />
    </Hoja>
  )
}

function Carrusel({ actual, onCerrar }) {
  const progreso = useProgreso()
  const ref = useRef(null)
  const [ancho, setAncho] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    const medir = () => setAncho(el.clientWidth)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const n = MODULOS.length
  const inicial = Math.max(0, MODULOS.findIndex((m) => m.numero === actual))
  const [indice, setIndice] = useState(inicial)
  const idx = useRef(inicial)
  const base = useMotionValue(inicial)
  const reducir = useReducedMotion()
  const resorte = reducir ? { duration: 0 } : RESORTE.pantalla
  const X = ancho < 560 ? Math.max(100, ancho * DESLIZAR.umbralCelular) : DESLIZAR.umbralAncho

  const irA = (i) => {
    if (i < 0 || i >= n || i === idx.current) return
    idx.current = i
    setIndice(i)
    animate(base, i, resorte)
  }
  const paso = (dir) => {
    const a = idx.current
    const desfase = base.get() - a
    idx.current = a + dir
    setIndice(a + dir)
    base.jump(a + dir + desfase)
    if (Math.abs(desfase) > 0.001) animate(base, a + dir, resorte)
  }
  const gesto = useDeslizar({ umbral: X, onPaso: paso, puede: (dir) => idx.current + dir >= 0 && idx.current + dir < n })
  useRuedaMouse(ref, { puede: (dir) => idx.current + dir >= 0 && idx.current + dir < n, onPaso: (dir) => irA(idx.current + dir) })

  const tarjetas = useRef([])
  const anchoTarjeta = Math.min(ancho - 56, 400)
  const actualizar = () => {
    const p = base.get() + gesto.progreso.get()
    const pc = limitar(p, 0, n - 1)
    const fuera = p - pc
    const sep = anchoTarjeta + 12
    if (ref.current) ref.current.dataset.posicion = p.toFixed(3) // posición continua (útil para pruebas)
    tarjetas.current.forEach((el, i) => {
      if (!el) return
      const d = i - pc
      const a = Math.min(1, Math.abs(d))
      el.style.transform = `translateX(${d * sep - fuera * X}px) scale(${lerp(1, 0.9, a)})`
      el.style.opacity = String(lerp(1, 0.45, a))
      el.style.visibility = Math.abs(d) > 1.8 ? 'hidden' : 'visible'
      el.inert = Math.abs(d) > 0.5
    })
  }
  const actualizarRef = useRef(actualizar)
  actualizarRef.current = actualizar
  useLayoutEffect(() => actualizar())
  useEffect(() => {
    const quitar = [base, gesto.progreso].map((mv) => mv.on('change', () => actualizarRef.current()))
    return () => quitar.forEach((q) => q())
  }, [base, gesto.progreso])

  const m = MODULOS[indice]
  return (
    <div className="flex flex-col gap-4">
      <div ref={ref} data-sin-arrastre className="relative -mx-5 h-[22rem] overflow-hidden select-none" style={{ touchAction: 'pan-y' }} {...gesto.handlers}>
        {ancho > 0 &&
          MODULOS.map((mod, i) => (
            <div
              key={mod.numero}
              ref={(el) => (tarjetas.current[i] = el)}
              className="absolute top-2 bottom-2"
              style={{ left: (ancho - anchoTarjeta) / 2, width: anchoTarjeta }}
            >
              <TarjetaModulo modulo={mod} progreso={progreso} esActual={mod.numero === actual} onCerrar={onCerrar} />
            </div>
          ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Pulsable onClick={() => irA(indice - 1)} disabled={indice === 0} aria-label="Módulo anterior" className={`grid size-11 place-items-center rounded-full text-2xl text-zinc-700 disabled:opacity-30 ${VIDRIO}`}>
          ‹
        </Pulsable>
        <span className="text-base font-semibold tabular-nums text-zinc-600" aria-live="polite">
          Módulo {m.numero} de {n}
        </span>
        <Pulsable onClick={() => irA(indice + 1)} disabled={indice === n - 1} aria-label="Módulo siguiente" className={`grid size-11 place-items-center rounded-full text-2xl text-zinc-700 disabled:opacity-30 ${VIDRIO}`}>
          ›
        </Pulsable>
      </div>
    </div>
  )
}

function TarjetaModulo({ modulo: m, progreso, esActual, onCerrar }) {
  const disponible = moduloDisponible(m)
  const hechas = m.lecciones.filter((l) => progreso.lecciones[l.id]?.completada).length
  const total = m.lecciones.length
  const pend = disponible ? pendientesModulo(m.numero, progreso).length : 0
  return (
    <div className="flex h-full flex-col items-center gap-3 rounded-3xl border border-zinc-200 bg-white p-5 text-center">
      <Cuadrito modulo={m} disponible={disponible} tam={64} />
      <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: disponible ? tinta(m.acento) : undefined }}>
        Módulo {m.numero}
      </span>
      <h3 className="font-titulo text-xl font-bold leading-tight">{m.titulo}</h3>
      <p className="line-clamp-3 text-base text-zinc-600">{m.descripcion}</p>
      <div className="mt-auto flex w-full flex-col gap-3">
        {disponible && (
          <div className="flex items-center gap-3">
            <BarraProgreso valor={total ? hechas / total : 0} color={m.acento} fondo="bg-zinc-100" alto="h-2" className="flex-1" alAparecer={false} />
            <span className="font-dato text-sm tabular-nums text-zinc-500">
              {hechas}/{total}
            </span>
          </div>
        )}
        {esActual ? (
          <Pulsable onClick={onCerrar} className="min-h-12 rounded-2xl bg-zinc-100 text-lg font-semibold text-zinc-700">
            Estás aquí
          </Pulsable>
        ) : disponible ? (
          <Pulsable onClick={() => navegar(rutas.modulo(m.numero))} className="min-h-12 rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
            Ir al módulo {m.numero}
          </Pulsable>
        ) : (
          <span className="grid min-h-12 place-items-center rounded-2xl border-2 border-dashed border-zinc-300 text-lg font-semibold text-zinc-500">Próximamente</span>
        )}
        {pend > 0 && (
          <Pulsable
            onClick={() => navegar(rutas.prueba(pruebaModulo(m.numero)))}
            data-ya-lo-sabes
            className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-lg font-semibold ${VIDRIO}`}
            style={{ color: tinta(m.acento) }}
          >
            <Saltar className="size-5" grosor={2.4} />
            ¿Ya lo sabes?
          </Pulsable>
        )}
      </div>
    </div>
  )
}

/**
 * El cuadrito de un módulo: su número sobre su color, con «labio»; punteado si aún no está.
 * Los módulos no llevan ícono: se reconocen por su color y su número. `hecho` = ✓ verde en la esquina.
 */
export function Cuadrito({ modulo, disponible = true, hecho = false, tam = 72, className = '' }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center rounded-3xl font-titulo font-bold ${disponible ? 'text-blanco' : 'border-2 border-dashed border-zinc-300 text-zinc-500'} ${className}`}
      style={{
        width: tam,
        height: tam,
        fontSize: tam * 0.42,
        backgroundColor: disponible ? oscuro(modulo.acento) : 'var(--color-white)',
        boxShadow: disponible ? `0 6px 0 ${labio(modulo.acento)}` : undefined,
      }}
      aria-hidden
    >
      {modulo.Icono ? <modulo.Icono style={{ width: tam * 0.5, height: tam * 0.5 }} /> : modulo.numero}
      {hecho && <MarcaBien className="absolute -right-1.5 -top-1.5 size-7" aro="var(--color-fondo)" />}
    </span>
  )
}
