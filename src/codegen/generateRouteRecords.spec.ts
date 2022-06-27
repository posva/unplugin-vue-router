import { describe, expect, it } from 'vitest'
import { createPrefixTree } from '../core/tree'
import { DEFAULT_OPTIONS } from '../options'
import { generateRouteRecord } from './generateRouteRecords'

describe('generateRouteRecord', () => {
  it('works with an empty tree', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)

    expect(generateRouteRecord(tree)).toMatchInlineSnapshot(`
      "[

      ]"
    `)
  })

  it('works with some paths at root', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('a.vue')
    tree.insert('b.vue')
    tree.insert('c.vue')
    expect(generateRouteRecord(tree)).toMatchSnapshot()
  })

  it('nested children', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('a/a.vue')
    tree.insert('a/b.vue')
    tree.insert('a/c.vue')
    tree.insert('b/b.vue')
    tree.insert('b/c.vue')
    tree.insert('b/d.vue')
    expect(generateRouteRecord(tree)).toMatchSnapshot()
    tree.insert('c.vue')
    tree.insert('d.vue')
    expect(generateRouteRecord(tree)).toMatchSnapshot()
  })

  it('adds children and name when folder and component exist', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('a/c.vue')
    tree.insert('b/c.vue')
    tree.insert('a.vue')
    tree.insert('d.vue')
    expect(generateRouteRecord(tree)).toMatchSnapshot()
  })

  it('correctly names index.vue files', () => {
    const tree = createPrefixTree(DEFAULT_OPTIONS)
    tree.insert('index.vue')
    tree.insert('b/index.vue')
    expect(generateRouteRecord(tree)).toMatchSnapshot()
  })

  describe('names', () => {
    it('creates single word names', () => {
      const tree = createPrefixTree(DEFAULT_OPTIONS)
      tree.insert('index.vue')
      tree.insert('about.vue')
      tree.insert('users/index.vue')
      tree.insert('users/[id].vue')
      tree.insert('users/[id]/edit.vue')
      tree.insert('users/new.vue')

      expect(generateRouteRecord(tree)).toMatchSnapshot()
    })

    it('creates multi word names', () => {
      const tree = createPrefixTree(DEFAULT_OPTIONS)
      tree.insert('index.vue')
      tree.insert('my-users.vue')
      tree.insert('MyPascalCaseUsers.vue')
      tree.insert('some-nested/file-with-[id]-in-the-middle.vue')

      expect(generateRouteRecord(tree)).toMatchInlineSnapshot(`
        "[
          {
            path: \\"/\\",
            name: \\"Root\\",
            component: () => import('index.vue'),
            /* no children */
          },
          {
            path: \\"/my-users\\",
            name: \\"MyUsers\\",
            component: () => import('my-users.vue'),
            /* no children */
          },
          {
            path: \\"/MyPascalCaseUsers\\",
            name: \\"MyPascalCaseUsers\\",
            component: () => import('MyPascalCaseUsers.vue'),
            /* no children */
          },
          {
            path: \\"/some-nested\\",
            /* no name */
            /* no component */
            children: [
              {
                path: \\"file-with-:id-in-the-middle\\",
                name: \\"SomeNestedFileWith$idInTheMiddle\\",
                component: () => import('some-nested/file-with-[id]-in-the-middle.vue'),
                /* no children */
              }
            ],
          }
        ]"
      `)
    })

    it('works with nested views', () => {
      const tree = createPrefixTree(DEFAULT_OPTIONS)
      tree.insert('index.vue')
      tree.insert('users.vue')
      tree.insert('users/index.vue')
      tree.insert('users/[id]/edit.vue')
      tree.insert('users/[id].vue')

      expect(generateRouteRecord(tree)).toMatchSnapshot()
    })
  })
})
