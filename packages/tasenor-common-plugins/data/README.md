## Builders

This directory contains scripts to rebuild plugins using some source
data. Typically source file is TSV-file created with Google Sheet.

Store the latest file version(s) to `data/src` and run `data/<PluginCode>.mjs` script.

To generate all, you can run `pnpm build-data` on the top level of the repo.
