import { ViteDevServer } from 'vite'
import { ServerContext } from '../../options'
import { asVirtualId } from '../moduleConstants'

export function createViteContext(server: ViteDevServer): ServerContext {
  function invalidate(path: string) {
    const { moduleGraph } = server
    const foundModule = moduleGraph.getModuleById(asVirtualId(path))
    if (foundModule) {
      moduleGraph.invalidateModule(foundModule)
    }
    return !!foundModule
  }

  function reload() {
    if (server.ws) {
      server.ws.send({
        type: 'full-reload',
        path: '*',
      })
    }
  }

  return {
    invalidate,
    reload,
  }
}
