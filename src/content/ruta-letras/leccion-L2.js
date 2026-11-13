// Ruta de letras · L2 — Esquemas de rima (AABB, ABAB, ABBA).
// Vive en la ruta de letras (`ruta: 'letras'`). Versos originales; el esquema lo calcula el motor de src/letras/.
// Formato: src/content/FORMATO.md · interacciones: src/content/INTERACCIONES.md

const ESQUEMAS = ['AABB', 'ABAB', 'ABBA']

/** Ronda «¿qué esquema tiene?»: la estrofa con sus colores de rima, sin la columna del esquema. */
const cual = (texto, correcta, explicacion) => ({
  pregunta: '¿Qué esquema tiene?',
  letra: { texto },
  opciones: ESQUEMAS,
  correcta: ESQUEMAS.indexOf(correcta),
  explicacion,
})

export default {
  id: 'L2',
  ruta: 'letras',
  titulo: 'Esquemas de rima',
  subtitulo: 'AABB, ABAB y ABBA',
  minutos: 5,
  resumen: [
    'El **esquema** pone una letra a cada verso: los que riman entre sí llevan **la misma letra**.',
    '**AABB** (pareadas): rima enseguida, directo y pegajoso.',
    '**ABAB** (cruzadas): la rima tarda un verso; la historia avanza.',
    '**ABBA** (abrazadas): el primer verso espera hasta el final; cierra la idea.',
  ],
  pasos: [
    {
      tipo: 'texto',
      titulo: 'Una letra por rima',
      parrafos: [
        'Para ver cómo rima una estrofa, a cada verso se le pone una letra: el primero es **A**; si el siguiente rima con él, también es **A**; si no, es **B**, y así.',
        'Aquí *pan* rima con *van* (**AA**) y *gané* con *sé* (**BB**): **AABB**.',
      ],
      letra: { texto: 'Salgo temprano a buscar el pan\ntodos me miran, todos se van\ntraigo en la bolsa lo que gané\nnadie me dijo cómo, yo sé', esquema: true },
    },
    {
      tipo: 'texto',
      titulo: 'Cruzadas: ABAB',
      parrafos: ['La rima salta un verso: el 1.º con el 3.º y el 2.º con el 4.º. Te deja esperando la rima y la historia sigue.'],
      letra: { texto: 'Camino de noche por la avenida\nla luna me sigue sin hacer ruido\ntraigo en el pecho una herida\ny un sueño que nunca se ha ido', esquema: true },
    },
    {
      tipo: 'texto',
      titulo: 'Abrazadas: ABBA',
      parrafos: ['El 1.º y el 4.º riman, y abrazan a los dos de en medio. La última rima regresa al principio y cierra la estrofa.'],
      letra: { texto: 'Te busqué por toda la ciudad\nentre las luces y el ruido\ncada esquina me ha mentido\ny al final no hubo verdad', esquema: true },
    },
    {
      tipo: 'siente',
      titulo: '¿Qué se siente?',
      lados: [
        { etiqueta: 'AABB', emociones: 'Directo, pegajoso, con fuerza.', ejemplos: 'Coros, ganchos y versos de rap que pegan rápido.' },
        { etiqueta: 'ABAB', emociones: 'Avanza, cuenta algo, crea espera.', ejemplos: 'Estrofas que narran una historia.' },
        { etiqueta: 'ABBA', emociones: 'Envuelve y cierra la idea.', ejemplos: 'Final de una estrofa o de una canción.' },
      ],
      nota: 'Cambiar de esquema entre estrofas también es un recurso: el oído nota el cambio.',
    },
    {
      tipo: 'elegir',
      titulo: 'Reconoce el esquema',
      rondas: [
        cual(
          'Tengo un sueño guardado en la mano\nnadie lo ve cuando sale la luna\nvoy caminando despacio y temprano\nbuscando suerte, buscando fortuna',
          'ABAB',
          '*mano* rima con *temprano* (versos 1 y 3) y *luna* con *fortuna* (2 y 4): cruzadas.',
        ),
        cual(
          'Suena la pista y me pongo a escribir\ntengo mil cosas que quiero decir\ncuento los días, las horas, el mes\ny vuelvo a empezar otra vez',
          'AABB',
          '*escribir* · *decir* y luego *mes* · *vez* (en México la z suena como s): pareadas.',
        ),
        cual(
          'Me fui sin decirte adiós\nla calle se quedó callada\nno tengo miedo de nada\nsolo extraño tu voz',
          'ABBA',
          '*adiós* y *voz* abrazan a *callada* · *nada*: abrazadas.',
        ),
      ],
    },
  ],
}
