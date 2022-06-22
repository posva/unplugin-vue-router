import { TreeLeaf } from './tree'

export type Awaitable<T> = T | PromiseLike<T>

const MAX_LEVEL = 1000
export class LogTree {
  setPre(hasNext: boolean, parentPre = '') {
    return `${parentPre}${hasNext ? '├' : '└'}── `
  }

  setTransferPre(parentPre: string, hasNext: boolean) {
    return `${parentPre}${hasNext ? '│' : ' '}   `
  }

  parse(
    tree: TreeLeaf | TreeLeaf['children'],
    level = 0,
    parentPre = '',
    treeStr = ''
  ) {
    if (!this.check(tree, level)) return ''

    if (tree instanceof Map) {
      const total = tree.size
      let index = 0
      for (const [key, child] of tree) {
        const hasNext = index++ < total - 1
        const { children } = child

        treeStr += `${this.setPre(hasNext, parentPre)}${child}\n`

        if (children) {
          treeStr += this.parse(
            children,
            level + 1,
            this.setTransferPre(parentPre, hasNext)
          )
        }
      }
    } else {
      const children = tree.children
      treeStr = `${tree}\n`
      if (children) {
        treeStr += this.parse(children, level + 1)
      }
    }

    return treeStr
  }

  check(tree: TreeLeaf | TreeLeaf['children'], level = 0) {
    if (typeof tree !== 'object') return false
    if (level >= MAX_LEVEL) return false

    return true
  }
}

export function logTree(tree: TreeLeaf) {
  const log = new LogTree()
  console.log(log.parse(tree))
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

export function throttle(fn: () => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let pendingExecution = false

  return () => {
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null
        if (pendingExecution) {
          pendingExecution = false
          fn()
        }
      }, wait)
      fn()
    } else {
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
