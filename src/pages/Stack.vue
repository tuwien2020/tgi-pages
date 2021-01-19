<template>
  <div class="columns">
    <div class="column">
      <span>Initialer Speicher: </span>

      <table class="table is-bordered is-striped is-narrow is-fullwidth">
        <thead>
          <th v-for="(item, index) in adresses" :key="index">{{ item }}</th>
        </thead>

        <tbody>
          <tr>
            <td v-for="(item, index) in adressValues" :key="index">
              {{ item }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="columns">
    <div class="column">
      <span>Register:</span>
      <table class="table is-bordered is-striped is-narrow is-fullwidth">
        <thead>
          <th class="is-half">Register</th>
          <th class="is-half">Wert</th>
          <th></th>
        </thead>

        <tbody>
          <tr v-for="(item, index) in registerValues" :key="index">
            <td>
              {{ item.name }}
            </td>

            <td>
              {{
                item.name == "SP"
                  ? "0x" + item.value.toString(16).toUpperCase()
                  : item.value
              }}
            </td>

            <td>
              <button class="button is-small is-danger">
                <i class="fas fa-trash-alt"></i>
              </button>
            </td>
          </tr>

          <tr>
            <td colspan="3">
              <button class="button is-small is-success">
                <i class="fas fa-plus-circle" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="column">
      <span>Speicherbereich des Stacks:</span>
      <table class="table is-bordered is-striped is-narrow is-fullwidth">
        <thead>
          <th class="is-half">Adresse</th>
          <th class="is-half">Wert</th>
          <th></th>
        </thead>

        <tbody>
          <tr v-for="(item, index) in stack" :key="index">
            <td>
              {{ "0x" + item.name.toString(16).toUpperCase() }}
            </td>

            <td>
              {{ item.value }}
            </td>

            <td>
              <button class="button is-small is-danger">
                <i class="fas fa-trash-alt"></i>
              </button>
            </td>
          </tr>

          <tr>
            <td colspan="3">
              <button class="button is-small is-success">
                <i class="fas fa-plus-circle" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="columns">
    <div class="column">
      <span>Instruktionen:</span>

      <br />

      <div
        style="background: rgb(240, 240, 240); padding: 10px; margin: 5px 0px"
      >
        Beispiele:
      </div>

      <textarea class="textarea"></textarea>
    </div>
  </div>

  <button class="button is-info is-fullwidth">Simulate</button>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";

let adresses = ref([
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
]);

let adressValues = ref([
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
]);

let registerValues = ref([
  { name: "R1", value: 1 },
  { name: "R2", value: 0 },
  { name: "R3", value: 3 },
  { name: "SP", value: 0xffff },
]);

let stack = ref([
  { name: 0xffff, value: 5 },
  { name: 0xfffd, value: 2 },
  { name: 0xfffe, value: 4 },
  { name: 0xffff, value: 7 },
]);

export default defineComponent({
  components: {},
  setup() {
    return { adresses, adressValues, registerValues, stack };
  },
});
</script>

<style scoped>
table {
  text-align: center;
}

tr,
td,
td button {
  height: 25px !important;
}

td button {
  width: 25px;
}

.is-half {
  width: 50%;
}
</style>