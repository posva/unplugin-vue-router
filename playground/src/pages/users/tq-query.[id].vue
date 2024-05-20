<script lang="ts">
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
</script>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import {
  useQuery,
  useQueries,
  useIsMutating,
  useIsFetching,
  useMutationState,
} from '@tanstack/vue-query'

const route = useRoute('/users/[id]')

const simulateError = ref(false)

const enabled = ref(false)

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
  async queryFn() {
    console.log('[TQ]useUserData', route.fullPath)
    await delay(500)
    if (simulateError.value) {
      throw new Error('Simulated Error')
    }
    const user = {
      id: route.params.id,
      // @ts-expect-error: no param "name"!
      name: route.params.name || 'Edu',
      when: new Date().toUTCString(),
    }
    return user
  },
  queryKey: ['user-id', computed(() => route.params.id)],
  staleTime: 5000,
  retry: false,
  refetchOnMount: false,
  enabled,
})
</script>

<template>
  <main>
    <h1>defineQueryLoader()</h1>
    <pre>User: {{ route.params.id }}</pre>

    <label>
      <input type="checkbox" v-model="enabled" />
      Enabled
    </label>

    <fieldset>
      <legend>Controls</legend>

      <label>
        <input type="checkbox" v-model="simulateError" /> Throw on Fetch
      </label>
      <br />
      <button @click="refetch()">Refresh</button>
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
      <br>
      isLoading: {{ isLoading }}
      <br />
      isFetching: {{ isFetching }}
      <br />
      isPending: {{ isPending }}
      <br />
      <code>fetchStatus: {{ fetchStatus }}</code>
    </p>
    <pre v-if="tqError">Error: {{ tqError }}</pre>
    <pre v-else>{{ tqUser == null ? String(tqUser) : tqUser }}</pre>
  </main>
</template>
