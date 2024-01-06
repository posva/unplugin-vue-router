import { TreeNode } from '../core/tree'

export function generateRouteParams(node: TreeNode, isRaw: boolean): string {
  // node.params is a getter so we compute it once
  const nodeParams = node.params
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

/**
 * Utility type for raw and non raw params like :id+
 *
 */
export type ParamValueOneOrMore<isRaw extends boolean> = [
  ParamValue<isRaw>,
  ...ParamValue<isRaw>[]
]

/**
 * Utility type for raw and non raw params like :id*
 *
 */
export type ParamValueZeroOrMore<isRaw extends boolean> =
  | ParamValue<isRaw>[]
  | undefined
  | null

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
