<template>
  <h1>Interleaving</h1>
  <div id="mynetwork"></div>
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

export default {
  components: {},
  setup() {
    // TODO: output variables order
    let initialState = { U: 0, T: 0, V: 0, W: 0 };

    let instructionsSet1 = [
      { label: "1", operation: (state: State) => { state.U = 1; }},
      { label: "2", operation: (state: State) => { state.V = state.T + state.W; }},
      { label: "3", operation: (state: State) => { state.U = state.V - state.T; }}
    ];

    let instructionsSet2 = [
      { label: "4", operation: (state: State) => { state.T = 2; }},
      { label: "5", operation: (state: State) => { state.W = state.U; }},
      { label: "6", operation: (state: State) => { state.T = state.V; }}
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

    console.clear();
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
    
    let edge = {nextNode: nextNode, instruction: instruction}

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


    let edge = { nextNode: nextNode, instruction: instruction }

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

function isStateUnique(state: State, states: State[], index: number = -1)  {
  for (let k = index + 1; k < states.length; k++) {
    if (areStatesEqual(state, states[k])) {
      return false;
    }
  }
  return true;
};

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
  width: 1000px;
  height: 800px;
  border: 1px solid lightgray;
}
</style>