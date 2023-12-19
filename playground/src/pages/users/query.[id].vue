<script lang="ts">
import { defineQueryLoader } from 'unplugin-vue-router/runtime'
export const myExport = 'OUTSIDE SETUP TEST'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// NOTE: it's a bit different from the one in /[name].vue
export const useUserData = defineQueryLoader(
  '/users/[id]',
  async (route) => {
    await delay(700)
    const user = {
      id: route.params.id,
      // @ts-expect-error: no param "name"!
      name: route.params.name || 'Edu',
      when: new Date().toUTCString(),
    }
    return user
  },
  {
    // key: ['user-id'],
    queryKey: ['user-id'],
    lazy: false,
  }
)
</script>

<script lang="ts" setup>
const route = useRoute('/users/[id]')

const { data: user, pending, error } = useUserData()

definePage({
  beforeEnter(to) {
    if (Number.isNaN(Number(to.params.id))) {
      console.log('invalid param id', to.params.id)
      return false
    }
  },
})

const MY_VAL = 'INSIDE SETUP TEST'
</script>

<template>
  <main>
    <h1>defineQueryLoader()</h1>
    <pre>User: {{ route.params.id }}</pre>
    <p>{{ MY_VAL }}</p>

    <RouterLink :to="{ params: { id: Number(route.params.id) - 1 } }"
      >Previous</RouterLink
    >
    |
    <RouterLink :to="{ params: { id: Number(route.params.id) + 1 } }"
      >Next</RouterLink
    >

    <pre v-if="pending">Loading...</pre>
    <pre v-else-if="error">Error: {{ error }}</pre>
    <pre v-else>{{ user }}</pre>
  </main>
</template>

<route lang="ts">
const a = 20 as 20 | 30

console.log('WITHIN ROUTE_BLOCK', a)

export default {
  alias: '/u/:id',
  meta: {
    a,
    other: 'other',
  },
}
</route>
