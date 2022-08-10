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
