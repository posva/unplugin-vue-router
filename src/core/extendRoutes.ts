import { createPrefixTree, TreeNode } from "./tree";

export class ExtendableRoutes {
  tree: TreeNode

  constructor(tree: TreeNode) {
    this.tree = tree
  }

  /**
   * Traverse the tree in BFS order.
   *
   * @returns
   */
  *[Symbol.iterator]() {
    let currentNode: TreeNode | null = this.tree
    let currentChildren = this.tree.children

    while (currentNode) {
      yield* currentChildren


    }
  }
}

export class EditableTreeNode {
  node: TreeNode
  parentName?: string

  constructor(node: TreeNode, parentName?: string) {
    this.node = node
    this.parentName = parentName
  }

  /**
   * Remove the current route and all its children.
   */
  delete() {
    if (this.node.parent) {
      this.node.delete()
      // throw new Error('Cannot delete the root node.')
    }
    // this.node.parent.remove(this.node.path.slice(1))
  }

  /**
   * Append a new route as a children of this route.
   */
  append() {

  }

  get name() {
    return this.node.name
  }

  get meta() {
    return this.node.metaAsObject
  }

  get path() {
    return this.node.path
  }

  get fullPath() {
    return this.node.fullPath
  }

  /**
   * DFS traversal of the tree.
   * @example
   * ```ts
   * for (const node of tree) {
   *   // ...
   * }
   * ```
   */
  *traverseDFS(): Generator<EditableTreeNode, void, unknown> {
    // the root node is special
    if (!this.node.isRoot()) {
      yield this
    }
    for (const [name, child] of this.node.children) {
      // console.debug(`CHILD: ${_name} - ${child.fullPath}`)
      yield* new EditableTreeNode(child, name).traverseDFS()
    }
  }

  *[Symbol.iterator](): Generator<EditableTreeNode, void, unknown> {
    yield* this.traverseBFS()
  }

  /**
   * BFS traversal of the tree as a generator.
   *
   * @example
   * ```ts
   * for (const node of tree) {
   *   // ...
   * }
   * ```
   */
  *traverseBFS(): Generator<EditableTreeNode, void, unknown> {
    for (const [name, child] of this.node.children) {
      yield new EditableTreeNode(child, name)
    }
    // we need to traverse again in case the user removed a route
    for (const [name, child] of this.node.children) {
      yield* new EditableTreeNode(child, name).traverseBFS()
    }
  }
}

function testy() {
  const tree = createPrefixTree({} as any)
  const route = new EditableTreeNode(tree)

  for (const r of route) {
    console.log(r.name)
  }
}
