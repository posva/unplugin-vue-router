<script lang="ts">
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
</script>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import {
  useQuery,
  useQueries,
  useIsMutating,
  useIsFetching,
  useMutationState,
  useMutation,
  useQueryClient,
} from '@tanstack/vue-query'

const route = useRoute('/users/[id]')

const simulateError = ref(false)

const enabled = ref(true)
const queryClient = useQueryClient()
window.qc = queryClient

// queryClient.setQueryData(['user-id', 1], {
//   id: 1,
//   name: 'Edu',
//   when: new Date().toUTCString(),
// })
// queryClient.prefetchQuery({
//   queryKey: ['user-id', computed(() => route.params.id)],
//   // queryFn: async () => {
//   //   await delay(500)
//   //   return {
//   //     id: route.params.id,
//   //     name: 'Edu',
//   //     when: new Date().toUTCString(),
//   //   }
//   // },
// }).then((val) => {})

// const tt = useQueries({
//   queries: [
//     {
//       queryKey: ['random'],
//       queryFn: async () => Math.random(),
//     },
//     {
//       queryKey: ['a'],
//       queryFn: async () => 'a',
//     },
//   ],
//   combine: (res) => [res[0].data?.toFixed(2), res[1].data?.toUpperCase()] as const,
// })
const {
  data: tqUser,
  status,
  isLoading,
  isFetching,
  isPending,
  fetchStatus,
  error: tqError,
  refetch,
} = useQuery({
  async queryFn({ signal }) {
    console.log('[TQ]useUserData', route.fullPath)
    signal.addEventListener('abort', () => {
      console.log('[TQ]useUserData aborted ❌', signal.reason)
    })
    await delay(500)
    if (simulateError.value) {
      throw new Error('Simulated Error')
    }
    // signal.throwIfAborted()
    console.log('✅ returning data')
    const user = {
      id: route.params.id,
      // @ts-expect-error: no param "name"!
      name: route.params.name || 'Edu',
      when: new Date().toUTCString(),
    }
    return user
  },
  placeholderData: () => ({
    id: route.params.id,
    name: 'Loading...',
    when: new Date().toUTCString(),
  }),
  queryKey: ['user-id', computed(() => route.params.id)],
  staleTime: 0,
  retry: false,
  refetchOnMount: true,
  refetchOnWindowFocus(query) {
    console.log('[TQ]refetchOnWindowFocus', query)
    return true
  },
  enabled,
})

let _id = 0
function testRefetch() {
  const id = ++_id
  console.log(id + ' refetch started')
  refetch({ cancelRefetch: true, throwOnError: true })
    .then((res) => {
      console.log(id + ' refetch finished', res)
    })
    .catch((err) => {
      console.log(id + ' refetch error', err)
    })
    .finally(() => {
      console.log(id + ' refetch finally')
    })
}

const {
  data,
  error,
  mutate,
  status: mutSate,
} = useMutation({
  // mutationKey: ['hey'],
  networkMode: 'always',
  onMutate(vars) {},
  mutationFn: async (id: number) => {
    if (simulateError.value) {
      throw new Error('Simulated Error')
    }
    await delay(1000)
    if (simulateError.value) {
      throw new Error('Simulated Error')
    }
    return 'hey'
  },
  onSettled(data, error, vars) {
    console.log('onSettled', data, error, vars)
  },
  onError(err, vars) {
    console.log('onError', err, vars)
    return { hoho: true }
  },
  onSuccess(data, vars) {
    console.log('onSuccess', data, vars)
  },
  // gcTime: 5_000,
})
</script>

<template>
  <main>
    <h1>TanStack Query</h1>
    <pre>User: {{ route.params.id }}</pre>

    <label>
      <input type="checkbox" v-model="enabled" />
      Enabled
    </label>

    <pre>
      Mutation
      {{ data }}
      {{ error }}
      {{ mutSate }}
    </pre>

    <button @click="mutate(Math.round(Math.random() * 100))">Mutate</button>

    <fieldset>
      <legend>Controls</legend>

      <label>
        <input type="checkbox" v-model="simulateError" /> Throw on Fetch
      </label>
      <br />
      <button @click="refetch({ cancelRefetch: false })">Refresh</button>
      <button @click="testRefetch()">Refresh 2</button>
    </fieldset>

    <RouterLink :to="{ params: { id: Number(route.params.id) - 1 } }"
      >Previous</RouterLink
    >
    |
    <RouterLink :to="{ params: { id: Number(route.params.id) + 1 } }"
      >Next</RouterLink
    >

    <h2>TQ</h2>

    <p>
      <code>status: {{ status }}</code>
      <br />
      isLoading: {{ isLoading }}
      <br />
      isFetching: {{ isFetching }}
      <br />
      isPending: {{ isPending }}
      <br />
      <code>fetchStatus: {{ fetchStatus }}</code>
    </p>
    <pre v-if="tqError">Error: {{ tqError }}</pre>
    <pre>data: {{ tqUser == null ? String(tqUser) : tqUser }}</pre>
  </main>

  <VueQueryDevtools />
</template>
