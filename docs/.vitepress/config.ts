import { DefaultTheme, defineConfig } from 'vitepress'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { ModuleResolutionKind } from 'typescript'
import llmstxt from 'vitepress-plugin-llms'
import {
  headTitle,
  headDescription,
  twitter,
  github,
  releases,
  discord,
} from './meta'
import { version } from '../../package.json'
import { typedRouterFile, typedRouterFileAsModule } from './twoslash-files'
import { extraFiles } from './twoslash/files'

export default defineConfig({
  title: headTitle,
  description: headDescription,

  vite: {
    plugins: [
      llmstxt({
        description: 'The official Router for Vue.js',
        details: `
- Type Safe routes
- File based routing
- Data Loaders for efficient data fetching
`.trim(),
        ignoreFiles: [
          //
          // path.join(__dirname, '../'),
          // path.join(__dirname, '../../public/'),
          // path.join(__dirname, '../../api/**/*'),
          // path.join(__dirname, '../../index.md'),
          'index.md',
          // 'api/*',
          'api/**/*',
        ],
      }),
    ],
  },

  markdown: {
    codeTransformers: [
      transformerTwoslash({
        twoslashOptions: {
          compilerOptions: {
            moduleResolution: ModuleResolutionKind.Bundler,
          },
          extraFiles: {
            ...extraFiles,
            'router.ts': typedRouterFileAsModule,
            'typed-router.d.ts': typedRouterFile,
          },
        },
      }),
    ],
  },

  head: [
    // ['meta', { name: 'theme-color', content: '#ffca28' }],
    // TODO: icon and color
    // ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    // [
    //   'link',
    //   {
    //     rel: 'alternate icon',
    //     href: '/favicon.ico',
    //     type: 'image/png',
    //     sizes: '16x16',
    //   },
    // ],
    [
      'meta',
      {
        name: 'author',
        content: `Eduardo San Martin Morote (@posva) and contributors`,
      },
    ],
    [
      'meta',
      {
        name: 'keywords',
        content: 'Vue.js, Vue, Router, File, based, typed, router',
      },
    ],
    ['meta', { property: 'og:title', content: headTitle }],
    ['meta', { property: 'og:description', content: headDescription }],
    ['meta', { name: 'twitter:title', content: headTitle }],
    ['meta', { name: 'twitter:description', content: headDescription }],

    [
      'script',
      {
        src: 'https://cdn.usefathom.com/script.js',
        'data-site': 'SAIIHJKJ',
        'data-spa': 'auto',
        defer: '',
      },
    ],
  ],

  themeConfig: {
    logo: '/logo.svg',
    editLink: {
      pattern:
        'https://github.com/posva/unplugin-vue-router/edit/main/docs/:path',
      text: 'Suggest changes to this page',
    },

    outline: [2, 3],

    socialLinks: [
      { icon: 'x', link: twitter },
      { icon: 'github', link: github },
      { icon: 'discord', link: discord },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2022-present Eduardo San Martin Morote',
    },

    search: {
      provider: 'local',
      options: {
        detailedView: true,
      },
    },

    nav: [
      // { text: 'Guide', link: '/guide/' },
      // { text: 'API', link: '/api/', activeMatch: '^/api/' },
      {
        text: `v${version}`,
        items: [
          {
            text: 'Release Notes ',
            link: releases,
          },
          {
            text: 'Data Loaders RFC',
            link: 'https://github.com/vuejs/rfcs/discussions/460',
          },
        ],
      },
    ],

    sidebar: {
      '/': [
        //
        sidebarGettingStarted(),
        sidebarGuide(),
        sidebarDataLoaders(),
        sidebarNuxt(),
      ],
    },
  },
})

type SidebarGroup = DefaultTheme.SidebarItem

function sidebarGettingStarted(): SidebarGroup {
  return {
    text: 'Getting Started',
    collapsed: false,
    items: [
      {
        text: 'Introduction',
        link: '/introduction',
      },
      {
        text: 'Why?',
        link: '/why',
      },
    ],
  }
}

function sidebarGuide(): SidebarGroup {
  return {
    collapsed: false,
    text: 'Guide',
    items: [
      {
        text: 'Configuration',
        link: '/guide/configuration',
      },
      {
        text: 'File-based Routing',
        link: '/guide/file-based-routing',
      },
      {
        text: 'Typed Routes',
        link: '/guide/typescript',
      },
      {
        text: 'Extending Routes',
        link: '/guide/extending-routes',
      },
      {
        text: 'ESlint',
        link: '/guide/eslint',
      },
    ],
  }
}

function sidebarDataLoaders(): SidebarGroup {
  return {
    collapsed: false,
    text: 'Data Loaders',
    items: [
      {
        text: 'Introduction',
        link: '/data-loaders/',
      },
      {
        text: 'Defining Data Loaders',
        link: '/data-loaders/defining-loaders',
      },
      {
        text: 'Reloading data',
        link: '/data-loaders/reloading-data',
      },
      {
        text: 'Navigation Aware',
        link: '/data-loaders/navigation-aware',
      },
      {
        text: 'Error Handling',
        link: '/data-loaders/error-handling',
      },
      {
        text: 'Organizing Loaders',
        link: '/data-loaders/organization',
      },
      {
        text: 'Nested Loaders',
        link: '/data-loaders/nested-loaders',
      },
      {
        text: 'Cancelling a load',
        link: '/data-loaders/load-cancellation',
      },
      {
        text: 'Nuxt',
        link: '/data-loaders/nuxt',
      },
      {
        text: 'SSR',
        link: '/data-loaders/ssr',
      },

      // loaders
      {
        text: 'Basic Loader',
        link: '/data-loaders/basic/',
      },
      {
        text: 'Colada Loader',
        link: '/data-loaders/colada/',
      },

      // last
      {
        text: 'RFC',
        link: '/data-loaders/rfc',
      },
    ],
  }
}

function sidebarNuxt(): SidebarGroup {
  return {
    collapsed: false,
    text: 'Nuxt',
    items: [
      {
        text: 'Getting Started',
        link: '/nuxt/getting-started',
      },
    ],
  }
}
