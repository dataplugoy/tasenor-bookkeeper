# Build context is the repository root (see docker-compose-common.yml).
# The whole monorepo is built from source; no @tasenor/* packages are pulled from npm.
FROM node:18-alpine

WORKDIR /var/app

RUN apk update && apk upgrade
RUN apk add nano curl bash jq postgresql-client python3 make gcc g++ libc-dev
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Use the pnpm version pinned in the root package.json (packageManager field).
RUN corepack enable

# Copy the whole workspace from source. .dockerignore trims node_modules/dist/.git.
COPY . .

# Install the full workspace. @tasenor/* resolve to packages/* source (run via tsx),
# so no separate build step is required for the shared packages.
RUN pnpm install --frozen-lockfile

RUN cp apps/bookkeeper-api/.env.docker apps/bookkeeper-api/.env.local

WORKDIR /var/app/apps/bookkeeper-api

CMD ["pnpm", "run", "docker"]
