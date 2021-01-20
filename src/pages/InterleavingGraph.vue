<template>
  <h1>Interleaving</h1>
  <div class="columns">
    <div id="mynetwork" class="column"></div>
    <div class="column" style="display: flex; flex-direction: column">
      <h3>Variables</h3>
      <div ref="monaco-editor-variables" style="height: 2em"></div>

      <div class="columns" style="flex-grow: 1">
        <div class="column" style="display: flex; flex-direction: column">
          <h3>Thread 1</h3>
          <div ref="monaco-editor-thread-1" style="flex-grow: 1"></div>
        </div>
        <div class="column" style="display: flex; flex-direction: column">
          <h3>Thread 2</h3>
          <div ref="monaco-editor-thread-2" style="flex-grow: 1"></div>
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
import {
  Network,
  Edge as VisEdge,
  Node as VisNode,
  Options,
} from "vis-network";
import { DataSet } from "vis-data";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";
import { useMonaco } from "../monaco/use-monaco";

function lineNumberToLetters(lineNumber: number) {
  let output = "";
  let aCharCode = "A".charCodeAt(0);

  while (lineNumber > 0) {
    let lastPart = (lineNumber - 1) % 26;
    output = String.fromCharCode(aCharCode + lastPart) + output;
    lineNumber = Math.floor((lineNumber - lastPart) / 26);
  }

  return output;
}

export default {
  components: {},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);

    const monacoEditorVariables = ref<HTMLElement>();
    const monacoEditorThread1 = ref<HTMLElement>();
    const monacoEditorThread2 = ref<HTMLElement>();

    const variablesCode = urlRef(
      "variablesCode",
      "let U = 0, T = 0, V = 0, W = 0"
    );
    const thread1Code = urlRef("thread1Code", "\n\n\n");
    const thread2Code = urlRef("thread2Code", "\n\n\n");

    const threadsInstructions = shallowRef<{
      variableNames: string[];
      initialState: object;
      instructions: Function[][];
    }>();

    useMonaco().then((monaco) => {
      const { code, getVariableNames } = monaco.createEditor(
        monacoEditorVariables,
        {
          value: variablesCode.value,
          language: "javascript",
          minimap: {
            enabled: false,
          },
          lineNumbers: function (original) {
            return `Setup`;
          },
        }
      );
      watchEffect(() => (variablesCode.value = code.value));

      const thread1Monaco = monaco.createEditor(monacoEditorThread1, {
        value: thread1Code.value,
        language: "javascript",
        minimap: {
          enabled: false,
        },
      });
      watchEffect(() => (thread1Code.value = thread1Monaco.code.value));

      const thread2Monaco = monaco.createEditor(monacoEditorThread2, {
        value: thread2Code.value,
        language: "javascript",
        minimap: {
          enabled: false,
        },
        lineNumbers: function (original) {
          return lineNumberToLetters(original);
        },
      });
      watchEffect(() => (thread2Code.value = thread2Monaco.code.value));

      async function getThreadsInstructions() {
        const variableNames = await getVariableNames();

        const threadCodes = [thread1Code.value, thread2Code.value];

        const threadsInstructions = threadCodes.map((v) => {
          const lines = v.trimEnd().split("\n");
          return lines.map((line) =>
            Function.apply(null, [
              `{ ${variableNames.join(",")} }`,
              `try { ${line}; } catch(e) { console.warn(e); } return { ${variableNames.join(
                ","
              )} };`,
            ])
          );
        });

        const getInitialState = Function.apply(null, [
          `${code.value}; return { ${variableNames.join(",")} };`,
        ]);

        return {
          variableNames: variableNames,
          initialState: getInitialState(),
          instructions: threadsInstructions,
        };
      }

      let timerId = 0;
      watch(
        [code, thread1Monaco.code, thread2Monaco.code],
        (value) => {
          clearTimeout(timerId);

          timerId = setTimeout(async () => {
            timerId = 0;
            threadsInstructions.value = await getThreadsInstructions();
          }, 500);
        },
        { immediate: true }
      );
    });

    watch(
      threadsInstructions,
      (value) => {
        if (!value) return;

        let instructionsSet1 = value.instructions[0].map((v, i) => {
          return {
            label: "" + (i + 1),
            operation: v,
          } as Instruction;
        });

        let instructionsSet2 = value.instructions[1].map((v, i) => {
          return {
            label: "" + lineNumberToLetters(i + 1),
            operation: v,
          } as Instruction;
        });

        let thread1: Thread = {
          label: "ThreadA",
          instructions: instructionsSet1,
          instructionPointer: 0,
        };

        let thread2: Thread = {
          label: "ThreadB",
          instructions: instructionsSet2,
          instructionPointer: 0,
        };

        let resultNodes = Array.from(
          { length: thread2.instructions.length + 1 },
          (v1, i) =>
            Array.from({ length: thread1.instructions.length + 1 }, (v2, j) => {
              return {
                states: [],
                edges: [],
                id: j * (thread2.instructions.length + 1) + i,
              } as Node;
            })
        );

        resultNodes[0][0].states.push(value.initialState as any);

        generateGraphNetwork(thread1, thread2, resultNodes);
        showGraphNetwork(resultNodes, value.variableNames);
      },
      { immediate: true }
    );
    return {
      "monaco-editor-variables": monacoEditorVariables,
      "monaco-editor-thread-1": monacoEditorThread1,
      "monaco-editor-thread-2": monacoEditorThread2,
    };
  },
};

function showGraphNetwork(resultNodes: Node[][], variableNames: string[]) {
  let visNodes = [] as VisNode[];
  let visEdges = [] as VisEdge[];

  let counter = 0;

  for (let i = 0; i < resultNodes.length; i++) {
    for (let j = 0; j < resultNodes[i].length; j++) {
      let node = resultNodes[i][j];
      visNodes.push({
        id: node.id,
        label: node.states
          .map((state) => `(${variableNames.map((v) => state[v]).join(",")})`)
          .join("\n"),
        x: j * 10,
        y: i * 10,
      });

      node.edges.forEach((edge) => {
        visEdges.push({
          id: counter++,
          from: node.id,
          to: edge.nextNode.id,
          label: edge.instruction.label,
        });
      });
    }
  }

  let data = {
    nodes: new DataSet<VisNode, "id">(visNodes),
    edges: new DataSet<VisEdge, "id">(visEdges),
  };

  let container = document.getElementById("mynetwork");
  if (!container) return;
  let options: Options = {
    nodes: { shape: "box" },
    edges: { arrows: "to" },
  };

  let network = new Network(container, data, options); // TODO: HTML Ref
}

function generateGraphNetwork(
  threadA: Thread,
  threadB: Thread,
  resultNodes: Node[][]
) {
  let currentNode =
    resultNodes[threadB.instructionPointer][threadA.instructionPointer];

  if (threadA.instructionPointer < threadA.instructions.length) {
    let instruction = threadA.instructions[threadA.instructionPointer];
    let newStates = executeInstruction(instruction, currentNode);
    let threadCopy = { ...threadA };

    threadCopy.instructionPointer++;

    let nextNode =
      resultNodes[threadB.instructionPointer][threadCopy.instructionPointer];
    // TODO: check if state already exists

    for (let state of newStates) {
      if (isStateUnique(state, nextNode.states)) {
        nextNode.states.push(state);
      }
    }

    let edge = { nextNode: nextNode, instruction: instruction };

    if (!edgeAlreadyExists(currentNode.edges, edge)) {
      currentNode.edges.push(edge);
    }

    generateGraphNetwork(threadCopy, threadB, resultNodes);
  }

  if (threadB.instructionPointer < threadB.instructions.length) {
    let instruction = threadB.instructions[threadB.instructionPointer];

    let newStates = executeInstruction(instruction, currentNode);
    let threadCopy = { ...threadB };
    threadCopy.instructionPointer++;

    let nextNode =
      resultNodes[threadCopy.instructionPointer][threadA.instructionPointer];
    // TODO: check if state already exists

    for (let state of newStates) {
      if (isStateUnique(state, nextNode.states)) {
        nextNode.states.push(state);
      }
    }

    let edge = { nextNode: nextNode, instruction: instruction };

    if (!edgeAlreadyExists(currentNode.edges, edge)) {
      currentNode.edges.push(edge);
    }

    generateGraphNetwork(threadA, threadCopy, resultNodes);
  }

  function executeInstruction(
    instruction: Instruction,
    currentNode: Node
  ): State[] {
    let resultStates: State[] = [];
    for (let state of currentNode.states) {
      let stateCopy = { ...state };
      resultStates.push(instruction.operation(stateCopy) as any);
    }
    return resultStates;
  }
}

function edgeAlreadyExists(edges: Edge[], current: Edge) {
  for (let edge of edges) {
    if (
      edge.nextNode === current.nextNode &&
      edge.instruction === current.instruction
    ) {
      return true;
    }
  }
  return false;
}

interface State {
  [key: string]: number;
}

function isStateUnique(state: State, states: State[], index: number = -1) {
  for (let k = index + 1; k < states.length; k++) {
    if (areStatesEqual(state, states[k])) {
      return false;
    }
  }
  return true;
}

function areStatesEqual(stateA: State, stateB: State): boolean {
  const keys1 = Object.keys(stateA);
  const keys2 = Object.keys(stateB);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (stateA[key] !== stateB[key]) {
      return false;
    }
  }

  return true;
}

interface Thread {
  label: string;
  instructions: Instruction[];
  instructionPointer: 0;
}

interface Instruction {
  label: string;
  operation: (state: State) => void;
}

interface Node {
  id: number;
  states: State[];
  edges: Edge[];
}

interface Edge {
  nextNode: Node;
  instruction: Instruction;
}
</script>

<style scoped>
#mynetwork {
  height: 800px;
  border: 1px solid lightgray;
}
</style>

<style>
.monaco-editor .line-numbers {
  cursor: text !important;
}
</style>