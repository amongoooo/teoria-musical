import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { reproducir } from '../../audio/sonido.js'
import { getModulo } from '../../content/index.js'
import { frecuencia, hz, nombre } from '../../theory/notas.js'
import { ENTRA_DERECHA, SALTO } from '../../ui/movimiento.js'
import Pulsable from '../../ui/Pulsable.jsx'
import { IconoPlay } from '../BotonSonido.jsx'
import BotonSonido from '../BotonSonido.jsx'
import PianoRoll, { conIds } from '../PianoRoll.jsx'
import Rich from '../Rich.jsx'
import Rondas from './Rondas.jsx'

const LETRAS = ['A', 'B', 'C', 'D']

function mezclar(indices) {
  const a = [...indices]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * "Escucha y elige": una o varias rondas de pregunta con respuesta única.
 *
 * Cada ronda:
 *  - pregunta: texto
 *  - sonidos: [{ notas | frecuencia, etiqueta?, velocidad? }]
 *  - opciones: ['texto', …] — si se omite, las tarjetas de sonido SON las opciones
 *  - correcta: índice de la opción (o del sonido) correcto
 *  - mezclar: true para ordenar los sonidos al azar
 *  - mostrarNotas: true para enseñar nota y Hz de cada sonido al responder
 *  - explicacion: texto que se muestra al comprobar
 *  - roll: { ...config del PianoRoll, notas } para leer un Piano Roll (solo lectura)
 */
export default function EscuchaElige({ paso, leccionId, setAccion, siguiente, completar }) {
  const rondas = paso.rondas
  const [r, setR] = useState(0)
  const [orden] = useState(() =>
    rondas.map((ronda) => {
      const idx = (ronda.sonidos ?? []).map((_, i) => i)
      return ronda.mezclar ? mezclar(idx) : idx
    }),
  )
  const [seleccion, setSeleccion] = useState(null)
  const [resultado, setResultado] = useState(null) // null | 'bien' | 'mal'
  const [aciertos, setAciertos] = useState(0)
  const [notasRoll] = useState(() => rondas.map((ronda) => (ronda.roll ? conIds(ronda.roll.notas) : null)))
  const color = getModulo(Number(String(leccionId).split('.')[0]))?.acento

  const ronda = rondas[r]
  const sonidos = orden[r].map((i) => ronda.sonidos[i])
  const tarjetasSonOpciones = !ronda.opciones
  const correcta = tarjetasSonOpciones ? orden[r].indexOf(ronda.correcta) : ronda.correcta
  const ultima = r === rondas.length - 1
  const respondida = resultado !== null

  useEffect(() => {
    if (!respondida) {
      setAccion({
        label: 'Comprobar',
        disabled: seleccion === null,
        ayuda: seleccion === null ? (tarjetasSonOpciones ? 'Escucha y elige una tarjeta' : 'Elige una respuesta') : null,
        onClick: () => {
          const bien = seleccion === correcta
          const total = aciertos + (bien ? 1 : 0)
          setAciertos(total)
          setResultado(bien ? 'bien' : 'mal')
          if (ultima) completar({ aciertos: total, total: rondas.length })
        },
      })
      return
    }

    const explicacion = ronda.explicacion
    const respuesta = tarjetasSonOpciones ? `Sonido ${LETRAS[correcta]}` : ronda.opciones[correcta]
    setAccion({
      label: ultima ? 'Continuar' : 'Siguiente',
      feedback:
        resultado === 'bien'
          ? { tipo: 'bien', titulo: '¡Correcto!', texto: explicacion }
          : { tipo: 'mal', titulo: `La respuesta era: ${respuesta}`, texto: explicacion ?? 'Escucha otra vez los sonidos para notar la diferencia.' },
      onClick: () => {
        if (ultima) return siguiente()
        setR(r + 1)
        setSeleccion(null)
        setResultado(null)
      },
    })
  }, [respondida, resultado, seleccion, correcta, aciertos, ultima, r, ronda, rondas.length, tarjetasSonOpciones, setAccion, siguiente, completar])

  return (
    <div className="flex flex-col gap-6">
      <Rondas total={rondas.length} actual={r} hecha={respondida} />

      <motion.div key={r} {...ENTRA_DERECHA} className="flex flex-col gap-4">
        <p className="text-xl font-semibold leading-snug sm:text-2xl">{ronda.pregunta}</p>
        {ronda.roll && <PianoRoll roll={ronda.roll} notas={notasRoll[r]} color={color} />}
      </motion.div>

      {tarjetasSonOpciones ? (
        <div className="grid grid-cols-2 gap-3">
          {sonidos.map((s, i) => (
            <TarjetaSonido
              key={`${r}-${i}`}
              letra={LETRAS[i]}
              sonido={s}
              seleccionada={seleccion === i}
              estado={respondida ? (i === correcta ? 'bien' : i === seleccion ? 'mal' : null) : null}
              detalle={respondida && ronda.mostrarNotas && s.notas?.length === 1 ? s.notas[0] : null}
              onClick={() => !respondida && setSeleccion(i)}
            />
          ))}
        </div>
      ) : (
        <>
          {sonidos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {sonidos.map((s, i) => (
                <BotonSonido key={`${r}-${i}`} sonido={s} etiqueta={s.etiqueta ?? LETRAS[i]} />
              ))}
            </div>
          )}
          <div className="flex flex-col gap-3">
            {ronda.opciones.map((op, i) => {
              const estado = respondida ? (i === correcta ? 'bien' : i === seleccion ? 'mal' : null) : null
              return (
                <motion.div key={`${r}-${i}`} animate={estado === 'bien' ? SALTO : { scale: 1 }} transition={{ duration: 0.35 }}>
                  <Pulsable
                    tipo="tarjeta"
                    disabled={respondida}
                    onClick={() => setSeleccion(i)}
                    aria-pressed={seleccion === i}
                    className={`min-h-14 w-full rounded-2xl border-2 px-5 py-3 text-left text-lg font-medium transition-colors duration-200 ${claseEstado(estado, seleccion === i)}`}
                  >
                    <Rich>{op}</Rich>
                  </Pulsable>
                </motion.div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function claseEstado(estado, seleccionada) {
  if (estado === 'bien') return 'border-bien bg-bien-suave text-bien-tinta'
  if (estado === 'mal') return 'border-fijate bg-fijate-suave text-fijate-tinta'
  if (seleccionada) return 'border-zinc-900 bg-white text-zinc-900'
  return 'border-zinc-200 bg-white text-zinc-700'
}

/** Tarjeta que suena al tocarla y a la vez sirve como respuesta. */
function TarjetaSonido({ letra, sonido, seleccionada, estado, detalle, onClick }) {
  const [sonando, setSonando] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const tocar = () => {
    const dur = reproducir(sonido)
    setSonando(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSonando(false), dur * 1000)
    onClick()
  }

  return (
    <motion.div animate={estado === 'bien' ? SALTO : { scale: 1 }} transition={{ duration: 0.35 }}>
    <Pulsable
      tipo="tarjeta"
      onClick={tocar}
      aria-pressed={seleccionada}
      className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 p-4 transition-colors duration-200 ${claseEstado(estado, seleccionada)}`}
    >
      <IconoPlay sonando={sonando} />
      <span className="text-2xl font-bold">{letra}</span>
      {detalle && (
        <span className="text-sm font-medium opacity-80">
          {nombre(detalle)} · {hz(frecuencia(detalle))}
        </span>
      )}
    </Pulsable>
    </motion.div>
  )
}
