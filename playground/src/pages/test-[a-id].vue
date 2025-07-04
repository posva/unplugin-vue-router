<script lang="ts" setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div>test {{ route.params.aId }}</div>
</template>
