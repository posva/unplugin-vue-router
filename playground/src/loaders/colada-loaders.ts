import { defineColadaLoader } from 'unplugin-vue-router/data-loaders/pinia-colada'
import { ref } from 'vue'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
export const simulateError = ref(false)

export const useUserData = defineColadaLoader('/users/colada-loader.[id]', {
  async query(to, { signal }) {
    console.log('[🍹] coladaLoader', to.fullPath)
    signal.addEventListener('abort', () => {
      console.log('[🍹❌] aborted', to.fullPath)
    })
    // we need to read these before the delay
    const id = to.params.id
    // @ts-expect-error: no param "name"!
    const name = to.params.name

    await delay(2000)
    if (simulateError.value) {
      throw new Error('Simulated Error')
    }

    const user = {
      id,
      name,
      when: new Date().toUTCString(),
    }

    return user
  },
  key: (to) => {
    // console.log('[🍹] key', to.fullPath)
    return ['loader-users', to.params.id]
  },
  staleTime: 10000,
  placeholderData: (previousData) => {
    console.log('[🍹] placeholderData', previousData)
    return previousData
  },
  lazy: (to, from) => {
    const lazy = to.name && to.name === from?.name
    console.log('[🍹] lazy', to.fullPath, lazy)
    return lazy
  },
})
