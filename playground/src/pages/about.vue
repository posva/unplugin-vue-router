<script setup lang="ts">
import { onMounted } from 'vue'
import { routes } from 'vue-router/auto-routes'

definePage({
  meta: {
    n: 12,
  },
})

onMounted(() => {
  console.log('routes', routes)
})
</script>

<template>
  <main>
    <h1>About</h1>

    <p>Increment to test HMR: 1</p>

    <pre>{{ $route.meta }}</pre>
  </main>
</template>
