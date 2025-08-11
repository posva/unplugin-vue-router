# unplugin-vue-router
File-based routing plugin for Vue Router with TypeScript support. A build-time plugin that simplifies routing setup by automatically generating routes from your file structure.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively
- Install dependencies and build the repository:
  - `npm install -g pnpm` -- Install pnpm if not available (required package manager)
  - `pnpm install --frozen-lockfile` -- takes 3 minutes. NEVER CANCEL. Set timeout to 5+ minutes.
  - `pnpm run build` -- takes 7 seconds. Build both core and runtime using tsdown.
- `pnpm run vitest --coverage run` -- takes 9 seconds. Run all tests with coverage.
- `pnpm run lint` -- takes 3 seconds. Run Prettier formatting checks.
- Run the playground (main validation method):
  - `pnpm run play` -- Start development server at http://localhost:5173
  - `pnpm run play:build` -- takes 4 seconds. Build playground for production.
- Build documentation:
  - `pnpm run docs:build` -- takes 33 seconds. NEVER CANCEL. Set timeout to 60+ minutes.
  - `pnpm run docs` -- Start VitePress dev server for documentation.

## Validation
- Always run `pnpm run play` and test the playground after making changes. The playground demonstrates file-based routing functionality with example routes.
- ALWAYS run through complete test scenarios in the playground by:
  1. Navigate to different routes (e.g., /users/123, /about, /nested/routes)
  2. Test dynamic routes with parameters
  3. Verify TypeScript route completions work in IDE
  4. Check that new routes appear automatically from file structure
- The playground includes comprehensive examples in `playground/src/pages/` including:
  - Dynamic routes: `[id].vue`, `[...path].vue`
  - Nested routes in folders
  - Layout routes with parentheses: `(group).vue`
  - Custom route definitions with `<route>` blocks
- Always run `pnpm run lint` and fix any formatting issues before committing.
- Run the full test suite `pnpm run test` for complete validation (includes build + test + docs).

## Common Tasks

### Build Commands
- `pnpm run build:core` -- Build main library (tsdown)
- `pnpm run build:runtime` -- Build runtime components (data loaders, volar plugins)
- Build outputs to `dist/` folder with CommonJS and ESM formats

### Test Commands  
- `pnpm run vitest` -- Run tests in watch mode with UI
- `pnpm run dev` -- Alias for vitest UI mode
- Tests include unit tests (*.spec.ts) and type tests (*.test-d.ts)

### Repository Structure
```
src/
├── core/           # Main routing logic (tree building, route generation)
├── codegen/        # Code generation for routes and types
├── data-loaders/   # Data loading functionality (experimental)
├── volar/          # Vue language server integrations  
├── utils/          # Shared utilities
├── index.ts        # Main entry point
├── runtime.ts      # Runtime exports
├── vite.ts         # Vite plugin entry
├── webpack.ts      # Webpack plugin entry
├── rollup.ts       # Rollup plugin entry
└── esbuild.ts      # esbuild plugin entry

playground/         # Development playground with example routes
docs/              # VitePress documentation
examples/          # Example projects (Nuxt integration)
e2e/              # End-to-end tests
tests/            # Test utilities and mocks
```

### Key Files to Check After Changes
- Always check `src/core/tree.ts` after modifying route tree logic
- Check `src/codegen/generateRouteRecords.ts` after changing route generation
- Test playground at `playground/src/pages/` for route behavior changes
- Update route schema `route.schema.json` if adding new route options

### Package Manager
- Uses **pnpm** (version 10.14.0+) - NOT npm or yarn
- Workspace setup with playground and examples as separate packages
- Lockfile: `pnpm-lock.yaml` (commit changes to this file)

### TypeScript Configuration
- Main config: `tsconfig.json`
- Build uses `tsdown` (not tsc) for better performance
- Path aliases configured for internal module resolution
- Vue compiler options included for SFC support

### CI Requirements
The GitHub Actions workflow will fail if:
- Prettier formatting is incorrect (`pnpm run lint`)
- Build fails (`pnpm run build`) 
- Tests fail (`pnpm run vitest`)
- Playground build fails (`pnpm run -C playground build`)
- Documentation build fails (`pnpm run docs:build`)

## Important Notes
- **NEVER CANCEL** any build or test command - they may take several minutes but should complete
- The playground is your primary validation tool - always test changes there
- Warning about "Language ts for &lt;route&gt; is not supported" is expected and harmless
- Routes are generated automatically from file structure in pages directories
- TypeScript definitions are generated at build time
- Data loaders feature is experimental and subject to change
- Always use the exact timeout values provided to avoid premature cancellation

## Common Validation Scenarios
After making changes, validate by:
1. **Route Generation**: Add a new `.vue` file in `playground/src/pages/` and verify it appears in routing
2. **Dynamic Routes**: Test routes with parameters like `[id].vue` work correctly  
3. **TypeScript**: Check that route names and params have proper type completion
4. **Build**: Ensure `pnpm run build` succeeds and outputs to `dist/`
5. **Plugin Integration**: Test Vite plugin works in playground development mode