<template>
    
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
export default {
    components: {},
    setup() {

        let initialState = { A: 0, B: 0, C: 0, D: 0};

        let instructionsSet1 = [
            { label: "a", operation: ((state: State)=>{ state.A = 1 }) },
            { label: "c", operation: ((state: State)=>{ state.C = state.B }) },
        ];

        let instructionsSet2 = [
            { label: "b", operation: ((state: State)=>{ state.B = 2 }) },
            { label: "d", operation: ((state: State)=>{ state.D = state.A }) },
        ];

        let thread1: Thread = {
            label: "ThreadA",
            instructions: instructionsSet1,
            instructionPointer: 0
        };

        let thread2: Thread = {
            label: "ThreadB",
            instructions: instructionsSet2,
            instructionPointer: 0   
        }

        let resultNodes: Node[][] = [
          [{states: [initialState]}, {states: []}, {states: []}],
          [{states: []}, {states: []}, {states: []}],
          [{states: []}, {states: []}, {states: []}],
        ];
        console.clear();
        generateGraphNetwork(thread1, thread2, resultNodes);
        console.log(resultNodes);
        return {

        };
    }
}

function generateGraphNetwork(threadA: Thread, threadB: Thread, resultNodes: Node[][]) {
    let currentNode = resultNodes[threadA.instructionPointer][threadB.instructionPointer];

    console.log(threadA.instructionPointer, threadB.instructionPointer);

    if (threadA.instructionPointer < threadA.instructions.length) {
        let newStates = executeInstruction(threadA.instructions[threadA.instructionPointer], currentNode);
        threadA.instructionPointer++;

        resultNodes[threadA.instructionPointer][threadB.instructionPointer].states.push(...newStates);
        generateGraphNetwork({...threadA}, threadB, resultNodes);
    }

    if (threadB.instructionPointer < threadB.instructions.length) {
        let newStates = executeInstruction(threadB.instructions[threadB.instructionPointer], currentNode);
        threadB.instructionPointer++;

        resultNodes[threadA.instructionPointer][threadB.instructionPointer].states.push(...newStates);
        generateGraphNetwork(threadA, {...threadB }, resultNodes);
    }

    function executeInstruction(instruction: Instruction, currentNode: Node) : State[] {
        let resultStates: State[] = [];
        for (let state of currentNode.states) {
            let stateCopy = { ... state};
            instruction.operation(stateCopy);
            resultStates.push(stateCopy);
        }
        return resultStates;
    }

}

interface State {
    A: number,
    B: number,
    C: number,
    D: number,
}

interface Thread {
    label: string;
    instructions: Instruction[];
    instructionPointer: 0;
}

interface Instruction {
    label: string;
    operation: ((state: State) => void);
}

interface Node {
    states: State[];
}
</script>