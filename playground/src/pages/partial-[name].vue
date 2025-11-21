<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <main>
    <h1>Partial Param: {{ route.params.name }}</h1>
  </main>
</template>
