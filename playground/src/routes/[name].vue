<script lang="ts" setup>
// import { useRoute } from '~routes/[name]'
// import { route } from '~custom'
// import { useRoute } from '@vue-router'

import { useRoute } from '@vue-router'

const route = useRoute()
if (route.name == '/articles/[id]+') {
  console.log('route.params', route.params.id)
}
useRoute('/multiple-[a]-[b]-params').params
useRoute<'/about'>('/about')
</script>

<template>
  <main>
    <h1>Param: {{ $route.params.name }}</h1>
  </main>
</template>
