# Spotlight Web

The frontend for [Spotlight](../README.md), an internal recognition tool for
celebrating coworkers. Routes render on the server first and then hydrate, so the
first paint is real HTML and navigation stays client-side after that.

- **Framework** — React 19 with TanStack Start (SSR) and TanStack Router (file-based routes)
- **Data** — TanStack Query, wired for SSR through `@tanstack/react-router-ssr-query`
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
| `API_INTERNAL_URL` | the server (SSR) and the dev proxy | `http://localhost:3000` | Where the API answers on the server's own network. Compose sets `http://spotlight-api:3000`. No `VITE_` prefix, so it never reaches the browser. |

Two origins are needed because the browser cannot resolve a Compose service name
and a container cannot use the host's `localhost`: server rendering calls the API
directly, while the browser calls the web origin and [`vite.config.ts`](./vite.config.ts)
proxies `/api` to the same target.

## Scripts

| Script | Runs |
| --- | --- |
| `bun run dev` | Vite dev server on port 5173 |
| `bun run build` | Production build into `dist/` (client and server bundles) |
| `bun run preview` | Serves the built output |
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
