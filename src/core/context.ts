import { ResolvedOptions } from '../options'
import { createPrefixTree, TreeNode } from './tree'
import { promises as fs } from 'fs'
import { logTree, throttle } from './utils'
import { generateRouteNamedMap } from '../codegen/generateRouteMap'
import { MODULE_ROUTES_PATH, MODULE_VUE_ROUTER } from './moduleConstants'
import { generateRouteRecord } from '../codegen/generateRouteRecords'
import fg from 'fast-glob'
import { resolve } from 'pathe'
import { ServerContext } from '../options'
import { getRouteBlock } from './customBlock'
import { RoutesFolderWatcher, HandlerContext } from './RoutesFolderWatcher'
import { generateDTS as _generateDTS } from '../codegen/generateDTS'
import { generateVueRouterProxy as _generateVueRouterProxy } from '../codegen/vueRouterModule'
import { hasNamedExports } from '../data-fetching/parse'
import { definePageTransform } from './definePage'

export function createRoutesContext(options: ResolvedOptions) {
  const { dts: preferDTS, root, routesFolder } = options
  const dts =
    preferDTS === false
      ? false
      : preferDTS === true
      ? resolve(root, 'typed-router.d.ts')
      : resolve(root, preferDTS)

  const routeTree = createPrefixTree(options)
  const routeMap = new Map<string, TreeNode>()

  function log(...args: any[]) {
    if (options.logs) {
      console.log(...args)
    }
  }

  // populated by the initial scan pages
  const watchers: RoutesFolderWatcher[] = []

  async function scanPages() {
    if (options.extensions.length < 1) {
      throw new Error(
        '"extensions" cannot be empty. Please specify at least one extension.'
      )
    }

    // initial scan was already done
    if (watchers.length > 0) {
      return
    }

    const pattern =
      `**/*` +
      (options.extensions.length === 1
        ? options.extensions[0]
        : `.{${options.extensions
            .map((extension) => extension.replace('.', ''))
            .join(',')}}`)

    await Promise.all(
      routesFolder.map((folder) => {
        const watcher = new RoutesFolderWatcher(folder, options)
        setupWatcher(watcher)
        watchers.push(watcher)

        return fg(pattern, {
          cwd: folder.src,
          // TODO: do they return the symbolic link path or the original file?
          // followSymbolicLinks: false,
          ignore: options.exclude,
        })
          .then((files) => files.map((file) => resolve(folder.src, file)))
          .then((files) =>
            Promise.all(
              files.map((file) =>
                addPage({
                  routePath: watcher.asRoutePath(file),
                  filePath: file,
                })
              )
            )
          )
      })
    )

    await _writeConfigFiles()
  }

  async function addPage({ filePath: path, routePath }: HandlerContext) {
    const routeBlock = await getRouteBlock(path, options)
    log(`added "${routePath}" for "${path}"`)
    if (routeBlock) log(routeBlock)
    // TODO: handle top level named view HMR
    const node = routeTree.insert(
      routePath,
      // './' + path
      resolve(root, path)
    )
    node.setCustomRouteBlock(path, routeBlock)
    node.value.includeLoaderGuard =
      options.dataFetching && (await hasNamedExports(path))

    routeMap.set(path, node)
    // FIXME: do once
    const content = await fs.readFile(path, 'utf8')
    node.hasDefinePage = content.includes('definePage')
  }

  async function updatePage({ filePath: path, routePath }: HandlerContext) {
    log(`updated "${routePath}" for "${path}"`)
    const node = routeMap.get(path)
    if (!node) {
      console.warn(`Cannot update "${path}": Not found.`)
      return
    }
    // FIXME: do once
    const content = await fs.readFile(path, 'utf8')
    node.hasDefinePage = content.includes('definePage')
    node.setCustomRouteBlock(path, await getRouteBlock(path, options))
    node.value.includeLoaderGuard =
      options.dataFetching && (await hasNamedExports(path))
  }

  function removePage({ filePath: path, routePath }: HandlerContext) {
    log(`remove "${routePath}" for "${path}"`)
    routeTree.remove(routePath)
    routeMap.delete(path)
  }

  function setupWatcher(watcher: RoutesFolderWatcher) {
    log(`🤖 Scanning files in ${watcher.src}`)
    watcher
      .on('change', async (ctx) => {
        await updatePage(ctx)
        writeConfigFiles()
      })
      .on('add', async (ctx) => {
        await addPage(ctx)
        writeConfigFiles()
      })
      .on('unlink', async (ctx) => {
        await removePage(ctx)
        writeConfigFiles()
      })
  }

  function generateRoutes() {
    // keys are import names while values are paths import __ from __
    // TODO: reverse the order and make a list of named imports and another for defaults?
    const importList = new Map<string, string>()

    const routesExport = `export const routes = ${generateRouteRecord(
      routeTree,
      options,
      importList
    )}`

    let imports = ''
    // FIXME: after demo
    if (true || options.dataFetching) {
      imports += `import { _HasDataLoaderMeta, _mergeRouteRecord } from 'unplugin-vue-router/runtime'\n`
    }
    for (const [name, path] of importList) {
      imports += `import ${name} from '${path}'\n`
    }

    // add an empty line for readability
    if (imports) {
      imports += '\n'
    }

    return `${imports}\
${routesExport}
`
  }

  function generateDTS(): string {
    return _generateDTS({
      vueRouterModule: MODULE_VUE_ROUTER,
      routesModule: MODULE_ROUTES_PATH,
      routeNamedMap: generateRouteNamedMap(routeTree)
        .split('\n')
        .filter((line) => line) // remove empty lines
        .map((line) => '  ' + line) // Indent by two spaces
        .join('\n'),
    })
  }

  // NOTE: this code needs to be generated because otherwise it doesn't go through transforms and `vue-router/auto/routes`
  // cannot be resolved.
  function generateVueRouterProxy() {
    return _generateVueRouterProxy(MODULE_ROUTES_PATH, options)
  }

  let lastDTS: string | undefined
  async function _writeConfigFiles() {
    log('writing')
    logTree(routeTree, log)
    if (dts) {
      const content = generateDTS()
      if (lastDTS !== content) {
        await fs.writeFile(dts, content, 'utf-8')
        lastDTS = content
        server?.invalidate(MODULE_ROUTES_PATH)
        server?.invalidate(MODULE_VUE_ROUTER)
        server?.reload()
      }
    }
  }

  // debounce of 100ms + throttle of 500ms
  // => Initially wait 100ms (renames are actually remove and add but we rather write once) (debounce)
  // subsequent calls after the first execution will wait 500ms-100ms to execute (throttling)
  const writeConfigFiles = throttle(_writeConfigFiles, 500, 100)

  function stopWatcher() {
    watchers.forEach((watcher) => watcher.close())
  }

  let server: ServerContext | undefined
  function setServerContext(_server: ServerContext) {
    server = _server
  }

  return {
    scanPages,
    writeConfigFiles,

    setServerContext,
    stopWatcher,

    generateRoutes,
    generateVueRouterProxy,

    definePageTransform(code: string, id: string) {
      return definePageTransform({
        code,
        id,
      })
    },
  }
}
