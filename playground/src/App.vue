<script setup lang="ts">
import { useRoute } from '@vue-router'

const route = useRoute()
route.name === '/about'
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink :to="{ name: '/articles/[id]', params: { id: 2 } }"
          >About</RouterLink
        >
        <RouterLink :to="{ path: '/articles', query: { test: 'query', n: 2 } }"
          >About</RouterLink
        >
        <button @click="$router.push('/oeu')">Click</button>
        {{ $route.name === '' }}
      </nav>
    </div>
  </header>

  <!-- <RouterView /> -->
</template>
