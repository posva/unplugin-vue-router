<script lang="ts" setup>
import { useRoute } from '@vue-router'

const route = useRoute()
if (route.name == '/articles/[id]') {
  console.log('route.params', route.params.id)
}
useRoute('/multiple-[a]-[b]-params').params
useRoute<'/[name]'>().params.name
// @ts-expect-error: /about doesn't have params
useRoute<'/about'>('/about').params.never}
</script>

<template>
  <main>
    <h1>Param: {{ $route.params.name }}</h1>
  </main>
</template>
