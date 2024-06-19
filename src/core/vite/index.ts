import { type ViteDevServer } from 'vite'
import { ServerContext } from '../../options'
import { MODULE_ROUTES_PATH, asVirtualId } from '../moduleConstants'

export function createViteContext(server: ViteDevServer): ServerContext {
  function invalidate(path: string) {
    const { moduleGraph } = server
    const foundModule = moduleGraph.getModuleById(path)
    if (foundModule) {
      moduleGraph.invalidateModule(foundModule, undefined, undefined, true)
      // for (const mod of foundModule.importers) {
      //   console.log(`Invalidating ${mod.url}`)
      //   moduleGraph.invalidateModule(mod)
      // }
      setTimeout(() => {
        console.log(`Sending update for ${foundModule.url}`)
        server.ws.send({
          type: 'update',
          updates: [
            {
              acceptedPath: path,
              path: path,
              // NOTE: this was in the
              // timestamp: ROUTES_LAST_LOAD_TIME.value,
              timestamp: Date.now(),
              type: 'js-update',
            },
          ],
        })
      }, 100)
    }
    return !!foundModule
  }

  function reload() {
    server.ws.send({
      type: 'full-reload',
      path: '*',
    })
  }

  // NOTE: still not working
  // based on https://github.com/vuejs/vitepress/blob/1188951785fd2a72f9242d46dc55abb1effd212a/src/node/plugins/localSearchPlugin.ts#L90
  // https://github.com/unocss/unocss/blob/f375524d9bca3f2f8b445b322ec0fc3eb124ec3c/packages/vite/src/modes/global/dev.ts#L47-L66

  async function updateRoutes() {
    const modId = asVirtualId(MODULE_ROUTES_PATH)
    const mod = server.moduleGraph.getModuleById(modId)
    if (!mod) {
      return
    }
    server.moduleGraph.invalidateModule(mod)
    server.ws.send({
      type: 'update',
      updates: [
        {
          acceptedPath: mod.url,
          path: mod.url,
          timestamp: Date.now(),
          type: 'js-update',
        },
      ],
    })
  }

  return {
    invalidate,
    updateRoutes,
    reload,
  }
}
