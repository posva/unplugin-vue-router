import { describe, expect, it } from 'vitest'
import { generateRouteNamedMap } from './generateRouteMap'
import { createPrefixTree } from '../core/tree'
import { DEFAULT_OPTIONS } from '../options'

function formatExports(exports: string) {
  return exports
    .split('\n')
    .filter((line) => line.length > 0)
    .join('\n')
}

describe('generateRouteNamedMap', () => {
  it('works with some paths at root', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('a.vue')
    tree.insert('b.vue')
    tree.insert('c.vue')
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        'A': RouteRecordInfo<'A', '/a', Record<never, never>, Record<never, never>>,
        'B': RouteRecordInfo<'B', '/b', Record<never, never>, Record<never, never>>,
        'C': RouteRecordInfo<'C', '/c', Record<never, never>, Record<never, never>>,
      }"
    `)
  })

  it('adds params', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('[a].vue')
    tree.insert('partial-[a].vue')
    tree.insert('[[a]].vue') // optional
    tree.insert('partial-[[a]].vue') // partial-optional
    tree.insert('[a]+.vue') // repeated
    tree.insert('[[a]]+.vue') // optional repeated
    tree.insert('[...a].vue') // splat
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '$a': RouteRecordInfo<'$a', '/:a', { a: _ParamValue<true> }, { a: _ParamValue<false> }>,
        'Partial$a': RouteRecordInfo<'Partial$a', '/partial-:a', { a: _ParamValue<true> }, { a: _ParamValue<false> }>,
        '$a?': RouteRecordInfo<'$a?', '/:a?', { a?: _ParamValueZeroOrOne<true> }, { a?: _ParamValueZeroOrOne<false> }>,
        'Partial$a?': RouteRecordInfo<'Partial$a?', '/partial-:a?', { a?: _ParamValueZeroOrOne<true> }, { a?: _ParamValueZeroOrOne<false> }>,
        '$a+': RouteRecordInfo<'$a+', '/:a+', { a: _ParamValueOneOrMore<true> }, { a: _ParamValueOneOrMore<false> }>,
        '$a*': RouteRecordInfo<'$a*', '/:a*', { a?: _ParamValueZeroOrMore<true> }, { a?: _ParamValueZeroOrMore<false> }>,
        '$$a': RouteRecordInfo<'$$a', '/:a(.*)', { a: _ParamValue<true> }, { a: _ParamValue<false> }>,
      }"
    `)
  })

  it('adds nested params', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('n/[a].vue') // normal
    // tree.insert('n/partial-[a].vue') // partial
    tree.insert('n/[[a]].vue') // optional
    tree.insert('n/[a]+.vue') // repeated
    tree.insert('n/[[a]]+.vue') // optional repeated
    tree.insert('n/[...a].vue') // splat
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        'N$a': RouteRecordInfo<'N$a', '/n/:a', { a: _ParamValue<true> }, { a: _ParamValue<false> }>,
        'N$a?': RouteRecordInfo<'N$a?', '/n/:a?', { a?: _ParamValueZeroOrOne<true> }, { a?: _ParamValueZeroOrOne<false> }>,
        'N$a+': RouteRecordInfo<'N$a+', '/n/:a+', { a: _ParamValueOneOrMore<true> }, { a: _ParamValueOneOrMore<false> }>,
        'N$a*': RouteRecordInfo<'N$a*', '/n/:a*', { a?: _ParamValueZeroOrMore<true> }, { a?: _ParamValueZeroOrMore<false> }>,
        'N$$a': RouteRecordInfo<'N$$a', '/n/:a(.*)', { a: _ParamValue<true> }, { a: _ParamValue<false> }>,
      }"
    `)
  })

  it('nested children', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
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
        'AA': RouteRecordInfo<'AA', '/a/a', Record<never, never>, Record<never, never>>,
        'AB': RouteRecordInfo<'AB', '/a/b', Record<never, never>, Record<never, never>>,
        'AC': RouteRecordInfo<'AC', '/a/c', Record<never, never>, Record<never, never>>,
        'BB': RouteRecordInfo<'BB', '/b/b', Record<never, never>, Record<never, never>>,
        'BC': RouteRecordInfo<'BC', '/b/c', Record<never, never>, Record<never, never>>,
        'BD': RouteRecordInfo<'BD', '/b/d', Record<never, never>, Record<never, never>>,
        'C': RouteRecordInfo<'C', '/c', Record<never, never>, Record<never, never>>,
        'D': RouteRecordInfo<'D', '/d', Record<never, never>, Record<never, never>>,
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
