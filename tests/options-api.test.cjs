const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('@vue/compiler-sfc');
const Vue = require('vue');

// Load the actual Options API scripts without a browser or extra test dependency.
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (!path.extname(file)) file += '.js';
  if (cache.has(file)) return cache.get(file);
  let code = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.vue')) code = parse(code).descriptor.script.content;
  code = code.replace(/import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?/g, (_, binding, source) => {
    return `const ${binding.trim()} = loadModule(${JSON.stringify(source)});`;
  });
  const names = [];
  code = code.replace(/export const (\w+)/g, (_, name) => { names.push(name); return `const ${name}`; });
  if (code.includes('export default')) code = code.replace('export default', 'return');
  else code += `\nreturn { ${names.join(', ')} };`;
  const result = new Function('loadModule', code)(source => source === 'vue' ? Vue : load(path.resolve(path.dirname(file), source)));
  cache.set(file, result);
  return result;
}
function node() { return { children: [], parent: null, props: {}, focus() { this.focused = true; } }; }
const renderer = Vue.createRenderer({
  createElement: node, createText: node, createComment: node,
  setText() {}, setElementText() {},
  patchProp(el, key, oldValue, value) { el.props[key] = value; },
  insert(el, parent, anchor) { if (el.parent) { const i = el.parent.children.indexOf(el); if (i >= 0) el.parent.children.splice(i, 1); } el.parent = parent; const i = parent.children.indexOf(anchor); parent.children.splice(i < 0 ? parent.children.length : i, 0, el); },
  remove(el) { const i = el.parent.children.indexOf(el); if (i >= 0) el.parent.children.splice(i, 1); el.parent = null; },
  parentNode: el => el.parent, nextSibling: el => el.parent && el.parent.children[el.parent.children.indexOf(el) + 1],
});
function mount(options) { const app = renderer.createApp(options); app.config.unwrapInjectedRef = true; const vm = app.mount(node()); return { app, vm }; }
const playground = load('src/views/OptionsPlayground.vue');

test('shared Input preserves model updates and restricts its exposed ref to focus', async () => {
  const input = load('src/components/forms/Input.vue');
  let child;
  const values = [];
  const { app, vm } = mount({ render() { return Vue.h({ ...input, render() { child = this; return Vue.h('input', { ref: 'input' }); } }, { ref: 'field', modelValue: 'initial', 'onUpdate:modelValue': value => values.push(value) }); } });
  assert.equal(child.value, 'initial');
  child.value = 'changed';
  assert.deepEqual(values, ['changed']);
  assert.equal(vm.$refs.field.value, undefined);
  vm.$refs.field.focus();
  assert.equal(child.$refs.input.focused, true);
  app.unmount();
});

test('playground normalizes state and cancels stale and unmounted watcher callbacks', async () => {
  const { app, vm } = mount({ ...playground, render: () => null });
  vm.workspace = '  Maple House  ';
  assert.equal(vm.settings.workspace, 'Maple House');
  vm.quantity = -2;
  vm.query = 'old';
  await Vue.nextTick();
  assert.equal(vm.quantity, 0);
  vm.query = 'latest';
  await Vue.nextTick();
  await new Promise(resolve => setTimeout(resolve, 350));
  assert.equal(vm.searchStatus, 'Local preview for “latest”');
  assert.equal(vm.settingsStatus, 'Settings updated: Maple House');
  vm.query = 'pending';
  await Vue.nextTick();
  app.unmount();
  await new Promise(resolve => setTimeout(resolve, 350));
  assert.equal(vm.searchStatus, 'Waiting for typing to finish...');
});

test('KeepAlive preserves independent counts and reactive injection, then tears down', async () => {
  const counter = load('src/components/options-lab/CachedCounter.vue');
  const { lifecycleLog } = load('src/components/options-lab/examples.js');
  lifecycleLog.length = 0;
  const stable = { ...counter, render() { return Vue.h('p', this.workspaceName + this.count); } };
  const mounted = mount({ ...playground, render() { return Vue.h(Vue.KeepAlive, { max: 2 }, { default: () => Vue.h(stable, { key: this.activeTab, title: this.activeTab, ref: 'counter' }) }); } });
  mounted.vm.$refs.counter.increment();
  mounted.vm.activeTab = 'Second';
  await Vue.nextTick();
  assert.equal(mounted.vm.$refs.counter.count, 0);
  mounted.vm.workspace = 'Updated workspace';
  await Vue.nextTick();
  assert.equal(mounted.vm.$refs.counter.workspaceName, 'Updated workspace');
  mounted.vm.activeTab = 'First';
  await Vue.nextTick();
  assert.equal(mounted.vm.$refs.counter.count, 1);
  assert.ok(lifecycleLog.some(event => event.endsWith(': deactivated')));
  mounted.app.unmount();
  assert.ok(lifecycleLog.some(event => event.endsWith(': unmounted')));
});

test('error boundary captures descendant errors without propagating', () => {
  const { IntentionalError } = load('src/components/options-lab/examples.js');
  const { app, vm } = mount({ ...playground, render() { return Vue.h(IntentionalError); } });
  assert.equal(vm.capturedError, 'Example descendant error captured successfully.');
  app.unmount();
});
