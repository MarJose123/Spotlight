/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import Emoji, { gitHubEmojis } from "@tiptap/extension-emoji";
import Mention from "@tiptap/extension-mention";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useMemo } from "react";

/**
 * Read-only Tiptap editor that renders stored JSON content.
 * Extensions match the composer so mentions, emojis, and formatting display correctly.
 */
export function TiptapRenderer({ contentJson }: { contentJson: string }) {
	// Parse JSON content once so we can detect empty content and skip the editor mount.
	const parsedContent = useMemo(() => {
		try {
			return JSON.parse(contentJson);
		} catch {
			return null;
		}
	}, [contentJson]);

	const editor = useEditor({
		editable: false,
		content: parsedContent ?? "",
		extensions: [
			StarterKit.configure({
				bulletList: false,
				orderedList: false,
				blockquote: false,
				horizontalRule: false,
				codeBlock: false,
				hardBreak: false,
			}),
			Mention.configure({
				HTMLAttributes: {
					class: "mention",
				},
				renderText: (props) =>
					`@${props.node.attrs.label ?? props.node.attrs.id ?? ""}`,
			}),
			Emoji.configure({
				emojis: gitHubEmojis,
				forceFallbackImages: true,
			}),
		],
		editorProps: {
			attributes: {
				class:
					"block w-full text-[12px] leading-[1.35] text-[var(--feed-ink)] [overflow-wrap:anywhere]",
			},
		},
	});

	if (!parsedContent?.content?.length) return null;

	return <EditorContent editor={editor} />;
}
