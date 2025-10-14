# Nuxt

Currently, this plugin is included as an experimental setting in Nuxt. You can enable it by adding the following to your `nuxt.config.ts`:

```ts{2-4}
export default defineNuxtConfig({
  experimental: {
    typedPages: true,
  },
})
```

The `sfc-typed-router` Volar plugin, that automatically types `useRoute()` and `$route` in page components, cannot be enabled using a feature flag in Nuxt at this time. Read how to enable it here: [Using the `sfc-typed-router` Volar plugin](/guide/typescript#using-the-sfc-typed-router-volar-plugin).
