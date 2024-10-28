<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <header>
    <div class="wrapper">
      <mark>current page name is: {{ route.name }}</mark>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/demo">Demo</RouterLink>
      </nav>
    </div>
  </header>
  <router-view></router-view>
</template>
