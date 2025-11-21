<script setup lang="ts">
definePage({
  meta: {
    n: 24,
  },
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
