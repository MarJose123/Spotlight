/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

/**
 * Dependency license audit for Spotlight.
 *
 * Scans the installed dependency trees of the root, `api/`, and `web/`
 * workspaces and reports every third-party license found, flagging any
 * identifier that cannot be combined with this project's AGPL-3.0 license.
 *
 * Usage:
 *   node scripts/audit-licenses.mjs            # print the report
 *   node scripts/audit-licenses.mjs --write    # also write THIRD-PARTY-NOTICES.md
 *
 * Exit code is 1 when an AGPL-incompatible license is found, so it can gate CI.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WORKSPACES = ['', 'api', 'web']
const WRITE = process.argv.includes('--write')

/** Recursively collect every package.json inside a node_modules tree. */
function collectModules(nodeModulesDir, found, depth = 0) {
  if (depth > 8 || !fs.existsSync(nodeModulesDir)) return
  let entries
  try {
    entries = fs.readdirSync(nodeModulesDir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
    if (entry.name === '.bin' || entry.name === '.cache') continue
    const full = path.join(nodeModulesDir, entry.name)
    const packageDirs = entry.name.startsWith('@')
      ? (() => {
          try {
            return fs
              .readdirSync(full, { withFileTypes: true })
              .filter((s) => s.isDirectory() || s.isSymbolicLink())
              .map((s) => path.join(full, s.name))
          } catch {
            return []
          }
        })()
      : [full]
    for (const packageDir of packageDirs) {
      const pkgJsonPath = path.join(packageDir, 'package.json')
      if (fs.existsSync(pkgJsonPath)) {
        try {
          const json = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
          found.push({
            name: json.name ?? path.basename(packageDir),
            version: json.version ?? '?',
            license: readLicense(json),
            homepage: json.homepage ?? repoUrl(json.repository),
            author: formatAuthor(json.author),
          })
        } catch {
          /* ignore unreadable package metadata */
        }
      }
      collectModules(path.join(packageDir, 'node_modules'), found, depth + 1)
    }
  }
}

function readLicense(json) {
  let license = json.license
  if (!license && Array.isArray(json.licenses)) {
    license = json.licenses
      .map((l) => (typeof l === 'string' ? l : l?.type))
      .filter(Boolean)
      .join(' OR ')
  }
  if (license && typeof license === 'object') license = license.type
  return license ? String(license).trim() : null
}

function repoUrl(repository) {
  const url = typeof repository === 'string' ? repository : repository?.url
  if (!url) return null
  return url.replace(/^git\+/, '').replace(/\.git$/, '')
}

function formatAuthor(author) {
  if (!author) return null
  if (typeof author === 'string') return author.replace(/\s*<[^>]*>/, '').trim()
  return author.name ?? null
}

/**
 * Licenses that may be combined with AGPL-3.0. Permissive licenses and
 * GPLv3/LGPLv3/AGPLv3 are fine; MPL-2.0 and EPL-2.0 are file-level or
 * GPL-compatible; everything else is flagged for review.
 */
const COMPATIBLE = [
  /^MIT\b/i,
  /^MIT-0\b/i,
  /^ISC\b/i,
  /^0BSD\b/i,
  /^BSD/i,
  /^Apache-2\.0\b/i,
  /^Unlicense\b/i,
  /^CC0-1\.0\b/i,
  /^CC-BY-[34]\.0\b/i,
  /^CC-BY-SA-4\.0\b/i,
  /^Zlib\b/i,
  /^Artistic-2\.0\b/i,
  /^Python-2\.0\b/i,
  /^PSF-2\.0\b/i,
  /^BlueOak-1\.0\.0\b/i,
  /^MPL-2\.0\b/i,
  /^LGPL-3\.0/i,
  /^GPL-3\.0/i,
  /^AGPL-3\.0/i,
  /^WTFPL\b/i,
  /^Beerware\b/i,
  /^W3C\b/i,
  /^EPL-2\.0/i,
  /^ODC-By\b/i,
]

const FLAGGED = [
  { re: /^GPL-2\.0/i, why: 'GPL-2.0-only cannot be combined with AGPLv3 (no v3 upgrade path)' },
  { re: /^GPL-1\.0/i, why: 'GPL-1.0 is incompatible with AGPLv3' },
  { re: /^LGPL-2\.[01]/i, why: 'LGPL-2.0/2.1-only is incompatible with AGPLv3' },
  { re: /^CDDL/i, why: 'CDDL is not compatible with the GPL family' },
  { re: /^EPL-1\.0/i, why: 'EPL-1.0 is not compatible with the GPL family' },
  { re: /^CPL/i, why: 'CPL is not compatible with the GPL family' },
  { re: /^OSL/i, why: 'OSL is not compatible with the GPL family' },
  { re: /^SSPL/i, why: 'SSPL is a non-free, AGPL-incompatible license' },
  { re: /^BUSL/i, why: 'Business Source License is proprietary and AGPL-incompatible' },
  { re: /^Elastic/i, why: 'Elastic License is proprietary and AGPL-incompatible' },
  { re: /Commons-Clause/i, why: 'Commons Clause removes AGPL-compatible freedoms' },
  { re: /^CC-BY-NC/i, why: 'Non-commercial restriction is incompatible with AGPLv3' },
  { re: /^CC-BY-ND/i, why: 'No-derivatives restriction is incompatible with AGPLv3' },
  { re: /^UNLICENSED$/i, why: 'Explicitly unlicensed / proprietary' },
  { re: /^SEE LICENSE IN/i, why: 'Custom license — requires manual review' },
  { re: /^LicenseRef-/i, why: 'Custom license reference — requires manual review' },
]

/** Evaluate a single (already de-parenthesised) SPDX license atom. */
function evalAtom(atom) {
  const id = atom.trim()
  if (!id) return { state: 'review', why: 'Empty license expression' }
  // "GPL-2.0+" style "or later" grants let the user pick GPLv3, which is
  // compatible with AGPLv3, so these are fine despite the bare id not being so.
  if (/^(A?GPL|LGPL)-[\d.]+\+$/i.test(id)) return { state: 'compatible' }
  if (COMPATIBLE.some((re) => re.test(id))) return { state: 'compatible' }
  const hit = FLAGGED.find((f) => f.re.test(id))
  if (hit) return { state: 'incompatible', why: hit.why }
  return { state: 'review', why: `Unrecognised license id "${id}" — review manually` }
}

/**
 * Evaluate a full SPDX expression. `OR` needs only one compatible branch;
 * `AND` needs every branch to be compatible.
 */
function evalExpression(expression) {
  const cleaned = expression.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()
  const orParts = cleaned.split(/\s+OR\s+/i)
  if (orParts.length > 1) {
    const results = orParts.map((part) => evalExpression(part))
    const compatible = results.find((r) => r.state === 'compatible')
    if (compatible) return compatible
    return results.find((r) => r.state === 'incompatible') ?? results[0]
  }
  const andParts = cleaned.split(/\s+AND\s+/i)
  if (andParts.length > 1) {
    const results = andParts.map((part) => evalAtom(part))
    return results.find((r) => r.state !== 'compatible') ?? { state: 'compatible' }
  }
  return evalAtom(cleaned)
}

/**
 * Upstream packages whose license is real but not machine-readable from
 * package.json. Verified by hand; do not add an entry without checking the
 * package's own LICENSE/Readme in node_modules.
 */
const LICENSE_OVERRIDES = {
  'pause@0.0.1': {
    license: 'MIT',
    note: 'Stated in the package Readme; the `license` field is missing upstream.',
  },
}

function classify(license) {
  if (!license) return { state: 'undeclared', why: 'No license field in package.json' }
  return evalExpression(license)
}

const seen = new Map()
for (const workspace of WORKSPACES) {
  const found = []
  collectModules(path.join(REPO, workspace, 'node_modules'), found)
  for (const pkg of found) {
    const key = `${pkg.name}@${pkg.version}`
    if (seen.has(key)) continue
    const override = LICENSE_OVERRIDES[key]
    const resolved = override ? { ...pkg, license: override.license, note: override.note } : pkg
    seen.set(key, { ...resolved, scope: workspace || 'root', ...classify(resolved.license) })
  }
}

const packages = [...seen.values()]
const byState = { compatible: [], incompatible: [], review: [], undeclared: [] }
for (const pkg of packages) byState[pkg.state].push(pkg)
for (const list of Object.values(byState)) {
  list.sort((a, b) => a.name.localeCompare(b.name))
}

const counts = new Map()
for (const pkg of packages) {
  const key = pkg.license ?? '(none declared)'
  counts.set(key, (counts.get(key) ?? 0) + 1)
}

console.log(`Scanned ${packages.length} unique installed packages across root/, api/, web/\n`)
console.log('License distribution:')
for (const [license, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(4)}  ${license}`)
}
for (const state of ['incompatible', 'review', 'undeclared']) {
  if (!byState[state].length) continue
  console.log(`\n${state.toUpperCase()} (${byState[state].length}):`)
  for (const pkg of byState[state]) {
    console.log(`  ${pkg.name}@${pkg.version} [${pkg.scope}] -> ${pkg.license ?? 'none'}`)
    console.log(`      ${pkg.why}`)
  }
}

if (WRITE) {
  const lines = [
    '# Third-Party Notices',
    '',
    'Spotlight is licensed under the GNU Affero General Public License, version 3',
    'only (`AGPL-3.0`). It bundles the third-party packages listed below.',
    'Each remains under its own license, and nothing in the AGPLv3 overrides those',
    'terms.',
    '',
    `This file was generated by \`node scripts/audit-licenses.mjs --write\` and covers`,
    `${packages.length} unique installed packages. Full license texts ship alongside`,
    'each package under the relevant `node_modules/` directory.',
    '',
    '## License summary',
    '',
    '| License | Packages |',
    '| --- | ---: |',
    ...[...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([license, count]) => `| ${license} | ${count} |`),
    '',
    '## Compatibility with AGPL-3.0',
    '',
    `- Compatible: ${byState.compatible.length}`,
    `- Incompatible: ${byState.incompatible.length}`,
    `- Needs review: ${byState.review.length}`,
    `- No declared license: ${byState.undeclared.length}`,
    '',
    '## Packages',
    '',
    '| Package | Version | License | Workspace | Notes |',
    '| --- | --- | --- | --- | --- |',
    ...packages
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(
        (pkg) =>
          `| ${pkg.homepage ? `[${pkg.name}](${pkg.homepage})` : pkg.name} | ${pkg.version} | ${
            pkg.license ?? '_(none declared)_'
          } | ${pkg.scope} | ${pkg.note ?? ''} |`,
      ),
    '',
  ]
  fs.writeFileSync(path.join(REPO, 'THIRD-PARTY-NOTICES.md'), `${lines.join('\n')}\n`)
  console.log('\nWrote THIRD-PARTY-NOTICES.md')
}

if (byState.incompatible.length) {
  console.error(`\n${byState.incompatible.length} AGPL-incompatible package(s) found.`)
  process.exit(1)
}
