# Test

```ts twoslash
// @noErrors

// ✅ Works fine
const a: { test: 'foo' | 'bar' | 'baz' } = {
  test: 'foo',
}
a.t
// ^|

type A = '@foo' | '@bar' | '/foo' | '/bar'

const b: A = '@f'
//              ^|

// Expected completion to be "bar", "baz"
a.test === 'ba'
//            ^|
```
