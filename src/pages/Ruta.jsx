import { motion } from 'motion/react'
import { useState } from 'react'
import CaminoLecciones from '../components/CaminoLecciones.jsx'
import useCambioModulo from '../components/CambioModulo.jsx'
import { ICONOS_ABRE, useCarruselModulos, useModulosYPracticas, useRuta } from '../components/rutaModulo.js'
import { RUTAS, rutaDisponible } from '../content/rutas.js'
import { rutas } from '../router.js'
import { tinta } from '../ui/color.js'
import { itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'

/** Con el carrusel de módulos a la vista, la página no cambia de ruta con gestos (el carrusel se queda los swipes). */
const SIN_CAMBIO = { inicio: false, fin: false }

/**
 * Página de una RUTA (#/ruta/ritmo). Pedido del usuario: «que las rutas salgan igual a los módulos, mismas
 * animaciones y visualmente iguales»: es la página de Módulo con la ruta presentada como un módulo
 * (`rutaModulo.js`): misma cabecera fija, mismo camino de islas con globos, barra de puntitos, desenfoque y
 * deslizar entre rutas. La diferencia: sobre la barra de puntitos, un botón de vidrio (solo ícono) que cambia las islas
 * por el carrusel «Módulos y prácticas» (los módulos que usa la ruta y los ejercicios de su práctica; CarruselModulos).
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
  const [tira, setTira] = useState(null) // pantallas anchas: camino cerrado que se arrastra de lado ({ inicio, fin })
  const filas = useModulosYPracticas(r.ruta.paradas, () => r.ruta.practica, r.ruta.practica)
  const carrusel = useCarruselModulos(filas)
  const cambio = useCambioModulo(r.modulo, { isla: carrusel.abierto ? SIN_CAMBIO : isla, tira })

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
              onVerModulos: carrusel.onTocar,
              onInsigniaVer: carrusel.onAbrir,
              carrusel,
            }}
          />
        </motion.section>

      </motion.main>
      {cambio.indicadores}
    </>
  )
}
