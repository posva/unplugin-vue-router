<script lang="ts" setup>
import type { Alias } from 'vite'
const route = useRoute('/@[profileId]')

const route2 = definePage<{ thing: string; alias: Alias }>({
  meta: {
    thing: 'hey' as 'hey' | 'heya',
  },
})
</script>

<template>
  <main>
    <h1>Some profile {{ route.params.profileId }}</h1>
  </main>
</template>
