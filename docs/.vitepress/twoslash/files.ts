import fs from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export const extraFiles = {
  '@/stores/index.ts': fs.readFileSync(
    join(__dirname, './code/stores.ts'),
    'utf-8'
  ),

  'shims-vue.d.ts': `
declare module '*.vue' {
  import { defineComponent } from 'vue'
  export default defineComponent({})
}
`.trimStart(),
}
