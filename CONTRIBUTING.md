# Contributing Guide

Welcome, interested person! Contributions are welcome. If you're ever unsure, feel free to open an issue.

Preferably, features are developed in another branch or fork. After the feature is ready, a pull request to the master branch should be opened.

## Prerequisites

- [Node 16 or greater](https://nodejs.org/en/). Don't install Chocolatey.
- A code editor (see below)

## Setup

1. Fork the repository
2. Clone your fork
3. `npm install`
4. `npm run dev`

## Recommended Tooling

I recommend using [Visual Studio Code](https://code.visualstudio.com/) with the following. Do note that the extensions will get automatically recommended, so just hit install and enjoy.

- [Prettier Extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) to format your files
- Settings &rarr; Format On Save &rarr; Enable (`"editor.formatOnSave": true,`)
  - If you are using autosave: Settings &rarr; Autosave &rarr; On Focus Change (`"files.autoSave": "onFocusChange",`)
- [Vue Language Features (Volar) Extension](https://marketplace.visualstudio.com/items?itemName=Vue.volar) for Vue.js
- [TypeScript Vue Plugin (Volar) Extension](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) for Vue.js. Take-over mode is *not* recommended, so just get this plugin.
- [(optional)Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens) to see all the errors inline with the code
- [(optional)TODO Highlight Extension](https://marketplace.visualstudio.com/items?itemName=wayou.vscode-todo-highlight)
- [(optional)i18n Ally](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally) for translating and internationalizing code

As for settings, I personally am a fan of those "inlay hints".
I also totally recommend using a decent browser such as Firefox or a Chromium browser with

- [Vue Devtools](https://devtools.vuejs.org/) to get top-notch debugging support

## Used Libraries

The most important ones are

- [Typescript](https://www.typescriptlang.org/) - Typesafe Javascript
- [Vue 3](https://github.com/vuejs/vue-next/) - Vue 3 with [the composition API](https://vue-composition-api-rfc.netlify.app/api.html)

We are also using

- [KaTeX](https://katex.org/) - rendering LaTeX equations
- [Vite](https://github.com/vuejs/vite) - a speedy Vue.js framework
- [Monaco](https://microsoft.github.io/monaco-editor/) - the editor from Visual Studio Code
- [Bulma](https://bulma.io/) - a CSS framework
- [Vuetify 3](https://next.vuetifyjs.com/en/components/app-bars/) - a components framework

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

## Accessibility

### Color Choice

If the UI doesn't need colors, keeping it black and white is the simplest and most straightforward option. If however, it does need colors, then please use the colors defined in `colors.ts`.
They can also be used as CSS vars, such as `var(--first-color)`. The CSS vars are defined in `index.css`.
