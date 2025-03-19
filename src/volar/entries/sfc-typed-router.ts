import { relative } from 'node:path'
import type { VueLanguagePlugin } from '@vue/language-core'
import { replaceAll, toString } from 'muggle-string'
import { augmentVlsCtx } from '../utils/augment-vls-ctx'

const plugin: VueLanguagePlugin = (ctx) => {
  const RE = {
    USE_ROUTE: {
      /** Targets the spot between `useRoute` and `()` */
      BEFORE_PARENTHESES: /(?<=useRoute)(\s*)(?=\(\))/g,
      /** Targets the spot right before `useRoute()` */
      BEFORE: /(?=useRoute(\s*)\(\))/g,
      /** Targets the spot right after `useRoute()` */
      AFTER: /(?<=useRoute(\s*)\(\))/g,
    },
    DOLLAR_ROUTE: {
      /**
       * When using `$route` in a template, it is referred
       * to as `__VLS_ctx.$route` in the virtual file.
       */
      VLS_CTX: /\b__VLS_ctx.\$route\b/g,
    },
  }

  return {
    version: 2.1,
    resolveEmbeddedCode(fileName, _sfc, embeddedFile) {
      if (!embeddedFile.id.startsWith('script_')) {
        return
      }

      // TODO: Do we want to apply this to EVERY .vue file or only to components that the user wrote themselves?

      const relativeFilePath = ctx.compilerOptions.baseUrl
        ? relative(ctx.compilerOptions.baseUrl, fileName)
        : fileName

      const routeNameGetter = `import('vue-router/auto-routes').GetRouteNameByPath<'${relativeFilePath}'>`
      const routeNameGetterGeneric = `<${routeNameGetter}>`
      const typedCall = `useRoute${routeNameGetterGeneric}`

      if (embeddedFile.id.startsWith('script_ts')) {
        // Inserts generic into `useRoute()` calls.
        // We only apply this mutation on <script setup> blocks with lang="ts".
        replaceAll(
          embeddedFile.content,
          RE.USE_ROUTE.BEFORE_PARENTHESES,
          routeNameGetterGeneric
        )
      } else if (embeddedFile.id.startsWith('script_js')) {
        // Typecasts `useRoute()` calls.
        // We only apply this mutation on plain JS <script setup> blocks.
        replaceAll(embeddedFile.content, RE.USE_ROUTE.BEFORE, `(`)
        replaceAll(
          embeddedFile.content,
          RE.USE_ROUTE.AFTER,
          ` as ReturnType<typeof ${typedCall}>)`
        )
      }

      const contentStr = toString(embeddedFile.content)

      // Augment `__VLS_ctx.$route` to override the typings of `$route` in template blocks
      if (contentStr.match(RE.DOLLAR_ROUTE.VLS_CTX)) {
        augmentVlsCtx(
          embeddedFile.content,
          () => ` & {
  $route: ReturnType<typeof ${typedCall}>;
}`
        )
      }
    },
  }
}

export default plugin
