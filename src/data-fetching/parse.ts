import { promises as fs } from 'fs'
import { findExports } from 'mlly'

export async function hasNamedExports(file: string) {
  const code = await fs.readFile(file, 'utf8')

  const exportedNames = findExports(code).filter(
    (e) => e.type !== 'default' && e.type !== 'star'
  )

  // it may have exposed loaders
  return exportedNames.length > 0
}
