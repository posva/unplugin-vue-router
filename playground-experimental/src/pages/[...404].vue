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

    <p>{{ $route.params }}</p>
  </main>
</template>
