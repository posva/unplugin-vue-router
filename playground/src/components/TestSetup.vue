<script setup lang="ts">
import { onBeforeRouteLeave} from '@vue-router'

onBeforeRouteLeave((to) => {
if (to.name === '/[name]')
})
</script>
