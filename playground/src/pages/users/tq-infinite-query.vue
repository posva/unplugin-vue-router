<script setup lang="ts">
import { factsApi } from '@/api/cat-facts'
import type { CatFacts } from '@/api/cat-facts'
import { useInfiniteQuery } from '@tanstack/vue-query'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { computed, onWatcherCleanup, useTemplateRef, watch } from 'vue'

const {
  data: facts,
  isLoading,
  fetchNextPage,
  hasNextPage,
} = useInfiniteQuery({
  queryKey: ['cat-facts', 'feed'],
  queryFn: async ({ pageParam }) =>
    factsApi.get<CatFacts>({ query: { page: pageParam, limit: 10 } }),
  initialPageParam: 1,

  getNextPageParam: (lastPage) => {
    // if there is no next page, return null
    if (!lastPage.next_page_url) return null
    // otherwise return the next page number
    return lastPage.current_page + 1
  },
})

const mergedPages = computed(() => {
  return facts.value?.pages?.flatMap((page) => page.data) || []
})

const loadMoreEl = useTemplateRef('load-more')

watch(loadMoreEl, (el) => {
  if (el) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage()
        }
      },
      {
        rootMargin: '300px',
        threshold: [0],
      }
    )
    observer.observe(el)
    onWatcherCleanup(() => {
      observer.disconnect()
    })
  }
})
</script>

<template>
  <div>
    <button :disabled="isLoading" @click="fetchNextPage()">
      Load more (or scroll down)
    </button>
    <template v-if="facts?.pages">
      <p>We have loaded {{ facts.pages.length }} facts</p>
      <details>
        <summary>Show raw</summary>
        <pre>{{ facts }}</pre>
      </details>

      <blockquote v-for="fact in mergedPages!">
        {{ fact }}
      </blockquote>

      <p v-if="hasNextPage" ref="load-more">Loading more...</p>
    </template>
  </div>

  <VueQueryDevtools />
</template>
