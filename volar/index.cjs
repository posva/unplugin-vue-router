// @ts-check

/**
 * @type {import('@vue/language-core').VueLanguagePlugin}
 */
const plugin = () => {
  return {
    version: 2.1,
    getEmbeddedCodes(fileName, sfc) {
      const names = [];
      for (let i = 0; i < sfc.customBlocks.length; i++) {
        const block = sfc.customBlocks[i]
        if (block.type === 'route') {
          const lang = block.lang === 'txt' ? 'json' : block.lang
          names.push({ id: `route_${i}`, lang })
        }
      }
      return names
    },
    resolveEmbeddedCode(fileName, sfc, embeddedCode) {
      const match = embeddedCode.id.match(/^route_(\d+)$/)
      if (match) {
        const index = parseInt(match[1])
        const block = sfc.customBlocks[index]
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

module.exports = plugin
