import { describe, it, expectTypeOf } from 'vitest'
import { defineColadaLoader } from './defineColadaLoader'
import type { Ref } from 'vue'
import { NavigationResult } from './navigation-guard'

describe('defineBasicLoader', () => {
  interface UserData {
    id: string
    name: string
  }

  it('uses typed routes', () => {
    const useDataLoader = defineColadaLoader('/[name]', {
      key: ['id'],
      query: async (route) => {
        const user = {
          id: route.params.name as string,
          name: 'Edu',
        }

        return user
      },
    })

    expectTypeOf<
      | {
          data: Ref<UserData>
          error: Ref<unknown>
          isLoading: Ref<boolean>
          reload: () => Promise<void>
        }
      | PromiseLike<UserData>
    >(useDataLoader())
  })

  const key = ['id']
  async function query() {
    const user: UserData = {
      id: 'one',
      name: 'Edu',
    }

    return user
  }

  it('can enforce defined data', () => {
    expectTypeOf(
      defineColadaLoader({ key, query })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineColadaLoader({
        key,
        query,
        errors: false,
        lazy: false,
        server: true,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineColadaLoader({
        key,
        query,
        lazy: false,
        server: true,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineColadaLoader({
        key,
        query,
        errors: false,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineColadaLoader({
        key,
        query,
        server: true,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineColadaLoader({
        key,
        query,
        lazy: false,
      })().data.value
    ).toEqualTypeOf<UserData>()
  })

  it('makes data possibly undefined when lazy', () => {
    expectTypeOf(
      defineColadaLoader({ key, query, lazy: true })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('makes data possibly undefined when lazy is a function', () => {
    expectTypeOf(
      defineColadaLoader({ key, query, lazy: () => false })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('makes data possibly undefined when errors is not false', () => {
    expectTypeOf(
      defineColadaLoader({ key, query, errors: true })().data.value
    ).toEqualTypeOf<UserData | undefined>()
    expectTypeOf(
      defineColadaLoader({ key, query, errors: [] })().data.value
    ).toEqualTypeOf<UserData | undefined>()
    expectTypeOf(
      defineColadaLoader({ key, query, errors: () => true })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('makes data possibly undefined when server is not true', () => {
    expectTypeOf(
      defineColadaLoader({ key, query, server: false })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('infers the returned type for data', () => {
    expectTypeOf<UserData | undefined>(
      defineColadaLoader({ key, query, lazy: true })().data.value
    )
    expectTypeOf<UserData | undefined>(
      defineColadaLoader({ key, query, lazy: () => false })().data.value
    )
  })

  it('infers the returned type for the resolved value to always be defined', async () => {
    expectTypeOf(
      await defineColadaLoader({ key, query })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader({ key, query, lazy: false })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader({ key, query, lazy: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader({ key, query, server: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader({ key, query, server: false })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader({ key, query, errors: false })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader({ key, query, errors: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader({ key, query, errors: [] })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader({ key, query, errors: false, lazy: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader({ key, query, server: false, lazy: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineColadaLoader({
        key,
        query,
        errors: false,
        server: false,
        lazy: true,
      })()
    ).toEqualTypeOf<UserData>()
  })

  it('allows returning a Navigation Result without a type error', () => {
    expectTypeOf<UserData>(
      defineColadaLoader({
        key,
        query: async () => {
          if (Math.random()) {
            return query()
          } else {
            return new NavigationResult('/')
          }
        },
      })().data.value
    )
    expectTypeOf(
      defineColadaLoader({
        key,
        query: async () => {
          if (Math.random()) {
            return query()
          } else {
            return new NavigationResult('/')
          }
        },
      })()
    ).resolves.toEqualTypeOf<UserData>()
  })
})
