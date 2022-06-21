import { describe, expect, it } from 'vitest'
import { createPrefixTree, TreeLeafType } from './tree'

describe('Tree', () => {
  it('creates an empty tree', () => {
    const tree = createPrefixTree()
    expect(tree.children.size).toBe(0)
  })

  it('creates a tree with a single static path', () => {
    const tree = createPrefixTree()
    tree.insert('foo.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('foo')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      value: 'foo',
      _type: TreeLeafType.static,
    })
    expect(child.children.size).toBe(0)
  })

  it('creates a tree with a single param', () => {
    const tree = createPrefixTree()
    tree.insert('[id].vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('[id]')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      value: '[id]',
      name: 'id',
      _type: TreeLeafType.param,
    })
    expect(child.children.size).toBe(0)
  })

  it('handles a modifier for single params', () => {
    const tree = createPrefixTree()
    tree.insert('[id]+.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('[id]+')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      value: '[id]+',
      name: 'id',
      _type: TreeLeafType.param | TreeLeafType.repeatable,
    })
    expect(child.children.size).toBe(0)
  })

  it('removes nodes', () => {
    const tree = createPrefixTree()
    tree.insert('foo.vue')
    tree.insert('[id].vue')
    tree.remove('foo.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('[id]')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      value: '[id]',
      name: 'id',
    })
    expect(child.children.size).toBe(0)
  })

  it('removes empty folders', () => {
    const tree = createPrefixTree()
    tree.insert('a/b/c/d.vue')
    expect(tree.children.size).toBe(1)
    tree.remove('a/b/c/d.vue')
    expect(tree.children.size).toBe(0)
  })

  it('keeps parent with file but no children', () => {
    const tree = createPrefixTree()
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
