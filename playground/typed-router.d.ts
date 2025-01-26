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
    '/(test-group)': RouteRecordInfo<'/(test-group)', '/', Record<never, never>, Record<never, never>>,
    '/(test-group)/test-group-child': RouteRecordInfo<'/(test-group)/test-group-child', '/test-group-child', Record<never, never>, Record<never, never>>,
    'home': RouteRecordInfo<'home', '/', Record<never, never>, Record<never, never>>,
    '/[name]': RouteRecordInfo<'/[name]', '/:name', { name: ParamValue<true> }, { name: ParamValue<false> }>,
    '/[...path]': RouteRecordInfo<'/[...path]', '/:path(.*)', { path: ParamValue<true> }, { path: ParamValue<false> }>,
    '/[...path]+': RouteRecordInfo<'/[...path]+', '/:path(.*)+', { path: ParamValueOneOrMore<true> }, { path: ParamValueOneOrMore<false> }>,
    '/@[profileId]': RouteRecordInfo<'/@[profileId]', '/@:profileId', { profileId: ParamValue<true> }, { profileId: ParamValue<false> }>,
    '/about': RouteRecordInfo<'/about', '/about', Record<never, never>, Record<never, never>>,
    '/about.extra.nested': RouteRecordInfo<'/about.extra.nested', '/about/extra/nested', Record<never, never>, Record<never, never>>,
    '/articles': RouteRecordInfo<'/articles', '/articles', Record<never, never>, Record<never, never>>,
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
    '/nested-group/(group)': RouteRecordInfo<'/nested-group/(group)', '/nested-group', Record<never, never>, Record<never, never>>,
    '/nested-group/(nested-group-first-level)/(nested-group-deep)/nested-group-deep-child': RouteRecordInfo<'/nested-group/(nested-group-first-level)/(nested-group-deep)/nested-group-deep-child', '/nested-group/nested-group-deep-child', Record<never, never>, Record<never, never>>,
    '/nested-group/(nested-group-first-level)/nested-group-first-level-child': RouteRecordInfo<'/nested-group/(nested-group-first-level)/nested-group-first-level-child', '/nested-group/nested-group-first-level-child', Record<never, never>, Record<never, never>>,
    '/partial-[name]': RouteRecordInfo<'/partial-[name]', '/partial-:name', { name: ParamValue<true> }, { name: ParamValue<false> }>,
    '/custom-path': RouteRecordInfo<'/custom-path', '/surprise-:id(\d+)', Record<never, never>, Record<never, never>>,
    '/test-[a-id]': RouteRecordInfo<'/test-[a-id]', '/test-:a-id', { aId: ParamValue<true> }, { aId: ParamValue<false> }>,
    '/todos/': RouteRecordInfo<'/todos/', '/todos', Record<never, never>, Record<never, never>>,
    '/users/': RouteRecordInfo<'/users/', '/users', Record<never, never>, Record<never, never>>,
    '/users/[id]': RouteRecordInfo<'/users/[id]', '/users/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/users/[id].edit': RouteRecordInfo<'/users/[id].edit', '/users/:id/edit', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/users/colada-loader.[id]': RouteRecordInfo<'/users/colada-loader.[id]', '/users/colada-loader/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/users/nested.route.deep': RouteRecordInfo<'/users/nested.route.deep', '/users/nested/route/deep', Record<never, never>, Record<never, never>>,
    '/users/pinia-colada.[id]': RouteRecordInfo<'/users/pinia-colada.[id]', '/users/pinia-colada/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/users/query.[id]': RouteRecordInfo<'/users/query.[id]', '/users/query/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/users/tq-query.[id]': RouteRecordInfo<'/users/tq-query.[id]', '/users/tq-query/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/vuefire-tests/get-doc': RouteRecordInfo<'/vuefire-tests/get-doc', '/vuefire-tests/get-doc', Record<never, never>, Record<never, never>>,
    '/with-extension': RouteRecordInfo<'/with-extension', '/with-extension', Record<never, never>, Record<never, never>>,
  }
}
