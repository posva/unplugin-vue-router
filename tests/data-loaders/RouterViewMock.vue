<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const viewComponent = computed(() => {
  // NOTE: .findLast is node >=18
  return route.matched
    .slice()
    .reverse()
    .find((record) => record.components?.default)?.components?.default
})
</script>

<template>
  <component :is="viewComponent" />
</template>
