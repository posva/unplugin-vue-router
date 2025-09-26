import { describe, expect, it } from 'vitest'
import {
  warnMissingParamParsers,
  generateParamParsersTypesDeclarations,
  generateParamsTypes,
  generateParamParserOptions,
  generatePathParamsOptions,
  type ParamParsersMap,
} from './generateParamParsers'
import { PrefixTree } from '../core/tree'
import { resolveOptions } from '../options'
import { ImportsMap } from '../core/utils'
import type { TreePathParam } from '../core/treeNodeValue'
import { mockWarn } from '../../tests/vitest-mock-warn'

const DEFAULT_OPTIONS = resolveOptions({})

describe('warnMissingParamParsers', () => {
  mockWarn()
  it('shows no warnings for routes without param parsers', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users', 'users.vue')
    tree.insert('posts/[id]', 'posts/[id].vue')

    const paramParsers: ParamParsersMap = new Map()

    warnMissingParamParsers(tree, paramParsers)
  })

  it('shows no warnings for native parsers', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users/[id=int]', 'users/[id=int].vue')
    tree.insert('posts/[active=bool]', 'posts/[active=bool].vue')

    const paramParsers: ParamParsersMap = new Map()

    warnMissingParamParsers(tree, paramParsers)
  })

  it('warns for missing custom parsers', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users/[id=uuid]', 'users/[id=uuid].vue')

    const paramParsers: ParamParsersMap = new Map()

    warnMissingParamParsers(tree, paramParsers)

    expect(
      'Parameter parser "uuid" not found for route "/users/:id".'
    ).toHaveBeenWarned()
  })

  it('shows no warnings when custom parsers exist in map', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users/[id=uuid]', 'users/[id=uuid].vue')

    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
    ])

    warnMissingParamParsers(tree, paramParsers)
  })
})

describe('generateParamParsersTypesDeclarations', () => {
  it('returns empty string for empty param parsers map', () => {
    const paramParsers: ParamParsersMap = new Map()
    const result = generateParamParsersTypesDeclarations(paramParsers)
    expect(result).toBe('')
  })

  it('generates single param parser type declaration', () => {
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
    ])

    const result = generateParamParsersTypesDeclarations(paramParsers)
    expect(result).toBe(
      `type Param_uuid = ReturnType<NonNullable<typeof import('./parsers/uuid').parser['get']>>`
    )
  })

  it('generates multiple param parsers type declarations', () => {
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
      [
        'slug',
        {
          name: 'slug',
          typeName: 'Param_slug',
          relativePath: 'parsers/slug',
          absolutePath: '/path/to/parsers/slug',
        },
      ],
    ])

    const result = generateParamParsersTypesDeclarations(paramParsers)
    expect(result).toMatchInlineSnapshot(`
      "type Param_uuid = ReturnType<NonNullable<typeof import('./parsers/uuid').parser['get']>>
      type Param_slug = ReturnType<NonNullable<typeof import('./parsers/slug').parser['get']>>"
    `)
  })
})

describe('generateParamsTypes', () => {
  it('returns null for params without parsers', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: null,
      },
    ]
    const paramParsers: ParamParsersMap = new Map()

    const result = generateParamsTypes(params, paramParsers)
    expect(result).toEqual([null])
  })

  it('returns correct type names for custom parsers', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: 'uuid',
      },
    ]
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
    ])

    const result = generateParamsTypes(params, paramParsers)
    expect(result).toEqual(['Param_uuid'])
  })

  it('returns correct types for native parsers', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: 'int',
      },
      {
        paramName: 'active',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: 'bool',
      },
    ]
    const paramParsers: ParamParsersMap = new Map()

    const result = generateParamsTypes(params, paramParsers)
    expect(result).toEqual(['number', 'boolean'])
  })

  it('handles mixed params with and without parsers', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: 'uuid',
      },
      {
        paramName: 'page',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: null,
      },
      {
        paramName: 'count',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: 'int',
      },
    ]
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
    ])

    const result = generateParamsTypes(params, paramParsers)
    expect(result).toEqual(['Param_uuid', null, 'number'])
  })
})

describe('generateParamParserOptions', () => {
  it('returns empty string for param without parser', () => {
    const param: TreePathParam = {
      paramName: 'id',
      modifier: '',
      optional: false,
      repeatable: false,
      isSplat: false,
      parser: null,
    }
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generateParamParserOptions(param, importsMap, paramParsers)
    expect(result).toBe('')
  })

  it('generates import and returns variable for custom parser', () => {
    const param: TreePathParam = {
      paramName: 'id',
      modifier: '',
      optional: false,
      repeatable: false,
      isSplat: false,
      parser: 'uuid',
    }
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
    ])

    const result = generateParamParserOptions(param, importsMap, paramParsers)
    expect(result).toBe('PARAM_PARSER__uuid')
    expect(importsMap.toString()).toContain(
      `import { parser as PARAM_PARSER__uuid } from '/path/to/parsers/uuid'`
    )
  })

  it('generates correct import for native int parser', () => {
    const param: TreePathParam = {
      paramName: 'id',
      modifier: '',
      optional: false,
      repeatable: false,
      isSplat: false,
      parser: 'int',
    }
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generateParamParserOptions(param, importsMap, paramParsers)
    expect(result).toBe('PARAM_PARSER_INT')
    expect(importsMap.toString()).toContain(
      `import { PARAM_PARSER_INT } from 'vue-router/experimental'`
    )
  })

  it('generates correct import for native bool parser', () => {
    const param: TreePathParam = {
      paramName: 'active',
      modifier: '',
      optional: false,
      repeatable: false,
      isSplat: false,
      parser: 'bool',
    }
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generateParamParserOptions(param, importsMap, paramParsers)
    expect(result).toBe('PARAM_PARSER_BOOL')
    expect(importsMap.toString()).toContain(
      `import { PARAM_PARSER_BOOL } from 'vue-router/experimental'`
    )
  })

  it('returns empty string for missing parser', () => {
    const param: TreePathParam = {
      paramName: 'id',
      modifier: '',
      optional: false,
      repeatable: false,
      isSplat: false,
      parser: 'missing',
    }
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generateParamParserOptions(param, importsMap, paramParsers)
    expect(result).toBe('')
  })
})

describe('generatePathParamsOptions', () => {
  it('returns empty object for empty params array', () => {
    const params: TreePathParam[] = []
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generatePathParamsOptions(params, importsMap, paramParsers)
    expect(result).toBe(`{}`)
  })

  it('generates options for single param with parser', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: 'int',
      },
    ]
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generatePathParamsOptions(params, importsMap, paramParsers)
    expect(result).toContain('id: [PARAM_PARSER_INT]')
  })

  it('generates options for param without parser', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'slug',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: null,
      },
    ]
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generatePathParamsOptions(params, importsMap, paramParsers)
    expect(result).toContain('slug: [/* no parser */]')
  })

  it('includes repeatable and optional flags when present', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'tags',
        modifier: '+',
        optional: false,
        repeatable: true,
        isSplat: false,
        parser: null,
      },
      {
        paramName: 'category',
        modifier: '?',
        optional: true,
        repeatable: false,
        isSplat: false,
        parser: null,
      },
    ]
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generatePathParamsOptions(params, importsMap, paramParsers)
    expect(result).toContain('tags: [/* no parser */, /* repeatable: */ true]')
    expect(result).toContain(
      'category: [/* no parser */, /* repeatable: false */, /* optional: */ true]'
    )
  })

  it('handles multiple params with different configurations', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: 'uuid',
      },
      {
        paramName: 'page',
        modifier: '?',
        optional: true,
        repeatable: false,
        isSplat: false,
        parser: 'int',
      },
      {
        paramName: 'tags',
        modifier: '+',
        optional: false,
        repeatable: true,
        isSplat: false,
        parser: null,
      },
    ]
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
    ])

    const result = generatePathParamsOptions(params, importsMap, paramParsers)
    expect(result).toContain('id: [PARAM_PARSER__uuid]')
    expect(result).toContain(
      'page: [PARAM_PARSER_INT, /* repeatable: false */, /* optional: */ true]'
    )
    expect(result).toContain('tags: [/* no parser */, /* repeatable: */ true]')
  })
})
