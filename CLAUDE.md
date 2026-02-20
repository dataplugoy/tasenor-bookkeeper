# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tasenor Bookkeeper is a full-stack accounting/bookkeeping application with a plugin architecture. It is a **pnpm monorepo** managed by **Turborepo**.

## Build & Development Commands

### Monorepo-wide (via Turborepo)

- `turbo build` — Build all packages
- `turbo dev --concurrency 14` — Start full local dev environment (UI + API + plugin server)
- `turbo lint` — Lint all packages
- `turbo fix` — Auto-fix lint issues
- `turbo test` — Run all Jest tests
- `turbo ci` — Lint + build + test

### Running a single package's tests

```sh
cd packages/tasenor-common && pnpm test          # Jest tests for common
cd unit-tests && pnpm test                        # Jest tests for testing utils
cd packages/tasenor-common-node && pnpm test      # Jest tests for common-node
```

Jest watches for changes: `pnpm run watch` (inside a package with tests)

### Running a single test file

```sh
cd packages/tasenor-common && npx jest tests/Rules.spec.ts
```

### Linting a single package

```sh
cd apps/bookkeeper && pnpm run lint
cd apps/bookkeeper-api && pnpm run lint
```

### Cypress E2E tests

From `e2e/`:
- `pnpm run cypress:open` — Opens Cypress against local dev servers
- `pnpm run cypress:docker` — Opens Cypress against Docker services
- `pnpm run cypress` — Headless run against localhost
- `pnpm run cypress:nightly` — Headless run with nightly-only plugins

Run a single spec:
```sh
cd e2e && CYPRESS_URL=http://localhost:7204 CYPRESS_API_URL=http://localhost:7205 npx cypress run --spec "cypress/e2e/1010-create-admin.cy.ts"
```

Tests use `Cypress.expose()` for public config (not `Cypress.env()`) and must run in numerical order since later tests depend on state created by earlier ones.

### Database

```sh
docker compose up tasenor-db        # Start PostgreSQL
cd databases/bookkeeper && pnpm run load   # Load sample data
cd apps/bookkeeper-api && pnpm run migrate    # Run migrations
cd apps/bookkeeper-api && pnpm run rollback   # Rollback last migration
```

## Architecture

### Workspace Structure

- **`apps/bookkeeper/`** — React 17 + Vite frontend. MobX for state, MUI 5 for components, React Router 6 for routing. Plugin management is embedded in the Vite dev server.
- **`apps/bookkeeper-api/`** — Express.js REST API. Knex for PostgreSQL queries and migrations. JWT auth. Routes in `src/routes/`, business logic in `src/lib/`.
- **`apps/cli/`** — Command-line utilities for API access.
- **`apps/docs/`** — Docusaurus documentation site.
- **`packages/tasenor-common/`** — Shared types and utilities (browser + Node). Published as `@tasenor/common`.
- **`packages/tasenor-common-node/`** — Node-specific libraries. Published as `@tasenor/common-node`.
- **`packages/tasenor-common-ui/`** — Shared React components. Published as `@tasenor/common-ui`.
- **`packages/tasenor-common-plugins/`** — Built-in plugin collection (importers, reports, company types).
- **`unit-tests/`** — Unit tests and testing utilities.
- **`packages/tasenor-config/`** — Shared Jest and TypeScript configs.
- **`databases/bookkeeper/`** — Docker PostgreSQL setup and sample data.

### Plugin System

Plugins extend both UI and backend. They cover importers (bank/crypto), reports (balance sheet, income statement), company types, and utilities. Plugins are loaded from the filesystem (`packages/tasenor-common-plugins/`) or npm. The plugin server runs alongside the UI dev server.

### Database Architecture

- **Master database** — Users, authentication, plugin registry. Migrations in `apps/bookkeeper-api/src/migrations-master/`.
- **Per-company databases** — Each bookkeeping company gets its own database. Migrations in `apps/bookkeeper-api/src/migrations-bookkeeping/`.
- Query builder: Knex (not an ORM).

### Type System

Heavy use of TypeScript with opaque types via `ts-opaque` (e.g., `AccountNumber`, `DatabaseName`). Shared type definitions live in `packages/tasenor-common/src/types/`.

## Code Style

- **No semicolons** — enforced by ESLint (`"semi": [2, "never"]`)
- ESLint extends `semistandard` + `@typescript-eslint/recommended`
- Test files: `*.spec.ts` or `*.test.ts` in `tests/` or `src/` directories
- Workspace dependencies use `workspace:*` protocol in package.json

## Development Ports

| Service         | Port |
|-----------------|------|
| PostgreSQL      | 7202 |
| Bookkeeper UI   | 7204 |
| Bookkeeper API  | 7205 |
| Documentation   | 7207 |
