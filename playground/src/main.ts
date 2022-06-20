import { createApp } from 'vue'
import App from './App.vue'
import { routes } from '~routes'

console.log(routes)

const app = createApp(App)

// app.use(router)

app.mount('#app')
