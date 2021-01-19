<template>
  <div class="columns">
    <div class="column">
      <div class="columns">
        <div class="column">
          <span>Initialer Speicher: </span>

          <table class="table is-bordered is-striped is-narrow is-fullwidth">
            <thead>
              <th>Adresse:</th>
              <th v-for="(item, index) in adresses" :key="index">{{ item }}</th>
            </thead>

            <tbody>
              <tr>
                <td>Wert:</td>
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
            </thead>

            <tbody>
              <tr v-for="(item, index) in stack" :key="index">
                <td>
                  {{ "0x" + item.name.toString(16).toUpperCase() }}
                </td>

                <td>
                  {{ item.value }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="column">
      <div class="columns">
        <div class="column">
          <span>Instruktionen:</span>

          <textarea class="textarea"></textarea>
        </div>
      </div>

      <div class="columns">
        <div class="column">
          <button class="button is-info is-fullwidth">Run</button>
        </div>

        <div class="column">
          <button class="button is-info is-fullwidth">Step</button>
        </div>

        <div class="column">
          <button class="button is-danger is-fullwidth">Reset</button>
        </div>
      </div>
    </div>
  </div>
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

let stackPointer = ref(0xffff);

export default defineComponent({
  components: {},
  setup() {
    return { adresses, adressValues, registerValues, stack, stackPointer };
  },
});
</script>

<style scoped>
table {
  text-align: center;
  vertical-align: middle;
}

td button {
  height: 25px;
  width: 25px;
}

.is-half {
  width: 50%;
}
</style>