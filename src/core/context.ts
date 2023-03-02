import { ResolvedOptions } from '../options'
import { createPrefixTree, TreeNode } from './tree'
import { promises as fs } from 'fs'
import {
  appendExtensionListToPattern,
  asRoutePath,
  logTree,
  throttle,
} from './utils'
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

  const routeTree = createPrefixTree(options)
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

    const globalPattern = appendExtensionListToPattern(
      options.filePatterns,
      options.extensions
    )

    // get the initial list of pages
    await Promise.all(
      routesFolder.map((folder) => {
        if (startWatchers) {
          watchers.push(setupWatcher(new RoutesFolderWatcher(folder, options)))
        }

        // override the pattern if the folder has a custom pattern
        const pattern = folder.filePatterns
          ? appendExtensionListToPattern(
              folder.filePatterns,
              // also override the extensions if the folder has a custom extensions
              folder.extensions || options.extensions
            )
          : globalPattern

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

  async function writeRouteInfoToNode(node: TreeNode, path: string) {
    const content = await fs.readFile(path, 'utf8')
    // TODO: cache the result of parsing the SFC so the transform can reuse the parsing
    node.hasDefinePage = content.includes('definePage')
    const [definedPageNameAndPath, routeBlock] = await Promise.all([
      extractDefinePageNameAndPath(content, path),
      getRouteBlock(path, options),
    ])
    // TODO: should warn if hasDefinePage and customRouteBlock
    // if (routeBlock) log(routeBlock)
    node.setCustomRouteBlock(path, { ...routeBlock, ...definedPageNameAndPath })
    node.value.includeLoaderGuard =
      options.dataFetching && (await hasNamedExports(path))
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
    log('💾 writing...')

    if (options.beforeWriteFiles) {
      await options.beforeWriteFiles(editableRoutes)
    }

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
