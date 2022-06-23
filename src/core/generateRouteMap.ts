import type {
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  RouteParamsRaw,
  RouteParamValueRaw,
  RouteRecordName,
} from 'vue-router'
import { TreeLeaf } from './tree'

export function generateRouteNamedMap(node: TreeLeaf): string {
  // root
  if (node.isRoot()) {
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
  return `RouteRecordInfo<'${node.value.routeName}', '${
    node.value.path
  }', ${generateRouteParams(node, true)}>`
}

export function generateRouteParams(node: TreeLeaf, isRaw: boolean): string {
  return node.value.isParam()
    ? `{ ${node.value.params
        .map(
          (param) =>
            `${param.paramName}${param.optional ? '?' : ''}: ` +
            (param.modifier === '+'
              ? `_ParamValueOneOrMore<${isRaw}>`
              : param.modifier === '*'
              ? `_ParamValueZeroOrMore<${isRaw}>`
              : param.modifier === '?'
              ? `_ParamValueZeroOrOne<${isRaw}>`
              : `_ParamValue<${isRaw}>`)
        )
        .join(', ')} }`
    : // no params allowed
      'Record<any, never>'
}

export interface RouteRecordInfo<
  Name extends string = string,
  Path extends string = string,
  ParamsRaw extends RouteParamsRaw = RouteParamsRaw
> {
  name: Name
  path: Path
  paramsRaw: ParamsRaw
  // TODO:
  // params: Params
  // TODO: meta
}

export interface RouteLocationNormalizedTyped<
  Name extends RouteRecordName = RouteRecordName,
  Path extends string = string
> extends RouteLocationNormalized {
  path: Path
  name: Name
}

export interface RouteLocationNormalizedLoadedTyped<
  Name extends RouteRecordName = RouteRecordName,
  Path extends string = string
> extends RouteLocationNormalizedLoaded {
  path: Path
  name: Name
}

/**
 * Utility type for raw and non raw params like :id+
 *
 * @internal
 */
export type _ParamValueOneOrMore<isRaw extends boolean> = true extends isRaw
  ? readonly [string | number, ...(string | number)[]]
  : readonly [string, ...string[]]

/**
 * Utility type for raw and non raw params like :id*
 *
 * @internal
 */
export type _ParamValueZeroOrMore<isRaw extends boolean> = true extends isRaw
  ? readonly (string | number)[] | undefined | null
  : readonly string[] | undefined | null

/**
 * Utility type for raw and non raw params like :id?
 *
 * @internal
 */
export type _ParamValueZeroOrOne<isRaw extends boolean> = true extends isRaw
  ? RouteParamValueRaw
  : string

/**
 * Utility type for raw and non raw params like :id
 *
 * @internal
 */
export type _ParamValue<isRaw extends boolean> = true extends isRaw
  ? string | number
  : string
