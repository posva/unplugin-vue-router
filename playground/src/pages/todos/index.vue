<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { fetchTodos, createTodo, deleteTodo } from '../../api'
import { ref } from 'vue'

const queryClient = useQueryClient()
const enabled = ref(true)

const {
  isLoading,
  isFetching,
  isError,
  data: todoList,
  error,
} = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  enabled,
})

// Mutation
const _addTodo = useMutation({
  mutationFn: createTodo,
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
  onError: (error, vars) => {
    console.log(error, vars)
  },
})

const _deleteTodo = useMutation({
  mutationFn: deleteTodo,
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})

const title = ref('')

function addTodo() {
  _addTodo.mutate({ title: title.value, completed: false })
  title.value = ''
}
</script>

<template>
  <form @submit.prevent="addTodo">
    <input type="text" v-model="title" />
    <button>Add</button>
  </form>
  <ul>
    <li v-for="todo in todoList" :key="todo.id">
      <input type="checkbox" v-model="todo.completed" />
      {{ todo.title }}
      <button @click="_deleteTodo.mutate(todo.id)">Delete</button>
    </li>
  </ul>

  <label> <input type="checkbox" v-model="enabled" /> Enabled Query </label>
  <p>
    isLoading: {{ isLoading }}
    <br />
    isFetching: {{ isFetching }}
    <br />
    isError: {{ isError }}
    <br />
    Error: {{ error }}
  </p>
</template>
