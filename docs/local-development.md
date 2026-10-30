# Local development and browser verification

Run the usual command from any checkout:

```sh
npm run dev
```

Before Vite starts, `predev` prepares linked worktrees automatically. If the
worktree has no dependencies, it links the main checkout's `node_modules`. If it
has no local environment files, it links the main checkout's `.env`, after
checking that `DATABASE_URL` matches `DEV_DATABASE_URL` and differs from the
configured production target. Existing worktree dependencies and environment
files are preserved. Shared environment files are linked, never printed or
committed; edit the main file deliberately because changes affect linked worktrees.

For a fresh main checkout, install dependencies with `npm ci` and configure
`.env` from `.env.example`. Without credentials, guest pages still render, but
login and database-backed actions need a development database. Worktrees reuse
the development accounts; production-only accounts may not exist there.

The launcher defaults to http://localhost:3000 and selects the next free port
through 3099 when another checkout is running. It prints the URL before starting
Vite and sets the auth origin to that port before the server worker starts.
To choose a fixed port, use `PORT` or:

```sh
npm run dev -- --port 3100
```

The dev server sets its server-side auth origin and trusted loopback origins to
that port. An occupied explicitly chosen port causes a clear startup error.
Email/password login works on custom ports.
Google sign-in additionally requires the chosen
`http://localhost:PORT/api/auth/callback/google` URL to be registered with Google;
use port 3000 for the documented local OAuth setup, or register another callback.

## Saved development account

The shared, ignored `.env` stores a dedicated regular-member development account:

- `DEV_TEST_EMAIL`
- `DEV_TEST_PASSWORD`
- `DEV_TEST_USER_ID`

Agents can use these values for browser verification without requesting your
personal credentials. Keep the values out of tracked files, screenshots, logs,
and chat. The account exists on the development database only; do not use it to
sign in to production. Worktrees inheriting the main `.env` inherit access to
this account. A worktree with its own environment can configure its own account.

For an optional automated login check against a running local server:

```sh
npm run dev:verify-login -- http://localhost:3100
```

This signs in on desktop and mobile, opens the authenticated Oracle, verifies
session persistence after reload, and signs out. It preserves the saved account,
sends no email or Oracle message, and saves screenshots in
`tmp/verification/login/`. Google OAuth is a separate provider flow and is not
covered by this email/password check.

## Optional Oracle desktop and mobile checks

This page-specific smoke test is optional; it is not part of starting the dev
environment or logging in. With the dev server running, in another terminal:

```sh
npm run oracle:verify
# Or match a custom dev-server port:
npm run oracle:verify -- http://localhost:3100
```

The command uses an installed Chrome/Chromium executable. Set
`COMPOSITE_CHROME_PATH` if the browser is installed outside the usual locations.
It verifies standard and Entity views at desktop and phone sizes, draft
preservation, saved Entity preference, transparent composer wrappers, absence of
bubble canvases, and absence of uncaught browser errors. It exits nonzero on
failure. It accepts loopback servers only and closes its browser when finished.

Screenshots are saved under ignored `tmp/verification/oracle/`:

- `desktop-standard.png`
- `desktop-entity.png`
- `mobile-standard.png`
- `mobile-entity.png`

Inspect the screenshots after running the checks; assertions cannot assess every
visual detail. This smoke check does not verify authenticated history, model
responses, or a real phone's on-screen keyboard.

## Worktrees with shared dependencies

A worktree may reuse a matching `node_modules` installation through a directory
symlink. Keep generated output local to each checkout:

- Nitro generates server entry points in `.nitro/`. Its relative imports break
  if generated beneath a symlinked `node_modules/.nitro/` directory.
- Vite's dependency cache is in `tmp/vite/`.
- TypeScript's incremental cache is in `tmp/tsc/`.

Server dependencies use Vite's default externalization. Forcing all dependencies
through the ES module runner breaks CommonJS packages such as `@vercel/oidc`.

`npm run dev` uses Vite's runner config loader automatically. This avoids writing
temporary config files under a shared `node_modules/.vite-temp/`, so new chats
and linked worktrees use the same startup command. Tests can opt into it too:

```sh
npm run test:scripts -- --configLoader runner
npx vitest run src/components/ai/AIChatPanel.test.tsx --configLoader runner
```

The server and headless browser also need permission to listen/connect on
loopback and launch a browser in restricted environments.
