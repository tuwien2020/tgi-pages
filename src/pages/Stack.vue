<template>
  <div class="columns is-full-height">
    <div class="column">
      <div class="columns">
        <div class="column">
          <span>Memory: </span>

          <table
            class="table is-bordered is-striped is-narrow is-fullwidth"
            v-for="(section, idxMemory) in simulator.memorySections.value"
            :key="idxMemory"
          >
            <thead>
              <th>Adresse:</th>
              <th
                v-for="address in section.to - section.from + 1"
                :key="address"
              >
                {{ toHex(address - 1 + section.from) }}
              </th>
            </thead>

            <tbody>
              <tr>
                <td>Wert:</td>
                <td
                  v-for="(item, index) in simulator.memory.value.slice(
                    section.from,
                    section.to + 1
                  )"
                  :key="index"
                >
                  {{ toHex(item) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="columns">
        <div class="column">
          <span>Register:</span>

          <table
            class="table is-bordered is-striped is-narrow is-fullwidth"
            v-for="(section, idxRegister) in simulator.registerSections.value"
            :key="idxRegister"
          >
            <thead>
              <th class="is-half">Register</th>
              <th class="is-half">Wert</th>
            </thead>

            <tbody>
              <tr
                v-for="(item, index) in simulator.register.value.slice(
                  section.from,
                  section.to + 1
                )"
                :key="index"
              >
                <td>
                  {{ "R" + (index + section.from) }}
                </td>

                <td>
                  {{ toHex(item) }}
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
              <tr
                v-for="(item, index) in !!simulator.stackSizeDisplay.value
                  ? simulator.stack.value.slice(
                      simulator.stackSizeDisplay.value.from,
                      simulator.stackSizeDisplay.value.to + 1
                    )
                  : simulator.stack.value.slice(simulator.stackpointer.value)"
                :key="index"
              >
                <td>
                  {{
                    toHex(
                      (!!simulator.stackSizeDisplay.value
                        ? simulator.stackSizeDisplay.value.from
                        : simulator.stackpointer.value) + index
                    )
                  }}
                </td>

                <td>
                  {{ item }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="column codingSection">
      <div class="columns grows">
        <div class="column">
          <span>Setup:</span>
          <div ref="monaco-editor-setup" style="height: 10em"></div>
          <span>Instructions:</span>
          <div ref="monaco-editor-instructions" style="height: 35em"></div>
        </div>
      </div>

      <div class="columns">
        <div class="column">
          <button class="button is-info is-fullwidth" @click="runCode">
            Run
          </button>
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
import {
  defineComponent,
  computed,
  ref,
  watch,
  watchEffect,
  onMounted,
  Ref,
  shallowRef,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";
import { useMonaco } from "../monaco/use-monaco";

interface Section {
  readonly from: number;
  readonly to: number;
}

function toHex(number: number) {
  return number.toString(16).toUpperCase();
}

function createSimulator() {
  const register = ref<number[]>([]);
  const stackpointer = ref(0);
  const memory = ref<number[]>([]);
  const stack = ref<number[]>([]);
  const memorySections = ref<Section[]>([]);
  const registerSections = ref<Section[]>([]);
  const stackSizeDisplay = ref<Section | null>(null);

  function push(reg: number) {
    stack.value[stackpointer.value] = register.value[reg];
    stackpointer.value--;
  }

  function pop(reg: number) {
    stackpointer.value++;
    register.value[reg] = stack.value[stackpointer.value];
  }

  function fillArray(memeories: string, offset: number = 0, array: number[]) {
    let elements = memeories.split(/\s+|,|;/).map((d) => parseInt(d, 16));
    elements = elements.filter((d) => !isNaN(d));

    for (let i = 0; i < elements.length; i++) {
      array[i + offset] = elements[i];
    }

    return elements.length;
  }

  function fillStack(memeories: string, offset: number = 0) {
    let l = fillArray(memeories, offset, stack.value);
  }

  function fillMemory(memeories: string, offset: number = 0) {
    let l = fillArray(memeories, offset, memory.value);
    memorySections.value.push({ from: offset, to: offset + l - 1 });
  }

  function fillRegister(memeories: string, offset: number = 0) {
    let l = fillArray(memeories, offset, register.value);
    registerSections.value.push({ from: offset, to: offset + l - 1 });
  }

  function setStackPointer(address: number) {
    stackpointer.value = address;
  }

  function setStackView(from: number, to: number) {
    stackSizeDisplay.value = { from, to };
  }

  /*
fillMemory("5 1 B 5 5 C A F F C B 3 4 7 E 1", 0);
fillRegister("1 0 3", 1);
fillStack("5 2 4 7", 0xfffc);
setStackPointer(0xfffe);
setStackView(0xfffc, 0xffff);*/

  // TODO: Proxy object for registers, memory (and stack)
  /*
  // R3 <- 17
  r[3] = 17;

  // pop(R3)
  pop(3);

  // R1 <- memory[R1]
  r[1] = memory[r[1]];

  // R2 <- memory[memory[B]]
  r[2] = memory[memory[0xb]];

  // push(R1)
  push(1);

  // push(R2)
  push(2);

  // push(R3)
  push(3);

  // push(R3)
  push(3);

  // memory[-(R1)] <- memory[F]
  memory[--r[1]] = memory[0xf];

  // pop(R3)
  pop(3);

  // memory[(R2)+] <- memory[E]
  memory[r[2]++] = memory[0xe];*/

  return {
    register,
    stackpointer,
    memory,
    stack,
    memorySections,
    registerSections,
    stackSizeDisplay,
    push,
    pop,
    fillStack,
    fillMemory,
    fillRegister,
    setStackPointer,
    setStackView,
  };
}

export default defineComponent({
  components: {},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);

    const monacoEditorSetup = ref<HTMLElement>();
    const monacoEditorInstructions = ref<HTMLElement>();

    const simulator = shallowRef<ReturnType<typeof createSimulator>>(
      createSimulator()
    );

    const setupCode = urlRef(
      "setupCode",
      `fillMemory("", 0);
fillRegister("", 0);
fillStack("", 0xffff);
setStackPointer(0xffff);
setStackView(0xfffc, 0xffff);`
    );

    const instructionCode = urlRef("instructionCode", "");

    useMonaco().then((monaco) => {
      monaco.addExtraLib(`declare function push(reg: number): void;
declare function pop(reg: number): void;
declare function fillStack(memeories: string, offset: number = 0): void;
declare function fillMemory(memeories: string, offset: number = 0): void;
declare function fillRegister(memeories: string, offset: number = 0): void;
declare function setStackPointer(address: number): void;
declare function setStackView(from: number, to: number): void;`);

      const setupEditor = monaco.createEditor(monacoEditorSetup, {
        value: setupCode.value,
        language: "javascript",
        minimap: {
          enabled: false,
        },
        scrollBeyondLastLine: false,
      });

      watchEffect(() => {
        setupCode.value = setupEditor.code.value;
      });

      const instructionsEditor = monaco.createEditor(monacoEditorInstructions, {
        value: instructionCode.value,
        language: "javascript",
        minimap: {
          enabled: false,
        },
        scrollBeyondLastLine: false,
      });

      watchEffect(() => {
        instructionCode.value = instructionsEditor.code.value;
      });

      runCode();
    });

    function runCode() {
      simulator.value = createSimulator();

      const exposedVariables = {
        push: simulator.value.push,
        pop: simulator.value.pop,
        fillStack: simulator.value.fillStack,
        fillMemory: simulator.value.fillMemory,
        fillRegister: simulator.value.fillRegister,
        setStackPointer: simulator.value.setStackPointer,
        setStackView: simulator.value.setStackView,

        register: simulator.value.register.value,
        reg: simulator.value.register.value,
        r: simulator.value.register.value,
        memory: simulator.value.memory.value,
        mem: simulator.value.memory.value,
      };

      const setupFunction = Function.apply(null, [
        `{ ${Object.keys(exposedVariables).join(",")} }`,
        `try { ${setupCode.value}; } catch(e) { console.warn(e); }`,
      ]);

      setupFunction(exposedVariables);
    }

    return {
      "monaco-editor-setup": monacoEditorSetup,
      "monaco-editor-instructions": monacoEditorInstructions,
      setupCode,
      instructionCode,
      toHex,
      runCode,
      simulator,
    };
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

#test {
  height: 75vh;
}

.is-full-height{
  height: 100%;
}

.grows{
  flex: 1 1 auto;
}

.codingSection{
  display: flex;
  flex-direction: column;
}
</style>