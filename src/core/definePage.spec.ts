import { expect, describe, it } from 'vitest'
import { definePageTransform, extractDefinePageNameAndPath } from './definePage'

describe('definePage', () => {
  it('removes definePage', async () => {
    const result = await definePageTransform({
      code: `
<script setup>
const a = 1
definePage({
  name: 'custom',
  path: '/custom',
})
const b = 1
</script>
      `,
      id: 'src/pages/basic.vue',
    })

    const code = typeof result === 'string' ? result : result?.code

    expect(code).toMatchInlineSnapshot(`
      "
      <script setup>
      const a = 1

      const b = 1
      </script>
            "
    `)
  })

  it('extracts name and path', async () => {
    expect(
      await extractDefinePageNameAndPath(
        `
<script setup>
const a = 1
definePage({
  name: 'custom',
  path: '/custom',
})
const b = 1
</script>
      `,
        'src/pages/basic.vue'
      )
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
      `,
        'src/pages/basic.vue'
      )
    ).toEqual(undefined)
  })
})
