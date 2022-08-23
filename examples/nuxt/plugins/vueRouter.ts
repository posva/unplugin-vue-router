import { _setupDataFetchingGuard } from 'unplugin-vue-router/runtime'

export default defineNuxtPlugin((nuxtApp) => {
  // console.log('going in!', useRouter())
  const data = _setupDataFetchingGuard(
    useRouter(),
    process.client ? nuxtApp.payload._uvr : undefined
  )

  if (process.server) {
    nuxtApp.payload._uvr = data
  }

  useRouter()
    .isReady()
    .then(() => {
      console.log('READY!', nuxtApp.payload._uvr)
    })
})
