import unplugin from '.'
import type { Options } from './options'
import type { Plugin as VitePlugin } from 'vite'

export default unplugin.vite as <
  TFilePatterns extends readonly string[] = string[],
  TExclude extends readonly string[] = string[],
  TExtensions extends readonly string[] = string[],
>(
  options?: Options<[...TFilePatterns], [...TExclude], [...TExtensions]>
) => VitePlugin
