import { fileURLToPath } from 'node:url'
import { cpSync, rmSync } from 'node:fs'
import { test as setup } from '@playwright/test'

const fixtureDir = fileURLToPath(new URL('./playground-tmp', import.meta.url))
const sourceDir = fileURLToPath(new URL('./playground', import.meta.url))

setup('create temporary hmr playground directory', () => {
  rmSync(fixtureDir, { force: true, recursive: true })
  cpSync(sourceDir, fixtureDir, {
    recursive: true,
    filter: (src) => {
      return (
        !src.includes('.cache') &&
        !src.endsWith('.sock') &&
        !src.includes('.output') &&
        !src.includes('.vite')
      )
    },
  })
})
