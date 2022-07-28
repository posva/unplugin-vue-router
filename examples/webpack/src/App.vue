<script lang="ts" setup>
import { useRoute } from '@vue-router'

const route = useRoute()
</script>

<template>
  <header>
    <div class="wrapper">
      <mark>current page name is: {{ $route.name }}</mark>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <br />
        <RouterLink to="/chunk1">chunk1</RouterLink>
        <br />
        <RouterLink to="/chunk2">chunk2</RouterLink>
        <br />
      </nav>
    </div>
  </header>
  <router-view></router-view>
</template>
