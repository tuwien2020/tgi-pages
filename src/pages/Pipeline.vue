<template>
  <div class="columns">
    <div class="column">
      <b>General settings:</b>

      <ul>
        <li>
          <label class="checkbox">
            <input type="checkbox" />
            <span style="margin-left: 10px">Read and write</span>
          </label>
        </li>
      </ul>

      <br />

      <b>Stages:</b>

      <table class="table is-striped is-bordered">
        <thead>
          <th>Name</th>

          <th>Read</th>

          <th>Write</th>

          <th />
        </thead>

        <tbody>
          <tr v-for="(row, index) in pipelineStages" :key="index">
            <td>
              <input
                class="input"
                type="text"
                placeholder="Name"
                v-model="row.name"
              />
            </td>

            <td>
              <input class="checkbox" type="checkbox" v-model="row.isRead" />
            </td>

            <td>
              <input class="checkbox" type="checkbox" v-model="row.isWrite" />
            </td>

            <td>
              <button
                class="button is-danger is-small"
                @click="onDeleteStage(index)"
              >
                <i class="fas fa-trash-alt" />
              </button>
            </td>
          </tr>

          <tr>
            <td colspan="4" style="text-align: center">
              <button @click="onAddStage" class="button is-success is-small">
                <i class="fas fa-plus-circle" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <span>Commands:</span>

      <table class="table is-striped is-bordered">
        <thead>
          <th>Name</th>

          <th>Read Register</th>

          <th>Write Register</th>

          <th />
        </thead>

        <tbody>
          <tr v-for="(row, index) in pipelineCommands" :key="index">
            <td>
              <input
                class="input"
                type="text"
                placeholder="Name"
                v-model="row.name"
              />
            </td>

            <td>
              <input
                class="input"
                type="text"
                placeholder="1, 2, ..."
                :value="row.readRegisters.join(',')"
                @blur="
                  (event) =>
                    (row.readRegisters = !!event.target.value
                      ? event.target.value.split(',').map((d) => +d)
                      : [])
                "
              />
            </td>

            <td>
              <input
                class="input"
                type="text"
                placeholder="1, 2, ..."
                :value="row.writeRegisters.join(',')"
                @blur="
                  (event) =>
                    (row.writeRegisters = !!event.target.value
                      ? event.target.value.split(',').map((d) => +d)
                      : [])
                "
              />
            </td>

            <td>
              <button
                class="button is-danger is-small"
                @click="onDeleteCommand(index)"
              >
                <i class="fas fa-trash-alt" />
              </button>
            </td>
          </tr>

          <tr>
            <td colspan="4" style="text-align: center">
              <button class="button is-success is-small" @click="onAddCommand">
                <i class="fas fa-plus-circle" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <button style="width: 100%" class="button is-info" @click="run">
        Run
      </button>
    </div>

    <div class="column">
      <table class="table is-striped is-bordered" v-if="!dirty">
        <thead>
          <th style="width: 50px">#</th>

          <th v-for="(row, index) in pipelineStages" :key="index">
            {{ (row || {}).name }}
          </th>
        </thead>

        <tbody>
          <tr v-for="(row, index) in pipelineStates" :key="index">
            <td>
              {{ index + 1 }}
            </td>

            <td v-for="(item, itemIndex) in row" :key="itemIndex">
              {{ (item || {}).name }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";

interface PipelineStage {
  readonly name: string;
  readonly isRead: boolean;
  readonly isWrite: boolean;
}

interface PipelineCommand {
  readonly name: string;
  readonly readRegisters: readonly number[];
  readonly writeRegisters: readonly number[];
}

function parseCommand(
  name: string,
  readRegisters: string[],
  writeRegisters: string[]
): PipelineCommand {
  return {
    name: name,
    readRegisters: readRegisters.map((v) => +v.replace(/r|R/, "")),
    writeRegisters: writeRegisters.map((v) => +v.replace(/r|R/, "")),
  };
}

function usePipelineSimulator(
  stages: PipelineStage[],
  commands: PipelineCommand[],
  canReadWhileWrite: boolean
) {
  const nextCommands = commands.slice();
  const pipeline = new Array<PipelineCommand | null>(stages.length).fill(null);

  function step() {
    const oldPipeline = pipeline.slice();

    let isStalled = false;

    for (let i = pipeline.length - 2; i >= 0; i--) {
      if (stages[i].isRead) {
        // Lookahead and potentially pause the pipeline
        const registersToRead = pipeline[i]?.readRegisters ?? [];

        for (let j = i + 1; j < pipeline.length; j++) {
          const registersToWrite =
            (canReadWhileWrite ? pipeline : oldPipeline)[j]?.writeRegisters ??
            [];

          const hasReadAfterWrite = registersToWrite.some((v) =>
            registersToRead.includes(v)
          );

          if (hasReadAfterWrite) {
            isStalled = true;
            break;
          }

          if (stages[j].isWrite) break;
        }

        if (isStalled) {
          // Hazard detected
        } else {
          pipeline[i + 1] = pipeline[i];
          pipeline[i] = null;
        }
      } else if (isStalled) {
        // Keep the current command
      } else {
        pipeline[i + 1] = pipeline[i];
        pipeline[i] = null;
      }
    }

    if (pipeline[0] == null) {
      pipeline[0] = nextCommands.shift() ?? null;
    }
  }

  function pipelineToString() {
    return pipeline.slice().map((v) => (v == null ? "<noop>" : v.name));
  }

  function isEmpty() {
    return pipeline.filter((d) => !!d).length === 0;
  }

  function run() {
    // 2D-Array to return
    let pipelineStates = [];

    // run through Pipeline-states
    step();
    while (!isEmpty()) {
      pipelineStates.push(pipeline.slice());
      step();
    }

    return pipelineStates;
  }

  return {
    nextCommands,
    step,
    parseCommand,
    pipelineToString,
    isEmpty,
    run,
  };
}

function setupPipeline() {
  let dirty = ref<boolean>(false);
  let readWhileWrite = ref<boolean>(false);

  // Pipeline-Stages
  let pipelineStages = ref<PipelineStage[]>([
    { name: "FETCH", isRead: false, isWrite: false },
    { name: "DECODE", isRead: true, isWrite: false },
    { name: "EXECUTE", isRead: false, isWrite: false },
    { name: "STORE", isRead: false, isWrite: true },
  ]);

  let onDeleteStage = (index: number) => {
    pipelineStages.value.splice(index, 1);
  };

  let onAddStage = () => {
    pipelineStages.value.push({ name: "", isRead: false, isWrite: false });
  };

  // Commands
  let pipelineCommands = ref<PipelineCommand[]>([
    parseCommand("ADD", ["R1", "R2"], ["R1"]),
    parseCommand("PUSH", ["R2"], []),
    parseCommand("INC", ["R1"], ["R1"]),
    parseCommand("DIV", ["R3", "R4"], ["R5"]),
    parseCommand("SUB", ["R5", "R1"], ["R6"]),
    parseCommand("MULT", ["R5", "R6"], ["R1"]),
    parseCommand("POP", [], ["R3"]),
  ]);

  let onDeleteCommand = (index: number) => {
    pipelineCommands.value.splice(index, 1);
  };

  let onAddCommand = () => {
    pipelineCommands.value.push(parseCommand("", [], []));
  };

  // Run
  let pipelineStates = ref<(PipelineCommand | null)[][]>();
  let run = () => {
    let pipelineSimulator = usePipelineSimulator(
      pipelineStages.value,
      pipelineCommands.value,
      readWhileWrite.value
    );
    pipelineStates.value = pipelineSimulator.run();
    dirty.value = false;
  };
  run();

  // watch for dirty
  watch(
    [pipelineStages, pipelineCommands, readWhileWrite],
    () => (dirty.value = true),
    {
      deep: true,
    }
  );

  let timeoutId = 0;
  watch(dirty, (value) => {
    clearTimeout(timeoutId);
    if (value) {
      timeoutId = setTimeout(() => {
        run();
      }, 500);
    }
  });

  return {
    pipelineStages,
    pipelineCommands,
    pipelineStates,
    dirty,
    readWhileWrite,
    onDeleteStage,
    onAddStage,
    onDeleteCommand,
    onAddCommand,
    run,
  };
}

export default defineComponent({
  components: {},
  setup() {
    return { ...setupPipeline() };
  },
});
</script>

<style scoped>
tr,
td,
th,
input[type="text"],
button {
  height: 25px !important;
}

button {
  width: 25px;
}

tr,
td,
th {
  text-align: center !important;
}

input[type="checkbox"] {
  transform: scale(1.5);
}

ul {
  list-style: none !important;
  margin: 0px 0px 0px 25px !important;
}

table {
  word-break: break-all;
}
</style>