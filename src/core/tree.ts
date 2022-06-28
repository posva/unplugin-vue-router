import { extname } from 'pathe'
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
   * Parent node.
   */
  parent?: TreeLeaf

  /**
   * Plugin options taken into account by the tree.
   */
  options: Options

  constructor(options: Options, value: string, parent?: TreeLeaf) {
    this.options = options
    this.parent = parent
    this.value = createTreeLeafValue(value, parent?.value)
  }

  /**
   * Adds a path to the tree
   *
   * @param path - route path of the file
   * @param filePath - file path, defaults to path for convenience and testing
   */
  insert(path: string, filePath: string = path) {
    const slashPos = path.indexOf('/')
    let head = slashPos < 0 ? path : path.slice(0, slashPos)
    const tail = slashPos < 0 ? '' : path.slice(slashPos + 1)
    let viewName = 'default'

    let segment = trimExtension(head)

    if (segment.includes('@')) {
      ;[segment, viewName] = segment.split('@')
      head = segment + extname(head)
    }

    const isComponent = segment !== head

    if (!this.children.has(segment)) {
      this.children.set(segment, new TreeLeaf(this.options, head, this))
    }
    const child = this.children.get(segment)!

    if (isComponent) {
      child.value.filePaths.set(viewName, filePath)
    }

    if (tail) {
      child.insert(tail, filePath)
    }
  }

  getSortedChildren() {
    return Array.from(this.children.values()).sort((a, b) =>
      a.value.path.localeCompare(b.value.path)
    )
  }

  remove(path: string) {
    const slashPos = path.indexOf('/')
    let head = slashPos < 0 ? path : path.slice(0, slashPos)
    const tail = slashPos < 0 ? '' : path.slice(slashPos + 1)

    let segment = trimExtension(head)
    let viewName = 'default'

    if (segment.includes('@')) {
      ;[segment, viewName] = segment.split('@')
      head = segment + extname(head)
    }

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
      if (child.children.size === 0 && child.value.filePaths.size === 0) {
        this.children.delete(segment)
      }
    } else {
      // it can only be component because we only listen for removed files, not folders
      if (isComponent) {
        child.value.filePaths.delete(viewName)
      }
      // this is the file we wanted to remove
      if (child.children.size === 0) {
        this.children.delete(segment)
      }
    }
  }

  isRoot() {
    return this.value.path === '/' && !this.value.filePaths.size
  }

  toString(): string {
    return `${this.value}${
      this.value.filePaths.size
        ? ` 📄(${Array.from(this.value.filePaths.keys()).join('|')})`
        : ''
    }`
  }
}

export function createPrefixTree(options: Options) {
  return new TreeLeaf(options, '')
}
