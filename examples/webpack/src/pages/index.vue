<script lang="ts">
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useUserData = defineLoader('/[id]', async (route) => {
  await delay(1000)
  if (route.name === '/[id]') {
    route.params.id
  }
  const user = {
    // @ts-expect-error: no id param!
    name: route.params.name || 'Edu',
    id: route.params.id || 24,
    when: new Date().toUTCString(),
  }
  return { user }
})

const other = 'hello'

export const useOne = defineLoader(async (route) => {
  if (route.name === '/[id]') {
    route.params.id
  }

  return { one: 'one' }
})
export const useTwo = defineLoader(async () => ({ two: 'two' }), { lazy: true })

export default {}

// export { useOne, useTwo, other }
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
if (router.currentRoute.value.name === '/[id]') {
  router.currentRoute.value.params.id
  // @ts-expect-error: does not exist
  router.currentRoute.value.params.name
}

onBeforeRouteUpdate((to) => {
  if (to.name === '/[id]' && to.params.id === '2') {
    to.params.id
  }
})

onBeforeRouteLeave((to, from) => {
  if (from.name === '/[id]') {
    from.params.id
  } else if (to.name === '/articles/[id]+') {
    to.params.id.map((id) => id)
  }
})

router.resolve({ path: '' })
router.resolve({ path: '/articles/:id+' })
router.resolve({ name: '/[id]', params: { id: 2 } }).params.id
const routeLocation = router.resolve('/articles/id')
if (routeLocation.name === '/[id]') {
  routeLocation.params.id
  // @ts-expect-error: does not exist
  routeLocation.params.name
}

const route = useRoute('/')
const anyRoute = useRoute()
if (anyRoute.name == '/[id]') {
  console.log('anyRoute.params', anyRoute.params.id)
}
</script>

<template>
  <main>Home</main>
</template>
