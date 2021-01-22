<template>
  <h1>Micro 16-Dekompilierer</h1>

  <p>Bytecode (getrennt durch einen Linienumbruch):</p>
  <!--<textarea
    rows="4"
    cols="50"
    v-model="bytecode"
    class="is-family-monospace"
  ></textarea>-->

  <div ref="monaco-editor-micro16" style="height: 10em"></div>

  <pre>{{ instruction }}</pre>
</template>

<script lang="ts">
import { useMonaco } from "../monaco/use-monaco";
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";
import {
  ParsedInstruction,
  parse,
  getRegistry,
  interpret,
} from "./../assets/decompiler";

export default defineComponent({
  components: {},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);
    const monacoEditorMicro16 = ref<HTMLElement>();
    const bytecode = urlRef("bytecode", "");
    const instruction = computed(() =>
      bytecode.value
        .trimEnd()
        .split("\n")
        .map((v) => interpret(v.replace(/\s/g, "")))
        .join("\n")
    );

    useMonaco().then((monaco) => {
      monaco.setMonacoOptions((value) => {
        value.languages.register({
          id: "micro16-binary",
        });

        value.editor.defineTheme("micro16-binary", {
          base: "vs",
          rules: [
            {
              token: "aMux.micro16-binary",
              foreground: "0000fa",
              fontStyle: "bold",
            },
            {
              token: "cond.micro16-binary",
              foreground: "000000",
              fontStyle: "bold",
            },
            {
              token: "alu.micro16-binary",
              foreground: "f00000",
              fontStyle: "italic",
            },
            {
              token: "bBus.micro16-binary",
              background: "ff0000",
              foreground: "00ff00",
              fontStyle: "italic",
            },
          ],
          colors: { red: "#ff0000" },
          inherit: true,
        });

        value.languages.setMonarchTokensProvider("micro16-binary", {
          defaultToken: "invalid",
          tokenizer: {
            root: [
              [
                /^([01]{1})([01]{2})([01]{2})([01]{2})([01]{1})([01]{1})([01]{1})([01]{1})([01]{1})([01]{4})([01]{4})([01]{4})([01]{8})$/,
                [
                  "aMux",
                  "cond",
                  "alu",
                  "sh",
                  "mbr",
                  "mar",
                  "rdWr",
                  "ms",
                  "enS",
                  "sBus",
                  "bBus",
                  "aBus",
                  "adr",
                ],
              ],
            ],
          },
        });
      });

      const micro16Editor = monaco.createEditor(monacoEditorMicro16, {
        value: bytecode.value,
        language: "micro16-binary",
        minimap: {
          enabled: false,
        },
        scrollBeyondLastLine: false,
        scrollbar: {
          vertical: "visible",
          horizontal: "visible",
          useShadows: false,
        },
        theme: "micro16-binary",
      });

      watchEffect(() => (bytecode.value = micro16Editor.code.value));
    });

    return {
      bytecode,
      instruction,
      "monaco-editor-micro16": monacoEditorMicro16,
    };
  },
});
</script>
