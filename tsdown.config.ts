import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    '*': './src/*.ts',
    'data-loaders': './src/data-loaders/entries/index.ts',
    'data-loaders/*': './src/data-loaders/entries/!(index).ts',
    'volar/*': './src/volar/entries/*.ts',
  },
  exports: {
    customExports(exports) {
      exports['./client'] = {
        types: './client.d.ts',
      }
      return exports
    },
  },
  inlineOnly: [],
  external: ['vue', 'vue-router', '@pinia/colada'],
})
