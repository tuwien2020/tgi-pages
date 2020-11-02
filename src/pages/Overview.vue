<template>
  <h1>Overview Page</h1>

  <input />

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

  <ul>
    <li><router-link to="/hamming-code">Hamming-Codes</router-link></li>
  </ul>

  <h3>Boolesche Algebra</h3>
  <ul>
    <li><router-link to="/truth-table">Wahrheitstabelle</router-link></li>
  </ul>

  <h3>GitHub</h3>
  <ul>
    <li>
      <a href="https://github.com/tuwien2020/tgi-pages">TGI Pages</a>
    </li>
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
  components: {},
  setup() {
    const count = ref(0);

    return {
      count,
    };
  },
});
</script>
