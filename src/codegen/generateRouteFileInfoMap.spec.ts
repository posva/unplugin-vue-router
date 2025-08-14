import { describe, expect, it } from 'vitest'
import { generateRouteFileInfoMap } from './generateRouteFileInfoMap'
import { PrefixTree } from '../core/tree'
import { resolveOptions } from '../options'

const DEFAULT_OPTIONS = resolveOptions({})

function formatExports(exports: string) {
  return exports
    .split('\n')
    .filter((line) => line.length > 0)
    .join('\n')
}

describe('generateRouteFileInfoMap', () => {
  it('works with some paths at root', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('index', 'src/pages/index.vue')
    tree.insert('a', 'src/pages/a.vue')
    tree.insert('b', 'src/pages/b.vue')
    tree.insert('c', 'src/pages/c.vue')
    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
        "export interface _RouteFileInfoMap {
          'src/pages/index.vue': {
            routes:
              | '/'
            views:
              | never
          }
          'src/pages/a.vue': {
            routes:
              | '/a'
            views:
              | never
          }
          'src/pages/b.vue': {
            routes:
              | '/b'
            views:
              | never
          }
          'src/pages/c.vue': {
            routes:
              | '/c'
            views:
              | never
          }
        }"
      `)
  })

  it('works with children', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('parent', 'src/pages/parent.vue')
    tree.insert('parent/child', 'src/pages/parent/child.vue')
    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
        "export interface _RouteFileInfoMap {
          'src/pages/parent.vue': {
            routes:
              | '/parent'
              | '/parent/child'
            views:
              | 'default'
          }
          'src/pages/parent/child.vue': {
            routes:
              | '/parent/child'
            views:
              | never
          }
        }"
      `)
  })

  it('works with named views', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('parent', 'src/pages/parent.vue')
    tree.insert('parent/child', 'src/pages/parent/child.vue')
    tree.insert('parent/child@test', 'src/pages/parent/child@test.vue')
    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
        "export interface _RouteFileInfoMap {
          'src/pages/parent.vue': {
            routes:
              | '/parent'
              | '/parent/child'
            views:
              | 'default'
              | 'test'
          }
          'src/pages/parent/child.vue': {
            routes:
              | '/parent/child'
            views:
              | never
          }
          'src/pages/parent/child@test.vue': {
            routes:
              | '/parent/child'
            views:
              | never
          }
        }"
      `)
  })

  it('can reuse a component in different routes', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    // same component, two different routes (different from an alias)
    tree.insert('', 'index.vue')
    tree.insert('home', 'index.vue')

    tree.insert('nested/path', 'nested/index.vue')
    tree.insert('unnested', 'nested/index.vue')

    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
        "export interface _RouteFileInfoMap {
          'index.vue': {
            routes:
              | '/'
              | '/home'
            views:
              | never
          }
          'nested/index.vue': {
            routes:
              | '/nested/path'
              | '/unnested'
            views:
              | never
          }
        }"
      `)
  })
})
