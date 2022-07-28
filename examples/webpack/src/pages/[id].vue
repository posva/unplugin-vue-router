<script lang="ts" setup>
const route = useRoute('/[id]')
</script>

<template>
  <main>With Id: {{ route.params.id }}</main>
</template>
