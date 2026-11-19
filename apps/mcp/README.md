# Tasenor MCP

An [MCP](https://modelcontextprotocol.io) server that gives AI assistants (Claude Code, Claude Desktop,
Open WebUI, anything that speaks MCP) **read-only** access to Tasenor Bookkeeper.

It is a client of the Bookkeeper REST API and never touches a database itself. Every call carries
the user's own token, so database access, plugin subscriptions and period locks are enforced
exactly as they are for the UI: the assistant can see what that user can see and nothing more.

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

All amounts going out are euros with two decimals (the API itself works in cents).
Account filters: digits are a number prefix (`"4"` is every expense account), anything else is
part of the account name.

## Configuration

Environment variables:

* `TASENOR_API` API base URL, default `http://localhost:7205`.
* `TASENOR_REFRESH_TOKEN` a long-lived bookkeeping refresh token for one user, or
* `TASENOR_USERNAME` and `TASENOR_PASSWORD` that user's login.

A refresh token is the better choice: no password in the client's config, and it is revocable by
rotating the site `SECRET`. Make one in `apps/cli` with the site's `SECRET` (see
`tasenor-devops/README.md`):

```sh
bin/token-sign.mjs --years=1 refresh user@example.com bookkeeping
```

## Usage

Claude Code:

```sh
claude mcp add tasenor --env TASENOR_API=http://localhost:7205 --env TASENOR_REFRESH_TOKEN=... \
  -- /path/to/tasenor-bookkeeper/apps/mcp/bin/tasenor-mcp
```

Any other stdio client: run `bin/tasenor-mcp` with the environment above.

## Development

```sh
pnpm test         # unit tests of the formatting layer
pnpm run lint
pnpm run build-test
pnpm start        # run over stdio
```

The server is stdio only for now. Remote use (Streamable HTTP behind the site proxy, which needs
OAuth) and write tools (which need a draft state for documents first) are not implemented yet.
