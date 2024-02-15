# `defineColadaLoader()`

Loaders that use [@pinia/colada](https://github.com/posva/pinia-colada) under the hood. These loaders provide a more efficient way to have asynchronous state with cache, ssr support and more.

The key used in these loaders are directly passed to `useQuery()` from `@pinia/colada` and are therefore invalidated by `useMutation()` calls.

## Setup

Follow the instructions in [@pinia/colada](https://github.com/posva/pinia-colada).

## Example

```vue
<script lang="ts">
import { defineColadaLoader } from 'unplugin-vue-router/runtime'
import { getUserById } from '../api'

export const useUserData = defineColadaLoader({
  async query(to, { signal }) {
    return getUserById(to.params.id, { signal })
  },
  key: (to) => ['users', to.params.id],
  // Keep the data "fresh" 10 seconds to avoid fetching the same data too often
  staleTime: 10000,
})
</script>

<script lang="ts" setup>
const route = useRoute('/users/[id]')

const {
  user,
  status,
  error
  isLoading,
  reload,
  refresh,
} = useUserData()
</script>

<template>
  <main>
    <h1>Pinia Colada Loader Example</h1>
    <pre>User: {{ route.params.id }}</pre>

    <fieldset>
      <legend>Controls</legend>

      <button @click="refresh()">Refresh</button>
      <button @click="reload()">Refetch</button>
    </fieldset>

    <RouterLink :to="{ params: { id: Number(route.params.id) || 0 - 1 } }"
      >Previous</RouterLink
    >
    |
    <RouterLink :to="{ params: { id: Number(route.params.id) || 0 + 1 } }"
      >Next</RouterLink
    >

    <h2>State</h2>

    <p>
      <code>status: {{ status }}</code>
      <br />
      <code>isLoading: {{ isLoading }}</code>
    </p>
    <pre v-if="error">Error: {{ error }}</pre>
    <pre v-else>{{ user == null ? String(user) : user }}</pre>
  </main>
</template>
```

::: tip
Pass a route name to `defineColadaLoader` to get typed routes in the `query` function.

```ts
export const useUserData = defineColadaLoader('/users/[id]', {
  // ...
})
```

:::

## Refresh by default

To avoid unnecessary frequent refreshes, Pinia Colada refreshes the data when navigating (instead of _refetching_). Change the `staleTime` option to control how often the data should be refreshed, e.g. setting it to 0 will refresh the data every time the route changes.

## Route tracking

The `query` function tracks what is used in the `to` parameter and will only refresh the data if **tracked** properties change. This means that if you use `to.params.id` in the `query` function, it will only refetch the data if the `id` parameter changes but not if other properties like `to.query`, `to.hash` or even `to.params.other` change.
