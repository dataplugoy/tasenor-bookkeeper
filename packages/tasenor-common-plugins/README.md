# Tasenor Common Plugins

This is a collection of commonly used plugins for Tasenor Bookkeeper.

## Source data

Original data for many tables are stored in Google Sheets. If you want an access, please email the
package author (see `package.json`). From the Google Sheets data is downloaded as `.tsv` file and
stored under `./data/src`. Then corresponding script under `./data`can be ran to generate the latest
data in plugins and/or in some cases code definitions.

To regenerate all data, you can run
```
pnpm run tsv
```
