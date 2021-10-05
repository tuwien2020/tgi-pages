<template>
  <h1>Micro 16-Dekompilierer</h1>
  <p>Bytecode (getrennt durch einen Zeilenumbruch):</p>
  <p>Hinweis: Wenn man mit der Maus über einen Bereich hovered wird angezeigt, um welchen Teil der Anweisung es sich handelt. </p>
  <intro text="Klicke hier für eine Erklärungstour"></intro>
  <!--<textarea
    rows="4"
    cols="50"
    v-model="bytecode"
    class="is-family-monospace"
  ></textarea>-->

  <div class="micro16-decompiler" ref="monaco-editor-micro16" style="height: 10em" data-intro="Gib hier den Binärcode ein (es gehen auch mehrere durch Zeilenumbruch getrennte Anweisungen)"></div>
  <h3>Decompiled Instructions</h3>
  <pre data-intro="Hier stehen die dekompilierten Instruktionen">{{ instruction }}</pre>
  <hr>
  <div class="content" data-intro="Hier stehen die dekompilierten Instruktionen mit detailierteren Infos">    
    <h3> Instruction Erkärung </h3>
    <div v-for="instruction in parsedInstructions" :key="instruction.key">
      <collapsible-table>
        <template v-slot:title>
          <h4>Instruction {{instruction.key}}</h4>
        </template>
        <template v-slot:header>
          <tr>
            <th>Instructionteil</th>
            <th>Wert</th>
            <th>Bedeutung</th>
          </tr>
        </template>
        <template v-slot:body>
          <tr v-for="token in tokens" :key="token.shortName">
            <td>{{ token.longName }}</td>
            <td>{{ instruction.instruction[token.shortName].toString()}}</td>
            <td>{{ token.description }}</td>
          </tr>
        </template>
      </collapsible-table>
      <hr>
    </div>
  </div>
</template>

<script lang="ts">
import { useMonaco } from "../monaco/use-monaco";
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";
import { ParsedInstruction, parse, getRegistry, interpretParsedExpression, InstructionParts } from "./../assets/decompiler";
import { defaultPalette } from './../assets/colors';
import CollapsibleTable from './../components/CollapsibleTable.vue';
import Intro from './../components/Intro.vue';


export default defineComponent({
  components: {CollapsibleTable, Intro},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);
    const monacoEditorMicro16 = ref<HTMLElement>();
    const bytecode = urlRef("bytecode", "10010010100100110001011010001011");
    const parsedInstructions = computed(() =>
      bytecode.value
        .trimEnd()
        .split("\n")
        .map((v,i) => { return {instruction: parse(v.replace(/\s/g, "")), key: i}} ));

    const instruction = computed(() =>
      parsedInstructions.value
        .map(({instruction}) => interpretParsedExpression(instruction))
        .join("\n")
    );

    const parsedInstructionsCompleted = computed(() => 
      parsedInstructions.value
        .filter(({instruction}) => instruction.adr >= 0 && instruction.adr <= 255)
    );
    
    let tokens = [
      {
        shortName: InstructionParts.aMux,
        longName: "A-MUX",
        description: "Entscheidet ob der Wert A aus dem A-Bus oder dem MBR verwendet wird",
        length: 1,
        color: "9b59b6",
      },
      {
        shortName: InstructionParts.cond,
        longName: "Cond",
        description: "Entscheidet, ob und wann gesprungen wird (0: nicht springen, 1: falls 0, 2: falls negativ, 3: immer)",
        length: 2,
        color: "e74c3c",
      },
      {
        shortName: InstructionParts.alu,
        longName: "ALU",
        description: "Entscheidet welche Operation die Alu ausführt (0: A [Pass], 1: A + B, 2: A & B, 3: ~A)",
        length: 2,
        color: "000000",
      },
      {
        shortName: InstructionParts.sh,
        longName: "Shifter",
        description: "Entscheidet ob und wie geshiftet wird (0: Nicht shiften, 1: Left Shift, 2: Right Shift) ",
        length: 2,
        color: "7f8c8d",
      },
      {
        shortName: InstructionParts.mbr,
        longName: "MBR",
        description: "Entscheidet ob in den MBR geschrieben wird",
        length: 1,
        color: "9b59b6",
      },
      {
        shortName: InstructionParts.mar,
        longName: "MAR",
        description: "Entscheidet ob B in den MAR geschrieben wird",
        length: 1,
        color: "209cee",
      },
      {
        shortName: InstructionParts.rdWr,
        longName: "RD/WR",
        description: "Entscheidet ob RD oder WR falls MS true ist (true: rd, false: wr)",
        length: 1,
        color: "f39c12",
      },
      {
        shortName: InstructionParts.ms,
        longName: "Memory Select",
        description: "Entscheidet ob ein Memory Zugriff passiert",
        length: 1,
        color: "f39c12",
      },
      {
        shortName: InstructionParts.enS,
        longName: "Enable S-Bus",
        description: "Entscheidet ob in den S-Bus geschrieben wird",
        length: 1,
        color: "1A7440",
      },
      {
        shortName: InstructionParts.sBus,
        longName: "S-Bus",
        description: "Falls enS true ist, steht hier die Addresse in die der S-Bus schreibt  (2-15) (0-2 sind readonly)",
        length: 4,
        color: "27ae60",
      },
      {
        shortName: InstructionParts.bBus,
        longName: "B-Bus",
        description: "Die Addresse des B-Bus (0-15)",
        length: 4,
        color: "209cee",
      },
      {
        shortName: InstructionParts.aBus,
        longName: "A-Bus",
        description: "Die Addresse des A-Bus (0-15)",
        length: 4,
        color: "9b59b6",
      },
      {
        shortName: InstructionParts.adr,
        longName: "Address",
        description: "Falls die Condition in Cond zutrifft, entscheidet dieser Wert wohin gesprungen wird (0-255)",
        length: 8,
        color: "e74c3c",
      },
    ];

    tokens = tokens.map((token, i) => {
      token.color = defaultPalette[i%defaultPalette.length].toHex();
      return token;
    })
    
    useMonaco().then((monaco) => {
      monaco.setMonacoOptions((value) => {
        if (value.languages.getLanguages().some((v) => v.id == "micro16-binary")) {
          return;
        }

        value.languages.register({
          id: "micro16-binary",
        });



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
              if (column <= position.column && position.column < column + tokens[i].length) {
                console.log(column, position.column, column + tokens[i].length);
                return {
                  range: new value.Range(position.lineNumber, column, position.lineNumber, column + tokens[i].length),
                  contents: [{ value: `**${tokens[i].longName}**` }, { value: tokens[i].description }],
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
      parsedInstructions: parsedInstructionsCompleted,
      tokens,
    };
  },
});
</script>
<style>
details {
    border: 1px solid #aaa;
    border-radius: 4px;
    padding: .5em .5em 0;
}

summary {
    font-weight: bold;
    margin: -.5em -.5em 0;
    padding: .5em;
}

details[open] {
    padding: .5em;
}

details[open] summary {
    border-bottom: 1px solid #aaa;
    margin-bottom: .5em;
}
</style>
