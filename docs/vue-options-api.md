# Vue 3 Options API coverage

Open **Vue Options API** in the sidebar or footer after signing in, or visit `/vue-options`. The playground uses local demonstration state and never writes to backend records. All components use Options API; there is no `setup()` or `<script setup>`.

| Checklist area | Implementation / exercise |
| --- | --- |
| data, methods, computed, writable computed | Existing screens; `Input.vue` proxies model values through a computed getter/setter; playground normalizes the workspace name. |
| watch | App route watcher; playground immediate debounced query with third-argument cleanup, deep settings watcher with `flush: 'post'`, and programmatic `$watch` with explicit stop. Change the query quickly to cancel old callbacks. |
| props, validation, emits, expose | Shared input validates model events and exposes only `focus`; cached counter validates its required title; render summary validates a nonnegative count. |
| lifecycle | Cached counter's mixin records beforeCreate, created, beforeMount, mounted, beforeUpdate, updated, beforeUnmount, unmounted, activated, deactivated. Switch tabs, increment, then refresh the log. Unmount events occur when leaving the page and are available when returning. |
| debug hooks | renderTracked/renderTriggered record to a bounded, nonreactive buffer in development; production omits these hooks. Manual refresh avoids reactive logging loops. |
| errorCaptured | Playground captures a deliberately throwing child and provides an async-load failure message. |
| render | RenderSummary uses `h` and `$slots`; other components use compiled SFC templates. |
| provide/inject | Playground provides a computed workspace name; CachedCounter injects it with an alias and default. `main.js` enables Vue 3.2’s `unwrapInjectedRef` compatibility option. `computed` is used inside `provide()`, without Composition API component setup. |
| mixins/extends | CachedCounter extends CounterBase for state/methods and mixes in diagnostic lifecycle hooks. Isolated here for learning rather than implicit application dependencies. |
| name, inheritAttrs, components, directives | Explicit component names, shared input attribute forwarding, local component registration, and a local `v-focus` directive. |
| instance APIs | Playground inspector reads `$data`, `$props`, `$el`, `$options`, `$parent`, `$root`, `$attrs`, `$slots`; input demonstrates `$refs`/`$emit`; playground uses `$watch`, `$nextTick`, and an educational `$forceUpdate`. Inspector reads parent/root metadata only. |
| bindings/directives | Existing interpolation, expressions, attribute/class bindings, conditionals, keyed lists, events and keyboard modifiers; playground adds `v-show`, `v-text`, fixed trusted `v-html`, `v-once`, `v-memo`, `v-pre`, `v-cloak`, dynamic directive arguments, `.trim`, `.number`, `.lazy`, scoped/default slots. The note binds inline styles based on quantity. |
| Transition / TransitionGroup | Toggle a notice; add/remove keyed example items. Reduced-motion preferences disable animations. |
| KeepAlive | Two keyed counter instances retain independent counts during tab changes; bounded to two entries. Leaving the route destroys the examples. |
| Teleport | Native modal dialog teleported to body, with browser focus containment, Escape dismissal, and explicit trigger focus restoration. |
| Suspense | Load an async Options API component on demand with a fallback. This Vue feature remains experimental. |

## Context-dependent features

These are documented rather than enabled artificially in the client app:

- **Watcher `once`:** requires Vue 3.4+. This repo remains pinned to 3.2.45. A one-time watcher can be stopped manually using the function returned from `$watch` on this version.
- **`onWatcherCleanup`:** requires Vue 3.5+. The playground uses the compatible handler cleanup callback instead.
- **`serverPrefetch`:** runs with server-side rendering. This Vue CLI app renders in the browser; there is no SSR pipeline. An Options API SSR component would use `async serverPrefetch() { this.records = await loadRecords(); }`, with initial state hydration needed to avoid fetching twice.
- **`compilerOptions`, `delimiters`, and the string `template` option:** require a Vue build containing the runtime compiler. Here `.vue` templates are compiled at build time. For an intentionally compiler-enabled app, a trusted component could use `template: '<p>[[ message ]]</p>', compilerOptions: { delimiters: ['[[', ']]'] }`. Never compile user-provided strings. SFC compiler settings belong in the build configuration.
- **`slots` type declarations:** TypeScript tooling support rather than slot rendering. This JavaScript repo demonstrates actual slots through templates and `$slots`. A TypeScript component can declare `slots: Object as SlotsType<{ default: { count: number } }>` with Vue's `SlotsType` on a supported newer Vue release.

References: [State options](https://vuejs.org/api/options-state.html), [Lifecycle](https://vuejs.org/api/options-lifecycle.html), [Rendering options](https://vuejs.org/api/options-rendering.html), [Injection/reuse](https://vuejs.org/api/options-composition.html), [Instance API](https://vuejs.org/api/component-instance.html), [Directives](https://vuejs.org/api/built-in-directives.html), [Built-in components](https://vuejs.org/api/built-in-components.html).
