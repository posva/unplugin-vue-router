const plugin = () => {
  return {
    getEmbeddedFileNames(fileName, sfc) {
      const fileNames = []
      for (let i = 0; i < sfc.customBlocks.length; i++) {
        const block = sfc.customBlocks[i]
        if (block.type === 'route' && block.lang === 'ts') {
          fileNames.push(`${fileName}.route_${i}.${block.lang}`)
        }
      }
      return fileNames
    },

    resolveEmbeddedFile(fileName, sfc, embeddedFile) {
      const match = embeddedFile.fileName.match(/^(.*)\.route_(\d+)\.([^.]+)$/)
      if (match) {
        const index = parseInt(match[2])
        const block = sfc.customBlocks[index]
        embeddedFile.capabilities = {
          diagnostics: true,
          foldingRanges: true,
          formatting: true,
          documentSymbol: true,
          codeActions: true,
          inlayHints: true,
        }
        embeddedFile.isTsHostFile = true
        embeddedFile.codeGen.addCode2(block.content, 0, {
          vueTag: 'customBlock',
          vueTagIndex: index,
          capabilities: {
            basic: true,
            references: true,
            definitions: true,
            diagnostic: true,
            rename: true,
            completion: true,
            semanticTokens: true,
          },
        })
      }
    },
  }
}

export default plugin
