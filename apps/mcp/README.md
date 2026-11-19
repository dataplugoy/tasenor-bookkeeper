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

## Protocol

The remote server is an OAuth 2.1 authorization server and an MCP resource server on one host.
Below, `$BASE` is `MCP_PUBLIC_URL` (production: `https://mcp.tasenor.com`). The OAuth endpoints
come from the MCP SDK's `mcpAuthRouter` (SDK 1.32); `/login` and `/mcp` are ours.

### Endpoints

| Method and path | Purpose | Rate limit per IP |
|---|---|---|
| `GET /health` | `{"ok":true,"version":"1.17.30"}` | none |
| `GET /.well-known/oauth-protected-resource/mcp` | Protected resource metadata (RFC 9728) | none |
| `GET /.well-known/oauth-authorization-server` | Authorization server metadata (RFC 8414) | none |
| `POST /register` | Dynamic client registration (RFC 7591) | 20 / hour |
| `GET` or `POST /authorize` | Starts a login; answers with the login page | 100 / 15 min |
| `POST /login` | The login page's form | 20 / 15 min |
| `POST /token` | Code and refresh token exchange | 50 / 15 min |
| `POST /mcp` | MCP over Streamable HTTP, bearer token required | none |
| `GET`, `DELETE`, ... `/mcp` | `405`, `Allow: POST` | none |

There is no `/revoke` endpoint, as tokens are stateless (see below).

### 1. Discovery

An unauthenticated `POST /mcp` answers:

```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error="invalid_token", error_description="Missing Authorization header",
  scope="bookkeeping", resource_metadata="$BASE/.well-known/oauth-protected-resource/mcp"
```

The resource metadata names the resource and its authorization server:

```json
{ "resource": "$BASE/mcp", "authorization_servers": ["$BASE/"],
  "scopes_supported": ["bookkeeping"], "resource_name": "Tasenor Bookkeeper" }
```

The authorization server metadata:

```json
{ "issuer": "$BASE/",
  "authorization_endpoint": "$BASE/authorize", "token_endpoint": "$BASE/token",
  "registration_endpoint": "$BASE/register",
  "response_types_supported": ["code"], "code_challenge_methods_supported": ["S256"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "none"],
  "scopes_supported": ["bookkeeping"] }
```

`bookkeeping` is the only scope, and every token gets it.

### 2. Registration

`POST /register` with a JSON client metadata document. `redirect_uris` is required, and
`client_name` is what the login page shows the user:

```json
{ "client_name": "Claude Code", "redirect_uris": ["http://localhost:59530/callback"],
  "token_endpoint_auth_method": "none" }
```

The answer is `201` with the metadata plus `client_id` (a UUID) and `client_id_issued_at`.
Clients registered with `token_endpoint_auth_method: "none"` are public clients and get no
secret. Any other method gets a `client_secret` that expires after 30 days
(`client_secret_expires_at`); after that the client has to register again. Clients are kept in
`$MCP_DATA_DIR/clients.json`, at most 1000, and the oldest are dropped first.

### 3. Authorization request

The browser is sent to `/authorize` with:

| Parameter | |
|---|---|
| `response_type` | `code` |
| `client_id` | from registration |
| `redirect_uri` | must match a registered one exactly, except that a loopback host (`localhost`, `127.0.0.1`, `[::1]`) may use any port (RFC 8252). It can be left out if only one is registered. |
| `code_challenge`, `code_challenge_method` | PKCE, required; `S256` only |
| `state` | optional, returned as is |
| `scope`, `resource` | optional and ignored: the scope is always `bookkeeping` and the resource always `$BASE/mcp` |

An unknown client or redirect URI is answered directly with `400` and a JSON error
(`invalid_client`, `invalid_request`), since there is nowhere safe to redirect. Any other invalid request is
redirected to `redirect_uri` with `error=...` and `state`, as OAuth requires.

On a valid request, the server stores the request in memory under a random 24-byte id for
**10 minutes** and answers `200` with the login page. The page names the client and the host of
the redirect URI, and is sent with:

```
Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline';
  form-action 'self' <redirect origin>; frame-ancestors 'none'
Cache-Control: no-store
```

The redirect origin has to be in `form-action`. Browsers apply that directive to the redirect
after a submit as well, and would otherwise stop right after a successful login. For a
custom-scheme redirect URI, only the scheme is allowed (e.g. `cursor:`).

### 4. Login

The page posts `application/x-www-form-urlencoded` to `POST /login`. The body is at most 10 kB
and has these fields:

* `request` is the stored id. Nothing else about the request is in the form, so there is nothing
  to tamper with.
* `user` and `password` are the Bookkeeper login.
* `action` is `allow` or `deny`.

The possible answers:

* An unknown or expired `request` gives `400` with "This login link has expired". That also
  happens on a second submit of a login that already succeeded.
* `action=deny` gives `302` to `redirect_uri?state=...&error=access_denied`.
* An empty email or password gives `401` with the page again.
* Otherwise the server calls the API: `POST $TASENOR_API/auth/connector` with
  `{"user","password"}`.
  * If the API fails (`401` means a wrong password), the answer is `401` with the page and the
    error. The fifth failure for one request ends it with "Too many failed attempts".
  * If the API succeeds, it returns `{"refresh": <JWT>, "expires": <unix seconds>}`. That is a
    Bookkeeper refresh token with audience `bookkeeping`, valid for `CONNECTOR_TOKEN_DAYS`
    (default 30) days. The answer is `302` to `redirect_uri?state=...&code=<code>`. The code is
    32 random bytes, single-use, and valid for **60 seconds**.

### 5. Token endpoint

`POST /token`, `application/x-www-form-urlencoded`, with `client_id`. A confidential client also
sends `client_secret`.

Authorization code:

```
grant_type=authorization_code&code=...&code_verifier=...&redirect_uri=...&client_id=...
```

The SDK checks the PKCE verifier against the stored challenge. The server then checks that the
code was issued to this client, has not expired, and that `redirect_uri`, if given, is the one
in the authorization request. The code is deleted on the first exchange attempt, whether it
succeeds or not.

Refresh:

```
grant_type=refresh_token&refresh_token=...&client_id=...
```

A refresh token is accepted only for the client it was issued to. Both grants answer:

```json
{ "access_token": "...", "token_type": "Bearer", "expires_in": 3600,
  "refresh_token": "...", "scope": "bookkeeping" }
```

* The **access token** lasts 1 hour, or less if the Bookkeeper token inside it expires sooner.
* The **refresh token** lasts as long as the Bookkeeper token inside it, 30 days from login.
* A refresh returns the **same** refresh token, not a new one. When it expires the answer is
  `invalid_grant` "Refresh token has expired. Log in again.", and the user logs in again from
  step 3.

Errors follow RFC 6749 with `400`: `invalid_grant`, `invalid_request`, and
`unsupported_grant_type`. A client authentication failure is `401 invalid_client`.

### Tokens

Access and refresh tokens are opaque to clients. Inside, each is a JSON payload sealed with
AES-256-GCM, encoded as base64url of `iv (12 bytes) | tag (16 bytes) | ciphertext`. The key is
`sha256("tasenor-mcp:" + MCP_SECRET)`. The payload:

| Field | |
|---|---|
| `t` | `"a"` access, `"r"` refresh: one cannot be used as the other |
| `cid` | client id the token was issued to |
| `owner` | the user's email |
| `bk` | the user's Bookkeeper refresh token |
| `exp` | expiry, unix seconds |
| `res` | `$BASE/mcp`: a token for another deployment is refused |

Any token that does not decrypt with the current secret is invalid, so changing `MCP_SECRET`
logs everyone out. No token is stored on the server, so a single token cannot be revoked. It
stops working at its own expiry, and a disabled Bookkeeper user is refused by the API at the
next access token refresh.

### 6. MCP requests

Every request is `POST /mcp` with these headers:

```
Authorization: Bearer <access token>
Content-Type: application/json
Accept: application/json, text/event-stream
```

The body is one JSON-RPC 2.0 message, at most 1 MB.

* A missing or invalid token is `401 invalid_token` with the `WWW-Authenticate` header above. An
  expired one is also `401`, which the client handles by refreshing.
* The wrong `Accept` header is `406`, and the wrong `Content-Type` is `415`.

The transport is **stateless**. The server issues no `Mcp-Session-Id`, keeps no sessions, and
builds a fresh MCP server for each request with the caller's token. Responses are plain JSON,
never SSE streams, and a notification (e.g. `notifications/initialized`) is answered `202` with
no body. `initialize` negotiates the protocol version as usual (SDK 1.32: up to `2025-11-25`).
Because nothing is kept between requests, any request may go to any instance, and a restart
interrupts nothing.

The server offers `tools` only, no resources or prompts: `tools/list` and `tools/call` with the
tools listed at the top of this file. Tool results are plain text. A failure is a normal result
with `isError: true` and a message the model can act on, for example the formats a report
supports.

Behind each call, the server works with the Bookkeeper API using the user's Bookkeeper refresh
token from the access token:

1. It gets a 30-minute API access token from `GET /auth/refresh`.
2. It caches that token per user, for up to 500 users.
3. On `401` or `403` it gets a new access token and retries once.

Drafts created from here carry `data.source = "mcp: <client_name>"`.

### Example

```sh
BASE=https://mcp.tasenor.com
CID=$(curl -s -X POST $BASE/register -H 'Content-Type: application/json' \
  -d '{"client_name":"curl","redirect_uris":["http://localhost:9999/cb"],"token_endpoint_auth_method":"none"}' | jq -r .client_id)
VERIFIER=$(openssl rand -base64 48 | tr -d '=+/' | cut -c1-64)
CHALLENGE=$(printf %s "$VERIFIER" | openssl dgst -sha256 -binary | base64 | tr '+/' '-_' | tr -d '=')
echo "$BASE/authorize?response_type=code&client_id=$CID&redirect_uri=http://localhost:9999/cb&code_challenge=$CHALLENGE&code_challenge_method=S256&state=x"
# Open that in a browser and log in; copy code=... from the (failing) redirect to localhost:9999.
TOKEN=$(curl -s $BASE/token -d grant_type=authorization_code -d client_id=$CID -d code=$CODE \
  -d code_verifier=$VERIFIER -d redirect_uri=http://localhost:9999/cb | jq -r .access_token)
curl -s $BASE/mcp -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_databases","arguments":{}}}'
```

## Development

```sh
pnpm test         # unit tests of the formatting layer
pnpm run lint
pnpm run build-test
pnpm start        # stdio
MCP_PUBLIC_URL=http://localhost:7206 MCP_SECRET=$(openssl rand -base64 48) pnpm run start-http
```
