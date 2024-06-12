<template>
  <main>
    <h1>Not Found</h1>
    <p>
      {{ $route.name === '/[...path]' && $route.params.path }} does not exist.
    </p>
  </main>
</template>

<route>
{
  "props": true
}
</route>
