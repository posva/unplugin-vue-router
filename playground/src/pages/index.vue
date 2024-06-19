<script lang="ts" setup>
definePage({
  meta: {
    title: 'hello',
  },
})
</script>

<template>
  <main>
    <h1>Home</h1>
    <pre>{{ $route.meta }}</pre>
  </main>
</template>

<route lang="json">
{
  "name": "home",
  "meta": {
    "n": 5
  }
}
</route>
