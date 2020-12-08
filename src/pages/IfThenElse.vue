<template>
    <h1>If Then Else</h1>
    <textarea v-model="ite" rows="4"
    cols="50"></textarea>
    <pre>{{parsedITE}}</pre>
    <div id="kv-diagram"></div>
</template>

<script lang="ts">
import { choice } from "bread-n-butter";
import { defineComponent, computed, ref, watch, watchEffect, shallowRef, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";
// import { IteNode, parseIte, VariableLiteral } from "./../assets/grammar-ite"
import { SVG, extend as SVGextend, Element as SVGElement } from '@svgdotjs/svg.js'

export default defineComponent({
  components: {},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);
    
    const ite = urlRef("input", ""); 
    
    const parsedITE = shallowRef();

    


    // watch(ite, (value) => {
    //   const tree = parseIte(value) as IteNode;
    //   parsedITE.value = tree;
    //   drawITETreeInCanvas(tree, document.getElementById("binary-tree") as HTMLCanvasElement)
    // })

    return {
      ite,
      parsedITE,
    };
  },
});

// function drawITETreeInCanvas(tree: IteNode, canvas: HTMLCanvasElement) {
//   const context = (canvas as HTMLCanvasElement).getContext("2d") as CanvasRenderingContext2D; 
//   drawRecursively(tree);
  
//   function drawRecursively(node: IteNode) {
//     if (node.children.length != 0) {
//       for (let i = 0; i < node.children.length; i++) {
//         drawRecursively(node.children[i]);
//       }
//     }

//     if (node.children[0] instanceof VariableLiteral) {
//       console.log(node.children[0].value + " " + node.children[0].isNegated);
//     }
//   }


// }

</script>