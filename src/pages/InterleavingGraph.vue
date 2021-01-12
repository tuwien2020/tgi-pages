<template>
<h1>Interleaving</h1>
<div id="mynetwork"></div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect, onMounted } from "vue";
import { Network, DataSet, Edge, Node as VisNode } from "vis-network"
export default {
  components: {},
  setup() {
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

    let resultNodes: Node[][] = new Array<Node[]>(thread2.instructions.length + 1)
      .fill([])
      .map((v) =>
        new Array<Node>(thread1.instructions.length + 1)
          .fill({ states: [], nextNodes: [] })
          .map(() => {
            return { states: [], nextNodes: [] };
          })
      );

    resultNodes[0][0].states.push(initialState);

    console.clear();
    generateGraphNetwork(thread1, thread2, resultNodes);

    removeDuplicatesInNetwork(resultNodes);
    // console.log(resultNodes);

    let visNodes = [];
    let visEdges = [];

    for (let i = 0; i < resultNodes.length; i++) {
      for (let j = 0; j < resultNodes[i].length; j++) {
        let node = resultNodes[i][j];
        visNodes.push({
          id: i * resultNodes[i].length + j,
          label: node.states.map((state)=>`(${state.U}, ${state.T}, ${state.V}, ${state.W})`).join("\n")})

        // node.nextNodes.forEach((node) => {
        //   visEdges.push({
        //     from: i * resultNodes[i].length + j, to: resultNode
        //   });
        // });
        
      }
    }



    onMounted(() => {
      // let container = document.getElementById("mynetwork");
      // let test= new DataSet(visNodes);
      // let data = { nodes:  test}
      // let options: { 
      // }

      // let network = new Network(container, data, options);

        var nodes = new DataSet([
    { id: 1, label: "Node 1" },
    { id: 2, label: "Node 2" },
    { id: 3, label: "Node 3" },
    { id: 4, label: "Node 4" },
    { id: 5, label: "Node 5" }
  ]);

  // create an array with edges
  var edges = new DataSet([
    { from: 1, to: 3 },
    { from: 1, to: 2 },
    { from: 2, to: 4 },
    { from: 2, to: 5 },
    { from: 3, to: 3 }
  ]);

  // create a network
  var container = document.getElementById("mynetwork");
  var data = {
    nodes: nodes,
    edges: edges
  };
  var options = {};
  var network = new Network(container, data, options);
    });



    return {};
  },
};

function generateGraphNetwork(
  threadA: Thread,
  threadB: Thread,
  resultNodes: Node[][]
) {
  let currentNode = resultNodes[threadB.instructionPointer][threadA.instructionPointer];

  if (threadA.instructionPointer < threadA.instructions.length) {
    let newStates = executeInstruction(threadA.instructions[threadA.instructionPointer], currentNode);
    let threadCopy = { ...threadA };

    threadCopy.instructionPointer++;

    let nextNode = resultNodes[threadB.instructionPointer][threadCopy.instructionPointer];
    nextNode.states.push(...newStates);
    
    currentNode.nextNodes.push(nextNode);

    generateGraphNetwork(threadCopy, threadB, resultNodes);
  }

  if (threadB.instructionPointer < threadB.instructions.length) {
    let newStates = executeInstruction(threadB.instructions[threadB.instructionPointer], currentNode);
    let threadCopy = { ...threadB };
    threadCopy.instructionPointer++;

    let nextNode = resultNodes[threadCopy.instructionPointer][threadA.instructionPointer]
    nextNode.states.push(...newStates);

    currentNode.nextNodes.push(nextNode);

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

function removeDuplicatesInNetwork(nodes: Node[][]) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes[i].length; j++) {
      let currentNode = nodes[i][j];
      let currentStates = currentNode.states;

      const isUnique = (state: State, index: number) => {
        for (let k = index + 1; k < currentStates.length; k++) {
          if (areStatesEqual(state, currentStates[k])) {
            return false;
          }
        }
        return true;
      };

      let filtered = currentStates.filter((state, index) => {
        return isUnique(state, index);
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
  states: State[];
  nextNodes: Node[];
}
</script>

<style scoped>
#mynetwork {
  width: 600px;
  height: 400px;
  border: 1px solid lightgray;
}
</style>