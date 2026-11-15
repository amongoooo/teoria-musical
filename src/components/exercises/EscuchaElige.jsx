import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { reproducir } from '../../audio/sonido.js'
import { acentoLeccion } from '../../content/index.js'
import { frecuencia, hz, nombre } from '../../theory/notas.js'
import { ENTRA_DERECHA, SALTO } from '../../ui/movimiento.js'
import { Bombilla, Check, Repaso } from '../../ui/Iconos.jsx'
import Pulsable from '../../ui/Pulsable.jsx'
import { IconoPlay } from '../BotonSonido.jsx'
import BotonSonido from '../BotonSonido.jsx'
import PianoRoll, { conIds } from '../PianoRoll.jsx'
import LetraAnalizada from '../LetraAnalizada.jsx'
import Rich from '../Rich.jsx'
import Rondas from './Rondas.jsx'
import { ordenNatural } from './ordenOpciones.js'

const LETRAS = ['A', 'B', 'C', 'D']

function mezclar(indices) {
  const a = [...indices]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Orden en que se muestran las opciones de texto de una ronda (pedido del usuario: que la buena no esté siempre en el mismo lugar). */
const ordenOpciones = (ronda) => {
  const idx = (ronda.opciones ?? []).map((_, i) => i)
  return ronda.ordenFijo || ordenNatural(ronda.opciones ?? []) ? idx : mezclar(idx)
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
 *  - ordenFijo: true para NO barajar las opciones de texto (se barajan siempre, salvo si tienen un orden natural:
 *    números que suben, «Ninguna · Una · Dos», «La versión A · B»; ver `ordenNatural`)
 *  - mostrarNotas: true para enseñar nota y Hz de cada sonido al responder
 *  - explicacion: texto que se muestra al comprobar
 *  - roll: { ...config del PianoRoll, notas } para leer un Piano Roll (solo lectura)
 *  - letra: { texto, colores, esquema, silabas, multis } para leer unos versos (LetraAnalizada)
 * `noLoSe` (prueba rápida): botón punteado «No lo sé» bajo las opciones; cuenta como fallo y enseña la respuesta.
 *
 * «Ahora sí se puede fallar» (en las lecciones; la prueba rápida sigue con un intento y en oro): el primer error deja
 * la opción tachada en oro y se intenta otra vez; el segundo enseña la correcta en ROJO (ícono Repaso), cuenta como mal
 * y la ronda va al repaso del final (`fallo(r)`). Con dos opciones, un solo intento (el segundo sería regalado).
 */
export default function EscuchaElige({ paso, leccionId, setAccion, siguiente, completar, fallo, noLoSe = false }) {
  const rondas = paso.rondas
  const [r, setR] = useState(0)
  const [orden] = useState(() =>
    rondas.map((ronda) => {
      const idx = (ronda.sonidos ?? []).map((_, i) => i)
      return ronda.mezclar ? mezclar(idx) : idx
    }),
  )
  // Opciones de texto barajadas cada vez que se abre el paso: posición en pantalla → índice en `ronda.opciones`.
  const [ordenOp] = useState(() => rondas.map(ordenOpciones))
  const [seleccion, setSeleccion] = useState(null)
  const [resultado, setResultado] = useState(null) // null | 'bien' | 'mal' (prueba rápida, oro) | 'rojo' (lección)
  const [descartadas, setDescartadas] = useState([]) // posiciones que ya se intentaron mal en esta ronda
  const [aciertos, setAciertos] = useState(0)
  const [notasRoll] = useState(() => rondas.map((ronda) => (ronda.roll ? conIds(ronda.roll.notas) : null)))
  const color = acentoLeccion(leccionId)

  const ronda = rondas[r]
  const sonidos = orden[r].map((i) => ronda.sonidos[i])
  const tarjetasSonOpciones = !ronda.opciones
  const opciones = useMemo(() => (ronda.opciones ? ordenOp[r].map((i) => ronda.opciones[i]) : null), [ronda, ordenOp, r])
  const correcta = tarjetasSonOpciones ? orden[r].indexOf(ronda.correcta) : ordenOp[r].indexOf(ronda.correcta)
  const ultima = r === rondas.length - 1
  const respondida = resultado !== null
  const cuantas = tarjetasSonOpciones ? sonidos.length : opciones.length
  const intentos = noLoSe || cuantas <= 2 ? 1 : 2

  useEffect(() => {
    if (!respondida) {
      const otraVez = descartadas.length > 0
      setAccion({
        label: 'Comprobar',
        disabled: seleccion === null,
        ayuda: seleccion === null && !otraVez ? (tarjetasSonOpciones ? 'Escucha y elige una tarjeta' : 'Elige una respuesta') : null,
        // Primer error: oro, sin dar la respuesta (la pista de la ronda, si tiene).
        feedback: otraVez
          ? { tipo: 'mal', titulo: 'No es esa.', texto: ronda.pista ?? (tarjetasSonOpciones || sonidos.length ? 'Escucha otra vez y prueba con otra.' : 'Prueba con otra.') }
          : null,
        onClick: () => {
          const bien = seleccion === correcta
          if (!bien && descartadas.length + 1 < intentos) {
            setDescartadas([...descartadas, seleccion])
            setSeleccion(null)
            return
          }
          const total = aciertos + (bien && descartadas.length === 0 ? 1 : 0)
          setAciertos(total)
          setResultado(bien ? 'bien' : noLoSe ? 'mal' : 'rojo')
          if (!bien && !noLoSe) fallo?.(r)
          if (ultima) completar({ aciertos: total, total: rondas.length })
        },
      })
      return
    }

    const explicacion = ronda.explicacion
    // El título del aviso es texto plano: sin los ** y * de las negritas y cursivas de la opción.
    const respuesta = tarjetasSonOpciones ? `Sonido ${LETRAS[correcta]}` : opciones[correcta].replace(/\*/g, '')
    setAccion({
      label: 'Continuar',
      avanza: ultima, // el último «Continuar» pasa de paso
      feedback:
        resultado === 'bien'
          ? { tipo: 'bien', titulo: '¡Correcto!', texto: explicacion }
          : {
              tipo: resultado === 'rojo' ? 'error' : 'mal',
              titulo: `La respuesta era: ${respuesta}`,
              texto: explicacion ?? 'Escucha otra vez los sonidos para notar la diferencia.',
            },
      onClick: () => {
        if (ultima) return siguiente()
        setR(r + 1)
        setSeleccion(null)
        setResultado(null)
        setDescartadas([])
      },
    })
  }, [respondida, resultado, seleccion, descartadas, intentos, noLoSe, correcta, opciones, aciertos, ultima, r, ronda, rondas.length, tarjetasSonOpciones, sonidos.length, setAccion, siguiente, completar, fallo])

  /** bien = la correcta (✓); rojo = la correcta tras fallar dos veces; mal = la elegida mal; descartada = ya intentada. */
  function estadoOpcion(i) {
    if (respondida) {
      if (i === correcta) return resultado === 'rojo' ? 'rojo' : 'bien'
      if (i === seleccion || descartadas.includes(i)) return 'mal'
      return null
    }
    return descartadas.includes(i) ? 'descartada' : null
  }

  const noSe = () => {
    setSeleccion(null)
    setResultado('mal')
    if (ultima) completar({ aciertos, total: rondas.length })
  }

  return (
    <div className="flex flex-col gap-6">
      <Rondas total={rondas.length} actual={r} hecha={respondida} />

      <motion.div key={r} {...ENTRA_DERECHA} className="flex flex-col gap-4">
        <p className="text-xl font-semibold leading-snug sm:text-2xl">
          <Rich>{ronda.pregunta}</Rich>
        </p>
        {ronda.roll && <PianoRoll roll={ronda.roll} notas={notasRoll[r]} color={color} />}
        {ronda.letra && <LetraAnalizada letra={ronda.letra} />}
      </motion.div>

      {tarjetasSonOpciones ? (
        <div className="grid grid-cols-2 gap-3">
          {sonidos.map((s, i) => (
            <TarjetaSonido
              key={`${r}-${i}`}
              letra={LETRAS[i]}
              sonido={s}
              seleccionada={seleccion === i}
              estado={estadoOpcion(i)}
              detalle={respondida && ronda.mostrarNotas && s.notas?.length === 1 ? s.notas[0] : null}
              onClick={() => !respondida && !descartadas.includes(i) && setSeleccion(i)}
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
            {opciones.map((op, i) => {
              const estado = estadoOpcion(i)
              return (
                <motion.div key={`${r}-${i}`} animate={estado === 'bien' || estado === 'rojo' ? SALTO : { scale: 1 }} transition={{ duration: 0.35 }}>
                  <Pulsable
                    tipo="tarjeta"
                    disabled={respondida || descartadas.includes(i)}
                    data-estado={estado ?? undefined}
                    onClick={() => setSeleccion(i)}
                    aria-pressed={seleccion === i}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-5 py-3 text-left text-lg font-medium transition-colors duration-200 ${claseEstado(estado, seleccion === i)}`}
                  >
                    <span className={`flex-1 ${estado === 'descartada' ? 'line-through decoration-2' : ''}`}>
                      <Rich>{op}</Rich>
                    </span>
                    <IconoEstado estado={estado} />
                  </Pulsable>
                </motion.div>
              )
            })}
          </div>
        </>
      )}
      {noLoSe && !respondida && <BotonNoLoSe onClick={noSe} />}
    </div>
  )
}

/** «No lo sé» (prueba rápida): punteado y gris, debajo de las respuestas; mejor que adivinar. */
export function BotonNoLoSe({ onClick }) {
  return (
    <Pulsable
      onClick={onClick}
      data-no-lo-se
      className="min-h-12 rounded-2xl border-2 border-dashed border-zinc-300 px-5 text-base font-semibold text-zinc-500"
    >
      No lo sé
    </Pulsable>
  )
}

function claseEstado(estado, seleccionada) {
  if (estado === 'bien') return 'border-bien bg-bien-suave text-bien-tinta'
  if (estado === 'rojo') return 'border-mal bg-mal-suave text-mal-tinta font-semibold'
  if (estado === 'mal' || estado === 'descartada') return 'border-fijate bg-fijate-suave text-fijate-tinta'
  if (seleccionada) return 'border-zinc-900 bg-white text-zinc-900'
  return 'border-zinc-200 bg-white text-zinc-700'
}

/** El ícono de una opción respondida (lo importante va doble: color + ícono). */
function IconoEstado({ estado }) {
  if (estado === 'bien') return <Check className="size-5 shrink-0" />
  if (estado === 'rojo') return <Repaso className="size-5 shrink-0" />
  if (estado === 'mal' || estado === 'descartada') return <Bombilla className="size-5 shrink-0" />
  return null
}

/** Tarjeta que suena al tocarla y a la vez sirve como respuesta. */
function TarjetaSonido({ letra, sonido, seleccionada, estado, detalle, onClick }) {
  const [sonando, setSonando] = useState(false)

  const tocar = () => {
    setSonando(true)
    reproducir(sonido, { alParar: () => setSonando(false) })
    onClick()
  }

  return (
    <motion.div animate={estado === 'bien' || estado === 'rojo' ? SALTO : { scale: 1 }} transition={{ duration: 0.35 }}>
    <Pulsable
      tipo="tarjeta"
      onClick={tocar}
      aria-pressed={seleccionada}
      data-estado={estado ?? undefined}
      className={`relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 p-4 transition-colors duration-200 ${claseEstado(estado, seleccionada)}`}
    >
      {estado && (
        <span className="absolute top-3 right-3">
          <IconoEstado estado={estado} />
        </span>
      )}
      <IconoPlay sonando={sonando} />
      <span className={`text-2xl font-bold ${estado === 'descartada' ? 'line-through decoration-2' : ''}`}>{letra}</span>
      {detalle && (
        <span className="text-sm font-medium opacity-80">
          {nombre(detalle)} · {hz(frecuencia(detalle))}
        </span>
      )}
    </Pulsable>
    </motion.div>
  )
}
