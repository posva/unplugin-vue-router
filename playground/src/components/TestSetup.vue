<script setup lang="ts">
import { onBeforeRouteLeave, type RouteMap } from 'vue-router'

const route = useRoute()

route.name satisfies keyof RouteMap

onBeforeRouteLeave((to) => {
  if (to.name === '/[name]') {
    to.params.name
    return { name: '/custom-path' }
  }
})
</script>
