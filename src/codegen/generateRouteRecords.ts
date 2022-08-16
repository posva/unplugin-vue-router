import type { TreeLeaf } from '../core/tree'

export function generateRouteRecord(node: TreeLeaf, indent = 0): string {
  // root
  if (node.value.path === '/' && indent === 0) {
    return `[
${node
  .getSortedChildren()
  .map((child) => generateRouteRecord(child, indent + 1))
  .join(',\n')}
]`
  }

  const startIndent = ' '.repeat(indent * 2)
  const indentStr = ' '.repeat((indent + 1) * 2)

  // TODO: should meta be defined a different way to allow preserving imports?
  // const meta = node.value.overrides.meta

  // path
  return `${startIndent}{
${indentStr}path: '${node.path}',
${indentStr}${
    node.value.filePaths.size ? `name: '${node.name}',` : '/* no name */'
  }
${
  // component
  indentStr
}${
    node.value.filePaths.size
      ? generateRouteRecordComponent(node, indentStr)
      : '/* no component */'
  }
${
  // props
  indentStr
}${
    node.value.overrides.props != null
      ? `props: ${node.value.overrides.props},`
      : '/* no props */'
  }
${
  // children
  indentStr
}${
    node.children.size > 0
      ? `children: [
${node
  .getSortedChildren()
  .map((child) => generateRouteRecord(child, indent + 2))
  .join(',\n')}
${indentStr}],`
      : '/* no children */'
  }${formatMeta(node, indentStr)}
${startIndent}}`
}

function generateRouteRecordComponent(
  node: TreeLeaf,
  indentStr: string
): string {
  const files = Array.from(node.value.filePaths)
  const isDefaultExport = files.length === 1 && files[0][0] === 'default'
  return isDefaultExport
    ? `component: () => import('${files[0][1]}'),`
    : // files has at least one entry
      `components: {
${files
  .map(([key, path]) => `${indentStr + '  '}'${key}': () => import('${path}')`)
  .join(',\n')}
${indentStr}},`
}

function generateImportList(node: TreeLeaf, indentStr: string) {
  const files = Array.from(node.value.filePaths)

  return `[
${files
  .map(([_key, path]) => `${indentStr}  () => import('${path}')`)
  .join(',\n')}
${indentStr}]`
}

const LOADER_GUARD_RE = /['"]_loaderGuard['"]:.*$/

function formatMeta(node: TreeLeaf, indent: string): string {
  const meta = node.meta
  const formatted =
    meta &&
    meta
      .split('\n')
      .map(
        (line) =>
          indent +
          line.replace(
            LOADER_GUARD_RE,
            '[_LoaderSymbol]: ' + generateImportList(node, indent + '  ') + ','
          )
      )
      .join('\n')

  return formatted ? '\n' + indent + 'meta: ' + formatted.trimStart() : ''
}
