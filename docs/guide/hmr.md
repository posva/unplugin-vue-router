# Hot Module Replacement

When using `definePage()` and `<route>` blocks, it's possible to enable Hot Module Replacement (HMR) for your routes **and avoid the need of reloading the page or the server** when you make changes to your routes.

Enabling HMR is **strongly recommended** and currently **only works with Vite**. But you don't need to do anything, because this step has been done for you internally.

## Runtime routes

If you add routes at runtime, you will have to add them within a callback to ensure they are added during development.

```ts{16-23} [src/router.ts]
import { createWebHistory } from 'vue-router'
import { routes, createRouter } from 'vue-router/auto-routes'

export const router = createRouter(
  {
    history: createWebHistory(),
    routes,
  },
  () => {
    addRedirects()
  }
)

function addRedirects() {
  router.addRoute({
    path: '/new-about',
    redirect: '/about?from=/new-about',
  })
}
```


This is **optional**, you can also just reload the page.
