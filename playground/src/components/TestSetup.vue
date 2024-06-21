<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router'

onBeforeRouteLeave((to) => {
  if (to.name === '/[name]') {
    to.params.name
    return { name: '/custom-path' }
  }
})
</script>
