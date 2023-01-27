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
