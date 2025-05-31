<script lang="ts">
import { defineColadaLoader } from 'unplugin-vue-router/data-loaders/pinia-colada'
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useUserData = defineColadaLoader('users-colada-userId', {
  key: (to) => ['user', to.params.userId],
  async query(to) {
    console.log('fetching user...')
    const user = {
      id: to.params.userId,
      when: Date.now(),
      n: Math.round(Math.random() * 10000),
      name: 'John Doe',
    }
    await delay(1000)
    console.table(user)
    return user
  },
  // can be flexible
  // lazy: (to, from) => !!(from && to.name === from.name),
  lazy: false,
})
</script>

<script setup lang="ts">
const { state: user, isLoading, refresh, refetch } = useUserData()
const route = useRoute('users-colada-userId')
</script>

<template>
  <div>
    <button @click="refresh()">Refresh</button>
    <button @click="refetch()">Refetch</button>
    <hr />

    <h1>User {{ route.params.userId }}</h1>
    <p v-if="user.error">An error ocurred: {{ user.error.message }}</p>

    <!-- display both -->
    <h3>Display all state</h3>

    <p v-if="isLoading">Loading fresh data...</p>
    <pre v-if="user.data">{{ user.data }}</pre>

    <hr />

    <h3>Display one of them</h3>

    <template v-if="user.status === 'success'">
      <p v-if="isLoading">Loading fresh data...</p>
      <pre v-else>{{ user.data }}</pre>
    </template>
    <template v-else>
      <p v-if="isLoading">Loading fresh data...</p>
      <div v-else>
        <p>Something went wrong...</p>
        <p v-if="user.error">{{ user.error }}</p>
        <button @click="refresh()">Retry</button>
      </div>
    </template>
  </div>
</template>
