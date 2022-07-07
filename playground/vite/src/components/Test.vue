<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  beforeRouteLeave(to, from) {
    to.name === ':('
  },
})
</script>
