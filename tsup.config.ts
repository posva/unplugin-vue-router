import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/*.ts'],
  clean: true,
  define: {
    __DEV__: "process.env.NODE_ENV !== 'production'",
  },
  format: ['cjs', 'esm'],
  dts: true,
  external: ['@vue/compiler-sfc', 'vue', 'vue-router'],
  onSuccess: 'npm run build:fix',
})
