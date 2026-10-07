/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type {
	ApiComment,
	ApiLeaderboardEntry,
	CreatePostRequest,
	FetchPostsParams,
	UserProfileStats,
} from "./api";
import {
	createComment,
	createPost,
	deleteComment,
	deletePost,
	fetchComments,
	fetchCurrentUser,
	fetchLeaderboard,
	fetchPosts,
	fetchUserProfileStats,
	toggleLikePost,
	updateComment,
	updatePost,
} from "./api";
import { readSession } from "./session";

// ── Query keys ───────────────────────────────────────────────────────────────

export const queryKeys = {
	posts: ["posts"],
	currentUser: ["currentUser"],
	comments: (postId: string) => ["comments", postId],
	leaderboard: ["leaderboard"],
	profileStats: (userId: string) => ["profileStats", userId],
} as const;

// ── Posts queries ────────────────────────────────────────────────────────────

export function usePosts(params: FetchPostsParams = {}) {
	return useQuery({
		queryKey: [...queryKeys.posts, params],
		queryFn: () => fetchPosts(params),
		staleTime: 30_000,
	});
}

// ── Current user query ───────────────────────────────────────────────────────

export function useCurrentUser() {
	return useQuery({
		queryKey: queryKeys.currentUser,
		queryFn: fetchCurrentUser,
	});
}

// ── Create post mutation ─────────────────────────────────────────────────────

export function useCreatePost() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: CreatePostRequest) => createPost(params),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.posts });
		},
	});
}

// ── Update post mutation ─────────────────────────────────────────────────────

export function useUpdatePost() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: { postId: string; content: string }) =>
			updatePost(params.postId, { content: params.content }),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.posts });
		},
	});
}

// ── Delete post mutation ─────────────────────────────────────────────────────

export function useDeletePost() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (postId: string) => deletePost(postId),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.posts });
		},
	});
}

// ── Invalidation helpers ─────────────────────────────────────────────────────

export function useInvalidatePosts() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: queryKeys.posts });
}

export function useInvalidateCurrentUser() {
	const queryClient = useQueryClient();
	return () =>
		queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
}

// ── Comments queries ─────────────────────────────────────────────────────────

export function useComments(postId: string) {
	return useQuery({
		queryKey: queryKeys.comments(postId),
		queryFn: () => fetchComments(postId),
		enabled: !!postId,
	});
}

// ── Like mutation ────────────────────────────────────────────────────────────

export function useToggleLike() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: { postId: string; userId: string }) =>
			toggleLikePost(params.postId, params.userId),
		onMutate: ({ postId, userId }) => {
			// Optimistically update all posts queries (matches ["posts"] and ["posts", ...params]).
			queryClient.setQueriesData(
				{ queryKey: queryKeys.posts, exact: false },
				(old: unknown) => {
					if (!old || typeof old !== "object") return old;
					const payload = old as {
						data: Array<{ id: string; likedBy?: string[]; likesCount: number }>;
					};
					if (!Array.isArray(payload.data)) return old;
					return {
						...payload,
						data: payload.data.map((p) => {
							if (p.id !== postId) return p;
							const likedBy = p.likedBy ?? [];
							const alreadyLiked = likedBy.includes(userId);
							return {
								...p,
								likedBy: alreadyLiked
									? likedBy.filter((id: string) => id !== userId)
									: [...likedBy, userId],
								likesCount: alreadyLiked
									? Math.max(0, p.likesCount - 1)
									: p.likesCount + 1,
							};
						}),
					};
				},
			);
		},
		onError: (_error, { postId, userId }) => {
			// Revert optimistic update on failure.
			queryClient.setQueriesData(
				{ queryKey: queryKeys.posts, exact: false },
				(old: unknown) => {
					if (!old || typeof old !== "object") return old;
					const payload = old as {
						data: Array<{ id: string; likedBy?: string[]; likesCount: number }>;
					};
					if (!Array.isArray(payload.data)) return old;
					return {
						...payload,
						data: payload.data.map((p) => {
							if (p.id !== postId) return p;
							const likedBy = p.likedBy ?? [];
							const currentlyLiked = likedBy.includes(userId);
							// If the optimistic update added the like, remove it.
							// If it removed the like, add it back.
							return {
								...p,
								likedBy: currentlyLiked
									? likedBy.filter((id: string) => id !== userId)
									: [...likedBy, userId],
								likesCount: currentlyLiked
									? Math.max(0, p.likesCount - 1)
									: p.likesCount + 1,
							};
						}),
					};
				},
			);
		},
	});
}

// ── Create comment mutation ──────────────────────────────────────────────────

export function useCreateComment() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: { postId: string; content: string }) =>
			createComment(params.postId, params.content),
		onMutate: ({ postId, content }) => {
			const session = readSession();
			const optimisticComment: ApiComment = {
				id: crypto.randomUUID(),
				content,
				author: {
					id: session?.user?.id ?? "",
					name: session?.user?.displayName ?? session?.user?.name ?? "",
				},
				createdAt: new Date().toISOString(),
			};
			// Optimistically add the comment to the cache.
			queryClient.setQueryData(
				queryKeys.comments(postId),
				(old: ApiComment[] | undefined) => {
					if (!old) return [optimisticComment];
					return [optimisticComment, ...old];
				},
			);
			// Also bump the comment count in all posts queries.
			queryClient.setQueriesData(
				{ queryKey: queryKeys.posts, exact: false },
				(old: unknown) => {
					if (!old || typeof old !== "object") return old;
					const payload = old as {
						data: Array<{ id: string; commentsCount: number }>;
					};
					if (!Array.isArray(payload.data)) return old;
					return {
						...payload,
						data: payload.data.map((p) =>
							p.id === postId
								? { ...p, commentsCount: p.commentsCount + 1 }
								: p,
						),
					};
				},
			);
		},
		onError: (_error, { postId, content }) => {
			// Revert optimistic comment on failure.
			queryClient.setQueryData(
				queryKeys.comments(postId),
				(old: ApiComment[] | undefined) => {
					if (!old) return [];
					return old.filter(
						(c) => c.content !== content || !c.id.startsWith("temp-"),
					);
				},
			);
			// Revert the comment count bump in all posts queries.
			queryClient.setQueriesData(
				{ queryKey: queryKeys.posts, exact: false },
				(old: unknown) => {
					if (!old || typeof old !== "object") return old;
					const payload = old as {
						data: Array<{ id: string; commentsCount: number }>;
					};
					if (!Array.isArray(payload.data)) return old;
					return {
						...payload,
						data: payload.data.map((p) =>
							p.id === postId
								? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) }
								: p,
						),
					};
				},
			);
		},
		onSuccess: (_data, { postId }) => {
			// Refetch comments so the optimistic placeholder is replaced with server data.
			queryClient.invalidateQueries({ queryKey: queryKeys.comments(postId) });
		},
	});
}

// ── Update comment mutation ──────────────────────────────────────────────────

export function useUpdateComment() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: {
			postId: string;
			commentId: string;
			content: string;
		}) => updateComment(params.postId, params.commentId, params.content),
		onMutate: ({ postId, commentId, content }) => {
			// Optimistically update the comment in the cache.
			queryClient.setQueryData(
				queryKeys.comments(postId),
				(old: ApiComment[] | undefined) => {
					if (!old) return old;
					return old.map((c) => (c.id === commentId ? { ...c, content } : c));
				},
			);
		},
		onError: (_error, { postId }) => {
			// Revert on failure by refetching.
			queryClient.invalidateQueries({ queryKey: queryKeys.comments(postId) });
		},
		onSuccess: (_data, { postId }) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.comments(postId) });
		},
	});
}

// ── Delete comment mutation ──────────────────────────────────────────────────

export function useDeleteComment() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: { postId: string; commentId: string }) =>
			deleteComment(params.postId, params.commentId),
		onMutate: ({ postId, commentId }) => {
			// Optimistically remove the comment from the cache.
			queryClient.setQueryData(
				queryKeys.comments(postId),
				(old: ApiComment[] | undefined) => {
					if (!old) return old;
					return old.filter((c) => c.id !== commentId);
				},
			);
			// Decrement the comment count in all posts queries.
			queryClient.setQueriesData(
				{ queryKey: queryKeys.posts, exact: false },
				(old: unknown) => {
					if (!old || typeof old !== "object") return old;
					const payload = old as {
						data: Array<{ id: string; commentsCount: number }>;
					};
					if (!Array.isArray(payload.data)) return old;
					return {
						...payload,
						data: payload.data.map((p) =>
							p.id === postId
								? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) }
								: p,
						),
					};
				},
			);
		},
		onError: (_error, { postId }) => {
			// Revert on failure by refetching.
			queryClient.invalidateQueries({ queryKey: queryKeys.comments(postId) });
		},
		onSuccess: (_data, { postId }) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.comments(postId) });
		},
	});
}

// ── Leaderboard query ────────────────────────────────────────────────────────

export function useLeaderboard() {
	return useQuery<ApiLeaderboardEntry[]>({
		queryKey: queryKeys.leaderboard,
		queryFn: fetchLeaderboard,
		staleTime: 60_000,
	});
}

// ── Profile stats query ──────────────────────────────────────────────────────

export function useUserProfileStats(userId: string | undefined) {
	return useQuery<UserProfileStats>({
		queryKey: userId ? queryKeys.profileStats(userId) : [],
		queryFn: () => {
			if (!userId) throw new Error("No user id");
			return fetchUserProfileStats(userId);
		},
		enabled: !!userId,
		staleTime: 60_000,
	});
}

// ── GIF queries ──────────────────────────────────────────────────────────────

import type { GiphyGif } from "./api/gif";
import { fetchTrendingGifs, searchGifs } from "./api/gif";

export const gifQueryKeys = {
	trending: ["gifs", "trending"],
	search: (query: string) => ["gifs", "search", query],
} as const;

export function useTrendingGifsInfinite(options?: { enabled?: boolean }) {
	return useInfiniteQuery({
		queryKey: gifQueryKeys.trending,
		queryFn: ({ pageParam }) => fetchTrendingGifs(pageParam),
		initialPageParam: 1,
		enabled: options?.enabled ?? true,
		getNextPageParam: (lastPage, _allPages, lastPageParam) => {
			if (!lastPage.meta.hasNextPage) return undefined;
			return lastPageParam + 1;
		},
		staleTime: 120_000,
	});
}

export function useSearchGifs(query: string) {
	return useQuery<GiphyGif[]>({
		queryKey: gifQueryKeys.search(query),
		queryFn: () => searchGifs(query),
		enabled: query.trim().length > 0,
		staleTime: 60_000,
	});
}
