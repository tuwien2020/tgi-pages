<template>
  <div>pipeline</div>
</template>

<script lang="ts">
//test commit

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

  return {
    nextCommands,
    step,
    parseCommand,
    pipelineToString,
  };
}

export default defineComponent({
  components: {},
  setup() {
    const count = ref(0);

    const pipelineSimulator = usePipelineSimulator([
      { name: "fetch", isRead: false, isWrite: false },
      { name: "decode", isRead: true, isWrite: false },
      { name: "execute", isRead: false, isWrite: false },
      { name: "store", isRead: false, isWrite: true },
    ]);

    pipelineSimulator.nextCommands.push(
      pipelineSimulator.parseCommand("ADD", ["R1", "R2"], ["R1"]),
      pipelineSimulator.parseCommand("PUSH", ["R2"], []),
      pipelineSimulator.parseCommand("INC", ["R1"], ["R1"]),
      pipelineSimulator.parseCommand("DIV", ["R3", "R4"], ["R5"]),
      pipelineSimulator.parseCommand("SUB", ["R5", "R1"], ["R6"]),
      pipelineSimulator.parseCommand("MULT", ["R5", "R6"], ["R1"]),
      pipelineSimulator.parseCommand("POP", [], ["R3"])
    );

    console.clear();
    for (let i = 0; i < 15; i++) {
      pipelineSimulator.step();
      console.log(i + 1, pipelineSimulator.pipelineToString());
    }

    return {
      count,
    };
  },
});
</script>