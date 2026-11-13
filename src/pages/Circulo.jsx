import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Note } from 'tonal'
import { playNotes } from '../audio/engine.js'
import BotonSonido from '../components/BotonSonido.jsx'
import CirculoNodos, { CentroNodos, tonalidad } from '../components/CirculoNodos.jsx'
import { datosCasilla, es, escalaDe } from '../components/CirculoQuintas.jsx'
import TecladoTonalidad from '../components/TecladoTonalidad.jsx'
import { guardarTonalidad, ultimaTonalidad } from '../progress/circulo.js'
import { notasQueCambian } from '../theory/escalas.js'
import { tinta } from '../ui/color.js'
import { RESORTE, itemLista, lista } from '../ui/movimiento.js'
import Pulsable from '../ui/Pulsable.jsx'
import { BotonInicio } from '../ui/Volver.jsx'

/** Color del explorador: el del Módulo 3 (intervalos y escalas, donde se aprende el círculo). */
export const COLOR_CIRCULO = 'var(--color-modulo-3)'
const COLOR = COLOR_CIRCULO
const BRILLO_MS = 380

/**
 * Explorador del círculo de quintas (#/circulo; propuesta A «Ventana de 7 notas», elegida por el usuario):
 * el círculo de nodos fijo con Do arriba; al tocar una tonalidad se prenden sus 7 notas en el círculo y en el
 * teclado, su armadura sale en fichas (en orden) y abajo están sus vecinas y su relativa con la nota que cambia.
 * Pasar a otra: la línea gira, la tecla nueva salta en oro y la que se va deja un contorno que se apaga.
 * Sin textos de instrucciones: lo dicen el color y el movimiento.
 */
export default function Circulo() {
  const [id, setId] = useState(ultimaTonalidad)
  const [cambio, setCambio] = useState(null)
  const [sonando, setSonando] = useState([])
  const timers = useRef(new Set())
  const t = tonalidad(id)

  useEffect(() => guardarTonalidad(id), [id])
  // La nota nueva se queda en oro 1,6 s y vuelve al color de las demás.
  useEffect(() => {
    if (!cambio) return
    const timer = setTimeout(() => setCambio(null), 1600)
    return () => clearTimeout(timer)
  }, [cambio])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  /** Prende un momento el nodo y la tecla de las notas que suenan. */
  const prender = (cromas) => {
    setSonando((s) => [...new Set([...s, ...cromas])])
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      setSonando((s) => s.filter((c) => !cromas.includes(c)))
    }, BRILLO_MS)
    timers.current.add(timer)
  }

  const elegir = (nuevo) => {
    const escala = escalaDe(nuevo)
    playNotes(escala[0], { duracion: 0.8 })
    prender([Note.chroma(escala[0])])
    if (nuevo === id) return
    const c = notasQueCambian(t.notas, tonalidad(nuevo).notas)
    setCambio(c.entran.length ? { ...c, n: Date.now() } : null)
    setId(nuevo)
  }

  return (
    <motion.main
      variants={lista}
      initial="oculta"
      animate="visible"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-5 px-5 pt-4 pb-14 sm:pt-8"
      data-explorador-circulo
    >
      <motion.header variants={itemLista} className="flex items-center gap-3">
        <BotonInicio />
        <h1 className="font-titulo text-3xl font-bold tracking-tight">Círculo de quintas</h1>
      </motion.header>

      <motion.div variants={itemLista}>
        <CirculoNodos color={COLOR} seleccion={id} sonando={sonando} onElegir={elegir} centro={<CentroNodos id={id} color={COLOR} />} />
      </motion.div>

      <motion.div variants={itemLista}>
        <Armadura notas={t.armadura.notas} />
      </motion.div>

      <motion.div variants={itemLista}>
        <TecladoTonalidad notas={t.notas} color={COLOR} cambio={cambio} sonando={sonando} onTocar={(c) => prender([c])} />
      </motion.div>

      <motion.div variants={itemLista} className="grid grid-cols-3 gap-2">
        <Vecina rol="subdominante" de={t} id={t.subdominante} onIr={elegir} />
        <Vecina rol="relativa" de={t} id={t.relativa} onIr={elegir} />
        <Vecina rol="dominante" de={t} id={t.dominante} onIr={elegir} />
      </motion.div>

      <motion.div variants={itemLista} className="flex flex-col">
        <BotonSonido
          sonido={{ notas: escalaDe(id), intervalo: 0.22, duracion: 0.45 }}
          etiqueta={`Escuchar ${t.nombre}`}
          onNotas={(notas) => prender(notas.map(Note.chroma))}
        />
      </motion.div>
    </motion.main>
  )
}

/**
 * La armadura en fichas, en el orden en que se escriben (Fa♯ Do♯ Sol♯… / Si♭ Mi♭ La♭…). Si al cambiar de
 * tonalidad se añade una al final (a la dominante), esa entra en oro con un pop.
 */
function Armadura({ notas }) {
  const antes = useRef(notas)
  const [nueva, setNueva] = useState(-1)
  const clave = notas.join(' ')
  useEffect(() => {
    const previa = antes.current
    antes.current = notas
    if (notas.length !== previa.length + 1 || !previa.every((n, i) => notas[i] === n)) return setNueva(-1)
    setNueva(notas.length - 1)
    const timer = setTimeout(() => setNueva(-1), 1600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])
  return (
    <ol className="flex min-h-11 flex-wrap items-center justify-center gap-1.5" aria-label="Armadura" data-armadura>
      {!notas.length && (
        <li className="grid min-h-10 place-items-center rounded-full border-2 border-dashed border-zinc-300 px-4 text-sm text-zinc-500">sin ♯ ni ♭</li>
      )}
      {notas.map((n, i) => (
        <motion.li
          key={n}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 520, damping: 14 }}
          data-ficha={n}
          data-nueva={i === nueva || undefined}
          className={`grid min-h-10 min-w-13 place-items-center rounded-full border-2 px-3 font-dato text-[15px] font-medium transition-colors duration-700 ${
            i === nueva ? 'border-fijate bg-fijate text-negro' : 'border-zinc-200 bg-white text-zinc-900'
          }`}
        >
          {es(n)}
        </motion.li>
      ))}
    </ol>
  )
}

/** Tarjeta de una vecina: su papel, su nombre y qué nota cambia al pasar a ella (en oro la que entra). */
function Vecina({ rol, de, id, onIr }) {
  const d = datosCasilla(id)
  const { salen, entran } = notasQueCambian(de.notas, tonalidad(id).notas)
  return (
    <Pulsable
      tipo="tarjeta"
      onClick={() => onIr(id)}
      data-vecina={rol}
      aria-label={`${rol}: ${d.nombre}`}
      className="flex min-w-0 flex-col items-center gap-1 rounded-[1.25rem] border-2 border-zinc-200 bg-white px-1 pt-2.5 pb-3 text-center"
      style={{ boxShadow: '0 4px 0 var(--color-zinc-200)' }}
    >
      <span className="text-sm text-zinc-500">{rol}</span>
      <motion.span
        key={id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={RESORTE.suave}
        className="font-titulo text-base font-bold leading-tight"
        style={{ color: tinta(COLOR) }}
      >
        {d.nombre}
      </motion.span>
      {entran.length ? (
        <span className="whitespace-nowrap rounded-full bg-fijate-suave px-2 py-0.5 font-dato text-sm font-medium text-fijate-tinta" data-cambia>
          {es(salen[0])} → <span className="rounded-md bg-fijate px-1 text-negro">{es(entran[0])}</span>
        </span>
      ) : (
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-dato text-sm font-medium text-zinc-600">mismas</span>
      )}
    </Pulsable>
  )
}
