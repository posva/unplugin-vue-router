import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/*.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
  external: ['@vue/compiler-sfc', 'vue', 'vue-router'],
  cjsInterop: true,
  splitting: true,
})
