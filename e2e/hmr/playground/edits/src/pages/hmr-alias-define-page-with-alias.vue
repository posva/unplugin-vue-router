<script setup lang="ts">
definePage({
  alias: '/alias-path'
})
</script>

<template>
  <main>
    <h1>HMR Alias Test</h1>
    <pre data-testid="route-path">{{ $route.path }}</pre>
  </main>
</template>
