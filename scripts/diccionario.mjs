// Genera src/letras/diccionario.js desde la lista de frecuencias de FrequencyWords (Hermit Dave, CC BY-SA 4.0,
// a partir de OpenSubtitles 2018):
//   curl -L -o es_50k.txt https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt
//   node scripts/diccionario.mjs es_50k.txt
// Limpia la lista (palabras extranjeras, nombres propios comunes, groserías sueltas) y la agrupa por rima consonante
// (con su asonante), en orden de frecuencia. Así el teléfono solo tiene que leerla, sin calcular 50 000 rimas.
import { readFileSync, writeFileSync } from 'node:fs'
import { rima } from '../src/letras/rima.js'

const [, , origen] = process.argv
if (!origen) throw new Error('Uso: node scripts/diccionario.mjs es_50k.txt')

// Nombres propios frecuentes en subtítulos (la lista va en minúsculas) y palabras en inglés que se cuelan.
const NOMBRES = `john jack michael david james peter paul mike tom harry charlie george frank sam joe max ben nick
alex daniel sarah maría mario josé juan carlos pedro luis jorge miguel antonio manuel ana laura lucía elena isabel
carmen rosa marta pablo diego andrés fernando ricardo roberto alberto javier sergio raúl francisco rafael ramón
enrique eduardo alejandro emilio martín simón tony billy bobby danny eddie jimmy johnny kevin ryan steve henry
walter dean sam castle jessica emily emma kate katie lily lisa lucy mary rachel rebecca susan amy anna annie
chloe claire grace hannah helen jane jenny julia julie karen linda maggie molly nancy olivia sophie stella holmes
watson bond batman superman clark lois bruce wayne stark rick morty homer bart lisa marge sheldon leonard penny
howard rajesh ross monica phoebe joey chandler rachel dexter walter jesse hank saul gus michelle robin barney ted
marshall lily house wilson cameron chase foreman cuddy dios jesús cristo maría madre okay ok yeah hey hello bye
the you and what is it this that of to in my me your for on are was with be have not but they all just so can
like know get got go going gonna wanna come yes no oh shit fuck`.split(/\s+/)

// Inglés frecuente que pasa los filtros de letras (subtítulos de películas).
const INGLES = `love hope home come some one done gone none more sure time life nice fine mine line care here there where
were have give live make take like please sorry baby honey lady party happy ready body daddy mommy crazy guy okay
are one alone phone come become dude cute cool good food mood door floor moore zoe rose joe jane dave steve mike
kate wade blake drake lake bruce grace chase house mouse horse course force cause because these those whole
hole role sole pole smile while white write quite side wide ride inside outside size prize nose close those use
excuse rule cute huge large charge change range page stage age image cage edge bridge judge college knowledge
gene dare bye eye bye ice dice rice nice voice choice price place space race face case base lace
everyone someone anyone done gone shone stone tone bone cone zone lone bone heroine maine dune june tune lune
online offline smile style file mile tile pile while laroche rinpoche lasalle faye gaye baltimore monroe loren ronnie`.split(/\s+/)

// Groserías e insultos sueltos que no aportan a la lista de rimas.
const GROSERIAS = `puta puto putas putos mierda verga vergas pendejo pendeja pendejos cabrón cabrones cabrona coño
joder jodido jodida culero culera culo chingar chinga chingada chingado chingados maricón maricones marica perra
zorra zorras malparido hijueputa gilipollas polla pollas follar cojones mamada mamadas pinche pinches`.split(/\s+/)
const FUERA = new Set([...NOMBRES, ...INGLES, ...GROSERIAS].filter(Boolean))
// Formas que también son español (base, come, dice, quite, use, case, page…) se quedan.
for (const p of ['base', 'come', 'dice', 'case', 'use', 'quite', 'page', 'place', 'excuse', 'cause']) FUERA.delete(p)
// Los que también son palabras del español se quedan.
for (const p of ['rosa', 'dios', 'madre', 'simón', 'no', 'me', 'oh', 'ana']) FUERA.delete(p)

const ESPANOL = /^[a-záéíóúüñ]+$/
const FINAL = /[aeiouáéíóúnsrldzyjx]$/
// «oo» casi nunca es español (salvo coo-, zoo-: cooperar, zoológico).
const RARO = /(k|w|sh|th|ck|ph|tz|ff|ss|tt|pp|bb|dd|gg|mm|ou$|ee$|^(?!coo|zoo).*oo)/

const filas = readFileSync(origen, 'utf8').split('\n')
const grupos = new Map() // consonante → { asonante, palabras }
let total = 0
for (const fila of filas) {
  const p = fila.split(' ')[0]?.trim()
  if (!p || p.length < 2 || !ESPANOL.test(p) || !FINAL.test(p) || RARO.test(p) || FUERA.has(p)) continue
  // Más de una tilde = error de escritura.
  if ((p.match(/[áéíóú]/g) ?? []).length > 1) continue
  const r = rima(p)
  if (!r.consonante || !r.asonante) continue
  if (!grupos.has(r.consonante)) grupos.set(r.consonante, { asonante: r.asonante, palabras: [] })
  grupos.get(r.consonante).palabras.push(p)
  total++
}

// Una línea por rima consonante: «consonante|asonante|palabra palabra …» (por frecuencia, la más usada primero).
const lineas = [...grupos.entries()].map(([c, g]) => `${c}|${g.asonante}|${g.palabras.join(' ')}`)
const salida = `// GENERADO por scripts/diccionario.mjs — no editar a mano.
// ${total} palabras del español más usadas, agrupadas por rima (consonante|asonante|palabras por frecuencia).
// Fuente: FrequencyWords de Hermit Dave (https://github.com/hermitdave/FrequencyWords), a partir de OpenSubtitles
// 2018. Licencia CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/): esta lista adaptada se comparte con
// la misma licencia. Crédito también en Opciones → Créditos.
export default ${JSON.stringify(lineas.join('\n'))}
`
writeFileSync(new URL('../src/letras/diccionario.js', import.meta.url), salida)
console.log(`${total} palabras en ${grupos.size} rimas → src/letras/diccionario.js (${(salida.length / 1024).toFixed(0)} KB)`)
