<template>
  <div class="columns is-full-height">
    <div class="column">
      <div class="columns">
        <div class="column">
          <h4 class="no-margin">Memory</h4>

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
          <h4 class="no-margin">Register</h4>

          <table
            class="table is-bordered is-striped is-narrow is-fullwidth"
            v-for="(section, idxRegister) in simulator.registerSections.value"
            :key="idxRegister"
          >
            <thead>
              <th class="is-half">Register</th>
              <th class="is-half">Wert (Hex)</th>
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
          <h4 class="no-margin">Speicherbereich des Stacks:</h4>
          <table class="table is-bordered is-striped is-narrow is-fullwidth">
            <thead>
              <th class="is-half">Adresse</th>
              <th class="is-half">Wert</th>
            </thead>

            <tbody>
              <tr
                v-for="(item, index) in simulator.memory.value.slice(
                  simulator.stackSizeDisplay.value.from,
                  simulator.stackSizeDisplay.value.to + 1
                )"
                :key="index"
              >
                <td
                  :class="{
                    stackpointer:
                      simulator.stackSizeDisplay.value.from + index ==
                      simulator.stackpointer.value,
                  }"
                >
                  {{ toHex(simulator.stackSizeDisplay.value.from + index) }}
                </td>

                <td>
                  {{ item }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="columns">
        <div>
          <h4 class="no-margin">Debug log</h4>
          <div class="is-family-monospace">
            <div
              v-for="(item, index) in simulator.outputLog.value"
              :key="index"
              class="is-family-monospace"
            >
              <span
                :class="{
                  warning: item.type == 'warning',
                  error: item.type == 'error',
                }"
              >
                {{ item.message }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="column">
      <div class="card" style="height: 25%">
        <div class="card-content" style="height: 100%">
          <h4 class="no-margin">Setup</h4>
          <div ref="monaco-editor-setup" style="height: 100%"></div>
        </div>
      </div>

      <br />
      <br />

      <div class="card" style="height: 50%">
        <div class="card-content" style="height: 100%">
          <h4 class="no-margin">Instructions</h4>
          <div ref="monaco-editor-instructions" style="height: 100%"></div>
        </div>
      </div>

      <br />
      <br />

      <div class="columns is-full">
        <div class="column">
          <button class="button is-info is-fullwidth" @click="runCode">
            Run
          </button>
        </div>

        <div class="column">
          <button class="button is-info is-fullwidth" @click="step">
            {{ steppingLineNumber == 0 ? "Debug" : "Step" }}
          </button>
        </div>

        <div class="column">
          <button class="button is-danger is-fullwidth" @click="reset">
            Reset
          </button>
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
  toRaw,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";
import { useMonaco } from "../monaco/use-monaco";

interface Section {
  readonly from: number;
  readonly to: number;
}

interface LogMessage {
  readonly type: "info" | "warning" | "error";
  readonly message: string;
}

function toHex(number: number) {
  if (number === null || number === undefined) return "";
  return number.toString(16).toUpperCase();
}

function createSimulator() {
  const register = ref<number[]>([]);
  const stackpointer = ref(0);
  const memory = ref<number[]>([]);
  const memorySections = ref<Section[]>([]);
  const registerSections = ref<Section[]>([]);
  const stackSizeDisplay = ref<Section>({ from: 0, to: 0 });
  const outputLog = ref<LogMessage[]>([]);

  watch(
    stackpointer,
    (value) => {
      stackSizeDisplay.value = {
        from: Math.min(stackSizeDisplay.value.from, value),
        to: Math.max(stackSizeDisplay.value.to, value),
      };
    },
    {
      immediate: true,
      flush: "sync",
    }
  );

  function push(reg: number) {
    memory.value[stackpointer.value] = register.value[reg];
    stackpointer.value--;
  }

  function pop(reg: number) {
    stackpointer.value++;
    register.value[reg] = memory.value[stackpointer.value];
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
    let l = fillArray(memeories, offset, memory.value);
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
    stackSizeDisplay.value = { from: address, to: address };
  }

  function print(message: any): any {
    outputLog.value.push({
      type: "info",
      message: "" + message,
    });
    return message;
  }

  const consoleProxy = new Proxy(console, {
    get(target, propKey, receiver) {
      const originalMethod = (target as any)[propKey];

      if (propKey == "log" || propKey == "info") {
        return function (...args: any[]) {
          outputLog.value.push({
            type: "info",
            message: "" + args,
          });
        };
      } else if (propKey == "warn") {
        return function (...args: any[]) {
          outputLog.value.push({
            type: "warning",
            message: "" + args,
          });
        };
      } else if (propKey == "error" || propKey == "exception") {
        return function (...args: any[]) {
          outputLog.value.push({
            type: "error",
            message: "" + args,
          });
        };
      }
    },
  });

  function getExposedVariables() {
    const internalMemory = toRaw(memory.value);

    const memoryProxy = new Proxy(internalMemory, {
      get(target, prop, receiver) {
        if (typeof prop == "string") {
          const index = +prop;
          if (!isNaN(index)) {
            print(`read(${toHex(index)})[${target[index]}]`);
          } else {
            print(`get memory ${String(prop)}`);
          }
        } else {
          print(`get memory ${String(prop)}`);
        }
        return Reflect.get(target, prop, receiver);
      },
      set(target, prop, val, receiver) {
        if (typeof prop == "string") {
          const index = +prop;
          if (!isNaN(index)) {
            print(`write(${toHex(index)})=${toHex(val)}`);
          } else {
            print(`set memory ${String(prop)} = ${val}`);
          }
        } else {
          print(`set memory ${String(prop)} = ${val}`);
        }
        return Reflect.set(target, prop, val, receiver); // (2)
      },
    });

    return {
      push: push,
      pop: pop,
      fillStack: fillStack,
      fillMemory: fillMemory,
      fillRegister: fillRegister,
      setStackPointer: setStackPointer,
      print: print,

      register: register.value,
      reg: register.value,
      r: register.value,
      // memory: memory.value,
      //  mem: memory.value,
      memory: memoryProxy,
      mem: memoryProxy,

      console: consoleProxy,
    };
  }

  return {
    register,
    stackpointer,
    memory,
    memorySections,
    registerSections,
    stackSizeDisplay,
    fillStack,
    fillMemory,
    fillRegister,
    setStackPointer,
    print,
    outputLog,
    consoleProxy,
    getExposedVariables,
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

    const steppingLineNumber = ref(0);
    let steppingGenerator: null | Generator;

    const setupCode = urlRef(
      "setupCode",
      `fillMemory("5 1 B 5 5 C A F F C B 3 4 7 E 1", 0);
fillRegister("1 0 3", 1);
fillStack("5 2 4 7", 0xfffc);
setStackPointer(0xffff);`
    );

    const instructionCode = urlRef(
      "instructionCode",
      `// R3 <- 17
r[3] = 17;

// R1 <- memory[R1]
r[1] = memory[r[1]];

// R2 <- memory[memory[B]]
r[2] = memory[memory[0xb]];

// push(R1)
push(1);

// push(R2)
push(2);

// memory[-(R1)] <- memory[F]
memory[--r[1]] = memory[0xf];

// pop(R3)
pop(3);

// memory[(R2)+] <- memory[E]
memory[r[2]++] = memory[0xe];`
    );

    useMonaco().then((monaco) => {
      monaco.addExtraLib(`declare function push(reg: number): void;
declare function pop(reg: number): void;
declare function fillStack(memeories: string, offset: number = 0): void;
declare function fillMemory(memeories: string, offset: number = 0): void;
declare function fillRegister(memeories: string, offset: number = 0): void;
declare function setStackPointer(address: number): void;
declare function print(message: any): any;
declare const register: number[];
declare const reg: number[];
declare const r: number[];
declare const memory: number[];
declare const mem: number[];`);

      const setupEditor = monaco.createEditor(monacoEditorSetup, {
        value: setupCode.value,
        language: "javascript",
        minimap: {
          enabled: false,
        },
        scrollBeyondLastLine: false,
        scrollbar: {
          vertical: "visible",
          horizontal: "visible",
          useShadows: false,
        },
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
        scrollbar: {
          vertical: "visible",
          horizontal: "visible",
          useShadows: false,
        },
      });

      watchEffect(() => {
        instructionsEditor.setLinePointer(steppingLineNumber.value);
      });

      watchEffect(() => {
        instructionCode.value = instructionsEditor.code.value;
      });

      runCode();
    });

    function runSetup(exposedVariables: object) {
      const setupFunction = Function.apply(null, [
        `{ ${Object.keys(exposedVariables).join(",")} }`,
        `try { ${setupCode.value}; } catch(e) { console.warn(e); }`,
      ]);

      setupFunction(exposedVariables);
    }

    function runCode() {
      steppingLineNumber.value = 0;
      steppingGenerator = null;

      simulator.value = createSimulator();
      const exposedVariables = simulator.value.getExposedVariables();
      runSetup(exposedVariables);

      /*
      

      

      watch(simulator.value.register, (value) => {}, {
        onTrack: (e) => {
          console.log("track", e);
        },
        onTrigger: (e) => {
          console.log(e);
          //debugger;
        },
        deep: true,
        flush: "sync"
      });*/

      const instructionsFunction = Function.apply(null, [
        `{ ${Object.keys(exposedVariables).join(",")} }`,
        `try { ${instructionCode.value}; } catch(e) { console.warn(e); }`,
      ]);

      instructionsFunction(exposedVariables);
    }

    function reset() {
      steppingLineNumber.value = 0;
      steppingGenerator = null;

      simulator.value = createSimulator();
      const exposedVariables = simulator.value.getExposedVariables();
      runSetup(exposedVariables);
    }

    function step() {
      if (steppingLineNumber.value == 0) {
        steppingLineNumber.value = 1;
        simulator.value = createSimulator();
        const exposedVariables = simulator.value.getExposedVariables();
        runSetup(exposedVariables);

        const GeneratorFunction = Object.getPrototypeOf(function* () {})
          .constructor;

        steppingGenerator = GeneratorFunction.apply(null, [
          `{ ${Object.keys(exposedVariables).join(",")} }`,
          `try { ${instructionCode.value
            .split("\n")
            .map((v, i) => v + `; yield ${i + 1};`)
            .join("\n")}; } catch(e) { console.warn(e); }`,
        ])(exposedVariables);
      } else {
        if (steppingGenerator == null) {
          console.warn("The code-executing generator object is null");
          steppingLineNumber.value = 0;
          return;
        }
        steppingLineNumber.value =
          (steppingGenerator?.next()?.value as any) ?? 0;
      }
    }

    return {
      "monaco-editor-setup": monacoEditorSetup,
      "monaco-editor-instructions": monacoEditorInstructions,
      setupCode,
      instructionCode,
      toHex,
      runCode,
      reset,
      step,
      simulator,
      steppingLineNumber,
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

.is-full-height {
  height: 100%;
}

.shadow {
  /* border: 1px solid black; */
  overflow: hidden;
  -webkit-box-shadow: 0px 0px 6px 2px rgba(0, 0, 0, 0.25);
  -moz-box-shadow: 0px 0px 6px 2px rgba(0, 0, 0, 0.25);
  box-shadow: 0px 0px 6px 2px rgba(0, 0, 0, 0.25);
}

.warning {
  background-color: #fffbd6;
  border: 1px solid #f4e89a;
}
.error {
  background-color: #fdf2f5;
  border: 1px solid #f8d5db;
}

.no-margin {
  margin: 0px;
}

.stackpointer::before {
  position: absolute;
  content: ">";
  margin-left: -30px;
  font-weight: bolder;
}
</style>