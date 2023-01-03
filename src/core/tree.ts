import type { ResolvedOptions } from '../options'
import { createTreeNodeValue, TreeRouteParam } from './treeNodeValue'
import type { TreeNodeValue } from './treeNodeValue'
import { trimExtension } from './utils'
import { CustomRouteBlock } from './customBlock'

export class TreeNode {
  /**
   * value of the node
   */
  value: TreeNodeValue

  /**
   * children of the node
   */
  children: Map<string, TreeNode> = new Map()

  /**
   * Parent node.
   */
  parent?: TreeNode

  /**
   * Plugin options taken into account by the tree.
   */
  options: ResolvedOptions

  /**
   * Should this page import the page info
   */
  hasDefinePage: boolean = false

  constructor(options: ResolvedOptions, filePath: string, parent?: TreeNode) {
    this.options = options
    this.parent = parent
    this.value = createTreeNodeValue(filePath, parent?.value)
  }

  /**
   * Adds a path to the tree. `path` cannot start with a `/`.
   *
   * @param path - route path segment to insert
   * @param filePath - file path, defaults to path for convenience and testing
   */
  insert(path: string, filePath: string = path): TreeNode {
    const { tail, segment, viewName, isComponent } = splitFilePath(
      path,
      this.options
    )

    if (!this.children.has(segment)) {
      this.children.set(segment, new TreeNode(this.options, segment, this))
    }
    const child = this.children.get(segment)!

    if (isComponent) {
      child.value.filePaths.set(viewName, filePath)
    }

    if (tail) {
      return child.insert(tail, filePath)
    }
    return child
  }

  setCustomRouteBlock(path: string, routeBlock: CustomRouteBlock | undefined) {
    this.value.setOverride(path, routeBlock)
  }

  getSortedChildren() {
    return Array.from(this.children.values()).sort((a, b) =>
      a.path.localeCompare(b.path)
    )
  }

  /**
   * Remove a route from the tree.
   *
   * @param path - file path of the file
   */
  remove(path: string) {
    const { tail, segment, viewName, isComponent } = splitFilePath(
      path,
      this.options
    )

    const child = this.children.get(segment)
    if (!child) {
      throw new Error(
        `Cannot Delete "${path}". "${segment}" not found at "${this.path}".`
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
      if (child.children.size === 0 && child.value.filePaths.size === 0) {
        this.children.delete(segment)
      }
    }
  }

  /**
   * Returns the route path of the node without parent paths.
   */
  get path() {
    return (
      this.value.overrides.path ??
      (this.parent?.isRoot() ? '/' : '') + this.value.pathSegment
    )
  }

  /**
   * Returns the route path of the node including parent paths.
   */
  get fullPath() {
    return this.value.overrides.path ?? this.value.path
  }

  get name() {
    return this.value.overrides.name || this.options.getRouteName(this)
  }

  get meta() {
    const overrideMeta = { ...this.value.overrides.meta }

    if (this.value.includeLoaderGuard) {
      overrideMeta._loaderGuard = true
    }

    return Object.keys(overrideMeta).length > 0
      ? JSON.stringify(overrideMeta, null, 2)
      : ''
  }

  get params(): TreeRouteParam[] {
    const params = this.value.isParam() ? [...this.value.params] : []
    let node = this.parent
    while (node) {
      if (node.value.isParam()) {
        params.unshift(...node.value.params)
      }
      node = node.parent
    }

    return params
  }

  isRoot() {
    return this.value.path === '/' && !this.value.filePaths.size
  }

  toString(): string {
    return `${this.value}${
      // either we have multiple names
      this.value.filePaths.size > 1 ||
      // or we have one name and it's not default
      (this.value.filePaths.size === 1 && !this.value.filePaths.get('default'))
        ? ` ⎈(${Array.from(this.value.filePaths.keys()).join(', ')})`
        : ''
    }${this.hasDefinePage ? ' ⚑ definePage()' : ''}`
  }
}

export function createPrefixTree(options: ResolvedOptions) {
  return new TreeNode(options, '')
}

/**
 * Splits a path into by finding the first '/' and returns the tail and segment. If it has an extension, it removes it.
 * If it contains a named view, it returns the view name as well (otherwise it's default).
 *
 * @param filePath - filePath to split
 */
function splitFilePath(filePath: string, options: ResolvedOptions) {
  const slashPos = filePath.indexOf('/')
  let head = slashPos < 0 ? filePath : filePath.slice(0, slashPos)
  const tail = slashPos < 0 ? '' : filePath.slice(slashPos + 1)

  let segment = head
  // only the last segment can be a filename with an extension
  if (!tail) {
    segment = trimExtension(head, options.extensions)
  }
  let viewName = 'default'

  const namedSeparatorPos = segment.indexOf('@')

  if (namedSeparatorPos > 0) {
    viewName = segment.slice(namedSeparatorPos + 1)
    segment = segment.slice(0, namedSeparatorPos)
  }

  const isComponent = segment !== head

  return {
    segment,
    tail,
    viewName,
    isComponent,
  }
}
