<template>
  <button class="button" v-on:click="introJs.start()" type="button">{{text}}</button>
</template>

<script lang="ts">
import { defineComponent, ref} from "vue";
// @ts-ignore (shut up, dear compiler-chan)
import introJS from 'intro.js';

export default defineComponent({
  props: {
    text: {
      type: String,
      required: false,
      default: "Hier klicken für eine kurze Erklärungstour",
    },
  },
  setup(props, context) {
    const introJs = introJS();

    return {
      ...props,
      introJs
    };
  },
});
</script>

<style scoped>
button {
  height: 24px;
  font-size: 16px;
  margin-bottom: 2px;
  margin-top: 0px;
}
</style>