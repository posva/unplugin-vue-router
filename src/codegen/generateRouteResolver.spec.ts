import { beforeEach, describe, expect, it } from 'vitest'
import { PrefixTree } from '../core/tree'
import { resolveOptions } from '../options'
import {
  generateRouteResolver,
  generateRouteRecord,
} from './generateRouteResolver'
import { ImportsMap } from '../core/utils'

const DEFAULT_OPTIONS = resolveOptions({})
let DEFAULT_STATE: Parameters<typeof generateRouteRecord>[0]['state'] = {
  id: 0,
  matchableRecords: [],
}

beforeEach(() => {
  DEFAULT_STATE = {
    id: 0,
    matchableRecords: [],
  }
})

describe('generateRouteRecord', () => {
  it('serializes a simple static path', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const importsMap = new ImportsMap()
    expect(
      generateRouteRecord({
        node: tree.insert('a', 'a.vue'),
        parentVar: null,
        state: DEFAULT_STATE,
        options: DEFAULT_OPTIONS,
        importsMap,
      })
    ).toMatchInlineSnapshot(`
      "const r_0 = normalizeRouteRecord({
        name: '/a',
        path: new MatcherPatternPathStatic('/a'),
        components: {
          'default': () => import('a.vue')
        },
      })"
    `)
    expect(
      generateRouteRecord({
        node: tree.insert('a/b/c', 'a/b/c.vue'),
        parentVar: null,
        state: DEFAULT_STATE,
        options: DEFAULT_OPTIONS,
        importsMap,
      })
    ).toMatchInlineSnapshot(`
      "const r_1 = normalizeRouteRecord({
        name: '/a/b/c',
        path: new MatcherPatternPathStatic('/a/b/c'),
        components: {
          'default': () => import('a/b/c.vue')
        },
      })"
    `)
  })
})

describe('generateRouteResolver', () => {
  it('generates a resolver for a simple tree', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const importsMap = new ImportsMap()
    tree.insert('a', 'a.vue')
    tree.insert('b/c', 'b/c.vue')
    tree.insert('b/c/d', 'b/c/d.vue')
    tree.insert('b/e/f', 'b/c/f.vue')
    const resolver = generateRouteResolver(tree, DEFAULT_OPTIONS, importsMap)

    expect(resolver).toMatchInlineSnapshot(`
      "
      const r_0 = normalizeRouteRecord({
        name: '/a',
        path: new MatcherPatternPathStatic('/a'),
        components: {
          'default': () => import('a.vue')
        },
      })

      const r_1 = normalizeRouteRecord({
        /* internal name: '/b' */
      })
      const r_2 = normalizeRouteRecord({
        name: '/b/c',
        path: new MatcherPatternPathStatic('/b/c'),
        components: {
          'default': () => import('b/c.vue')
        },
        parent: r_1,
      })
      const r_3 = normalizeRouteRecord({
        name: '/b/c/d',
        path: new MatcherPatternPathStatic('/b/c/d'),
        components: {
          'default': () => import('b/c/d.vue')
        },
        parent: r_2,
      })
      const r_4 = normalizeRouteRecord({
        /* internal name: '/b/e' */
        parent: r_1,
      })
      const r_5 = normalizeRouteRecord({
        name: '/b/e/f',
        path: new MatcherPatternPathStatic('/b/e/f'),
        components: {
          'default': () => import('b/c/f.vue')
        },
        parent: r_4,
      })

      export const resolver = createStaticResolver([
        r_0, /* /a */
        r_2, /* /b/c */
        r_3, /* /b/c/d */
        r_5, /* /b/e/f */
      ])
      "
    `)
  })

  it('orders records based on specificity of paths', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const importsMap = new ImportsMap()
    tree.insert('a', 'a.vue')
    tree.insert('b/a-b', 'b/c/d.vue')
    tree.insert('b/a-[a]', 'b/c/d.vue')
    tree.insert('b/a-[a]+', 'b/c/d.vue')
    tree.insert('b/a-[[a]]', 'b/c/d.vue')
    tree.insert('b/a-[[a]]+', 'b/c/d.vue')
    tree.insert('b/[a]', 'b/c.vue')
    tree.insert('b/[a]+', 'b/c/d.vue')
    tree.insert('b/[[a]]', 'b/c/d.vue')
    tree.insert('b/[[a]]+', 'b/c/d.vue')
    tree.insert('[...all]', 'b/c/f.vue')
    const resolver = generateRouteResolver(tree, DEFAULT_OPTIONS, importsMap)

    expect(
      resolver.replace(/^.*?createStaticResolver/s, '')
    ).toMatchInlineSnapshot(`
      "([
        r_1,   // /a
        r_11,  // /b/a-b
        r_7,   // /b/a-:a
        r_8,   // /b/a-:a?
        r_10,  // /b/a-:a+
        r_9,   // /b/a-:a*
        r_3,   // /b/:a
        r_4,   // /b/:a?
        r_6,   // /b/:a+
        r_5,   // /b/:a*
        r_0,   // /:all(.*)
      ])
      "
    `)
  })
})
