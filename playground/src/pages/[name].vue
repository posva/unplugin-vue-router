<script lang="ts">
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useUserData = defineBasicLoader(
  '/[name]',
  async (route) => {
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
    return user
  },
  { key: 'user' }
)

const other = 'hello'

const useOne = defineBasicLoader(
  async (route) => {
    const user = await useUserData()
    if (route.name === '/[name]') {
      route.params.name
    }

    return {
      one: 'one',
      user: user.name,
    }
  },
  { key: 'one' }
)
const useTwo = defineBasicLoader(async () => ({ two: 'two' }), { lazy: true })

export { useOne, other, useTwo }
export default {}
</script>

<script lang="ts" setup>
import { dummy, dummy_id, dummy_number } from '@/utils'
import * as dummy_star from '@/utils'
import {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  type RouteLocationNormalized,
} from 'vue-router'

const thing = 'THING'

// const $route = useRoute()

const { data: user, isLoading, reload } = useUserData()

const { data: one } = useOne()
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

definePage({
  // name: 'my-name',
  alias: ['/n/:name'],
  meta: {
    [dummy_id]: 'id',
    fixed: dummy_number,
    mySymbol: Symbol(),
    ['hello' + 'expr']: true,
    test: (to: RouteLocationNormalized) => {
      // this one should crash it
      // anyRoute.params
      const shadow = 'nope'
      // dummy(shadow)
      dummy_star
      if (Math.random()) {
        console.log(typeof dummy)
      }
      console.log(to.name === '/[name]' ? to.params.name : shadow)
    },
  },
})

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
    <p v-if="isLoading">Loading user...</p>
    <pre v-else>{{ user }}</pre>

    <p>one:</p>
    <pre>{{ one }}</pre>
    <p>two</p>
    <pre>{{ two }}</pre>
    <p>meta:</p>
    <pre>{{ route.meta }}</pre>
  </main>
</template>

<route lang="json">
{
  "meta": {
    "hello": "there",
    "n": 1
  }
}
</route>
