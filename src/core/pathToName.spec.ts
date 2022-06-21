import { expect } from 'chai'
import { describe, it } from 'vitest'
import { routePathToName } from './tree'

describe('routePathToName', () => {
  it('works with simple path', () => {
    expect(routePathToName('/foo')).to.equal('Foo')
    expect(routePathToName('/foo/')).to.equal('Foo')
  })

  it('empty path', () => {
    expect(routePathToName('/')).to.equal('Index')
  })

  it('empty path', () => {
    expect(routePathToName('/')).to.equal('Index')
  })
})
