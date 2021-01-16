<template>
  <div>
    <h4 style="margin: 2px 0px">General settings:</h4>

    <p style="margin: 0px 15px">
      - Read & Write: <input type="checkbox"/>
    </p>
  </div>
  
  <div style="margin: 50px 0px; float: left; width: 50%" >
    <table class="inputTable">
      <thead>
        <th>Stage</th>
        <th>Read</th>
        <th>Write</th>
        <th>Add</th>
      </thead>

      <tbody>
        <tr 
          v-for="(row, index) in stages"
          :key="index"
        >
          <td>
            <input type="text" placeholder="Name" v-model="row.name"/> 
          </td>

          <td>
            <input type="checkbox" v-model="row.isRead"/> 
          </td>

          <td>
            <input type="checkbox" v-model="row.isWrite"/>
          </td>

          <td>
            <button @click="onAddStage({ name: null, isRead: false, isWrite: false }, index+1)">+</button>
          </td>
        </tr>
      </tbody>
    </table>

    <br />

    <table class="inputTable">
      <thead>
        <th>Name</th>
        <th>Register Read</th>
        <th>Register Write</th>
        <th>Add</th>
      </thead>

      <tbody>
        <tr 
          v-for="(row, index) in commands"
          :key="index"
        >
          <td>
            <input type="text" placeholder="Name" v-model="row.name"/> 
          </td>

          <td>
            <input 
              type="text" 
              placeholder="R1, R2, ..."  
              :value="row.readRegisters.map(d => 'R' + d)" 
              @input="(event) => {row.readRegisters = event.target.value.replaceAll('R', '').split(',').map(d => +d)}"
            /> 
          </td>

          <td>
            <input type="text" 
              placeholder="R1, R2, ..."  
              :value="row.writeRegisters.map(d => 'R' + d)" 
              @input="(event) => {row.writeRegisters = event.target.value.replaceAll('R', '').split(',').map(d => +d)}"
            />
          </td>

          <td>
            <button @click="onAddCommand({name: null, readRegisters: [], writeRegisters: [] }, index+1)">+</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div>
    <table class="pipelineTable">
      <thead>
        <th>#</th>

        <th
          v-for="(row, index) in stages"
          :key="index"
        >
          {{ ((row || {}).name||"").toUpperCase() }}
        </th>
      </thead>

      <tr 
        v-for="(row, index) in pipelineStates"
        :key="index"
        tabindex="0"
      >
        <td>{{ index+1 }}</td>
        <td v-for="(item, itemIndex) in row" :key="itemIndex">
          {{ (item || {}).name }}
        </td>
      </tr>
    </table>
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

  function isEmpty(){
    return pipeline.filter(d => !!d).length === 0;
  }

  function run(){
    // 2D-Array to return
    let pipelineStates = [];

    // run through Pipeline-states
    step();
    while(!isEmpty()){
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

export default defineComponent({
  components: {},
  setup() {
    const count = ref(0);

    // Pipeline-Stages
    let stages = ref<PipelineStage[]>([
      { name: "fetch", isRead: false, isWrite: false },
      { name: "decode", isRead: true, isWrite: false },
      { name: "execute", isRead: false, isWrite: false },
      { name: "store", isRead: false, isWrite: true },
    ]);

    let pipelineSimulator = usePipelineSimulator(stages.value);
    watch(stages, (newStages) => pipelineSimulator = usePipelineSimulator(newStages), {deep: true});
    
    let onAddStage = (element:PipelineStage, index:number) => {
      stages.value.splice(index, 0, element);
    };

    // Commands
    let commands = ref<PipelineCommand[]>([
      pipelineSimulator.parseCommand("ADD", ["R1", "R2"], ["R1"]),
      pipelineSimulator.parseCommand("PUSH", ["R2"], []),
      pipelineSimulator.parseCommand("INC", ["R1"], ["R1"]),
      pipelineSimulator.parseCommand("DIV", ["R3", "R4"], ["R5"]),
      pipelineSimulator.parseCommand("SUB", ["R5", "R1"], ["R6"]),
      pipelineSimulator.parseCommand("MULT", ["R5", "R6"], ["R1"]),
      pipelineSimulator.parseCommand("POP", [], ["R3"]),
    ]);
    
    pipelineSimulator.nextCommands.push(...commands.value);
    watch(commands, (newCommands) => pipelineSimulator.nextCommands.push(...newCommands), {deep: true});
    
    let onAddCommand = (element:PipelineCommand, index:number) => {
      commands.value.splice(index, 0, element);
    };

    // Run
    let pipelineStates = pipelineSimulator.run();

    return {
      count,
      pipelineStates,
      stages,
      onAddStage,
      commands,
      onAddCommand,
    };
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

.inputTable td{
  padding: 4px;
  text-align: center;
}

input[type="checkbox"]{
  transform: scale(1.4);
}

</style>