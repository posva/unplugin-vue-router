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
   * @param path - path segment to insert. **It must contain the file extension** this allows to
   * differentiate between folders and files.
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
   * Delete and detach itself from the tree.
   */
  delete() {
    // TODO: rename remove to removeChild
    if (!this.parent) {
      throw new Error('Cannot delete the root node.')
    }
    this.parent.children.delete(this.value.rawSegment)
    // clear link to parent
    this.parent = undefined
  }

  /**
   * Remove a route from the tree. The path shouldn't start with a `/` but it can be a nested one. e.g. `foo/bar.vue`.
   * The `path` should be relative to the page folder.
   *
   * @param path - path segment of the file
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
   * Returns the route path of the node without parent paths. If the path was overridden, it returns the override.
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

  /**
   * Returns the route name of the node. If the name was overridden, it returns the override.
   */
  get name() {
    return this.value.overrides.name || this.options.getRouteName(this)
  }

  /**
   * Returns the meta property as an object.
   */
  get metaAsObject() {
    const meta = {
      ...this.value.overrides.meta,
    }
    if (this.value.includeLoaderGuard) {
      meta._loaderGuard = true
    }
    return meta
  }

  /**
   * Returns the JSON string of the meta object of the node. If the meta was overridden, it returns the override. If
   * there is no override, it returns an empty string.
   */
  get meta() {
    const overrideMeta = this.metaAsObject

    return Object.keys(overrideMeta).length > 0
      ? JSON.stringify(overrideMeta, null, 2)
      : ''
  }

  get params(): TreeRouteParam[] {
    const params = this.value.isParam() ? [...this.value.params] : []
    let node = this.parent
    // add all the params from the parents
    while (node) {
      if (node.value.isParam()) {
        params.unshift(...node.value.params)
      }
      node = node.parent
    }

    return params
  }

  /**
   * Returns wether this tree node is the root node of the tree.
   *
   * @returns true if the node is the root node
   */
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

/**
 * Creates a new prefix tree. This is meant to only be the root node. It has access to extra methods that only make
 * sense on the root node.
 */
export class PrefixTree extends TreeNode {
  map = new Map<string, TreeNode>()

  constructor(options: ResolvedOptions) {
    super(options, '')
  }

  insert(path: string, filePath: string = path) {
    const node = super.insert(path, filePath)
    this.map.set(filePath, node)

    return node
  }

  getChild(filePath: string) {
    return this.map.get(filePath)
  }

  /**
   *
   * @param filePath -
   */
  removeChild(filePath: string) {
    if (this.map.has(filePath)) {
      this.map.get(filePath)!.delete()
      this.map.delete(filePath)
    }
  }
}

export function createPrefixTree(options: ResolvedOptions) {
  return new PrefixTree(options)
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
