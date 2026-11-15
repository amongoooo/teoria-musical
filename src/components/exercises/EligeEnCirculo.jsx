import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { playNotes } from '../../audio/engine.js'
import { acentoLeccion } from '../../content/index.js'
import { ENTRA_DERECHA } from '../../ui/movimiento.js'
import useSobreBarra from '../../ui/useSobreBarra.js'
import BotonSonido from '../BotonSonido.jsx'
import CirculoQuintas, { CentroTonalidad, datosCasilla } from '../CirculoQuintas.jsx'
import Rich from '../Rich.jsx'
import { BotonNoLoSe } from './EscuchaElige.jsx'
import Rondas from './Rondas.jsx'

/**
 * «Encuentra en el círculo» (O7, lección 3.5): la respuesta es una casilla del círculo de quintas.
 *
 * Cada ronda:
 *  - pregunta: texto (admite **negritas**)
 *  - correcta: id de la casilla: una mayor ('D') o una menor ('Bm')
 *  - anillo: 'mayor' | 'menor' | 'ambos' (qué anillo se puede tocar; por defecto, el de la respuesta)
 *  - armaduras: true para mostrar «2♯» en las mayores (por defecto no: suele ser la pregunta)
 *  - menores: false para ocultar el anillo de dentro (por defecto se ve si se puede tocar o si la respuesta es menor)
 *  - resaltar: ids en el tono suave del módulo (p. ej. la tonalidad de la que se parte)
 *  - sonidos: [sonido…] opcionales (botones encima del círculo)
 *  - explicacion: texto al comprobar
 * Tocar una casilla la elige y suena su tónica. `noLoSe` (prueba rápida): botón «No lo sé» bajo el círculo.
 */
export default function EligeEnCirculo({ paso, leccionId, setAccion, siguiente, completar, fallo, noLoSe = false }) {
  const rondas = paso.rondas
  const [r, setR] = useState(0)
  const [seleccion, setSeleccion] = useState(null)
  const [resultado, setResultado] = useState(null) // null | 'bien' | 'mal' (prueba rápida, oro) | 'rojo' (lección: dos fallos)
  const [descartadas, setDescartadas] = useState([]) // casillas ya intentadas mal (primer intento: oro)
  const [aciertos, setAciertos] = useState(0)
  const color = acentoLeccion(leccionId)
  const circuloRef = useRef(null)
  useSobreBarra(circuloRef) // al comprobar, la barra crece: que no tape el círculo

  const ronda = rondas[r]
  const ultima = r === rondas.length - 1
  const respondida = resultado !== null
  const correcta = datosCasilla(ronda.correcta)
  const anillo = ronda.anillo ?? (correcta.menor ? 'menor' : 'mayor')
  const menores = ronda.menores ?? (anillo !== 'mayor' || correcta.menor)

  const intentos = noLoSe ? 1 : 2

  useEffect(() => {
    if (!respondida) {
      setAccion({
        label: 'Comprobar',
        disabled: seleccion === null,
        ayuda: null,
        feedback: descartadas.length ? { tipo: 'mal', titulo: 'No es esa.', texto: ronda.pista ?? 'Prueba con otra casilla.' } : null,
        onClick: () => {
          const bien = seleccion === ronda.correcta
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
    setAccion({
      label: 'Continuar',
      avanza: ultima,
      feedback:
        resultado === 'bien'
          ? { tipo: 'bien', titulo: '¡Correcto!', texto: ronda.explicacion }
          : { tipo: resultado === 'rojo' ? 'error' : 'mal', titulo: `La respuesta era: ${correcta.nombre}`, texto: ronda.explicacion },
      onClick: () => {
        if (ultima) return siguiente()
        setR(r + 1)
        setSeleccion(null)
        setResultado(null)
        setDescartadas([])
      },
    })
  }, [respondida, resultado, seleccion, descartadas, intentos, noLoSe, aciertos, ultima, r, ronda, correcta, rondas.length, setAccion, siguiente, completar, fallo])

  const noSe = () => {
    setSeleccion(null)
    setResultado('mal')
    if (ultima) completar({ aciertos, total: rondas.length })
  }

  const elegir = (id) => {
    if (respondida || descartadas.includes(id)) return
    setSeleccion(id)
    const d = datosCasilla(id)
    playNotes(`${d.tonica}4`, { duracion: 0.5 })
  }

  const yaMal = Object.fromEntries(descartadas.map((id) => [id, 'mal']))
  const estados = respondida
    ? { ...yaMal, ...(resultado !== 'bien' && seleccion ? { [seleccion]: 'mal' } : {}), [ronda.correcta]: resultado === 'rojo' ? 'rojo' : 'bien' }
    : yaMal

  return (
    <div className="flex flex-col gap-5">
      <Rondas total={rondas.length} actual={r} hecha={respondida} />

      <motion.div key={r} {...ENTRA_DERECHA} className="flex flex-col gap-4">
        <p className="text-xl font-semibold leading-snug sm:text-2xl">
          <Rich>{ronda.pregunta}</Rich>
        </p>
        {ronda.sonidos?.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {ronda.sonidos.map((s, i) => (
              <BotonSonido key={`${r}-${i}`} sonido={s} etiqueta={s.etiqueta ?? 'Escuchar'} />
            ))}
          </div>
        )}
      </motion.div>

      <div ref={circuloRef}>
        <CirculoQuintas
          color={color}
          seleccion={respondida ? null : seleccion}
          estados={estados}
          resaltar={ronda.resaltar ?? []}
          armaduras={ronda.armaduras ?? false}
          menores={menores}
          tocable={respondida ? null : anillo}
          onElegir={elegir}
          centro={
            respondida ? (
              <CentroTonalidad id={ronda.correcta} color={color} estado={resultado} relativa={menores} />
            ) : (
              seleccion && <CentroTonalidad id={seleccion} color={color} armadura={ronda.armaduras ?? false} relativa={false} />
            )
          }
        />
      </div>
      {noLoSe && !respondida && <BotonNoLoSe onClick={noSe} />}
    </div>
  )
}
