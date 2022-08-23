<script setup lang="ts">
import { useState } from '#imports'

const state = useState('custom-date', () => new Date().toUTCString())
</script>

<template>
  <div>Hello {{ state }}</div>
  <nav>
    <NuxtLink to="/">Home</NuxtLink>
    |
    <NuxtLink to="/users/24" v-slot="{ route }">{{ route.href }}</NuxtLink>
  </nav>
  <NuxtPage />
</template>
