import { pathToFileURL } from 'node:url'
import { createUnplugin } from 'unplugin'
import { parseQuery, parseURL, withQuery } from 'ufo'
import { findStaticImports, findExports } from 'mlly'
import MagicString from 'magic-string'
import { isAbsolute } from 'pathe'
import { VIRTUAL_PREFIX } from './moduleConstants'

export interface TransformMacroPluginOptions {
  // why allowing custom macros?
  macros: Record<string, string>
  dev?: boolean
  sourcemap?: boolean
}

export const TransformMacroPlugin = createUnplugin(
  (options: TransformMacroPluginOptions) => {
    return {
      name: 'unplugin-vue-router:definePage',
      // we need to be a real module -> from .vue -> .js that can be imported
      enforce: 'post',
      transformInclude(id) {
        // skip any virtual file
        if (!id || id.startsWith(VIRTUAL_PREFIX) || id.startsWith('\x00')) {
          return false
        }
        const { pathname, search } = parseURL(
          decodeURIComponent(pathToFileURL(id).href)
        )
        // TODO: support other extensions
        // TODO: only include page folders
        return pathname.endsWith('.vue') || !!parseQuery(search).macro
      },
      transform(code, id) {
        // TODO: check if this is slow as it could be optimized
        const s = new MagicString(code)
        const { search } = parseURL(decodeURIComponent(pathToFileURL(id).href))

        function result() {
          if (s.hasChanged()) {
            return {
              code: s.toString(),
              map: options.sourcemap
                ? s.generateMap({ source: id, includeContent: true })
                : undefined,
            }
          }
        }

        // we add the magic false && to the regular version only, the one with macro=.vue doesn't need it because it
        // won't be imported anyway
        if (!parseQuery(search).macro) {
          // Tree-shake out any runtime references to the macro.
          // We do this first as it applies to all files, not just those with the query
          for (const macro in options.macros) {
            const match = code.match(new RegExp(`\\b${macro}\\s*\\(\\s*`))
            if (match?.[0]) {
              s.overwrite(
                match.index!,
                match.index! + match[0].length,
                `/*#__PURE__*/ false && ${match[0]}`
              )
            }
          }

          return result()
        }

        const imports = findStaticImports(code)

        // Purge all imports bringing side effects, such as CSS imports
        for (const entry of imports) {
          if (!entry.imports) {
            s.remove(entry.start, entry.end)
          }
        }

        // TODO: this could maybe be completely removed
        // [webpack] Re-export any imports from script blocks in the components
        // with workaround for vue-loader bug: https://github.com/vuejs/vue-loader/pull/1911
        const scriptImport = imports.find(
          (i) =>
            parseQuery(i.specifier.replace('?macro=.vue', '')).type === 'script'
        )
        console.log('WHEN DOES THIS HAPPEN?', id, scriptImport)
        if (scriptImport) {
          // https://github.com/vuejs/vue-loader/pull/1911
          // https://github.com/vitejs/vite/issues/8473
          const url = isAbsolute(scriptImport.specifier)
            ? pathToFileURL(scriptImport.specifier).href
            : scriptImport.specifier
          const parsed = parseURL(
            decodeURIComponent(url).replace('?macro=.vue', '')
          )
          const specifier = withQuery(parsed.pathname, {
            macro: '.vue',
            ...parseQuery(parsed.search),
          })
          s.overwrite(0, code.length, `export { meta } from "${specifier}"`)
          return result()
        }

        // NOTE: why do we need to re export stuff? and only in dev?
        const currentExports = findExports(code)
        for (const match of currentExports) {
          // TODO: remove other exports
          if (match.type !== 'default') {
            continue
          }
          if (match.specifier && match._type === 'named') {
            // [webpack] Export named exports rather than the default (component)
            s.overwrite(
              match.start,
              match.end,
              `export {${Object.values(options.macros).join(', ')}} from "${
                match.specifier
              }"`
            )
            return result()
          } else if (!options.dev) {
            // ensure we tree-shake any _other_ default exports out of the macro script
            s.overwrite(match.start, match.end, '/*#__PURE__*/ false &&')
            s.append('\nexport default {}')
          }
        }

        for (const macro in options.macros) {
          // Skip already-processed macros
          if (currentExports.some((e) => e.name === options.macros[macro])) {
            continue
          }

          const { 0: match, index = 0 } =
            code.match(new RegExp(`\\b${macro}\\s*\\(\\s*`)) ||
            ({} as RegExpMatchArray)
          const macroContent = match
            ? extractObject(code.slice(index + match.length))
            : 'undefined'

          s.append(`\nexport const ${options.macros[macro]} = ${macroContent}`)
        }

        return result()
      },
    }
  }
)

const starts = {
  '{': '}',
  '[': ']',
  '(': ')',
  '<': '>',
  '"': '"',
  "'": "'",
}

const QUOTE_RE = /["']/

// NOTE: what are the limitations of this?
function extractObject(code: string) {
  // Strip comments
  code = code.replace(/^\s*\/\/.*$/gm, '')

  const stack: string[] = []
  let result = ''
  do {
    if (stack[0] === code[0] && result.slice(-1) !== '\\') {
      stack.shift()
    } else if (code[0] in starts && !QUOTE_RE.test(stack[0])) {
      stack.unshift(starts[code[0] as keyof typeof starts])
    }
    result += code[0]
    code = code.slice(1)
  } while (stack.length && code.length)
  return result
}
