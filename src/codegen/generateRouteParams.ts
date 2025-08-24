import { TreeNode } from '../core/tree'
import { isTreeParamOptional } from '../core/treeNodeValue'

export function generateRouteParams(node: TreeNode, isRaw: boolean): string {
  // node.pathParams is a getter so we compute it once
  // this version does not support query params
  const nodeParams = node.pathParams
  return nodeParams.length > 0
    ? `{ ${nodeParams
        .map(
          (param) =>
            `${param.paramName}${param.optional ? '?' : ''}: ` +
            (param.modifier === '+'
              ? `ParamValueOneOrMore<${isRaw}>`
              : param.modifier === '*'
                ? `ParamValueZeroOrMore<${isRaw}>`
                : param.modifier === '?'
                  ? `ParamValueZeroOrOne<${isRaw}>`
                  : `ParamValue<${isRaw}>`)
        )
        .join(', ')} }`
    : // no params allowed
      'Record<never, never>'
}

export function EXPERIMENTAL_generateRouteParams(
  node: TreeNode,
  types: Array<string | null>,
  isRaw: boolean
) {
  // node.params is a getter so we compute it once
  const nodeParams = node.params
  return nodeParams.length > 0
    ? `{ ${nodeParams
        .map((param, i) => {
          const type = types[i]
          return `${param.paramName}${
            isRaw && isTreeParamOptional(param) ? '?' : ''
          }: ${
            'modifier' in param
              ? param.repeatable
                ? param.optional || isRaw // in raw mode, the tuple version is annoying to pass
                  ? 'string[]'
                  : '[string, ...string[]]'
                : param.optional
                  ? 'string | null'
                  : 'string'
              : type
          }`
        })
        .join(', ')} }`
    : // no params allowed
      'Record<never, never>'
}

// TODO: Remove in favor of inline types because it's easier to read

/**
 * Utility type for raw and non raw params like :id+
 *
 */
export type ParamValueOneOrMore<isRaw extends boolean> = [
  ParamValue<isRaw>,
  ...ParamValue<isRaw>[],
]

/**
 * Utility type for raw and non raw params like :id*
 *
 */
export type ParamValueZeroOrMore<isRaw extends boolean> = true extends isRaw
  ? ParamValue<isRaw>[] | undefined | null
  : ParamValue<isRaw>[] | undefined

/**
 * Utility type for raw and non raw params like :id?
 *
 */
export type ParamValueZeroOrOne<isRaw extends boolean> = true extends isRaw
  ? string | number | null | undefined
  : string

/**
 * Utility type for raw and non raw params like :id
 *
 */
export type ParamValue<isRaw extends boolean> = true extends isRaw
  ? string | number
  : string
