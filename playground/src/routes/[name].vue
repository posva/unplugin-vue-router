<script lang="ts" setup>
import {
  useRoute,
  useRouter,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from '@vue-router'
import type { RouterTyped } from '@vue-router'

// const $route = useRoute()

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

const route = useRoute()
if (route.name == '/articles/[id]') {
  console.log('route.params', route.params.id)
}
useRoute('/multiple-[a]-[b]-params').params
useRoute<'/[name]'>().params.name
// @ts-expect-error: /about doesn't have params
useRoute<'/about'>('/about').params.never
</script>

<template>
  <main>
    <h1>Param: {{ $route.params.name }}</h1>
  </main>
</template>
