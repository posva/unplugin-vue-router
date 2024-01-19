<script setup lang="ts">
import { useLink, useRoute } from 'vue-router/auto'
import type { RouteNamedMap } from 'vue-router/auto-routes'
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationResolved,
  RouteLocation,
} from 'vue-router/auto'
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
        <ul>
          <li>
            <RouterLink to="/">Home</RouterLink>
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
          {{ (route as RouteLocationNormalizedLoaded<'/[name]'>).params.name }}
        </RouterLink>
      </nav>
    </div>
  </header>

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
