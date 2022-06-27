import type { TreeLeaf } from '../core/tree'

export function generateRouteRecord(
  node: TreeLeaf,
  indent = 0,
  parent: TreeLeaf | null = null
): string {
  // root
  if (node.value.path === '/' && indent === 0) {
    return `[
${Array.from(node.children.values())
  .map((child) => generateRouteRecord(child, indent + 1))
  .join(',\n')}
]`
  }

  const startIndent = ' '.repeat(indent * 2)
  const indentStr = ' '.repeat((indent + 1) * 2)

  const name = node.options.getRouteName(node)

  return `${startIndent}{
${indentStr}path: "${(parent ? '' : '/') + node.value.pathSegment}",
${indentStr}${node.value.filePath ? `name: "${name}",` : '/* no name */'}
${indentStr}${
    node.value.filePath
      ? `component: () => import('${node.value.filePath}'),`
      : '/* no component */'
  }
${indentStr}${
    node.children.size > 0
      ? `children: [
${Array.from(node.children.values())
  .map((child) => generateRouteRecord(child, indent + 2, node))
  .join(',\n')}
${indentStr}],`
      : '/* no children */'
  }
${startIndent}}`
}
