const { defineConfig } = require('@vue/cli-service')
const routerPlugin = require('unplugin-vue-router/webpack').default

module.exports = defineConfig({
  lintOnSave: false,
  configureWebpack: {
    plugins: [
      routerPlugin({
        routesFolder: 'src/pages',
      }),
    ],
  },
})
