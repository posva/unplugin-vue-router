<script setup lang="ts">
definePage({
  meta: {
    name: '(test group root)',
  },
})
</script>

<template>
  <RouterView />

  <hr />

  <pre>{{ $route.meta }}</pre>
</template>
