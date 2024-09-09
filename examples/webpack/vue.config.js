import { defineConfig } from '@vue/cli-service'
import routerPlugin from 'unplugin-vue-router/webpack'

export default defineConfig({
  lintOnSave: false,
  configureWebpack: {
    plugins: [
      routerPlugin({
        routesFolder: './src/pages',
      }),
    ],
    devServer: {
      allowedHosts: 'all',
    },
    output: {
      libraryTarget: 'module',
    },
    experiments: {
      outputModule: true,
    },
  },
})
