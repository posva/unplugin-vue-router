<script setup lang="ts">
import { onMounted } from 'vue'
import { routes } from 'vue-router/auto-routes'

definePage({
  meta: {
    n: 24,
  },
})

onMounted(() => {
  console.log('routes', routes.find((record) => record.name === '/about')?.meta)
})
</script>

<template>
  <main>
    <h1>About</h1>

    <p>Increment to test HMR: 3</p>

    <pre>{{ $route.meta }}</pre>
  </main>
</template>

<route lang="json">
{
  "meta": {
    "number": 14
  }
}
</route>
