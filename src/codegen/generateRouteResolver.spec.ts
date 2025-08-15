import { beforeEach, describe, expect, it } from 'vitest'
import { PrefixTree } from '../core/tree'
import { resolveOptions } from '../options'
import {
  generateRouteResolver,
  generateRouteRecord,
  generateRouteRecordPath,
} from './generateRouteResolver'
import { ImportsMap } from '../core/utils'
import { ParamParsersMap } from './generateParamParsers'

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

describe('generateRouteRecordPath', () => {
  let importsMap!: ImportsMap
  beforeEach(() => {
    importsMap = new ImportsMap()
  })

  it('generates static paths', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    expect(
      generateRouteRecordPath({ importsMap, node, paramParsersMap: new Map() })
    ).toBe(`path: new MatcherPatternPathStatic('/a'),`)
  })

  it('works with multiple segments', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a/b/c', 'a/b/c.vue')
    expect(
      generateRouteRecordPath({ importsMap, node, paramParsersMap: new Map() })
    ).toBe(`path: new MatcherPatternPathStatic('/a/b/c'),`)
  })

  // TODO: we need to figure out an option for this
  it.todo('keeps trailing slashes', () => {
    // currently, the `a/` gets converted to `a` in the tree (which is expected)
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a/', 'a.vue')
    expect(
      generateRouteRecordPath({ importsMap, node, paramParsersMap: new Map() })
    ).toBe(`path: new MatcherPatternPathStatic('/a/'),`)
  })

  it('generates paths with params', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a/[b]', 'a.vue')
    expect(
      generateRouteRecordPath({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "path: new MatcherPatternPathCustomParams(
          /^\\/a\\/([^/]+)$/i,
          {
            b: {},
          },
          ["a",0],
        ),"
    `)
  })

  it('works with multiple params', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a/[b]/[c]', 'a.vue')
    expect(
      generateRouteRecordPath({
        importsMap,
        node,
        paramParsersMap: new Map(),
      })
    ).toMatchInlineSnapshot(`
      "path: new MatcherPatternPathCustomParams(
          /^\\/a\\/([^/]+)\\/([^/]+)$/i,
          {
            b: {},
            c: {},
          },
          ["a",0,0],
        ),"
    `)
  })

  it('works with optional params', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a/[[b]]', 'a.vue')
    expect(
      generateRouteRecordPath({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "path: new MatcherPatternPathCustomParams(
          /^\\/a\\/([^/]+)?$/i,
          {
            b: {},
          },
          ["a",0],
        ),"
    `)
  })

  it('works with repeatable params', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a/[b]+', 'a.vue')
    expect(
      generateRouteRecordPath({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "path: new MatcherPatternPathCustomParams(
          /^\\/a\\/(.+?)$/i,
          {
            b: {repeat: true, },
          },
          ["a",0],
        ),"
    `)
  })

  it('works with repeatable optional params', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a/[[b]]+', 'a.vue')
    expect(
      generateRouteRecordPath({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "path: new MatcherPatternPathCustomParams(
          /^\\/a\\/(.+?)?$/i,
          {
            b: {repeat: true, },
          },
          ["a",0],
        ),"
    `)
  })

  it('works with segments', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert(
      'a/a-[b]-c-[d]',
      'a.vue'
    )
    expect(
      generateRouteRecordPath({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "path: new MatcherPatternPathCustomParams(
          /^\\/a\\/a-([^/]+)-c-([^/]+)$/i,
          {
            b: {},
            d: {},
          },
          ["a",["a-",0,"-c-",0]],
        ),"
    `)
  })
})

describe('generateRouteRecord', () => {
  it('serializes a simple static path', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const importsMap = new ImportsMap()
    const paramParsersMap: ParamParsersMap = new Map()
    expect(
      generateRouteRecord({
        node: tree.insert('a', 'a.vue'),
        parentVar: null,
        state: DEFAULT_STATE,
        options: DEFAULT_OPTIONS,
        importsMap,
        paramParsersMap,
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
        paramParsersMap,
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
    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      importsMap,
      new Map()
    )

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
        r_0,  // /a
        r_2,  // /b/c
        r_3,  // /b/c/d
        r_5,  // /b/e/f
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
    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      importsMap,
      new Map()
    )

    expect(resolver.replace(/^.*?createStaticResolver/s, ''))
      .toMatchInlineSnapshot(`
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

  it.todo('strips off empty parent records')
})
