<script lang="ts">
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useUserData = defineLoader('/[name]', async (route) => {
  await delay(1000)
  if (route.name === '/[name]') {
    route.params
  }
  const user = {
    name: route.params.name || 'Edu',
    // @ts-expect-error: no id param!
    id: route.params.id || 24,
    when: new Date().toUTCString(),
  }
  return { user }
})

const other = 'hello'

export const useOne = defineLoader(async (route) => {
  if (route.name === '/[name]') {
    route.params.name
  }

  return { one: 'one' }
})
export const useTwo = defineLoader(async () => ({ two: 'two' }), { lazy: true })

// export { useOne, useTwo, other }
export default {}
</script>

<script lang="ts" setup>
import { onBeforeRouteLeave, onBeforeRouteUpdate } from '@vue-router'
import type { RouterTyped, RouteRecordRaw } from '@vue-router'

const thing = 'THING'

// const $route = useRoute()

const { user, pending, refresh } = useUserData()

const { one } = useOne()
const { data: two } = useTwo()

const router = useRouter()
if (router.currentRoute.value.name === '/[name]') {
  router.currentRoute.value.params.name
  // @ts-expect-error: does not exist
  router.currentRoute.value.params.id
}

onBeforeRouteUpdate((to) => {
  if (to.name === '/articles/[id]' && to.params.id === '2') {
    to.params.id
  }
})

onBeforeRouteLeave((to, from) => {
  if (from.name === '/[name]') {
    from.params.name
  } else if (to.name === '/articles/[id]+') {
    to.params.id.map((id) => id)
  }
})

router.resolve({ path: '' })
router.resolve({ path: '/articles/:id' })
router.resolve({ name: '/[name]', params: { name: 2 } }).params.name
const routeLocation = router.resolve('/articles/id')
if (routeLocation.name === '/[name]') {
  routeLocation.params.name
  // @ts-expect-error: does not exist
  routeLocation.params.id
}

const route = useRoute('/[name]')
const anyRoute = useRoute()
if (anyRoute.name == '/articles/[id]') {
  console.log('anyRoute.params', anyRoute.params.id)
}
useRoute('/multiple-[a]-[b]-params').params
useRoute<'/[name]'>().params.name
// @ts-expect-error: /about doesn't have params
useRoute<'/about'>('/about').params.never

function defineRoute<T extends Partial<RouteRecordRaw>>(
  routeModifier: (route: RouteRecordRaw) => T
): T
function defineRoute<T extends Partial<RouteRecordRaw>>(route: T): T
function defineRoute<T extends Partial<RouteRecordRaw>>(
  route: T | ((route: RouteRecordRaw) => T)
): T {
  return {} as T
}

defineRoute({
  path: '/:name(\\d+)',
  name: 'my-name',
})
defineRoute((route) => ({
  ...route,
  children: [
    ...('children' in route ? route.children : []),
    { path: '/cosa', name: 'cosa', component: {} },
  ],
}))

// defineRouteMeta<{ transition: string }>()
// defineRouteMeta({
//   transition: 'fade' as 'fade' | 'slide',
// })
// defineRouteMeta<{ transition: 'fade' | 'slide' }>({
//   transition: 'fade',
// })
</script>

<template>
  <main>
    <h1>Param: {{ $route.name === '/[name]' && $route.params.name }}</h1>
    <h2>Param: {{ route.params.name }}</h2>
    <p v-show="false">{{ thing }}</p>
    <p v-if="pending">Loading user...</p>
    <pre v-else>{{ user }}</pre>
  </main>
</template>
