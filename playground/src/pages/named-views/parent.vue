<template>
  <RouterView name="default" />
  <RouterView name="a" />
  <RouterView name="b" />
  <!-- @vue-expect-error TODO: -->
  <RouterView name="c" />
</template>
