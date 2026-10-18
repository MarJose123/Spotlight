/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

/**
 * Walks a Tiptap JSON document tree and extracts all mention node user IDs.
 * Resilient to unknown node types — skips anything that isn't a mention.
 */
export function extractMentionIds(contentJson: string): string[] {
  let doc: unknown;
  try {
    doc = JSON.parse(contentJson);
  } catch {
    return [];
  }

  const ids = new Set<string>();
  walkTiptapNodes(doc, (node) => {
    if (node.type === 'mention' && typeof node.attrs?.id === 'string') {
      ids.add(node.attrs.id);
    }
  });
  return [...ids];
}

type TiptapNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: unknown[];
};

function walkTiptapNodes(node: unknown, visit: (n: TiptapNode) => void) {
  if (!node || typeof node !== 'object') return;

  if ('type' in node) {
    visit(node as TiptapNode);
  }

  const content = (node as TiptapNode).content;
  if (Array.isArray(content)) {
    for (const child of content) {
      walkTiptapNodes(child, visit);
    }
  }
}
