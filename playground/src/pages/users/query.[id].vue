<script lang="ts">
// FIXME: should be able to import from vue-router or auto import
// import { defineQueryLoader } from 'unplugin-vue-router/data-loaders/vue-query'

import { type RouteRecordName } from 'vue-router'
import { computed } from 'vue'
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
// const useUserData = defineQueryLoader(
//   '/users/[id]',
//   async (route, { signal }) => {
//     console.log('useUserData', route.fullPath)
//     await delay(700)
//     const user = {
//       id: route.params.id,
//       // @ts-expect-error: no param "name"!
//       name: route.params.name || 'Edu',
//       when: new Date().toUTCString(),
//     }
//     return user
//   },
//   {
//     queryKey: ['user-id'],
//     // queryKey: (route) => ['users', route.params.id],
//     staleTime: 5000,
//     lazy: false,
//   }
// )
</script>

<script lang="ts" setup>
import { useMutation, useQuery } from '@tanstack/vue-query'
const route = useRoute('/users/[id]')

// const { data: user, isLoading, error } = useUserData()
const {
  data: tqUser,
  error: tqError,
  status,
  fetchStatus,
  refetch,
} = useQuery({
  async queryFn() {
    console.log('[TQ]useUserData', route.fullPath, route.params)
    await delay(500)
    if (route.params.id === '0') {
      throw new Error('no user')
    }
    const user = {
      id: route.params.id,
      // @ts-expect-error: no param "name"!
      name: route.params.name || 'Edu',
      when: new Date().toUTCString(),
    }
    return user
  },
  // FIXME: (to) => ['user-id', to.params.id]
  queryKey: ['users', route.params.id],
  staleTime: 5000,
  retry: 0,
})

const {
  mutateAsync: mutate,
  data,
  context,
  status: mutationStatus,
  error,
} = useMutation({
  mutationFn: async (id: number) => {
    console.log('mutate', id)
    await delay(id)
    // throw new Error('data ' + id)
    return id
  },
  mutationKey: [
    'mutate',
    () => {
      console.log('mutationKey')
      return 205
    },
  ],
  // mutationKey: () => {
  //   console.log('mutationKey')
  //   return ['mutate']
  // },
  onMutate: (id) => {
    console.log('onMutate', id)
    // throw new Error('hello')
    return { id }
  },
  onSuccess: (newData, vars, context) => {
    console.log('onSuccess', newData, data.value, vars, context)
    // throw new Error('onSuccess')
  },
  onError: (err) => {
    console.log('onError', err)
    // throw new Error('onError')
  },
  async onSettled(data, error) {
    await new Promise((r) => setTimeout(r, 100))
    console.log('onSettled', data, error)
    throw new Error('onSettled')
  },
  retry: false,
})

function multipleMutate() {
  mutate(100).then((d) => console.log('DATA 100', d))
  mutate(200).then((d) => console.log('DATA 200', d))
  mutate(50).then((d) => console.log('DATA 50', d))
}
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
    |
    <button
      @click="
        refetch().then((d) => {
          console.log('Got ', d)
        })
      "
    >
      Refresh
    </button>

    <!-- <h2>Data Loaders</h2>
    <pre v-if="isLoading">Loading...</pre>
    <pre v-else-if="error">Error: {{ error }}</pre>
    <pre v-else>{{ user }}</pre>

    <hr />

    -->

    <h2>Query</h2>

    <p>
      <code>status: {{ status }}</code>
      <br />
      <code>fetchStatus: {{ fetchStatus }}</code>
    </p>
    <pre>Error: {{ tqError }}</pre>
    <pre>User: {{ tqUser == null ? String(tqUser) : tqUser }}</pre>

    <hr />

    <h2>Mutations</h2>

    <pre>Context: {{ context }}</pre>
    <pre>status: {{ mutationStatus }}</pre>
    <pre>error: {{ error }}</pre>
    <button @click="mutate(123)">Mutate</button>
    <button @click="multipleMutate()">Multi Mutate</button>
  </main>
</template>
