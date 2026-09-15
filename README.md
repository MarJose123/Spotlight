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
cp api/.env.example api/.env   # then set APP_KEY
docker compose -f compose.dev.yaml up
```

Locally:

```bash
bun install --cwd api && bun install --cwd web
bun run --cwd api start:dev    # API on :3000
bun run --cwd web dev          # web on :5173
```

- API: http://localhost:3000/api/v1
- Docs: http://localhost:3000/docs

## Project Structure

```
api/           NestJS backend (auth, posts, users, health)
web/           TanStack Start frontend
collections/   Bruno API requests
compose.dev.yaml
```

## License

[MIT](LICENSE) © Marjose Darang
