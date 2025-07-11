/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by unplugin-vue-router. ‼️ DO NOT MODIFY THIS FILE ‼️
// It's recommended to commit this file.
// Make sure to add this file to your tsconfig.json file as an "includes" or "files" entry.

declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'vue-router'

  /**
   * Route name map generated by unplugin-vue-router
   */
  export interface RouteNamedMap {
    '/(some-layout)/app': RouteRecordInfo<'/(some-layout)/app', '/app', Record<never, never>, Record<never, never>>,
    '/(some-layout)/home': RouteRecordInfo<'/(some-layout)/home', '/home', Record<never, never>, Record<never, never>>,
    '/(test-group)': RouteRecordInfo<'/(test-group)', '/', Record<never, never>, Record<never, never>, '/(test-group)/test-group-child'>,
    '/(test-group)/test-group-child': RouteRecordInfo<'/(test-group)/test-group-child', '/test-group-child', Record<never, never>, Record<never, never>>,
    'home': RouteRecordInfo<'home', '/', Record<never, never>, Record<never, never>>,
    '/[name]': RouteRecordInfo<'/[name]', '/:name', { name: ParamValue<true> }, { name: ParamValue<false> }>,
    '/[...path]': RouteRecordInfo<'/[...path]', '/:path(.*)', { path: ParamValue<true> }, { path: ParamValue<false> }>,
    '/[...path]+': RouteRecordInfo<'/[...path]+', '/:path(.*)+', { path: ParamValueOneOrMore<true> }, { path: ParamValueOneOrMore<false> }>,
    '/@[profileId]': RouteRecordInfo<'/@[profileId]', '/@:profileId', { profileId: ParamValue<true> }, { profileId: ParamValue<false> }>,
    '/about': RouteRecordInfo<'/about', '/about', Record<never, never>, Record<never, never>>,
    '/about.extra.nested': RouteRecordInfo<'/about.extra.nested', '/about/extra/nested', Record<never, never>, Record<never, never>>,
    '/articles/': RouteRecordInfo<'/articles/', '/articles', Record<never, never>, Record<never, never>>,
    '/articles/[id]': RouteRecordInfo<'/articles/[id]', '/articles/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/articles/[id]+': RouteRecordInfo<'/articles/[id]+', '/articles/:id+', { id: ParamValueOneOrMore<true> }, { id: ParamValueOneOrMore<false> }>,
    '/custom-definePage': RouteRecordInfo<'/custom-definePage', '/custom-definePage', Record<never, never>, Record<never, never>>,
    'a rebel': RouteRecordInfo<'a rebel', '/custom-name', Record<never, never>, Record<never, never>>,
    '/custom/page': RouteRecordInfo<'/custom/page', '/custom/page', Record<never, never>, Record<never, never>>,
    '/deep/nesting/works/[[files]]+': RouteRecordInfo<'/deep/nesting/works/[[files]]+', '/deep/nesting/works/:files*', { files?: ParamValueZeroOrMore<true> }, { files?: ParamValueZeroOrMore<false> }>,
    '/deep/nesting/works/at-root-but-from-nested': RouteRecordInfo<'/deep/nesting/works/at-root-but-from-nested', '/at-root-but-from-nested', Record<never, never>, Record<never, never>>,
    'deep the most rebel': RouteRecordInfo<'deep the most rebel', '/deep-most-rebel', Record<never, never>, Record<never, never>>,
    '/deep/nesting/works/custom-path': RouteRecordInfo<'/deep/nesting/works/custom-path', '/deep-surprise-:id(\d+)', Record<never, never>, Record<never, never>>,
    'deep a rebel': RouteRecordInfo<'deep a rebel', '/deep/nesting/works/custom-name', Record<never, never>, Record<never, never>>,
    '/docs/[lang]/real/': RouteRecordInfo<'/docs/[lang]/real/', '/docs/:lang/real', { lang: ParamValue<true> }, { lang: ParamValue<false> }>,
    '/feature-1/': RouteRecordInfo<'/feature-1/', '/feature-1', Record<never, never>, Record<never, never>>,
    '/feature-1/about': RouteRecordInfo<'/feature-1/about', '/feature-1/about', Record<never, never>, Record<never, never>>,
    '/feature-2/': RouteRecordInfo<'/feature-2/', '/feature-2', Record<never, never>, Record<never, never>>,
    '/feature-2/about': RouteRecordInfo<'/feature-2/about', '/feature-2/about', Record<never, never>, Record<never, never>>,
    '/feature-3/': RouteRecordInfo<'/feature-3/', '/feature-3', Record<never, never>, Record<never, never>>,
    '/feature-3/about': RouteRecordInfo<'/feature-3/about', '/feature-3/about', Record<never, never>, Record<never, never>>,
    '/file(ignored-parentheses)': RouteRecordInfo<'/file(ignored-parentheses)', '/file(ignored-parentheses)', Record<never, never>, Record<never, never>>,
    '/from-root': RouteRecordInfo<'/from-root', '/from-root', Record<never, never>, Record<never, never>>,
    '/group/(thing)': RouteRecordInfo<'/group/(thing)', '/group', Record<never, never>, Record<never, never>>,
    'the most rebel': RouteRecordInfo<'the most rebel', '/most-rebel', Record<never, never>, Record<never, never>>,
    '/multiple-[a]-[b]-params': RouteRecordInfo<'/multiple-[a]-[b]-params', '/multiple-:a-:b-params', { a: ParamValue<true>, b: ParamValue<true> }, { a: ParamValue<false>, b: ParamValue<false> }>,
    '/my-optional-[[slug]]': RouteRecordInfo<'/my-optional-[[slug]]', '/my-optional-:slug?', { slug?: ParamValueZeroOrOne<true> }, { slug?: ParamValueZeroOrOne<false> }>,
    '/n-[[n]]/': RouteRecordInfo<'/n-[[n]]/', '/n-:n?', { n?: ParamValueZeroOrOne<true> }, { n?: ParamValueZeroOrOne<false> }>,
    '/n-[[n]]/[[more]]+/': RouteRecordInfo<'/n-[[n]]/[[more]]+/', '/n-:n?/:more*', { n?: ParamValueZeroOrOne<true>, more?: ParamValueZeroOrMore<true> }, { n?: ParamValueZeroOrOne<false>, more?: ParamValueZeroOrMore<false> }>,
    '/n-[[n]]/[[more]]+/[final]': RouteRecordInfo<'/n-[[n]]/[[more]]+/[final]', '/n-:n?/:more*/:final', { n?: ParamValueZeroOrOne<true>, more?: ParamValueZeroOrMore<true>, final: ParamValue<true> }, { n?: ParamValueZeroOrOne<false>, more?: ParamValueZeroOrMore<false>, final: ParamValue<false> }>,
    '/named-views/parent': RouteRecordInfo<'/named-views/parent', '/named-views/parent', Record<never, never>, Record<never, never>, '/named-views/parent/'>,
    '/named-views/parent/': RouteRecordInfo<'/named-views/parent/', '/named-views/parent', Record<never, never>, Record<never, never>>,
    '/nested-group/(group)': RouteRecordInfo<'/nested-group/(group)', '/nested-group', Record<never, never>, Record<never, never>>,
    '/nested-group/(nested-group-first-level)/(nested-group-deep)/nested-group-deep-child': RouteRecordInfo<'/nested-group/(nested-group-first-level)/(nested-group-deep)/nested-group-deep-child', '/nested-group/nested-group-deep-child', Record<never, never>, Record<never, never>>,
    '/nested-group/(nested-group-first-level)/nested-group-first-level-child': RouteRecordInfo<'/nested-group/(nested-group-first-level)/nested-group-first-level-child', '/nested-group/nested-group-first-level-child', Record<never, never>, Record<never, never>>,
    '/partial-[name]': RouteRecordInfo<'/partial-[name]', '/partial-:name', { name: ParamValue<true> }, { name: ParamValue<false> }>,
    '/custom-path': RouteRecordInfo<'/custom-path', '/surprise-:id(\d+)', Record<never, never>, Record<never, never>>,
    '/test-[a-id]': RouteRecordInfo<'/test-[a-id]', '/test-:a-id', { aId: ParamValue<true> }, { aId: ParamValue<false> }>,
    '/todos/': RouteRecordInfo<'/todos/', '/todos', Record<never, never>, Record<never, never>>,
    '/todos/+layout': RouteRecordInfo<'/todos/+layout', '/todos/+layout', Record<never, never>, Record<never, never>>,
    '/users/': RouteRecordInfo<'/users/', '/users', Record<never, never>, Record<never, never>>,
    '/users/[id]': RouteRecordInfo<'/users/[id]', '/users/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/users/[id].edit': RouteRecordInfo<'/users/[id].edit', '/users/:id/edit', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/users/colada-loader.[id]': RouteRecordInfo<'/users/colada-loader.[id]', '/users/colada-loader/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/users/nested.route.deep': RouteRecordInfo<'/users/nested.route.deep', '/users/nested/route/deep', Record<never, never>, Record<never, never>>,
    '/users/pinia-colada.[id]': RouteRecordInfo<'/users/pinia-colada.[id]', '/users/pinia-colada/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/users/query.[id]': RouteRecordInfo<'/users/query.[id]', '/users/query/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/users/tq-infinite-query': RouteRecordInfo<'/users/tq-infinite-query', '/users/tq-infinite-query', Record<never, never>, Record<never, never>>,
    '/users/tq-query-bug': RouteRecordInfo<'/users/tq-query-bug', '/users/tq-query-bug', Record<never, never>, Record<never, never>>,
    '/users/tq-query.[id]': RouteRecordInfo<'/users/tq-query.[id]', '/users/tq-query/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/vuefire-tests/get-doc': RouteRecordInfo<'/vuefire-tests/get-doc', '/vuefire-tests/get-doc', Record<never, never>, Record<never, never>>,
    '/with-extension': RouteRecordInfo<'/with-extension', '/with-extension', Record<never, never>, Record<never, never>>,
  }

  /**
   * Route file to route info map by unplugin-vue-router.
   * Used by the volar plugin to automatically type useRoute()
   *
   * Each key is a file path relative to the project root with 2 properties:
   * - routes: union of route names of the possible routes when in this page (passed to useRoute<...>())
   * - views: names of nested views (can be passed to <RouterView name="...">)
   *
   * @internal
   */
  export interface _RouteFileInfoMap {
    'src/pages/(some-layout).vue': {
      routes: '/(some-layout)/app' | '/(some-layout)/home'
      views: 'default'
    }
    'src/pages/(some-layout)/app.vue': {
      routes: '/(some-layout)/app'
      views: never
    }
    'src/pages/(some-layout)/home.vue': {
      routes: '/(some-layout)/home'
      views: never
    }
    'src/pages/(test-group).vue': {
      routes: '/(test-group)' | '/(test-group)/test-group-child'
      views: 'default'
    }
    'src/pages/(test-group)/test-group-child.vue': {
      routes: '/(test-group)/test-group-child'
      views: never
    }
    'src/pages/index.vue': {
      routes: 'home' | '/from-root'
      views: never
    }
    'src/pages/index@named.vue': {
      routes: 'home'
      views: never
    }
    'src/pages/[name].vue': {
      routes: '/[name]'
      views: never
    }
    'src/pages/[...path].vue': {
      routes: '/[...path]'
      views: never
    }
    'src/pages/[...path]+.vue': {
      routes: '/[...path]+'
      views: never
    }
    'src/pages/@[profileId].vue': {
      routes: '/@[profileId]'
      views: never
    }
    'src/pages/about.vue': {
      routes: '/about'
      views: never
    }
    'src/pages/about.extra.nested.vue': {
      routes: '/about.extra.nested'
      views: never
    }
    'src/pages/articles.vue': {
      routes: '/articles/' | '/articles/[id]' | '/articles/[id]+'
      views: 'default'
    }
    'src/pages/articles/index.vue': {
      routes: '/articles/'
      views: never
    }
    'src/pages/articles/[id].vue': {
      routes: '/articles/[id]'
      views: never
    }
    'src/pages/articles/[id]+.vue': {
      routes: '/articles/[id]+'
      views: never
    }
    'src/pages/custom-definePage.vue': {
      routes: '/custom-definePage'
      views: never
    }
    'src/pages/custom-name.vue': {
      routes: 'a rebel'
      views: never
    }
    'src/pages/deep/nesting/works/too.vue': {
      routes: '/custom/page' | '/deep/nesting/works/at-root-but-from-nested'
      views: never
    }
    'src/pages/deep/nesting/works/[[files]]+.vue': {
      routes: '/deep/nesting/works/[[files]]+'
      views: never
    }
    'src/pages/deep/nesting/works/custom-name-and-path.vue': {
      routes: 'deep the most rebel'
      views: never
    }
    'src/pages/deep/nesting/works/custom-path.vue': {
      routes: '/deep/nesting/works/custom-path'
      views: never
    }
    'src/pages/deep/nesting/works/custom-name.vue': {
      routes: 'deep a rebel'
      views: never
    }
    'src/docs/real/index.md': {
      routes: '/docs/[lang]/real/'
      views: never
    }
    'src/features/feature-1/pages/index.vue': {
      routes: '/feature-1/'
      views: never
    }
    'src/features/feature-1/pages/about.vue': {
      routes: '/feature-1/about'
      views: never
    }
    'src/features/feature-2/pages/index.vue': {
      routes: '/feature-2/'
      views: never
    }
    'src/features/feature-2/pages/about.vue': {
      routes: '/feature-2/about'
      views: never
    }
    'src/features/feature-3/pages/index.vue': {
      routes: '/feature-3/'
      views: never
    }
    'src/features/feature-3/pages/about.vue': {
      routes: '/feature-3/about'
      views: never
    }
    'src/pages/file(ignored-parentheses).vue': {
      routes: '/file(ignored-parentheses)'
      views: never
    }
    'src/pages/group/(thing).vue': {
      routes: '/group/(thing)'
      views: never
    }
    'src/pages/custom-name-and-path.vue': {
      routes: 'the most rebel'
      views: never
    }
    'src/pages/multiple-[a]-[b]-params.vue': {
      routes: '/multiple-[a]-[b]-params'
      views: never
    }
    'src/pages/my-optional-[[slug]].vue': {
      routes: '/my-optional-[[slug]]'
      views: never
    }
    'src/pages/n-[[n]]/index.vue': {
      routes: '/n-[[n]]/'
      views: never
    }
    'src/pages/n-[[n]]/[[more]]+/index.vue': {
      routes: '/n-[[n]]/[[more]]+/'
      views: never
    }
    'src/pages/n-[[n]]/[[more]]+/[final].vue': {
      routes: '/n-[[n]]/[[more]]+/[final]'
      views: never
    }
    'src/pages/named-views/parent.vue': {
      routes: '/named-views/parent' | '/named-views/parent/'
      views: 'default' | 'a' | 'b'
    }
    'src/pages/named-views/parent/index.vue': {
      routes: '/named-views/parent/'
      views: never
    }
    'src/pages/named-views/parent/index@a.vue': {
      routes: '/named-views/parent/'
      views: never
    }
    'src/pages/named-views/parent/index@b.vue': {
      routes: '/named-views/parent/'
      views: never
    }
    'src/pages/nested-group/(group).vue': {
      routes: '/nested-group/(group)'
      views: never
    }
    'src/pages/nested-group/(nested-group-first-level)/(nested-group-deep)/nested-group-deep-child.vue': {
      routes: '/nested-group/(nested-group-first-level)/(nested-group-deep)/nested-group-deep-child'
      views: never
    }
    'src/pages/nested-group/(nested-group-first-level)/nested-group-first-level-child.vue': {
      routes: '/nested-group/(nested-group-first-level)/nested-group-first-level-child'
      views: never
    }
    'src/pages/partial-[name].vue': {
      routes: '/partial-[name]'
      views: never
    }
    'src/pages/custom-path.vue': {
      routes: '/custom-path'
      views: never
    }
    'src/pages/test-[a-id].vue': {
      routes: '/test-[a-id]'
      views: never
    }
    'src/pages/todos/index.vue': {
      routes: '/todos/'
      views: never
    }
    'src/pages/todos/+layout.vue': {
      routes: '/todos/+layout'
      views: never
    }
    'src/pages/users/index.vue': {
      routes: '/users/'
      views: never
    }
    'src/pages/users/[id].vue': {
      routes: '/users/[id]'
      views: never
    }
    'src/pages/users/[id].edit.vue': {
      routes: '/users/[id].edit'
      views: never
    }
    'src/pages/users/colada-loader.[id].vue': {
      routes: '/users/colada-loader.[id]'
      views: never
    }
    'src/pages/users/nested.route.deep.vue': {
      routes: '/users/nested.route.deep'
      views: never
    }
    'src/pages/users/pinia-colada.[id].vue': {
      routes: '/users/pinia-colada.[id]'
      views: never
    }
    'src/pages/users/query.[id].vue': {
      routes: '/users/query.[id]'
      views: never
    }
    'src/pages/users/tq-infinite-query.vue': {
      routes: '/users/tq-infinite-query'
      views: never
    }
    'src/pages/users/tq-query-bug.vue': {
      routes: '/users/tq-query-bug'
      views: never
    }
    'src/pages/users/tq-query.[id].vue': {
      routes: '/users/tq-query.[id]'
      views: never
    }
    'src/pages/vuefire-tests/get-doc.vue': {
      routes: '/vuefire-tests/get-doc'
      views: never
    }
    'src/pages/with-extension.page.vue': {
      routes: '/with-extension'
      views: never
    }
  }

  /**
   * Get a union of possible route names in a certain route component file.
   * Used by the volar plugin to automatically type useRoute()
   *
   * @internal
   */
  export type _RouteNamesForFilePath<FilePath extends string> =
    _RouteFileInfoMap extends Record<FilePath, infer Info>
      ? Info['routes']
      : keyof RouteNamedMap
}
