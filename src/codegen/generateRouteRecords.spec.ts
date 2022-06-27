import { describe, expect, it } from 'vitest'
import { createPrefixTree } from '../core/tree'
import { DEFAULT_OPTIONS } from '../options'
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
})
