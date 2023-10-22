import { mande } from 'mande'

const todos = mande('http://localhost:4000/todos', {})

export interface Todo {
  id: string
  title: string
  completed: boolean
}

export function fetchTodos() {
  return todos.get<Todo[]>()
}

export function createTodo({
  title,
  completed = false,
}: {
  title: string
  completed: boolean
}) {
  if (title == 'fail') {
    return Promise.reject(new Error('Invalid title'))
  }
  return todos.post<Todo>({ title, completed })
}

export function updateTodo(todoUpdate: {
  id: string
  title: string
  completed?: boolean
}) {
  return todos.patch<Todo>(todoUpdate.id, todoUpdate)
}

export function deleteTodo(id: string) {
  return todos.delete<Todo>(id)
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))
