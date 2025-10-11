/**
 * Deterministic path sorting
 *
 * Ensures routes, files, and views in typed-router.d.ts are always sorted
 * the same way on all systems and locales—preventing developers
 * from seeing the file change due to locale differences.
 *
 * Sorting rules:
 *   • `index.vue` always comes first in its folder.
 *   • Files come before folders at the same level.
 *   • Otherwise, segments are compared with a fixed English collator.
 *
 * Normalization:
 *   • Unicode is normalized to NFC so "é" === "é".
 */

// Fixed English collator for stable, locale-independent string comparison.
const collator = new Intl.Collator('en', {
  usage: 'sort',
  sensitivity: 'variant',
  numeric: true,
  caseFirst: 'lower',
})

// Normalize to NFC (so "é" === "é"), remove leading "/", and split by "/" into segments.
const toSegments = (p: string) =>
  p.normalize('NFC').replace(/^\/+/, '').split('/')

// Compare two paths and return their deterministic sort order.
export function comparePaths(a: string, b: string): number {
  const A = toSegments(a)
  const B = toSegments(b)

  for (let i = 0, n = Math.max(A.length, B.length); i < n; i++) {
    const x = A[i]
    const y = B[i]

    if (x === y) {
      if (x === undefined) return 0
      continue
    }

    if (x === undefined) return -1
    if (y === undefined) return 1

    if (x === 'index.vue' || y === 'index.vue')
      return x === 'index.vue' ? -1 : 1

    const fileX = i === A.length - 1 && x.includes('.')
    const fileY = i === B.length - 1 && y.includes('.')
    if (fileX !== fileY) return fileX ? -1 : 1

    // Benchmarks show `Intl.Collator` is much faster than `localeCompare` here
    const c = collator.compare(x, y)
    if (c) return c
  }

  return 0
}

// Sort an array of paths deterministically using comparePaths.
export const sortPaths = (paths: string[]) => [...paths].sort(comparePaths)
