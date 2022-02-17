<!-- index.html has a div with id="notification" -->
<template>
  <Teleport to="#notification">
    <div class="notification" v-for="(message, index) in notifications" :key="index">
      <button class="delete" @click="remove(index)"></button>
      {{ message.message }} - {{ message.details }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { notifications } from "./../notify";

function remove(index: number) {
  notifications.splice(index, 1);
}
</script>
<style>
#notification {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 50;
}
#notification .notification {
  box-shadow: 0px 0px 2px 0px var(--first-color);
}
</style>
