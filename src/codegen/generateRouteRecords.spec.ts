import { basename } from 'pathe'
import { describe, expect, it } from 'vitest'
import { createPrefixTree, TreeNode } from '../core/tree'
import { ResolvedOptions, resolveOptions } from '../options'
import { generateRouteRecord } from './generateRouteRecords'

const DEFAULT_OPTIONS = resolveOptions({})

describe('generateRouteRecord', () => {
  function generateRouteRecordSimple(tree: TreeNode) {
    return generateRouteRecord(tree, DEFAULT_OPTIONS, new Map())
  }

  it('works with an empty tree', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)

    expect(generateRouteRecordSimple(tree)).toMatchInlineSnapshot(`
      "[

      ]"
    `)
  })

  it('works with some paths at root', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('a.vue')
    tree.insert('b.vue')
    tree.insert('c.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('handles multiple named views', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('foo.vue')
    tree.insert('foo@a.vue')
    tree.insert('foo@b.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('handles single named views', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('foo@a.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('nested children', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('a/a.vue')
    tree.insert('a/b.vue')
    tree.insert('a/c.vue')
    tree.insert('b/b.vue')
    tree.insert('b/c.vue')
    tree.insert('b/d.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    tree.insert('c.vue')
    tree.insert('d.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('adds children and name when folder and component exist', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('a/c.vue')
    tree.insert('b/c.vue')
    tree.insert('a.vue')
    tree.insert('d.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('correctly names index.vue files', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('index.vue')
    tree.insert('b/index.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('handles non nested routes', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('users.vue')
    tree.insert('users/index.vue')
    tree.insert('users/other.vue')
    tree.insert('users.not-nested.vue')
    tree.insert('users/[id]/index.vue')
    tree.insert('users/[id]/other.vue')
    tree.insert('users/[id].vue')
    tree.insert('users/[id].not-nested.vue')
    tree.insert('users.[id].also-not-nested.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('generate static imports', () => {
    const options: ResolvedOptions = {
      ...DEFAULT_OPTIONS,
      importMode: 'sync',
    } as const
    const tree = createPrefixTree(options)
    tree.insert('a.vue')
    tree.insert('b.vue')
    tree.insert('nested/file/c.vue')
    const importList = new Map<string, string>()
    expect(generateRouteRecord(tree, options, importList)).toMatchSnapshot()

    expect(importList).toMatchSnapshot()
  })

  it('generate custom imports', () => {
    const options: ResolvedOptions = {
      ...DEFAULT_OPTIONS,
      importMode: (filepath) =>
        basename(filepath) === 'a.vue' ? 'sync' : 'async',
    }

    const tree = createPrefixTree(options)
    tree.insert('a.vue')
    tree.insert('b.vue')
    tree.insert('nested/file/c.vue')
    const importList = new Map<string, string>()
    expect(generateRouteRecord(tree, options, importList)).toMatchSnapshot()

    expect(importList).toMatchSnapshot()
  })

  describe('names', () => {
    it('creates single word names', () => {
      const tree = createPrefixTree(DEFAULT_OPTIONS)
      tree.insert('index.vue')
      tree.insert('about.vue')
      tree.insert('users/index.vue')
      tree.insert('users/[id].vue')
      tree.insert('users/[id]/edit.vue')
      tree.insert('users/new.vue')

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('creates multi word names', () => {
      const tree = createPrefixTree(DEFAULT_OPTIONS)
      tree.insert('index.vue')
      tree.insert('my-users.vue')
      tree.insert('MyPascalCaseUsers.vue')
      tree.insert('some-nested/file-with-[id]-in-the-middle.vue')

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('works with nested views', () => {
      const tree = createPrefixTree(DEFAULT_OPTIONS)
      tree.insert('index.vue')
      tree.insert('users.vue')
      tree.insert('users/index.vue')
      tree.insert('users/[id]/edit.vue')
      tree.insert('users/[id].vue')

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })
  })

  describe('route block', () => {
    it('adds meta data', async () => {
      const tree = createPrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('index.vue')
      node.setCustomRouteBlock('index.vue', {
        meta: {
          auth: true,
          title: 'Home',
        },
      })

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('merges multiple meta properties', async () => {
      const tree = createPrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('index.vue')
      node.setCustomRouteBlock('index.vue', {
        path: '/custom',
        meta: {
          one: true,
        },
      })
      node.setCustomRouteBlock('index@named.vue', {
        name: 'hello',
        meta: {
          two: true,
        },
      })

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('merges regardless of order', async () => {
      const tree = createPrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('index.vue')
      node.setCustomRouteBlock('index.vue', {
        name: 'a',
      })
      node.setCustomRouteBlock('index@named.vue', {
        name: 'b',
      })

      const one = generateRouteRecordSimple(tree)

      node.setCustomRouteBlock('index@named.vue', {
        name: 'b',
      })
      node.setCustomRouteBlock('index.vue', {
        name: 'a',
      })

      expect(generateRouteRecordSimple(tree)).toBe(one)

      expect(one).toMatchSnapshot()
    })

    it('handles named views with empty route blocks', () => {
      const tree = createPrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('index.vue')
      const n2 = tree.insert('index@named.vue')
      expect(node).toBe(n2)
      // coming from index.vue
      node.setCustomRouteBlock('index.vue', {
        meta: {
          auth: true,
          title: 'Home',
        },
      })
      // coming from index@named.vue (no route block)
      node.setCustomRouteBlock('index@named.vue', undefined)

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    // FIXME: allow aliases
    it.todo('merges alias properties', async () => {
      const tree = createPrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('index.vue')
      node.setCustomRouteBlock('index.vue', {
        alias: '/one',
      })
      node.setCustomRouteBlock('index@named.vue', {
        alias: ['/two', '/three'],
      })

      expect(generateRouteRecordSimple(tree)).toMatchInlineSnapshot(`
        "[
          {
            path: '/',
            name: '/',
            component: () => import('index.vue'),
            /* no props */
            /* no children */
          }
        ]"
      `)
    })

    it('merges deep meta properties', async () => {
      const tree = createPrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('index.vue')
      node.setCustomRouteBlock('index.vue', {
        meta: {
          a: { one: 1 },
          b: { a: [2] },
        },
      })
      node.setCustomRouteBlock('index@named.vue', {
        meta: {
          a: { two: 1 },
          b: { a: [3] },
        },
      })

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })
  })
})
