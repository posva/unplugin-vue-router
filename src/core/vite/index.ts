import { type ViteDevServer } from 'vite'
import { type ServerContext } from '../../options'
import {
  MODULE_RESOLVER_PATH,
  MODULE_ROUTES_PATH,
  asVirtualId,
} from '../moduleConstants'

export function createViteContext(server: ViteDevServer): ServerContext {
  function invalidate(path: string) {
    const foundModule = server.moduleGraph.getModuleById(path)
    // console.log(`🟣 Invalidating module: ${path}, found: ${!!foundModule}`)
    if (foundModule) {
      return server.reloadModule(foundModule)
    }
    return !!foundModule
  }

  function reload() {
    server.ws.send({
      type: 'full-reload',
      path: '*',
    })
  }

  /**
   * Triggers HMR for the vue-router/auto-routes module.
   */
  async function updateRoutes() {
    const autoRoutesMod = server.moduleGraph.getModuleById(
      asVirtualId(MODULE_ROUTES_PATH)
    )
    const autoResolvedMod = server.moduleGraph.getModuleById(
      asVirtualId(MODULE_RESOLVER_PATH)
    )

    await Promise.all([
      autoRoutesMod && server.reloadModule(autoRoutesMod),
      autoResolvedMod && server.reloadModule(autoResolvedMod),
    ])
  }

  return {
    invalidate,
    updateRoutes,
    reload,
  }
}
