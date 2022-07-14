<template>
    <header>
    <div class="wrapper">
      <mark>current page name is: {{$route.name}}</mark>
      <nav>
        <RouterLink to="/chunk1">chunk1</RouterLink>
          <br/>
        <RouterLink to="/chunk2">chunk2</RouterLink>
          <br/>
        <RouterLink to="/HelloWorld">HelloWorld</RouterLink>
      </nav>
    </div>
  </header>
  <router-view></router-view>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import HelloWorld from './pages/HelloWorld.vue';

export default defineComponent({
  name: 'App',
  components: {
    HelloWorld
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
