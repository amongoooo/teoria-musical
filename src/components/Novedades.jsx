import { motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { NOVEDADES } from '../content/novedades.js'
import { useNovedades } from '../progress/novedades.js'
import { navegar } from '../router.js'
import Hoja from '../ui/Hoja.jsx'
import { Bombilla, Info } from '../ui/Iconos.jsx'
import { RESORTE } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { VIDRIO } from '../ui/vidrio.js'
import Rich from './Rich.jsx'

/**
 * Botón ⓘ de Inicio (pedido del usuario): círculo de vidrio que abre la hoja «Novedades»: la versión de la app, qué
 * cambió en cada actualización (content/novedades.js) y un botón para ir a verlo. Si hay algo que aún no se abrió,
 * lleva un puntito de oro (oro = «Nuevo») que se apaga al abrir la hoja.
 */
export default function BotonNovedades({ className = '' }) {
  const [abierta, setAbierta] = useState(false)
  const [nueva, marcarVistas] = useNovedades()
  const cerrar = useCallback(() => setAbierta(false), [])
  const abrir = () => {
    setAbierta(true)
    marcarVistas()
  }
  return (
    <>
      <Pulsable
        onClick={abrir}
        aria-label={nueva ? 'Novedades (hay algo nuevo)' : 'Novedades'}
        aria-haspopup="dialog"
        // Sin `relative` cuando llega `absolute` (si no, la anula): el punto se ubica igual sobre un `absolute`.
        className={`${className.includes('absolute') ? '' : 'relative'} grid size-11 shrink-0 place-items-center rounded-full text-zinc-700 ${VIDRIO} ${className}`}
        data-boton-novedades
      >
        <Info className="size-6" />
        {nueva && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...RESORTE.pulsar, delay: 0.4 }}
            className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full bg-fijate ring-[3px] ring-fondo"
            aria-hidden
            data-punto-novedad
          />
        )}
      </Pulsable>
      <Hoja abierta={abierta} onCerrar={cerrar} etiqueta="Novedades">
        <PanelNovedades onCerrar={cerrar} />
      </Hoja>
    </>
  )
}

function PanelNovedades({ onCerrar }) {
  const ir = (href) => {
    onCerrar()
    navegar(href)
  }
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1">
        <p className="font-dato text-sm font-medium tabular-nums text-zinc-500" data-version-novedades>
          {__VERSION_APP__}
        </p>
        <h2 className="font-titulo text-2xl font-bold tracking-tight">Novedades</h2>
      </div>

      {NOVEDADES.map((n, i) => (
        <section key={n.id} className="flex flex-col gap-2.5" aria-labelledby={`novedad-${n.id}`} data-novedad={n.id}>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-1">
            <h3 id={`novedad-${n.id}`} className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              {n.titulo}
            </h3>
            <span className="font-dato text-sm font-medium text-zinc-500">{n.fecha}</span>
            {i === 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-fijate-suave px-2.5 py-0.5 text-sm font-semibold text-fijate-tinta">
                <Bombilla className="size-4" /> Nuevo
              </span>
            )}
          </div>
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-3xl border border-zinc-200">
            {n.cosas.map((c, k) => (
              <li key={k} className="flex flex-col items-start gap-2.5 p-4">
                <p className="text-base leading-snug text-zinc-700">
                  <Rich>{c.texto}</Rich>
                </p>
                {c.donde && (
                  <Pulsable
                    onClick={() => ir(c.donde.href)}
                    className="min-h-11 rounded-full border-2 border-zinc-200 bg-white px-4 text-base font-semibold text-zinc-900"
                    data-ir-novedad={c.donde.href}
                  >
                    {c.donde.etiqueta} ›
                  </Pulsable>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
