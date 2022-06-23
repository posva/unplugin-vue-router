import { describe, expect, it } from 'vitest'
import { generateRouteNamedMap } from './generateRouteMap'
import { createPrefixTree } from '../core/tree'

function formatExports(exports: string) {
  return exports
    .split('\n')
    .filter((line) => line.length > 0)
    .join('\n')
}

describe('generateRouteNamedMap', () => {
  it('works with some paths at root', () => {
    const tree = createPrefixTree()
    tree.insert('a.vue')
    tree.insert('b.vue')
    tree.insert('c.vue')
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/a': RouteRecordInfo<'/a', '/a', Record<never, never>, Record<never, never>>,
        '/b': RouteRecordInfo<'/b', '/b', Record<never, never>, Record<never, never>>,
        '/c': RouteRecordInfo<'/c', '/c', Record<never, never>, Record<never, never>>,
      }"
    `)
  })

  it('adds params', () => {
    const tree = createPrefixTree()
    tree.insert('[a].vue')
    tree.insert('partial-[a].vue')
    tree.insert('[[a]].vue') // optional
    tree.insert('partial-[[a]].vue') // partial-optional
    tree.insert('[a]+.vue') // repeated
    tree.insert('[[a]]+.vue') // optional repeated
    tree.insert('[...a].vue') // splat
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/[a]': RouteRecordInfo<'/[a]', '/:a', { a: _ParamValue<true> }, { a: _ParamValue<false> }>,
        '/partial-[a]': RouteRecordInfo<'/partial-[a]', '/partial-:a', { a: _ParamValue<true> }, { a: _ParamValue<false> }>,
        '/[[a]]': RouteRecordInfo<'/[[a]]', '/:a?', { a?: _ParamValueZeroOrOne<true> }, { a?: _ParamValueZeroOrOne<false> }>,
        '/partial-[[a]]': RouteRecordInfo<'/partial-[[a]]', '/partial-:a?', { a?: _ParamValueZeroOrOne<true> }, { a?: _ParamValueZeroOrOne<false> }>,
        '/[a]+': RouteRecordInfo<'/[a]+', '/:a+', { a: _ParamValueOneOrMore<true> }, { a: _ParamValueOneOrMore<false> }>,
        '/[[a]]+': RouteRecordInfo<'/[[a]]+', '/:a*', { a?: _ParamValueZeroOrMore<true> }, { a?: _ParamValueZeroOrMore<false> }>,
        '/[...a]': RouteRecordInfo<'/[...a]', '/:a(.*)', { a: _ParamValue<true> }, { a: _ParamValue<false> }>,
      }"
    `)
  })

  it('adds nested params', () => {
    const tree = createPrefixTree()
    tree.insert('n/[a].vue') // normal
    // tree.insert('n/partial-[a].vue') // partial
    tree.insert('n/[[a]].vue') // optional
    tree.insert('n/[a]+.vue') // repeated
    tree.insert('n/[[a]]+.vue') // optional repeated
    tree.insert('n/[...a].vue') // splat
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/n/[a]': RouteRecordInfo<'/n/[a]', '/n/:a', { a: _ParamValue<true> }, { a: _ParamValue<false> }>,
        '/n/[[a]]': RouteRecordInfo<'/n/[[a]]', '/n/:a?', { a?: _ParamValueZeroOrOne<true> }, { a?: _ParamValueZeroOrOne<false> }>,
        '/n/[a]+': RouteRecordInfo<'/n/[a]+', '/n/:a+', { a: _ParamValueOneOrMore<true> }, { a: _ParamValueOneOrMore<false> }>,
        '/n/[[a]]+': RouteRecordInfo<'/n/[[a]]+', '/n/:a*', { a?: _ParamValueZeroOrMore<true> }, { a?: _ParamValueZeroOrMore<false> }>,
        '/n/[...a]': RouteRecordInfo<'/n/[...a]', '/n/:a(.*)', { a: _ParamValue<true> }, { a: _ParamValue<false> }>,
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
        '/a/a': RouteRecordInfo<'/a/a', '/a/a', Record<never, never>, Record<never, never>>,
        '/a/b': RouteRecordInfo<'/a/b', '/a/b', Record<never, never>, Record<never, never>>,
        '/a/c': RouteRecordInfo<'/a/c', '/a/c', Record<never, never>, Record<never, never>>,
        '/b/b': RouteRecordInfo<'/b/b', '/b/b', Record<never, never>, Record<never, never>>,
        '/b/c': RouteRecordInfo<'/b/c', '/b/c', Record<never, never>, Record<never, never>>,
        '/b/d': RouteRecordInfo<'/b/d', '/b/d', Record<never, never>, Record<never, never>>,
        '/c': RouteRecordInfo<'/c', '/c', Record<never, never>, Record<never, never>>,
        '/d': RouteRecordInfo<'/d', '/d', Record<never, never>, Record<never, never>>,
      }"
    `)
  })
})

/**
 * /static.vue -> /static
 * /static/[param].vue -> /static/:param
 * /static/pre-[param].vue -> /static/pre-:param
 * /static/pre-[param].vue -> /static/pre-:param
 * /static/pre-[[param]].vue -> /static/pre-:param?
 * /static/[...param].vue -> /static/:param(.*)
 * /static/...[param].vue -> /static/:param+
 * /static/...[[param]].vue -> /static/:param*
 * /static/...[[...param]].vue -> /static/:param(.*)*
 */
