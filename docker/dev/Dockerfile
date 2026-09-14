# Shared development image for the Spotlight dev stack (see compose.dev.yaml).
#
# Only the Bun runtime and the workspace dependencies are baked in. Application
# source is bind-mounted at runtime, and each workspace's `node_modules` is a
# Docker named volume that Docker seeds from this image the first time it is
# used. Installing here, instead of on every container start, keeps
# `docker compose up` from contacting the package registry each time.
FROM oven/bun:1

WORKDIR /usr/src/spotlight

# API workspace. `bunfig.toml` is copied as well so its `[install]` settings
# (e.g. `ignoreScripts`) apply during the build exactly as they do at runtime.
COPY api/package.json api/bun.lock api/bunfig.toml ./api/
RUN bun install --cwd api

# Web workspace (this one has no `bunfig.toml`).
COPY web/package.json web/bun.lock ./web/
RUN bun install --cwd web

EXPOSE 3000
EXPOSE 5173
