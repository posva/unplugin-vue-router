## [0.8.5](https://github.com/posva/unplugin-vue-router/compare/v0.8.4...v0.8.5) (2024-03-14)

### Bug Fixes

- avoid invalid modules with definePage query ([25bbec3](https://github.com/posva/unplugin-vue-router/commit/25bbec33cc963dab2a596a4626e9077762e000db)), closes [#338](https://github.com/posva/unplugin-vue-router/issues/338)

## [0.8.4](https://github.com/posva/unplugin-vue-router/compare/v0.8.3...v0.8.4) (2024-02-24)

This patch contains the necessary fixes to allow importing the data loaders. However, they cannot be imported from `vue-router/auto` nor from `unplugin-vue-router/runtime`. Instead, they should be imported from `unplugin-vue-router/data-loaders/...`. This is needed as some of the loaders depends on extra packages that not all users have installed. At the moment, there are two data loaders

- `unplugin-vue-router/data-loaders/basic`: https://uvr.esm.is/rfcs/data-loaders/basic.html
- `unplugin-vue-router/data-loaders/pinia-colada`: https://uvr.esm.is/rfcs/data-loaders/colada.html

### Bug Fixes

- allow untyped router with data loaders ([51f7d55](https://github.com/posva/unplugin-vue-router/commit/51f7d557d402ba90037ea454c7c350d2e1cbdbcc))
- **build:** externalize libs ([e55d735](https://github.com/posva/unplugin-vue-router/commit/e55d7357f25bf57ea944b71310381b40bea75c04))
- remove the need to install @pinia/colada ([8d45669](https://github.com/posva/unplugin-vue-router/commit/8d45669c9119fc8a968493a0b26294f662df4ca7))
- **types:** externalize uvr/types ([ee9a2a3](https://github.com/posva/unplugin-vue-router/commit/ee9a2a35c6ea62fae950c6abb3bd3cd85b28edc5)), closes [#322](https://github.com/posva/unplugin-vue-router/issues/322)

## [0.8.3](https://github.com/posva/unplugin-vue-router/compare/v0.8.2...v0.8.3) (2024-02-22)

### Bug Fixes

- **dts:** fix default value for routesFolder ([1ed1eda](https://github.com/posva/unplugin-vue-router/commit/1ed1eda179138f4c3d8265349b826795e47d8499)), closes [#320](https://github.com/posva/unplugin-vue-router/issues/320)

## [0.8.2](https://github.com/posva/unplugin-vue-router/compare/v0.8.1...v0.8.2) (2024-02-22)

### Bug Fixes

- **data-loaders:** fix types references ([6558fa8](https://github.com/posva/unplugin-vue-router/commit/6558fa892d28ceab812fe42339ccc5e0e4ab067d))
- **types:** typed router ([8ff1984](https://github.com/posva/unplugin-vue-router/commit/8ff19848840c419dd1c8861d3935d542f4bd289e))

## [0.8.1](https://github.com/posva/unplugin-vue-router/compare/v0.8.0...v0.8.1) (2024-02-22)

### Bug Fixes

- upgrade peer dep on vue-router to 4.3.0 ([746ad8f](https://github.com/posva/unplugin-vue-router/commit/746ad8fa9055853594dad09524657416402ef383))

# [0.8.0](https://github.com/posva/unplugin-vue-router/compare/v0.7.0...v0.8.0) (2024-02-22)

Based on the feedback of the RFC, the Data Loaders have been redesigned from the ground up and are now way more flexible and powerful. As a result, if you were using the experimental data loaders, make sure to check the list of breaking changes and the new RFC at https://uvr.esm.is/rfcs/data-loaders. We are looking for early testers and feedback!

For people using the file-based routing, you now need to add `unplugin-vue-router/client` to the `types` property of your tsconfig. See [setup](https://uvr.esm.is/introduction.html#setup) for an example.

### Bug Fixes

- allow errors outside of navigation ([ae37a8e](https://github.com/posva/unplugin-vue-router/commit/ae37a8ec218ba62f0bac20039d6e8942f63f0d96))
- avoid uncatchable rejection ([fa0c794](https://github.com/posva/unplugin-vue-router/commit/fa0c794a066ace43cf87e252191943f4c856170d))
- delay setting the error ([3d341ae](https://github.com/posva/unplugin-vue-router/commit/3d341ae5a63f6930e7a54a80af007132f3532f5a))
- discard loads from canceled navigations ([aac66c1](https://github.com/posva/unplugin-vue-router/commit/aac66c16826f5a5f68da478663706385ac31d45d)), closes [posva/unplugin-vue-router#200](https://github.com/posva/unplugin-vue-router/issues/200)
- router.push types ([98cb17b](https://github.com/posva/unplugin-vue-router/commit/98cb17bf9d837f5cbaa370cfa9c8d7f377818080))
- run nested loaders once when used across places ([73a6cc5](https://github.com/posva/unplugin-vue-router/commit/73a6cc5c875b95c6921c1b1dba1207aa80c2a878))
- **types:** correct types in navigation guards ([3f01155](https://github.com/posva/unplugin-vue-router/commit/3f01155e8cb609d1af07b115103907176d44aab8))
- **types:** correctly extend client ([d226cf9](https://github.com/posva/unplugin-vue-router/commit/d226cf9266a36564bccc8ee9a0b1c5980d5c6000))
- **types:** remove null from non raw star param ([0b71ad5](https://github.com/posva/unplugin-vue-router/commit/0b71ad5fd9e0f79b8a3508cc8849ef4c85e0f029))
- **types:** restrict what can be imported from the package ([8748644](https://github.com/posva/unplugin-vue-router/commit/874864497414ad503b9a5c185f650c5d0c7a5746)), closes [#289](https://github.com/posva/unplugin-vue-router/issues/289)
- **types:** use `vue-router/auto-routes` ([2dc0446](https://github.com/posva/unplugin-vue-router/commit/2dc0446ee956c01cdc97a912f3362d62f35906cd))
- use single alias for reused components on different paths ([1544363](https://github.com/posva/unplugin-vue-router/commit/1544363383992a38339786178a836ad7e1bad712))

### Code Refactoring

- rename `pending` to `isLoading` ([9502751](https://github.com/posva/unplugin-vue-router/commit/950275193e43936481337f291ce79b4f60a27d76))
- refactor!: remove deprecated APIs ([0415b9e](https://github.com/posva/unplugin-vue-router/commit/0415b9eb86a68f9fe687a0bae02405bd2123f2a9))
- refactor(data-loaders)!: rewrite of data loaders ([f0b7b58](https://github.com/posva/unplugin-vue-router/commit/f0b7b58e0a588146f70b38d9037e4221204b25c7))
- refactor!: remove `setupLoaderGuard` ([8094f62](https://github.com/posva/unplugin-vue-router/commit/8094f62f5871988611d82e857867064b2d959189))

### Features

- add pinia colada properties ([63a768f](https://github.com/posva/unplugin-vue-router/commit/63a768f8e8e7fce2a60fc8f76ce54bba303ce041))
- commit option ([56b2a4d](https://github.com/posva/unplugin-vue-router/commit/56b2a4d6e35aa8ef5d45f4ee914ab86a7577f8e5)), closes [posva/unplugin-vue-router#201](https://github.com/posva/unplugin-vue-router/issues/201)
- **data-fetching:** add server option ([d4d2f46](https://github.com/posva/unplugin-vue-router/commit/d4d2f46c156d8837ec5f403ff21ffe9a86065853))
- **data-loaders:** abort the signal for old pending locations ([afabb47](https://github.com/posva/unplugin-vue-router/commit/afabb47c4ed2428b11388d14f676a1b95eb9dec1))
- **data-loaders:** add abort signal to navigation ([a175fa7](https://github.com/posva/unplugin-vue-router/commit/a175fa7b9800f7abce454fa2a46c9e4163293494))
- **data-loaders:** allow changing the navigation result ([7a7da74](https://github.com/posva/unplugin-vue-router/commit/7a7da74a3bddf3e0f836f70a2e0df4b89bb52a82))
- **data-loaders:** pass the signal to the loader ([85d0494](https://github.com/posva/unplugin-vue-router/commit/85d049435e6edb8341b2430653a807fbf2906ef0))
- handle thrown errors ([2e38544](https://github.com/posva/unplugin-vue-router/commit/2e385445546ee363167860c03c445ca081614eb3))
- inject in nested loaders ([b0aa0b3](https://github.com/posva/unplugin-vue-router/commit/b0aa0b391da76ecc6493632ae1952ff773cebba8))
- **loaders:** thrown navigation results take precedence ([2aaaf56](https://github.com/posva/unplugin-vue-router/commit/2aaaf567f99059c5b679e3d25b34bf6d2145f9d2))
- return a promise of data only ([d2dda40](https://github.com/posva/unplugin-vue-router/commit/d2dda40cb68cb87dca701ed682dc1d9cf9349b05))
- run loaders with access to global inject and provide ([9d95e27](https://github.com/posva/unplugin-vue-router/commit/9d95e27aef4e68f2d53a36cc18007ad407447a07))
- track used params ([b2ae763](https://github.com/posva/unplugin-vue-router/commit/b2ae7633b34fd35dce00d0a7a25c9f1cf744bad3))

### Performance Improvements

- compute params once ([322f220](https://github.com/posva/unplugin-vue-router/commit/322f2203da10bd1b18288060d3cda91c95dfd28d))
- use a shallowRef for data ([aae0c70](https://github.com/posva/unplugin-vue-router/commit/aae0c70a8051e9aa8f21c643d1b0a2d916b354a5))
- use for of instead of forEach ([1635745](https://github.com/posva/unplugin-vue-router/commit/1635745cc58f5e312602ee2b4430b811cd63808b))

### BREAKING CHANGES

- Remove the deprecated APIs:

- `createPrefixTree()` -> `new PrefixTree()`
- `VueRouterExports` -> `VueRouterAutoImports`

- Data Loaders have been redesigned to be more flexible
  and account for other libraries. Notably, the caching behavior has been
  moved out of the basic loader to an extended one [pinia-colada](https://uvr.esm.is/rfcs/data-loaders/colada.html) and the [basic loader](https://uvr.esm.is/rfcs/data-loaders/basic.html)
  has no cache. All of the pending bugs have also been fixed.
  I recommend you to give the RFC examples a new read to get
  setup: https://uvr.esm.is/rfcs/data-loaders/. Most of the changes are
  simplifying things by removing them.
  Here is a list of the breaking changes to simplify
  migration:

  - The `dataFetching` option is no longer needed.
  - Manual work needed to add loaders with `HasDataLoaderMeta` has been
    removed. It is just no longer needed. Loaders are picked up from lazy
    loaded components and must otherwise be directly added to a `meta.loaders`
    array. See the example at https://uvr.esm.is/rfcs/data-loaders/#basic-example
  - The function `setupDataFetchingGuard` has been replaced with a Vue
    Plugin. See https://uvr.esm.is/rfcs/data-loaders/#data-loader-setup
    for details.
  - If you were relying on `cacheTime`, use the `staleTime` option in the
    new [`defineColadaLoader()`](https://uvr.esm.is/rfcs/data-loaders/colada) based off [@pinia/colada](https://github.com/posva/pinia-colada)
  - To reduce the dependency on file-based router, things have been
    refactored and none of the defineLoader functions are automatically
    imported anymore. You can add them yourself to the list of auto
    imports, or import them from `unplugin-vue-router/data-loaders/...`. The good news is you
    no longer need to use the plugin in order to benefit from the data
    loaders; they can be imported **even if you don't want file-based routing**.

  If you find missing information or improvements, please open a Pull
  Request to improve the `CHANGELOG.md`.

  - The navigation guard is replaced in favor of a Vue
    plugin:

  Replace

  ```ts
  import { setupLoaderGuard } from 'vue-router/auto'

  setupLoaderGuard({ router, app })
  ```

  with

  ```ts
  import { DataLoaderPlugin } from 'vue-router/auto'

  app.use(DataLoaderPlugin, { router })
  ```

  - `vue-router/auto/routes` becomes `vue-router/auto-routes`. This change was necessary to improve compatibility with
    TypeScript and other tools in the ecosystem. Most of the time you don't
    need to use this path but if you were using it, replace it:

  ```diff
  - import { } from 'vue-router/auto/routes'
  + import { } from 'vue-router/auto-routes'
  ```

  - Data Loaders now return an `isLoading` property instead
    of `pending`. This aligns better with the wording of Data Loaders being
    in a loading state rather than pending, which can have more meanings.
  - You know need to add `unplugin-vue-router/client` to the `types` property of your tsconfig. See [setup](https://uvr.esm.is/introduction.html#setup) for an example. This file contains the augmentation of the `vue-router/auto` module that was previously in `typed-router.d.ts`. You also need to set the `modeResolution` to `Bundler` in your `tsconfig.json`.

  - the existing `defineLoader` is being replaced by a
    basic loader without cache. The version with cache will be implemented
    by adding a library that properly handles the caching. This new strategy
    will also enable other integrations like VueFire, Apollo, and custom
    ones. Keep an eye (subscribe) to the RFC for news and to discus about
    the future of Data Loaders: https://github.com/vuejs/rfcs/discussions/460
  - since data loaders aren't meant to be awaited in script
    setup (they are awaited at the navigation level), they now return a
    promise of the raw data only, not of the UseDataLoaderReturn, to make it
    clearer that this syntax is a bit special and should only be used within
    nested loaders. This change also brings other benefits like allowing
    lazy loaders to be awaited within loaders without changing their usage
    outside, in components. Also, allowing different types of commit while
    still allowing data to be awaited within loaders.

# [0.7.0](https://github.com/posva/unplugin-vue-router/compare/v0.6.4...v0.7.0) (2023-09-22)

### Bug Fixes

- allow overriding and extending folder options ([1f6e312](https://github.com/posva/unplugin-vue-router/commit/1f6e312bb74519cb89a616f6fa22a81044c5ed5b))
- correctly ignore folders ([cbd14b9](https://github.com/posva/unplugin-vue-router/commit/cbd14b9009f440b7cadc3b6fa67a015259bc5807))
- keep parent override in children ([f651961](https://github.com/posva/unplugin-vue-router/commit/f6519614b208a304d3b5019629aa25ba49237bda)), closes [#189](https://github.com/posva/unplugin-vue-router/issues/189)

### Features

- allow path as function ([b913f56](https://github.com/posva/unplugin-vue-router/commit/b913f5653ef21e8569db6334a7e76bdf66aa40c7))

### BREAKING CHANGES

- `exclude` is no longer relative to `routesFolder.src` but to the _cwd_. like other paths. Note this is technically a fix that should simplify your configuration.

## [0.6.4](https://github.com/posva/unplugin-vue-router/compare/v0.6.3...v0.6.4) (2023-05-09)

### Bug Fixes

- expose types for bundler module resolution ([#162](https://github.com/posva/unplugin-vue-router/issues/162)) ([82e2577](https://github.com/posva/unplugin-vue-router/commit/82e25778c0ef59f61117cf982e66c215bc8c3675))

### Features

- ignore autogenerated file linting ([#160](https://github.com/posva/unplugin-vue-router/issues/160)) ([18d1812](https://github.com/posva/unplugin-vue-router/commit/18d181271a343864ba71067a3936cf98bd97bcbd))

## [0.6.3](https://github.com/posva/unplugin-vue-router/compare/v0.6.2...v0.6.3) (2023-05-02)

### Bug Fixes

- handle empty regexp in raw routes ([9bea452](https://github.com/posva/unplugin-vue-router/commit/9bea4525680ad5de7ccca7b1ce6da1220f0763aa))

## [0.6.2](https://github.com/posva/unplugin-vue-router/compare/v0.6.1...v0.6.2) (2023-05-01)

### Bug Fixes

- **options:** dotNesting ([b7abc9b](https://github.com/posva/unplugin-vue-router/commit/b7abc9b49c96010bccc1b2779d233f933d42087a))

## [0.6.1](https://github.com/posva/unplugin-vue-router/compare/v0.6.0...v0.6.1) (2023-05-01)

### Bug Fixes

- **types:** correct exports in new files ([e9056f7](https://github.com/posva/unplugin-vue-router/commit/e9056f7281f922649d5304d3bf3d7e7c07403d20))

# [0.6.0](https://github.com/posva/unplugin-vue-router/compare/v0.5.5...v0.6.0) (2023-05-01)

### Bug Fixes

- allow suffix after param [id]\_s ([f0fcc07](https://github.com/posva/unplugin-vue-router/commit/f0fcc07ed5f05e926664c2fdba462ddee60531f5))
- handle raw segments in EditableTreeNode ([5695522](https://github.com/posva/unplugin-vue-router/commit/5695522a8b785f45d4c1c111c419f01d75411077))

### Features

- allow inserting raw routes in the editable tree node ([c04d068](https://github.com/posva/unplugin-vue-router/commit/c04d068f59a74b7a72e115173d5b5fb66cb9a985))
- dotNesting option to disable dot special handling in filenames ([d803831](https://github.com/posva/unplugin-vue-router/commit/d803831230590e8448c54710d657d910e073ced3))
- **types:** expose RouterLinkProps typed ([04031b4](https://github.com/posva/unplugin-vue-router/commit/04031b48dc26c3adb581749856d3482904243899))

## [0.5.5](https://github.com/posva/unplugin-vue-router/compare/v0.5.4...v0.5.5) (2023-04-18)

### Bug Fixes

- no missing imports ([65f8c83](https://github.com/posva/unplugin-vue-router/commit/65f8c83e494e955632d8c88e84820d9399ba0c89))
- remove old option ([7368185](https://github.com/posva/unplugin-vue-router/commit/7368185477ab7eb5f65d7dece9b1bd1fde1c01ef))
- split types from index to avoid types pollution ([4026948](https://github.com/posva/unplugin-vue-router/commit/4026948d48cd83488bdd7ad783a7f8212eab563b)), closes [#136](https://github.com/posva/unplugin-vue-router/issues/136)
- **types:** skip postbuild fix on types ([d54a9b7](https://github.com/posva/unplugin-vue-router/commit/d54a9b79f0638b688b3d939d3be76407ac058cfa))

### Features

- add children to EditableTreeNode ([2eef836](https://github.com/posva/unplugin-vue-router/commit/2eef836ff163992e6e16febacfd133521850ea82))
- expose default options ([47b4aed](https://github.com/posva/unplugin-vue-router/commit/47b4aed5b7b0e4171174434521d463df2cdf90ca))

## [0.5.4](https://github.com/posva/unplugin-vue-router/compare/v0.5.3...v0.5.4) (2023-03-02)

### Features

- allow exclude per folder ([468b251](https://github.com/posva/unplugin-vue-router/commit/468b2518badeb7981ad5ae123c5edd2fee80ab35))

## [0.5.3](https://github.com/posva/unplugin-vue-router/compare/v0.5.2...v0.5.3) (2023-03-02)

- feat!: rename filePattern to filePatterns and allow arrays ([8902778](https://github.com/posva/unplugin-vue-router/commit/890277813c02c4e784e6dea606201bda2477b532))

### BREAKING CHANGES

- `filePattern` is now named `filePatterns` because it
  allows arrays. This is only a naming change.

## [0.5.2](https://github.com/posva/unplugin-vue-router/compare/v0.5.1...v0.5.2) (2023-03-02)

### Features

- allow overriding the file pattern ([96febf1](https://github.com/posva/unplugin-vue-router/commit/96febf146893b06a282d75c6cc134f9129d99b57))

## [0.5.1](https://github.com/posva/unplugin-vue-router/compare/v0.5.0...v0.5.1) (2023-03-01)

### Features

- allow extending the type of `definePage()` ([4d663b1](https://github.com/posva/unplugin-vue-router/commit/4d663b1a266c00c847957735cc220f16d033758c))
- export EditableTreeNode ([b5745e1](https://github.com/posva/unplugin-vue-router/commit/b5745e1b3eb3408cef2e5401ecba547438b385b3))

# [0.5.0](https://github.com/posva/unplugin-vue-router/compare/v0.4.1...v0.5.0) (2023-02-16)

- feat!: allow set operations on meta ([a84d659](https://github.com/posva/unplugin-vue-router/commit/a84d659e5c84ab3d47f7c041d0d5cf91e9bf3d0f))

### Features

- **types:** improve routeBlockLang ([19bd892](https://github.com/posva/unplugin-vue-router/commit/19bd8927faf8f1bf40272ad9d6f2f392ab826ea2))

### BREAKING CHANGES

- if you were setting directly `route.meta` within
  `extendRoute()`, you know need to use `route.addToMeta()` instead to
  have the same merging behavior. Directly setting `route.meta` now
  replaces the `meta` property completely.

## [0.4.1](https://github.com/posva/unplugin-vue-router/compare/v0.4.0...v0.4.1) (2023-02-16)

### Bug Fixes

- **webpack:** handle loadInclude ([9a43b63](https://github.com/posva/unplugin-vue-router/commit/9a43b6339d26337ad4418fb500a805138147c12f))

# [0.4.0](https://github.com/posva/unplugin-vue-router/compare/v0.3.3...v0.4.0) (2023-02-16)

### Bug Fixes

- handle insertions with leading slash in extendRoute ([d1287b8](https://github.com/posva/unplugin-vue-router/commit/d1287b8c5ee3076e1dd0a9582933a0c6bd68496a))

- feat!: rename EditableTreeNode `files` to `components` ([5c359c9](https://github.com/posva/unplugin-vue-router/commit/5c359c92caec08495735c9152e8c64768d8f4ab9))

### Features

- add internal name in virtual files as comments ([326156d](https://github.com/posva/unplugin-vue-router/commit/326156d44af0b9552bff6277c3cbc8f875ce87c9))
- allow changing the path in extendRoute ([a9d0c77](https://github.com/posva/unplugin-vue-router/commit/a9d0c77c76ac66aa6a38d0091c4ec5cb83906bb9))

### BREAKING CHANGES

- the property `files` in `EditableTreeNode` (e.g. within `extendRoute`) is now named `components` to match the route record name.

## [0.3.3](https://github.com/posva/unplugin-vue-router/compare/v0.3.2...v0.3.3) (2023-02-15)

🙌 This version introduces the ability to extend the routes with the `extendRoutes` option. Please refer to [the relevant issue](https://github.com/posva/unplugin-vue-router/issues/43) for use cases and share any problems you might have.

### Bug Fixes

- **runtime:** merge aliases ([73bacd9](https://github.com/posva/unplugin-vue-router/commit/73bacd90df0bea1c595e94080b283781d9a57415))

### Features

- beforeWriteFiles ([cc12c24](https://github.com/posva/unplugin-vue-router/commit/cc12c2493f9ebbdc0a57dbdcdc32c6394d471fe4))
- extendRoute ([ff0195f](https://github.com/posva/unplugin-vue-router/commit/ff0195f6fd049cd05590a9d886ed2b9d89bda829))
- **warn:** improve invalid lang warn for route block ([5c8c7df](https://github.com/posva/unplugin-vue-router/commit/5c8c7dfae4c741925e6ad17563c8ff262ff4cf4c))
- **warn:** missing dots in extensions ([18f30a1](https://github.com/posva/unplugin-vue-router/commit/18f30a1071b588ccd61b82c98bce59d46ad7ec59)), closes [#117](https://github.com/posva/unplugin-vue-router/issues/117)
- wip extendroutes ([627f417](https://github.com/posva/unplugin-vue-router/commit/627f417b0435cebad8e07f5ac80ab27134eaa9ff))

## [0.3.2](https://github.com/posva/unplugin-vue-router/compare/v0.3.1...v0.3.2) (2023-01-09)

### Bug Fixes

- sfc parsing update ([e75d678](https://github.com/posva/unplugin-vue-router/commit/e75d678e6082fbb10b499fec2f7499b0da36c064)), closes [#116](https://github.com/posva/unplugin-vue-router/issues/116)

## [0.3.1](https://github.com/posva/unplugin-vue-router/compare/v0.3.0...v0.3.1) (2023-01-08)

### Bug Fixes

- parse non modules with definePage ([ce70048](https://github.com/posva/unplugin-vue-router/commit/ce70048e0628795273fa7aff645d2a1e16712c21)), closes [#114](https://github.com/posva/unplugin-vue-router/issues/114)
- stricter extension check ([f5f508a](https://github.com/posva/unplugin-vue-router/commit/f5f508ae75752f71f937d0d1b60ecd7037a6bb3a))
- work with files named definePage ([178107b](https://github.com/posva/unplugin-vue-router/commit/178107bed3d9352e5d9e64855fb0704613bf6d9d))

### Features

- handle long extensions ([d93db33](https://github.com/posva/unplugin-vue-router/commit/d93db33277063a962adcb525ee551f1cd30dd31c)), closes [#101](https://github.com/posva/unplugin-vue-router/issues/101)

# [0.3.0](https://github.com/posva/unplugin-vue-router/compare/v0.2.3...v0.3.0) (2023-01-03)

### Bug Fixes

- **build:** remove **DEV** ([a50b713](https://github.com/posva/unplugin-vue-router/commit/a50b713b3c11f3b3be5bba7a41d558fa2522caaa))
- read name and path from definePage ([dffcc61](https://github.com/posva/unplugin-vue-router/commit/dffcc613462e8165c7c676f40a7da6d5554d1e8b)), closes [#74](https://github.com/posva/unplugin-vue-router/issues/74)

### Features

- add guards to auto imports ([bfbe240](https://github.com/posva/unplugin-vue-router/commit/bfbe240cf4f8aab2b464d1783e70fe5eba32302d)), closes [#100](https://github.com/posva/unplugin-vue-router/issues/100)
- export RouterLink component ([#105](https://github.com/posva/unplugin-vue-router/issues/105)) ([53b276d](https://github.com/posva/unplugin-vue-router/commit/53b276d45a5da4aa2611e3bc979971932639fa67))

## [0.2.3](https://github.com/posva/unplugin-vue-router/compare/v0.2.2...v0.2.3) (2022-10-05)

### Bug Fixes

- merge route record ([f1e7c8b](https://github.com/posva/unplugin-vue-router/commit/f1e7c8b76741b33530cf1968d32aa35b37b3adfd))

## [0.2.2](https://github.com/posva/unplugin-vue-router/compare/v0.2.1...v0.2.2) (2022-09-30)

### Bug Fixes

- **types:** for auto import ([49ffe81](https://github.com/posva/unplugin-vue-router/commit/49ffe81d27dd16d279e6c63d3cbc18f75c5dbda8))
- **types:** remove trailing slash in path for nested routes ([f0cfb36](https://github.com/posva/unplugin-vue-router/commit/f0cfb362f161b696f08aa6dcfe19bbd373328b8c)), closes [#70](https://github.com/posva/unplugin-vue-router/issues/70)

### Features

- allow not passing a config ([80fd444](https://github.com/posva/unplugin-vue-router/commit/80fd4445ccecd6ee890e7ca15b18b1cb25e42cce)), closes [#59](https://github.com/posva/unplugin-vue-router/issues/59)
- **types:** RouteLocationRaw ([731e9dd](https://github.com/posva/unplugin-vue-router/commit/731e9dd4bfb407617803109ffbd12c463e7dfe68)), closes [#66](https://github.com/posva/unplugin-vue-router/issues/66)

## [0.2.1](https://github.com/posva/unplugin-vue-router/compare/v0.2.0...v0.2.1) (2022-08-27)

### Bug Fixes

- simplify import names ([7c01822](https://github.com/posva/unplugin-vue-router/commit/7c01822424bf1004f7d14813a712312dcec19520)), closes [#47](https://github.com/posva/unplugin-vue-router/issues/47)

# [0.2.0](https://github.com/posva/unplugin-vue-router/compare/v0.1.2...v0.2.0) (2022-08-26)

## Introducing Experimental Data fetching

Refer to <https://github.com/posva/unplugin-vue-router/tree/main/src/data-fetching>
for up to date information on how to use the data fetching.

### Bug Fixes

- slash some path for windows ([#48](https://github.com/posva/unplugin-vue-router/issues/48)) ([bc152e3](https://github.com/posva/unplugin-vue-router/commit/bc152e38705185aa39a84a85dd787ad9e4c18cde))

### Features

- add setupNavigationGuard options ([0656e35](https://github.com/posva/unplugin-vue-router/commit/0656e3500f78dda7f3056777c43fc8698054d64a))
- explicitly allow for the data fetching guard ([5f672b2](https://github.com/posva/unplugin-vue-router/commit/5f672b2bb8ca7fef944da3eb4a30bdc8aeb7f471))
- importMode option ([9aa2e33](https://github.com/posva/unplugin-vue-router/commit/9aa2e33bd5354549639bb4610f3ae0621d0b7a5a)), closes [#47](https://github.com/posva/unplugin-vue-router/issues/47)
- one single auto import ([c82e964](https://github.com/posva/unplugin-vue-router/commit/c82e9647a59469b2a67ccae92e31d17f5493b0c3))
- parse definePage ([b2470a6](https://github.com/posva/unplugin-vue-router/commit/b2470a66b4364879ffb9d979c5ffd18c22cea785))
- support props to route blocks ([073c29c](https://github.com/posva/unplugin-vue-router/commit/073c29cca6e96fec54f149c6160405b3a7760383)), closes [#49](https://github.com/posva/unplugin-vue-router/issues/49)

## [0.1.2](https://github.com/posva/unplugin-vue-router/compare/v0.1.1...v0.1.2) (2022-08-10)

### Features

- **ssr:** support SSR ([5578f7d](https://github.com/posva/unplugin-vue-router/commit/5578f7d9d067c8d0664d7fb73860bbd9d2c93e1b))

## [0.1.1](https://github.com/posva/unplugin-vue-router/compare/v0.1.0...v0.1.1) (2022-08-09)

### Bug Fixes

- **types:** declaration of auto module ([e5ac67c](https://github.com/posva/unplugin-vue-router/commit/e5ac67c41fffb7f0f0997230c40c1b3a2d717f93))

# [0.1.0](https://github.com/posva/unplugin-vue-router/compare/v0.0.21...v0.1.0) (2022-08-09)

### Bug Fixes

- deep merge meta properties ([47bce4f](https://github.com/posva/unplugin-vue-router/commit/47bce4f6e9f6e3c4290adb56527abe3df6f46a23))
- expose options subpath ([#42](https://github.com/posva/unplugin-vue-router/issues/42)) ([b44c32e](https://github.com/posva/unplugin-vue-router/commit/b44c32e662e12f3c62dc5300a76a15dabddf2474))
- handle nested loaders that were already called ([6887fb2](https://github.com/posva/unplugin-vue-router/commit/6887fb20587ada79a07f89671622eaa32d95eac3))
- reload the page during dev when no cache entry is available ([918bfd0](https://github.com/posva/unplugin-vue-router/commit/918bfd0cf75f6bf6c5e045722c9b2f831dbc310c))
- support older browsers with object.assign ([66c7ae0](https://github.com/posva/unplugin-vue-router/commit/66c7ae0bbd27415de1f3339e554692814c676525))
- trigger loaders only once when nested ([4a13819](https://github.com/posva/unplugin-vue-router/commit/4a13819c635f9cee1e3bcc04bd63c19bf8cbd515))

### Code Refactoring

- rename `[@vue-router](https://github.com/vue-router)` to `vue-router/auto` ([461530a](https://github.com/posva/unplugin-vue-router/commit/461530a439d05e5a9f3e20ca9058160d19580287))

### Features

- add basic data loaders ([9c19fd2](https://github.com/posva/unplugin-vue-router/commit/9c19fd2023db5c31eab21470561e91f07e6029d6))
- add lazy loaders ([815f875](https://github.com/posva/unplugin-vue-router/commit/815f8759eaff8c293a1cac832f3c020d3c39ce8b))
- add pendingLoad ([055bc3c](https://github.com/posva/unplugin-vue-router/commit/055bc3c229d95f8e106f486cb35092026f6c8053))
- allow enabling experimental data fetching ([1b7e6b3](https://github.com/posva/unplugin-vue-router/commit/1b7e6b3a305ea626dcb6046b1ca8f7f6884bfec9))
- change default route component folder to `src/pages` ([6d6cb13](https://github.com/posva/unplugin-vue-router/commit/6d6cb135e93447141970c37e133db69737a07a25))
- implement nested sequential loaders ([6d5201f](https://github.com/posva/unplugin-vue-router/commit/6d5201fdf01ba5e8470996693dc55fa3ee413705))
- track hash reads ([e5583a4](https://github.com/posva/unplugin-vue-router/commit/e5583a458aa24de96d4bf9d893eb86b5c7eef998))

### BREAKING CHANGES

- the module name is now `vue-router/auto` instead of
  `@vue-router`. To upgrade to this version you only need to replace it:

  ```diff
  -import { ... } from '@vue-router'
  +import { ... } from 'vue-router/auto'

  -import { ... } from '@vue-router/routes'
  +import { ... } from 'vue-router/auto/routes'
  ```

  This allows stubbing the package in `vue-router` to hint the user
  towards this plugin.

- the default value of `routesFolder` is changed from
  `src/routes` to `src/pages`. If you **didn't change this setting**, you
  will have to either:
  - rename your `src/routes` folder to `src/pages`
  - add `routesFolder: 'src/routes'` to the options of the plugin in your
    vite, webpack, etc config

## [0.0.21](https://github.com/posva/unplugin-vue-router/compare/v0.0.20...v0.0.21) (2022-07-12)

### Features

- support multiple folders ([8a2e2a8](https://github.com/posva/unplugin-vue-router/commit/8a2e2a8b54b16ab128546ae0f0f14f6a3316b95d)), closes [#28](https://github.com/posva/unplugin-vue-router/issues/28)

## [0.0.20](https://github.com/posva/unplugin-vue-router/compare/v0.0.19...v0.0.20) (2022-07-07)

### Bug Fixes

- correct arg for useLink ([afdf147](https://github.com/posva/unplugin-vue-router/commit/afdf147bb4d2e8191dce00ebde408056acc474c4))

## [0.0.19](https://github.com/posva/unplugin-vue-router/compare/v0.0.18...v0.0.19) (2022-07-07)

### Bug Fixes

- trim route blocks ([3427e9f](https://github.com/posva/unplugin-vue-router/commit/3427e9f6ec6a5682a7d3bf0b440a0a220ba1ef84)), closes [#23](https://github.com/posva/unplugin-vue-router/issues/23)

## [0.0.18](https://github.com/posva/unplugin-vue-router/compare/v0.0.17...v0.0.18) (2022-07-07)

### Bug Fixes

- **link:** fix slot types ([64ff5b6](https://github.com/posva/unplugin-vue-router/commit/64ff5b6dd7fa619c6ef522aac6134efeaf739a33)), closes [#27](https://github.com/posva/unplugin-vue-router/issues/27)

### Features

- **types:** expose some useful route location types ([86b1d01](https://github.com/posva/unplugin-vue-router/commit/86b1d011ca0f44c73052a8ff8b9bd8a98f4cc6e9))
- **types:** typed useLink() ([55bf04e](https://github.com/posva/unplugin-vue-router/commit/55bf04ed8baab3fcaabfa007e3959a8e13283626))

## [0.0.17](https://github.com/posva/unplugin-vue-router/compare/v0.0.16...v0.0.17) (2022-07-06)

### Features

- expose auto imports array ([3e71a23](https://github.com/posva/unplugin-vue-router/commit/3e71a235306a0947bf0a5a0b5fade7c653c363ef)), closes [#24](https://github.com/posva/unplugin-vue-router/issues/24)

## [0.0.16](https://github.com/posva/unplugin-vue-router/compare/v0.0.15...v0.0.16) (2022-07-06)

### Bug Fixes

- handle parent params ([ef078b0](https://github.com/posva/unplugin-vue-router/commit/ef078b074f2a17b053aeb243f5f1b66d9ab0ea12)), closes [#20](https://github.com/posva/unplugin-vue-router/issues/20)

## [0.0.15](https://github.com/posva/unplugin-vue-router/compare/v0.0.14...v0.0.15) (2022-07-05)

### Bug Fixes

- generate meta field ([3bad90c](https://github.com/posva/unplugin-vue-router/commit/3bad90c19dfa31fd92ce401968b9b1777076536d)), closes [#21](https://github.com/posva/unplugin-vue-router/issues/21)

### Features

- expose createPrefixTree ([01fc3b3](https://github.com/posva/unplugin-vue-router/commit/01fc3b302ae0ae0ca74c3de507f34e7317b8d256))
- expose the context ([d8d1ea7](https://github.com/posva/unplugin-vue-router/commit/d8d1ea7de2a4cfd2f7d72c3b19a679730fe885c0))

## [0.0.14](https://github.com/posva/unplugin-vue-router/compare/v0.0.13...v0.0.14) (2022-07-05)

### Features

- handle updates of routes ([1a9a028](https://github.com/posva/unplugin-vue-router/commit/1a9a028a6043c44f6566bd2fcf5cfbaf859ec60d))

## [0.0.13](https://github.com/posva/unplugin-vue-router/compare/v0.0.12...v0.0.13) (2022-07-05)

### Bug Fixes

- **build:** externalize vue compiler ([7ef277b](https://github.com/posva/unplugin-vue-router/commit/7ef277be6c3943370537ffcc7d33b0e41c595913))
- use route block in nested routes ([bdf4170](https://github.com/posva/unplugin-vue-router/commit/bdf4170f184045a2d8ee68e7a440759f9c9b93a3)), closes [#17](https://github.com/posva/unplugin-vue-router/issues/17)

## [0.0.12](https://github.com/posva/unplugin-vue-router/compare/v0.0.11...v0.0.12) (2022-07-04)

### Bug Fixes

- **options:** make all options optional ([9a573dd](https://github.com/posva/unplugin-vue-router/commit/9a573ddf1cb57580257654e26db91e2751ee5820)), closes [#13](https://github.com/posva/unplugin-vue-router/issues/13)

### Features

- supports esbuild ([#11](https://github.com/posva/unplugin-vue-router/issues/11)) ([17196c7](https://github.com/posva/unplugin-vue-router/commit/17196c776c059ea373e563e07172604fb12a6043))

## [0.0.11](https://github.com/posva/unplugin-vue-router/compare/v0.10.0...v0.0.11) (2022-07-04)

Adapt peer vue router per dep to `4.1.0`.

## [0.0.10](https://github.com/posva/unplugin-vue-router/compare/v0.0.6...v0.0.10) (2022-07-04)

### Features

- add route json schema ([c5480e1](https://github.com/posva/unplugin-vue-router/commit/c5480e12725b9f7abbdf41322586c3e7b1d927a1))
- parse route custom block ([963d1ca](https://github.com/posva/unplugin-vue-router/commit/963d1caf092c0147a9c0d5e5a2b19ca39583c95f))
- **vite:** reload when routes change ([0231679](https://github.com/posva/unplugin-vue-router/commit/0231679005b17d5dd3ad496a3c19f4722018948d))

## [0.0.9](https://github.com/posva/unplugin-vue-router/compare/v0.0.6...v0.0.9) (2022-07-01)

### Bug Fixes

- keep tree nodes until all children are removed ([e254d15](https://github.com/posva/unplugin-vue-router/commit/e254d15aa7143b5e4487b0f1c58c5dc80446489f))
- stable order of paths ([59d743a](https://github.com/posva/unplugin-vue-router/commit/59d743a6c156a97e59d2848f791f69db6636f640))

## [0.0.8](https://github.com/posva/unplugin-vue-router/compare/v0.0.6...v0.0.8) (2022-06-29)

### Bug Fixes

- correctly extendRoutes ([e8d22a2](https://github.com/posva/unplugin-vue-router/commit/e8d22a2d077063e747816882188c29891f009612))
- handle static unnested paths ([56b73d7](https://github.com/posva/unplugin-vue-router/commit/56b73d720388c2b043ace8dcbcb14183e1860bbb))
- stable order of paths ([59d743a](https://github.com/posva/unplugin-vue-router/commit/59d743a6c156a97e59d2848f791f69db6636f640))

## [0.0.7](https://github.com/posva/unplugin-vue-router/compare/v0.0.6...v0.0.7) (2022-06-28)

### Bug Fixes

- stable order of paths ([59d743a](https://github.com/posva/unplugin-vue-router/commit/59d743a6c156a97e59d2848f791f69db6636f640))

### Features

- allow extending routes with extendRoutes ([da4db97](https://github.com/posva/unplugin-vue-router/commit/da4db971dc48f77a2b00d364e4940e1c2d849d94))
- keep one component if possible ([efe20e2](https://github.com/posva/unplugin-vue-router/commit/efe20e2e7a89e2b339dc66840d165463d93ac4ba))
- named view support ([#6](https://github.com/posva/unplugin-vue-router/issues/6)) ([a46dcd2](https://github.com/posva/unplugin-vue-router/commit/a46dcd24396962cf0519b05d53de75cc8511acdf))

## [0.0.6](https://github.com/posva/unplugin-vue-router/compare/v0.0.5...v0.0.6) (2022-06-27)

- small fixes

## [0.0.5](https://github.com/posva/unplugin-vue-router/compare/v0.0.4...v0.0.5) (2022-06-27)

### Features

- handle unnested routes ([f52304d](https://github.com/posva/unplugin-vue-router/commit/f52304db2a4507778ef54c12a9e6dc2ccca42401))

## [0.0.4](https://github.com/posva/unplugin-vue-router/compare/v0.0.3...v0.0.4) (2022-06-24)

### Bug Fixes

- use virtual modules for [@vue-router](https://github.com/vue-router) ([74cb353](https://github.com/posva/unplugin-vue-router/commit/74cb353e3643ddb0602449f171f2a5663c16db21))

## [0.0.3](https://github.com/posva/unplugin-vue-router/compare/v0.0.2...v0.0.3) (2022-06-24)

### Bug Fixes

- correct module id ([eb4ee83](https://github.com/posva/unplugin-vue-router/commit/eb4ee83f48dfeb1b35c2f09c696cdf3e742bc4d1))

## [0.0.1](https://github.com/posva/unplugin-vue-router/compare/v0.0.0-beta.0...v0.0.1) (2022-06-24)

### Features

- setup chokidar watcher ([15f217f](https://github.com/posva/unplugin-vue-router/commit/15f217f54cab637ae1cf646c1c7cef0ffb9529cd))
