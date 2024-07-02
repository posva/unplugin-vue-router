# `defineLoader()` notes

## Vue Query

Link: <https://vue-query.vercel.app/#/guides/queries>

Demo from docs

```vue
<script setup>
import { useQuery } from 'vue-query'

function useTodosQuery() {
  return useQuery('todos', fetchTodoList)
}

const { isLoading, isError, data, error } = useTodosQuery()
</script>
```

Target API

Simple query

```vue
<script>
import { useQuery } from 'vue-query'

// options are combined loader options + vue-query options
export const useTodos = defineQueryLoader(fetchTodoList, { key: 'todos' })

export const useContact = defineQueryLoader(
  async (to) => {
    const contact = await fetchContact(to.params.id)
  },
  {
    key: (to) => ['contact', to.params.id],
  }
)
</script>

<script setup>
const { isLoading, isError, data, error } = useTodos()
// data is always present
</script>
```

- They could allow passing multiple queries and internally call `useQueries()` (<https://vue-query.vercel.app/#/guides/parallel-queries?id=dynamic-parallel-queries-with-usequeries>)

- SSR: they have their own API with `hydrate`, `dehydrate` and a `QueryClient` class. They will likely need to pass the initial state to the `setupDataFetchingGuard()` `initialData` option.

TODO:

- What is the caching mechanism inside
- What are the ops needed:
  - Create
  - Update
  - Invalidate
  - Fail/Success

## Vue Apollo

Very similar to vue query in terms of need and API:

```ts
const useTodos = defineQueryLoader(fetchTodoList, {
  // the key seems to be inferred automatically
})
```

To pass variables based on the route, a function could be allowed

```ts
const useContact = defineQueryLoader(fetchContact, (to) => {
  id: to.params.id
})
```

Vue apollo automatically calls again the query when the variables change. we need a way to create a computed variable from the function passed to `defineQueryLoader`. There is also a `refetch()` function, maybe the argument can be passed at that time to invoke the function during a navigation.

## VueFire

```ts
const useUserProfile = defineFirestoreLoader(to => ['users', to.params.id])
const useUserProfile = defineFirestoreLoader(to => doc(useFirestore(), 'users', to.params.id)
```

## Vue SWR
