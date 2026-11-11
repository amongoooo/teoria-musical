import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { SALAMANDER_NOTES, SALAMANDER_URL } from './src/audio/salamander.js'

const BASE = '/teoria-musical/'

/** Todos los archivos de una carpeta (rutas relativas, con «/»), sin los ocultos (.gitkeep). */
function archivos(dir, raiz = dir) {
  return readdirSync(dir).flatMap((n) => {
    if (n.startsWith('.')) return []
    const ruta = join(dir, n)
    return statSync(ruta).isDirectory() ? archivos(ruta, raiz) : [relative(raiz, ruta).split('\\').join('/')]
  })
}

/**
 * App instalable y sin internet: genera dist/sw.js desde src/pwa/sw-plantilla.js con la lista de
 * archivos del build (JS, CSS, fuentes, index.html) + los de public/ (manifiesto, íconos) y una
 * versión = hash de todo, así cada despliegue con cambios instala una versión nueva del service worker.
 */
function swApp() {
  return {
    name: 'sw-app',
    apply: 'build',
    enforce: 'post', // después del plugin de HTML, para que index.html ya esté en el bundle
    generateBundle(_, bundle) {
      const lista = [...Object.keys(bundle), ...archivos('public')].filter((f) => f !== 'sw.js').sort()
      const hash = createHash('sha256')
      for (const f of lista) {
        const b = bundle[f]
        hash.update(f)
        hash.update(b ? (b.type === 'chunk' ? b.code : b.source) : readFileSync(join('public', f)))
      }
      const plantilla = readFileSync('src/pwa/sw-plantilla.js', 'utf8')
      hash.update(plantilla)
      const version = hash.digest('hex').slice(0, 12)
      const codigo = plantilla
        .replace("'__VERSION__'", JSON.stringify(version))
        .replace("'__BASE__'", JSON.stringify(BASE))
        .replace('__ARCHIVOS__', JSON.stringify(lista))
        .replace("'__PIANO_URL__'", JSON.stringify(SALAMANDER_URL))
        .replace('__PIANO__', JSON.stringify(Object.values(SALAMANDER_NOTES)))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: codigo })
    },
  }
}

export default defineConfig({
  base: BASE,
  plugins: [react(), tailwindcss(), swApp()],
})
