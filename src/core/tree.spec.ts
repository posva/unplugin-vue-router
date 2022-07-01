import { describe, expect, it } from 'vitest'
import { DEFAULT_OPTIONS } from '../options'
import { createPrefixTree } from './tree'
import { TreeLeafType } from './treeLeafValue'

describe('Tree', () => {
  it('creates an empty tree', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    expect(tree.children.size).toBe(0)
  })

  it('creates a tree with a single static path', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('foo.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('foo')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: 'foo',
      path: '/foo',
      _type: TreeLeafType.static,
    })
    expect(child.children.size).toBe(0)
  })

  it('creates a tree with a single param', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('[id].vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('[id]')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: '[id]',
      params: [{ paramName: 'id' }],
      path: '/:id',
      _type: TreeLeafType.param,
    })
    expect(child.children.size).toBe(0)
  })

  it('handles named views', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('index.vue')
    tree.insert('index@a.vue')
    tree.insert('index@b.vue')
    tree.insert('nested/foo@a.vue')
    tree.insert('nested/foo@b.vue')
    tree.insert('nested/[id]@a.vue')
    tree.insert('nested/[id]@b.vue')
    tree.insert('not.nested.path@a.vue')
    tree.insert('not.nested.path@b.vue')
    tree.insert('deep/not.nested.path@a.vue')
    tree.insert('deep/not.nested.path@b.vue')
    expect([...tree.children.get('index')!.value.filePaths.keys()]).toEqual([
      'default',
      'a',
      'b',
    ])
    expect([
      ...tree.children
        .get('nested')!
        .children.get('foo')!
        .value.filePaths.keys(),
    ]).toEqual(['a', 'b'])
    expect([
      ...tree.children
        .get('nested')!
        .children.get('[id]')!
        .value.filePaths.keys(),
    ]).toEqual(['a', 'b'])
    expect([
      ...tree.children.get('not.nested.path')!.value.filePaths.keys(),
    ]).toEqual(['a', 'b'])
    expect([
      ...tree.children
        .get('deep')!
        .children.get('not.nested.path')!
        .value.filePaths.keys(),
    ]).toEqual(['a', 'b'])
  })

  it('removes the node after all named views', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('index.vue')
    tree.insert('index@a.vue')
    expect(tree.children.get('index')).toBeDefined()
    tree.remove('index@a.vue')
    expect(tree.children.get('index')).toBeDefined()
    tree.remove('index.vue')
    expect(tree.children.get('index')).toBeUndefined()
  })

  it('handles multiple params', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('[a]-[b].vue')
    tree.insert('o[a]-[b]c.vue')
    tree.insert('o[a][b]c.vue')
    tree.insert('nested/o[a][b]c.vue')
    expect(tree.children.size).toBe(4)
    expect(tree.children.get('[a]-[b]')!.value).toMatchObject({
      pathSegment: ':a-:b',
    })
  })

  it('creates a tree of nested routes', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('index.vue')
    tree.insert('a/index.vue')
    tree.insert('a/b/index.vue')
    expect(Array.from(tree.children.keys())).toEqual(['index', 'a'])
    const index = tree.children.get('index')!
    expect(index.value).toMatchObject({
      rawSegment: '',
      path: '/',
    })
    expect(index).toBeDefined()
    const a = tree.children.get('a')!
    expect(a).toBeDefined()
    expect(a.value.filePaths.get('default')).toBeUndefined()
    expect(a.value).toMatchObject({
      rawSegment: 'a',
      path: '/a',
    })
    expect(Array.from(a.children.keys())).toEqual(['index', 'b'])
    const aIndex = a.children.get('index')!
    expect(aIndex).toBeDefined()
    expect(Array.from(aIndex.children.keys())).toEqual([])
    expect(aIndex.value).toMatchObject({
      rawSegment: '',
      path: '/a/',
    })

    tree.insert('a.vue')
    expect(a.value.filePaths.get('default')).toBe('a.vue')
    expect(a.value).toMatchObject({
      rawSegment: 'a',
      path: '/a',
    })
  })

  it('handles a modifier for single params', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('[id]+.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('[id]+')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: '[id]+',
      params: [{ paramName: 'id', modifier: '+' }],
      path: '/:id+',
      pathSegment: ':id+',
      _type: TreeLeafType.param,
    })
    expect(child.children.size).toBe(0)
  })

  it('removes nodes', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('foo.vue')
    tree.insert('[id].vue')
    tree.remove('foo.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('[id]')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: '[id]',
      params: [{ paramName: 'id' }],
      path: '/:id',
      pathSegment: ':id',
    })
    expect(child.children.size).toBe(0)
  })

  it('removes empty folders', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('a/b/c/d.vue')
    expect(tree.children.size).toBe(1)
    tree.remove('a/b/c/d.vue')
    expect(tree.children.size).toBe(0)
  })

  it('keeps parent with file but no children', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('a/b/c/d.vue')
    tree.insert('a/b.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('a')!.children.get('b')!
    expect(child).toBeDefined()
    expect(child.children.size).toBe(1)

    tree.remove('a/b/c/d.vue')
    expect(tree.children.size).toBe(1)
    expect(tree.children.get('a')!.children.size).toBe(1)
    expect(child.children.size).toBe(0)
  })
})
