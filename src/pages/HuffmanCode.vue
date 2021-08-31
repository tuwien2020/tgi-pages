<template>
  <h1>Huffman-Code</h1>

  <div class="columns">
    <div class="column">
      <table class="table is-striped is-bordered">
        <thead>
          <th>Zeichen</th>
          <th>p</th>
          <th v-if="isEditingMode" />
        </thead>

        <tbody>
          <tr v-for="(row, index) in alphabet" :key="index">
            <td>
              <input v-if="isEditingMode" type="text" class="input" placeholder="Zeichen" v-model="row.char" />
              <p v-else>{{ row.char }}</p>
            </td>
            <td>
              <input v-if="isEditingMode" type="number" class="input" placeholder="p" v-model="row.probability" />
              <p v-else>{{ row.probability }}</p>
            </td>
            <td v-if="isEditingMode">
              <button class="button is-danger is-small" @click="deleteLetter(index)">
                <i class="fas fa-trash-alt" />
                X
              </button>
            </td>
          </tr>

          <tr v-if="isEditingMode">
            <td colspan="3" style="text-align: center">
              <button class="button is-success is-small" @click="addLetter">
                <i class="fas fa-plus-circle" />
                +
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="column">
        <button v-if="isEditingMode" class="button is-info is-fullwidth" @click="start">starten</button>
        <button v-else class="button is-info is-fullwidth" @click="step">nächster Schritt</button>
      </div>

      <div v-if="!isEditingMode" class="column">
        <button class="button is-danger is-fullwidth" @click="reset">zurücksetzen</button>
      </div>
    </div>
    <div id="mynetwork" class="column"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect, onMounted } from "vue";
import { Network, Edge as VisEdge, Node as VisNode, Options, Data } from "vis-network";
import { DataSet } from "vis-data";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";
import { VisData } from "vis-network/declarations/network/gephiParser";

export default defineComponent({
  components: {},
  setup() {
    // example from the slides
    const defaultAlphabet = [
      { char: "a", probability: 0.4 },
      { char: "b", probability: 0.2 },
      { char: "c", probability: 0.18 },
      { char: "d", probability: 0.11 },
      { char: "e", probability: 0.11 },
    ];
    const alphabet = ref<Word[]>(defaultAlphabet);

    const isEditingMode = ref<boolean>(true);

    const deleteLetter = (index: number) => {
      alphabet.value.splice(index, 1);
    };

    const addLetter = () => {
      alphabet.value.push({ char: "", probability: 0.0 });
    };

    const huffmanGraph: HuffmanGraph = {
      visEdgeData: new DataSet<VisEdge>(),
      visNodeData: new DataSet<VisNode>(),
    };

    onMounted(() => {
      setupGraph(huffmanGraph);
    });

    let huffmanCodeSimulation = runHuffmanCodeSimulation(alphabet.value, huffmanGraph);

    const start = () => {
      isEditingMode.value = false;
    };

    const reset = () => {
      isEditingMode.value = true;
      huffmanCodeSimulation.reset();
    };

    return { alphabet, isEditingMode, deleteLetter, addLetter, start, reset };
  },
});

function setupGraph(huffmanGraph: HuffmanGraph) {
  let container = document.getElementById("mynetwork");
  if (container) {
    var data = { nodes: huffmanGraph.visNodeData, edges: huffmanGraph.visEdgeData };

    var options = {
      layout: {
        hierarchical: {
          direction: "UD",
          sortMethod: "directed",
        },
      },
      physics: {
        hierarchicalRepulsion: {
          avoidOverlap: 1,
        },
      },
    };
    let network = new Network(container, data, options);
  }
}

function runHuffmanCodeSimulation(alphabet: Word[], huffmanGraph: HuffmanGraph) {
  let root: HuffmanTreeNode | null = null;

  function mergeWords() {}

  function selectWords() {}

  function step() {}

  function reset() {}

  return { step, reset };
}

interface HuffmanGraph {
  visEdgeData: DataSet<VisEdge>;
  visNodeData: DataSet<VisNode>;
}

interface HuffmanTreeNode {
  word: Word;
  left: HuffmanTreeNode | null;
  right: HuffmanTreeNode | null;
}

interface Word {
  char: string;
  probability: number;
}
</script>
<style scoped>
#mynetwork {
  height: 800px;
  border: 1px solid lightgray;
}
</style>
