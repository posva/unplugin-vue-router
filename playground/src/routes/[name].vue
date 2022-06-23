<script lang="ts" setup>
// import { useRoute } from '~routes/[name]'
// import { route } from '~custom'
// import { useRoute } from '@vue-router'

import { useRoute } from '@vue-router'

const route = useRoute()
useRoute('/multiple-[a]-[b]-params')
useRoute<'/about'>('/about')
</script>

<template>
  <main>
    <h1>Param: {{ $route.params.name }}</h1>
  </main>
</template>
