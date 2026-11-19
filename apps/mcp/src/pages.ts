/**
 * The HTML pages of the OAuth login. Self-contained: no scripts, no external resources.
 */

function escape (value: string): string {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

const STYLE = `
body { font-family: system-ui, sans-serif; background: #f4f5f7; color: #222; margin: 0; }
main { max-width: 26rem; margin: 8vh auto; background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
h1 { font-size: 1.3rem; margin: 0 0 1rem; }
p { line-height: 1.45; }
label { display: block; margin: 1rem 0 .3rem; font-weight: 600; }
input[type=email], input[type=password] { width: 100%; box-sizing: border-box; padding: .6rem; font-size: 1rem; border: 1px solid #bbb; border-radius: 4px; }
.buttons { display: flex; flex-direction: row-reverse; gap: .5rem; margin-top: 1.5rem; }
button { flex: 1; padding: .7rem; font-size: 1rem; border-radius: 4px; border: 1px solid #1b5e9e; cursor: pointer; }
button.allow { background: #1b5e9e; color: #fff; }
button.deny { background: #fff; color: #1b5e9e; }
.error { background: #fdecea; color: #8a1c13; padding: .6rem; border-radius: 4px; }
.small { font-size: .85rem; color: #555; }
`

function page (title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title><style>${STYLE}</style></head>
<body><main>${body}</main></body></html>`
}

export interface LoginPageOptions {
  request: string
  clientName: string
  redirectHost: string
  error?: string
  user?: string
}

export function loginPage (o: LoginPageOptions): string {
  return page('Tasenor login', `
<h1>Connect to Tasenor Bookkeeper</h1>
<p><strong>${escape(o.clientName)}</strong> (returning to <strong>${escape(o.redirectHost)}</strong>) asks to use your bookkeeping.</p>
<p class="small">It will be able to read every company you have access to and propose new documents as drafts.
Drafts are booked only when you confirm them in Bookkeeper.</p>
${o.error ? `<p class="error">${escape(o.error)}</p>` : ''}
<form method="post" action="login">
<input type="hidden" name="request" value="${escape(o.request)}">
<label for="user">Email</label>
<input id="user" name="user" type="email" autocomplete="username" value="${escape(o.user || '')}" required autofocus>
<label for="password">Password</label>
<input id="password" name="password" type="password" autocomplete="current-password" required>
<div class="buttons">
<!-- Allow comes first so that Enter submits it; row-reverse puts it on the right. -->
<button class="allow" type="submit" name="action" value="allow">Allow</button>
<button class="deny" type="submit" name="action" value="deny" formnovalidate>Deny</button>
</div>
</form>`)
}

export function messagePage (message: string): string {
  return page('Tasenor', `<h1>Tasenor Bookkeeper</h1><p>${escape(message)}</p>`)
}
