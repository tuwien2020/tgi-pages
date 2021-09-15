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
- [Patternfly](https://www.patternfly.org/v4/components/select/) - a components framework

### Code Structure

- `/src/pages/` Contains all registered (accessible via its own link) pages. See the chapter [Registering a new page](#registering-a-new-page) for more informations
- `/src/components/` Contains all components. All components should be as reusable as possible and not just code fragments yanked from one specific page to make it smaller, without providing benefit for other use cases in the future
- `/public` contains files that will get copied directly to the output
- `/utils` contains a utility for publishing to GitHub pages
- `/src/router/navigation.ts` Contains all links to internal and external pages

## Registering a new page

### External Page

To add an external page to the overview, go to `src/router/navigation.ts` and add an entry to the `tools` array
The entry should look something like this

```ts
  {
    name: "Example Page", // The name/title
    link: "https://example.com", // the link
    category: chapterDict[Chapter.Schaltwerke], // which chapter does the page belong to
    internal: false, // as this is an external page, internal should be false
  },
```

That is all that you need to do, as the overview page and the search results all are generated from these entries.

### Internal Page

Registering an internal page requires you to create a new page.
First create a new file under `/src/pages` e.g.: `/src/pages/Example.vue`.

The file should consist of a `<template>` tag with the HTML of your page and a `<script lang="ts">` tag with your typescript code. In the script tag you need to export your component like this `export default defineComponent(...);`.

When your done writing your component, register it in the `/src/router/navigation.ts` file.
Import your component like this ` import Example from "./../pages/Example.vue";`
Create a new entry in the `tools` array. The entry should look something like this.

```ts
  {
    name: "Example page", // name of your page
    link: "example", // the route that your component registers to
    category: chapterDict[Chapter.Codierung], // which chapter does the page belong to
    internal: true, // as it is an internal page, internal is true
    page: Example, // your component
  },
```

After adding your page in the `tools` array, it will automatically be linked in the Overview page, searchable via the navbar and mapped to a route matching the link in the entry.
