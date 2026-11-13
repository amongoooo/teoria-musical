// Ruta de letras · L3 — Sílabas y sinalefa (contar como se canta) y la sílaba tónica.
// Vive en la ruta de letras (`ruta: 'letras'`). Los conteos son los del motor de src/letras/ (sílabas «como se
// dicen», con sinalefa), los mismos que se ven en el cuaderno.
// Formato: src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md

const NUMEROS = ['5', '6', '7', '8']

/** Ronda «¿cuántas sílabas?» (contando como se dice). */
const cuenta = (texto, n, explicacion) => ({
  pregunta: '¿Cuántas sílabas tiene, **como se canta**?',
  letra: { texto, colores: false },
  opciones: NUMEROS,
  correcta: NUMEROS.indexOf(String(n)),
  explicacion,
})

export default {
  id: 'L3',
  ruta: 'letras',
  titulo: 'Sílabas y sinalefa',
  subtitulo: 'Contar como se canta',
  minutos: 5,
  resumen: [
    'Una **sílaba** es un golpe de voz: *ca-mi-no* tiene 3.',
    '**Sinalefa**: si una palabra acaba en vocal y la siguiente empieza en vocal (o en h, que no suena), se dicen en **un solo golpe**: *la‿avenida*.',
    'La **tónica** es la sílaba que suena más fuerte de cada palabra: *ca-**mi**-no*, ***no**-che*.',
    'Versos con un número parecido de sílabas caben igual en el compás.',
  ],
  pasos: [
    {
      tipo: 'texto',
      titulo: 'Golpes de voz',
      parrafos: [
        'Una **sílaba** es cada golpe de voz de una palabra: *ca-mi-no* (3), *no-che* (2), *a-ve-ni-da* (4).',
        'Pero al cantar no se cuenta palabra por palabra: se cuenta **como se dice**.',
      ],
    },
    {
      tipo: 'texto',
      titulo: 'La sinalefa',
      parrafos: [
        'Cuando una palabra **acaba en vocal** y la siguiente **empieza en vocal**, las dos se dicen en un solo golpe: *la‿avenida* suena «la-ve-ni-da».',
        'La **h** no suena, así que también se junta: *una‿herida*. El número de la derecha es cuántas sílabas tiene cada verso.',
      ],
      letra: { texto: 'Camino de noche por la avenida\ntraigo en el pecho una herida', silabas: true, colores: false },
    },
    {
      tipo: 'elegir',
      titulo: 'Cuenta como se canta',
      rondas: [
        cuenta('Me sobra la razón', 6, '*me-so-bra-la-ra-zón*: 6, sin sinalefa (ninguna palabra empieza en vocal).'),
        cuenta('Te escribo esta canción', 6, 'Por palabra son 8, pero *te‿es-cri-bo* y *es-cri-bo‿es-ta* se juntan: 8 − 2 = 6.'),
        cuenta('traigo en el pecho una herida', 8, 'Por palabra son 11, con tres sinalefas: *trai-go‿en*, *pe-cho‿u-na* y *u-na‿he-ri-da* (la h no suena). 11 − 3 = 8.'),
      ],
    },
    {
      tipo: 'texto',
      titulo: 'La sílaba que suena fuerte',
      parrafos: [
        'En cada palabra hay una sílaba que suena más fuerte: la **tónica**. *ca-**mi**-no*, ***no**-che*, *a-ve-**ni**-da*.',
        'Las palabras cortas como *la*, *de*, *por* o *que* casi no se marcan: se apoyan en la siguiente.',
        'La tónica es de donde sale la rima y, en la siguiente lección de flow, la que cae en el pulso.',
      ],
    },
    {
      tipo: 'marcar',
      titulo: 'Encuentra las tónicas',
      rondas: [
        {
          pregunta: 'Toca la sílaba que suena **más fuerte** en cada palabra.',
          unidad: 'silaba',
          texto: 'Camino de noche por la avenida',
          correctas: 'tonicas',
          explicacion: 'ca-**mi**-no, **no**-che, a-ve-**ni**-da. *de*, *por* y *la* no se marcan.',
        },
        {
          pregunta: 'Ahora en este verso.',
          unidad: 'silaba',
          texto: 'Salgo temprano a buscar mi suerte',
          correctas: 'tonicas',
          explicacion: '**sal**-go, tem-**pra**-no, bus-**car**, **suer**-te. *a* y *mi* no se marcan.',
        },
      ],
    },
  ],
}
