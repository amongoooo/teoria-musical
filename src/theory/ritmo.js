// Entrenamiento de ritmo: niveles, patrones al azar, lo que suena en cada compás y la evaluación de los toques.
//
// Un patrón es una lista de CASILLAS dentro de un compás de 4 tiempos, con `porTiempo` casillas por tiempo:
// 1 = negras («1 2 3 4»), 2 = corcheas («1 y 2 y»), 4 = semicorcheas («1 e y a») y 3 = swing («1 · y»: la «y» con
// swing cae en la tercera parte del tiempo). Los tiempos de los sonidos van en TIEMPOS (0 = el 1 del compás).
import { formaGroove } from './bateria.js'

export const TIEMPOS = 4

/** Rondas buenas para subir de nivel (las partes de la barra de arriba). */
export const PARTES_NIVEL = 8

/** Margen de cada dificultad (1…5), en segundos: de ±120 ms a ±40 ms. */
export const MARGENES = [0.12, 0.095, 0.075, 0.055, 0.04]
export const margenDe = (dificultad) => MARGENES[Math.max(1, Math.min(MARGENES.length, Math.round(dificultad) || 1)) - 1]

/** Un toque a más de esto de cualquier golpe (o a más de media casilla) no es de ningún golpe: sobra. */
const ALCANCE = 0.25
/** Parte de los golpes que tienen que caer a tiempo para que la ronda valga («4 de cada 5»). */
const PARTE_BUENA = 0.8
/** Toques de sobra que se perdonan. */
const SOBRAN_PERDONADOS = 1

const al = (lista) => lista[Math.floor(Math.random() * lista.length)]

/** `cuantos` elementos de `base` al azar (entre `min` y `max`), ordenados. */
function algunos(base, min, max = min) {
  const n = min + Math.floor(Math.random() * (max - min + 1))
  const copia = [...base]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia.slice(0, n).sort((a, b) => a - b)
}

/**
 * Patrón por figuras: una figura (casillas dentro de su tiempo) por cada tiempo, al azar, hasta que `vale` lo
 * acepte. Si no sale ninguno, `respaldo`.
 */
function porFiguras(figuras, porTiempo, vale, respaldo) {
  for (let i = 0; i < 80; i++) {
    const elegidas = Array.from({ length: TIEMPOS }, () => al(figuras))
    const patron = elegidas.flatMap((f, b) => f.map((c) => b * porTiempo + c))
    if (vale(elegidas, patron)) return patron
  }
  return respaldo
}

// Clásicos en semicorcheas (16 casillas): los que ya suenan en el Módulo 2 y las claves de siempre.
const CLASICOS_16 = [
  [0, 3, 6, 8, 11, 14], // 3-3-2 dos veces (tresillo del reguetón y del trap)
  [3, 6, 11, 14], // la caja del dembow
  [0, 7, 10], // el bombo del bounce
  [0, 7, 11], // el bombo del trap
  [0, 3, 6, 10, 12], // clave de son 3-2
  [0, 3, 6], // «1 · · a · · y ·»
]

const SINCOPADAS_16 = [[0, 3], [2], [3], [2, 3]]

/**
 * Los niveles: cada uno suma una figura. `fondo` es el groove que suena de fondo en «Seguir» (en «Eco», el clic);
 * `ejemplo`, el patrón que enseñan los puntitos del arranque.
 */
const NIVELES = [
  { id: 'negras', nombre: 'Negras', porTiempo: 1, bpm: 70, fondo: 'click', ejemplo: [0, 1, 2, 3], patron: () => [0, 1, 2, 3] },
  {
    id: 'silencios',
    nombre: 'Negras con silencios',
    porTiempo: 1,
    bpm: 75,
    fondo: 'click',
    ejemplo: [0, 2, 3],
    patron: () => algunos([0, 1, 2, 3], 2, 3),
  },
  {
    id: 'corcheas',
    nombre: 'Corcheas',
    porTiempo: 2,
    bpm: 75,
    fondo: 'basico',
    ejemplo: [0, 1, 2, 3, 4, 5, 6, 7],
    // Parejas de corcheas en 2, 3 o los 4 tiempos.
    patron: () => algunos([0, 1, 2, 3], 2, 4).flatMap((b) => [b * 2, b * 2 + 1]),
  },
  {
    id: 'mezcla',
    nombre: 'Negras y corcheas',
    porTiempo: 2,
    bpm: 80,
    fondo: 'basico',
    ejemplo: [0, 2, 3, 4, 6, 7],
    patron: () => porFiguras([[0], [0, 1]], 2, (f) => f.some((x) => x.length === 1) && f.some((x) => x.length === 2), [0, 2, 3, 4, 6, 7]),
  },
  {
    id: 'contratiempo',
    nombre: 'Contratiempo',
    porTiempo: 2,
    bpm: 80,
    fondo: 'basico',
    ejemplo: [1, 3, 5, 7],
    patron: () => algunos([1, 3, 5, 7], 2, 4),
  },
  {
    id: 'sincopa',
    nombre: 'Síncopa',
    porTiempo: 2,
    bpm: 85,
    fondo: 'basico',
    ejemplo: [0, 3, 5, 6],
    patron: () => {
      for (let i = 0; i < 80; i++) {
        const p = algunos([0, 1, 2, 3, 4, 5, 6, 7], 3, 5)
        const enTiempo = p.filter((c) => c % 2 === 0).length
        // Síncopa: una «y» que no se apoya en el tiempo siguiente.
        const sincopas = p.filter((c) => c % 2 === 1 && !p.includes((c + 1) % 8)).length
        if (sincopas >= 1 && enTiempo >= 1 && p.length - enTiempo <= 3) return p
      }
      return [0, 3, 5, 6]
    },
  },
  {
    id: 'semicorcheas',
    nombre: 'Semicorcheas',
    porTiempo: 4,
    bpm: 80,
    fondo: 'boomBap',
    ejemplo: [0, 1, 2, 3, 4, 6, 8, 10, 11, 12],
    patron: () =>
      porFiguras(
        [[0], [0, 2], [0, 1, 2, 3], [0, 2, 3], [0, 1, 2]],
        4,
        (f) => f.some((x) => x.length >= 3) && f.filter((x) => x.length === 4).length <= 2,
        [0, 1, 2, 3, 4, 6, 8, 10, 11, 12],
      ),
  },
  {
    id: 'sincopa16',
    nombre: 'Síncopa de semicorchea',
    porTiempo: 4,
    bpm: 90,
    fondo: 'boomBap',
    ejemplo: [0, 3, 6, 8, 11, 14],
    patron: () =>
      Math.random() < 0.5
        ? al(CLASICOS_16)
        : porFiguras(
            [[0], [0, 3], [0, 2], [2], [3], [0, 2, 3], [], [2, 3]],
            4,
            (f, p) => p.length >= 3 && p.length <= 8 && f.some((x) => SINCOPADAS_16.some((s) => s.join() === x.join())),
            CLASICOS_16[0],
          ),
  },
  {
    id: 'swing',
    nombre: 'Swing',
    porTiempo: 3,
    bpm: 90,
    fondo: 'shuffle',
    ejemplo: [0, 2, 3, 5, 6, 8, 9, 11],
    patron: () => porFiguras([[0], [0, 2], [2], []], 3, (f, p) => p.length >= 3 && f.some((x) => x.includes(2)), [0, 2, 3, 5, 6, 8, 9, 11]),
  },
  { id: 'todo', nombre: 'Todo mezclado', mezcla: true, porTiempo: 4, ejemplo: [0, 2, 3, 6, 7, 9, 10, 14] },
]

/** Los niveles que entran en «Todo mezclado» (todos menos las negras seguidas). */
const DE_LA_MEZCLA = NIVELES.filter((n) => !n.mezcla && n.id !== 'negras')

const SILABAS = { 1: [''], 2: ['', 'y'], 3: ['', '·', 'y'], 4: ['', 'e', 'y', 'a'] }

/** Nombre de una casilla: «2» o «la y del 3». */
function nombreCasilla(c, porTiempo) {
  const tiempo = Math.floor(c / porTiempo) + 1
  const s = SILABAS[porTiempo][c % porTiempo]
  return s ? `la ${s === '·' ? 'parte del medio' : s} del ${tiempo}` : String(tiempo)
}

/** Un groove de theory/bateria.js con sus golpes en tiempos: [{ nota, t, velocity }]. */
function enTiempos(groove) {
  const { eventos, porTiempo } = formaGroove(groove)
  return eventos.map((e) => ({ nota: e.nota, t: e.inicio / porTiempo, velocity: e.velocity ?? 0.8, duracion: 0.2 }))
}

const CLIC = enTiempos('click')
/** El clic con el hi-hat marcando la «y» con swing: sin él, en «Eco» no se sabría que el nivel va con swing. */
const CLIC_SWING = [...CLIC, ...[0, 1, 2, 3].map((b) => ({ nota: 'hat', t: b + 2 / 3, velocity: 0.4, duracion: 0.2 }))]

/**
 * Genera una ronda: { item, nombre, porTiempo, casillas, patron, bpm, fondo }.
 * `item` es la figura que se entrena (para las estadísticas); evita repetir el patrón de `anterior`.
 */
function generar(nivel, eco, anterior) {
  const definido = NIVELES[Math.max(1, Math.min(NIVELES.length, nivel)) - 1]
  let n = definido
  let patron = []
  for (let i = 0; i < 12; i++) {
    n = definido.mezcla ? al(DE_LA_MEZCLA) : definido
    patron = n.patron()
    if (!anterior || anterior.item !== n.id || anterior.patron.join() !== patron.join()) break
  }
  // En «Todo mezclado» todo va un poco más deprisa (las semicorcheas, hasta 90).
  const bpm = definido.mezcla ? Math.min(n.bpm + 10, n.porTiempo === 4 ? 90 : 100) : n.bpm
  const fondo = eco ? (n.porTiempo === 3 ? CLIC_SWING : CLIC) : enTiempos(n.fondo)
  return { item: n.id, nombre: n.nombre, porTiempo: n.porTiempo, casillas: TIEMPOS * n.porTiempo, patron, bpm, fondo }
}

/**
 * Lo que suena en un compás de la ronda según su tipo:
 *  - entrada: un compás de clic para entrar («1, 2, 3, 4»)
 *  - demo: el fondo y el patrón (con el tom)
 *  - toca: solo el fondo (el patrón lo pones tú)
 *  - cierre: el primer golpe del fondo, para acabar en el 1
 */
export function eventosCompas(tipo, ronda) {
  if (tipo === 'entrada') return CLIC
  if (tipo === 'cierre') return ronda.fondo.filter((e) => e.t === 0)
  if (tipo === 'demo') {
    return [...ronda.fondo, ...ronda.patron.map((c) => ({ nota: 'tom', t: c / ronda.porTiempo, velocity: 0.95, duracion: 0.2 }))]
  }
  return ronda.fondo
}

/** Los golpes que hay que dar en los compases `compases` (índices dentro de la pista), en segundos desde su inicio. */
export function objetivosDe(ronda, compases, pulso) {
  return compases.flatMap((k) => ronda.patron.map((c) => ({ k, c, t: (k * TIEMPOS + c / ronda.porTiempo) * pulso })))
}

/** Margen que de verdad se aplica: nunca más de media casilla (más lejos ya se está en la casilla de al lado). */
export function margenEfectivo(margen, ronda, pulso) {
  return Math.min(margen, pulso / ronda.porTiempo / 2)
}

/**
 * Compara los toques con los golpes del patrón.
 *  - objetivos: [{ k, c, t }] (objetivosDe)
 *  - toques: tiempos (s) de los toques, tal como se oyeron sobre la pista
 *  - margen: ± segundos para contar «a tiempo»; compensacion: retraso del dispositivo que se descuenta
 *  - paso: segundos de una casilla
 * Cada toque es del golpe que tiene más cerca (si está a menos de media casilla y de ALCANCE); si un golpe recibe
 * dos, se queda el mejor y el otro sobra. Devuelve los golpes con su `dt` (s; negativo = antes) y su `estado`
 * (bien | casi | falta), los toques que sobran y el resumen.
 */
export function evaluar(objetivos, toques, { margen, compensacion = 0, paso }) {
  const alcance = Math.min(ALCANCE, paso / 2)
  const tolerancia = Math.min(margen, alcance)
  const golpes = objetivos.map((o) => ({ ...o, dt: null }))
  const sobran = []
  for (const bruto of toques) {
    const t = bruto - compensacion
    let mejor = -1
    let distancia = Infinity
    golpes.forEach((g, i) => {
      const d = Math.abs(t - g.t)
      if (d < distancia) {
        distancia = d
        mejor = i
      }
    })
    if (mejor < 0 || distancia > alcance) {
      sobran.push(t)
      continue
    }
    const g = golpes[mejor]
    if (g.dt === null) g.dt = t - g.t
    else if (distancia < Math.abs(g.dt)) {
      sobran.push(g.t + g.dt)
      g.dt = t - g.t
    } else sobran.push(t)
  }
  for (const g of golpes) g.estado = g.dt === null ? 'falta' : Math.abs(g.dt) <= tolerancia ? 'bien' : 'casi'
  const dados = golpes.filter((g) => g.dt !== null)
  const fuera = golpes.filter((g) => g.estado === 'casi')
  const media = (lista) => (lista.length ? lista.reduce((a, g) => a + Math.abs(g.dt), 0) / lista.length : 0)
  const antes = fuera.filter((g) => g.dt < 0)
  const tarde = fuera.filter((g) => g.dt > 0)
  const total = golpes.length
  const bien = golpes.filter((g) => g.estado === 'bien').length
  const minimo = Math.ceil(total * PARTE_BUENA)
  return {
    golpes,
    sobran,
    total,
    bien,
    faltan: total - dados.length,
    minimo,
    tolerancia,
    media: media(dados),
    antes: { n: antes.length, media: media(antes) },
    tarde: { n: tarde.length, media: media(tarde) },
    buena: total > 0 && bien >= minimo && sobran.length <= SOBRAN_PERDONADOS,
  }
}

const ms = (s) => Math.round(s * 1000)
const cuantos = (n, uno, varios) => (n === 1 ? uno : varios.replace('#', n))

/** Texto del resultado de una ronda: { titulo, texto } (el error se explica: qué pasó y por cuánto). */
export function explicar(ev) {
  if (ev.buena) {
    return {
      titulo: ev.bien === ev.total && !ev.sobran.length ? '¡Clavado!' : '¡A tiempo!',
      texto: `**${ev.bien} de ${ev.total}** golpes dentro de ±${ms(ev.tolerancia)} ms. Te desviaste de media **${ms(ev.media)} ms**.`,
    }
  }
  const partes = []
  if (ev.faltan === ev.total) partes.push('No tocaste ningún golpe.')
  else {
    if (ev.antes.n) partes.push(`Te **adelantaste** en ${cuantos(ev.antes.n, 'un golpe', '# golpes')} (unos ${ms(ev.antes.media)} ms).`)
    if (ev.tarde.n) partes.push(`Te **atrasaste** en ${cuantos(ev.tarde.n, 'un golpe', '# golpes')} (unos ${ms(ev.tarde.media)} ms).`)
    if (ev.faltan) partes.push(cuantos(ev.faltan, 'Te **faltó** un golpe.', 'Te **faltaron** # golpes.'))
  }
  if (ev.sobran.length) partes.push(cuantos(ev.sobran.length, 'Diste **un toque de más**.', 'Diste **# toques de más** (se perdona uno).'))
  if (ev.bien < ev.minimo) partes.push(`Para que valga la ronda: ${ev.minimo} de ${ev.total} dentro de ±${ms(ev.tolerancia)} ms.`)
  return { titulo: `${ev.bien} de ${ev.total} a tiempo.`, texto: partes.join(' ') }
}

// ---------------------------------------------------------------------------
// Los dos modos (misma forma que los del entrenamiento de oído: los usa el mismo arranque)
// ---------------------------------------------------------------------------

/** Puntitos del margen (9: una ventana que se cierra con la dificultad: 9, 7, 5, 3 y 1 encendidos). */
function puntosDificultad(dificultad) {
  const medio = 4
  const radio = 5 - Math.max(1, Math.min(5, dificultad))
  const texto = `margen de ±${ms(margenDe(dificultad))} ms`
  return {
    encendidos: Array.from({ length: 9 }, (_, i) => Math.abs(i - medio) <= radio),
    etiquetas: Array.from({ length: 9 }, (_, i) => (i === medio ? texto : '')),
  }
}

const comun = {
  // Color del módulo con el que se relaciona: ritmo → M2.
  acento: 'var(--color-modulo-2)',
  niveles: NIVELES.length,
  dificultad: true,
  // La dificultad no son octavas (como en oído) sino el margen: se guarda en `ajustes.dificultad`.
  claveDificultad: 'dificultad',
  puntosDificultad,
  // Puntitos del nivel: las casillas del compás (la primera arriba) con un patrón de ejemplo; los tiempos, más oscuros.
  puntosNivel: (nivel) => {
    const n = NIVELES[Math.max(1, Math.min(NIVELES.length, nivel)) - 1]
    const casillas = Array.from({ length: TIEMPOS * n.porTiempo }, (_, c) => c)
    return {
      encendidos: casillas.map((c) => n.ejemplo.includes(c)),
      etiquetas: casillas.map((c) => nombreCasilla(c, n.porTiempo)),
      negras: casillas.map((c) => c % n.porTiempo === 0),
      desdeArriba: true,
    }
  },
  nuevosEnNivel: (nivel) => [NIVELES[nivel - 1]?.nombre].filter(Boolean),
  nombreItem: (id) => NIVELES.find((n) => n.id === id)?.nombre ?? id,
  // Bloques del arranque: el pad puede sonar al tocarlo o ir mudo (con bluetooth el sonido llega tarde y estorba).
  bloques: [
    {
      clave: 'pad',
      titulo: 'Pad',
      opciones: [
        { id: 'suena', nombre: 'Con sonido' },
        { id: 'mudo', nombre: 'Mudo' },
      ],
    },
  ],
}

export const modoSeguir = {
  ...comun,
  id: 'seguir',
  titulo: 'Seguir',
  descripcion: 'Suena el beat y tocas los golpes marcados.',
  info:
    'Suena **un compás de cuenta** y arranca el beat: tocas en el pad los golpes que llevan aro, durante **dos ' +
    'compases**. La ronda vale si al menos **4 de cada 5** golpes caen a tiempo. Con **8 rondas buenas** subes de ' +
    'nivel, y cada nivel trae una figura nueva. La dificultad cierra el margen, de **±120 ms** a **±40 ms**. Si tu ' +
    'teléfono o tus audífonos suenan con retraso, se descuenta solo.',
  pregunta: 'Toca los golpes marcados',
  generar: (nivel, ajustes, anterior) => generar(nivel, false, anterior),
}

export const modoEco = {
  ...comun,
  id: 'eco',
  titulo: 'Eco',
  descripcion: 'Escucha un patrón y repítelo en el compás siguiente.',
  info:
    'Primero **escuchas** un patrón de un compás sobre el clic y lo **repites** en el compás siguiente, sin verlo. ' +
    'Si no tocas, vuelve a sonar. Al terminar ves el patrón y dónde cayeron tus toques. La ronda vale si al menos ' +
    '**4 de cada 5** golpes caen a tiempo, y con **8 rondas buenas** subes de nivel. La dificultad cierra el ' +
    'margen, de **±120 ms** a **±40 ms**.',
  pregunta: 'Escucha y repite',
  generar: (nivel, ajustes, anterior) => generar(nivel, true, anterior),
}

export const MODOS_RITMO = [modoSeguir, modoEco]

export function getModoRitmo(id) {
  return MODOS_RITMO.find((m) => m.id === id) ?? null
}
