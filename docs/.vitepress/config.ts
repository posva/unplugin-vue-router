import { defineConfig } from 'vitepress'
import { transformerTwoslash } from 'vitepress-plugin-twoslash'

export default defineConfig({
  markdown: {
    codeTransformers: [transformerTwoslash()],
  },
})
