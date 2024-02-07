<script lang="ts">
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
</script>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useQuery, serialize } from '@pinia/colada'
import { getActivePinia } from 'pinia'

const route = useRoute('/users/colada-loader.[id]')

const simulateError = ref(false)

const pinia = getActivePinia()!
function copy() {
  console.log(
    JSON.parse(
      JSON.stringify(serialize(pinia.state.value._pc_query.entryRegistry))
    )
  )
}

const {
  data: pcUSer,
  status,
  error: pcError,
  isFetching: pcIsFetching,
  refetch,
  refresh,
} = useQuery({
  async query() {
    console.log('[🍹]useUserData', route.fullPath)
    // we need to read these before the delay
    const id = route.params.id
    // @ts-expect-error: no param "name"!
    const name = route.params.name
    await delay(500)
    if (simulateError.value) {
      throw new Error('Simulated Error')
    }
    const user = {
      id,
      name,
      when: new Date().toUTCString(),
    }
    return user
  },
  key: () => ['users', route.params.id],
  staleTime: 3000,
})
</script>

<template>
  <main>
    <h1>raw Pinia Colada</h1>
    <pre>User: {{ route.params.id }}</pre>

    <fieldset>
      <legend>Controls</legend>

      <label>
        <input type="checkbox" v-model="simulateError" /> Throw on Fetch
      </label>
      <br />
      <button @click="refresh()">Refresh</button>
      <button @click="refetch()">Refetch</button>
      <button @click="copy()">Copy</button>
    </fieldset>

    <RouterLink :to="{ params: { id: Number(route.params.id) - 1 } }"
      >Previous</RouterLink
    >
    |
    <RouterLink :to="{ params: { id: Number(route.params.id) + 1 } }"
      >Next</RouterLink
    >

    <h2>PC 🍍</h2>

    <p>
      <code>status: {{ status }}</code>
      <br />
      <code>isFetching: {{ pcIsFetching }}</code>
    </p>
    <pre v-if="pcError">Error: {{ pcError }}</pre>
    <pre v-else>{{ pcUSer == null ? String(pcUSer) : pcUSer }}</pre>
  </main>
</template>
