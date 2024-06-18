import type { TreeNode } from '../core/tree'
import { ImportsMap } from '../core/utils'
import { type ResolvedOptions } from '../options'

/**
 * Generate the route records for the given node.
 *
 * @param node - the node to generate the route record for
 * @param options - the options to use
 * @param importsMap - the imports map to fill and use
 * @param indent - the indent level
 * @returns the code of the routes as a string
 */
export function generateRouteRecord(
  node: TreeNode,
  options: ResolvedOptions,
  importsMap: ImportsMap,
  indent = 0
): string {
  // root
  if (node.value.path === '/' && indent === 0) {
    return `[
${node
  .getSortedChildren()
  .map((child) => generateRouteRecord(child, options, importsMap, indent + 1))
  .join(',\n')}
]`
  }

  const startIndent = ' '.repeat(indent * 2)
  const indentStr = ' '.repeat((indent + 1) * 2)

  // TODO: should meta be defined a different way to allow preserving imports?
  // const meta = node.value.overrides.meta

  // compute once since it's a getter
  const overrides = node.value.overrides

  // path
  const routeRecord = `${startIndent}{
${indentStr}path: '${node.path}',
${indentStr}${
    node.value.components.size
      ? `name: '${node.name}',`
      : `/* internal name: '${node.name}' */`
  }
${
  // component
  indentStr
}${
    node.value.components.size
      ? generateRouteRecordComponent(
          node,
          indentStr,
          options.importMode,
          importsMap
        )
      : '/* no component */'
  }
${overrides.props != null ? indentStr + `props: ${overrides.props},\n` : ''}${
    overrides.alias != null
      ? indentStr + `alias: ${JSON.stringify(overrides.alias)},\n`
      : ''
  }${
    // children
    indentStr
  }${
    node.children.size > 0
      ? `children: [
${node
  .getSortedChildren()
  .map((child) => generateRouteRecord(child, options, importsMap, indent + 2))
  .join(',\n')}
${indentStr}],`
      : '/* no children */'
  }${formatMeta(node, indentStr)}
${startIndent}}`

  if (node.hasDefinePage) {
    const definePageDataList: string[] = []
    for (const [name, filePath] of node.value.components) {
      const pageDataImport = `_definePage_${name}_${importsMap.size}`
      definePageDataList.push(pageDataImport)
      importsMap.addDefault(
        // TODO: apply the language used in the sfc
        `${filePath}?definePage&vue&lang.tsx`,
        pageDataImport
      )
    }

    if (definePageDataList.length) {
      importsMap.add('unplugin-vue-router/runtime', '_mergeRouteRecord')
      return `  _mergeRouteRecord(
${routeRecord},
  ${definePageDataList.join(',\n')}
  )`
    }
  }

  return routeRecord
}

function generateRouteRecordComponent(
  node: TreeNode,
  indentStr: string,
  importMode: ResolvedOptions['importMode'],
  importsMap: ImportsMap
): string {
  const files = Array.from(node.value.components)
  const isDefaultExport = files.length === 1 && files[0]![0] === 'default'
  return isDefaultExport
    ? `component: ${generatePageImport(files[0]![1], importMode, importsMap)},`
    : // files has at least one entry
      `components: {
${files
  .map(
    ([key, path]) =>
      `${indentStr + '  '}'${key}': ${generatePageImport(
        path,
        importMode,
        importsMap
      )}`
  )
  .join(',\n')}
${indentStr}},`
}

/**
 * Generate the import (dynamic or static) for the given filepath. If the filepath is a static import, add it to the importsMap.
 *
 * @param filepath - the filepath to the file
 * @param importMode - the import mode to use
 * @param importsMap - the import list to fill
 * @returns
 */
function generatePageImport(
  filepath: string,
  importMode: ResolvedOptions['importMode'],
  importsMap: ImportsMap
) {
  const mode =
    typeof importMode === 'function' ? importMode(filepath) : importMode
  if (mode === 'async') {
    return `() => import('${filepath}')`
  }
  // mode === 'sync'
  // return the name of the import e.g. `_page_0` for `import _page_0 from '...'`
  const existingEntry = importsMap
    .getImportList(filepath)
    .find((entry) => entry.name === 'default')
  if (existingEntry) {
    return existingEntry.as
  }
  const importName = `_page_${importsMap.size}`
  importsMap.addDefault(filepath, importName)
  return importName
}

function formatMeta(node: TreeNode, indent: string): string {
  const meta = node.meta
  const formatted =
    meta &&
    meta
      .split('\n')
      .map((line) => indent + line)
      .join('\n')

  return formatted ? '\n' + indent + 'meta: ' + formatted.trimStart() : ''
}
