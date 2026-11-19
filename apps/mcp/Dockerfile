# Build context is the repository root (see docker-compose-common.yml).
# Runs the remote (Streamable HTTP + OAuth) MCP server; the stdio server needs no image.
# Node 20+ is required: the MCP SDK uses the global Web Crypto API, which Node 18 lacks.
FROM node:24-alpine

WORKDIR /var/app

RUN apk update && apk upgrade && apk add curl

# Use the pnpm version pinned in the root package.json (packageManager field).
RUN corepack enable

COPY . .

# Only this app and what it depends on.
RUN pnpm install --frozen-lockfile --filter @tasenor/mcp...

WORKDIR /var/app/apps/mcp

ENV PORT=7206
ENV MCP_DATA_DIR=/var/app/data
VOLUME /var/app/data
EXPOSE 7206

HEALTHCHECK --interval=30s --timeout=5s CMD curl -fsS http://localhost:${PORT}/health || exit 1

# Registered OAuth clients are the only state; tokens are sealed with MCP_SECRET.
CMD ["pnpm", "run", "start-http"]
