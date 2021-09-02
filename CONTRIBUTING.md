# Contributing Guide

Welcome, interested person! Contributions are welcome. If you're ever unsure, feel free to open an issue.

Preferably, features are developed in another branch or fork. After the feature is ready, a pull request to the master branch should be opened.

## Prerequisites

- [Node 15 or greater](https://nodejs.org/en/)
- A code editor (see below)

## Setup

1. Clone the repository
2. `npm install`
3. `npm run dev`

## Recommended Tooling

I recommend using [Visual Studio Code](https://code.visualstudio.com/) with

- [Prettier Extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) to format your files
- Settings &rarr; Format On Save &rarr; Enable (`"editor.formatOnSave": true,`)
- [Vetur Extension](https://marketplace.visualstudio.com/items?itemName=octref.vetur) for Vue.js
- [(optional)npm Extension](https://marketplace.visualstudio.com/items?itemName=eg2.vscode-npm-script)
- [(optional)TODO Highlight Extension](https://marketplace.visualstudio.com/items?itemName=wayou.vscode-todo-highlight)

## Used Libraries

The most important ones are

- [Typescript](https://www.typescriptlang.org/) - Typesafe Javascript
- [Vue 3](https://github.com/vuejs/vue-next/) - Vue 3 with [the composition API](https://vue-composition-api-rfc.netlify.app/api.html)

We are also using

- [KaTeX](https://katex.org/) - rendering LaTeX equations
- [Vite](https://github.com/vuejs/vite) - a speedy Vue.js framework
- [Monaco](https://microsoft.github.io/monaco-editor/) - the editor from Visual Studio Code
- [Bulma](https://bulma.io/) - a CSS framework
- [Ant Design Vue](https://2x.antdv.com/components/overview/) - a components framework (still testing it out)

### Code Structure

- `/src/pages/` Contains all registered (accessible via its own link) pages. See the chapter Developing a new page for more informations
- `/src/components/` Contains all components. All components should be as reusable as possible and not just code fragments yanked from one specific page to make it smaller, without providing benefit for other use cases in the future
- `/public` contains files that will get copied directly to the output
- `/utils` contains a utility for publishing to GitHub pages

### Developing a new page
TODO:
