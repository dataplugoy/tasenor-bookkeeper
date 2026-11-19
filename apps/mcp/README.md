# Tasenor MCP

An [MCP](https://modelcontextprotocol.io) server that gives AI assistants (Claude Code, Claude
Desktop, claude.ai connectors, Open WebUI, anything that speaks MCP) access to Tasenor Bookkeeper:
reading the books, and proposing new documents as **drafts** that a person confirms in
Bookkeeper.

It is a client of the Bookkeeper REST API and never touches a database itself. Every call carries
the user's own token, so database access, plugin subscriptions and period locks are enforced
exactly as they are for the UI: the assistant can see what that user can see and nothing more.

It runs two ways:

* **stdio** (`bin/tasenor-mcp`): one user, on their own machine, configured with a token.
* **Streamable HTTP with OAuth** (`src/http.ts`, the Docker image): a public server many users log
  in to from their own assistants.

## Tools

| Tool | What it answers |
|---|---|
| `list_databases` | Which companies can I see? |
| `list_periods` | Fiscal years of a company, and which are locked. |
| `list_accounts` | Chart of accounts, optionally filtered by number prefix or name. |
| `get_balances` | Closing balance of every account in use in a period. |
| `get_report` | Income statement, balance sheet, journal, ledger... optionally up to a quarter or month end. |
| `get_account_ledger` | Every transaction on one account, with running balance. |
| `search_entries` | Entries by text, account, dates and amount, with debit/credit/net totals. |
| `get_document` | One document with its entries, by id or by period and number. |
| `create_draft` | Propose a balanced document. It is not booked. |
| `list_drafts` | Drafts waiting for a person. |
| `delete_draft` | Withdraw a draft. |

There is deliberately **no confirm tool**. A draft is booked only when a person presses Confirm
on the Transactions page of the period, where pending drafts are listed at the top; confirming
gives it the next document number and records in `document.data.draft` who proposed and who
confirmed it. Drafts live in their own table, so no report or balance includes one.
Set `TASENOR_MCP_READ_ONLY` to leave the three draft tools out altogether.

All amounts going out are euros with two decimals (the API itself works in cents); `create_draft`
takes euros too. Account filters: digits are a number prefix (`"4"` is every expense account),
anything else is part of the account name.

## stdio

Environment:

* `TASENOR_API` API base URL, default `http://localhost:7205`.
* `TASENOR_REFRESH_TOKEN` a long-lived bookkeeping refresh token for one user, or
* `TASENOR_USERNAME` and `TASENOR_PASSWORD` that user's login.
* `TASENOR_MCP_READ_ONLY` set to anything for read-only tools.

A refresh token keeps the password out of the client's config. Make one in `apps/cli` with the
site's `SECRET` (see `tasenor-devops/README.md`):

```sh
bin/token-sign.mjs --years=1 refresh user@example.com bookkeeping
```

Claude Code:

```sh
claude mcp add tasenor --env TASENOR_API=https://bookkeeper-api.example.com --env TASENOR_REFRESH_TOKEN=... \
  -- /path/to/tasenor-bookkeeper/apps/mcp/bin/tasenor-mcp
```

## Remote server (HTTP + OAuth)

The server is its own OAuth 2.1 authorization server, as the MCP specification expects:
dynamic client registration, authorization code with PKCE, refresh tokens. A client is given only
the server's URL (`https://<host>/mcp`) and finds everything else from the metadata.

1. The client registers itself (`/register`) and sends the user to `/authorize`.
2. The user sees a login page naming the client and where it will return, and logs in with their
   Bookkeeper email and password, or presses Deny.
3. The password is checked by the API's `POST /auth/connector`, which returns a long-lived
   bookkeeping refresh token (`CONNECTOR_TOKEN_DAYS` on the API, default 30).
4. The client exchanges a one-time code for an access token (1 hour) and a refresh token (as long
   as the Bookkeeper token inside it). After that, the user logs in again.

Tokens are AES-256-GCM sealed payloads carrying the user's Bookkeeper token, bound to the client
and to this server's `/mcp` URL. Nothing about sessions is stored: restarts log nobody out, and
the only state is the registered clients in `$MCP_DATA_DIR/clients.json`. The flip side is that a
single token cannot be revoked; a disabled user is refused by Bookkeeper within the hour, and
changing `MCP_SECRET` logs everyone out at once. Logins are rate limited to 20 per 15 minutes
per IP and 5 failed attempts per login page.

Environment:

* `MCP_PUBLIC_URL` the public base URL, e.g. `https://mcp.example.com`. OAuth metadata lives at
  the root of it, so give the server **a host of its own**, not a path under another site.
  Must be `https` except for `localhost`.
* `MCP_SECRET` at least 32 random characters, e.g. `openssl rand -base64 48`.
* `MCP_DATA_DIR` where registered clients are kept, default `./data` (`/var/app/data`, a volume,
  in the image).
* `TASENOR_API` the API as seen from this server, e.g. `http://tasenor-bookkeeper-api:7205`.
* `PORT` default 7206; `TASENOR_MCP_READ_ONLY` as above.

With the nginx-proxy of a Tasenor site, the service needs `VIRTUAL_HOST`, `VIRTUAL_PORT: 7206`
and `LETSENCRYPT_HOST` like the others, and a DNS name. `docker-compose-common.yml` has a
`tasenor-mcp` service for building and trying the image locally.

## Development

```sh
pnpm test         # unit tests of the formatting layer
pnpm run lint
pnpm run build-test
pnpm start        # stdio
MCP_PUBLIC_URL=http://localhost:7206 MCP_SECRET=$(openssl rand -base64 48) pnpm run start-http
```
