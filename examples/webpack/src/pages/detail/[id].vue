<script lang="ts">
import { definePage } from 'unplugin-vue-router/runtime'
import { useRoute } from 'vue-router/auto'

export default {
  setup() {
    const route = useRoute()

    definePage({
      meta: {
        iu: true,
      },
    })

    console.log(route.meta)
    return {
      route,
    }
  },
}
</script>

<template>
  <main>Detail {{ route.params.id }}</main>
</template>
