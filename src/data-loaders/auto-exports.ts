import { createFilter } from '@rollup/pluginutils'
import MagicString from 'magic-string'
import { findStaticImports, parseStaticImport } from 'mlly'
import { join, resolve } from 'pathe'
import { type UnpluginOptions } from 'unplugin'

export function extractLoadersToExport(
  code: string,
  filterPaths: (id: string) => boolean,
  root: string
): string[] {
  const imports = findStaticImports(code)
  const importNames = imports.flatMap((i) => {
    const parsed = parseStaticImport(i)

    // since we run post-post, vite will add a leading slash to the specifier
    const specifier = resolve(
      root,
      parsed.specifier.startsWith('/')
        ? parsed.specifier.slice(1)
        : parsed.specifier
    )

    // bail out faster for anything that is not a data loader
    if (!filterPaths(specifier)) return []

    return [
      parsed.defaultImport,
      ...Object.values(parsed.namedImports || {}),
    ].filter((v): v is string => !!v && !v.startsWith('_'))
  })

  return importNames
}

export function createAutoExportPlugin({
  filterPageComponents,
  loadersPathsGlobs,
  root,
}: {
  filterPageComponents: (id: string) => boolean
  loadersPathsGlobs: string | string[]
  root: string
}): UnpluginOptions {
  const filterPaths = createFilter(loadersPathsGlobs)

  return {
    name: 'unplugin-vue-router:data-loaders-auto-export',
    enforce: 'post',
    vite: {
      transform: {
        order: 'post',
        handler(code, id) {
          // strip query to also match .vue?vue&lang=ts etc
          const queryIndex = id.indexOf('?')
          const idWithoutQuery = queryIndex >= 0 ? id.slice(0, queryIndex) : id
          if (!filterPageComponents(idWithoutQuery)) {
            return
          }

          const loadersToExports = extractLoadersToExport(
            code,
            filterPaths,
            root
          )

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
