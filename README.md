# Spotlight

Spotlight is an internal recognition tool that helps teams celebrate and appreciate their coworkers. Employees can post commendations, give shout-outs, and recognize great work — making achievements visible across the organization.

- **Recognitions** — a message with an optional image, GIF, or video attachment
- **Likes** — like/unlike a post, with per-post counts
- **Feeds** — list everything, or filter posts by author
- **Users** — employee records with active/inactive status
- **Auth** — email/password login with JWT access tokens and rotating refresh tokens

## Tech Stack

**Backend (`api/`)** — Bun, NestJS 12 (Fastify), MikroORM 7, PostgreSQL, Passport/JWT + bcrypt, Scalar API docs, Vitest, oxlint + Prettier

**Frontend (`web/`)** — React 19, TanStack Start/Router/Query, Mantine 9, Tailwind CSS 4, Tiptap, Vite 8, Biome

**Tooling** — Bun, Docker Compose (`compose.dev.yaml`), Bruno collections in `collections/`

## Getting Started

With Docker (API + web + PostgreSQL):

```bash
docker compose -f compose.dev.yaml up
```

- API: http://localhost:3000/api/v1
- Docs: http://localhost:3000/docs
- OpenAPI schema: http://localhost:3000/openapi.json

## Project Structure

```
api/           NestJS backend (auth, posts, users, health)
web/           TanStack Start frontend
collections/   Bruno API requests
compose.dev.yaml
```

## Useful Stuff

### DB drop and recreate with seed

```bash
# seed the database with the default database seeder
bun mikro-orm schema:fresh --run --seed
```

### The everyday command is `up --force-recreate`

```bash
docker compose -f compose.dev.yaml up --force-recreate
```

## License

Copyright (C) 2026 Marjose Darang

Spotlight is free software licensed under the **GNU Affero General Public License,
version 3 only** (SPDX: `AGPL-3.0`). You may redistribute and/or modify it
under the terms of that license. See [LICENSE](LICENSE) for the full text.

This program is distributed in the hope that it will be useful, but **without any
warranty**; without even the implied warranty of merchantability or fitness for a
particular purpose.

### Network use (AGPL Section 13)

Spotlight is a network-accessible application. If you run a modified version of it
and let other users interact with it over a network, AGPL Section 13 requires that
you prominently offer those users an opportunity to receive the Corresponding
Source of your modified version. The web interface ships with a **Source** link in
its footer to satisfy this requirement — point it at the repository or archive
that serves your running code.

### Third-party components

Bundled third-party dependencies remain under their own licenses (predominantly
MIT, ISC, BSD, and Apache-2.0), which are compatible with the AGPLv3. Their terms
are not overridden by this project's license.
