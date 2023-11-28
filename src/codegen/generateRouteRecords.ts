import type { TreeNode } from '../core/tree'
import { ImportsMap } from '../core/utils'
import { ResolvedOptions, _OptionsImportMode } from '../options'

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
      importsMap.addDefault(`${filePath}?definePage&vue`, pageDataImport)
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
  importMode: _OptionsImportMode,
  importsMap: ImportsMap
): string {
  const files = Array.from(node.value.components)
  const isDefaultExport = files.length === 1 && files[0][0] === 'default'
  return isDefaultExport
    ? `component: ${generatePageImport(files[0][1], importMode, importsMap)},`
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
 * Generate the import (dynamic or static) for the given filepath. If the filepath is a static import, add it to the
 * @param filepath - the filepath to the file
 * @param importMode - the import mode to use
 * @param importsMap - the import list to fill
 * @returns
 */
function generatePageImport(
  filepath: string,
  importMode: _OptionsImportMode,
  importsMap: ImportsMap
) {
  const mode =
    typeof importMode === 'function' ? importMode(filepath) : importMode
  if (mode === 'async') {
    return `() => import('${filepath}')`
  } else {
    const importName = `_page_${importsMap.size}`
    importsMap.addDefault(filepath, importName)
    return importName
  }
}

function generateImportList(node: TreeNode, indentStr: string) {
  const files = Array.from(node.value.components)

  return `[
${files
  .map(([_key, path]) => `${indentStr}  () => import('${path}')`)
  .join(',\n')}
${indentStr}]`
}

const LOADER_GUARD_RE = /['"]_loaderGuard['"]:.*$/

function formatMeta(node: TreeNode, indent: string): string {
  const meta = node.meta
  const formatted =
    meta &&
    meta
      .split('\n')
      .map(
        // FIXME: remove after deprecated defineLoader is removed
        (line) =>
          indent +
          line.replace(
            LOADER_GUARD_RE,
            '[_HasDataLoaderMeta]: ' +
              generateImportList(node, indent + '  ') +
              ','
          )
      )
      .join('\n')

  return formatted ? '\n' + indent + 'meta: ' + formatted.trimStart() : ''
}
