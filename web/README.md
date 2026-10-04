# Spotlight Web

The frontend for [Spotlight](../README.md), an internal recognition tool for
celebrating coworkers. The build is a client-rendered single-page app: the only
HTML shipped up front is TanStack Start's prerendered **shell**, and every route
renders in the browser after the bundle loads.

- **Framework** — React 19 with TanStack Start in SPA mode and TanStack Router (file-based routes)
- **Data** — TanStack Query, wired through `@tanstack/react-router-ssr-query`
- **UI** — Mantine 9 components, Tailwind CSS 4 for layout and design tokens
- **Validation** — Zod 4 schemas applied to forms with `mantine-form-zod-resolver`
- **Icons** — `lucide-react`, plus inline SVG brand marks for sign-in providers
- **Tooling** — Vite 8, Biome 2, Bun

## Getting Started

### With Docker (from the repository root)

```bash
docker compose -f compose.dev.yaml up
```

- Web: <http://localhost:5173>
- API: <http://localhost:3000/api/v1>, interactive docs at <http://localhost:3000/docs>

The `spotlight-web` service bind-mounts this directory and keeps `node_modules` in
a named volume. Its entry point re-runs `bun install` when the workspace manifest,
lockfile or Bun version changes, so routine `up` calls do not hit the registry.

### On the host

```bash
bun install
bun run dev
```

This serves <http://localhost:5173> and expects the API at
<http://localhost:3000>, the default the dev server proxies `/api` to.

## Environment

Both variables have working defaults, so a `.env` file is optional — see
[`.env.example`](./.env.example).

| Variable | Read by | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | the browser | empty | Absolute API origin. Empty means the app calls `/api/v1` on its own origin and lets the dev proxy (or a reverse proxy in production) forward it. Inlined into the client bundle, so it must be set before the server starts or the bundle is built. |
| `API_INTERNAL_URL` | the dev proxy and the shell prerender | `http://localhost:3000` | Where the API answers on the server's own network. Compose sets `http://spotlight-api:3000`. No `VITE_` prefix, so it never reaches the browser. |

Two origins are needed because the browser cannot resolve a Compose service name
and a container cannot use the host's `localhost`: the dev proxy forwards `/api`
to the internal target, while the browser calls the web origin. There is no
runtime server render to call the API for, so `API_INTERNAL_URL` reaches the
client bundle only as dead code.

## Client-side rendering

`spa.enabled` in [`vite.config.ts`](./vite.config.ts) turns the build into a SPA.
`bun run build` prerenders the root route once into `dist/client/_shell.html` —
the `<html>`/`<head>`/`<body>` bootstrap plus `LoadingScreen`. Matched routes are
not in that file; the browser renders them after the bundle loads.

The loading screen is the router's pending fallback, not a timed overlay.
[`src/router.tsx`](./src/router.tsx) sets `defaultPendingComponent: LoadingScreen`
at the router level, so the shell's empty slot *is* the loading screen: a visitor
paints it from static HTML before any JavaScript runs, and it stays until the
router resolves the first route. The same component covers a later navigation
whose route has not loaded yet, bounded by `defaultPendingMs` (how long a load may
run before the fallback appears) and `defaultPendingMinMs` (how long it stays once
shown, so the reveal animation is not cut off).

Because it is a fixed overlay at `z-index: 9999`, it also masks the frame between
hydrating the shell and the router rendering the real route.

Routes are client-only, so `/signin`'s loader, all API calls and every
`window`/`localStorage` read happen in the browser. That removes the hydration
class of bugs, at the cost of requiring JavaScript for any content at all.

Deploying the result means serving `dist/client/` as static files. Because
`_shell.html` is not named `index.html`, the host must rewrite unmatched paths —
including `/` — to it:

```
/*  /_shell.html  200
```

`bun run preview` is **not** a preview of this build: the Start plugin installs
its own SSR handler, so preview renders routes on a server. To check the SPA
locally, serve `dist/client/` from any static server configured with that
rewrite.

## Scripts

| Script | Runs |
| --- | --- |
| `bun run dev` | Vite dev server on port 5173, serving the SPA shell for every route |
| `bun run build` | Production build into `dist/` (static `dist/client`, plus `dist/server` used only to prerender the shell) |
| `bun run preview` | Serves the built output through the Start SSR handler |
| `bun run generate-routes` | Regenerates `src/routeTree.gen.ts` |
| `bun run check` | Biome lint and format check |
| `bun run lint` / `format` | Biome lint only / format only |

## License

Copyright (C) 2026 Marjose Darang

Spotlight Web is free software licensed under the **GNU Affero General Public
License, version 3 only** (SPDX: `AGPL-3.0`). You may redistribute and/or
modify it under the terms of that license. See [LICENSE](./LICENSE) for the full
text.

This program is distributed in the hope that it will be useful, but **without any
warranty**; without even the implied warranty of merchantability or fitness for a
particular purpose.

Spotlight Web is served to users over a network, so AGPL Section 13 applies: the
footer includes a **Source** link offering users the Corresponding Source of the
running version. Keep that link pointed at the code that is actually deployed.
