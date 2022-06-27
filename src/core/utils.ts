import { TreeLeaf } from './tree'
import type { TreeRouteParam } from './treeLeafValue'
import { pascalCase } from 'scule'

export type Awaitable<T> = T | PromiseLike<T>

export type LiteralStringUnion<LiteralType, BaseType extends string = string> =
  | LiteralType
  | (BaseType & Record<never, never>)

export function logTree(tree: TreeLeaf) {
  console.log(printTree(tree))
}

const MAX_LEVEL = 1000
function printTree(
  tree: TreeLeaf | TreeLeaf['children'],
  level = 0,
  parentPre = '',
  treeStr = ''
): string {
  // end of recursion
  if (typeof tree !== 'object' || level >= MAX_LEVEL) return ''

  if (tree instanceof Map) {
    const total = tree.size
    let index = 0
    for (const [_key, child] of tree) {
      const hasNext = index++ < total - 1
      const { children } = child

      treeStr += `${`${parentPre}${hasNext ? '├' : '└'}── `}${child}\n`

      if (children) {
        treeStr += printTree(
          children,
          level + 1,
          `${parentPre}${hasNext ? '│' : ' '}   `
        )
      }
    }
  } else {
    const children = tree.children
    treeStr = `${tree}\n`
    if (children) {
      treeStr += printTree(children, level + 1)
    }
  }

  return treeStr
}

/**
 * Typesafe alternative to Array.isArray
 * https://github.com/microsoft/TypeScript/pull/48228
 */
export const isArray: (arg: ArrayLike<any> | any) => arg is ReadonlyArray<any> =
  Array.isArray

export function trimExtension(path: string) {
  const lastDot = path.lastIndexOf('.')
  return lastDot < 0 ? path : path.slice(0, lastDot)
}

export function throttle(fn: () => void, wait: number, initialWait: number) {
  let pendingExecutionTimeout: ReturnType<typeof setTimeout> | null = null
  let pendingExecution = false
  let executionTimeout: ReturnType<typeof setTimeout> | null = null

  return () => {
    if (pendingExecutionTimeout == null) {
      pendingExecutionTimeout = setTimeout(() => {
        pendingExecutionTimeout = null
        if (pendingExecution) {
          pendingExecution = false
          fn()
        }
      }, wait)
      executionTimeout = setTimeout(() => {
        executionTimeout = null
        fn()
      }, initialWait)
    } else if (executionTimeout == null) {
      // we run the function recently, so we can skip it and add a pending execution
      pendingExecution = true
    }
  }
}

const LEADING_SLASH_RE = /^\//
const TRAILING_SLASH_RE = /\/$/
export function joinPath(...paths: string[]): string {
  let result = ''
  for (const path of paths) {
    result =
      result.replace(TRAILING_SLASH_RE, '') +
      '/' +
      path.replace(LEADING_SLASH_RE, '')
  }
  return result
}

function paramToName({ paramName, modifier, isSplat }: TreeRouteParam) {
  return `${isSplat ? '$' : ''}${
    paramName.charAt(0).toUpperCase() + paramName.slice(1)
  }${
    modifier
    // ? modifier === '+'
    //   ? 'OneOrMore'
    //   : modifier === '?'
    //   ? 'ZeroOrOne'
    //   : 'ZeroOrMore'
    // : ''
  }`
}

/**
 * Creates a name based of the node path segments.
 *
 * @param node - the node to get the path from
 * @param parent - the parent node
 * @returns a route name
 */
export function getPascalCaseRouteName(node: TreeLeaf): string {
  if (node.parent?.isRoot() && node.value.pathSegment === '') return 'Root'

  let name = node.value.subSegments
    .map((segment) => {
      if (typeof segment === 'string') {
        return pascalCase(segment)
      }
      // else it's a param
      return paramToName(segment)
    })
    .join('')

  if (node.value.filePath && node.children.has('index')) {
    name += 'Parent'
  }

  const parent = node.parent

  return (
    (parent && !parent.isRoot()
      ? getPascalCaseRouteName(parent).replace(/Parent$/, '')
      : '') + name
  )
}

/**
 * Joins the path segments of a node into a name that corresponds to the filepath represented by the node.
 *
 * @param node - the node to get the path from
 * @returns a route name
 */
export function getFileBasedRouteName(node: TreeLeaf): string {
  if (!node.parent) return ''
  return getFileBasedRouteName(node.parent) + '/' + node.value.rawSegment
}
