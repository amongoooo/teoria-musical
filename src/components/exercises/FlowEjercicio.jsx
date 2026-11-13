import { useCallback, useEffect, useMemo, useState } from 'react'
import { analizar } from '../../letras/analisis.js'
import { POR_COMPAS, acentosATiempo, compasesPara, repartir, repartirConAcentos, silabasFlow } from '../../letras/flow.js'
import { FlowVerso } from '../Flow.jsx'

/**
 * Paso `flow` (ruta de letras, lección L5): un verso sobre las casillas del compás, repartido parejo (sin mirar los
 * acentos). Hay que mover sílabas (tocar una y luego una casilla libre) o grabarlo con el pad hasta que todas las
 * tónicas caigan en el pulso de corcheas. Comprobar: si falta alguna, se muestra una solución y se explica.
 *
 *   { tipo: 'flow', titulo, intro, verso: 'Camino de noche por la avenida', explicacion }
 */
export default function FlowEjercicio({ paso, setAccion, siguiente, completar }) {
  const verso = useMemo(() => analizar(paso.verso).estrofas[0].versos[0], [paso.verso])
  const silabas = useMemo(() => silabasFlow(verso), [verso])
  const total = compasesPara(silabas.length) * POR_COMPAS
  const inicial = useMemo(() => repartir(silabas.length, total), [silabas.length, total])
  const [casillas, setCasillas] = useState(inicial)
  const [resultado, setResultado] = useState(null) // null | 'bien' | 'mal'
  const [solucion, setSolucion] = useState(null)
  const [tuyos, setTuyos] = useState(null) // acentos al comprobar (luego la rejilla enseña la solución)
  const onCasillas = useCallback((c) => setCasillas(c), [])

  const completas = casillas.length === silabas.length
  const acentos = acentosATiempo(silabas, casillas)

  useEffect(() => {
    if (!resultado) {
      setAccion({
        label: 'Comprobar',
        disabled: !completas,
        ayuda: completas ? null : 'Graba todas las sílabas',
        onClick: () => {
          const bien = acentos.bien === acentos.total
          setResultado(bien ? 'bien' : 'mal')
          setTuyos({ bien: acentos.bien, total: acentos.total })
          if (!bien) setSolucion(repartirConAcentos(silabas, total))
          completar({ aciertos: bien ? 1 : 0, total: 1 })
        },
      })
      return
    }
    setAccion({
      label: 'Continuar',
      avanza: true,
      feedback:
        resultado === 'bien'
          ? { tipo: 'bien', titulo: '¡Todos los acentos en el pulso!', texto: paso.explicacion }
          : {
              tipo: 'mal',
              titulo: `${tuyos?.bien} de ${tuyos?.total} acentos en el pulso`,
              texto: `Así quedan todos en el pulso: escúchalo. ${paso.explicacion ?? ''}`.trim(),
            },
      onClick: siguiente,
    })
  }, [resultado, completas, acentos.bien, acentos.total, tuyos, silabas, total, paso.explicacion, setAccion, siguiente, completar])

  return (
    <div data-paso-flow={paso.verso} data-resultado={resultado ?? undefined}>
      <FlowVerso
        key={solucion ? 'solucion' : 'tuyo'}
        verso={verso}
        inicial={solucion ?? inicial}
        conRepartir={false}
        bloqueado={Boolean(resultado)}
        onCasillas={onCasillas}
      />
    </div>
  )
}
