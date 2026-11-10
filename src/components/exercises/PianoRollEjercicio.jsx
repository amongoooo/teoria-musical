import { useEffect, useState } from 'react'
import { getModulo } from '../../content/index.js'
import { midi, nombre } from '../../theory/notas.js'
import PianoRoll, { conIds, nombreFL } from '../PianoRoll.jsx'
import Rich from '../Rich.jsx'

/**
 * Paso `pianoroll`: ejercicio sobre el mini Piano Roll.
 *
 * paso.roll: configuración del roll (ver FORMATO.md) + `notas` iniciales.
 * paso.objetivo:
 *  - { tipo: 'libre', cantidad: 4, mensaje }           → dibujar N notas
 *  - { tipo: 'copiar', notas, fantasma: true, pista }  → dibujar exactamente esas notas
 *  - { tipo: 'velocity', fuertes: [0, 4] }             → subir la velocity de las notas
 *        que empiezan en esas casillas y dejar las demás suaves
 */
export default function PianoRollEjercicio({ paso, leccionId, setAccion, siguiente, completar }) {
  const { objetivo, roll = {} } = paso
  const [notas, setNotas] = useState(() => conIds(roll.notas))
  const [resultado, setResultado] = useState(null) // null | { ok, texto }
  const [intentos, setIntentos] = useState(0)
  const [solucion, setSolucion] = useState(false)
  const color = getModulo(Number(String(leccionId).split('.')[0]))?.acento

  const cambiar = (n) => {
    setNotas(n)
    if (resultado && !resultado.ok) setResultado(null)
  }

  const modo = roll.etiquetas === 'fl' ? 'fl' : 'app'
  const nom = (n) => `**${modo === 'fl' ? nombreFL(n) : nombre(n)}**`
  const porTiempo = roll.porTiempo ?? 2

  useEffect(() => {
    if (objetivo.tipo === 'libre') {
      const cantidad = objetivo.cantidad ?? 3
      const listo = notas.length >= cantidad
      setAccion({
        label: 'Continuar',
        disabled: !listo,
        ayuda: listo ? null : `Dibuja ${cantidad} notas (${notas.length}/${cantidad})`,
        feedback: listo ? { tipo: 'bien', titulo: '¡Así se escribe música!', texto: objetivo.mensaje } : null,
        onClick: siguiente,
      })
      return
    }

    if (resultado?.ok || solucion) {
      setAccion({
        label: 'Continuar',
        feedback: resultado?.ok
          ? { tipo: 'bien', titulo: '¡Perfecto!', texto: objetivo.explicacion ?? 'Pulsa Reproducir para escucharlo.' }
          : { tipo: 'mal', titulo: 'Así queda.', texto: objetivo.explicacion ?? 'Compara tus notas con las de la solución y pulsa Reproducir.' },
        onClick: siguiente,
      })
      return
    }

    const comprobar = () => {
      const r = objetivo.tipo === 'velocity' ? revisarVelocity(notas, objetivo) : revisarCopia(notas, objetivo.notas, { nom, porTiempo })
      const total = intentos + 1
      setIntentos(total)
      setResultado(r)
      if (r.ok) completar({ aciertos: intentos === 0 ? 1 : 0, total: 1 })
    }

    const verSolucion = () => {
      completar({ aciertos: 0, total: 1 })
      if (objetivo.tipo === 'velocity') {
        setNotas((ns) => ns.map((n) => ({ ...n, velocity: objetivo.fuertes.includes(n.inicio) ? 1 : 0.35 })))
      } else {
        setNotas(conIds(objetivo.notas))
      }
      setSolucion(true)
    }

    const fallo = resultado && !resultado.ok
    setAccion({
      label: fallo && intentos >= 2 ? 'Ver la solución' : 'Comprobar',
      disabled: notas.length === 0,
      ayuda: notas.length === 0 ? 'Toca la rejilla para dibujar una nota' : null,
      feedback: fallo ? { tipo: 'mal', titulo: 'Casi.', texto: [resultado.texto, objetivo.pista].filter(Boolean).join(' ') } : null,
      onClick: fallo && intentos >= 2 ? verSolucion : comprobar,
    })
  }, [notas, resultado, intentos, solucion, objetivo, setAccion, siguiente, completar])

  const terminado = resultado?.ok || solucion
  const guia = objetivo.tipo === 'copiar' && (objetivo.fantasma || solucion) ? objetivo.notas : []

  return (
    <div className="flex flex-col gap-4">
      {objetivo.instruccion && <p className="text-lg font-semibold leading-snug">
          <Rich>{objetivo.instruccion}</Rich>
        </p>}
      <PianoRoll
        roll={roll}
        notas={notas}
        onCambio={terminado ? undefined : cambiar}
        soloVelocity={objetivo.tipo === 'velocity'}
        fantasma={guia}
        fantasmaBien={terminado}
        color={color}
      />
      {!terminado && objetivo.tipo !== 'velocity' && (
        <p className="text-base text-zinc-500">
          Toca una casilla para crear una nota y <strong className="font-semibold text-zinc-700">arrastra a la derecha</strong> para alargarla. Toca una nota para borrarla.
        </p>
      )}
      {!terminado && objetivo.tipo === 'velocity' && (
        <p className="text-base text-zinc-500">
          Desliza el dedo <strong className="font-semibold text-zinc-700">arriba o abajo</strong> en el carril «Vel.» bajo cada nota.
        </p>
      )}
    </div>
  )
}

const igual = (a, b) => midi(a.nota) === midi(b.nota) && a.inicio === b.inicio && a.duracion === b.duracion

/** Momento de la casilla en palabras: «en el tiempo 2» / «a mitad del tiempo 2». */
function momento(c, porTiempo) {
  const t = Math.floor(c / porTiempo) + 1
  return c % porTiempo === 0 ? `en el tiempo ${t}` : `a mitad del tiempo ${t}`
}

function largo(d, porTiempo) {
  if (porTiempo === 2) {
    if (d === 1) return 'medio tiempo (1 casilla)'
    return `${d / 2} ${d === 2 ? 'tiempo' : 'tiempos'} (${d} casillas)`
  }
  return `${d} ${d === 1 ? 'casilla' : 'casillas'}`
}

function revisarCopia(notas, solucion, { nom, porTiempo }) {
  const problemas = []
  for (const s of solucion) {
    if (notas.some((n) => igual(n, s))) continue
    const parecida = notas.find((n) => midi(n.nota) === midi(s.nota) && n.inicio === s.inicio)
    if (parecida) problemas.push(`${nom(s.nota)} ${momento(s.inicio, porTiempo)} debe durar ${largo(s.duracion, porTiempo)}.`)
    else problemas.push(`Falta ${nom(s.nota)} ${momento(s.inicio, porTiempo)}.`)
  }
  for (const n of notas) {
    if (solucion.some((s) => igual(n, s))) continue
    if (solucion.some((s) => midi(s.nota) === midi(n.nota) && s.inicio === n.inicio)) continue // ya avisada
    problemas.push(`Sobra ${nom(n.nota)} ${momento(n.inicio, porTiempo)}.`)
  }
  if (!problemas.length) return { ok: true }
  const extra = problemas.length > 2 ? ` (y ${problemas.length - 2} detalle${problemas.length > 3 ? 's' : ''} más)` : ''
  return { ok: false, texto: problemas.slice(0, 2).join(' ') + extra }
}

function revisarVelocity(notas, { fuertes, minFuerte = 0.75, maxSuave = 0.55 }) {
  const flojas = notas.filter((n) => fuertes.includes(n.inicio) && n.velocity < minFuerte)
  const fuertesDeMas = notas.filter((n) => !fuertes.includes(n.inicio) && n.velocity > maxSuave)
  if (!flojas.length && !fuertesDeMas.length) return { ok: true }
  const partes = []
  if (flojas.length) partes.push(`Sube más ${flojas.length === 1 ? 'la nota' : `${flojas.length} notas`} de los tiempos acentuados (casi hasta arriba).`)
  if (fuertesDeMas.length) partes.push('Las demás deben quedarse por debajo de la mitad.')
  return { ok: false, texto: partes.join(' ') }
}
