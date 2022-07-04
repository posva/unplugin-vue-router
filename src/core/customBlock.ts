import { SFCBlock, parse } from '@vue/compiler-sfc'
import { promises as fs } from 'fs'
import { ResolvedOptions } from '../options'
import JSON5 from 'json5'
import { parse as YAMLParser } from 'yaml'
import { RouteRecordRaw } from 'vue-router'

export async function getRouteBlock(path: string, options: ResolvedOptions) {
  const content = await fs.readFile(path, 'utf8')

  const parsedSFC = await parse(content, { pad: 'space' }).descriptor
  const blockStr = parsedSFC?.customBlocks.find((b) => b.type === 'route')

  if (!blockStr) return

  let result

  if (blockStr) {
    result = parseCustomBlock(blockStr, path, options)
  }

  // validation
  if (result) {
    if (result.path != null && !result.path.startsWith('/')) {
      console.error(`Overridden path must start with "/". Found in "${path}".`)
    }
  }

  return result
}

export interface CustomRouteBlock
  extends Partial<
    Omit<
      RouteRecordRaw,
      'components' | 'component' | 'children' | 'beforeEnter' | 'name'
    >
  > {
  name?: string
}

function parseCustomBlock(
  block: SFCBlock,
  filePath: string,
  options: ResolvedOptions
): CustomRouteBlock | undefined {
  const lang = block.lang ?? options.routeBlockLang

  if (lang === 'json5') {
    try {
      return JSON5.parse(block.content)
    } catch (err: any) {
      console.error(
        `Invalid JSON5 format of <${block.type}> content in ${filePath}\n${err.message}`
      )
    }
  } else if (lang === 'json') {
    try {
      return JSON.parse(block.content)
    } catch (err: any) {
      console.error(
        `Invalid JSON format of <${block.type}> content in ${filePath}\n${err.message}`
      )
    }
  } else if (lang === 'yaml' || lang === 'yml') {
    try {
      return YAMLParser(block.content)
    } catch (err: any) {
      console.error(
        `Invalid YAML format of <${block.type}> content in ${filePath}\n${err.message}`
      )
    }
  } else {
    console.error(
      `Invalid "lang" of <${block.type}> in ${filePath}. Supported languages are: json5, json, yaml, yml.`
    )
  }
}
