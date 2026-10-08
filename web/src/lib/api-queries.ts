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
	ApiPostLiker,
	ApiUser,
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
	fetchPostLikes,
	fetchPosts,
	fetchUserProfileStats,
	fetchUsers,
	toggleLikePost,
	updateComment,
	updatePost,
} from "./api";
import type { GiphyGif } from "./api/gif";
import { fetchTrendingGifs, searchGifs } from "./api/gif";
import {
	comments,
	currentUser,
	gifsSearch,
	gifsTrending,
	leaderboard,
	postLikes,
	posts,
	profileStats,
	profileStatsAll,
	users,
} from "./query-keys";
import { readSession } from "./session";

// ── Posts queries ────────────────────────────────────────────────────────────

export function usePosts(params: FetchPostsParams = {}) {
	return useQuery({
		queryKey: [...posts(), params],
		queryFn: () => fetchPosts(params),
		staleTime: 30_000,
	});
}

export function usePostsInfinite() {
	return useInfiniteQuery({
		queryKey: posts(),
		queryFn: ({ pageParam }) =>
			fetchPosts({ page: pageParam as number, limit: 20 }),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			if (!lastPage.meta.hasNextPage) return undefined;
			return lastPage.meta.currentPage + 1;
		},
		staleTime: 30_000,
		maxPages: 20,
	});
}

// ── Current user query ───────────────────────────────────────────────────────

export function useCurrentUser() {
	return useQuery({
		queryKey: currentUser(),
		queryFn: fetchCurrentUser,
	});
}

// ── Create post mutation ─────────────────────────────────────────────────────

export function useCreatePost() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: CreatePostRequest) => createPost(params),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: posts() });
			queryClient.invalidateQueries({
				queryKey: profileStatsAll(),
				exact: false,
			});
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
			queryClient.invalidateQueries({ queryKey: posts() });
		},
	});
}

// ── Delete post mutation ─────────────────────────────────────────────────────

export function useDeletePost() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (postId: string) => deletePost(postId),
		onSettled: () => {
			void queryClient.invalidateQueries({ queryKey: posts() });
			void queryClient.invalidateQueries({
				queryKey: profileStatsAll(),
				exact: false,
			});
		},
	});
}

// ── Invalidation helpers ─────────────────────────────────────────────────────

export function useInvalidatePosts() {
	const queryClient = useQueryClient();
	return () => queryClient.resetQueries({ queryKey: posts(), exact: true });
}

export function useInvalidateCurrentUser() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: currentUser() });
}

// ── Comments queries ─────────────────────────────────────────────────────────

export function useComments(postId: string) {
	return useQuery({
		queryKey: comments(postId),
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
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: posts() });
			void queryClient.invalidateQueries({
				queryKey: profileStatsAll(),
				exact: false,
			});
		},
	});
}

// ── Post likes query ─────────────────────────────────────────────────────────

export function usePostLikes(postId: string, options?: { enabled?: boolean }) {
	return useQuery<ApiPostLiker[]>({
		queryKey: postLikes(postId),
		queryFn: () => fetchPostLikes(postId),
		enabled: !!postId && (options?.enabled ?? true),
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
				comments(postId),
				(old: ApiComment[] | undefined) => {
					if (!old) return [optimisticComment];
					return [optimisticComment, ...old];
				},
			);
			// Also bump the comment count in all posts queries.
			queryClient.setQueriesData(
				{ queryKey: posts(), exact: false },
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
				comments(postId),
				(old: ApiComment[] | undefined) => {
					if (!old) return [];
					return old.filter(
						(c) => c.content !== content || !c.id.startsWith("temp-"),
					);
				},
			);
			// Revert the comment count bump in all posts queries.
			queryClient.setQueriesData(
				{ queryKey: posts(), exact: false },
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
			void queryClient.invalidateQueries({ queryKey: comments(postId) });
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
				comments(postId),
				(old: ApiComment[] | undefined) => {
					if (!old) return old;
					return old.map((c) => (c.id === commentId ? { ...c, content } : c));
				},
			);
		},
		onError: (_error, { postId }) => {
			// Revert on failure by refetching.
			void queryClient.invalidateQueries({ queryKey: comments(postId) });
		},
		onSuccess: (_data, { postId }) => {
			void queryClient.invalidateQueries({ queryKey: comments(postId) });
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
				comments(postId),
				(old: ApiComment[] | undefined) => {
					if (!old) return old;
					return old.filter((c) => c.id !== commentId);
				},
			);
			// Decrement the comment count in all posts queries.
			queryClient.setQueriesData(
				{ queryKey: posts(), exact: false },
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
			void queryClient.invalidateQueries({ queryKey: comments(postId) });
		},
		onSuccess: (_data, { postId }) => {
			void queryClient.invalidateQueries({ queryKey: comments(postId) });
		},
	});
}

// ── Leaderboard query ────────────────────────────────────────────────────────

export function useLeaderboard() {
	return useQuery<ApiLeaderboardEntry[]>({
		queryKey: leaderboard(),
		queryFn: fetchLeaderboard,
		staleTime: 5 * 60 * 1000,
		refetchInterval: 5 * 60 * 1000,
	});
}

// ── Profile stats query ──────────────────────────────────────────────────────

export function useUserProfileStats(userId: string | undefined) {
	return useQuery<UserProfileStats>({
		queryKey: userId ? profileStats(userId) : [],
		queryFn: () => {
			if (!userId) throw new Error("No user id");
			return fetchUserProfileStats(userId);
		},
		enabled: !!userId,
		staleTime: 60_000,
	});
}

// ── GIF queries ──────────────────────────────────────────────────────────────

export function useTrendingGifsInfinite(options?: { enabled?: boolean }) {
	return useInfiniteQuery({
		queryKey: gifsTrending(),
		queryFn: ({ pageParam }) => fetchTrendingGifs(pageParam),
		initialPageParam: 1,
		enabled: options?.enabled ?? true,
		getNextPageParam: (lastPage, _allPages, lastPageParam) => {
			if (!lastPage.meta.hasNextPage) return undefined;
			return lastPageParam + 1;
		},
		staleTime: 120_000,
		maxPages: 10,
	});
}

export function useSearchGifs(query: string) {
	return useQuery<GiphyGif[]>({
		queryKey: gifsSearch(query),
		queryFn: () => searchGifs(query),
		enabled: query.trim().length > 0,
		staleTime: 60_000,
	});
}

// ── Users query (for mention dropdown) ───────────────────────────────────────

export function useUsers() {
	return useQuery<ApiUser[]>({
		queryKey: users(),
		queryFn: () => fetchUsers(1, 100).then((res) => res.data),
		staleTime: 5 * 60 * 1000,
	});
}
