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

  it('keeps nested routes flat', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert('foo/bar', 'file.vue')
    expect(tree.children.size).toBe(1)
    expect(tree.children.get('foo/bar')?.children.size).toBe(0)
    expect(tree.children.get('foo/bar')?.fullPath).toBe('/foo/bar')
    expect(tree.children.get('foo/bar')?.path).toBe('/foo/bar')
  })

  it('can have multiple params', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert(':foo/:bar', 'file.vue')
    expect(tree.children.size).toBe(1)
    const node = tree.children.get(':foo/:bar')!
    expect(node.fullPath).toBe('/:foo/:bar')
    expect(node.path).toBe('/:foo/:bar')
    expect(node.params).toEqual([
      {
        paramName: 'foo',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
      },
      {
        paramName: 'bar',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
      },
    ])
  })

  it('can have multiple params with modifiers', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert(':foo/:bar+_:o(\\d+)', 'file.vue')
    expect(tree.children.size).toBe(1)
    const node = tree.children.get(':foo/:bar+_:o(\\d+)')!
    expect(node.fullPath).toBe('/:foo/:bar+_:o(\\d+)')
    expect(node.path).toBe('/:foo/:bar+_:o(\\d+)')
    expect(node.params).toEqual([
      {
        paramName: 'foo',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
      },
      {
        paramName: 'bar',
        modifier: '+',
        optional: false,
        repeatable: true,
        isSplat: false,
      },
      {
        paramName: 'o',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
      },
    ])
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

  it('detects a splat', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert('/:path(.*)', 'file.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get(':path(.*)')!
    expect(child.fullPath).toBe('/:path(.*)')
    expect(child.path).toBe('/:path(.*)')
    expect(child.params).toEqual([
      {
        paramName: 'path',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: true,
      },
    ])
  })
})
