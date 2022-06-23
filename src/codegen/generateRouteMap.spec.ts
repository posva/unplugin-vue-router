import { describe, expect, it } from 'vitest'
import { generateRouteNamedMap } from './generateRouteMap'
import { createPrefixTree } from '../core/tree'

function formatExports(exports: string) {
  return exports
    .split('\n')
    .filter((line) => line.length > 0)
    .join('\n')
}

describe('toRouteRecordSTring', () => {
  it('works with some paths at root', () => {
    const tree = createPrefixTree()
    tree.insert('a.vue')
    tree.insert('b.vue')
    tree.insert('c.vue')
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/a': RouteRecordInfo<'/a', '/a', Record<any, never>, Record<any, never>>,
        '/b': RouteRecordInfo<'/b', '/b', Record<any, never>, Record<any, never>>,
        '/c': RouteRecordInfo<'/c', '/c', Record<any, never>, Record<any, never>>,
      }"
    `)
  })

  it('adds params', () => {
    const tree = createPrefixTree()
    tree.insert('[a].vue')
    tree.insert('nested/[a].vue')
    tree.insert('partial-[a].vue')
    tree.insert('n/[a]?.vue')
    tree.insert('n/[a]*.vue')
    tree.insert('n/[a]+.vue')
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/[a]': RouteRecordInfo<'/[a]', '/:a', { a: _ParamValue<true> }, { a: _ParamValue<false> }>,
        '/nested/[a]': RouteRecordInfo<'/nested/[a]', '/nested/:a', { a: _ParamValue<true> }, { a: _ParamValue<false> }>,
        '/partial-[a]': RouteRecordInfo<'/partial-[a]', '/partial-:a', { a: _ParamValue<true> }, { a: _ParamValue<false> }>,
        '/n/[a]?': RouteRecordInfo<'/n/[a]?', '/n/:a?', { a?: _ParamValueZeroOrOne<true> }, { a?: _ParamValueZeroOrOne<false> }>,
        '/n/[a]*': RouteRecordInfo<'/n/[a]*', '/n/:a*', { a?: _ParamValueZeroOrMore<true> }, { a?: _ParamValueZeroOrMore<false> }>,
        '/n/[a]+': RouteRecordInfo<'/n/[a]+', '/n/:a+', { a: _ParamValueOneOrMore<true> }, { a: _ParamValueOneOrMore<false> }>,
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
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/a/a': RouteRecordInfo<'/a/a', '/a/a', Record<any, never>, Record<any, never>>,
        '/a/b': RouteRecordInfo<'/a/b', '/a/b', Record<any, never>, Record<any, never>>,
        '/a/c': RouteRecordInfo<'/a/c', '/a/c', Record<any, never>, Record<any, never>>,
        '/b/b': RouteRecordInfo<'/b/b', '/b/b', Record<any, never>, Record<any, never>>,
        '/b/c': RouteRecordInfo<'/b/c', '/b/c', Record<any, never>, Record<any, never>>,
        '/b/d': RouteRecordInfo<'/b/d', '/b/d', Record<any, never>, Record<any, never>>,
        '/c': RouteRecordInfo<'/c', '/c', Record<any, never>, Record<any, never>>,
        '/d': RouteRecordInfo<'/d', '/d', Record<any, never>, Record<any, never>>,
      }"
    `)
  })
})
