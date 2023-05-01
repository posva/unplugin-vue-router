import { basename, resolve } from 'path'
import { promises as fs } from 'fs'
import fg from 'fast-glob'
import chalk from 'chalk'

async function run() {
  const files = await fg('*.js', {
    ignore: ['chunk-*'],
    absolute: true,
    cwd: resolve(__dirname, '../dist'),
  })
  for (const file of files) {
    const filename = basename(file)
    console.log(chalk.cyan.inverse(' POST '), `Fix ${filename}`)
    if (file === 'index.js') {
      // fix cjs exports
      let code = await fs.readFile(file, 'utf8')
      code = code.replace('exports.default =', 'module.exports =')
      code += 'exports.default = module.exports;'
      await fs.writeFile(file, code)
    }
    // generate submodule .d.ts redirecting
    const name = basename(file, '.js')
    await fs.writeFile(
      `${name}.d.ts`,
      // these files should keep the regular export
      filename === 'runtime.js' ||
        filename === 'types.js' ||
        filename === 'index.js' ||
        filename === 'options.js'
        ? `export * from './dist/${name}'\n`
        : `export { default } from './dist/${name}'\n`
    )
  }
}

run()
