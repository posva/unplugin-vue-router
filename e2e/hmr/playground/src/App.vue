<template>
  <nav>
    <ul>
      <li><RouterLink to="/">Home</RouterLink></li>
      <li>
        <RouterLink to="/custom-path" data-testid="custom-path-link"
          >Custom path after change</RouterLink
        >
      </li>
    </ul>
  </nav>
  <hr />

  <RouterView />
</template>
