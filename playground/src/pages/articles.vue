<script lang="ts" setup>
import type { RouteLocationNormalizedLoaded } from 'vue-router'

const route = useRoute()
route.name

// NOTE: I wonder if this helper is worth exposing in vue router
function routeHasParam<
  Route extends RouteLocationNormalizedLoaded,
  Param extends keyof Exclude<Route['params'], Record<PropertyKey, never>>,
>(
  route: Route,
  key: Param
): route is Exclude<Route, { params: Record<PropertyKey, never> }> & {
  params: Record<Param, unknown>
} {
  return key in route.params
}

if ('id' in route.params) {
  // @ts-expect-error: TS limitation?
  route.name satisfies '/articles/[id]' | '/articles/[id]+'
  route.params.id satisfies string | [string, ...string[]]
}

if (route.name !== '/articles' && route.name !== '/articles/') {
  route.name satisfies '/articles/[id]' | '/articles/[id]+'
  route.params.id satisfies string | [string, ...string[]]
}

if (routeHasParam(route, 'id')) {
  route.name
  route.name satisfies '/articles/[id]' | '/articles/[id]+'
  route.params.id satisfies string | [string, ...string[]]
}

definePage({
  // remove the name to avoid the page appearing in types
  name: false,
})
</script>

<template>
  <h1>Articles</h1>

  <RouterView />
</template>
