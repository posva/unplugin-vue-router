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
  status,
  fetchStatus,
  error,
} = useInfiniteQuery({
  queryKey: ['cat-facts', 'feed'],
  queryFn: async ({ pageParam }) => {
    console.log('Loading more')
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // if (facts.value?.pageParams?.at(-1) > 2) {
    //   throw new Error('Simulated error on page > 2')
    // }
    return factsApi.get<CatFacts>({ query: { page: pageParam, limit: 10 } })
  },
  initialPageParam: 1,

  placeholderData() {
    return {
      pages: [
        {
          current_page: 1,
          data: [],
          first_page_url: '',
          from: 1,
          last_page: 1,
          last_page_url: '',
          next_page_url:
            'https://cat-fact.herokuapp.com/facts/feed?page=2&limit=10',
        },
      ],
      pageParams: [1],
    }
  },

  getNextPageParam: (lastPage, allPages, lastParam, allParams) => {
    console.log('Last page:', lastPage, allPages, lastParam, allParams)
    // return null
    // if there is no next page, return null
    if (!lastPage.next_page_url) return null
    // otherwise return the next page number
    return lastPage.current_page + 1
  },

  retry: false,
  staleTime: 0,
  refetchOnMount: true,
  refetchOnReconnect: true,
  refetchOnWindowFocus: true,
})

watch(
  hasNextPage,
  (has) => {
    console.log('Has next page:', has)
  },
  { flush: 'sync', immediate: true }
)

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
    <button
      @click="
        fetchNextPage({
          cancelRefetch: false,
          // throwOnError: true
        })
      "
    >
      Load more (or scroll down)
    </button>

    <p>
      isLoading: {{ isLoading }} <br />
      fetchStatus: {{ fetchStatus }} <br />
      status: {{ status }} <br />
      error: {{ error?.message }}
    </p>

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
