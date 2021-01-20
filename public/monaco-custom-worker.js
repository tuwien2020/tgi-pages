/**
 *
 * @param {import('monaco-editor').languages.typescript.TypeScriptWorker} TypeScriptWorker
 */
self.customTSWorkerFactory = (TypeScriptWorker) => {
  return class MonacoTSWorker extends TypeScriptWorker {
    async getVariables(modelUri) {
      const purr = this._languageService.getProgram(modelUri);
      const variables = [];

      purr
        .getSourceFile(modelUri)
        .identifiers.forEach((key) => variables.push("" + key));

      return variables;
      /*console.log(this);
      console.log(ts);
      console.log(this._ctx.getMirrorModels());
      console.log(this._languageService.getEmitOutput(modelUri));
      console.log(this._languageService.getProgram(modelUri));*/
      /*
      console.log(purr);
      console.log(purr.getSourceFile(modelUri)); // .getSourceFiles());
*/
    }
  };
};