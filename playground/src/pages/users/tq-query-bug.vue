<script setup lang="ts">
import { ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'

type Post = { id: number; title: string; type: 'one' | 'two' }

const type = ref<'one' | 'two' | null>(null)

const { data } = useQuery<Post[]>({
  queryKey: ['posts', () => String(type.value)],
  queryFn: () => {
    console.log('fetching posts', type.value)
    return fetch(
      `https://f4d556e10da84c26.mokky.dev/posts${
        type.value ? `?type=${type.value}` : ''
      }`
    ).then((res) => res.json())
  },

  staleTime: 4 * 60 * 1000,
  gcTime: Infinity,
})

const queryCache = useQueryClient()
const patchRecord = async () => {
  if (!data.value) return

  let type = 'one'

  if (data.value[0].type === 'one') {
    type = 'two'
  }

  const response = await fetch(
    `https://f4d556e10da84c26.mokky.dev/posts/${data.value[0].id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    }
  )

  const patchedData = await response.json()

  queryCache.invalidateQueries({
    queryKey: ['posts'],
    // exact: true,
    // refetchType: 'all',
  })
}
</script>

<template>
  <div
    style="
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 10px;
    "
  >
    <select v-model="type">
      <option :value="null">all</option>
      <option value="one">One</option>
      <option value="two">Two</option>
    </select>
    <div v-for="post in data" :key="post.id">
      {{ post.title }} {{ post.type }}
    </div>
  </div>
  <button @click="patchRecord" style="margin-right: 20px">Patch</button>
</template>
