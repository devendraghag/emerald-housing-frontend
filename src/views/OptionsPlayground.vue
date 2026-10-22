<template>
  <section class="options-lab" v-cloak>
    <span class="page-kicker">LEARN BY TRYING</span>
    <h1 class="page-title">Vue Options API playground</h1>
    <p class="lead">Local examples only. These controls never change society records.</p>

    <section class="panel lab-card">
      <h2>State, computed values and watchers</h2>
      <Input ref="workspaceInput" name="lab-workspace" label="Example workspace" v-model="workspace" hint="The writable computed setter trims this value." />
      <label class="field-label" for="lab-search">Debounced example search</label>
      <input id="lab-search" class="text-input" v-focus v-model.trim="query" @keydown.esc="query = ''" />
      <p role="status">{{ searchStatus }}</p>
      <label><input type="checkbox" v-model="settings.showDetails" /> Show details</label>
      <p v-show="settings.showDetails">A deep watcher tracks changes to this settings object.</p>
      <p>{{ settingsStatus }}</p>
      <label for="lab-quantity">Quantity (.number)</label>
      <input id="lab-quantity" class="text-input" type="number" min="0" v-model.number="quantity" />
      <label for="lab-note">Note (.lazy)</label>
      <input id="lab-note" class="text-input" v-model.lazy="note" />
      <p v-text="note" :style="{ fontWeight: quantity > 1 ? 600 : 400 }"></p>
      <button class="button button-secondary" @click="$refs.workspaceInput.focus()">Focus workspace using exposed method</button>
      <p v-once>Initial workspace (v-once): {{ workspace }}</p>
      <code v-pre>{{ this text is not compiled }}</code>
      <p v-html="trustedHtml"></p>
      <button class="button button-secondary" @click="inspect">Inspect instance APIs</button>
      <pre v-if="inspection">{{ inspection }}</pre>
    </section>

    <section class="panel lab-card">
      <h2>Slots, render functions and cached components</h2>
      <p>Switch tabs; each count is preserved by KeepAlive. Workspace changes flow through reactive provide/inject.</p>
      <div class="lab-actions"><button v-for="tab in ['First', 'Second']" :key="tab" class="button button-secondary" :aria-pressed="activeTab === tab" @click="activeTab = tab">{{ tab }}</button></div>
      <KeepAlive :max="2"><CachedCounter :key="activeTab" :title="activeTab"><template #heading>{{ activeTab }} cached counter</template><template #default="{ count }"><RenderSummary :count="count"><template #default="summary">Scoped slot reports {{ summary.count }} clicks.</template></RenderSummary></template></CachedCounter></KeepAlive>
      <button class="button button-secondary" @click="snapshotLog">Refresh lifecycle log</button>
      <pre aria-label="Lifecycle events">{{ log.join('\n') }}</pre>
    </section>

    <section class="panel lab-card">
      <h2>Directives and transitions</h2>
      <button class="button button-secondary" @click="showNotice = !showNotice">Toggle notice</button>
      <Transition name="lab-fade"><p v-if="showNotice" class="notice">Transition animates entry and exit.</p></Transition>
      <form class="lab-actions" @submit.prevent="addItem"><label for="lab-item">List item</label><input id="lab-item" class="text-input" v-model.trim="newItem" /><button class="button" :disabled="!newItem">Add item</button></form>
      <TransitionGroup name="lab-fade" tag="ul"><li v-for="item in items" :key="item.id" v-memo="[item.text]">{{ item.text }} <button class="link-button" :aria-label="'Remove ' + item.text" @click="removeItem(item.id)">Remove</button></li></TransitionGroup>
      <label for="lab-binding">Dynamic binding</label><input id="lab-binding" type="checkbox" v-model="useTitle" /> Use title instead of aria-label
      <p :[bindingName]="'Dynamic directive argument example'">Hover or inspect this dynamic binding.</p>
    </section>

    <section class="panel lab-card">
      <h2>Teleport, errors and asynchronous components</h2>
      <button ref="dialogTrigger" class="button button-secondary" @click="openDialog">Open teleported dialog</button>
      <Teleport to="body"><dialog ref="dialog" class="lab-dialog" @close="restoreDialogFocus"><h2>Teleported dialog</h2><p>Rendered under document.body. Escape closes this native modal and its focus stays inside.</p><form method="dialog"><button class="button" autofocus>Close</button></form></dialog></Teleport>
      <button class="button button-secondary" @click="triggerError">Capture a descendant error</button>
      <p v-if="capturedError" role="status">{{ capturedError }}</p>
      <IntentionalError v-if="showError" />
      <button class="button button-secondary" @click="loadAsync = true" :disabled="loadAsync">Load async example</button>
      <p v-if="asyncError" role="alert">{{ asyncError }}</p>
      <Suspense v-if="loadAsync"><AsyncExample /><template #fallback><p role="status">Loading example...</p></template></Suspense>
    </section>
    <p class="body-text">Suspense is experimental. Runtime compiler options, TypeScript slot declarations, serverPrefetch and newer watcher APIs are covered in docs/vue-options-api.md.</p>
  </section>
</template>
<script>
import { computed, defineAsyncComponent } from 'vue';
import Input from '../components/forms/Input.vue';
import CachedCounter from '../components/options-lab/CachedCounter.vue';
import { RenderSummary, IntentionalError, lifecycleLog } from '../components/options-lab/examples';
export default {
  name: 'OptionsPlayground',
  components: { Input, CachedCounter, RenderSummary, IntentionalError, AsyncExample: defineAsyncComponent(() => import('../components/options-lab/AsyncExample.vue')) },
  directives: { focus: { mounted(el) { el.focus(); } } },
  data() {
    return { settings: { workspace: 'Emerald demo', showDetails: true }, query: '', searchStatus: '', settingsStatus: '', quantity: 1, note: '', activeTab: 'First', log: [], inspection: '', showNotice: true, newItem: '', items: [], nextId: 1, useTitle: true, showError: false, capturedError: '', loadAsync: false, asyncError: '', trustedHtml: '<strong>v-html uses this fixed, trusted string only.</strong>', stopQuantityWatcher: null };
  },
  provide() { return { labWorkspace: computed(() => this.settings.workspace) }; },
  computed: {
    workspace: { get() { return this.settings.workspace; }, set(value) { this.settings.workspace = value.trim(); } },
    bindingName() { return this.useTitle ? 'title' : 'aria-label'; },
  },
  watch: {
    query: {
      immediate: true,
      handler(value, previous, onCleanup) {
        this.searchStatus = 'Waiting for typing to finish...';
        const timer = setTimeout(() => { this.searchStatus = value ? `Local preview for “${value}”` : 'Enter a search phrase.'; }, 300);
        onCleanup(() => clearTimeout(timer));
      },
    },
    settings: { deep: true, flush: 'post', handler() { this.settingsStatus = `Settings updated: ${this.settings.workspace}`; } },
  },
  created() {
    this.stopQuantityWatcher = this.$watch('quantity', value => {
      if (typeof value === 'number' && value < 0) this.quantity = 0;
    });
  },
  beforeUnmount() {
    this.stopQuantityWatcher();
    if (this.$refs.dialog && this.$refs.dialog.open) this.$refs.dialog.close();
  },
  errorCaptured(error, instance, info) {
    if (info === 'async component loader') this.asyncError = 'The example could not load. Reload the page to retry.';
    else this.capturedError = error.message;
    return false;
  },
  methods: {
    snapshotLog() { this.log = lifecycleLog.slice(); },
    inspect() {
      this.inspection = JSON.stringify({ name: this.$options.name, stateKeys: Object.keys(this.$data), propKeys: Object.keys(this.$props), rootElement: this.$el.tagName, parent: this.$parent && this.$parent.$options.name || 'Router wrapper', root: this.$root.$options.name || 'App', attrs: Object.keys(this.$attrs), slots: Object.keys(this.$slots) }, null, 2);
      this.$forceUpdate(); // Educational only; reactive state normally makes this unnecessary.
    },
    addItem() { if (this.newItem) { this.items.push({ id: this.nextId++, text: this.newItem }); this.newItem = ''; } },
    removeItem(id) { this.items = this.items.filter(item => item.id !== id); },
    async triggerError() { this.showError = false; this.capturedError = ''; await this.$nextTick(); this.showError = true; },
    openDialog() { this.$refs.dialog.showModal(); },
    restoreDialogFocus() { if (this.$refs.dialogTrigger) this.$refs.dialogTrigger.focus(); },
  },
};
</script>
<style scoped>
.lab-card { padding: 24px; margin-block: 24px; }
.lab-card h2, .lab-card h3 { margin-bottom: 16px; }
.lab-card p, .lab-card pre, .lab-card ul { margin-block: 16px; }
.lab-card .text-input { max-width: 460px; display: block; margin-block: 8px 16px; }
.lab-card button { margin: 4px; }
.lab-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; max-height: 320px; overflow: auto; background: #f6f2ee; padding: 16px; }
.lab-dialog { margin: auto; max-width: min(90vw, 480px); border: 1px solid #ccc; border-radius: 16px; padding: 28px; }
.lab-dialog::backdrop { background: #0007; }
.lab-fade-enter-active, .lab-fade-leave-active, .lab-fade-move { transition: opacity .2s, transform .2s; }
.lab-fade-enter-from, .lab-fade-leave-to { opacity: 0; transform: translateY(6px); }
[v-cloak] { display: none; }
@media (prefers-reduced-motion: reduce) { .lab-fade-enter-active, .lab-fade-leave-active, .lab-fade-move { transition: none; } }
</style>
