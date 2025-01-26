<script setup lang="ts">
definePage({
  meta: {
    name: 'overriden by child in group',
    other: 'foo',
  },
})
</script>

<template>
  <h2>Test group child (resolves to root)</h2>
</template>
