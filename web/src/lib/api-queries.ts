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
	ApiPost,
	ApiPostLiker,
	ApiUser,
	CreatePostRequest,
	FetchPostsParams,
	InviteUserRequest,
	UserProfileStats,
} from "./api";
import {
	activateUser,
	createComment,
	createPost,
	deactivateUser,
	deleteComment,
	deletePost,
	deleteUser,
	fetchComments,
	fetchCurrentUser,
	fetchLeaderboard,
	fetchPostLikes,
	fetchPosts,
	fetchUserPosts,
	fetchUserProfileStats,
	fetchUsers,
	inviteUser,
	toggleLikePost,
	updateComment,
	updatePost,
	updateUserRole,
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
	userPosts,
	users,
	usersDirectory,
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
		mutationFn: (params: { postId: string; contentJson: string }) =>
			updatePost(params.postId, { contentJson: params.contentJson }),
		onMutate: ({ postId, contentJson }) => {
			// Optimistically update the post in all posts queries, including infinite pages.
			queryClient.setQueriesData(
				{ queryKey: posts(), exact: false },
				(old: unknown) => {
					if (!old || typeof old !== "object") return old;
					const obj = old as Record<string, unknown>;

					// Handle useInfiniteQuery shape: { pages: [{ data: ApiPost[] }], pageParams: [...] }
					if (Array.isArray(obj.pages)) {
						return {
							...old,
							pages: obj.pages.map((page: unknown) => {
								if (!page || typeof page !== "object") return page;
								const p = page as { data: ApiPost[] };
								if (!Array.isArray(p.data)) return page;
								return {
									...page,
									data: p.data.map((post) =>
										post.id === postId ? { ...post, contentJson } : post,
									),
								};
							}),
						};
					}

					// Handle regular useQuery shape: { data: ApiPost[] }
					if (Array.isArray(obj.data)) {
						return {
							...old,
							data: (obj.data as ApiPost[]).map((post) =>
								post.id === postId ? { ...post, contentJson } : post,
							),
						};
					}
					return old;
				},
			);
		},
		onError: () => {
			// Revert on failure by refetching.
			void queryClient.invalidateQueries({ queryKey: posts() });
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: posts() });
			queryClient.invalidateQueries({
				queryKey: profileStatsAll(),
				exact: false,
			});
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
		mutationFn: (params: { postId: string; contentJson: string }) =>
			createComment(params.postId, params.contentJson),
		onMutate: ({ postId, contentJson }) => {
			const session = readSession();
			const optimisticComment: ApiComment = {
				id: crypto.randomUUID(),
				contentJson,
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
		onError: (_error, { postId, contentJson }) => {
			// Revert optimistic comment on failure.
			queryClient.setQueryData(
				comments(postId),
				(old: ApiComment[] | undefined) => {
					if (!old) return [];
					return old.filter(
						(c) => c.contentJson !== contentJson || !c.id.startsWith("temp-"),
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
			contentJson: string;
		}) => updateComment(params.postId, params.commentId, params.contentJson),
		onMutate: ({ postId, commentId, contentJson }) => {
			// Optimistically update the comment in the cache.
			queryClient.setQueryData(
				comments(postId),
				(old: ApiComment[] | undefined) => {
					if (!old) return old;
					return old.map((c) =>
						c.id === commentId ? { ...c, contentJson } : c,
					);
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

// ── User posts query ─────────────────────────────────────────────────────────

export function useUserPosts(userId: string | undefined) {
	return useQuery({
		queryKey: userId ? userPosts(userId) : [],
		queryFn: () => {
			if (!userId) throw new Error("No user id");
			return fetchUserPosts(userId);
		},
		enabled: !!userId,
		staleTime: 30_000,
	});
}

// ── Users directory query (paginated, with optional role filter) ─────────────

interface UseUsersDirectoryOptions {
	role?: string;
	search?: string;
	page?: number;
	limit?: number;
}

export function useUsersDirectory(options: UseUsersDirectoryOptions = {}) {
	const { role, search, page = 1, limit = 20 } = options;
	return useQuery({
		queryKey: usersDirectory(role, search),
		queryFn: () => fetchUsers(page, limit),
		staleTime: 5 * 60 * 1000,
		select: (res) => {
			let data = res.data;
			if (role) {
				data = data.filter((u) => u.role === role);
			}
			if (search) {
				const q = search.toLowerCase();
				data = data.filter(
					(u) =>
						u.displayName.toLowerCase().includes(q) ||
						u.email.toLowerCase().includes(q),
				);
			}
			return { data, meta: res.meta };
		},
	});
}

// ── Invite user mutation ─────────────────────────────────────────────────────

export function useInviteUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (request: InviteUserRequest) => inviteUser(request),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: users() });
			queryClient.invalidateQueries({
				queryKey: usersDirectory(),
				exact: false,
			});
		},
	});
}

// ── Update user role mutation ────────────────────────────────────────────────

export function useUpdateUserRole() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, role }: { userId: string; role: string }) =>
			updateUserRole(userId, { role }),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: users() });
			queryClient.invalidateQueries({
				queryKey: usersDirectory(),
				exact: false,
			});
		},
	});
}

// ── Activate user mutation ───────────────────────────────────────────────────

export function useActivateUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (userId: string) => activateUser(userId),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: users() });
			queryClient.invalidateQueries({
				queryKey: usersDirectory(),
				exact: false,
			});
		},
	});
}

// ── Deactivate user mutation ─────────────────────────────────────────────────

export function useDeactivateUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (userId: string) => deactivateUser(userId),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: users() });
			queryClient.invalidateQueries({
				queryKey: usersDirectory(),
				exact: false,
			});
		},
	});
}

// ── Delete user mutation ─────────────────────────────────────────────────────

export function useDeleteUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (userId: string) => deleteUser(userId),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: users() });
			queryClient.invalidateQueries({
				queryKey: usersDirectory(),
				exact: false,
			});
		},
	});
}
