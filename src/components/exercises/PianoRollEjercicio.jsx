import { useEffect, useState } from 'react'
import { getModulo } from '../../content/index.js'
import { PERCUSION, claveNota, esPercusion } from '../../theory/bateria.js'
import { nombre } from '../../theory/notas.js'
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
  const nom = (n) => `**${esPercusion(n) ? PERCUSION[n].toLowerCase() : modo === 'fl' ? nombreFL(n) : nombre(n)}**`
  const porTiempo = roll.porTiempo ?? 2
  const compas = roll.compas ?? null

  useEffect(() => {
    if (objetivo.tipo === 'libre') {
      const cantidad = objetivo.cantidad ?? 3
      const listo = notas.length >= cantidad
      setAccion({
        label: 'Continuar',
        avanza: true,
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
        avanza: true,
        feedback: resultado?.ok
          ? { tipo: 'bien', titulo: '¡Perfecto!', texto: objetivo.explicacion ?? 'Pulsa Reproducir para escucharlo.' }
          : { tipo: 'mal', titulo: 'Así queda.', texto: objetivo.explicacion ?? 'Compara tus notas con las de la solución y pulsa Reproducir.' },
        onClick: siguiente,
      })
      return
    }

    const comprobar = () => {
      const r = objetivo.tipo === 'velocity' ? revisarVelocity(notas, objetivo) : revisarCopia(notas, objetivo.notas, { nom, porTiempo, compas })
      const total = intentos + 1
      setIntentos(total)
      if (r.ok) {
        setResultado(r)
        completar({ aciertos: intentos === 0 ? 1 : 0, total: 1 })
      } else if (total >= 3) verSolucion() // tercer fallo: la solución (el botón solo dice «Comprobar» o «Siguiente»)
      else setResultado(r)
    }

    const verSolucion = () => {
      completar({ aciertos: 0, total: 1 })
      if (objetivo.tipo === 'velocity') {
        const suave = Math.min(0.35, (objetivo.maxSuave ?? 0.55) - 0.1)
        setNotas((ns) => ns.map((n) => ({ ...n, velocity: objetivo.fuertes.includes(n.inicio) ? 1 : suave })))
      } else {
        setNotas(conIds(objetivo.notas))
      }
      setSolucion(true)
    }

    const fallo = resultado && !resultado.ok
    setAccion({
      label: 'Comprobar',
      disabled: notas.length === 0,
      ayuda: notas.length === 0 ? 'Toca la rejilla para dibujar una nota' : fallo && intentos >= 2 ? 'Si vuelve a fallar, verás la solución' : null,
      feedback: fallo ? { tipo: 'mal', titulo: 'Casi.', texto: [resultado.texto, objetivo.pista].filter(Boolean).join(' ') } : null,
      onClick: comprobar,
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

const igual = (a, b) => claveNota(a.nota) === claveNota(b.nota) && a.inicio === b.inicio && a.duracion === b.duracion

/**
 * Momento de la casilla en palabras: «en el tiempo 2» / «a mitad del tiempo 2».
 * Con `compas` (tiempos por compás) y más de un compás: «en el tiempo 1 del compás 2».
 */
function momento(c, porTiempo, compas) {
  const b = Math.floor(c / porTiempo)
  const t = (compas ? b % compas : b) + 1
  const enCompas = compas && b >= compas ? ` del compás ${Math.floor(b / compas) + 1}` : ''
  const r = c % porTiempo
  if (r === 0) return `en el tiempo ${t}${enCompas}`
  // En semicorcheas (4 por tiempo): «1 e y a».
  if (porTiempo === 4 && r !== 2) return `en la «${r === 1 ? 'e' : 'a'}» del tiempo ${t}${enCompas}`
  return `a mitad del tiempo ${t}${enCompas}`
}

const FIGURA = { 0.25: 'una semicorchea', 0.5: 'una corchea', 1: 'una negra', 2: 'una blanca', 4: 'una redonda' }

/** Duración en palabras: «2 tiempos (una blanca, 4 casillas)». */
function largo(d, porTiempo) {
  const casillas = `${d} ${d === 1 ? 'casilla' : 'casillas'}`
  const t = d / porTiempo
  const fig = FIGURA[t] ? `${FIGURA[t]}, ` : ''
  const tiempos = t === 0.5 ? 'medio tiempo' : t === 0.25 ? 'un cuarto de tiempo' : Number.isInteger(t) ? `${t} ${t === 1 ? 'tiempo' : 'tiempos'}` : null
  return tiempos ? `${tiempos} (${fig}${casillas})` : casillas
}

function revisarCopia(notas, solucion, { nom, porTiempo, compas }) {
  const problemas = []
  for (const s of solucion) {
    if (notas.some((n) => igual(n, s))) continue
    const parecida = notas.find((n) => claveNota(n.nota) === claveNota(s.nota) && n.inicio === s.inicio)
    if (parecida) problemas.push(`${nom(s.nota)} ${momento(s.inicio, porTiempo, compas)} debe durar ${largo(s.duracion, porTiempo)}.`)
    else problemas.push(`Falta ${nom(s.nota)} ${momento(s.inicio, porTiempo, compas)}.`)
  }
  for (const n of notas) {
    if (solucion.some((s) => igual(n, s))) continue
    if (solucion.some((s) => claveNota(s.nota) === claveNota(n.nota) && s.inicio === n.inicio)) continue // ya avisada
    problemas.push(`Sobra ${nom(n.nota)} ${momento(n.inicio, porTiempo, compas)}.`)
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
  if (fuertesDeMas.length) partes.push(maxSuave < 0.5 ? 'Las demás deben quedarse muy suaves (por debajo de un tercio).' : 'Las demás deben quedarse por debajo de la mitad.')
  return { ok: false, texto: partes.join(' ') }
}
