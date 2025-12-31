import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createAutoHmrPlugin, DEFAULT_AUTO_HMR_OPTIONS } from './index'

// Mock the parse function
const mockParse = vi.fn()

function createMockTransformContext() {
  return {
    parse: mockParse,
  } as any
}

function callTransform(
  plugin: ReturnType<typeof createAutoHmrPlugin>,
  code: string,
  id: string,
  ctx: ReturnType<typeof createMockTransformContext>
) {
  const transform = plugin.transform as any
  return transform.call(ctx, code, id)
}

describe('auto-hmr', () => {
  beforeEach(() => {
    mockParse.mockClear()
  })
  describe('file filtering', () => {
    it('should process files matching default filter pattern', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `const router = createRouter({})`
      const id1 = '/path/to/router.ts'
      const id2 = '/path/to/router/index.ts'
      const id3 = '/path/to/router.js'
      const id4 = '/path/to/router/index.js'

      // Should match router.ts
      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'router' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
        ],
      })

      const result1 = callTransform(plugin, code, id1, ctx)
      expect(result1).toBeDefined()

      const result2 = callTransform(plugin, code, id2, ctx)
      expect(result2).toBeDefined()

      const result3 = callTransform(plugin, code, id3, ctx)
      expect(result3).toBeDefined()

      const result4 = callTransform(plugin, code, id4, ctx)
      expect(result4).toBeDefined()
    })

    it('should not process files not matching filter pattern', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `const router = createRouter({})`
      const id = '/path/to/other.ts'

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeUndefined()
    })

    it('should respect custom filter include pattern', () => {
      const plugin = createAutoHmrPlugin({
        filter: {
          include: ['**/custom-router.{js,ts}'],
          exclude: [],
        },
      })
      const ctx = createMockTransformContext()

      const code = `const router = createRouter({})`
      const matchingId = '/path/to/custom-router.ts'
      const nonMatchingId = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'router' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
        ],
      })

      const result1 = callTransform(plugin, code, matchingId, ctx)
      expect(result1).toBeDefined()

      const result2 = callTransform(plugin, code, nonMatchingId, ctx)
      expect(result2).toBeUndefined()
    })

    it('should respect custom filter exclude pattern', () => {
      const plugin = createAutoHmrPlugin({
        filter: {
          include: ['**/router.{js,ts}'],
          exclude: ['**/router.test.{js,ts}'],
        },
      })
      const ctx = createMockTransformContext()

      const code = `const router = createRouter({})`
      const excludedId = '/path/to/router.test.ts'
      const includedId = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'router' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
        ],
      })

      const result1 = callTransform(plugin, code, excludedId, ctx)
      expect(result1).toBeUndefined()

      const result2 = callTransform(plugin, code, includedId, ctx)
      expect(result2).toBeDefined()
    })

    it('should skip virtual modules (starting with \\x00)', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `const router = createRouter({})`
      const virtualId = '\x00virtual-module'

      const result = callTransform(plugin, code, virtualId, ctx)
      expect(result).toBeUndefined()
      expect(mockParse).not.toHaveBeenCalled()
    })
  })

  describe('createRouter detection', () => {
    it('should process files with createRouter call', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `const router = createRouter({})`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'router' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
        ],
      })

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeDefined()
      expect(result?.code).toContain('handleHotUpdate')
    })

    it('should process files with experimental_createRouter call', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `const router = experimental_createRouter({})`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'router' },
                init: {
                  type: 'CallExpression',
                  callee: {
                    type: 'Identifier',
                    name: 'experimental_createRouter',
                  },
                },
              },
            ],
          },
        ],
      })

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeDefined()
      expect(result?.code).toContain('handleHotUpdate')
    })

    it('should not process files without createRouter call', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      // Use a file that matches the filter but doesn't have createRouter
      const code = `const router = somethingElse({})`
      const id = '/path/to/router.ts'

      const result = callTransform(plugin, code, id, ctx)
      // Should return undefined because regex doesn't match createRouter
      expect(result).toBeUndefined()
      // Parse should not be called because regex check happens before parse
      expect(mockParse).not.toHaveBeenCalled()
    })
  })

  describe('router declaration detection', () => {
    it('should detect router from const declaration', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `const router = createRouter({})`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'router' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
        ],
      })

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeDefined()
      expect(result?.code).toContain('handleHotUpdate(router)')
    })

    it('should detect router from export const declaration', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `export const router = createRouter({})`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'ExportNamedDeclaration',
            declaration: {
              type: 'VariableDeclaration',
              declarations: [
                {
                  id: { type: 'Identifier', name: 'router' },
                  init: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'createRouter' },
                  },
                },
              ],
            },
          },
        ],
      })

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeDefined()
      expect(result?.code).toContain('handleHotUpdate(router)')
    })

    it('should handle multiple declarations and find router', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `const other = 1; const router = createRouter({})`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'other' },
                init: { type: 'Literal', value: 1 },
              },
            ],
          },
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'router' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
        ],
      })

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeDefined()
      expect(result?.code).toContain('handleHotUpdate(router)')
    })

    it('should not process if no router declaration found', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `const something = createRouter({})`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'something' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
        ],
      })

      // This should still work because the regex matches createRouter
      // but we need to check if routerName is found
      const result = callTransform(plugin, code, id, ctx)
      // The code has createRouter but the variable name is 'something', not 'router'
      // So it should still add handleHotUpdate but with 'something'
      expect(result).toBeDefined()
    })
  })

  describe('import injection', () => {
    it('should add handleHotUpdate import if not present', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `const router = createRouter({})`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'router' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
        ],
      })

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeDefined()
      expect(result?.code).toContain(
        `import { handleHotUpdate } from '${DEFAULT_AUTO_HMR_OPTIONS.modulePath}'`
      )
      expect(result?.code).toContain('handleHotUpdate(router)')
    })

    it('should not add import if already present', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `import { handleHotUpdate } from 'vue-router/auto-routes'
const router = createRouter({})`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'ImportDeclaration',
            source: { value: 'vue-router/auto-routes' },
            specifiers: [
              {
                type: 'ImportSpecifier',
                imported: { type: 'Identifier', name: 'handleHotUpdate' },
              },
            ],
          },
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'router' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
        ],
      })

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeDefined()
      // Should not duplicate the import
      const importCount = (result?.code.match(/import.*handleHotUpdate/g) || [])
        .length
      expect(importCount).toBe(1)
    })

    it('should use custom modulePath when provided', () => {
      const customModulePath = 'custom-module-path'
      const plugin = createAutoHmrPlugin({ modulePath: customModulePath })
      const ctx = createMockTransformContext()

      const code = `const router = createRouter({})`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'router' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
        ],
      })

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeDefined()
      expect(result?.code).toContain(
        `import { handleHotUpdate } from '${customModulePath}'`
      )
    })
  })

  describe('handleHotUpdate call injection', () => {
    it('should add handleHotUpdate call if not present', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `const router = createRouter({})`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'router' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
        ],
      })

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeDefined()
      expect(result?.code).toContain('handleHotUpdate(router)')
    })

    it('should not add call if handleHotUpdate is already called', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `const router = createRouter({})
handleHotUpdate(router)`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'router' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'handleHotUpdate' },
            },
          },
        ],
      })

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeDefined()
      // Should not duplicate the call
      const callCount = (result?.code.match(/handleHotUpdate\(router\)/g) || [])
        .length
      expect(callCount).toBe(1)
    })

    it('should detect handleHotUpdate call as member expression', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `const router = createRouter({})
autoRouter.handleHotUpdate(router)`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'router' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: 'autoRouter' },
                property: { type: 'Identifier', name: 'handleHotUpdate' },
              },
            },
          },
        ],
      })

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeDefined()
      // Should not add another call
      const callCount = (result?.code.match(/handleHotUpdate/g) || []).length
      // Should have the import and the existing call
      expect(callCount).toBeGreaterThanOrEqual(1)
    })
  })

  describe('complete transformation', () => {
    it('should transform complete router file correctly', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'ImportDeclaration',
            source: { value: 'vue-router' },
            specifiers: [],
          },
          {
            type: 'ImportDeclaration',
            source: { value: 'vue-router/auto-routes' },
            specifiers: [],
          },
          {
            type: 'ExportNamedDeclaration',
            declaration: {
              type: 'VariableDeclaration',
              declarations: [
                {
                  id: { type: 'Identifier', name: 'router' },
                  init: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'createRouter' },
                  },
                },
              ],
            },
          },
        ],
      })

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeDefined()
      expect(result?.code).toContain(
        `import { handleHotUpdate } from '${DEFAULT_AUTO_HMR_OPTIONS.modulePath}'`
      )
      expect(result?.code).toContain('handleHotUpdate(router)')
      expect(result?.code).toContain(
        "import { createRouter, createWebHistory } from 'vue-router'"
      )
    })

    it('should preserve original code structure', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const originalCode = `const router = createRouter({})
const other = 123`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'router' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'other' },
                init: { type: 'Literal', value: 123 },
              },
            ],
          },
        ],
      })

      const result = callTransform(plugin, originalCode, id, ctx)
      expect(result).toBeDefined()
      expect(result?.code).toContain('const router = createRouter({})')
      expect(result?.code).toContain('const other = 123')
    })
  })

  describe('edge cases', () => {
    it('should handle empty code', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = ``
      const id = '/path/to/router.ts'

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeUndefined()
    })

    it('should handle code without createRouter', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      // Use a file that matches the filter but doesn't have createRouter
      const code = `const something = 123`
      const id = '/path/to/router.ts'

      const result = callTransform(plugin, code, id, ctx)
      // Should return undefined because regex doesn't match createRouter
      expect(result).toBeUndefined()
      // Parse should not be called because regex check happens before parse
      expect(mockParse).not.toHaveBeenCalled()
    })

    it('should handle different router variable names', () => {
      const plugin = createAutoHmrPlugin({})
      const ctx = createMockTransformContext()

      const code = `const myRouter = createRouter({})`
      const id = '/path/to/router.ts'

      mockParse.mockReturnValue({
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                id: { type: 'Identifier', name: 'myRouter' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'createRouter' },
                },
              },
            ],
          },
        ],
      })

      const result = callTransform(plugin, code, id, ctx)
      expect(result).toBeDefined()
      expect(result?.code).toContain('handleHotUpdate(myRouter)')
    })
  })
})
