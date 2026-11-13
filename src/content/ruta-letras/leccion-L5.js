// Ruta de letras · L5 — Acentos en el pulso (el flow).
// Vive en la ruta de letras (`ruta: 'letras'`). Usa el Flow (components/Flow.jsx, paso `flow`): las sílabas de un
// verso sobre las 16 casillas del compás; las tónicas tienen que caer en el pulso de corcheas (en el número o en la «y»).
// Formato: src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md

export default {
  id: 'L5',
  ruta: 'letras',
  titulo: 'Acentos en el pulso',
  subtitulo: 'Que las tónicas caigan en el tiempo',
  minutos: 6,
  resumen: [
    'El compás de 4/4 se cuenta en 16 casillas: **1 e y a · 2 e y a · 3 e y a · 4 e y a**.',
    'Un verso suena con flow cuando sus **tónicas** caen en el pulso: en el **número** o en la **«y»**.',
    'Si una tónica cae en la «e» o en la «a», suena a tropiezo (a veces a propósito, como una síncopa).',
    'En la pestaña **Flow** de cada letra puedes grabar tus versos con el pad y moverlos.',
  ],
  pasos: [
    {
      tipo: 'texto',
      titulo: 'El verso sobre el beat',
      parrafos: [
        'Un compás de 4/4 se cuenta en **16 casillas**: *1 e y a, 2 e y a, 3 e y a, 4 e y a*. Cada sílaba del verso va en una casilla.',
        'El truco del flow: las **tónicas** (las sílabas que suenan fuerte) caen en el **número** o en la **«y»**, el pulso de corcheas.',
      ],
      sonidos: [{ groove: 'basico', bpm: 90, compases: 2, etiqueta: 'El beat' }],
    },
    {
      tipo: 'marcar',
      titulo: 'Primero, las tónicas',
      rondas: [
        {
          pregunta: 'Toca las sílabas que suenan **fuerte**: son las que irán en el pulso.',
          unidad: 'silaba',
          texto: 'Camino de noche por la avenida',
          correctas: 'tonicas',
          explicacion: 'ca-**mi**-no, **no**-che, a-ve-**ni**-da.',
        },
      ],
    },
    {
      tipo: 'flow',
      titulo: 'Acomoda el flow',
      intro: 'Las sílabas oscuras son las tónicas. Muévelas (toca una y luego una casilla libre) o graba con el pad hasta que todas caigan en un número o en una «y».',
      verso: 'Camino de noche por la avenida',
      explicacion: 'Con *mi*, *no* y *ni* en el pulso, el verso «camina» sobre el beat.',
    },
    {
      tipo: 'flow',
      titulo: 'Otro verso',
      intro: 'Ahora tú solo: todas las tónicas en el pulso.',
      verso: 'Te busqué por toda la ciudad',
      explicacion: '*qué*, *to* y *dad* en el pulso; *te*, *por* y *la* pueden ir en cualquier casilla.',
    },
  ],
}
