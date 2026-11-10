import { motion } from 'motion/react'
import { useCallback, useState } from 'react'
import CaminoLecciones, { IconoCandado } from '../components/CaminoLecciones.jsx'
import Rich from '../components/Rich.jsx'
import { estadoLeccion, getLeccion, getModulo, leccionAnterior } from '../content/index.js'
import { reiniciarLeccion, useProgreso } from '../progress/progreso.js'
import { navegar, rutas } from '../router.js'
import BarraProgreso from '../ui/BarraProgreso.jsx'
import { oscuro } from '../ui/color.js'
import Hoja from '../ui/Hoja.jsx'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import Volver from '../ui/Volver.jsx'

export default function Modulo({ numero }) {
  const modulo = getModulo(numero)
  const progreso = useProgreso()
  const [elegida, setElegida] = useState(null) // lección cuya hoja está abierta
  const cerrar = useCallback(() => setElegida(null), [])

  if (!modulo) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-16">
        <p className="text-lg text-zinc-500">Este módulo no existe.</p>
        <Pulsable href={rutas.inicio()} className="grid min-h-14 place-items-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white">
          Volver al inicio
        </Pulsable>
      </main>
    )
  }

  const hechas = modulo.lecciones.filter((l) => progreso.lecciones[l.id]?.completada).length
  const total = modulo.lecciones.length

  return (
    <motion.main
      variants={lista}
      initial="oculta"
      animate="visible"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-5 py-6 sm:py-10"
    >
      <Volver href={rutas.inicio()}>Inicio</Volver>

      <motion.header variants={itemLista} className="flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: oscuro(modulo.acento) }}>
          Módulo {modulo.numero}
        </span>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{modulo.titulo}</h1>
        <p className="text-lg text-zinc-600">{modulo.descripcion}</p>
        <div className="flex items-center gap-3">
          <BarraProgreso valor={total ? hechas / total : 0} color={modulo.acento} className="flex-1" />
          <span className="text-sm tabular-nums text-zinc-500">
            {hechas}/{total}
          </span>
        </div>
      </motion.header>

      <motion.section variants={itemLista} aria-label="Lecciones del módulo">
        <CaminoLecciones modulo={modulo} progreso={progreso} onElegir={setElegida} />
      </motion.section>

      <motion.section variants={itemLista} className="flex flex-col gap-4 rounded-3xl bg-zinc-100 p-5">
        <div>
          <h2 className="text-base font-semibold text-zinc-800">¿Qué se siente?</h2>
          <p className="text-base text-zinc-600">{modulo.siente}</p>
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-800">Reto del módulo en FL Studio</h2>
          <p className="text-base text-zinc-600">{modulo.reto}</p>
        </div>
      </motion.section>

      <Hoja abierta={Boolean(elegida)} onCerrar={cerrar} etiqueta={elegida ? `Lección ${elegida.id}: ${elegida.titulo}` : ''}>
        {elegida && <DetalleLeccion meta={elegida} modulo={modulo} progreso={progreso} onElegir={setElegida} onCerrar={cerrar} />}
      </Hoja>
    </motion.main>
  )
}

/** Contenido de la hoja: qué es la lección, cómo vas y qué puedes hacer (empezar, continuar, reiniciar…). */
function DetalleLeccion({ meta, modulo, progreso, onElegir, onCerrar }) {
  const estado = estadoLeccion(meta.id, progreso)
  const leccion = getLeccion(meta.id)
  const p = progreso.lecciones[meta.id]
  const anterior = leccionAnterior(meta.id)
  const ir = (reiniciar = false) => {
    if (reiniciar) reiniciarLeccion(meta.id)
    navegar(rutas.leccion(meta.id))
  }

  const primario = 'grid min-h-14 w-full place-items-center rounded-2xl bg-zinc-900 px-6 text-lg font-semibold text-white'
  const secundario = 'grid min-h-14 w-full place-items-center rounded-2xl border-2 border-zinc-200 bg-white px-6 text-lg font-semibold text-zinc-800'

  return (
    <motion.div key={meta.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={RESORTE.pantalla} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 pr-10">
        <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: oscuro(modulo.acento) }}>
          Lección {meta.id}
        </span>
        <h2 className="text-2xl font-bold leading-tight tracking-tight">{meta.titulo}</h2>
        {leccion && (
          <p className="text-base text-zinc-600">
            {leccion.subtitulo} · ~{leccion.minutos} min · {leccion.pasos.length} pasos
          </p>
        )}
      </div>

      {estado === 'empezada' && (
        <div className="flex flex-col gap-2 rounded-2xl bg-zinc-100 px-4 py-3">
          <span className="text-base font-medium text-zinc-800">
            Vas por el paso {p.paso + 1} de {leccion.pasos.length}
          </span>
          <BarraProgreso valor={p.paso / leccion.pasos.length} color={modulo.acento} fondo="bg-white" alto="h-2" />
        </div>
      )}
      {estado === 'hecha' && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-base font-medium text-emerald-900">
          ✓ Completada{p.total ? ` · ${p.aciertos} de ${p.total} a la primera` : ''}
        </p>
      )}
      {estado === 'bloqueada' && (
        <p className="flex items-start gap-3 rounded-2xl bg-zinc-100 px-4 py-3 text-base text-zinc-700">
          <IconoCandado className="mt-0.5 size-6 shrink-0 text-zinc-500" />
          <span>
            <Rich>{`Termina **${anterior.titulo}** para desbloquear esta lección.`}</Rich>
          </span>
        </p>
      )}
      {estado === 'proximamente' && <p className="rounded-2xl bg-zinc-100 px-4 py-3 text-base text-zinc-700">Esta lección llega pronto.</p>}

      <div className="flex flex-col gap-3">
        {estado === 'nueva' && (
          <Pulsable data-foco onClick={() => ir()} className={primario}>
            Empezar
          </Pulsable>
        )}
        {estado === 'empezada' && (
          <>
            <Pulsable data-foco onClick={() => ir()} className={primario}>
              Continuar
            </Pulsable>
            <Pulsable onClick={() => ir(true)} className={secundario}>
              Empezar de cero
            </Pulsable>
          </>
        )}
        {estado === 'hecha' && (
          <Pulsable data-foco onClick={() => ir(true)} className={primario}>
            Repetir lección
          </Pulsable>
        )}
        {estado === 'bloqueada' && (
          <>
            <Pulsable data-foco onClick={() => onElegir(anterior)} className={primario}>
              Ir a la lección {anterior.id}
            </Pulsable>
            <Pulsable onClick={onCerrar} className={secundario}>
              Entendido
            </Pulsable>
          </>
        )}
        {estado === 'proximamente' && (
          <Pulsable data-foco onClick={onCerrar} className={primario}>
            Entendido
          </Pulsable>
        )}
      </div>
    </motion.div>
  )
}


