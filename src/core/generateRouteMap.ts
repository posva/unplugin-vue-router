import { TreeLeaf } from './tree'

export function generateRouteNamedMap(node: TreeLeaf): string {
  // root
  if (node.isRoot()) {
    console.log('is ROOOt')
    return `export interface RouteNamedMap {
${Array.from(node.children.values()).map(generateRouteNamedMap).join('')}}`
  }

  return (
    // if the node has a filePath, it's a component, it has a routeName and it should be referenced in the RouteNamedMap
    // otherwise it should be skipped to avoid navigating to a route that doesn't render anything
    (node.value.filePath
      ? `  '${node.value.routeName}': ${generateRouteRecordInfo(node)},\n`
      : '') +
    (node.children.size > 0
      ? Array.from(node.children.values()).map(generateRouteNamedMap).join('\n')
      : '')
  )
}

export function generateRouteRecordInfo(node: TreeLeaf) {
  return `RouteRecordInfo<'${node.value.routeName}', '${node.value.path}'>`
}

export interface RouteRecordInfo<
  Name extends string = string,
  Path extends string = string
> {
  name: Name
  path: Path
  // TODO:
  // params: Params
  // TODO: meta
}
