import { describe, it, expect } from 'vitest'
import { comparePaths, sortPaths } from './pathSorting'

/**
 * Helper for snapshot-friendly, readable arrays of paths.
 * It formats each string on its own line, quoted, and wrapped in brackets.
 */
export function formatPaths(paths: string[]): string {
  const lines = paths.map((p) => `  '${p}'`)
  return `[\n${lines.join(',\n')}\n]`
}

describe('pathSorting', () => {
  it('orders REST-like routes hierarchically', () => {
    const input = [
      '/users/[id]/other',
      '/users',
      '/users/[id]',
      '/users/[id]/edit',
    ]
    const sorted = [...input].sort(comparePaths)
    expect(formatPaths(sorted)).toMatchInlineSnapshot(`
"[
  '/users',
  '/users/[id]',
  '/users/[id]/edit',
  '/users/[id]/other'
]"
`)
  })

  it('keeps files before folders (parent.vue before parent/child.vue)', () => {
    const input = ['src/pages/parent/child.vue', 'src/pages/parent.vue']
    const sorted = [...input].sort(comparePaths)
    expect(formatPaths(sorted)).toMatchInlineSnapshot(`
"[
  'src/pages/parent.vue',
  'src/pages/parent/child.vue'
]"
`)
  })

  it('prioritizes index.vue within its directory', () => {
    const input = ['src/pages/a.vue', 'src/pages/index.vue', 'src/pages/b.vue']
    const sorted = [...input].sort(comparePaths)
    expect(formatPaths(sorted)).toMatchInlineSnapshot(`
"[
  'src/pages/index.vue',
  'src/pages/a.vue',
  'src/pages/b.vue'
]"
`)
  })

  it('index.vue first, then sibling files, then subfolders', () => {
    const input = [
      'src/pages/about/index.vue',
      'src/pages/about.vue',
      'src/pages/index.vue',
    ]
    const sorted = [...input].sort(comparePaths)
    expect(formatPaths(sorted)).toMatchInlineSnapshot(`
"[
  'src/pages/index.vue',
  'src/pages/about.vue',
  'src/pages/about/index.vue'
]"
`)
  })

  it('handles dynamic segments in names (mixed [id] and :id tokens)', () => {
    const input = [
      '/some-nested/file-with-[id]-in-the-middle',
      'file-with-:id-in-the-middle',
      '/some-nested/file-with-:id-in-the-middle',
    ]
    const sorted = sortPaths(input)
    expect(formatPaths(sorted)).toMatchInlineSnapshot(`
"[
  'file-with-:id-in-the-middle',
  '/some-nested/file-with-:id-in-the-middle',
  '/some-nested/file-with-[id]-in-the-middle'
]"
`)
  })

  it('uses numeric-aware order for sibling files', () => {
    const input = [
      'src/pages/file10.vue',
      'src/pages/file2.vue',
      'src/pages/file1.vue',
    ]
    const sorted = sortPaths(input)
    expect(formatPaths(sorted)).toMatchInlineSnapshot(`
"[
  'src/pages/file1.vue',
  'src/pages/file2.vue',
  'src/pages/file10.vue'
]"
`)
  })

  it('keeps hierarchical grouping before plain string order', () => {
    const input = ['a/bb/index.vue', 'a/b.vue', 'a/b/c.vue', 'a/a.vue']
    const sorted = [...input].sort(comparePaths)
    expect(formatPaths(sorted)).toMatchInlineSnapshot(`
"[
  'a/a.vue',
  'a/b.vue',
  'a/b/c.vue',
  'a/bb/index.vue'
]"
`)
  })

  describe('comparePaths / Unicode normalization (NFC)', () => {
    it('treats precomposed and decomposed as equivalent and keeps them adjacent', () => {
      // café in two forms:
      // - precomposed: "é" (U+00E9)
      // - decomposed: "e\u0301" (U+0065 + U+0301)
      const pre = 'src/pages/café.vue'
      const decomp = 'src/pages/cafe\u0301.vue'

      const input = ['src/pages/cafe.vue', pre, 'src/pages/cafg.vue', decomp]

      const sorted = sortPaths([...input])
      expect(formatPaths(sorted)).toMatchInlineSnapshot(`
"[
  'src/pages/cafe.vue',
  'src/pages/café.vue',
  'src/pages/café.vue',
  'src/pages/cafg.vue'
]"
`)
      // sanity: they are not byte-equal, but should compare equal under NFC-aware compare
      expect(pre).not.toBe(decomp)
    })

    it('normalizes within deeper paths and still applies path rules (index.vue first)', () => {
      const pre = '/users/café/index.vue'
      const decomp = '/users/cafe\u0301/settings.vue'
      const input = [
        '/users/cafe/profile.vue',
        decomp,
        pre,
        '/users/cafe/index.vue',
      ]

      const sorted = sortPaths([...input])
      expect(formatPaths(sorted)).toMatchInlineSnapshot(`
"[
  '/users/cafe/index.vue',
  '/users/cafe/profile.vue',
  '/users/café/index.vue',
  '/users/café/settings.vue'
]"
`)
    })
  })
})
