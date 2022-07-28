const { defineConfig } = require('@vue/cli-service')
const { VueRouterExports } = require('unplugin-vue-router')
const routerPlugin = require('unplugin-vue-router/webpack').default
const autoImport = require('unplugin-auto-import/webpack')

module.exports = defineConfig({
  lintOnSave: false,
  configureWebpack: {
    plugins: [
      routerPlugin({
        routesFolder: 'src/pages',
      }),
      autoImport({
        imports: [
          {
            '@vue-router': VueRouterExports,
          },
        ],
      }),
    ],
  },
})
