import { motion } from 'motion/react'
import { useState } from 'react'
import CaminoLecciones from '../components/CaminoLecciones.jsx'
import useCambioModulo from '../components/CambioModulo.jsx'
import { Cuadrito } from '../components/NavegadorModulos.jsx'
import { nombreNivel } from '../components/PanelEntrenamiento.jsx'
import { ICONOS_ABRE, PRACTICAS, useRuta } from '../components/rutaModulo.js'
import { getModulo } from '../content/index.js'
import { RUTAS, rutaDisponible } from '../content/rutas.js'
import { MODOS_OIDO } from '../theory/oido.js'
import { MODOS_RITMO } from '../theory/ritmo.js'
import { rutas } from '../router.js'
import { claro, tinta } from '../ui/color.js'
import Hoja from '../ui/Hoja.jsx'
import { itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'

/** Modos de cada práctica (para la hoja «Módulos y prácticas»). */
const MODOS = { ritmo: MODOS_RITMO, oido: MODOS_OIDO, letras: [] }

/**
 * Página de una RUTA (#/ruta/ritmo). Pedido del usuario: «que las rutas salgan igual a los módulos, mismas
 * animaciones y visualmente iguales»: es la página de Módulo con la ruta presentada como un módulo
 * (`rutaModulo.js`): misma cabecera fija, mismo camino de islas con globos, barra de puntitos, desenfoque y
 * deslizar entre rutas. La diferencia: sobre la barra de puntitos, un botón de vidrio (solo ícono) que abre la hoja
 * «Módulos y prácticas» (los módulos de la ruta y los ejercicios de su práctica).
 */
export default function Ruta({ id }) {
  if (!rutaDisponible(RUTAS[id])) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-16">
        <p className="text-lg text-zinc-500">Esta ruta llega pronto.</p>
        <Pulsable href={rutas.inicio()} className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
          Volver al inicio
        </Pulsable>
      </main>
    )
  }
  return <PaginaRuta key={id} id={id} />
}

function PaginaRuta({ id }) {
  const r = useRuta(id)
  const [isla, setIsla] = useState(null)
  const [verModulos, setVerModulos] = useState(false)
  const [tira, setTira] = useState(null) // pantallas anchas: camino cerrado que se arrastra de lado ({ inicio, fin })
  const cambio = useCambioModulo(r.modulo, { isla, tira })
  const modulos = r.ruta.modulos.map(getModulo).filter(Boolean)
  const modos = MODOS[r.ruta.practica] ?? []

  return (
    <>
      <motion.main
        variants={lista}
        initial="oculta"
        animate="visible"
        className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-8 px-5 pt-4 pb-28 sm:pt-6"
        style={cambio.estilo}
        {...cambio.handlers}
        data-pagina-ruta={id}
      >
        {/* Hueco de la cabecera (vive en App.jsx, como en los módulos). */}
        <div aria-hidden className="h-11 shrink-0" />

        <motion.header variants={itemLista} className="flex flex-col items-center gap-2 text-center">
          <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: tinta(r.modulo.acento) }}>
            Ruta
          </span>
          <h1 data-titulo-modulo className="font-titulo text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            {r.ruta.nombre}
          </h1>
        </motion.header>

        <motion.section
          variants={itemLista}
          aria-label="Paradas de la ruta"
          className="py-2 sm:py-6"
          style={{ marginInline: 'min(0px, calc(50% - min(50vw - 20px, 700px)))' }}
        >
          <CaminoLecciones
            modulo={r.modulo}
            progreso={r.progreso}
            onAbierta={setIsla}
            onTira={setTira}
            ruta={{
              estado: r.estado,
              nivelMax: r.nivelMax,
              meta: r.meta,
              enlaceMeta: r.enlaceMeta,
              Icono: r.modulo.Icono,
              iconosAbre: ICONOS_ABRE,
              onVerModulos: () => setVerModulos(true),
            }}
          />
        </motion.section>

      </motion.main>
      {cambio.indicadores}
      <HojaModulos abierta={verModulos} onCerrar={() => setVerModulos(false)} r={r} modulos={modulos} modos={modos} />
    </>
  )
}

/** Hoja con los módulos del curso de los que sale la ruta y los ejercicios de su práctica (con tu nivel). */
function HojaModulos({ abierta, onCerrar, r, modulos, modos }) {
  const practica = PRACTICAS[r.ruta.practica]
  const datos = practica.tienda.usar()
  const Icono = r.modulo.Icono
  return (
    <Hoja abierta={abierta} onCerrar={onCerrar} etiqueta="Módulos y prácticas">
      <div className="flex flex-col gap-5" data-hoja-modulos>
        <h2 className="font-titulo text-2xl font-bold tracking-tight">Módulos y prácticas</h2>
        {modulos.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Módulos</h3>
            {modulos.map((m) => {
              const hechas = m.lecciones.filter((l) => r.progreso.lecciones[l.id]?.completada).length
              return (
                <Pulsable
                  key={m.numero}
                  data-foco
                  href={rutas.modulo(m.numero)}
                  tipo="tarjeta"
                  className="flex min-h-20 items-center gap-4 rounded-3xl border border-zinc-200 bg-white px-4 py-3"
                >
                  <Cuadrito modulo={m} tam={52} hecho={hechas === m.lecciones.length} />
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="font-titulo text-lg font-bold leading-snug">{m.titulo}</span>
                    <span className="font-juego text-base tabular-nums" style={{ color: tinta(m.acento) }}>
                      {hechas}/{m.lecciones.length}
                    </span>
                  </span>
                  <span aria-hidden className="text-2xl text-zinc-300">
                    ›
                  </span>
                </Pulsable>
              )
            })}
          </section>
        )}
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Prácticas</h3>
          {modos.map((m) => {
            const d = practica.tienda.datosModo(m.id, datos)
            return (
              <Pulsable
                key={m.id}
                href={practica.enlace(m.id)}
                tipo="tarjeta"
                data-practica={m.id}
                className="flex min-h-20 items-center gap-4 rounded-3xl border border-zinc-200 bg-white px-4 py-3"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: claro(m.acento), color: tinta(m.acento) }} aria-hidden>
                  {Icono && <Icono className="size-7" />}
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="font-titulo text-lg font-bold leading-snug">{m.titulo}</span>
                  <span className="font-juego text-base" style={{ color: tinta(m.acento) }}>
                    {nombreNivel(m, d.nivel)}
                  </span>
                </span>
                <span aria-hidden className="text-2xl text-zinc-300">
                  ›
                </span>
              </Pulsable>
            )
          })}
          <Pulsable
            href={practica.enlace()}
            className="flex min-h-12 items-center justify-center rounded-2xl border-2 border-zinc-300 text-base font-semibold text-zinc-800"
          >
            Práctica de hoy · {practica.nombre}
          </Pulsable>
        </section>
      </div>
    </Hoja>
  )
}
