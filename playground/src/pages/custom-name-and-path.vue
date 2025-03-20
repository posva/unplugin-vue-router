<route lang="json">
{
  "name": "the most rebel",
  "path": "/most-rebel",
  "props": true
}
</route>

<!-- For some reason, a local link doesn't work... -->

<template>
  custom names
  {{ $route.name satisfies 'the most rebel' }}
</template>
