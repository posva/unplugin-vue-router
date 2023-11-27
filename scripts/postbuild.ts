import { resolve } from 'path'
import { promises as fs } from 'fs'

async function run() {
    let file = resolve('./dist/index.d.cts').replace(/\\/g, '/')
    let code = await fs.readFile(file, 'utf8')
    code = code.replace(', _default as default', '')
    code += '\nexport = _default;'
    await fs.writeFile(file, code, 'utf-8')
    file = resolve('./dist/index.cjs').replace(/\\/g, '/')
    code = await fs.readFile(file, 'utf8')
    code = code.replace('module.exports = __', 'exports.default = __')
    await fs.writeFile(file, code, 'utf-8')
}

run()
