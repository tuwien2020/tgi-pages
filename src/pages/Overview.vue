<template>
  <h1>Overview Page</h1>

  TODO: List of pages
  <h3>Cat pages</h3>
  <ul>
    <li><a href="https://cataas.com/">Cat as a service</a></li>
    <li>
      <a href="https://stefnotch.github.io/shakespeares-cats/"
        >Shakespeare's Cats
      </a>
    </li>
  </ul>
  <h3>Neko pages</h3>
  <ul>
    <li><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Nyehehe</a></li>
  </ul>

  <!-- Stuff and thingies -->
  <button @click="count++">count is: {{ count }}</button>
  <p>
    Edit <code>components/Overview.vue</code> to test hot module replacement.
  </p>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
export default defineComponent({
  setup() {
    const count = ref(0);

    return {
      count,
    };
  },
});
</script>
