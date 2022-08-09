<script setup lang="ts">
import { onBeforeRouteLeave} from 'vue-router/auto'

onBeforeRouteLeave((to) => {
if (to.name === '/[name]')
})
</script>
