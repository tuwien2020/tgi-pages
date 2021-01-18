<template>
  <h1>Interleaving</h1>
  <div class="columns">
    <div id="mynetwork" class="column"></div>
    <div class="column" style="display: flex; flex-direction: column">
      <h3>Variables</h3>
      <div id="monaco-editor-variables" style="height: 2em"></div>

      <div class="columns" style="flex-grow: 1">
        <div class="column" style="display: flex; flex-direction: column">
          <h3>Thread 1</h3>
          <div id="monaco-editor-thread-1" style="flex-grow: 1"></div>
        </div>
        <div class="column" style="display: flex; flex-direction: column">
          <h3>Thread 2</h3>
          <div id="monaco-editor-thread-2" style="flex-grow: 1"></div>
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
} from "vue";
import {
  Network,
  Edge as VisEdge,
  Node as VisNode,
  Options,
} from "vis-network";
import { DataSet } from "vis-data";
import loader from "@monaco-editor/loader";

loader.config({
  paths: {
    // @ts-ignore
    vs: import.meta.env.BASE_URL + "node_modules/monaco-editor/min/vs",
  },
});

export default {
  components: {},
  setup() {
    onMounted(() => {
      loader.init().then((monaco) => {
        monaco.languages.typescript.javascriptDefaults.setWorkerOptions({
          customWorkerPath: "/custom-worker.js",
        });
        // https://github.com/microsoft/monaco-editor/issues/2147#issuecomment-696750840
        /*monaco.languages.typescript.javascriptDefaults.addExtraLib(
          "declare let testVar = 3, o = 3;",
          "yourlibname.d.ts"
        );*/

        const editor = monaco.editor.create(
          document.getElementById("monaco-editor-variables"),
          {
            value: "let U = 0, T = 0, V = 0, A = 0;",
            language: "javascript",
            minimap: {
              enabled: false,
            },
            lineNumbers: function (original) {
              if (original == 1) return "Setup";
              else return original - 1;
            },
          }
        );

        const editor1 = monaco.editor.create(
          document.getElementById("monaco-editor-thread-1"),
          {
            value: "\n\n\n\n",
            language: "javascript",
            minimap: {
              enabled: false,
            },
            automaticLayout: true,
          }
        );

        const editor2 = monaco.editor.create(
          document.getElementById("monaco-editor-thread-2"),
          {
            value: "\n\n\n\n",
            language: "javascript",
            minimap: {
              enabled: false,
            },
          }
        );

        editor.onDidChangeModelContent((e) => console.log(editor.getValue()));

        async function getVariableNames(): Promise<string[]> {
          const model = editor.getModel();
          if (!model) return [];
          const worker = await monaco.languages.typescript.getJavaScriptWorker();
          const thisWorker = await worker(model.uri);
          // @ts-ignore
          const variableNames = await thisWorker.getVariables(
            model.uri.toString()
          );

          return variableNames;
        }

        getVariableNames().then((value) => console.log(value));

        async function getThreadsInstructions() {
          const variableNames = await getVariableNames();

          const threadCodes = [editor1.getValue(), editor2.getValue()];

          const threadsInstructions = threadCodes.map((v) => {
            const lines = v.split("\n");
            return lines.map((line) =>
              Function.apply(null, [
                `{ ${variableNames.join(",")} }`,
                `${line}; return { ${variableNames.join(",")} };`,
              ])
            );
          });

          const getInitialState = Function.apply(null, [
            `${editor.getValue()}; return { ${variableNames.join(",")} };`,
          ]);

          return {
            initialState: getInitialState(),
            instructions: threadsInstructions,
          };
        }
      });
    });

    // TODO: output variables order
    let initialState = { U: 0, T: 0, V: 0, W: 0 };

    let instructionsSet1 = [
      {
        label: "1",
        operation: (state: State) => {
          state.U = 1;
        },
      },
      {
        label: "2",
        operation: (state: State) => {
          state.V = state.T + state.W;
        },
      },
      {
        label: "3",
        operation: (state: State) => {
          state.U = state.V - state.T;
        },
      },
    ];

    let instructionsSet2 = [
      {
        label: "4",
        operation: (state: State) => {
          state.T = 2;
        },
      },
      {
        label: "5",
        operation: (state: State) => {
          state.W = state.U;
        },
      },
      {
        label: "6",
        operation: (state: State) => {
          state.T = state.V;
        },
      },
    ];

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
      { length: thread1.instructions.length + 1 },
      (v1, i) =>
        Array.from({ length: thread2.instructions.length + 1 }, (v2, j) => {
          return {
            states: [],
            edges: [],
            id: j * (thread1.instructions.length + 1) + i,
          } as Node;
        })
    );

    resultNodes[0][0].states.push(initialState);

    generateGraphNetwork(thread1, thread2, resultNodes);

    let visNodes = [] as VisNode[];
    let visEdges = [] as VisEdge[];

    let counter = 0;

    for (let i = 0; i < resultNodes.length; i++) {
      for (let j = 0; j < resultNodes[i].length; j++) {
        let node = resultNodes[i][j];
        visNodes.push({
          id: node.id,
          label: node.states
            .map((state) => `(${state.U}, ${state.T}, ${state.V}, ${state.W})`)
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

    onMounted(() => {
      let container = document.getElementById("mynetwork");
      let options: Options = {
        nodes: { shape: "box" },
        edges: { arrows: "to" },
      };

      let network = new Network(container, data, options);
    });

    return {};
  },
};

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
      instruction.operation(stateCopy);
      resultStates.push(stateCopy);
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
  U: number;
  T: number;
  V: number;
  W: number;
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
  return (
    stateA.U === stateB.U &&
    stateA.T === stateB.T &&
    stateA.V === stateB.V &&
    stateA.W === stateB.W
  );
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