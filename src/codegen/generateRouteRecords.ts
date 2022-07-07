import { ManualChunksOption } from 'rollup'
import type { TreeLeaf } from '../core/tree'

export function generateRouteRecord(node: TreeLeaf, indent = 0, webpackManualChunks: false | ManualChunksOption): string {
  // root
  if (node.value.path === '/' && indent === 0) {
    return `[
${node
  .getSortedChildren()
  .map((child) => generateRouteRecord(child, indent + 1, webpackManualChunks))
  .join(',\n')}
]`
  }

  const startIndent = ' '.repeat(indent * 2)
  const indentStr = ' '.repeat((indent + 1) * 2)

  // TODO: should meta be defined a different way to allow preserving imports?
  // const meta = node.value.overrides.meta

  return `${startIndent}{
${indentStr}path: '${node.path}',
${indentStr}${
    node.value.filePaths.size ? `name: '${node.name}',` : '/* no name */'
  }
${indentStr}${
    node.value.filePaths.size
      ? generateRouteRecordComponent(node, indentStr, webpackManualChunks)
      : '/* no component */'
  }
${indentStr}${
    node.children.size > 0
      ? `children: [
${node
  .getSortedChildren()
  .map((child) => generateRouteRecord(child, indent + 2, webpackManualChunks))
  .join(',\n')}
${indentStr}],`
      : '/* no children */'
  }${formatMeta(node.meta, indentStr)}
${startIndent}}`
}

function generateRouteRecordComponent(
  node: TreeLeaf,
  indentStr: string,
  webpackManualChunks: false | ManualChunksOption,
): string {
  const files = Array.from(node.value.filePaths)
  const isDefaultExport = files.length === 1 && files[0][0] === 'default'

let importGrammar = (path: string) => `import('${path}')`
if(webpackManualChunks) {
  importGrammar = (path: string) => {
    if(typeof webpackManualChunks === 'function') {
      const ret =(webpackManualChunks as any)(path)
      if(ret) {
          return `import(/* webpackChunkName: "${ret}" */ '${path}')`
      }
    } else {
      for(let chunkName in webpackManualChunks) {
        const paths = webpackManualChunks[chunkName]
        // handle relative path
        const ret = paths.find(itemPath => path.includes(itemPath.replace(/^(\.)/, '')) ||  path.includes(itemPath))
        if(ret) {
          return `import('/* webpackChunkName: "${ret}" */ ${path}')`
        }
      }
    }
    return `import('${path}')`
  }
}

  return isDefaultExport
    ? `component: () => ${importGrammar(files[0][1])},`
    : // files has at least one entry
      `components: {
${files
  .map(([key, path]) => `${indentStr + '  '}'${key}': () => ${importGrammar(path)}`)
  .join(',\n')}
${indentStr}},`
}

function formatMeta(meta: string, indent: string): string {
  const formatted =
    meta &&
    meta
      .split('\n')
      .map((line) => indent + line)
      .join('\n')

  return formatted ? '\n' + indent + 'meta: ' + formatted.trimStart() : ''
}
