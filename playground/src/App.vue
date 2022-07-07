<script setup lang="ts">
import { useLink, useRoute } from '@vue-router'
import type { RouteNamedMap } from '@vue-router/routes'
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationResolved,
  RouteLocation,
} from '@vue-router'
import { ref } from 'vue'

function test(
  a: RouteLocationResolved<'/[name]'>,
  b: RouteLocationNormalizedLoaded<'/[name]'>,
  c: RouteLocation<'/[name]'>
) {}

const route = useRoute()
if (route.name === '/deep/nesting/works/[[files]]+') {
  route.params.files
}

const router = useRouter()

router.resolve('/:name')
router.resolve({ name: '/[name]', params: { name: 'hello' } }).params.name

useLink({ to: '/articles/2' }).route.value.name
useLink({ to: { path: '/articles/:id' } })
useLink({ to: { name: '/[name]', params: { name: 2 } } }).route.value.params
  .name
// useLink({ name: '/[name]', params: { name: 2 } }).route.value.params.name
useLink({ to: ref({ name: '/[name]', params: { name: 2 } }) }).route.value.name

const customRoute = useRoute('/deep/nesting/works/custom-path')
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/users/2">About</RouterLink>
        <RouterLink :to="{ name: '/articles/[id]', params: { id: 2 } }"
          >About</RouterLink
        >
        <RouterLink :to="{ path: '/articles', query: { test: 'query', n: 2 } }"
          >About</RouterLink
        >
        <button @click="$router.push('/oeu')">Click</button>
        {{ $route.name === '' }}
        <RouterLink to="/:name" v-slot="{ route }">
          {{ (route as RouteLocationNormalizedLoaded<'/[name]'>).params.name }}
        </RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
  <hr />
  <RouterView name="named" />
</template>
