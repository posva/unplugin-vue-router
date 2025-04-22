import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import { join } from 'node:path'
import Markdown from 'unplugin-vue-markdown/vite'
// @ts-ignore: the plugin should not be checked in the playground
import VueRouter from '../src/vite'
import { VueRouterAutoImports } from '../src'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Inspect from 'vite-plugin-inspect'

export default defineConfig({
  clearScreen: false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      'unplugin-vue-router/runtime': fileURLToPath(
        new URL('../src/runtime.ts', import.meta.url)
      ),
      'unplugin-vue-router/types': fileURLToPath(
        new URL('../src/types.ts', import.meta.url)
      ),
      'unplugin-vue-router/data-loaders/basic': fileURLToPath(
        new URL('../src/data-loaders/entries/basic.ts', import.meta.url)
      ),
      'unplugin-vue-router/data-loaders/pinia-colada': fileURLToPath(
        new URL('../src/data-loaders/entries/pinia-colada.ts', import.meta.url)
      ),
      'unplugin-vue-router/data-loaders': fileURLToPath(
        new URL('../src/data-loaders/entries/index.ts', import.meta.url)
      ),
    },
  },
  build: {
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: [
      // easier to test with yalc
      '@pinia/colada',
    ],
  },

  plugins: [
    VueRouter({
      extensions: ['.page.vue', '.vue'],
      importMode: 'async',
      experimental: {
        autoExportsDataLoaders: ['src/loaders/**/*', '@/loaders/**/*'],
      },
      extendRoute(route) {
        route.params.forEach((param) => {
          // transform kebab-case to camelCase
          param.paramName = param.paramName.replace(/-([a-z])/g, (g) =>
            g[1].toUpperCase()
          )
        })

        // example of deleting routes
        // if (route.name.startsWith('/users')) {
        //   route.delete()
        // }

        if (route.name === '/[name]') {
          route.addAlias('/hello-vite-:name')
        }

        // if (route.name === '/deep/nesting') {
        //   const children = [...route]
        //   children.forEach((child) => {
        //     // TODO: remove one node while copying the children to its parent
        //   })
        // }

        // example moving a route (without its children to the root)
        if (route.fullPath.startsWith('/deep/nesting/works/too')) {
          route.parent!.insert(
            '/at-root-but-from-nested',
            route.components.get('default')!
          )
          // TODO: make it easier to access the root
          let root = route
          while (root.parent) {
            root = root.parent
          }
          route.delete()
          const newRoute = root.insert(
            '/custom/page',
            route.components.get('default')!
          )
          // newRoute.components.set('default', route.components.get('default')!)
          newRoute.meta = {
            'custom-meta': 'works',
          }
        }
      },
      beforeWriteFiles(root) {
        root.insert('/from-root', join(__dirname, './src/pages/index.vue'))
      },
      routesFolder: [
        // can add multiple routes folders
        {
          src: 'src/pages',
        },
        {
          src: 'src/docs',
          path: 'docs/[lang]/',
          // doesn't take into account files directly at src/docs, only subfolders
          filePatterns: ['*/**'],
          // ignores .vue files
          extensions: ['.md'],
        },
        {
          src: 'src/features',
          filePatterns: '*/pages/**/*',
          path: (file) => {
            const prefix = 'src/features'
            // +1 for the starting slash
            file = file
              .slice(file.lastIndexOf(prefix) + prefix.length + 1)
              .replace('/pages', '')
            // console.log('👉 FILE', file)
            return file
          },
        },
      ],
      logs: true,
      // getRouteName: getPascalCaseRouteName,
      exclude: [
        '**/ignored/**',
        // '**/ignored/**/*',
        '**/__*',
        '**/__**/*',
        '**/*.component.vue',
        // resolve(__dirname, './src/pages/ignored'),
        //
        // './src/pages/**/*.spec.ts',
      ],
    }),
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),
    Markdown({}),
    AutoImport({
      imports: [
        VueRouterAutoImports,
        {
          // NOTE: we need to match the resolved paths to local files for development
          // instead of just 'unplugin-vue-router/data-loaders/basic': ['defineBasicLoader'],
          [fileURLToPath(
            new URL('../src/data-loaders/entries/basic.ts', import.meta.url)
          )]: ['defineBasicLoader'],
          // [fileURLToPath(
          //   new URL('../src/data-loaders/entries/pinia-colada.ts', import.meta.url)
          // )]: ['defineColadaLoader'],
        },
      ],
    }),
    // currently the devtools use 0.8.8 but we care more about
    // inspecting virtual files
    // VueDevtools(),
    Inspect(),
  ],
})
