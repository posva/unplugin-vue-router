import type { VueLanguagePlugin } from '@vue/language-core'

const plugin: VueLanguagePlugin = () => {
  return {
    version: 2.1,
    getEmbeddedCodes(_fileName, sfc) {
      const names = [];

      for (let i = 0; i < sfc.customBlocks.length; i++) {
        const block = sfc.customBlocks[i]!

        // TODO: `<route>` block without `lang` is still interpreted as text right now, it seems
        if (block.type === 'route') {
          const lang = block.lang === 'txt' ? 'json' : block.lang
          names.push({ id: `route_${i}`, lang: lang || 'json' })
        }
      }

      return names
    },
    resolveEmbeddedCode(_fileName, sfc, embeddedCode) {
      const match = embeddedCode.id.match(/^route_(\d+)$/)

      if (match && match[1] !== undefined) {
        const index = parseInt(match[1])
        const block = sfc.customBlocks[index]

        if (!block) {
          return
        }

        embeddedCode.content.push([
          block.content,
          block.name,
          0,
          {
            verification: true,
            completion: true,
            semantic: true,
            navigation: true,
            structure: true,
            format: true,
          },
        ])
      }
    },
  }
}

export default plugin
