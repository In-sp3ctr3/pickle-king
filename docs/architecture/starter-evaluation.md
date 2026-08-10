# Starter Evaluation

Starter: Vinext application starter
Decision: adopt selectively

## Keep

- React 19, TypeScript strict mode, App Router-compatible shell
- Vinext/Vite build integration and Sites worker
- Tailwind PostCSS setup and the required npm lockfile
- Rendered-HTML smoke-test pattern

## Replace

- Generic landing page, starter imagery, skeleton preview, and styles
- Generic package name and metadata

## Remove

- D1/Drizzle schema, examples, database dependency, and generation config
- unused authentication example

## Risk checks

- Run `vinext check` before feature work and release.
- Avoid unsupported Next server APIs.
- Confirm `dist/client` before post-build service-worker injection.
- Pin the lockfile and let Dependabot propose deliberate updates.
