<template>
  <div class="flexbox">
    <div class="item1">
      <h4 style="margin: 25px 0px 2px 0px">General settings:</h4>

      <ul style="margin: 0px 15px">
        <li>Read & Write: <input type="checkbox" /></li>
      </ul>

      <h4 style="margin: 25px 0px 2px 0px">Stages:</h4>

      <table class="inputTable">
        <thead>
          <th>Name</th>

          <th>Read</th>

          <th>Write</th>

          <th />
        </thead>

        <tbody>
          <tr v-for="(row, index) in pipelineStages" :key="index">
            <td>
              <input type="text" placeholder="Name" v-model="row.name" />
            </td>

            <td>
              <input type="checkbox" v-model="row.isRead" />
            </td>

            <td>
              <input type="checkbox" v-model="row.isWrite" />
            </td>

            <td>
              <button style="width: 100%" class="btnDelete">
                <i class="fas fa-trash-alt" style="font-size: 20px" />
              </button>
            </td>
          </tr>

          <tr>
            <td colspan="4">
              <button style="width: 100%" class="btnAdd">
                <i class="fas fa-plus-circle" style="font-size: 20px" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <h4 style="margin: 25px 0px 2px 0px">Commands:</h4>

      <table class="inputTable">
        <thead>
          <th>Name</th>

          <th>Read Register</th>

          <th>Write Register</th>

          <th />
        </thead>

        <tbody>
          <tr v-for="(row, index) in pipelineCommands" :key="index">
            <td>
              <input type="text" placeholder="Name" />
            </td>

            <td>
              <input type="text" placeholder="R1, R2, ..." />
            </td>

            <td>
              <input type="text" placeholder="R1, R2, ..." />
            </td>

            <td>
              <button style="width: 100%" class="btnDelete">
                <i class="fas fa-trash-alt" style="font-size: 20px" />
              </button>
            </td>
          </tr>

          <tr>
            <td colspan="4">
              <button style="width: 100%" class="btnAdd">
                <i class="fas fa-plus-circle" style="font-size: 20px" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <button style="margin: 25px 0px 2px 0px; width: 100%; height: 25px">
        Run
      </button>
    </div>

    <div class="item2">
      <table class="pipelineTable">
        <thead>
          <th>#</th>

          <th v-for="(row, index) in pipelineStages" :key="index">
            {{ (row || {}).name }}
          </th>
        </thead>

        <tr v-for="(row, index) in pipelineStates" :key="index">
          <td>
            {{ index + 1 }}
          </td>

          <td v-for="(item, itemIndex) in row" :key="itemIndex">
            {{ (item || {}).name }}
          </td>
        </tr>
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

function usePipelineSimulator(stages: PipelineStage[]) {
  const nextCommands = [] as PipelineCommand[];
  const pipeline = new Array<PipelineCommand | null>(stages.length).fill(null);
  const canReadWhileWrite = false;

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
  // Pipeline-Stages
  let pipelineStages = ref<PipelineStage[]>([
    { name: "FETCH", isRead: false, isWrite: false },
    { name: "DECODE", isRead: true, isWrite: false },
    { name: "EXECUTE", isRead: false, isWrite: false },
    { name: "STORE", isRead: false, isWrite: true },
  ]);

  let pipelineSimulator = usePipelineSimulator(pipelineStages.value);

  // Commands
  let pipelineCommands = ref<PipelineCommand[]>([
    pipelineSimulator.parseCommand("ADD", ["R1", "R2"], ["R1"]),
    pipelineSimulator.parseCommand("PUSH", ["R2"], []),
    pipelineSimulator.parseCommand("INC", ["R1"], ["R1"]),
    pipelineSimulator.parseCommand("DIV", ["R3", "R4"], ["R5"]),
    pipelineSimulator.parseCommand("SUB", ["R5", "R1"], ["R6"]),
    pipelineSimulator.parseCommand("MULT", ["R5", "R6"], ["R1"]),
    pipelineSimulator.parseCommand("POP", [], ["R3"]),
  ]);

  pipelineSimulator.nextCommands.push(...pipelineCommands.value);

  // Run
  let pipelineStates = pipelineSimulator.run();

  return {
    pipelineStages,
    pipelineCommands,
    pipelineStates,
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
.pipelineTable td:hover,
.pipelineTable td:focus {
  background-color: #f1f1f1;
}

.pipelineTable {
  font-family: "Consolas", "Courier New", Courier, monospace;
  text-align: center;
  overflow: hidden;
}

.inputTable td {
  padding: 4px;
  text-align: center;
}

input[type="checkbox"] {
  transform: scale(1.4);
}

.flexbox {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
}

ul {
  list-style-type: "- ";
}

.btnAdd {
  background: white;
  color: rgb(133, 133, 133);
  border: none;
  cursor: pointer;
  outline: none;
}

.btnAdd:hover {
  color: #198754;
  border: none;
  cursor: pointer;
  outline: none;
}

.btnDelete {
  background: white;
  color: rgb(133, 133, 133);
  border: none;
  cursor: pointer;
  outline: none;
}

.btnDelete:hover {
  color: #dc3545;
  border: none;
  cursor: pointer;
  outline: none;
}
</style>