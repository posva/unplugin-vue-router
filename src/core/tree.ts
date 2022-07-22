import type { ResolvedOptions } from '../options'
import { createTreeLeafValue, TreeRouteParam } from './treeLeafValue'
import type { TreeLeafValue } from './treeLeafValue'
import { trimExtension } from './utils'
import { CustomRouteBlock } from './customBlock'

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
  options: ResolvedOptions

  constructor(options: ResolvedOptions, filePath: string, parent?: TreeLeaf) {
    this.options = options
    this.parent = parent
    this.value = createTreeLeafValue(filePath, parent?.value)
  }

  /**
   * Adds a path to the tree. `path` cannot start with a `/`.
   *
   * @param path - route path of the file
   * @param filePath - file path, defaults to path for convenience and testing
   */
  insert(path: string, filePath: string = path): TreeLeaf {
    const { tail, segment, viewName, isComponent } = splitFilePath(path)

    if (!this.children.has(segment)) {
      this.children.set(segment, new TreeLeaf(this.options, segment, this))
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

  remove(path: string) {
    const { tail, segment, viewName, isComponent } = splitFilePath(path)

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

  get path() {
    return (
      this.value.overrides.path ??
      (this.parent?.isRoot() ? '/' : '') + this.value.pathSegment
    )
  }

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
      this.value.filePaths.size
        ? ` 📄 (${Array.from(this.value.filePaths.keys()).join(', ')})`
        : ''
    }`
  }
}

export function createPrefixTree(options: ResolvedOptions) {
  return new TreeLeaf(options, '')
}

/**
 * Splits a path into by finding the first '/' and returns the tail and segment. If it has an extension, it removes it.
 * If it contains a named view, it returns the view name as well (otherwise it's default).
 *
 * @param filePath - filePath to split
 */
function splitFilePath(filePath: string) {
  const slashPos = filePath.indexOf('/')
  let head = slashPos < 0 ? filePath : filePath.slice(0, slashPos)
  const tail = slashPos < 0 ? '' : filePath.slice(slashPos + 1)

  let segment = head
  // only the last segment can be a filename with an extension
  if (!tail) {
    segment = trimExtension(head)
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
