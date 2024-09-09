import { describe, it, expectTypeOf } from 'vitest'
import { defineBasicLoader } from './defineLoader'
import { Ref } from 'vue'
import { NavigationResult } from 'unplugin-vue-router/data-loaders'

describe('defineBasicLoader', () => {
  interface UserData {
    id: string
    name: string
  }

  it('uses typed routes', () => {
    const useDataLoader = defineBasicLoader('/[name]', async (route) => {
      const user = {
        id: route.params.name as string,
        name: 'Edu',
      }

      return user
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
    expectTypeOf<Ref<UserData | undefined>>(
      defineBasicLoader(loaderUser, { lazy: () => false })().data
    )
  })

  it('infers the returned type for the resolved value', () => {
    expectTypeOf<Promise<UserData>>(
      defineBasicLoader(loaderUser, { lazy: true })()
    )
    expectTypeOf<Promise<UserData>>(defineBasicLoader(loaderUser, {})())
  })

  expectTypeOf<{ data: Ref<UserData | undefined> }>(
    defineBasicLoader(loaderUser, { lazy: false })()
  )

  it('allows returning a Navigation Result without a type error', () => {
    expectTypeOf<{ data: Ref<UserData | undefined> }>(
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
