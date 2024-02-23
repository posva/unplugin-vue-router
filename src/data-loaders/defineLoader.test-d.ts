import { describe, it, expectTypeOf } from 'vitest'
import { defineBasicLoader } from './defineLoader'
import { Ref, shallowRef } from 'vue'
import { NavigationResult } from './navigation-guard'

describe('defineBasicLoader', () => {
  interface UserData {
    id: string
    name: string
  }

  it('uses typed routes', () => {
    const useDataLoader = defineBasicLoader('/[name]', async (route) => {
      const user = {
        id: route.params.name,
        name: 'Edu',
      }

      return user
    })

    expectTypeOf<
      | {
          data: Ref<UserData>
          error: Ref<unknown>
          isLoading: Ref<boolean>
          refresh: () => Promise<void>
        }
      | PromiseLike<UserData>
    >(useDataLoader())
  })

  async function loaderUser() {
    const user: UserData = {
      id: 'one',
      name: 'Edu',
    }

    return user
  }
  it('infers the returned type for data', () => {
    expectTypeOf<Ref<UserData | undefined>>(
      defineBasicLoader(loaderUser, { lazy: true })().data
    )
  })

  it('removes undefined from non lazy loaders', () => {
    expectTypeOf<Ref<UserData>>(defineBasicLoader(loaderUser, {})().data)
    expectTypeOf<Ref<UserData>>(
      defineBasicLoader(loaderUser, { lazy: false })().data
    )
  })

  it('infers the returned type for the resolved value', () => {
    expectTypeOf<Promise<UserData>>(
      defineBasicLoader(loaderUser, { lazy: true })()
    )
    expectTypeOf<Promise<UserData>>(defineBasicLoader(loaderUser, {})())
  })

  expectTypeOf<{ data: Ref<UserData> }>(
    defineBasicLoader(loaderUser, { lazy: false })()
  )

  it('allows returning a Navigation Result without a type error', () => {
    expectTypeOf<{ data: Ref<UserData> }>(
      defineBasicLoader(
        async () => {
          if (Math.random()) {
            return loaderUser()
          } else {
            return new NavigationResult('/')
          }
        },
        { lazy: false }
      )()
    )
    expectTypeOf<Promise<UserData>>(
      defineBasicLoader(
        async () => {
          if (Math.random()) {
            return loaderUser()
          } else {
            return new NavigationResult('/')
          }
        },
        { lazy: false }
      )()
    )
  })
})
