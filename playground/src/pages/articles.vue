<script lang="ts" setup>
const route = useRoute()

if ('id' in route.params) {
  route.params.id satisfies string | [string, ...string[]]
}
</script>

<template>
  <h1>Articles</h1>

  <RouterView />
</template>
