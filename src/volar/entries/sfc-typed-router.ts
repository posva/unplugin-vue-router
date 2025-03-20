import { relative } from 'node:path'
import type { VueLanguagePlugin } from '@vue/language-core'
import { replaceAll, toString } from 'muggle-string'
import { augmentVlsCtx } from '../utils/augment-vls-ctx'

/*
  Future ideas:
  - Enhance typing of `useRouter().currentRoute` and `$router.currentRoute`
  - Enhance typing of `to` route in `beforeEnter` route guards defined in `definePage`
  - Enhance typing of `<RouterView>`
    - Typed `name` attribute for named views
    - Typed `route` slot prop when using `<RouterView v-slot="{route}">`
*/

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
    resolveEmbeddedCode(fileName, _sfc, embeddedCode) {
      if (!embeddedCode.id.startsWith('script_')) {
        return
      }

      // TODO: Do we want to apply this to EVERY .vue file or only to components that the user wrote themselves?

      const relativeFilePath = ctx.compilerOptions.baseUrl
        ? relative(ctx.compilerOptions.baseUrl, fileName)
        : fileName

      const routeNameGetter = `import('vue-router/auto-routes').GetPossibleRouteNamesByFilePath<'${relativeFilePath}'>`
      const routeNameGetterGeneric = `<${routeNameGetter}>`
      const typedCall = `useRoute${routeNameGetterGeneric}`

      if (embeddedCode.id.startsWith('script_ts')) {
        // Inserts generic into `useRoute()` calls.
        // We only apply this mutation on <script setup> blocks with lang="ts".
        replaceAll(
          embeddedCode.content,
          RE.USE_ROUTE.BEFORE_PARENTHESES,
          routeNameGetterGeneric
        )
      } else if (embeddedCode.id.startsWith('script_js')) {
        // Typecasts `useRoute()` calls.
        // We only apply this mutation on plain JS <script setup> blocks.
        replaceAll(embeddedCode.content, RE.USE_ROUTE.BEFORE, `(`)
        replaceAll(
          embeddedCode.content,
          RE.USE_ROUTE.AFTER,
          ` as ReturnType<typeof ${typedCall}>)`
        )
      }

      const contentStr = toString(embeddedCode.content)

      const vlsCtxAugmentations: string[] = []

      // Augment `__VLS_ctx.$route` to override the typings of `$route` in template blocks
      if (contentStr.match(RE.DOLLAR_ROUTE.VLS_CTX)) {
        vlsCtxAugmentations.push(`$route: ReturnType<typeof ${typedCall}>;`)
      }

      // We can try augmenting the types for `RouterView` below.
      // if (contentStr.includes(`__VLS_WithComponent<'RouterView', __VLS_LocalComponents`)) {
      //   vlsCtxAugmentations.push(`RouterView: 'test';`)
      // }

      if (vlsCtxAugmentations.length > 0) {
        augmentVlsCtx(
          embeddedCode.content,
          () => ` & {
  ${vlsCtxAugmentations.join('\n  ')}
}`
        )
      }
    },
  }
}

export default plugin
