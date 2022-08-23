<script setup lang="ts">
import type { HistoryState } from 'vue-router/auto'

definePage<{ n: number }>({
  path: '/:name(\\d+)',
  name: 'my-name',
  meta: {
    n: 2,
    thing() {
      return 'hello'
    },
  },
})

defineModel<{
  modelValue: string
  count: number
}>()

defineExpose({})

defineEmits<{
  (eventName: 'one'): void
}>()

const a = 'hello'

defineOptions({
  beforeRouteEnter(to, from) {
    console.log(a, to, from)
  },
})
</script>

<template>
  <main>
    <h1>Home</h1>
  </main>
</template>

<route lang="json">
{ "name": "home" }
</route>
