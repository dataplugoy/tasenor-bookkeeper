# Tasenor CLI

This is a command-line tool collection.

## General

* `tasenor.mjs` An all purpose script to automate tasks over API with this command-line tool.

## Development

* `plugins.mjs` A plugin tool to for example increase plugin versions or register them to other service.
* `token-sign.mjs` A token signing tool.
* `token-show.mjs` A token display tool.

## Data Management

* `change-db-host.mjs` Convert tasenor.sql file to different server.
* `dump-tasenor.mjs` Create tar-package of bookkeeper customer database.

## Maintenance

* `docker-volume` A tool for backing up and viewing of docker volumes.
* `customer-dbs.mjs` Listing of customer databases with credentials for easy DB cli access.

## CI

* `dump-cache` Print a SQL-script providing all cached service data from a Bookkeeper database.
* `restor-cache` Restore cache from SQL file.
