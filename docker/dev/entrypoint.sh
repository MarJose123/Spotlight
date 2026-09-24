#!/bin/sh
#
# SPDX-FileCopyrightText: 2026 Marjose Darang
# SPDX-License-Identifier: AGPL-3.0
#
# Part of Spotlight. Licensed under the GNU Affero General Public License,
# version 3 only. See the LICENSE file at the repository root for the full terms.
#
set -eu

# Which workspace to keep in sync; set by compose.dev.yaml (`api` or `web`).
workspace="${SPOTLIGHT_WORKSPACE:-api}"
dir="/usr/src/spotlight/${workspace}"

if [ "$#" -eq 0 ]; then
  echo "[entrypoint] no command supplied; pass one via CMD or compose 'command'" >&2
  exit 1
fi

if [ ! -f "${dir}/bun.lock" ]; then
  echo "[entrypoint] no ${workspace}/bun.lock; skipping dependency sync" >&2
else
  # Lives inside the volume, so it survives container recreation. The Bun
  # version is part of the fingerprint so a base-image bump re-resolves too.
  stamp="${dir}/node_modules/.spotlight-deps-fingerprint"
  fingerprint="bun $(bun --version) $(cat \
    "${dir}/package.json" \
    "${dir}/bun.lock" \
    "${dir}/bunfig.toml" \
    2>/dev/null | sha256sum | cut -d' ' -f1)"

  if [ -f "${stamp}" ] && [ "$(cat "${stamp}")" = "${fingerprint}" ]; then
    echo "[entrypoint] ${workspace} dependencies are in sync with bun.lock"
  else
    echo "[entrypoint] ${workspace} dependencies changed; running 'bun install'"
    # Only record the fingerprint once the install actually succeeded. Stamping a
    # failed install would make every later start report "in sync" and skip the
    # install forever, with no way back except deleting the volume.
    if bun install --cwd "${workspace}"; then
      mkdir -p "${dir}/node_modules"
      printf '%s\n' "${fingerprint}" > "${stamp}"
    else
      status=$?
      echo "[entrypoint] 'bun install' failed (exit ${status}); not recording the fingerprint so the next start retries" >&2
      exit "${status}"
    fi
  fi
fi

exec "$@"
