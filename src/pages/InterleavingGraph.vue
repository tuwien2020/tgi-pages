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
} from "vue";
import {
  Network,
  Edge as VisEdge,
  Node as VisNode,
  Options,
} from "vis-network";
import { DataSet } from "vis-data";
import loader, { Monaco } from "@monaco-editor/loader";
import { editor } from "monaco-editor";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";

loader.config({
  paths: {
    // @ts-ignore
    vs: import.meta.env.BASE_URL + "node_modules/monaco-editor/min/vs",
  },
});

function useCodeEditors(
  variablesCode: Ref<string>,
  thread1Code: Ref<string>,
  thread2Code: Ref<string>
) {
  const monacoEditorVariables = ref<HTMLElement>();
  const monacoEditorThread1 = ref<HTMLElement>();
  const monacoEditorThread2 = ref<HTMLElement>();

  let variablesEditor: editor.IStandaloneCodeEditor | null = null;
  let thread1Editor: editor.IStandaloneCodeEditor | null = null;
  let thread2Editor: editor.IStandaloneCodeEditor | null = null;

  let monaco: Monaco | null = null;

  onMounted(async () => {
    monaco = await loader.init().then((monaco) => {
      monaco.languages.typescript.javascriptDefaults.setWorkerOptions({
        customWorkerPath: "/custom-worker.js",
      });

      // https://github.com/microsoft/monaco-editor/issues/2147#issuecomment-696750840
      /*monaco.languages.typescript.javascriptDefaults.addExtraLib(
          "declare let testVar = 3, o = 3;",
          "yourlibname.d.ts"
        );*/
      watch(
        monacoEditorVariables,
        (value, oldValue) => {
          if (oldValue) {
            variablesEditor?.dispose();
          }

          if (!value) return;

          variablesEditor = monaco.editor.create(value, {
            value: variablesCode.value,
            language: "javascript",
            minimap: {
              enabled: false,
            },
            lineNumbers: function (original) {
              if (original == 1) return "Setup";
              else return `${original - 1}`;
            },
          });

          variablesEditor.onDidChangeModelContent(
            (e) => (variablesCode.value = variablesEditor?.getValue() ?? "")
          );
        },
        { immediate: true }
      );

      watch(
        monacoEditorThread1,
        (value, oldValue) => {
          if (oldValue) {
            thread1Editor?.dispose();
          }
          if (!value) return;

          thread1Editor = monaco.editor.create(value, {
            value: thread1Code.value,
            language: "javascript",
            minimap: {
              enabled: false,
            },
          });

          thread1Editor.onDidChangeModelContent(
            (e) => (thread1Code.value = thread1Editor?.getValue() ?? "")
          );
        },
        { immediate: true }
      );

      watch(
        monacoEditorThread2,
        (value, oldValue) => {
          if (oldValue) {
            thread2Editor?.dispose();
          }
          if (!value) return;

          thread2Editor = monaco.editor.create(value, {
            value: thread2Code.value,
            language: "javascript",
            minimap: {
              enabled: false,
            },
          });

          thread2Editor.onDidChangeModelContent(
            (e) => (thread2Code.value = thread2Editor?.getValue() ?? "")
          );
        },
        { immediate: true }
      );

      return monaco;
    });
  });

  async function getVariableNames(): Promise<string[]> {
    const model = variablesEditor?.getModel();
    if (!model || !monaco) return [];
    const worker = await monaco.languages.typescript.getJavaScriptWorker();
    const thisWorker = await worker(model.uri);
    // @ts-ignore
    const variableNames = await thisWorker.getVariables(model.uri.toString());

    return variableNames;
  }

  async function getThreadsInstructions() {
    const variableNames = await getVariableNames();

    const threadCodes = [
      thread1Editor?.getValue() ?? "",
      thread2Editor?.getValue() ?? "",
    ];

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
      `${variablesEditor?.getValue() ?? ""}; return { ${variableNames.join(
        ","
      )} };`,
    ]);

    return {
      initialState: getInitialState(),
      instructions: threadsInstructions,
    };
  }

  return {
    monacoEditorVariables,
    monacoEditorThread1,
    monacoEditorThread2,

    getVariableNames,
    getThreadsInstructions,
  };
}

export default {
  components: {},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);

    const variablesCode = urlRef(
      "variablesCode",
      "let U = 0, T = 0, V = 0, W = 0"
    );
    const thread1Code = urlRef("thread1Code", "\n\n\n\n\n");
    const thread2Code = urlRef("thread2Code", "\n\n\n\n\n");
    let codeEditors = useCodeEditors(variablesCode, thread1Code, thread2Code);

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

    return {
      "monaco-editor-variables": codeEditors.monacoEditorVariables,
      "monaco-editor-thread-1": codeEditors.monacoEditorThread1,
      "monaco-editor-thread-2": codeEditors.monacoEditorThread2,
    };
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