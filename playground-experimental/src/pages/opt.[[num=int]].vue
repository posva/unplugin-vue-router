<script lang="ts" setup>
const route = useRoute()

definePage({
  params: {
    path: {
      num: 'int',
    },
  },
})
</script>

<template>
  <h1>Named param</h1>
  <pre>{{ route.params }}</pre>

  <RouterView />
</template>
