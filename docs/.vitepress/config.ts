import { DefaultTheme, defineConfig } from 'vitepress'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { version } from '../package.json'
import {
  headTitle,
  headDescription,
  ogUrl,
  ogImage,
  twitter,
  github,
  releases,
  contributing,
  discord,
} from './meta'

export default defineConfig({
  markdown: {
    codeTransformers: [transformerTwoslash()],
  },

  title: headTitle,
  description: headDescription,

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
    ['meta', { property: 'og:url', content: ogUrl }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { name: 'twitter:title', content: headTitle }],
    ['meta', { name: 'twitter:description', content: headDescription }],
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
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/', activeMatch: '^/api/' },
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
        text: 'Quick Start',
        link: '/quick-start',
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
        text: 'File-based Routing',
        link: '/guide/file-based-routing',
      },
      {
        text: 'Typed routes',
        link: '/guide/typed-routes',
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
