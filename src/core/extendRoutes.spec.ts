import { expect, describe, it } from 'vitest'
import { createPrefixTree } from './tree'
import { DEFAULT_OPTIONS } from '../options'
import { EditableTreeNode } from './extendRoutes'

describe('EditableTreeNode', () => {
  it('creates an editable tree node', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    const editable = new EditableTreeNode(tree)

    expect(editable.children).toEqual([])
  })

  it('reflects changes made on the tree', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    const editable = new EditableTreeNode(tree)

    tree.insert('foo', 'file.vue')
    expect(editable.children).toHaveLength(1)
    expect(editable.children[0].path).toBe('/foo')
  })

  it('reflects changes made on the editable tree', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert('foo', 'file.vue')
    expect(tree.children.size).toBe(1)
    expect(tree.children.get('foo')?.path).toBe('/foo')
  })

  it('can insert nested nodes', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert('foo/bar', 'file.vue')
    expect(tree.children.size).toBe(1)
    expect(tree.children.get('foo')?.children.size).toBe(1)
    expect(tree.children.get('foo')?.children.get('bar')?.path).toBe('bar')
  })

  it('adds params', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert(':id', 'file.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get(':id')!
    expect(child.fullPath).toBe('/:id')
    expect(child.path).toBe('/:id')
    expect(child.params).toEqual([
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
      },
    ])
  })

  it('add params with modifiers', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert(':id+', 'file.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get(':id+')!
    expect(child.fullPath).toBe('/:id+')
    expect(child.path).toBe('/:id+')
    expect(child.params).toEqual([
      {
        paramName: 'id',
        modifier: '+',
        optional: false,
        repeatable: true,
        isSplat: false,
      },
    ])
  })
})
