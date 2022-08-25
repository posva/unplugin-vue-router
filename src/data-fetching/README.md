# Experimental Data Fetching

⚠️ Warning: This is an experimental feature and API could change anytime

- [RFC discussion](https://github.com/vuejs/rfcs/discussions/460): Note that not everything is implemented yet.

## Installation

Install the unplugin-vue-router library as described in its [main `README.md`](../../README.MD)

## Usage

The data fetching layer is easier to use alongside the `unplugin-vue-router` plugin because it writes the boring _"plumbing-code"_ for you and lets you focus on the interesting part with `defineLoader()`. It's highly recommended to use the `unplugin-vue-router` plugin if you can. Below are instructions to setup in both scenarios:

### Setup

To enable data fetching, you must setup the navigation guards with `setupDataFetchingGuard()`:

```ts
import { setupDataFetchingGuard, createRouter } from 'vue-router/auto'

const router = createRouter({
  //...
})

setupDataFetchingGuard(router)
```

### With `unplugin-vue-router`

If you are using the route generation of `unplugin-vue-router`, you can make the injection of the meta field automatic:

```ts
// vite.config.ts
plugins: [
  VueRouter({
    dataFetching: true,
  }),
]
```

### Without `unplugin-vue-router`

You must manually provide a new `meta` field to **each route that exports a data loader**:

```ts
import { HasDataLoaderSymbol } from 'vue-router/auto'

const router = createRouter({
  routes: [
    {
      path: '/users/:id',
      component: () => import('@/src/pages/users/[id].vue'),
      meta: {
        [HasDataLoaderSymbol]: () => import('@/src/pages/users/[id].vue'),
      },
    },
  ],
})
```

### `defineLoader()` usage

To define data loaders, you must use the `defineLoader()` function:

```vue
<script lang="ts">
import { getUserById } from '../api'
import { defineLoader } from 'vue-router/auto'

// name the loader however you want **and export it**
export const useUserData = defineLoader(async (route) => {
  const user = await getUserById(route.params.id)
  // ...
  // return anything you want to expose
  return user
})

// Optional: define other component options
export default defineComponent({
  name: 'custom-name',
  inheritAttrs: false,
})
</script>

<script lang="ts" setup>
// find the user as `data` and some other properties
const { data: user, pending, error, refresh } = useUserData()
// data is always present, pending changes when going from '/users/2' to '/users/3'
</script>
```

Find more details on [the RFC](https://github.com/vuejs/rfcs/discussions/460)

### SSR

To support SSR we need to do two things:

- Pass a `key` to each loader so that it can be serialized into an object later. Would an array work? I don't think the order of execution is guaranteed.
- On the client side, pass the initial state to `setupDataFetchingGuard()`. The initial state is used once and discarded afterwards.

```ts
export const useBookCollection = defineLoader(
  async () => {
    const books = await fetchBookCollection()
    return books
  },
  { key: 'bookCollection' }
)
```

The configuration of `setupDataFetchingGuard()` depends on the SSR configuration, here is an example with vite-ssg:

```ts
import { ViteSSG } from 'vite-ssg'
import { setupDataFetchingGuard } from 'vue-router/auto'
import App from './App.vue'
import { routes } from './routes'

export const createApp = ViteSSG(
  App,
  { routes },
  async ({ router, isClient, initialState }) => {
    // fetchedData will be populated during navigation
    const fetchedData = setupDataFetchingGuard(router, {
      initialData: isClient
        ? // on the client we pass the initial state
          initialState.vueRouter
        : // on server we want to generate the initial state
          undefined,
    })

    // on the server, we serialize the fetchedData
    if (!isClient) {
      initialState.vueRouter = fetchedData
    }
  }
)
```

Note that `setupDataFetchingGuard()` **should be called before `app.use(router)`** so it takes effect on the initial navigation. Otherwise a new navigation must be triggered after the navigation guard is added.

Find more details on [the RFC](https://github.com/vuejs/rfcs/discussions/460)

## Auto imports

If you use [unplugin-auto-import](https://github.com/antfu/unplugin-auto-import), you can use its preset to automatically have access to `defineLoader()` and other imports:

```ts
// vite.config.ts
import { VueRouterAutoImports } from 'unplugin-vue-router'

export default defineConfig({
  // ... other options
  plugins: [
    VueRouter({
      dataFetching: true,
    }),
    AutoImport({
      imports: [VueRouterAutoImports],
    }),
  ],
})
```
