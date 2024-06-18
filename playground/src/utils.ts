import { inject, toValue, onUnmounted } from 'vue'
import type {
  RouteLocation,
  RouteLocationNormalizedLoaded,
} from 'vue-router/auto'
import { viewDepthKey, useRoute, useRouter } from 'vue-router/auto'
import type { RouteNamedMap } from 'vue-router/auto-routes'

type NavigationReturn = RouteLocation | boolean | void

export function useParamMatcher<Name extends keyof RouteNamedMap>(
  _name: Name,
  fn: (
    to: RouteLocationNormalizedLoaded<Name>
  ) => NavigationReturn | Promise<NavigationReturn>
) {
  const route = useRoute()
  const router = useRouter()
  const depth = inject(viewDepthKey, 0)
  // we only need it the first time
  const matchedRecord = route.matched[toValue(depth) - 1]?.name
  console.log(matchedRecord)

  if (!matchedRecord) return

  console.log('add guard')

  const removeGuard = router.beforeEach((to) => {
    console.log('beforeEach', to)
    if (to.matched.find((record) => record.name === matchedRecord)) {
      return fn(to as RouteLocationNormalizedLoaded<Name>)
    }
  })

  onUnmounted(removeGuard)
}

export function dummy(arg: unknown) {
  return 'ok'
}

export const dummy_id = 'dummy_id'
export const dummy_number = 42
