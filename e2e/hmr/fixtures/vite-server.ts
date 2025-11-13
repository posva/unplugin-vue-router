import { test as base, expect } from '@playwright/test'
import { createServer, type ViteDevServer } from 'vite'
import { type AddressInfo } from 'node:net'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

type ViteFixtures = {
  devServer: ViteDevServer
  baseURL: string
  projectRoot: string
}

export function applyEditFile(
  sourceFilePath: string,
  newContentFilePath: string
) {
  fs.writeFileSync(
    path.join(projectRoot, sourceFilePath),
    fs.readFileSync(path.join(projectRoot, newContentFilePath), 'utf8'),
    'utf8'
  )
}

const sourceDir = fileURLToPath(new URL('../playground', import.meta.url))
const fixtureDir = fileURLToPath(new URL('../playground-tmp', import.meta.url))
const projectRoot = path.resolve(fixtureDir)

export const test = base.extend<ViteFixtures>({
  projectRoot,

  // @ts-expect-error: type matched what is passed to use(server)
  devServer: [
    async ({}, use) => {
      fs.rmSync(fixtureDir, { force: true, recursive: true })
      fs.cpSync(sourceDir, fixtureDir, {
        recursive: true,
        filter: (src) => {
          return (
            !src.includes('.cache') &&
            !src.endsWith('.sock') &&
            !src.includes('.output') &&
            !src.includes('.vite')
          )
        },
      })
      // Start a real Vite dev server with your plugin(s) & config.
      // If you already have vite.config.ts, omit configFile:false and rely on it.
      const server = await createServer({
        configFile: path.join(fixtureDir, 'vite.config.ts'),
        // If you need to inline the plugin directly, you could do:
        // configFile: false,
        // plugins: [myPlugin()],
        server: { host: '127.0.0.1', port: 0, strictPort: false }, // random open port
        logLevel: 'error',
      })

      await server.listen()

      const http = server.httpServer
      if (!http) throw new Error('No httpServer from Vite')

      // Expose the running server & URL to tests
      await use(server)

      await server.close()
    },
    { scope: 'worker' },
  ],

  baseURL: async ({ devServer }, use) => {
    const http = devServer.httpServer!
    const addr = http.address() as AddressInfo
    await use(`http://127.0.0.1:${addr.port}`)
  },
})

export { expect }
