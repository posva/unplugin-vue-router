import { describe, expect, it } from 'vitest'
import { generateRouteNamedMap } from './generateRouteMap'
import { createPrefixTree } from './tree'

describe('toRouteRecordSTring', () => {
  it('works with some paths at root', () => {
    const tree = createPrefixTree()
    tree.insert('a.vue')
    tree.insert('b.vue')
    tree.insert('c.vue')
    expect(
      generateRouteNamedMap(tree)
        .split('\n')
        .filter((line) => line)
        .join('\n')
    ).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/a': RouteRecordInfo<'/a', '/a'>,
        '/b': RouteRecordInfo<'/b', '/b'>,
        '/c': RouteRecordInfo<'/c', '/c'>,
      }"
    `)
  })

  it('nested children', () => {
    const tree = createPrefixTree()
    tree.insert('a/a.vue')
    tree.insert('a/b.vue')
    tree.insert('a/c.vue')
    tree.insert('b/b.vue')
    tree.insert('b/c.vue')
    tree.insert('b/d.vue')
    tree.insert('c.vue')
    tree.insert('d.vue')
    expect(
      generateRouteNamedMap(tree)
        .split('\n')
        .filter((line) => line)
        .join('\n')
    ).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/a/a': RouteRecordInfo<'/a/a', '/a/a'>,
        '/a/b': RouteRecordInfo<'/a/b', '/a/b'>,
        '/a/c': RouteRecordInfo<'/a/c', '/a/c'>,
        '/b/b': RouteRecordInfo<'/b/b', '/b/b'>,
        '/b/c': RouteRecordInfo<'/b/c', '/b/c'>,
        '/b/d': RouteRecordInfo<'/b/d', '/b/d'>,
        '/c': RouteRecordInfo<'/c', '/c'>,
        '/d': RouteRecordInfo<'/d', '/d'>,
      }"
    `)
  })

  // it('adds children and name when folder and component exist', () => {
  //   const t1 = createPrefixTree()
  //   t1.insert('a/c.vue')
  //   t1.insert('b/c.vue')
  //   t1.insert('a.vue')
  //   t1.insert('d.vue')
  //   expect(t1.toRouteRecordString()).toMatchSnapshot()
  // })
})
