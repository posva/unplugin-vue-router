import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/*.ts'],
  clean: true,
  format: ['esm', 'cjs'],
  dts: true,
  cjsInterop: true,
  external: ['@vue/compiler-sfc', 'vue', 'vue-router'],
})
