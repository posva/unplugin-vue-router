<script setup lang="ts">
import { definePage } from 'unplugin-vue-router/experimental-param-parsers'
import doc from './[...404].vue?raw'

const route = useRoute()
route.params.path

definePage({
  meta: {
    title: 'Not Found',
    description: 'This page does not exist.',
    docLength: doc.length,
  },
  params: {
    query: {
      page: {
        parser: 'int',
        default: 1,
        format: 'value',
      },
    },
  },
})
</script>

<template>
  <main>
    <h1>Not Found</h1>

    <pre>{{ $route.params }}</pre>
    <pre>{{ $route.meta }}</pre>
  </main>
</template>

<route lang="json">
{
  "meta": {
    "from block": true
  }
}
</route>
