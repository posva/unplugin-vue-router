<script setup lang="ts">
import { useLink, useRoute } from 'vue-router'
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationResolved,
  RouteLocation,
} from 'vue-router'
import { ref, watch } from 'vue'
import { routes } from 'vue-router/auto-routes'
import { useMutationState, useQueryClient } from '@tanstack/vue-query'

console.log(`We have ${routes.length} routes.`)

const queryClient = useQueryClient()
// const states = useMutationState({ filters: { mutationKey: ['hey'] } })
const states = useMutationState()
watch(states, () => {
  window.ss = states
})
function clearMutationsCache() {
  queryClient.getMutationCache().clear()
}

const router = useRouter()
const route = useRoute()

const targetRoute = ref('')

function _test() {
  function test(
    a: RouteLocationResolved<'/[name]'>,
    b: RouteLocationNormalizedLoaded<'/[name]'>,
    c: RouteLocation<'/[name]'>
  ) {}

  if (route.name === '/deep/nesting/works/[[files]]+') {
    route.params.files
  }

  router.resolve('/:name')
  router.resolve({ name: '/[name]', params: { name: 'hello' } }).params.name

  useLink({ to: '/articles/2' }).route.value.name
  useLink({ to: { path: '/articles/:id' } })
  useLink({ to: { name: '/[name]', params: { name: 2 } } }).route.value.params
    .name
  // useLink({ name: '/[name]', params: { name: 2 } }).route.value.params.name
  useLink({ to: ref({ name: '/[name]', params: { name: 2 } }) }).route.value
    .name

  const customRoute = useRoute('/deep/nesting/works/custom-path')
}
</script>

<template>
  <header>
    <pre>{{ states.length }}</pre>
    <button @click="clearMutationsCache()">Clear mutations</button>
    <div class="wrapper">
      <nav>
        <ul>
          <li>
            <RouterLink to="/">Home</RouterLink>
          </li>
          <li>
            <RouterLink to="/group">Group (thing.vue)</RouterLink>
          </li>
          <li>
            <RouterLink to="/users/2" v-slot="{ href }">{{ href }}</RouterLink>
          </li>
          <li>
            <RouterLink to="/users/query/1" v-slot="{ href }">{{
              href
            }}</RouterLink>
          </li>
          <li>
            <RouterLink to="/users/pinia-colada/1" v-slot="{ href }">{{
              href
            }}</RouterLink>
          </li>
          <li>
            <RouterLink to="/users/colada-loader/1" v-slot="{ href }">{{
              href
            }}</RouterLink>
          </li>
          <li>
            <RouterLink to="/users/tq-query/1" v-slot="{ href }">{{
              href
            }}</RouterLink>
          </li>
          <li>
            <RouterLink to="/Eduardo">[name]</RouterLink>
          </li>
          <li>
            <RouterLink to="/about">About</RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: '/articles/[id]', params: { id: 2 } }"
              >Some Article</RouterLink
            >
          </li>
          <li>
            <RouterLink
              :to="{ path: '/articles', query: { test: 'query', n: 2 } }"
              >Articles with query</RouterLink
            >
          </li>
        </ul>

        <button @click="$router.push('/oeu')">Click</button>
        <RouterLink to="/named-route" v-slot="{ route }">
          :name param is:
          {{ (route as RouteLocationResolved<'/[name]'>).params.name }}
        </RouterLink>
      </nav>
    </div>
    <div>
      <form @submit.prevent="router.push(targetRoute)">
        <label>
          Navigate to:
          <input type="text" v-model="targetRoute" />
        </label>
        <button>Go</button>
      </form>
    </div>
  </header>

  <hr />

  <RouterView />
  <hr />
  <RouterView name="named" />
</template>

<style scoped>
ul {
  padding-left: 0;
}
ul > li {
  display: inline-block;
}

ul > li:not(:first-child) {
  margin-left: 0.5rem;
}

li > a {
  text-decoration: none;
}
.router-link-active {
  text-decoration: underline;
  font-weight: bold;
}
</style>
