// Qué opciones de «Escucha y elige» NO se barajan (las demás salen en otro orden cada vez; pedido del usuario).
// Sin dependencias, para probarlo con node (docs/pruebas/orden-respuestas.mjs).

// Palabras que cuentan, para reconocer opciones en orden natural («Ninguna · Una · Dos»).
const CUENTA = { ninguna: 0, ninguno: 0, medio: 0.5, media: 0.5, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4 }

/**
 * ¿Las opciones tienen un orden natural que conviene respetar? (números que suben: «60 BPM · 90 BPM · 120 BPM»,
 * «1.º · 2.º · 3.º», «Ninguna · Una · Dos»; o «La versión A · La versión B»). Esas no se barajan; las demás sí.
 */
export function ordenNatural(opciones) {
  const textos = opciones.map((o) => String(o).replace(/\*/g, '').trim())
  if (textos.every((t) => /^(la versión|sonido|el|la) [A-F]$/i.test(t))) return true
  const numeros = textos.map((t) => {
    const n = /\d+(?:[.,]\d+)?/.exec(t)
    if (n) return Number(n[0].replace(',', '.'))
    const palabra = /^[a-záéíóú]+/i.exec(t)?.[0].toLowerCase()
    return palabra in CUENTA ? CUENTA[palabra] : null
  })
  return numeros.every((n) => n !== null) && numeros.every((n, i) => i === 0 || n > numeros[i - 1])
}
