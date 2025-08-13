<script setup lang="ts">
import { useLink, useRoute } from 'vue-router'
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationResolved,
  RouteLocation,
} from 'vue-router'
import { ref } from 'vue'
import { routes } from 'vue-router/auto-routes'

console.log(`We have ${routes.length} routes.`)

const router = useRouter()

const targetRoute = ref('')

function _test() {
  const b = function test(
    a: RouteLocationResolved<'/[name]'>,
    b: RouteLocationNormalizedLoaded<'/[name]'>,
    c: RouteLocation<'/[name]'>
  ) {
    return {
      a,
      b,
      c,
    }
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

  const customRoute = useRoute('/(home)')

  return { b, customRoute }
}

// this is always false, it's just for types
if (Math.random() > 2) {
  _test()
}
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
            <RouterLink to="/users/24" #default="{ href }">{{
              href
            }}</RouterLink>
          </li>
          <li>
            <RouterLink to="/events/1992-03-24" #default="{ href }">{{
              href
            }}</RouterLink>
          </li>
        </ul>
      </nav>
    </div>

    <div>
      <p>Currently at "{{ $route.name }}" ({{ $route.fullPath }})</p>
      <pre>{{ $route.params }}</pre>
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
