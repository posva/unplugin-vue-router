import { describe, expect, it } from 'vitest'
import { trimExtension } from './utils'

describe('utils', () => {
  describe('trimExtension', () => {
    it('trims when found', () => {
      expect(trimExtension('foo.vue', ['.vue'])).toBe('foo')
      expect(trimExtension('foo.vue', ['.ts', '.vue'])).toBe('foo')
      expect(trimExtension('foo.ts', ['.ts', '.vue'])).toBe('foo')
      expect(trimExtension('foo.page.vue', ['.page.vue'])).toBe('foo')
    })

    it('skips if not found', () => {
      expect(trimExtension('foo.vue', ['.page.vue'])).toBe('foo.vue')
      expect(trimExtension('foo.page.vue', ['.vue'])).toBe('foo.page')
    })
  })
})
