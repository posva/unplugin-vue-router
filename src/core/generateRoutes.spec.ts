import { describe, expect, it } from 'vitest'
import { createPrefixTree } from './tree'

describe('toRouteRecordSTring', () => {
  it('works with an empty tree', () => {
    const tree = createPrefixTree()
    expect(tree.toRouteRecordString()).toMatchInlineSnapshot(`
      "[

      ]"
    `)
  })

  it('works with some paths at root', () => {
    const tree = createPrefixTree()
    tree.insert('a.vue')
    tree.insert('b.vue')
    tree.insert('c.vue')
    expect(tree.toRouteRecordString()).toMatchSnapshot()
  })

  it('nested children', () => {
    const t1 = createPrefixTree()
    t1.insert('a/a.vue')
    t1.insert('a/b.vue')
    t1.insert('a/c.vue')
    t1.insert('b/b.vue')
    t1.insert('b/c.vue')
    t1.insert('b/d.vue')
    expect(t1.toRouteRecordString()).toMatchSnapshot()
    t1.insert('c.vue')
    t1.insert('d.vue')
    expect(t1.toRouteRecordString()).toMatchSnapshot()
  })

  it('adds children and name when folder and component exist', () => {
    const t1 = createPrefixTree()
    t1.insert('a/c.vue')
    t1.insert('b/c.vue')
    t1.insert('a.vue')
    t1.insert('d.vue')
    expect(t1.toRouteRecordString()).toMatchSnapshot()
  })
})
