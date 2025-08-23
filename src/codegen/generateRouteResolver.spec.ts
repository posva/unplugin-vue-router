import { beforeEach, describe, expect, it } from 'vitest'
import { PrefixTree } from '../core/tree'
import { resolveOptions } from '../options'
import {
  generateRouteResolver,
  generateRouteRecord,
  generateRouteRecordPath,
  generateRouteRecordQuery,
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
      "path: new MatcherPatternPathDynamic(
          /^\\/a\\/([^/]+?)$/i,
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
      "path: new MatcherPatternPathDynamic(
          /^\\/a\\/([^/]+?)\\/([^/]+?)$/i,
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
      "path: new MatcherPatternPathDynamic(
          /^\\/a\\/([^/]+?)?$/i,
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
      "path: new MatcherPatternPathDynamic(
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
      "path: new MatcherPatternPathDynamic(
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
      "path: new MatcherPatternPathDynamic(
          /^\\/a\\/a-([^/]+?)-c-([^/]+?)$/i,
          {
            b: {},
            d: {},
          },
          ["a",["a-",0,"-c-",0]],
        ),"
    `)
  })

  it('works with a catch all route', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert(
      '[...all]',
      '[...all].vue'
    )
    expect(
      generateRouteRecordPath({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "path: new MatcherPatternPathDynamic(
          /^\\/(.*)$/i,
          {
            all: {},
          },
          [1],
        ),"
    `)
  })

  it('works with a splat param with a prefix', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert(
      'a/some-[id]/[...all]',
      'a/some-[id]/[...all].vue'
    )
    expect(
      generateRouteRecordPath({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "path: new MatcherPatternPathDynamic(
          /^\\/a\\/some-([^/]+?)\\/(.*)$/i,
          {
            id: {},
            all: {},
          },
          ["a",["some-",0],1],
        ),"
    `)
  })
})

describe('generateRouteRecordQuery', () => {
  let importsMap!: ImportsMap
  beforeEach(() => {
    importsMap = new ImportsMap()
  })

  it('returns empty string for non-matchable nodes without query params', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const node = tree.insert('a/b', 'a/b.vue').parent! // non-matchable parent
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toBe('')
  })

  it('generates query params for non-matchable nodes when they have query params', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const node = tree.insert('a/b', 'a/b.vue').parent! // non-matchable parent
    // Add query params to the non-matchable parent
    node.value.setEditOverride('params', {
      query: { search: {} },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('search', 'search', 'value')
        ],"
    `)
  })

  it('does not includes query params from parent nodes', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const parentNode = tree.insert('parent', 'parent.vue')
    const childNode = tree.insert('parent/child', 'parent/child.vue')

    // Add query params to parent
    parentNode.value.setEditOverride('params', {
      query: {
        parentParam: {},
      },
    })

    // Add query params to child
    childNode.value.setEditOverride('params', {
      query: {
        childParam: { parser: 'int' },
      },
    })

    expect(
      generateRouteRecordQuery({
        importsMap,
        node: childNode,
        paramParsersMap: new Map(),
      })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('childParam', 'childParam', 'value', PARAM_PARSER_INT)
        ],"
    `)
  })

  it('returns empty string when no query params', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toBe('')
  })

  it('generates query property with single query param', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    // Mock the queryParams getter
    node.value.setEditOverride('params', {
      query: { search: {} },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('search', 'search', 'value')
        ],"
    `)
  })

  it('generates query property with multiple query params', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: {
        search: {},
        page: { parser: 'int' },
        active: { parser: 'bool' },
      },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('search', 'search', 'value'),
          new MatcherPatternQueryParam('page', 'page', 'value', PARAM_PARSER_INT),
          new MatcherPatternQueryParam('active', 'active', 'value')
        ],"
    `)
  })

  it('adds MatcherPatternQueryParam import', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: { search: {} },
    })

    generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })

    expect(importsMap.toString()).toContain(
      "import { MatcherPatternQueryParam } from 'vue-router/experimental'"
    )
  })

  it('generates query param with format value', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: { search: { format: 'value' } },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('search', 'search', 'value')
        ],"
    `)
  })

  it('generates query param with format array', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: { tags: { format: 'array' } },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('tags', 'tags', 'array')
        ],"
    `)
  })

  it('generates query param with default value', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: { limit: { default: '10' } },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('limit', 'limit', 'value', {}, 10)
        ],"
    `)
  })

  it('generates query param with format and default value', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: { page: { parser: 'int', format: 'value', default: '1' } },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('page', 'page', 'value', PARAM_PARSER_INT, 1)
        ],"
    `)
  })

  it('generates mixed query params with different configurations', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: {
        q: { format: 'value' },
        tags: { format: 'array' },
        limit: { parser: 'int', default: '20' },
        active: { default: 'true' },
      },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('q', 'q', 'value'),
          new MatcherPatternQueryParam('tags', 'tags', 'array'),
          new MatcherPatternQueryParam('limit', 'limit', 'value', PARAM_PARSER_INT, 20),
          new MatcherPatternQueryParam('active', 'active', 'value', {}, true)
        ],"
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
        name: '/b/c',
        path: new MatcherPatternPathStatic('/b/c'),
        components: {
          'default': () => import('b/c.vue')
        },
      })
      const r_2 = normalizeRouteRecord({
        name: '/b/c/d',
        path: new MatcherPatternPathStatic('/b/c/d'),
        components: {
          'default': () => import('b/c/d.vue')
        },
        parent: r_1,
      })
      const r_3 = normalizeRouteRecord({
        name: '/b/e/f',
        path: new MatcherPatternPathStatic('/b/e/f'),
        components: {
          'default': () => import('b/c/f.vue')
        },
      })

      export const resolver = createFixedResolver([
        r_2,  // /b/c/d
        r_3,  // /b/e/f
        r_1,  // /b/c
        r_0,  // /a
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

    expect(resolver.replace(/^.*?createFixedResolver/s, ''))
      .toMatchInlineSnapshot(`
        "([
          r_10,  // /b/a-b
          r_6,   // /b/a-:a
          r_2,   // /b/:a
          r_7,   // /b/a-:a?
          r_3,   // /b/:a?
          r_9,   // /b/a-:a+
          r_5,   // /b/:a+
          r_8,   // /b/a-:a*
          r_4,   // /b/:a*
          r_1,   // /a
          r_0,   // /:all(.*)
        ])
        "
      `)
  })

  it('strips off empty parent records', () => {
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
        name: '/b/c',
        path: new MatcherPatternPathStatic('/b/c'),
        components: {
          'default': () => import('b/c.vue')
        },
      })
      const r_2 = normalizeRouteRecord({
        name: '/b/c/d',
        path: new MatcherPatternPathStatic('/b/c/d'),
        components: {
          'default': () => import('b/c/d.vue')
        },
        parent: r_1,
      })
      const r_3 = normalizeRouteRecord({
        name: '/b/e/f',
        path: new MatcherPatternPathStatic('/b/e/f'),
        components: {
          'default': () => import('b/c/f.vue')
        },
      })

      export const resolver = createFixedResolver([
        r_2,  // /b/c/d
        r_3,  // /b/e/f
        r_1,  // /b/c
        r_0,  // /a
      ])
      "
    `)
  })

  it('retains parent chain when skipping empty intermediate nodes', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    // Create a meaningful parent
    tree.insert('a', 'a.vue')
    // Create a deeply nested child with empty intermediate nodes b and c
    tree.insert('a/b/c/e', 'a/b/c/e.vue')
    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      new ImportsMap(),
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
        name: '/a/b/c/e',
        path: new MatcherPatternPathStatic('/a/b/c/e'),
        components: {
          'default': () => import('a/b/c/e.vue')
        },
        parent: r_0,
      })

      export const resolver = createFixedResolver([
        r_1,  // /a/b/c/e
        r_0,  // /a
      ])
      "
    `)
  })

  it('preserves parent nodes with meta data', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    // Create a nested route
    tree.insert('a/b/c', 'a/b/c.vue')
    // Add meta to the intermediate b node (no components, but has meta)
    const aNode = tree.children.get('a')!
    const bNode = aNode.children.get('b')!
    bNode.value.setEditOverride('meta', { requiresAuth: true })

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      new ImportsMap(),
      new Map()
    )

    expect(resolver).toMatchInlineSnapshot(`
      "
      const r_0 = normalizeRouteRecord({
        /* internal name: '/a/b' */
        meta: {
          "requiresAuth": true
        },
      })
      const r_1 = normalizeRouteRecord({
        name: '/a/b/c',
        path: new MatcherPatternPathStatic('/a/b/c'),
        components: {
          'default': () => import('a/b/c.vue')
        },
        parent: r_0,
      })

      export const resolver = createFixedResolver([
        r_1,  // /a/b/c
      ])
      "
    `)
  })

  it('includes meta in route records with components', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    // Create a route with both component and meta
    tree.insert('users', 'users.vue')
    const usersNode = tree.children.get('users')!
    usersNode.value.setEditOverride('meta', {
      requiresAuth: true,
      title: 'Users',
    })

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      new ImportsMap(),
      new Map()
    )

    expect(resolver).toMatchInlineSnapshot(`
      "
      const r_0 = normalizeRouteRecord({
        name: '/users',
        path: new MatcherPatternPathStatic('/users'),
        meta: {
          "requiresAuth": true,
          "title": "Users"
        },
        components: {
          'default': () => import('users.vue')
        },
      })

      export const resolver = createFixedResolver([
        r_0,  // /users
      ])
      "
    `)
  })

  it('handles definePage imports correctly', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    // Create a route with a component
    tree.insert('profile', 'profile.vue')
    const profileNode = tree.children.get('profile')!

    // Mark it as having definePage (this would normally be set by the plugin when parsing the file)
    profileNode.hasDefinePage = true

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      new ImportsMap(),
      new Map()
    )

    expect(resolver).toMatchInlineSnapshot(`
      "

      const r_0 = normalizeRouteRecord(
        _mergeRouteRecord(
          {
            name: '/profile',
            path: new MatcherPatternPathStatic('/profile'),
            components: {
              'default': () => import('profile.vue')
            },
          },
          _definePage_default_0
        )
      )


      export const resolver = createFixedResolver([
        r_0,  // /profile
      ])
      "
    `)
  })

  it('includes query property in route records with query params', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('search', 'search.vue')
    const searchNode = tree.children.get('search')!

    // Add query params
    searchNode.value.setEditOverride('params', {
      query: {
        q: {},
        limit: { parser: 'int' },
      },
    })

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      new ImportsMap(),
      new Map()
    )

    expect(resolver).toMatchInlineSnapshot(`
      "
      const r_0 = normalizeRouteRecord({
        name: '/search',
        path: new MatcherPatternPathStatic('/search'),
        query: [
          new MatcherPatternQueryParam('q', 'q', 'value'),
          new MatcherPatternQueryParam('limit', 'limit', 'value', PARAM_PARSER_INT)
        ],
        components: {
          'default': () => import('search.vue')
        },
      })

      export const resolver = createFixedResolver([
        r_0,  // /search
      ])
      "
    `)
  })
})

describe('route prioritization in resolver', () => {
  function getRouteOrderFromResolver(tree: PrefixTree): string[] {
    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      new ImportsMap(),
      new Map()
    )

    // Extract the order from the resolver output
    const lines = resolver.split('\n').filter((line) => line.includes('// /'))
    return lines.map((line) => line.split('// ')[1] || '')
  }

  it('prioritizes routes correctly in resolver output', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)

    // Create routes with different specificity levels
    tree.insert('static', 'static.vue')
    tree.insert('[id]', '[id].vue')
    tree.insert('[[optional]]', '[[optional]].vue')
    tree.insert('prefix-[id]-suffix', 'prefix-[id]-suffix.vue')
    tree.insert('[...all]', '[...all].vue')

    // Routes should be ordered from most specific to least specific
    expect(getRouteOrderFromResolver(tree)).toEqual([
      '/static', // static routes first
      '/prefix-:id-suffix', // mixed routes with static content
      '/:id', // pure parameter routes
      '/:optional?', // optional parameter routes
      '/:all(.*)', // catch-all routes last
    ])
  })

  it('handles nested route prioritization correctly', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)

    // Create nested routes with different patterns
    tree.insert('api/users', 'api/users.vue')
    tree.insert('api/[resource]', 'api/[resource].vue')
    tree.insert('prefix-[param]/static', 'prefix-[param]/static.vue')
    tree.insert('[dynamic]/static', '[dynamic]/static.vue')
    tree.insert('[x]/[y]', '[x]/[y].vue')

    // Routes with more static content should come first
    expect(getRouteOrderFromResolver(tree)).toEqual([
      '/api/users', // all static segments
      '/api/:resource', // static root, param child
      '/prefix-:param/static', // mixed root, static child
      '/:dynamic/static', // param root, static child
      '/:x/:y', // all param segments
    ])
  })

  it('orders complex mixed routes appropriately', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)

    // Create routes with various subsegment complexity
    tree.insert('users', 'users.vue') // pure static
    tree.insert('prefix-[id]', 'prefix-[id].vue') // prefix + param
    tree.insert('[id]-suffix', '[id]-suffix.vue') // param + suffix
    tree.insert('pre-[a]-mid-[b]-end', 'complex.vue') // complex mixed
    tree.insert('[a]-[b]', '[a]-[b].vue') // params with separator
    tree.insert('[param]', '[param].vue') // pure param

    expect(getRouteOrderFromResolver(tree)).toEqual([
      '/users', // pure static wins
      '/pre-:a-mid-:b-end', // most static content in mixed
      '/:id-suffix', // static suffix
      '/prefix-:id', // static prefix
      '/:a-:b', // params with static separator
      '/:param', // pure param last
    ])
  })

  it('handles optional and repeatable params in nested contexts', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)

    // Create nested routes with optional and repeatable params
    tree.insert('api/static', 'api/static.vue')
    tree.insert('api/[[optional]]', 'api/[[optional]].vue')
    tree.insert('api/[required]', 'api/[required].vue')
    tree.insert('api/[repeatable]+', 'api/[repeatable]+.vue')
    tree.insert('api/[[optional]]+', 'api/[[optional]]+.vue')
    tree.insert('api/[...catchall]', 'api/[...catchall].vue')

    expect(getRouteOrderFromResolver(tree)).toEqual([
      '/api/static', // static segment wins
      '/api/:required', // required param
      '/api/:optional?', // optional param
      '/api/:repeatable+', // repeatable param
      '/api/:optional*', // optional repeatable param
      '/api/:catchall(.*)', // catch-all last
    ])
  })

  it('handles catch all with prefix before generic param', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)

    tree.insert('api/v1/users', 'api/v1/users.vue')
    tree.insert('api/v1/[type]', 'api/v1/[type].vue')
    tree.insert('api/v1/[type]/c', 'api/v1/[type]/c.vue')
    tree.insert('api/v1/teams/[...id]', 'api/v1/teams/[...id].vue')

    expect(getRouteOrderFromResolver(tree)).toEqual([
      '/api/v1/users',
      '/api/v1/teams/:id(.*)',
      '/api/v1/:type/c',
      '/api/v1/:type',
    ])
  })

  it('handles complex subsegments in deeply nested routes', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)

    // Create deeply nested routes with complex subsegment patterns
    tree.insert('api/v1/users', 'api/v1/users.vue')
    tree.insert('api/v1/user-[id]', 'api/v1/user-[id].vue')
    tree.insert('api/v1/[type]/list', 'api/v1/[type]/list.vue')
    tree.insert('api/v1/[type]/[id]', 'api/v1/[type]/[id].vue')
    tree.insert('api/v1/prefix-[a]-mid-[b]', 'api/v1/prefix-[a]-mid-[b].vue')
    tree.insert('api/v1/[x]-[y]-[z]', 'api/v1/[x]-[y]-[z].vue')

    expect(getRouteOrderFromResolver(tree)).toEqual([
      '/api/v1/users', // all static segments
      '/api/v1/user-:id', // mixed with static prefix
      '/api/v1/prefix-:a-mid-:b', // complex mixed pattern
      '/api/v1/:x-:y-:z', // multiple params with separators (mixed subsegments rank higher)
      '/api/v1/:type/list', // param + static child
      '/api/v1/:type/:id', // all param segments
    ])
  })
})
