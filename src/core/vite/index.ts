import { type ViteDevServer } from 'vite'
import { type ServerContext } from '../../options'
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

  function updateRoutes() {
    const modId = asVirtualId(MODULE_ROUTES_PATH)
    const mod = server.moduleGraph.getModuleById(modId)
    if (mod) {
      server.reloadModule(mod)  
    }
  }

  return {
    invalidate,
    updateRoutes,
    reload,
  }
}
