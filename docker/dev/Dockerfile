# SPDX-FileCopyrightText: 2026 Marjose Darang
# SPDX-License-Identifier: AGPL-3.0
#
# Part of Spotlight. Licensed under the GNU Affero General Public License,
# version 3 only. See the LICENSE file at the repository root for the full terms.
# Shared development image for the Spotlight dev stack (see compose.dev.yaml).
#
# Only the Bun runtime and the workspace dependencies are baked in. Application
# source is bind-mounted at runtime, and each workspace's `node_modules` is a
# Docker named volume that Docker seeds from this image the first time it is
# used. Installing here, instead of on every container start, keeps
# `docker compose up` from contacting the package registry each time — the
# entry point below only installs again when a lockfile actually changed.
FROM oven/bun:1

WORKDIR /usr/src/spotlight

# API workspace. `bunfig.toml` is copied as well so its `[install]` settings
# (e.g. `ignoreScripts`) apply during the build exactly as they do at runtime.
COPY api/package.json api/bun.lock api/bunfig.toml ./api/
RUN bun install --cwd api

# Web workspace (this one has no `bunfig.toml`).
COPY web/package.json web/bun.lock ./web/
RUN bun install --cwd web

# Entry point kept last so edits to it never invalidate the installs above. It
# re-runs `bun install` for the workspace named by $SPOTLIGHT_WORKSPACE when the
# lockfile changed since the node_modules volume was seeded — see the script's
# header for why that is necessary.
COPY docker/dev/entrypoint.sh /usr/local/bin/spotlight-entrypoint
RUN chmod 755 /usr/local/bin/spotlight-entrypoint

ENTRYPOINT ["/usr/local/bin/spotlight-entrypoint"]

EXPOSE 3000
EXPOSE 5173
