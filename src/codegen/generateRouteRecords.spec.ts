import { describe, expect, it } from 'vitest'
import { createPrefixTree } from '../core/tree'
import { DEFAULT_OPTIONS } from '../options'
import { RouteRecordRaw } from 'vue-router'
import { generateRouteRecord } from './generateRouteRecords'

describe('generateRouteRecord', () => {
  it('works with an empty tree', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)

    expect(generateRouteRecord(tree)).toMatchInlineSnapshot(`
      "[

      ]"
    `)
  })

  it('works with some paths at root', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('a.vue')
    tree.insert('b.vue')
    tree.insert('c.vue')
    expect(generateRouteRecord(tree)).toMatchSnapshot()
  })

  it('handles multiple named views', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('foo.vue')
    tree.insert('foo@a.vue')
    tree.insert('foo@b.vue')
    expect(generateRouteRecord(tree)).toMatchSnapshot()
  })

  it('handles single named views', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('foo@a.vue')
    expect(generateRouteRecord(tree)).toMatchSnapshot()
  })

  it('nested children', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('a/a.vue')
    tree.insert('a/b.vue')
    tree.insert('a/c.vue')
    tree.insert('b/b.vue')
    tree.insert('b/c.vue')
    tree.insert('b/d.vue')
    expect(generateRouteRecord(tree)).toMatchSnapshot()
    tree.insert('c.vue')
    tree.insert('d.vue')
    expect(generateRouteRecord(tree)).toMatchSnapshot()
  })

  it('adds children and name when folder and component exist', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('a/c.vue')
    tree.insert('b/c.vue')
    tree.insert('a.vue')
    tree.insert('d.vue')
    expect(generateRouteRecord(tree)).toMatchSnapshot()
  })

  it('correctly names index.vue files', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('index.vue')
    tree.insert('b/index.vue')
    expect(generateRouteRecord(tree)).toMatchSnapshot()
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
    expect(generateRouteRecord(tree)).toMatchSnapshot()
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

      expect(generateRouteRecord(tree)).toMatchSnapshot()
    })

    it('creates multi word names', () => {
      const tree = createPrefixTree(DEFAULT_OPTIONS)
      tree.insert('index.vue')
      tree.insert('my-users.vue')
      tree.insert('MyPascalCaseUsers.vue')
      tree.insert('some-nested/file-with-[id]-in-the-middle.vue')

      expect(generateRouteRecord(tree)).toMatchSnapshot()
    })

    it('works with nested views', () => {
      const tree = createPrefixTree(DEFAULT_OPTIONS)
      tree.insert('index.vue')
      tree.insert('users.vue')
      tree.insert('users/index.vue')
      tree.insert('users/[id]/edit.vue')
      tree.insert('users/[id].vue')

      expect(generateRouteRecord(tree)).toMatchSnapshot()
    })
  })

  it('adds meta data', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    const node = tree.insert('index.vue')
    node.mergeCustomRouteBlock({
      meta: {
        auth: true,
        title: 'Home',
      },
    })

    expect(generateRouteRecord(tree)).toMatchSnapshot()
  })
})
