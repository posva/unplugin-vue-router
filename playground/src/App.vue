<script setup lang="ts"></script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <!-- <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink> -->
        <RouterLink to="/articles/2"></RouterLink>
        <RouterLink
          :to="{ name: '/[name]', params: { name: 'euuoea' } }"
        ></RouterLink>
        <RouterLink :to="{ path: '/articles/' }"></RouterLink>
      </nav>
    </div>
  </header>

  <!-- <RouterView /> -->
</template>
