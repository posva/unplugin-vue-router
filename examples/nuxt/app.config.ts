
export default defineAppConfig({
  dataLoaders: {
    errors(reason) {
      console.error('[Data Loaders]', reason)
      return false
    },
  },
})

