import { ResolvedOptions } from '../options'
import { TreeNode, PrefixTree } from './tree'
import { promises as fs } from 'fs'
import {
  appendExtensionListToPattern,
  asRoutePath,
  ImportsMap,
  logTree,
  throttle,
} from './utils'
import { generateRouteNamedMap } from '../codegen/generateRouteMap'
import { MODULE_ROUTES_PATH, MODULE_VUE_ROUTER } from './moduleConstants'
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

  function log(...args: any[]) {
    if (options.logs) {
      console.log(...args)
    }
  }

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
    // TODO: cache the result of parsing the SFC so the transform can reuse the parsing
    node.hasDefinePage = content.includes('definePage')
    const [definedPageNameAndPath, routeBlock] = await Promise.all([
      extractDefinePageNameAndPath(content, filePath),
      getRouteBlock(filePath, options),
    ])
    // TODO: should warn if hasDefinePage and customRouteBlock
    // if (routeBlock) log(routeBlock)
    node.setCustomRouteBlock(filePath, {
      ...routeBlock,
      ...definedPageNameAndPath,
    })
  }

  async function addPage(
    { filePath, routePath }: HandlerContext,
    triggerExtendRoute = false
  ) {
    log(`added "${routePath}" for "${filePath}"`)
    // TODO: handle top level named view HMR
    const node = routeTree.insert(routePath, filePath)

    await writeRouteInfoToNode(node, filePath)

    if (triggerExtendRoute) {
      await options.extendRoute?.(new EditableTreeNode(node))
    }
  }

  async function updatePage({ filePath, routePath }: HandlerContext) {
    log(`updated "${routePath}" for "${filePath}"`)
    const node = routeTree.getChild(filePath)
    if (!node) {
      console.warn(`Cannot update "${filePath}": Not found.`)
      return
    }
    await writeRouteInfoToNode(node, filePath)
    await options.extendRoute?.(new EditableTreeNode(node))
  }

  function removePage({ filePath, routePath }: HandlerContext) {
    log(`remove "${routePath}" for "${filePath}"`)
    routeTree.removeChild(filePath)
  }

  function setupWatcher(watcher: RoutesFolderWatcher) {
    log(`🤖 Scanning files in ${watcher.src}`)

    return watcher
      .on('change', async (ctx) => {
        await updatePage(ctx)
        writeConfigFiles()
      })
      .on('add', async (ctx) => {
        await addPage(ctx, true)
        writeConfigFiles()
      })
      .on('unlink', async (ctx) => {
        await removePage(ctx)
        writeConfigFiles()
      })

    // TODO: handle folder removal: apparently chokidar only emits a raw event when deleting a folder instead of the
    // unlinkDir event
  }

  function generateRoutes() {
    const importsMap = new ImportsMap()

    const routesExport = `export const routes = ${generateRouteRecord(
      routeTree,
      options,
      importsMap
    )}`

    // generate the list of imports
    let imports = `${importsMap}`
    // add an empty line for readability
    if (imports) {
      imports += '\n'
    }

    // prepend it to the code
    return `${imports}${routesExport}\n`
  }

  function generateDTS(): string {
    return _generateDTS({
      vueRouterModule: MODULE_VUE_ROUTER,
      routesModule: MODULE_ROUTES_PATH,
      routeNamedMap: generateRouteNamedMap(routeTree),
    })
  }

  // NOTE: this code needs to be generated because otherwise it doesn't go through transforms and `vue-router/auto-routes`
  // cannot be resolved.
  function generateVueRouterProxy() {
    return _generateVueRouterProxy(MODULE_ROUTES_PATH, options)
  }

  let lastDTS: string | undefined
  let lastTypesConfigDTS: string | undefined
  async function _writeConfigFiles() {
    console.time('writeConfigFiles')
    log('💾 writing...')

    if (options.beforeWriteFiles) {
      await options.beforeWriteFiles(editableRoutes)
      console.timeLog('writeConfigFiles', 'ran beforeWriteFiles')
    }

    logTree(routeTree, log)
    if (dts) {
      const content = generateDTS()
      if (lastDTS !== content) {
        await fs.writeFile(dts, content, 'utf-8')
        console.timeLog('writeConfigFiles', 'wrote dts')
        lastDTS = content

        // update the files
        server?.invalidate(MODULE_ROUTES_PATH)
        server?.invalidate(MODULE_VUE_ROUTER)
        server?.reload()
      }
    }
    console.timeEnd('writeConfigFiles')
  }

  // debounce of 100ms + throttle of 500ms
  // => Initially wait 100ms (renames are actually remove and add but we rather write once) (debounce)
  // subsequent calls after the first execution will wait 500ms-100ms to execute (throttling)
  const writeConfigFiles = throttle(_writeConfigFiles, 500, 100)

  function stopWatcher() {
    if (watchers.length) {
      if (options.logs) {
        console.log('🛑 stopping watcher')
      }
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
