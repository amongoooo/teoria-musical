import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { reproducir } from '../../audio/sonido.js'
import { ENTRA_DERECHA, RESORTE, SALTO } from '../../ui/movimiento.js'
import { Bombilla, Check } from '../../ui/Iconos.jsx'
import Pulsable from '../../ui/Pulsable.jsx'
import { IconoPlay } from '../BotonSonido.jsx'
import Rich from '../Rich.jsx'
import Rondas from './Rondas.jsx'

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']

function mezclar(n, activo = true) {
  const a = Array.from({ length: n }, (_, i) => i)
  if (!activo) return a
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * «Emparejar» (O6): varios sonidos y sus nombres a la vez.
 *
 * paso.rondas: [{ pregunta, parejas: [{ sonido, nombre, detalle }], explicacion, mezclar }]
 *  - Cada sonido es una fila (A, B, C…) con su botón de escuchar y un hueco para el nombre.
 *  - Abajo, los nombres (mezclados). Se toca un nombre y va al hueco activo (el primero vacío,
 *    o la fila que se acaba de escuchar o tocar). Tocar un hueco lleno devuelve el nombre.
 *  - Con todos los huecos llenos, «Comprobar»: cada fila dice si está bien (✓ verde) o cuál era (bombilla, oro).
 * Puntúa una pareja por acierto.
 */
export default function Emparejar({ paso, setAccion, siguiente, completar }) {
  const rondas = paso.rondas
  const [r, setR] = useState(0)
  const [ordenes] = useState(() =>
    rondas.map((ronda) => ({
      filas: mezclar(ronda.parejas.length, ronda.mezclar !== false),
      nombres: mezclar(ronda.parejas.length, ronda.mezclar !== false),
    })),
  )
  const ronda = rondas[r]
  const n = ronda.parejas.length
  const { filas, nombres } = ordenes[r]
  const [asignado, setAsignado] = useState(() => Array(n).fill(null)) // fila → índice de pareja del nombre puesto
  const [activa, setActiva] = useState(0)
  const [resultado, setResultado] = useState(null) // null | [bool por fila]
  const [aciertos, setAciertos] = useState(0)
  const [sonando, setSonando] = useState(null)
  const timer = useRef(null)
  const banco = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const respondida = resultado !== null
  const ultima = r === rondas.length - 1
  const vacias = asignado.filter((a) => a === null).length
  const totalParejas = rondas.reduce((s, x) => s + x.parejas.length, 0)

  const escuchar = (fila) => {
    const dur = reproducir(ronda.parejas[filas[fila]].sonido)
    setSonando(fila)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSonando(null), dur * 1000)
    if (!respondida) {
      setActiva(fila)
      verBanco()
    }
  }

  /** En el celular los nombres pueden quedar bajo la barra de abajo: al escuchar, la página sube lo justo para verlos. */
  const verBanco = () => {
    const el = banco.current
    const barra = document.querySelector('[data-barra-accion]')
    if (!el || !barra) return
    const tapado = el.getBoundingClientRect().bottom - (window.innerHeight - barra.offsetHeight - 8)
    if (tapado > 1) window.scrollBy({ top: tapado, behavior: 'smooth' })
  }

  /** Siguiente fila vacía a partir de `desde` (dando la vuelta), o null. */
  const siguienteVacia = (lista, desde) => {
    for (let k = 0; k < n; k++) {
      const i = (desde + k) % n
      if (lista[i] === null) return i
    }
    return null
  }

  const ponerNombre = (pareja) => {
    if (respondida) return
    const destino = activa ?? siguienteVacia(asignado, 0)
    if (destino === null) return
    const nuevo = [...asignado]
    nuevo[destino] = pareja
    setAsignado(nuevo)
    setActiva(siguienteVacia(nuevo, destino + 1))
  }

  const tocarHueco = (fila) => {
    if (respondida) return
    if (asignado[fila] !== null) {
      const nuevo = [...asignado]
      nuevo[fila] = null
      setAsignado(nuevo)
    }
    setActiva(fila)
  }

  useEffect(() => {
    if (!respondida) {
      setAccion({
        label: 'Comprobar',
        disabled: vacias > 0,
        ayuda:
          vacias === n
            ? 'Escucha un sonido y toca su nombre'
            : vacias > 0
              ? `Falta${vacias === 1 ? '' : 'n'} ${vacias}`
              : null,
        onClick: () => {
          const bien = asignado.map((a, fila) => ronda.parejas[a].nombre === ronda.parejas[filas[fila]].nombre)
          const total = aciertos + bien.filter(Boolean).length
          setAciertos(total)
          setResultado(bien)
          setActiva(null)
          if (ultima) completar({ aciertos: total, total: totalParejas })
        },
      })
      return
    }
    const buenas = resultado.filter(Boolean).length
    setAccion({
      label: 'Siguiente',
      avanza: ultima, // el último «Siguiente» pasa de paso
      feedback:
        buenas === n
          ? { tipo: 'bien', titulo: '¡Todas bien!', texto: ronda.explicacion }
          : {
              tipo: 'mal',
              titulo: `${buenas} de ${n} bien`,
              texto: ronda.explicacion ?? 'Cada fila marcada te dice cuál era. Vuelve a escucharlas para notar la diferencia.',
            },
      onClick: () => {
        if (ultima) return siguiente()
        const m = rondas[r + 1].parejas.length
        setR(r + 1)
        setAsignado(Array(m).fill(null))
        setActiva(0)
        setResultado(null)
      },
    })
  }, [respondida, resultado, asignado, vacias, n, aciertos, ultima, r, ronda, rondas, filas, totalParejas, setAccion, siguiente, completar])

  return (
    <div className="flex flex-col gap-4">
      <Rondas total={rondas.length} actual={r} hecha={respondida} />

      <motion.div key={r} {...ENTRA_DERECHA} className="flex flex-col gap-4">
        {ronda.pregunta && <p className="text-xl font-semibold leading-snug sm:text-2xl">{ronda.pregunta}</p>}

        <ul className="flex flex-col gap-2">
          {filas.map((p, fila) => {
            const puesto = asignado[fila]
            const estado = respondida ? (resultado[fila] ? 'bien' : 'mal') : null
            const pareja = ronda.parejas[p]
            return (
              <motion.li
                key={fila}
                animate={estado === 'bien' ? SALTO : { scale: 1 }}
                transition={{ duration: 0.35, delay: fila * 0.06 }}
                className="flex items-stretch gap-2"
              >
                <Pulsable
                  onClick={() => escuchar(fila)}
                  aria-label={`Escuchar el sonido ${LETRAS[fila]}`}
                  className={`flex w-[4.75rem] shrink-0 items-center justify-center gap-2 rounded-2xl border-2 transition-colors duration-200 ${
                    sonando === fila ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-zinc-200 bg-white text-zinc-900'
                  }`}
                >
                  <IconoPlay sonando={sonando === fila} />
                  <span className="text-lg font-bold">{LETRAS[fila]}</span>
                </Pulsable>

                <Pulsable
                  tipo="tarjeta"
                  disabled={respondida}
                  onClick={() => tocarHueco(fila)}
                  aria-label={puesto === null ? `Hueco del sonido ${LETRAS[fila]}, vacío` : `Sonido ${LETRAS[fila]}: ${ronda.parejas[puesto].nombre}. Tocar para quitarlo`}
                  aria-pressed={activa === fila}
                  className={`flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl border-2 px-4 py-1.5 text-left transition-colors duration-200 ${claseHueco(estado, puesto !== null, activa === fila)}`}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    {puesto === null ? (
                      <span className="text-base text-zinc-500">{activa === fila ? 'Toca su nombre' : 'Vacío'}</span>
                    ) : (
                      <motion.span layoutId={`emparejar-${r}-${puesto}`} transition={RESORTE.suave} className="text-lg font-semibold leading-snug">
                        {ronda.parejas[puesto].nombre}
                      </motion.span>
                    )}
                    {estado === 'mal' && (
                      <span className="text-base leading-snug">
                        Era <strong>{pareja.nombre}</strong>
                      </span>
                    )}
                    {estado && pareja.detalle && (
                      <span className="text-sm font-medium leading-snug opacity-80">
                        <Rich>{pareja.detalle}</Rich>
                      </span>
                    )}
                  </span>
                  {estado === 'bien' && <Check className="size-6 shrink-0" />}
                  {estado === 'mal' && <Bombilla className="size-6 shrink-0" />}
                </Pulsable>
              </motion.li>
            )
          })}
        </ul>

        {!respondida && (
          <div ref={banco} className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Nombres</p>
            <div className="grid grid-cols-2 gap-2">
              {nombres.map((p) => {
                const usado = asignado.includes(p)
                return usado ? (
                  <div key={p} aria-hidden className="min-h-12 rounded-2xl border-2 border-dashed border-zinc-200" />
                ) : (
                  <Pulsable
                    key={p}
                    tipo="tarjeta"
                    onClick={() => ponerNombre(p)}
                    className="grid min-h-12 place-items-center rounded-2xl border-2 border-zinc-200 bg-white px-3 py-1.5 text-center text-lg font-semibold text-zinc-900"
                  >
                    <motion.span layoutId={`emparejar-${r}-${p}`} transition={RESORTE.suave}>
                      {ronda.parejas[p].nombre}
                    </motion.span>
                  </Pulsable>
                )
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function claseHueco(estado, lleno, activo) {
  if (estado === 'bien') return 'border-bien bg-bien-suave text-bien-tinta'
  if (estado === 'mal') return 'border-fijate bg-fijate-suave text-fijate-tinta'
  if (activo) return 'border-zinc-900 bg-white text-zinc-900'
  if (lleno) return 'border-zinc-200 bg-white text-zinc-900'
  return 'border-dashed border-zinc-300 bg-white text-zinc-900'
}
