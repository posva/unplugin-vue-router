<script setup lang="ts">
definePage({
  path: '/custom-path'
})
</script>

<template>
  <main>
    <h1>HMR Path Test</h1>
    <pre data-testid="route-path">{{ $route.path }}</pre>
  </main>
</template>
