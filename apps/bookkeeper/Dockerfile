# Build context is the repository root (see docker-compose-common.yml).
# The whole monorepo is built from source; no @tasenor/* packages are pulled from npm.
FROM node:18-alpine

WORKDIR /var/app

RUN apk update && apk upgrade
RUN apk add nano curl bash jq python3 make gcc g++ libc-dev
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Use the pnpm version pinned in the root package.json (packageManager field).
RUN corepack enable

# Copy the whole workspace from source. .dockerignore trims node_modules/dist/.git.
COPY . .

# Install the full workspace. @tasenor/* (and the bundled plugins) resolve to
# packages/* source, so the Vite build below compiles everything from the repo.
RUN pnpm install --frozen-lockfile

RUN cp apps/bookkeeper/.env.docker apps/bookkeeper/.env.local

WORKDIR /var/app/apps/bookkeeper

CMD ["pnpm", "run", "docker"]
