<script lang="ts">
import { defineColadaLoader } from 'unplugin-vue-router/runtime'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const simulateError = ref(false)

// th

export const useUserData = defineColadaLoader('/users/colada-loader.[id]', {
  async query(to) {
    console.log('[🍹] coladaLoader', to.fullPath)
    // we need to read these before the delay
    const id = to.params.id
    // @ts-expect-error: no param "name"!
    const name = to.params.name
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
  key: (to) => {
    console.log('[🍹] key', to.fullPath)
    return ['users', to.params.id]
  },
})
</script>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { serialize } from '@pinia/colada'
import { getActivePinia } from 'pinia'

const route = useRoute('/users/colada-loader.[id]')

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
  isLoading: pcIsFetching,
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

    <h2>PC 🍍🍹</h2>

    <p>
      <code>status: {{ status }}</code>
      <br />
      <code>isFetching: {{ pcIsFetching }}</code>
    </p>
    <pre v-if="pcError">Error: {{ pcError }}</pre>
    <pre v-else>{{ pcUSer == null ? String(pcUSer) : pcUSer }}</pre>
  </main>
</template>
