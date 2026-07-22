# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is
A single **static website** (`internetmatt.github.io`) built with **Astro** (`output: 'static'`).
There is no backend/database — everything is a static build served locally by Astro's dev/preview server on port `4321`.

### Node / package manager
- Uses **npm** with a committed `package-lock.json`. Install with `npm ci`.
- CI uses Node 20; Node 22 (the VM default) also works with Astro 5. No `.nvmrc` is pinned.

### Commands (defined in `package.json`)
- Dev server: `npm run dev` (Astro dev server, `http://localhost:4321`).
- Lint / type + diagnostics check: `npm run check` (runs `astro check`).
- Build: `npm run build` (static output to `dist/`).
- Preview built site: `npm run preview -- --port 4321`.
- E2E tests: `npm test` (Playwright; its `webServer` auto-runs `npm run preview` on port 4321).
- Lighthouse audit: `npm run lhci`.

### Non-obvious caveats
- **Playwright browsers are a separate download.** Before `npm test`, run `npx playwright install --with-deps chromium` (matches `.github/workflows/ci.yml`). Playwright's `webServer` builds/serves the site itself, so run `npm run build` (or let CI's order stand) before relying on preview content.
- **Egress is restricted in Cursor Cloud.** `registry.npmjs.org` is required for `npm ci` and is NOT allowlisted by default — dependency installs fail with `ECONNRESET` / connection reset until it is added to the network allowlist. Playwright browser binaries additionally require `cdn.playwright.dev`. Add these domains via the cloud agent Network Access settings if installs/tests fail.
