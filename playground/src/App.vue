<script setup lang="ts"></script>

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
      </nav>
    </div>
  </header>

  <!-- <RouterView /> -->
</template>
