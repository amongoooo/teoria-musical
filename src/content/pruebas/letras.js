// Prueba rápida «¿Ya lo sabes?» · banco de las lecciones de la ruta de letras (L1–L5, tramo «Rima y flow»).
// 3 preguntas por lección (la prueba toma una al azar). Versos originales; conteos, esquemas y multis son los del
// motor de src/letras/ (los comprueba docs/pruebas/prueba-rapida.mjs con `node`). Formato: src/content/FORMATO.md.

const TIPOS = ['Consonante', 'Asonante', 'No riman']
const ESQUEMAS = ['AABB', 'ABAB', 'ABBA']
const NUMEROS = ['5', '6', '7', '8']

const par = (a, b, correcta, explicacion) => ({ pregunta: `¿Cómo riman *${a}* y *${b}*?`, opciones: TIPOS, correcta, explicacion })
const esquema = (texto, correcta, explicacion) => ({
  pregunta: '¿Qué esquema tiene?',
  letra: { texto },
  opciones: ESQUEMAS,
  correcta: ESQUEMAS.indexOf(correcta),
  explicacion,
})
const cuenta = (texto, n, explicacion) => ({
  pregunta: '¿Cuántas sílabas tiene, **como se canta**?',
  letra: { texto, colores: false },
  opciones: NUMEROS,
  correcta: NUMEROS.indexOf(String(n)),
  explicacion,
})

export default {
  L1: [
    par('canción', 'camión', 0, 'Desde la vocal fuerte suenan igual, vocales **y** consonantes (*-ón*): rima **consonante**.'),
    par('noche', 'sobre', 1, 'Solo coinciden las vocales (**o‑e**); las consonantes cambian (*ch* / *br*): rima **asonante**.'),
    par('luna', 'calle', 2, '*lu-na* (u‑a) y *ca-lle* (a‑e) no comparten las vocales del final: **no riman**.'),
  ],
  L2: [
    esquema(
      'Camino sin prisa\nla noche me guía\nrespiro la brisa\ny se acaba el día',
      'ABAB',
      '*prisa* rima con *brisa* (versos 1 y 3) y *guía* con *día* (2 y 4): rimas cruzadas, **ABAB**.',
    ),
    esquema(
      'Me quedo con el sol\nque me deja tu luz\ncargando esta cruz\nbajo el mismo farol',
      'ABBA',
      'Los de fuera riman entre sí (*sol* / *farol*) y los de dentro también (*luz* / *cruz*): **ABBA**.',
    ),
    esquema(
      'Miro de lejos el mar\nyo no me canso de andar\ntengo la arena en la piel\ny en la boca la miel',
      'AABB',
      'Riman de dos en dos: *mar* / *andar* y *piel* / *miel*. **AABB**.',
    ),
  ],
  L3: [
    cuenta('La noche es larga', 5, '*la-no-che‿es-lar-ga*: *che* y *es* se unen en un golpe (**sinalefa**). Quedan **5**.'),
    {
      pregunta: '¿Cuál es la sílaba **tónica** de *música*?',
      opciones: ['**mú**-si-ca', 'mu-**si**-ca', 'mu-si-**ca**'],
      correcta: 0,
      explicacion: 'Suena fuerte la primera, ***mú***: es esdrújula (y por eso lleva tilde).',
    },
    {
      pregunta: '*corazón* es una palabra…',
      opciones: ['Aguda', 'Llana', 'Esdrújula'],
      correcta: 0,
      explicacion: 'La fuerza cae en la **última** sílaba, *co-ra-**zón***: **aguda**.',
    },
  ],
  L4: [
    {
      pregunta: '¿Cuál hace **multi** con *Tengo la mente en otro planeta*?',
      opciones: ['todo me cuesta', 'nadie me frena, sigo la meta', 'nadie me espera'],
      correcta: 1,
      explicacion: '*sigo la meta* repite **o‑a‑e‑a**. Las otras solo comparten el final: riman, pero no son multi.',
    },
    {
      pregunta: 'Una **multi** es…',
      opciones: [
        'Repetir las **vocales de varias sílabas** seguidas al final de dos versos',
        'Rimar **muchos versos** con la misma palabra',
        'Una rima **consonante** de una sola palabra',
      ],
      correcta: 0,
      explicacion: 'Lo que se repite es la música de **varias vocales seguidas**, aunque sean palabras distintas.',
    },
    {
      pregunta: '¿Qué vocales comparten *otro planeta* y *sigo la meta*?',
      opciones: ['o‑a‑e‑a', 'e‑a', 'o‑e‑a'],
      correcta: 0,
      explicacion: '*o-tro pla-ne-ta* → **o‑a‑e‑a** · *si-go la me-ta* → **o‑a‑e‑a**: multi 4.',
    },
  ],
  L5: [
    {
      pregunta: 'Para que un verso suene **con flow**, ¿qué sílabas van en el pulso?',
      opciones: ['Las **tónicas** (las que suenan fuerte)', 'Las **primeras** de cada palabra', 'Las **últimas** de cada palabra'],
      correcta: 0,
      explicacion: 'Las **tónicas** en los tiempos (o en las «y»): la voz se apoya donde el beat empuja.',
    },
    {
      pregunta: 'En *ca-**mi**-no*, ¿qué sílaba conviene poner en el tiempo?',
      opciones: ['ca', 'mi', 'no'],
      correcta: 1,
      explicacion: 'La tónica es ***mi***: es la que debe caer en el pulso para que no suene forzado.',
    },
    {
      pregunta: 'Si una tónica cae **entre** dos tiempos, en la «y»…',
      opciones: ['También suena bien: es un acento a **contratiempo**', 'Siempre está **mal**', 'El verso **no se puede** cantar'],
      correcta: 0,
      explicacion: 'Los acentos pueden ir en los números o en las «y» (contratiempo): lo raro es que una sílaba débil caiga fuerte.',
    },
  ],
}
