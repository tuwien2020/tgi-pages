import loader, { Monaco } from "@monaco-editor/loader";
import { editor } from "monaco-editor";
import { assert } from "../assert";
import { ref, Ref, shallowRef, watch } from "vue";
import { defaultPalette } from "./../assets/colors";

let globalMonaco: Monaco | null = null;

export async function useMonaco() {
  if (globalMonaco == null) {
    loader.config({
      paths: {
        vs: import.meta.env.DEV
          ? import.meta.env.BASE_URL + "node_modules/monaco-editor/min/vs"
          : import.meta.env.BASE_URL + "assets/monaco-editor/min/vs",
      },
    });

    globalMonaco = await loader.init().then((value) => {
      value.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSuggestionDiagnostics: false,
        noSyntaxValidation: false,
      });

      value.languages.typescript.javascriptDefaults.setCompilerOptions({
        allowNonTsExtensions: true,
        lib: ["es2020"],
        checkJs: true,
        //alwaysStrict: true,
        //strict: true,
      });

      value.languages.typescript.javascriptDefaults.setWorkerOptions({
        // @ts-ignore
        customWorkerPath: import.meta.env.BASE_URL + "monaco-custom-worker.js",
      });

      return value;
    });
  }
  let monaco: Monaco = globalMonaco as Monaco;
  assert(monaco !== null);

  function addExtraLib(code: string) {
    // https://github.com/microsoft/monaco-editor/issues/2147#issuecomment-696750840
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      code, // Stuff like "declare let testVar = 3, o = 3;"
      "meow-own-lib.d.ts"
    );
  }

  function createEditor(element: Ref<HTMLElement | undefined>, options: editor.IStandaloneEditorConstructionOptions) {
    const editor = shallowRef<editor.IStandaloneCodeEditor>();
    const code = ref("");
    let ignoreUpdate = false;
    let decorations = [] as string[];

    monaco.editor.defineTheme("defaultTGIPages", {
      base: "vs",
      inherit: true,
      rules: [{ token: "comment", foreground: defaultPalette[4].toHex() }],
      colors: {},
    });

    monaco.editor.setTheme("defautlTGIPages");

    watch(
      element,
      (value, oldValue) => {
        if (oldValue) {
          editor.value?.dispose();
          editor.value = undefined;
        }

        if (!value || !monaco) return;
        options.theme ??= "defaultTGIPages";
        monaco.editor.setTheme(options.theme);

        editor.value = monaco.editor.create(value, options);
        code.value = options.value ?? "";

        editor.value.onDidChangeModelContent((e) => {
          ignoreUpdate = true;
          code.value = editor.value?.getValue() ?? "";
          ignoreUpdate = false;
        });
      },
      { immediate: true }
    );

    watch(
      code,
      (value) => {
        if (!ignoreUpdate) {
          editor.value?.setValue(value);
        }
      },
      {
        immediate: true,
        flush: "sync",
      }
    );

    async function getVariableNames(): Promise<string[]> {
      // TODO: Wait until editor is initialized
      const model = editor.value?.getModel();
      if (!model) return [];
      const worker = await monaco.languages.typescript.getJavaScriptWorker();
      const thisWorker = await worker(model.uri);
      // @ts-ignore
      const variableNames = await thisWorker.getVariables(model.uri.toString());

      return variableNames;
    }

    function setLinePointer(lineNumber: number) {
      if (!editor.value) return;

      if (lineNumber <= 0) {
        decorations = editor.value?.deltaDecorations(decorations, []);
      } else {
        decorations = editor.value?.deltaDecorations(decorations, [
          {
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
              marginClassName: "linePointer",
            },
          },
        ]);
      }
    }

    return {
      code,
      getVariableNames,
      setLinePointer,
    };
  }

  function setMonacoOptions(callback: (monaco: Monaco) => void) {
    callback(monaco);
  }

  return {
    addExtraLib,
    createEditor,
    setMonacoOptions,
  };
}
