import { ResolvedOptions } from '../options'
import { TreeNode, PrefixTree } from './tree'
import { promises as fs } from 'fs'
import { asRoutePath, ImportsMap, logTree, throttle } from './utils'
import { generateRouteNamedMap } from '../codegen/generateRouteMap'
import { MODULE_ROUTES_PATH, MODULE_VUE_ROUTER_AUTO } from './moduleConstants'
import { generateRouteRecord } from '../codegen/generateRouteRecords'
import fg from 'fast-glob'
import { relative, resolve } from 'pathe'
import { ServerContext } from '../options'
import { getRouteBlock } from './customBlock'
import {
  RoutesFolderWatcher,
  HandlerContext,
  resolveFolderOptions,
} from './RoutesFolderWatcher'
import { generateDTS as _generateDTS } from '../codegen/generateDTS'
import { generateVueRouterProxy as _generateVueRouterProxy } from '../codegen/vueRouterModule'
import { definePageTransform, extractDefinePageNameAndPath } from './definePage'
import { EditableTreeNode } from './extendRoutes'
import { isPackageExists as isPackageInstalled } from 'local-pkg'

export function createRoutesContext(options: ResolvedOptions) {
  const { dts: preferDTS, root, routesFolder } = options
  const dts =
    preferDTS === false
      ? false
      : preferDTS === true
        ? resolve(root, 'typed-router.d.ts')
        : resolve(root, preferDTS)

  const routeTree = new PrefixTree(options)
  const editableRoutes = new EditableTreeNode(routeTree)

  const logger = new Proxy(console, {
    get(target, prop) {
      const res = Reflect.get(target, prop)
      if (typeof res === 'function') {
        return options.logs ? res : () => {}
      }
      return res
    },
  })

  // populated by the initial scan pages
  const watchers: RoutesFolderWatcher[] = []

  async function scanPages(startWatchers = true) {
    if (options.extensions.length < 1) {
      throw new Error(
        '"extensions" cannot be empty. Please specify at least one extension.'
      )
    }

    // initial scan was already done
    if (watchers.length > 0) {
      return
    }

    // get the initial list of pages
    await Promise.all(
      routesFolder
        .map((folder) => resolveFolderOptions(options, folder))
        .map((folder) => {
          if (startWatchers) {
            watchers.push(setupWatcher(new RoutesFolderWatcher(folder)))
          }

          // the ignore option must be relative to cwd or absolute
          const ignorePattern = folder.exclude.map((f) =>
            // if it starts with ** then it will work as expected
            f.startsWith('**') ? f : relative(folder.src, f)
          )

          return fg(folder.pattern, {
            cwd: folder.src,
            // TODO: do they return the symbolic link path or the original file?
            // followSymbolicLinks: false,
            ignore: ignorePattern,
          }).then((files) =>
            Promise.all(
              files
                // ensure consistent files in Windows/Unix and absolute paths
                .map((file) => resolve(folder.src, file))
                .map((file) =>
                  addPage({
                    routePath: asRoutePath(folder, file),
                    filePath: file,
                  })
                )
            )
          )
        })
    )

    for (const route of editableRoutes) {
      await options.extendRoute?.(route)
    }

    // immediately write the files without the throttle
    await _writeConfigFiles()
  }

  async function writeRouteInfoToNode(node: TreeNode, filePath: string) {
    const content = await fs.readFile(filePath, 'utf8')
    // TODO: cache the result of parsing the SFC (in the extractDefinePageAndName) so the transform can reuse the parsing
    node.hasDefinePage ||= content.includes('definePage')
    // TODO: track if it changed and to not always trigger HMR
    const definedPageNameAndPath = extractDefinePageNameAndPath(
      content,
      filePath
    )
    // TODO: track if it changed and if generateRoutes should be called again
    const routeBlock = getRouteBlock(filePath, content, options)
    // TODO: should warn if hasDefinePage and customRouteBlock
    // if (routeBlock) logger.log(routeBlock)
    node.setCustomRouteBlock(filePath, {
      ...routeBlock,
      ...definedPageNameAndPath,
    })
  }

  async function addPage(
    { filePath, routePath }: HandlerContext,
    triggerExtendRoute = false
  ) {
    logger.log(`added "${routePath}" for "${filePath}"`)
    const node = routeTree.insert(routePath, filePath)
    await writeRouteInfoToNode(node, filePath)

    if (triggerExtendRoute) {
      await options.extendRoute?.(new EditableTreeNode(node))
    }

    // TODO: trigger HMR vue-router/auto
    server?.updateRoutes()
  }

  async function updatePage({ filePath, routePath }: HandlerContext) {
    logger.log(`updated "${routePath}" for "${filePath}"`)
    const node = routeTree.getChild(filePath)
    if (!node) {
      logger.warn(`Cannot update "${filePath}": Not found.`)
      return
    }
    await writeRouteInfoToNode(node, filePath)
    await options.extendRoute?.(new EditableTreeNode(node))
    // no need to manually trigger the update of vue-router/auto-routes because
    // the change of the vue file will trigger HMR
  }

  function removePage({ filePath, routePath }: HandlerContext) {
    logger.log(`remove "${routePath}" for "${filePath}"`)
    routeTree.removeChild(filePath)
    // TODO: HMR vue-router/auto
    server?.updateRoutes()
  }

  function setupWatcher(watcher: RoutesFolderWatcher) {
    logger.log(`🤖 Scanning files in ${watcher.src}`)

    return watcher
      .on('change', async (ctx) => {
        await updatePage(ctx)
        writeConfigFiles()
      })
      .on('add', async (ctx) => {
        await addPage(ctx, true)
        writeConfigFiles()
      })
      .on('unlink', (ctx) => {
        removePage(ctx)
        writeConfigFiles()
      })

    // TODO: handle folder removal: apparently chokidar only emits a raw event when deleting a folder instead of the
    // unlinkDir event
  }

  function generateRoutes() {
    const importsMap = new ImportsMap()

    const routeList = `export const routes = ${generateRouteRecord(
      routeTree,
      options,
      importsMap
    )}\n`

    let hmr = `
export function handleHotUpdate(_router) {
  if (import.meta.hot) {
    import.meta.hot.data.router = _router
  }
}

if (import.meta.hot) {
  import.meta.hot.accept((mod) => {
    const router = import.meta.hot.data.router
    if (!router) {
      console.error('❌ router not found')
      return
    }
    router.clearRoutes()
    for (const route of mod.routes) {
      router.addRoute(route)
    }
    router.replace('')
  })
}
`

    // generate the list of imports
    let imports = importsMap.toString()
    // add an empty line for readability
    if (imports) {
      imports += '\n'
    }

    const newAutoRoutes = `${imports}${routeList}${hmr}\n`

    // prepend it to the code
    return newAutoRoutes
  }

  function generateDTS(): string {
    return _generateDTS({
      vueRouterModule: MODULE_VUE_ROUTER_AUTO,
      routesModule: MODULE_ROUTES_PATH,
      routeNamedMap: generateRouteNamedMap(routeTree),
    })
  }

  // NOTE: this code needs to be generated because otherwise it doesn't go through transforms and `vue-router/auto-routes`
  // cannot be resolved.
  const isPiniaColadaInstalled = isPackageInstalled('@pinia/colada')
  function generateVueRouterProxy() {
    return _generateVueRouterProxy(MODULE_ROUTES_PATH, options, {
      addPiniaColada: isPiniaColadaInstalled,
    })
  }

  let lastDTS: string | undefined
  async function _writeConfigFiles() {
    logger.time('writeConfigFiles')

    if (options.beforeWriteFiles) {
      await options.beforeWriteFiles(editableRoutes)
      logger.timeLog('writeConfigFiles', 'beforeWriteFiles()')
    }

    logTree(routeTree, logger.log)
    if (dts) {
      const content = generateDTS()
      if (lastDTS !== content) {
        await fs.writeFile(dts, content, 'utf-8')
        logger.timeLog('writeConfigFiles', 'wrote dts file')
        lastDTS = content
      }
    }
    logger.timeEnd('writeConfigFiles')
  }

  // debounce of 100ms + throttle of 500ms
  // => Initially wait 100ms (renames are actually remove and add but we rather write once) (debounce)
  // subsequent calls after the first execution will wait 500ms-100ms to execute (throttling)
  const writeConfigFiles = throttle(_writeConfigFiles, 500, 100)

  function stopWatcher() {
    if (watchers.length) {
      logger.log('🛑 stopping watcher')
      watchers.forEach((watcher) => watcher.close())
    }
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
