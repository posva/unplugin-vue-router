<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute('/[...path]+')
</script>

<template>
  <main>
    <h1>Not Found</h1>
    <p>{{ route.params.path }} does not exist.</p>
  </main>
</template>

<route>
{
  "props": true
}
</route>
