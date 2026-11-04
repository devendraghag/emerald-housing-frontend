const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('@vue/compiler-sfc');
const Vue = require('vue');

const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (!path.extname(file)) file += '.js';
  if (cache.has(file)) return cache.get(file);
  let code = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.vue')) code = parse(code).descriptor.script.content;
  code = code.replace(/import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?/g, (_, binding, source) => `const ${binding.trim()} = loadModule(${JSON.stringify(source)});`);
  const names = [];
  code = code.replace(/export const (\w+)/g, (_, name) => { names.push(name); return `const ${name}`; });
  code = code.includes('export default') ? code.replace('export default', 'return') : `${code}\nreturn { ${names.join(', ')} };`;
  const result = new Function('loadModule', code)(source => source === 'vue' ? Vue : load(path.resolve(path.dirname(file), source)));
  cache.set(file, result);
  return result;
}
function node() { return { children: [], parent: null, props: {}, focus() { this.focused = true; } }; }
const renderer = Vue.createRenderer({
  createElement: node, createText: node, createComment: node, setText() {}, setElementText() {},
  patchProp(el, key, oldValue, value) { el.props[key] = value; },
  insert(el, parent, anchor) { if (el.parent) { const i = el.parent.children.indexOf(el); if (i >= 0) el.parent.children.splice(i, 1); } el.parent = parent; const i = parent.children.indexOf(anchor); parent.children.splice(i < 0 ? parent.children.length : i, 0, el); },
  remove(el) { const i = el.parent.children.indexOf(el); if (i >= 0) el.parent.children.splice(i, 1); el.parent = null; },
  parentNode: el => el.parent, nextSibling: el => el.parent && el.parent.children[el.parent.children.indexOf(el) + 1],
});
function mount(options) { const app = renderer.createApp(options); app.config.unwrapInjectedRef = true; const vm = app.mount(node()); return { app, vm }; }

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

test('shared Input gives field-specific guidance and preserves explicit hints', () => {
  const input = load('src/components/forms/Input.vue');
  const hint = (fields) => input.computed.fieldHint.call(fields);
  assert.equal(hint({ hint: '', label: 'Mobile number', type: 'tel', numericPhone: true, $attrs: {} }), 'Enter digits only.');
  assert.equal(hint({ hint: '', label: 'Email address', type: 'email', $attrs: {} }), 'Enter a valid email address.');
  assert.equal(hint({ hint: '', label: 'Floor number', type: 'number', numericPhone: false, $attrs: { min: '1', max: '99' } }), 'Enter a number from 1 to 99.');
  assert.equal(hint({ hint: '10 digits starting with 6, 7, 8 or 9.', label: 'Mobile number', type: 'tel', $attrs: {} }), '10 digits starting with 6, 7, 8 or 9.');
});

test('digit-only phone fields sanitize input and request a numeric mobile keyboard', () => {
  const input = load('src/components/forms/Input.vue');
  let emitted;
  input.computed.value.set.call({ numericPhone: true, $emit: (_, value) => { emitted = value; } }, '98a 765-4321');
  assert.equal(emitted, '987654321');
  assert.equal(input.computed.inputMode.call({ numericPhone: true }), 'numeric');
  assert.equal(input.computed.inputMode.call({ numericPhone: false }), undefined);
});

test('every dropdown has visible choice guidance', () => {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (file.endsWith('.vue')) files.push(file);
    }
  }
  walk(path.resolve('src'));
  let dropdowns = 0;
  for (const file of files) {
    const template = parse(fs.readFileSync(file, 'utf8')).descriptor.template?.content || '';
    for (const match of template.matchAll(/<select\b/g)) {
      dropdowns++;
      const hintIndex = template.lastIndexOf('class="field-hint"', match.index);
      assert.ok(hintIndex >= 0 && match.index - hintIndex < 300, `${path.relative(process.cwd(), file)} dropdown needs visible guidance`);
    }
  }
  assert.ok(dropdowns > 0, 'expected the app to contain dropdowns');
});
