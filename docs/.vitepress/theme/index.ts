import Theme from 'vitepress/theme'
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import '@shikijs/vitepress-twoslash/style.css'
import type { EnhanceAppContext } from 'vitepress'

export default {
  extends: Theme,
  enhanceApp({ app }: EnhanceAppContext) {
    // @ts-expect-error: bugged?
    app.use(TwoslashFloatingVue)
  },
}
