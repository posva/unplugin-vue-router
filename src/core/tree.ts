import type { Options } from '../options'
import { createTreeLeafValue } from './treeLeafValue'
import type { TreeLeafValue } from './treeLeafValue'
import { trimExtension } from './utils'

export class TreeLeaf {
  /**
   * value of the node
   */
  value: TreeLeafValue
  /**
   * children of the node
   */
  children: Map<string, TreeLeaf> = new Map()

  /**
   * Plugin options taken into account by the tree.
   */
  options: Options

  constructor(options: Options, value: string, parent?: TreeLeaf) {
    this.options = options
    this.value = createTreeLeafValue(options, value, parent?.value)
  }

  /**
   * Adds a path to the tree
   *
   * @param path - route path of the file
   * @param filePath - file path, defaults to path for convenience and testing
   */
  insert(path: string, filePath: string = path) {
    const slashPos = path.indexOf('/')
    const head = slashPos < 0 ? path : path.slice(0, slashPos)
    const tail = slashPos < 0 ? '' : path.slice(slashPos + 1)

    const segment = trimExtension(head)
    const isComponent = segment !== head

    if (!this.children.has(segment)) {
      this.children.set(segment, new TreeLeaf(this.options, head, this))
    }
    const child = this.children.get(segment)!

    if (isComponent) {
      child.value.filePath = filePath
    }

    if (tail) {
      child.insert(tail, filePath)
    }
  }

  remove(path: string) {
    const slashPos = path.indexOf('/')
    const head = slashPos < 0 ? path : path.slice(0, slashPos)
    const tail = slashPos < 0 ? '' : path.slice(slashPos + 1)

    const segment = trimExtension(head)
    const isComponent = segment !== head

    const child = this.children.get(segment)
    if (!child) {
      throw new Error(
        `Cannot Delete "${path}". "${head}" not found at "${this.value.path}".`
      )
    }
    if (tail) {
      child.remove(tail)
      // if the child doesn't create any route
      if (child.children.size === 0 && !child.value.filePath) {
        this.children.delete(segment)
      }
    } else {
      // it can only be component because we only listen for removed files, not folders
      if (isComponent) {
        child.value.filePath = undefined
      }
      // this is the file we wanted to remove
      if (child.children.size === 0) {
        this.children.delete(segment)
      }
    }
  }

  isRoot() {
    return this.value.path === '/' && !this.value.filePath
  }

  toString(): string {
    return `${this.value}${this.value.filePath ? ' 📄' : ''}`
  }
}

export function createPrefixTree(options: Options) {
  const tree = new TreeLeaf(options, '')
  return tree
}
