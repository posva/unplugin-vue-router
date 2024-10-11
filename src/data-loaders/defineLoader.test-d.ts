import { describe, it, expectTypeOf } from 'vitest'
import { defineBasicLoader } from './defineLoader'
import type { Ref } from 'vue'
import { NavigationResult } from './navigation-guard'
import { errorsFromArray, type _UnionFromConstructorsArray } from './createDataLoader'

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

  it('can enforce defined data', () => {
    expectTypeOf(
      defineBasicLoader(loaderUser)().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineBasicLoader(loaderUser, {})().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineBasicLoader(loaderUser, {
        errors: false,
        lazy: false,
        server: true,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineBasicLoader(loaderUser, {
        lazy: false,
        server: true,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineBasicLoader(loaderUser, {
        errors: false,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineBasicLoader(loaderUser, {
        server: true,
      })().data.value
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      defineBasicLoader(loaderUser, {
        lazy: false,
      })().data.value
    ).toEqualTypeOf<UserData>()
  })

  it('makes data possibly undefined when lazy', () => {
    expectTypeOf(
      defineBasicLoader(loaderUser, { lazy: true })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('makes data possibly undefined when lazy is a function', () => {
    expectTypeOf(
      defineBasicLoader(loaderUser, { lazy: () => false })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('makes data possibly undefined when errors is not false', () => {
    expectTypeOf(
      defineBasicLoader(loaderUser, { errors: true })().data.value
    ).toEqualTypeOf<UserData | undefined>()
    expectTypeOf(
      defineBasicLoader(loaderUser, { errors: [] })().data.value
    ).toEqualTypeOf<UserData | undefined>()
    expectTypeOf(
      defineBasicLoader(loaderUser, { errors: (e) => e instanceof Error })()
        .data.value
    ).toEqualTypeOf<UserData | undefined>()
    expectTypeOf(
      defineBasicLoader(loaderUser, { errors: () => true })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  class MyError1 extends Error {
    // properties to differentiate the errors types
    p1: string = 'p1'
  }
  class MyError2 extends Error {
    p2: string = 'p2'
  }

  it('can type the error with a type guard', () => {
    expectTypeOf(
      defineBasicLoader(loaderUser, {
        errors: (e) => e instanceof Error,
      })().error.value
    ).toEqualTypeOf<Error | null>()

    expectTypeOf(
      defineBasicLoader(loaderUser, {
        errors: (e) => e instanceof MyError1 || e instanceof MyError2,
      })().error.value
    ).toEqualTypeOf<MyError1 | MyError2 | null>()
  })

  it('errorsFromArray fails on non constructors', () => {
    errorsFromArray([
      // @ts-expect-error: no constructor
      2,
      // @ts-expect-error: no constructor
      {},
    ])
  })

  it('errorsFromArray narrows down types', () => {
    let e: unknown
    if (errorsFromArray([MyError1])(e)) {
      expectTypeOf(e).toEqualTypeOf<MyError1>()
    }
  })

  it('errorsFromArray works with multiple types', () => {
    let e: unknown
    if (errorsFromArray([MyError1, MyError2])(e)) {
      expectTypeOf(e).toEqualTypeOf<MyError1 | MyError2>()
    }
  })

  it('errorsFromArray works with multiple incompatible types', () => {
    const e1 = [MyError1] as const
    const e2 = [MyError1, MyError2] as const
    const e3 = [MyError1, Error] as const
    expectTypeOf({} as _UnionFromConstructorsArray<typeof e1>).toEqualTypeOf<MyError1>()
    expectTypeOf({} as _UnionFromConstructorsArray<typeof e2>).toEqualTypeOf<MyError1 | MyError2>()
    expectTypeOf({} as _UnionFromConstructorsArray<typeof e3>).toEqualTypeOf<MyError1 | Error>()


    let e: unknown
    if (errorsFromArray([MyError1, Error])(e)) {
      expectTypeOf(e).toEqualTypeOf<MyError1 | Error>()
    }
  })

  it('can type the error with an array', () => {
    expectTypeOf(
      defineBasicLoader(loaderUser, {
        errors: errorsFromArray([MyError1, MyError2]),
      })().error.value
    ).toEqualTypeOf<MyError1 | MyError2 | null>()
    expectTypeOf(
      defineBasicLoader(loaderUser, {
        errors: [MyError1, MyError2],
      })().error.value
    ).toEqualTypeOf<MyError1 | MyError2 | null>()
  })

  it('makes data possibly undefined when server is not true', () => {
    expectTypeOf(
      defineBasicLoader(loaderUser, { server: false })().data.value
    ).toEqualTypeOf<UserData | undefined>()
  })

  it('infers the returned type for data', () => {
    expectTypeOf<UserData | undefined>(
      defineBasicLoader(loaderUser, { lazy: true })().data.value
    )
    expectTypeOf<UserData | undefined>(
      defineBasicLoader(loaderUser, { lazy: () => false })().data.value
    )
  })

  it('infers the returned type for the resolved value to always be defined', async () => {
    expectTypeOf(
      await defineBasicLoader(loaderUser)()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, {})()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { lazy: false })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { lazy: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { server: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { server: false })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { errors: false })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { errors: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { errors: [] })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { errors: false, lazy: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, { server: false, lazy: true })()
    ).toEqualTypeOf<UserData>()
    expectTypeOf(
      await defineBasicLoader(loaderUser, {
        errors: false,
        server: false,
        lazy: true,
      })()
    ).toEqualTypeOf<UserData>()
  })

  it('allows returning a Navigation Result without a type error', () => {
    expectTypeOf<UserData>(
      defineBasicLoader(async () => {
        if (Math.random()) {
          return loaderUser()
        } else {
          return new NavigationResult('/')
        }
      })().data.value
    )
    expectTypeOf(
      defineBasicLoader(async () => {
        if (Math.random()) {
          return loaderUser()
        } else {
          return new NavigationResult('/')
        }
      })()
    ).resolves.toEqualTypeOf<UserData>()
  })
})
