<script lang="ts">
export const myExport = 'OUTSIDE SETUP TEST'
</script>

<script lang="ts" setup>
const route = useRoute('/users/[id]')

definePage({
  beforeEnter(to) {
    if (Number.isNaN(Number(to.params.id))) {
      console.log('invalid param id', to.params.id)
      return false
    }
  },
})

const MY_VAL = 'INSIDE SETUP TEST'
</script>

<template>
  <main>
    <pre>User: {{ route.params.id }}</pre>
    <p>{{ MY_VAL }}</p>
  </main>
</template>

<route lang="ts">
const a = 20 as 20 | 30

console.log('WITHIN ROUTE_BLOCK', a)

export default {
  alias: '/u/:id',
  meta: {
    a,
    other: 'other',
  },
}
</route>
