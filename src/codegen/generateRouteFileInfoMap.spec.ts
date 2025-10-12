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

  it('is consistely sorted', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('group', 'src/pages/group.vue')
    tree.insert('group/b', 'src/pages/group/b.vue')
    tree.insert('group/c', 'src/pages/c.vue')
    tree.insert('group/a', 'src/pages/a.vue')
    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
      "export interface _RouteFileInfoMap {
        'src/pages/group.vue': {
          routes:
            | '/group'
            | '/group/a'
            | '/group/b'
            | '/group/c'
          views:
            | 'default'
        }
        'src/pages/a.vue': {
          routes:
            | '/group/a'
          views:
            | never
        }
        'src/pages/group/b.vue': {
          routes:
            | '/group/b'
          views:
            | never
        }
        'src/pages/c.vue': {
          routes:
            | '/group/c'
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

  it('does not contain routes without components', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('optional/[[id]]', 'optional/[[id]].vue')
    tree.insert(
      'optional-repeatable/[[id]]+',
      'optional-repeatable/[[id]]+.vue'
    )
    tree.insert('repeatable/[id]+', 'repeatable/[id]+.vue')

    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
        "export interface _RouteFileInfoMap {
          'optional/[[id]].vue': {
            routes:
              | '/optional/[[id]]'
            views:
              | never
          }
          'optional-repeatable/[[id]]+.vue': {
            routes:
              | '/optional-repeatable/[[id]]+'
            views:
              | never
          }
          'repeatable/[id]+.vue': {
            routes:
              | '/repeatable/[id]+'
            views:
              | never
          }
        }"
      `)
  })

  it('does not contain nested routes without components', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('parent', 'parent.vue')
    tree.insert('parent/optional/[[id]]', 'parent/optional/[[id]].vue')
    tree.insert(
      'parent/optional-repeatable/[[id]]+',
      'parent/optional-repeatable/[[id]]+.vue'
    )
    tree.insert('parent/repeatable/[id]+', 'parent/repeatable/[id]+.vue')

    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
        "export interface _RouteFileInfoMap {
          'parent.vue': {
            routes:
              | '/parent'
              | '/parent/optional/[[id]]'
              | '/parent/optional-repeatable/[[id]]+'
              | '/parent/repeatable/[id]+'
            views:
              | 'default'
          }
          'parent/optional/[[id]].vue': {
            routes:
              | '/parent/optional/[[id]]'
            views:
              | never
          }
          'parent/optional-repeatable/[[id]]+.vue': {
            routes:
              | '/parent/optional-repeatable/[[id]]+'
            views:
              | never
          }
          'parent/repeatable/[id]+.vue': {
            routes:
              | '/parent/repeatable/[id]+'
            views:
              | never
          }
        }"
      `)
  })
})
