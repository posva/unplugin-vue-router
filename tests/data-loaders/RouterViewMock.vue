<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const viewComponent = computed(() => {
  return route.matched.findLast((record) => record.components?.default)
    ?.components?.default
})
</script>

<template>
  <component :is="viewComponent" />
</template>
