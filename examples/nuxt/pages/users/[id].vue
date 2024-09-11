<script lang="ts">
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useUserData = defineBasicLoader(
  'users-id',
  async (route) => {
    console.log('fetching user...')
    await delay(1000)
    const user = {
      id: route.params.id,
      when: Date.now(),
      n: Math.round(Math.random() * 10000),
      name: 'John Doe',
    }
    console.table(user)
    return user
  },
  { key: 'user' }
)
</script>

<script setup lang="ts">
defineOptions({
  __loaders: [useUserData],
})

const { data: user } = useUserData()
const route = useRoute('users-id')
</script>

<template>
  <div>
    <h1>User {{ route.params.id }}</h1>
    <pre>{{ user }}</pre>
  </div>
</template>
