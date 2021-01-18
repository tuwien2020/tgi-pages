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

  const threadsInstructions = shallowRef<{
    variableNames: string[];
    initialState: object;
    instructions: Function[][];
  }>();
  let timerId = 0;
  function updateThreadsInstructions() {
    clearTimeout(timerId);

    timerId = setTimeout(async () => {
      timerId = 0;
      threadsInstructions.value = await getThreadsInstructions();
    }, 500);
  }

  const monacoPromise = new Promise<Monaco>((resolve, reject) => {
    onMounted(async () => {
      await loader.init().then((monaco) => {
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

            variablesEditor.onDidChangeModelContent((e) => {
              variablesCode.value = variablesEditor?.getValue() ?? "";
              updateThreadsInstructions();
            });
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

            thread1Editor.onDidChangeModelContent((e) => {
              thread1Code.value = thread1Editor?.getValue() ?? "";
              updateThreadsInstructions();
            });
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

            thread2Editor.onDidChangeModelContent((e) => {
              thread2Code.value = thread2Editor?.getValue() ?? "";
              updateThreadsInstructions();
            });
          },
          { immediate: true }
        );

        resolve(monaco);
      });
    });
  });

  async function getVariableNames(): Promise<string[]> {
    const monaco = await monacoPromise;

    const model = variablesEditor?.getModel();
    if (!model) return [];
    const worker = await monaco.languages.typescript.getJavaScriptWorker();
    const thisWorker = await worker(model.uri);
    // @ts-ignore
    const variableNames = await thisWorker.getVariables(model.uri.toString());

    return variableNames;
  }

  async function getThreadsInstructions() {
    const monaco = await monacoPromise;

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
          `try { ${line}; } catch(e) { console.warn(e); } return { ${variableNames.join(
            ","
          )} };`,
        ])
      );
    });

    const getInitialState = Function.apply(null, [
      `${variablesEditor?.getValue() ?? ""}; return { ${variableNames.join(
        ","
      )} };`,
    ]);

    return {
      variableNames: variableNames,
      initialState: getInitialState(),
      instructions: threadsInstructions,
    };
  }

  return {
    monacoEditorVariables,
    monacoEditorThread1,
    monacoEditorThread2,
    threadsInstructions,
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

    watch(
      codeEditors.threadsInstructions,
      (value) => {
        if (!value) return;

        // TODO: output variables order

        let instructionsSet1 = value.instructions[0].map((v, i) => {
          return {
            label: "" + i,
            operation: v,
          } as Instruction;
        });

        let instructionsSet2 = value.instructions[1].map((v, i) => {
          return {
            label: "" + i,
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
      "monaco-editor-variables": codeEditors.monacoEditorVariables,
      "monaco-editor-thread-1": codeEditors.monacoEditorThread1,
      "monaco-editor-thread-2": codeEditors.monacoEditorThread2,
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