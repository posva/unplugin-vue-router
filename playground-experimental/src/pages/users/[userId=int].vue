<script lang="ts" setup>
const route = useRoute()
route.params.userId

definePage({
  meta: {
    // te: 3, 2
  },
})
</script>

<template>
  <h1>{{ String($route.name) }} - {{ $route.path }}</h1>
</template>
