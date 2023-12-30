<script lang="ts">
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
</script>

<script lang="ts" setup>
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'

const route = useRoute('/users/[id]')

const {
  data: tqUser,
  isPending,
  error: tqError,
} = useQuery({
  async queryFn() {
    console.log('[TQ]useUserData', route.fullPath)
    await delay(500)
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
})
</script>

<template>
  <main>
    <h1>defineQueryLoader()</h1>
    <pre>User: {{ route.params.id }}</pre>

    <RouterLink :to="{ params: { id: Number(route.params.id) - 1 } }"
      >Previous</RouterLink
    >
    |
    <RouterLink :to="{ params: { id: Number(route.params.id) + 1 } }"
      >Next</RouterLink
    >

    <h2>TQ</h2>
    <pre v-if="isPending">Loading...</pre>
    <pre v-else-if="tqError">Error: {{ tqError }}</pre>
    <pre v-else>{{ tqUser }}</pre>
  </main>
</template>
