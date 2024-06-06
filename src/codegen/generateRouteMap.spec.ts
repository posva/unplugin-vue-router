import { describe, expect, it } from 'vitest'
import { generateRouteNamedMap } from './generateRouteMap'
import { PrefixTree } from '../core/tree'
import { resolveOptions } from '../options'
import { resolve } from 'pathe'

const DEFAULT_OPTIONS = resolveOptions({})

function formatExports(exports: string) {
  return exports
    .split('\n')
    .filter((line) => line.length > 0)
    .join('\n')
}

describe('generateRouteNamedMap', () => {
  it('works with some paths at root', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('index', 'index.vue')
    tree.insert('a', 'a.vue')
    tree.insert('b', 'b.vue')
    tree.insert('c', 'c.vue')
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>,
        '/a': RouteRecordInfo<'/a', '/a', Record<never, never>, Record<never, never>>,
        '/b': RouteRecordInfo<'/b', '/b', Record<never, never>, Record<never, never>>,
        '/c': RouteRecordInfo<'/c', '/c', Record<never, never>, Record<never, never>>,
      }"
    `)
  })

  it('adds params', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('[a]', '[a].vue')
    tree.insert('partial-[a]', 'partial-[a].vue')
    tree.insert('[[a]]', '[[a]].vue') // optional
    tree.insert('partial-[[a]]', 'partial-[[a]].vue') // partial-optional
    tree.insert('[a]+', '[a]+.vue') // repeated
    tree.insert('[[a]]+', '[[a]]+.vue') // optional repeated
    tree.insert('[...a]', '[...a].vue') // splat
    tree.insert('[[...a]]', '[[...a]].vue') // splat
    tree.insert('[[...a]]+', '[[...a]]+.vue') // splat
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/[a]': RouteRecordInfo<'/[a]', '/:a', { a: ParamValue<true> }, { a: ParamValue<false> }>,
        '/[[a]]': RouteRecordInfo<'/[[a]]', '/:a?', { a?: ParamValueZeroOrOne<true> }, { a?: ParamValueZeroOrOne<false> }>,
        '/[...a]': RouteRecordInfo<'/[...a]', '/:a(.*)', { a: ParamValue<true> }, { a: ParamValue<false> }>,
        '/[[...a]]': RouteRecordInfo<'/[[...a]]', '/:a(.*)?', { a?: ParamValueZeroOrOne<true> }, { a?: ParamValueZeroOrOne<false> }>,
        '/[[...a]]+': RouteRecordInfo<'/[[...a]]+', '/:a(.*)*', { a?: ParamValueZeroOrMore<true> }, { a?: ParamValueZeroOrMore<false> }>,
        '/[[a]]+': RouteRecordInfo<'/[[a]]+', '/:a*', { a?: ParamValueZeroOrMore<true> }, { a?: ParamValueZeroOrMore<false> }>,
        '/[a]+': RouteRecordInfo<'/[a]+', '/:a+', { a: ParamValueOneOrMore<true> }, { a: ParamValueOneOrMore<false> }>,
        '/partial-[a]': RouteRecordInfo<'/partial-[a]', '/partial-:a', { a: ParamValue<true> }, { a: ParamValue<false> }>,
        '/partial-[[a]]': RouteRecordInfo<'/partial-[[a]]', '/partial-:a?', { a?: ParamValueZeroOrOne<true> }, { a?: ParamValueZeroOrOne<false> }>,
      }"
    `)
  })

  it('handles params from raw routes', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const a = tree.insertParsedPath(':a', 'a.vue')
    const b = tree.insertParsedPath(':b()', 'a.vue')
    expect(a.name).toBe('/:a')
    expect(b.name).toBe('/:b()')
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/:a': RouteRecordInfo<'/:a', '/:a', { a: ParamValue<true> }, { a: ParamValue<false> }>,
        '/:b()': RouteRecordInfo<'/:b()', '/:b()', { b: ParamValue<true> }, { b: ParamValue<false> }>,
      }"
    `)
  })

  it('handles nested params in folders', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('n/[a]/index', 'n/[a]/index.vue') // normal
    tree.insert('n/[a]/other', 'n/[a]/other.vue')
    tree.insert('n/[a]/[b]', 'n/[a]/[b].vue')
    tree.insert('n/[a]/[c]/other-[d]', 'n/[a]/[c]/other-[d].vue')
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/n/[a]/': RouteRecordInfo<'/n/[a]/', '/n/:a', { a: ParamValue<true> }, { a: ParamValue<false> }>,
        '/n/[a]/[b]': RouteRecordInfo<'/n/[a]/[b]', '/n/:a/:b', { a: ParamValue<true>, b: ParamValue<true> }, { a: ParamValue<false>, b: ParamValue<false> }>,
        '/n/[a]/[c]/other-[d]': RouteRecordInfo<'/n/[a]/[c]/other-[d]', '/n/:a/:c/other-:d', { a: ParamValue<true>, c: ParamValue<true>, d: ParamValue<true> }, { a: ParamValue<false>, c: ParamValue<false>, d: ParamValue<false> }>,
        '/n/[a]/other': RouteRecordInfo<'/n/[a]/other', '/n/:a/other', { a: ParamValue<true> }, { a: ParamValue<false> }>,
      }"
    `)
  })

  it('adds nested params', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('n/[a]', 'n/[a].vue') // normal
    // tree.insert('n/partial-[a]', 'n/partial-[a].vue') // partial
    tree.insert('n/[[a]]', 'n/[[a]].vue') // optional
    tree.insert('n/[a]+', 'n/[a]+.vue') // repeated
    tree.insert('n/[[a]]+', 'n/[[a]]+.vue') // optional repeated
    tree.insert('n/[...a]', 'n/[...a].vue') // splat
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/n/[a]': RouteRecordInfo<'/n/[a]', '/n/:a', { a: ParamValue<true> }, { a: ParamValue<false> }>,
        '/n/[[a]]': RouteRecordInfo<'/n/[[a]]', '/n/:a?', { a?: ParamValueZeroOrOne<true> }, { a?: ParamValueZeroOrOne<false> }>,
        '/n/[...a]': RouteRecordInfo<'/n/[...a]', '/n/:a(.*)', { a: ParamValue<true> }, { a: ParamValue<false> }>,
        '/n/[[a]]+': RouteRecordInfo<'/n/[[a]]+', '/n/:a*', { a?: ParamValueZeroOrMore<true> }, { a?: ParamValueZeroOrMore<false> }>,
        '/n/[a]+': RouteRecordInfo<'/n/[a]+', '/n/:a+', { a: ParamValueOneOrMore<true> }, { a: ParamValueOneOrMore<false> }>,
      }"
    `)
  })

  it('generates params from path option', () => {
    const tree = new PrefixTree(
      resolveOptions({
        routesFolder: [{ src: 'src/pages', path: ':lang/' }],
      })
    )

    tree.insert('[lang]/index', 'src/pages/index.vue')
    tree.insert('[lang]/a', 'src/pages/a.vue')
    tree.insert('[lang]/[id]', 'src/pages/[id].vue')

    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/[lang]/': RouteRecordInfo<'/[lang]/', '/:lang', { lang: ParamValue<true> }, { lang: ParamValue<false> }>,
        '/[lang]/[id]': RouteRecordInfo<'/[lang]/[id]', '/:lang/:id', { lang: ParamValue<true>, id: ParamValue<true> }, { lang: ParamValue<false>, id: ParamValue<false> }>,
        '/[lang]/a': RouteRecordInfo<'/[lang]/a', '/:lang/a', { lang: ParamValue<true> }, { lang: ParamValue<false> }>,
      }"
    `)
  })

  it('nested children', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('a/a', 'a/a.vue')
    tree.insert('a/b', 'a/b.vue')
    tree.insert('a/c', 'a/c.vue')
    tree.insert('b/b', 'b/b.vue')
    tree.insert('b/c', 'b/c.vue')
    tree.insert('b/d', 'b/d.vue')
    tree.insert('c', 'c.vue')
    tree.insert('d', 'd.vue')
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

  it('keeps parent path overrides', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const parent = tree.insert('parent', 'parent.vue')
    const child = tree.insert('parent/child', 'parent/child.vue')
    parent.value.setOverride('parent', { path: '/' })
    expect(child.fullPath).toBe('/child')
    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/parent': RouteRecordInfo<'/parent', '/', Record<never, never>, Record<never, never>>,
        '/parent/child': RouteRecordInfo<'/parent/child', '/child', Record<never, never>, Record<never, never>>,
      }"
    `)
  })

  it('adds params from the path option', () => {
    const tree = new PrefixTree(
      resolveOptions({
        routesFolder: [{ src: 'src/pages', path: '[lang]/' }],
      })
    )

    tree.insert('[lang]/index', 'src/pages/index.vue')
    tree.insert('[lang]/a', 'src/pages/a.vue')
    tree.insert('[lang]/[id]', 'src/pages/[id].vue')

    expect(formatExports(generateRouteNamedMap(tree))).toMatchInlineSnapshot(`
      "export interface RouteNamedMap {
        '/[lang]/': RouteRecordInfo<'/[lang]/', '/:lang', { lang: ParamValue<true> }, { lang: ParamValue<false> }>,
        '/[lang]/[id]': RouteRecordInfo<'/[lang]/[id]', '/:lang/:id', { lang: ParamValue<true>, id: ParamValue<true> }, { lang: ParamValue<false>, id: ParamValue<false> }>,
        '/[lang]/a': RouteRecordInfo<'/[lang]/a', '/:lang/a', { lang: ParamValue<true> }, { lang: ParamValue<false> }>,
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
