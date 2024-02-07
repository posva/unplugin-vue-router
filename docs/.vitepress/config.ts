import { defineConfig } from 'vitepress'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'

export default defineConfig({
  markdown: {
    codeTransformers: [transformerTwoslash()],
  },
})
