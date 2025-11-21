export const RECIPE_QUERY_KEYS = {
  root: ['recipes'] as const,

  search: (options: { query?: string; page?: number; limit?: number }) =>
    [...RECIPE_QUERY_KEYS.root, 'search', options] as const,

  detail: (id: string) => [...RECIPE_QUERY_KEYS.root, 'detail', id] as const,

  recentList: (options?: { limit?: number }) =>
    [
      ...RECIPE_QUERY_KEYS.root,
      'list',
      'recent',
      ...(options ? [options] : []),
    ] as const,

  byAuthor: (authorId: string, options?: { page?: number; limit?: number }) =>
    [
      ...RECIPE_QUERY_KEYS.root,
      'list',
      'by-author',
      authorId,
      ...(options ? [options] : []),
    ] as const,

  byTags: (tags: string[], options?: { page?: number; limit?: number }) =>
    [
      ...RECIPE_QUERY_KEYS.root,
      'list',
      'by-tags',
      tags,
      ...(options ? [options] : []),
    ] as const,
}
