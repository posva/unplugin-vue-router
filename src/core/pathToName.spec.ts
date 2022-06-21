import { describe, it, expect } from 'vitest'
import { routePathToName } from './tree'

describe('routePathToName', () => {
  it('works with simple path', () => {
    expect(routePathToName('/foo')).toBe('Foo')
    expect(routePathToName('/foo/')).toBe('Foo')
  })

  it('empty path', () => {
    expect(routePathToName('/')).toBe('Index')
  })

  it('empty path', () => {
    expect(routePathToName('/')).toBe('Index')
  })
})
