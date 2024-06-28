# Hot Module Replacement

When using `definePage()` and `<route>` blocks, it's possible to enable Hot Module Replacement (HMR) for your routes **and avoid the need of reloading the page or the server** when you make changes to your routes.

Enabling HMR is **strongly recommended** and currently **only works with Vite**.

```ts [src/router.ts]
import { createRouter, createWebHistory } from 'vue-router'
import {
  routes,
  handleHotUpdate, // [!code ++]
} from 'vue-router/auto-routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// This will update routes at runtime without reloading the page
if (import.meta.hot) { // [!code ++]
  handleHotUpdate(router) // [!code ++]
} // [!code ++]
```
