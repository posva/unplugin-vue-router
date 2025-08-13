import { TransformResult } from 'vite'
import { expect, describe, it } from 'vitest'
import { definePageTransform, extractDefinePageNameAndPath } from './definePage'

const sampleCode = `
<script setup>
const a = 1
definePage({
  name: 'custom',
  path: '/custom',
})
const b = 1
</script>

<template>
  <div>hello</div>
</template>
      `

describe('definePage', () => {
  it('removes definePage', async () => {
    const result = (await definePageTransform({
      code: sampleCode,
      id: 'src/pages/basic.vue',
    })) as Exclude<TransformResult, string>

    expect(result).toHaveProperty('code')
    expect(result?.code).toMatchSnapshot()
  })

  describe('imports', () => {
    it('keeps used named imports', async () => {
      const result = (await definePageTransform({
        code: `
<script setup>
import { my_var, not_used, my_func, my_num } from './lib'
definePage({
  meta: {
    [my_var]: 'hello',
    other: my_func,
    custom() {
      return my_num
    }
  }
})
</script>
`,
        id: 'src/pages/with-imports.vue&definePage&vue&lang.ts',
      })) as Exclude<TransformResult, string>
      expect(result).toHaveProperty('code')
      expect(result?.code).toMatchSnapshot()
    })

    it('keeps used default imports', async () => {
      const result = (await definePageTransform({
        code: `
<script setup>
import my_var from './lib'
definePage({
  meta: {
    [my_var]: 'hello',
  }
  })
</script>
`,
        id: 'src/pages/with-imports.vue&definePage&vue&lang.ts',
      })) as Exclude<TransformResult, string>
      expect(result).toHaveProperty('code')
      expect(result?.code).toMatchSnapshot()
    })

    it('removes default import if not used', async () => {
      const result = (await definePageTransform({
        code: `
<script setup>
import my_var from './lib'
definePage({name: 'ok'})
</script>
`,
        id: 'src/pages/with-imports.vue&definePage&vue&lang.ts',
      })) as Exclude<TransformResult, string>
      expect(result).toHaveProperty('code')
      expect(result?.code).toMatchSnapshot()
    })

    it('works with star imports', async () => {
      const result = (await definePageTransform({
        code: `
<script setup>
import * as lib from './my-lib'
definePage({
  meta: {
    [lib.my_var]: 'hello',
  }
  })
</script>
`,
        id: 'src/pages/with-imports.vue&definePage&vue&lang.ts',
      })) as Exclude<TransformResult, string>
      expect(result).toHaveProperty('code')
      expect(result?.code).toMatchSnapshot()
    })

    it('removes star imports if not used', async () => {
      const result = (await definePageTransform({
        code: `
<script setup>
import * as lib from './my-lib'
definePage({name: 'ok'})
</script>
`,
        id: 'src/pages/with-imports.vue&definePage&vue&lang.ts',
      })) as Exclude<TransformResult, string>
      expect(result).toHaveProperty('code')
      expect(result?.code).toMatchSnapshot()
    })

    it('works when combining named and default imports', async () => {
      const result = (await definePageTransform({
        code: `
<script setup>
import my_var, { not_used, my_func, not_used_either } from './lib'
definePage({
  meta: {
    [my_var]: 'hello',
    other: my_func,
  }
})
</script>
`,
        id: 'src/pages/with-imports.vue&definePage&vue&lang.ts',
      })) as Exclude<TransformResult, string>
      expect(result).toHaveProperty('code')
      expect(result?.code).toMatchSnapshot()
    })
  })

  it('works with jsx', async () => {
    const code = `
    const a = 1
    definePage({
      name: 'custom',
      path: '/custom',
    })
    const b = 1
    `,
      result = (await definePageTransform({
        code,
        id: 'src/pages/basic.jsx?definePage&lang.jsx',
      })) as Exclude<TransformResult, string>
    expect(result).toBeDefined()
    expect(result).toHaveProperty('code')
    expect(result?.code).toMatchSnapshot()
  })

  it('handles definePage using a variable from setup gracefully', async () => {
    const code = `
<script setup>
const a = 1
definePage({
  name: a,
})
</script>
`
    const result = await definePageTransform({
      code,
      id: 'src/pages/basic.vue&definePage&vue',
    })

    // Should return empty object instead of throwing
    expect(result).toBe('export default {}')
  })

  it('extracts name and path', async () => {
    expect(
      await extractDefinePageNameAndPath(sampleCode, 'src/pages/basic.vue')
    ).toEqual({
      name: 'custom',
      path: '/custom',
    })
  })

  it('extract name skipped when non existent', async () => {
    expect(
      await extractDefinePageNameAndPath(
        `
<script setup>
const a = 1
const b = 1
</script>

<template>
  <div>hello</div>
</template>
      `,
        'src/pages/basic.vue'
      )
    ).toBeFalsy()
  })

  it('works with comments', async () => {
    const code = `
<script setup>
// definePage
</script>

<template>
  <div>hello</div>
</template>
      `
    // no need to transform
    let result = (await definePageTransform({
      code,
      id: 'src/pages/basic.vue',
    })) as Exclude<TransformResult, string>
    expect(result).toBeFalsy()

    // should give an empty object
    result = (await definePageTransform({
      code,
      id: 'src/pages/basic.vue?definePage&vue',
    })) as Exclude<TransformResult, string>

    expect(result).toBe('export default {}')
  })

  it('works if file is named definePage', async () => {
    const result = (await definePageTransform({
      code: sampleCode,
      id: 'src/pages/definePage.vue',
    })) as Exclude<TransformResult, string>

    expect(result).toHaveProperty('code')
    // should be the sfc without the definePage call
    expect(result?.code).toMatchSnapshot()

    expect(
      await definePageTransform({
        code: sampleCode,
        id: 'src/pages/definePage.vue?definePage&vue',
      })
    ).toMatchObject({
      code: `\
export default {
  name: 'custom',
  path: '/custom',
}`,
    })

    expect(
      await extractDefinePageNameAndPath(sampleCode, 'src/pages/definePage.vue')
    ).toEqual({
      name: 'custom',
      path: '/custom',
    })
  })

  describe('error handling', () => {
    it('handles syntax errors gracefully when extracting definePage', async () => {
      const codeWithSyntaxError = `
<script setup>
definePage({
  name: 'test',,  // syntax error: extra comma
  path: '/test'
})
</script>

<template>
  <div>hello</div>
</template>
      `
      
      const result = await definePageTransform({
        code: codeWithSyntaxError,
        id: 'src/pages/broken.vue?definePage&vue',
      })

      // Should return empty object instead of crashing
      expect(result).toBe('export default {}')
    })

    it('handles syntax errors gracefully when removing definePage from source', async () => {
      const codeWithSyntaxError = `
<script setup>
const a = 1
definePage({
  name: 'test',,  // syntax error: extra comma
  path: '/test'
})
const b = 1
</script>

<template>
  <div>hello</div>
</template>
      `
      
      const result = await definePageTransform({
        code: codeWithSyntaxError,
        id: 'src/pages/broken.vue',
      })

      // Should return undefined (no transform) instead of crashing
      expect(result).toBeUndefined()
    })

    it('handles malformed definePage object gracefully', async () => {
      const codeWithMalformedObject = `
<script setup>
definePage({
  name: 'test'
  path: '/test'  // missing comma
})
</script>
      `
      
      const result = await definePageTransform({
        code: codeWithMalformedObject,
        id: 'src/pages/malformed.vue?definePage&vue',
      })

      expect(result).toBe('export default {}')
    })

    it('handles completely invalid JavaScript syntax gracefully', async () => {
      const codeWithInvalidSyntax = `
<script setup>
definePage({
  name: 'test',
  path: '/test'
  invalid javascript syntax here ###
})
</script>
      `
      
      const result = await definePageTransform({
        code: codeWithInvalidSyntax,
        id: 'src/pages/invalid.vue?definePage&vue',
      })

      expect(result).toBe('export default {}')
    })

    it('handles extractDefinePageNameAndPath with syntax errors gracefully', async () => {
      const codeWithSyntaxError = `
<script setup>
definePage({
  name: 'test',,  // syntax error: extra comma
  path: '/test'
})
</script>
      `
      
      const result = await extractDefinePageNameAndPath(
        codeWithSyntaxError,
        'src/pages/broken.vue'
      )

      // Should return null/undefined instead of crashing
      expect(result).toBeUndefined()
    })

    it('handles unclosed brackets in definePage gracefully', async () => {
      const codeWithUnclosedBracket = `
<script setup>
definePage({
  name: 'test',
  path: '/test'
  // missing closing bracket
</script>
      `
      
      const result = await definePageTransform({
        code: codeWithUnclosedBracket,
        id: 'src/pages/unclosed.vue?definePage&vue',
      })

      expect(result).toBe('export default {}')
    })
  })
})
