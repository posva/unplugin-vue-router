<script lang="ts">
export const myExport = 'OUTSIDE SETUP TEST'
</script>

<script lang="ts" setup>
const route = useRoute('/users/[id]')

const MY_VAL = 'INSIDE SETUP TEST'
</script>

<template>
  <main>
    <pre>User: {{ route.params.id }}</pre>
    <p>{{ MY_VAL }}</p>
  </main>
</template>
