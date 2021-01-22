<template>
  <h1>Micro 16-Dekompilierer</h1>

  <p>Bytecode (getrennt durch einen Zeilenumbruch):</p>
  <!--<textarea
    rows="4"
    cols="50"
    v-model="bytecode"
    class="is-family-monospace"
  ></textarea>-->

  <div
    class="micro16-decompiler"
    ref="monaco-editor-micro16"
    style="height: 10em"
  ></div>

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
        if (
          value.languages.getLanguages().some((v) => v.id == "micro16-binary")
        ) {
          return;
        }

        value.languages.register({
          id: "micro16-binary",
        });

        const tokens = [
          {
            shortName: "aMux",
            longName: "A-MUX",
            description: "",
            length: 1,
            color: "9b59b6",
          },
          {
            shortName: "cond",
            longName: "Cond",
            description: "",
            length: 2,
            color: "e74c3c",
          },
          {
            shortName: "alu",
            longName: "ALU",
            description: "",
            length: 2,
            color: "000000",
          },
          {
            shortName: "sh",
            longName: "Shifter",
            description: "",
            length: 2,
            color: "7f8c8d",
          },
          {
            shortName: "mbr",
            longName: "MBR",
            description: "",
            length: 1,
            color: "9b59b6",
          },
          {
            shortName: "mar",
            longName: "MAR",
            description: "",
            length: 1,
            color: "209cee",
          },
          {
            shortName: "rdWr",
            longName: "RD/WR",
            description: "",
            length: 1,
            color: "f39c12",
          },
          {
            shortName: "ms",
            longName: "Memory Select",
            description: "",
            length: 1,
            color: "f39c12",
          },
          {
            shortName: "enS",
            longName: "Enable S-Bus",
            description: "",
            length: 1,
            color: "1A7440",
          },
          {
            shortName: "sBus",
            longName: "S-Bus",
            description: "",
            length: 4,
            color: "27ae60",
          },
          {
            shortName: "bBus",
            longName: "B-Bus",
            description: "",
            length: 4,
            color: "209cee",
          },
          {
            shortName: "aBus",
            longName: "A-Bus",
            description: "",
            length: 4,
            color: "9b59b6",
          },
          {
            shortName: "adr",
            longName: "Address",
            description: "",
            length: 8,
            color: "e74c3c",
          },
        ];

        value.editor.defineTheme("micro16-binary", {
          base: "vs",
          rules: tokens.map((v) => {
            return {
              token: v.shortName + ".micro16-binary",
              foreground: v.color,
            };
          }),

          colors: {},
          inherit: true,
        });

        value.languages.setMonarchTokensProvider("micro16-binary", {
          defaultToken: "invalid",
          tokenizer: {
            root: [
              [
                /^([01]{1})([01]{2})([01]{2})([01]{2})([01]{1})([01]{1})([01]{1})([01]{1})([01]{1})([01]{4})([01]{4})([01]{4})([01]{0,8})/,
                tokens.map((v) => v.shortName),
              ],
            ],
          },
        });

        value.languages.registerCompletionItemProvider("micro16-binary", {
          provideCompletionItems: function (model, position) {
            if (position.column > 32) return { suggestions: [] };

            return {
              suggestions: [
                {
                  label: "0",
                  kind: value.languages.CompletionItemKind.Value,
                  documentation: "0",
                  insertText: "0",
                  range: {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endColumn: position.column,
                  },
                },
                {
                  label: "1",
                  kind: value.languages.CompletionItemKind.Value,
                  documentation: "1",
                  insertText: "1",
                  range: {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endColumn: position.column,
                  },
                },
              ],
            };
          },
        });

        value.languages.registerHoverProvider("micro16-binary", {
          provideHover: function (model, position) {
            for (let i = 0, column = 1; i < tokens.length; i++) {
              if (
                column <= position.column &&
                position.column < column + tokens[i].length
              ) {
                console.log(column, position.column, column + tokens[i].length);
                return {
                  range: new value.Range(
                    position.lineNumber,
                    column,
                    position.lineNumber,
                    column + tokens[i].length
                  ),
                  contents: [
                    { value: `**${tokens[i].longName}**` },
                    { value: tokens[i].description },
                  ],
                };
              }
              column += tokens[i].length;
            }

            return null;
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
        fontSize: 20,
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
<style>
/* Chrome can't handle this
.micro16-decompiler .monaco-editor .view-line span {
  padding-left: 2px;
  padding-right: 2px;
}
*/
</style>
