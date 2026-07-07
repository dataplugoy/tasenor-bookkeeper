# Build context is the repository root (see docker-compose-common.yml).
# Docs are built from the local monorepo source (the typedoc API reference needs the
# packages' source) instead of cloning the repository from GitHub.
FROM node:18-alpine

WORKDIR /var/app

RUN apk update && apk upgrade
RUN apk add nano curl bash jq git

# Use the pnpm version pinned in the root package.json (packageManager field).
RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile

WORKDIR /var/app/apps/docs

CMD ["pnpm", "run", "docker"]
