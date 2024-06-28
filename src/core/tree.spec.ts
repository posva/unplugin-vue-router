import { describe, expect, it } from 'vitest'
import { DEFAULT_OPTIONS, resolveOptions } from '../options'
import { PrefixTree } from './tree'
import { TreeNodeType } from './treeNodeValue'
import { resolve } from 'pathe'

describe('Tree', () => {
  const RESOLVED_OPTIONS = resolveOptions(DEFAULT_OPTIONS)
  it('creates an empty tree', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    expect(tree.children.size).toBe(0)
  })

  it('creates a tree with a single static path', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('foo', 'foo.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('foo')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: 'foo',
      path: '/foo',
      _type: TreeNodeType.static,
    })
    expect(child.children.size).toBe(0)
  })

  it('creates a tree with a single param', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[id]', '[id].vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('[id]')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: '[id]',
      params: [{ paramName: 'id' }],
      path: '/:id',
      _type: TreeNodeType.param,
    })
    expect(child.children.size).toBe(0)
  })

  it('separate param names from static segments', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[id]_a', '[id]_a.vue')
    tree.insert('[a]e[b]f', '[a]e[b]f.vue')
    expect(tree.children.get('[id]_a')!.value).toMatchObject({
      rawSegment: '[id]_a',
      params: [{ paramName: 'id' }],
      path: '/:id()_a',
      _type: TreeNodeType.param,
    })

    expect(tree.children.get('[a]e[b]f')!.value).toMatchObject({
      rawSegment: '[a]e[b]f',
      params: [{ paramName: 'a' }, { paramName: 'b' }],
      path: '/:a()e:b()f',
      _type: TreeNodeType.param,
    })
  })

  it('creates params in nested files', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const nestedId = tree.insert('nested/[id]', 'nested/[id].vue')

    expect(nestedId.value.isParam()).toBe(true)
    expect(nestedId.params).toEqual([
      expect.objectContaining({
        isSplat: false,
        modifier: '',
        optional: false,
        paramName: 'id',
        repeatable: false,
      }),
    ])

    const nestedAId = tree.insert('nested/a/[id]', 'nested/a/[id].vue')
    expect(nestedAId.value.isParam()).toBe(true)
    expect(nestedAId.params).toEqual([
      expect.objectContaining({
        isSplat: false,
        modifier: '',
        optional: false,
        paramName: 'id',
        repeatable: false,
      }),
    ])
  })

  it('creates params in nested folders', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)

    let node = tree.insert('nested/[id]/index', 'nested/[id]/index.vue')
    const id = tree.children.get('nested')!.children.get('[id]')!
    expect(id.value.isParam()).toBe(true)
    expect(id.params).toEqual([
      expect.objectContaining({
        isSplat: false,
        modifier: '',
        optional: false,
        paramName: 'id',
        repeatable: false,
      }),
    ])

    expect(node.value.isParam()).toBe(false)
    expect(node.params).toEqual([
      expect.objectContaining({
        isSplat: false,
        modifier: '',
        optional: false,
        paramName: 'id',
        repeatable: false,
      }),
    ])

    node = tree.insert('nested/[a]/other', 'nested/[a]/other.vue')
    expect(node.value.isParam()).toBe(false)
    expect(node.params).toEqual([
      expect.objectContaining({
        isSplat: false,
        modifier: '',
        optional: false,
        paramName: 'a',
        repeatable: false,
      }),
    ])

    node = tree.insert('nested/a/[id]/index', 'nested/a/[id]/index.vue')
    expect(node.value.isParam()).toBe(false)
    expect(node.params).toEqual([
      expect.objectContaining({
        isSplat: false,
        modifier: '',
        optional: false,
        paramName: 'id',
        repeatable: false,
      }),
    ])
  })

  it('handles repeatable params one or more', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[id]+', '[id]+.vue')
    expect(tree.children.get('[id]+')!.value).toMatchObject({
      rawSegment: '[id]+',
      params: [
        {
          paramName: 'id',
          repeatable: true,
          optional: false,
          modifier: '+',
        },
      ],
      path: '/:id+',
      _type: TreeNodeType.param,
    })
  })

  it('handles repeatable params zero or more', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[[id]]+', '[[id]]+.vue')
    expect(tree.children.get('[[id]]+')!.value).toMatchObject({
      rawSegment: '[[id]]+',
      params: [
        {
          paramName: 'id',
          repeatable: true,
          optional: true,
          modifier: '*',
        },
      ],
      path: '/:id*',
      _type: TreeNodeType.param,
    })
  })

  it('handles optional params', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[[id]]', '[[id]].vue')
    expect(tree.children.get('[[id]]')!.value).toMatchObject({
      rawSegment: '[[id]]',
      params: [
        {
          paramName: 'id',
          repeatable: false,
          optional: true,
          modifier: '?',
        },
      ],
      path: '/:id?',
      _type: TreeNodeType.param,
    })
  })

  it('handles named views', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('index', 'index.vue')
    tree.insert('index@a', 'index@a.vue')
    tree.insert('index@b', 'index@b.vue')
    tree.insert('nested/foo@a', 'nested/foo@a.vue')
    tree.insert('nested/foo@b', 'nested/foo@b.vue')
    tree.insert('nested/[id]@a', 'nested/[id]@a.vue')
    tree.insert('nested/[id]@b', 'nested/[id]@b.vue')
    tree.insert('not.nested.path@a', 'not.nested.path@a.vue')
    tree.insert('not.nested.path@b', 'not.nested.path@b.vue')
    tree.insert('deep/not.nested.path@a', 'deep/not.nested.path@a.vue')
    tree.insert('deep/not.nested.path@b', 'deep/not.nested.path@b.vue')
    expect([...tree.children.get('index')!.value.components.keys()]).toEqual([
      'default',
      'a',
      'b',
    ])
    expect([
      ...tree.children
        .get('nested')!
        .children.get('foo')!
        .value.components.keys(),
    ]).toEqual(['a', 'b'])
    expect([
      ...tree.children
        .get('nested')!
        .children.get('[id]')!
        .value.components.keys(),
    ]).toEqual(['a', 'b'])
    expect([
      ...tree.children.get('not.nested.path')!.value.components.keys(),
    ]).toEqual(['a', 'b'])
    expect([
      ...tree.children
        .get('deep')!
        .children.get('not.nested.path')!
        .value.components.keys(),
    ]).toEqual(['a', 'b'])
  })

  it('handles single named views that are not default', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('index@a', 'index@a.vue')
    expect([...tree.children.get('index')!.value.components.keys()]).toEqual([
      'a',
    ])
  })

  it('removes the node after all named views', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('index', 'index.vue')
    tree.insert('index@a', 'index@a.vue')
    expect(tree.children.get('index')).toBeDefined()
    tree.remove('index@a')
    expect(tree.children.get('index')).toBeDefined()
    tree.remove('index')
    expect(tree.children.get('index')).toBeUndefined()
  })

  it('can remove itself from the tree', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree
      .insert('index', 'index.vue')
      .insert('nested', resolve('index/nested.vue'))
    tree.insert('a', 'a.vue').insert('nested', resolve('a/nested.vue'))
    tree.insert('b', 'b.vue')
    expect(tree.children.size).toBe(3)
    tree.children.get('a')!.delete()
    expect(tree.children.size).toBe(2)
    tree.children.get('index')!.delete()
    expect(tree.children.size).toBe(1)
  })

  it('handles multiple params', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[a]-[b]', '[a]-[b].vue')
    tree.insert('o[a]-[b]c', 'o[a]-[b]c.vue')
    tree.insert('o[a][b]c', 'o[a][b]c.vue')
    tree.insert('nested/o[a][b]c', 'nested/o[a][b]c.vue')
    expect(tree.children.size).toBe(4)
    expect(tree.children.get('[a]-[b]')!.value).toMatchObject({
      pathSegment: ':a-:b',
    })
  })

  it('creates a tree of nested routes', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('index', 'index.vue')
    tree.insert('a/index', 'a/index.vue')
    tree.insert('a/b/index', 'a/b/index.vue')
    expect(Array.from(tree.children.keys())).toEqual(['index', 'a'])
    const index = tree.children.get('index')!
    expect(index.value).toMatchObject({
      rawSegment: 'index',
      // the root should have a '/' instead of '' for the autocompletion
      path: '/',
    })
    expect(index).toBeDefined()
    const a = tree.children.get('a')!
    expect(a).toBeDefined()
    expect(a.value.components.get('default')).toBeUndefined()
    expect(a.value).toMatchObject({
      rawSegment: 'a',
      path: '/a',
    })
    expect(Array.from(a.children.keys())).toEqual(['index', 'b'])
    const aIndex = a.children.get('index')!
    expect(aIndex).toBeDefined()
    expect(Array.from(aIndex.children.keys())).toEqual([])
    expect(aIndex.value).toMatchObject({
      rawSegment: 'index',
      path: '/a',
    })

    tree.insert('a', 'a.vue')
    expect(a.value.components.get('default')).toBe('a.vue')
    expect(a.value).toMatchObject({
      rawSegment: 'a',
      path: '/a',
    })
  })

  it('handles a modifier for single params', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[id]+', '[id]+.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('[id]+')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: '[id]+',
      params: [{ paramName: 'id', modifier: '+' }],
      path: '/:id+',
      pathSegment: ':id+',
      _type: TreeNodeType.param,
    })
    expect(child.children.size).toBe(0)
  })

  it('removes nodes', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('foo', 'foo.vue')
    tree.insert('[id]', '[id].vue')
    tree.remove('foo')
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
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('a/b/c/d', 'a/b/c/d.vue')
    expect(tree.children.size).toBe(1)
    tree.remove('a/b/c/d')
    expect(tree.children.size).toBe(0)
  })

  it('insert returns the node', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const a = tree.insert('a', 'a.vue')
    expect(tree.children.get('a')).toBe(a)
    const bC = tree.insert('b/c', 'b/c.vue')
    expect(tree.children.get('b')!.children.get('c')).toBe(bC)
    const bCD = tree.insert('b/c/d', 'b/c/d.vue')
    expect(tree.children.get('b')!.children.get('c')!.children.get('d')).toBe(
      bCD
    )
  })

  it('keeps parent with file but no children', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('a/b/c/d', 'a/b/c/d.vue')
    tree.insert('a/b', 'a/b.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('a')!.children.get('b')!
    expect(child).toBeDefined()
    expect(child.children.size).toBe(1)

    tree.remove('a/b/c/d')
    expect(tree.children.size).toBe(1)
    expect(tree.children.get('a')!.children.size).toBe(1)
    expect(child.children.size).toBe(0)
  })

  it('allows a custom name', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    let node = tree.insert('[a]-[b]', '[a]-[b].vue')
    node.value.setOverride('', {
      name: 'custom',
    })
    expect(node.name).toBe('custom')

    node = tree.insert('auth/login', 'auth/login.vue')
    node.value.setOverride('', {
      name: 'custom-child',
    })
    expect(node.name).toBe('custom-child')
  })

  it('allows a custom path', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    let node = tree.insert('[a]-[b]', '[a]-[b].vue')
    node.value.setOverride('', {
      path: '/custom',
    })
    expect(node.path).toBe('/custom')
    expect(node.fullPath).toBe('/custom')

    node = tree.insert('auth/login', 'auth/login.vue')
    node.value.setOverride('', {
      path: '/custom-child',
    })
    expect(node.path).toBe('/custom-child')
    expect(node.fullPath).toBe('/custom-child')
  })

  it('removes trailing slash from path but not from name', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('a/index', 'a/index.vue')
    tree.insert('a/a', 'a/a.vue')
    let child = tree.children.get('a')!
    expect(child).toBeDefined()
    expect(child.fullPath).toBe('/a')

    child = tree.children.get('a')!.children.get('index')!
    expect(child).toBeDefined()
    expect(child.name).toBe('/a/')
    expect(child.fullPath).toBe('/a')

    // it stays the same with a parent component in the parent route record
    tree.insert('a', 'a.vue')
    child = tree.children.get('a')!.children.get('index')!
    expect(child).toBeDefined()
    expect(child.name).toBe('/a/')
    expect(child.fullPath).toBe('/a')
  })

  describe('dot nesting', () => {
    it('transforms dots into nested routes by default', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      tree.insert('users.new', 'users.new.vue')
      expect(tree.children.size).toBe(1)
      const users = tree.children.get('users.new')!
      expect(users.value).toMatchObject({
        rawSegment: 'users.new',
        pathSegment: 'users/new',
        path: '/users/new',
        _type: TreeNodeType.static,
      })
    })

    it('can ignore dot nesting', () => {
      const tree = new PrefixTree({
        ...RESOLVED_OPTIONS,
        pathParser: {
          dotNesting: false,
        },
      })
      tree.insert('1.2.3-lesson', '1.2.3-lesson.vue')
      expect(tree.children.size).toBe(1)
      const lesson = tree.children.get('1.2.3-lesson')!

      expect(lesson.value).toMatchObject({
        rawSegment: '1.2.3-lesson',
        pathSegment: '1.2.3-lesson',
        path: '/1.2.3-lesson',
        _type: TreeNodeType.static,
      })
    })
  })
})
