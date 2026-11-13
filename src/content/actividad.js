// Qué interacción es cada paso, según el catálogo de src/content/INTERACCIONES.md.
//
// La etiqueta de cada paso = ícono de su ACTIVIDAD + nombre del ejercicio en texto, p. ej.
// «Oído · Escuchar y elegir». Hay solo tres actividades con ícono (oído, practicar, reto en FL);
// las explicaciones (L1–L6) no llevan ícono ni etiqueta.

/** Actividad → texto de la etiqueta. El ícono está en src/ui/Iconos.jsx (ICONO_ACTIVIDAD). */
export const ACTIVIDADES = {
  oido: 'Oído',
  practicar: 'Practica',
  reto: 'Reto en FL',
}

/** Código del catálogo → [actividad, nombre del ejercicio]. */
export const INTERACCIONES = {
  L1: [null, 'Texto solo'],
  L2: [null, 'Texto + sonidos'],
  L3: [null, 'Texto + Piano Roll'],
  L5: [null, '¿Qué se siente?'],
  L7: [null, 'Texto + círculo de quintas'],
  L8: [null, 'Texto + letra analizada'],
  O1: ['oido', 'Elegir entre sonidos'],
  O2: ['oido', 'Escuchar y elegir'],
  O3: ['oido', 'Quiz'],
  O4: ['oido', 'Leer el roll y elegir'],
  O5: ['oido', 'Gancho de oído'],
  O6: ['oido', 'Emparejar'],
  O7: ['oido', 'Encontrar en el círculo'],
  P1: ['practicar', 'Explorar'],
  P2: ['practicar', 'Extremos'],
  P3: ['practicar', 'Comparar'],
  P4: ['practicar', 'Todas las octavas'],
  P5: ['practicar', 'Medir un paso'],
  P6: ['practicar', 'Seguir la fórmula'],
  P7: ['practicar', 'Construir un intervalo'],
  F1: ['practicar', 'Pad de frecuencia'],
  R1: ['practicar', 'Dibujar libre'],
  R2: ['practicar', 'Copiar un patrón'],
  R3: ['practicar', 'Dar acentos'],
  T1: ['practicar', 'Tocar al pulso'],
  T2: ['practicar', 'Tap tempo'],
  T3: ['practicar', 'Explorar tempos'],
  T4: ['practicar', 'Comparar versiones'],
  E1: ['practicar', 'Marcar palabras'],
  E2: ['practicar', 'Marcar sílabas'],
  E3: ['practicar', 'Acomodar el flow'],
  X1: ['reto', null], // la etiqueta dice solo «Reto en FL»
}

const P_TOCAR = { explorar: 'P1', extremos: 'P2', comparar: 'P3', octavas: 'P4', paso: 'P5', formula: 'P6' }
const R_ROLL = { libre: 'R1', copiar: 'R2', velocity: 'R3' }
const T_PULSO = { seguir: 'T1', tempo: 'T2', explorar: 'T3' }

/** Código de interacción (L1…X1) de un paso. `indice` = su posición en la lección (para el gancho O5). */
export function codigoPaso(paso, indice = -1) {
  switch (paso.tipo) {
    case 'texto':
      if (paso.circulo) return 'L7'
      if (paso.letra) return 'L8'
      return paso.roll ? 'L3' : paso.sonidos?.length || paso.fichas?.filas?.length ? 'L2' : 'L1'
    case 'siente':
      return 'L5'
    case 'elegir': {
      const rondas = paso.rondas ?? []
      if (indice === 0 && rondas.length === 1) return 'O5'
      // Con rondas mezcladas manda la más «rica»: alguna con roll → O4; alguna con sonido → O2.
      if (rondas.some((r) => r.roll)) return 'O4'
      if (rondas.every((r) => !r.opciones)) return 'O1'
      return rondas.some((r) => r.sonidos?.length) ? 'O2' : 'O3'
    }
    case 'emparejar':
      return 'O6'
    case 'circulo':
      return 'O7'
    case 'tocar':
      // `paso` con intervalos con nombre (3.ª mayor, 5.ª justa…) es construir un intervalo, no medir un paso.
      if (paso.objetivo?.tipo === 'paso' && paso.objetivo.rondas?.some((r) => r.intervalo)) return 'P7'
      return P_TOCAR[paso.objetivo?.tipo] ?? 'P1'
    case 'frecuencia':
      return 'F1'
    case 'pianoroll':
      return R_ROLL[paso.objetivo?.tipo] ?? 'R1'
    case 'pulso':
      // `explorar` con opciones con nombre (p. ej. cuánto swing) compara versiones, no tempos.
      if (paso.objetivo?.tipo === 'explorar' && paso.objetivo.tempos?.some((t) => t.titulo)) return 'T4'
      return T_PULSO[paso.objetivo?.tipo] ?? 'T1'
    case 'marcar':
      return paso.rondas?.some((r) => r.unidad === 'silaba') ? 'E2' : 'E1'
    case 'flow':
      return 'E3'
    case 'reto':
      return 'X1'
    default:
      return null
  }
}

/** { codigo, actividad, texto, ejercicio } de un paso, o null si es una explicación (sin etiqueta). `ejercicio` puede faltar (X1). */
export function etiquetaPaso(paso, indice) {
  const codigo = codigoPaso(paso, indice)
  const [actividad, ejercicio] = INTERACCIONES[codigo] ?? []
  if (!actividad) return null
  return { codigo, actividad, texto: ACTIVIDADES[actividad], ejercicio }
}
