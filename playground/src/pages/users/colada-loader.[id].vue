<script lang="ts" setup>
import { simulateError, useUserData } from '@/loaders/colada-loaders'
import { serializeTreeMap, useQueryCache } from '@pinia/colada'

definePage({
  meta: {
    title: 'Colada Loader',
  },
})

const route = useRoute('/users/colada-loader.[id]')
const queryCache = useQueryCache()
function copy() {
  console.log(JSON.parse(JSON.stringify(serializeTreeMap(queryCache.caches))))
}

const {
  //
  data: user,
  status,
  error,
  isLoading,
  asyncStatus,
  reload,
  refresh,
} = useUserData()
</script>

<template>
  <main>
    <h1>Pinia Colada Loader</h1>
    <pre>User: {{ route.params.id }}</pre>

    <fieldset>
      <legend>Controls</legend>

      <label>
        <input type="checkbox" v-model="simulateError" /> Throw on Fetch
      </label>
      <br />
      <button @click="refresh()">Refresh</button>
      <button @click="reload()">Refetch</button>
      <button @click="copy()">Copy</button>
    </fieldset>

    <RouterLink :to="{ params: { id: Number(route.params.id) - 1 } }"
      >Previous</RouterLink
    >
    |
    <RouterLink :to="{ params: { id: Number(route.params.id) + 1 } }"
      >Next</RouterLink
    >
    |
    <RouterLink :to="{ query: { v: Math.random() } }">Random query</RouterLink>

    <h2>PC 🍍🍹</h2>

    <p>
      <code>status: {{ status }}</code>
      |
      <code>asyncStatus: {{ asyncStatus }}</code>
      <br />
      <code>isFetching: {{ isLoading }}</code>
    </p>
    <pre v-if="error">Error: {{ error }}</pre>
    <pre v-else>{{ user == null ? String(user) : user }}</pre>
  </main>
</template>
