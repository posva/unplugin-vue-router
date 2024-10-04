<script lang="ts">
import { defineColadaLoader } from 'unplugin-vue-router/data-loaders/pinia-colada'
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useUserData = defineColadaLoader('users-colada-userId', {
  key: (to) => ['user', to.params.userId],
  async query(to) {
    console.log('fetching user...')
    await delay(1000)
    const user = {
      id: to.params.userId,
      when: Date.now(),
      n: Math.round(Math.random() * 10000),
      name: 'John Doe',
    }
    console.table(user)
    return user
  },
  // TODO: could display existing data
  // lazy: (to, from) => !from || to.name !== from.name,
  lazy: false,
})
</script>

<script setup lang="ts">
defineOptions({
  __loaders: [useUserData],
})

const { data: user, error, isLoading, refresh } = useUserData()
const route = useRoute('users-colada-userId')
</script>

<template>
  <div>
    <h1>User {{ route.params.userId }}</h1>
    <p v-if="error">An error ocurred: {{ error.message }}</p>

    <!-- display both -->
    <h3>Display both</h3>
    <p v-if="isLoading">Loading fresh data...</p>
    <pre v-if="user">{{ user }}</pre>

    <hr />
    <h3>Display one of them</h3>
    <template v-if="user">
      <p v-if="isLoading">Loading fresh data...</p>
      <pre v-else>{{ user }}</pre>
    </template>
    <template v-else>
      <p v-if="isLoading">Loading fresh data...</p>
      <div v-else>
        <p>Something went wrong...</p>
        <p v-if="error">{{ error }}</p>
        <button @click="refresh()">Retry</button>
      </div>
    </template>
  </div>
</template>
