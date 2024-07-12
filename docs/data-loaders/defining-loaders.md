# Defining Data Loaders

In order to use data loaders, you need to define them first. Data loaders themselves are the composables returned by the different `defineLoader` functions. Each loader definition is specific to the `defineLoader` function used. For example, `defineBasicLoader` expects an async function as the first argument while `defineColadaLoader` expects an object with a `query` function. All loaders should allow to pass an async function that can throw errors, and `NavigationResult`.

Any composables returned by _any_ `defineLoader` function share the same signature:

```vue twoslash
<script lang="ts">
import 'unplugin-vue-router/client'
import './typed-router.d'
// ---cut---
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'
import { getUserById } from '../api'

export const useUserData = defineBasicLoader('/users/[id]', async (route) => {
  return getUserById(route.params.id)
})
</script>

<script setup lang="ts">
// hello // [!code focus:7]
const {
  data: user, // the data returned by the loader
  isLoading, // a boolean indicating if the loader is fetching data
  error, // an error object if the loader failed
  reload, // a function to refetch the data without navigating
} = useUserData()
</script>
```

**But they are not limited by it!** For example, the `defineColadaLoader` function returns a composable with a few more properties like `status` and `refresh`. Because of this it's important to refer to the documentation of the specific loader you are using.

This page will guide you through the **foundation** of defining data loaders, no matter their implementation.

## The loader function

The loader function is the _core_ of data loaders. They are asynchronous functions that return the data you want to expose in the `data` property of the returned composable.

### The `to` argument

The `to` argument represents the location object we are navigating to. It should be used as the source of truth for all data fetching parameters.

```ts twoslash
import 'unplugin-vue-router/client'
import './typed-router.d'
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'
import { getUserById } from '../api'
// ---cut---
export const useUserData = defineBasicLoader('/users/[id]', async (to) => {
  const user = await getUserById(to.params.id)
  // here we can modify the data before returning it
  return user
})
```

By using the route location to fetch data, we ensure a consistent relationship between the data and the URL, **improving the user experience**.

### Side effects

It's important to avoid side effects in the loader function. Don't call `watch`, or create reactive effects like `ref`, `toRefs()`, `computed`, etc.

## Accessing Global Properties

In the loader function, you can access global properties like the router instance, a store, etc. This is because using `inject()` within the loader function **is possible**. Since loaders are asynchronous, make sure you are using the `inject` function **before any `await`**:

```ts twoslash
import 'unplugin-vue-router/client'
import './typed-router.d'
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'
import { getUserById } from '../api'
// ---cut---
import { inject } from 'vue'
import { useSomeStore } from '@/stores'

export const useUserData = defineBasicLoader('/users/[id]', async (to) => {
  // ✅ This will work
  const injectedValue = inject('key') // [!code ++]
  const store = useSomeStore() // [!code ++]

  const user = await getUserById(to.params.id)
  // ❌ These won't work
  const injectedValue2 = inject('key') // [!code error]
  const store2 = useSomeStore() // [!code error]
  // ...
  return user
})
```

<!--
Why doesn't this work?
  // @error: Custom error message
-->

## Options

All

## Connecting a loader to a page

## Why
