<script setup lang="ts">
definePage({
  meta: {
    title: 'Not Found',
    description: 'This page does not exist.',
  },
})
</script>

<template>
  <main>
    <h1>Not Found</h1>

    <pre>{{ $route.params }}</pre>
    <pre>{{ $route.meta }}</pre>
  </main>
</template>

<route lang="json">
{
  "meta": {
    "from block": true
  }
}
</route>
