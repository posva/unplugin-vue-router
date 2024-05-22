import {
  resolveOverridableOption,
  type ResolvedOptions,
  type RoutesFolderOption,
} from '../options'
import {
  createTreeNodeValue,
  TreeNodeValueOptions,
  TreeRouteParam,
} from './treeNodeValue'
import type { TreeNodeValue } from './treeNodeValue'
import { trimExtension } from './utils'
import { CustomRouteBlock } from './customBlock'
import { RouteMeta } from 'vue-router'

export interface TreeNodeOptions extends ResolvedOptions {
  treeNodeOptions?: TreeNodeValueOptions
}

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
  parent: TreeNode | undefined

  /**
   * Plugin options taken into account by the tree.
   */
  options: TreeNodeOptions

  // FIXME: refactor this code. It currently helps to keep track if a page has at least one component with `definePage()` but it doesn't tell which. It should keep track of which one while still caching the result per file.
  /**
   * Should this page import the page info
   */
  hasDefinePage: boolean = false

  /**
   * Creates a new tree node.
   *
   * @param options - TreeNodeOptions shared by all nodes
   * @param pathSegment - path segment of this node e.g. `users` or `:id`
   * @param parent
   */
  constructor(
    options: TreeNodeOptions,
    pathSegment: string,
    parent?: TreeNode
  ) {
    this.options = options
    this.parent = parent
    this.value = createTreeNodeValue(
      pathSegment,
      parent?.value,
      options.treeNodeOptions || options.pathParser
    )
  }

  /**
   * Adds a path to the tree. `path` cannot start with a `/`.
   *
   * @param path - path segment to insert. **It must contain the file extension** this allows to
   * differentiate between folders and files.
   * @param filePath - file path, defaults to path for convenience and testing
   */
  insert(path: string, filePath: string = path): TreeNode {
    // find the `routesFolder` resolved option that matches the filepath
    const folderOptions = findFolderOptions(this.options.routesFolder, filePath)

    const { tail, segment, viewName, isComponent } = splitFilePath(
      path,
      // use the correct extensions for the folder
      resolveOverridableOption(
        this.options.extensions,
        folderOptions?.extensions
      )
    )

    if (!this.children.has(segment)) {
      this.children.set(segment, new TreeNode(this.options, segment, this))
    } // TODO: else error or still override?
    const child = this.children.get(segment)!

    if (isComponent) {
      child.value.components.set(viewName, filePath)
    }

    if (tail) {
      return child.insert(tail, filePath)
    }
    return child
  }

  /**
   * Adds a path that has already been parsed to the tree. `path` cannot start with a `/`. This method is similar to
   * `insert` but the path argument should be already parsed. e.g. `users/:id` for a file named `users/[id].vue`.
   *
   * @param path - path segment to insert, already parsed (e.g. users/:id)
   * @param filePath - file path, defaults to path for convenience and testing
   */
  insertParsedPath(path: string, filePath: string = path): TreeNode {
    // TODO: allow null filePath?
    const isComponent = true

    const node = new TreeNode(
      {
        ...this.options,
        // force the format to raw
        treeNodeOptions: {
          ...this.options.pathParser,
          format: 'path',
        },
      },
      path,
      this
    )
    this.children.set(path, node)

    if (isComponent) {
      // TODO: allow a way to set the view name
      node.value.components.set('default', filePath)
    }

    return node
  }

  /**
   * Saves a custom route block for a specific file path. The file path is used as a key. Some special file paths will
   * have a lower or higher priority.
   *
   * @param filePath - file path where the custom block is located
   * @param routeBlock - custom block to set
   */
  setCustomRouteBlock(
    filePath: string,
    routeBlock: CustomRouteBlock | undefined
  ) {
    this.value.setOverride(filePath, routeBlock)
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
    const folderOptions = findFolderOptions(this.options.routesFolder, path)
    // TODO: rename remove to removeChild
    const { tail, segment, viewName, isComponent } = splitFilePath(
      path,
      resolveOverridableOption(
        this.options.extensions,
        folderOptions?.extensions
      )
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
      if (child.children.size === 0 && child.value.components.size === 0) {
        this.children.delete(segment)
      }
    } else {
      // it can only be component because we only listen for removed files, not folders
      if (isComponent) {
        child.value.components.delete(viewName)
      }
      // this is the file we wanted to remove
      if (child.children.size === 0 && child.value.components.size === 0) {
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
  get metaAsObject(): Readonly<RouteMeta> {
    return {
      ...this.value.overrides.meta,
    }
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
    return this.value.path === '/' && !this.value.components.size
  }

  toString(): string {
    return `${this.value}${
      // either we have multiple names
      this.value.components.size > 1 ||
      // or we have one name and it's not default
      (this.value.components.size === 1 &&
        !this.value.components.get('default'))
        ? ` ⎈(${Array.from(this.value.components.keys()).join(', ')})`
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

  override insert(path: string, filePath: string = path) {
    const node = super.insert(path, filePath)
    this.map.set(filePath, node)

    return node
  }

  /**
   * Returns the tree node of the given file path.
   *
   * @param filePath - file path of the tree node to get
   */
  getChild(filePath: string) {
    return this.map.get(filePath)
  }

  /**
   * Removes the tree node of the given file path.
   *
   * @param filePath - file path of the tree node to remove
   */
  removeChild(filePath: string) {
    if (this.map.has(filePath)) {
      this.map.get(filePath)!.delete()
      this.map.delete(filePath)
    }
  }
}

/**
 * Splits a path into by finding the first '/' and returns the tail and segment. If it has an extension, it removes it.
 * If it contains a named view, it returns the view name as well (otherwise it's default).
 *
 * @param filePath - filePath to split
 */
function splitFilePath(filePath: string, extensions: string[]) {
  const slashPos = filePath.indexOf('/')
  let head = slashPos < 0 ? filePath : filePath.slice(0, slashPos)
  const tail = slashPos < 0 ? '' : filePath.slice(slashPos + 1)

  let segment = head
  // only the last segment can be a filename with an extension
  if (!tail) {
    segment = trimExtension(head, extensions)
  }
  let viewName = 'default'

  const namedSeparatorPos = segment.indexOf('@')

  if (namedSeparatorPos > 0) {
    viewName = segment.slice(namedSeparatorPos + 1)
    segment = segment.slice(0, namedSeparatorPos)
  }

  // this means we effectively trimmed an extension
  const isComponent = segment !== head

  return {
    segment,
    tail,
    viewName,
    isComponent,
  }
}

/**
 * Find the folder options that match the file path.
 *
 * @param folderOptions `options.routesFolder` option
 * @param filePath resolved file path
 * @returns
 */
function findFolderOptions(
  folderOptions: RoutesFolderOption[],
  filePath: string
): RoutesFolderOption | undefined {
  return folderOptions.find((folder) => filePath.includes(folder.src))
}
