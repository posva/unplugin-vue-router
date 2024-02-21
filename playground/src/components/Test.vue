<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  beforeRouteEnter(to, from, next) {
    // @ts-expect-error: no this
    this.$router
    // @ts-expect-error: not existing route
    to.name === ''
    next((vm) => {
      vm.$router.push({ name: '/about' })
      // @ts-expect-error: not existing route
      vm.$router.push({ name: '/nope' })
    })
  },
  beforeRouteLeave(to, from) {
    // @ts-expect-error: not existing route
    to.name === ':('
    this.$router.push({ name: '/about' })
    // @ts-expect-error: not existing route
    this.$router.push({ name: '/nope' })
  },

  beforeRouteUpdate(to, from) {
    this.$router.push({ name: '/about' })
    // @ts-expect-error: not existing route
    this.$router.push({ name: '/nope' })
    // @ts-expect-error: not existing route
    to.name === ':('
  },
})
</script>
