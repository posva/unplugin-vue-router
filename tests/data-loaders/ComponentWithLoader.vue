<script lang="ts">
import { defineLoader } from '~/src/data-fetching_new/defineLoader'

export const useData = defineLoader(async () => {
  return 'resolved'
})
export const useOtherData = defineLoader(async () => {
  return 'resolved 2'
})
</script>

<script lang="ts" setup>
const { data } = useData()
</script>

<template>
  <div>{{ data }}</div>
</template>
