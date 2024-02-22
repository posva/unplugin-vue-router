<script lang="ts">
// FIXME: should be able to import from vue-router or auto import
import { defineQueryLoader } from 'unplugin-vue-router/runtime'

import {
  type TypesConfig,
  type RouteRecordName,
} from 'unplugin-vue-router/types'
const a: RouteRecordName = '/articles'

// import type { RouteLocationNormalized, _RouteLocationNormalized } from 'vue-router/auto'
import type {
  RouteLocationNormalized,
  RouteLocationNormalized as _RouteLocationNormalized,
} from 'vue-router/auto'

declare const b: RouteLocationNormalized<'/[name]'>
declare const c: _RouteLocationNormalized<'/[name]'>

function test(fn: (to: _RouteLocationNormalized) => void): void
function test<Name extends RouteRecordName>(
  name: Name,
  fn: (to: _RouteLocationNormalized<Name>) => void
): void
function test<Name extends RouteRecordName>(...args: unknown[]) {}

test('/[name]', (to) => {
  to.params.name
  // @ts-expect-error
  to.params.nope
})

test('/@[profileId]' as RouteRecordName, (to) => {
  // @ts-expect-error: no all params have this
  to.params.profileId
  if (to.name === '/users/[id].edit') {
    to.params.id
    // @ts-expect-error: no param other
    to.params.other
  }
})

test((to) => {
  // @ts-expect-error: not all params object have a name
  to.params.name
  // @ts-expect-error: no route named like that
  if (to.name === '') {
  }
  if (to.name === '/articles/[id]') {
    to.params.id
    // @ts-expect-error: no param other
    to.params.other
  }
})

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// FIXME: export once doable
// NOTE: it's a bit different from the one in /[name].vue
const useUserData = defineQueryLoader(
  '/users/[id]',
  async (route, { signal }) => {
    console.log('useUserData', route.fullPath)
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
    queryKey: ['user-id'],
    // queryKey: (route) => ['users', route.params.id],
    staleTime: 5000,
    lazy: false,
  }
)
</script>

<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query'
const route = useRoute('/users/[id]')

const { data: user, isLoading, error } = useUserData()
const {
  data: tqUser,
  error: tqError,
  status,
  fetchStatus,
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
  // FIXME: (to) => ['user-id', to.params.id]
  queryKey: ['users', () => route.params.id],
  staleTime: 5000,
})
</script>

<template>
  <main>
    <h1>defineQueryLoader()</h1>
    <pre>route.params.id: {{ route.params.id }}</pre>

    <RouterLink :to="{ params: { id: Number(route.params.id) - 1 } }"
      >Previous</RouterLink
    >
    |
    <RouterLink :to="{ params: { id: Number(route.params.id) + 1 } }"
      >Next</RouterLink
    >

    <h2>Data Loaders</h2>
    <pre v-if="isLoading">Loading...</pre>
    <pre v-else-if="error">Error: {{ error }}</pre>
    <pre v-else>{{ user }}</pre>

    <hr />

    <h2>TQ</h2>

    <p>
      <code>status: {{ status }}</code>
      <br />
      <code>fetchStatus: {{ fetchStatus }}</code>
    </p>
    <pre v-if="tqError">Error: {{ tqError }}</pre>
    <pre v-else>{{ tqUser == null ? String(tqUser) : tqUser }}</pre>
  </main>
</template>
