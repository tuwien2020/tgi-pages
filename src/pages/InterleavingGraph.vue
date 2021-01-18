<template>
  <h1>Interleaving</h1>
  <div class="columns">
    <div id="mynetwork" class="column"></div>
    <div class="column" style="display: flex; flex-direction: column">
      <h3>Variables</h3>
      <div id="monaco-editor" style="height: 2em"></div>

      <div class="columns" style="flex-grow: 1">
        <div class="column" style="display: flex; flex-direction: column">
          <h3>Thread 1</h3>
          <div id="monaco-editor-1" style="flex-grow: 1"></div>
        </div>
        <div class="column" style="display: flex; flex-direction: column">
          <h3>Thread 2</h3>
          <div id="monaco-editor-2" style="flex-grow: 1"></div>
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

console.log(import.meta.env.BASE_URL);

loader.config({
  paths: {
    vs: import.meta.env.BASE_URL + "node_modules/monaco-editor/min/vs",
  },
});

export default {
  components: {},
  setup() {
    onMounted(() => {
      // TODO: Don't use the CDN version https://github.com/suren-atoyan/monaco-loader
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
          document.getElementById("monaco-editor"),
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
        editor.onDidChangeModelContent((e) => console.log(editor.getValue()));

        const editor1 = monaco.editor.create(
          document.getElementById("monaco-editor-1"),
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
          document.getElementById("monaco-editor-2"),
          {
            value: "\n\n\n\n",
            language: "javascript",
            minimap: {
              enabled: false,
            },
          }
        );

        setTimeout(async () => {
          const model = editor.getModel();
          const worker = await monaco.languages.typescript.getJavaScriptWorker();
          const thisWorker = await worker(model.uri);
          const dts = await thisWorker.getVariables(model.uri.toString());
          console.log(dts); // Needed for outputting in the correct order
        }, 1000);

        // Line number editing...
        /*editor.onMouseDown((e) => {
          if (
            e.target?.type != monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS
          )
            return;
          console.log(e.target);

          const lineNumber = e.target.position?.lineNumber;
          if (lineNumber === undefined) return;

          // @ts-ignore
          //e.target.element.contenteditable = true;
          e.target.element?.addEventListener("mousedown", (ev) => {
            ev.stopPropagation();
            return false;
          });
        });*/
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

    let resultNodes: Node[][] = new Array<Node[]>(
      thread1.instructions.length + 1
    )
      .fill([])
      .map((a, i) =>
        new Array<Node>(thread2.instructions.length + 1)
          .fill({ states: [], edges: [], id: 0 })
          .map((b, j) => {
            return {
              states: [],
              edges: [],
              id: j * (thread1.instructions.length + 1) + i,
            };
          })
      );

    resultNodes[0][0].states.push(initialState);

    generateGraphNetwork(thread1, thread2, resultNodes);

    // removeDuplicatesInNetwork(resultNodes);
    // console.log(resultNodes);

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

    let test1 = new DataSet<VisNode, "id">(visNodes);
    let test2 = new DataSet<VisEdge, "id">(visEdges);

    console.log(visNodes);
    console.log(visEdges);

    let data = { nodes: test1, edges: test2 };

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

function removeDuplicatesInNetwork(nodes: Node[][]) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes[i].length; j++) {
      let currentNode = nodes[i][j];
      let currentStates = currentNode.states;

      let filtered = currentStates.filter((state, index) => {
        return isStateUnique(state, currentStates, index);
      });
      currentNode.states = filtered;
    }
  }
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