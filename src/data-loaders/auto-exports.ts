import { createFilter } from '@rollup/pluginutils'
import MagicString from 'magic-string'
import { findStaticImports, parseStaticImport } from 'mlly'
import { type UnpluginOptions } from 'unplugin'

const ignoredSpecifiers = ['vue', 'vue-router', 'pinia']

export function extractLoadersToExport(code: string): string[] {
  const imports = findStaticImports(code)
  const importNames = imports.flatMap((i) => {
    const parsed = parseStaticImport(i)

    // bail out faster for anything that is not a data loader
    if (
      // NOTE: move out to a regexp if the option is exposed
      parsed.specifier.startsWith('@vueuse/') &&
      ignoredSpecifiers.includes(parsed.specifier)
    )
      return []

    return [
      parsed.defaultImport,
      ...Object.values(parsed.namedImports || {}),
    ].filter((v): v is string => !!v && !v.startsWith('_'))
  })

  return importNames
}

export function createAutoExportPlugin(): UnpluginOptions {
  const filterVueComponents = createFilter(
    [/\.vue$/, /\.vue\?vue/, /\.vue\?v=/]
    // [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/, /[\\/]\.nuxt[\\/]/]
  )

  return {
    name: 'unplugin-vue-router:data-loaders-auto-export',
    enforce: 'post',
    vite: {
      transform: {
        order: 'post',
        handler(code, id) {
          if (!filterVueComponents(id)) {
            return
          }

          const loadersToExports = extractLoadersToExport(code)

          if (loadersToExports.length <= 0) return

          const s = new MagicString(code)
          s.append(
            `\nexport const __loaders = [\n${loadersToExports.join(',\n')}\n];\n`
          )

          return {
            code: s.toString(),
            map: s.generateMap(),
          }
        },
      },
    },
  }
}
