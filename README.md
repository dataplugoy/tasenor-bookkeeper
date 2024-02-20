# Tasenor Bookkeeper

This is a monorepo for developing Tasenor Bookkeeper.

## Content

### Applications

* [Bookkeeper Backend](./apps/bookkeeper-api/README.md) API for Bookkeeper.
* [Bookkeeper UI](./apps/bookkeeper/README.md) UI for Bookkeeper.
* [CLI](./apps/cli/README.md) Command-line API access.

### Demos

* [Bookkeeper Component Works](./examples/ui-playground/README.md) An example app to test and develop UI components.

### Databases

* [Databases](./databases/README.md) Development databases.

### Librariers

* [Tasenor Common](./packages/tasenor-common/README.md) Type defintions and tools for both browser and Node.
* [Tasenor Common UI](./packages/tasenor-common-ui/README.md) Shared components for browser.
* [Tasenor Common Node](./packages/tasenor-common-node/README.md) Node libraries for mainly server use.
* [Tasenor Testing](./packages/tasenor-testing/README.md) Testing helpers.

### Configurations

* [Tasenor Config](./packages/tasenot-config/README.md)

### Turbo Commands

* `turbo audit` Build all buildable packages.
* `turbo build` Build all buildable packages.
* `turbo demo` Launch local demo servers.
* `turbo dev` Launch local development environment.
* `turbo fix` Fix all fixable syntax checks.
* `turbo lint` Syntax check all.
* `turbo test` Run all tests.
* `turbo release` Increase patch level and publish all public NPM packages.
* `turbo show-version` List all versions from published packages.
