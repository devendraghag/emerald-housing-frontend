const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('@vue/compiler-sfc');

const src = path.resolve(__dirname, '../src');
function vueFiles(dir = src) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? vueFiles(file) : file.endsWith('.vue') ? [file] : [];
  });
}

test('shared inputs render an associated label and a described instruction', () => {
  const template = parse(fs.readFileSync(path.join(src, 'components/forms/Input.vue'), 'utf8')).descriptor.template.content;
  assert.match(template, /<label[^>]*:for="name"/);
  assert.match(template, /:id="`\$\{name\}-hint`"/);
  assert.match(template, /:aria-describedby="describedBy"/);
  assert.match(template, /v-if="fieldHint"/);
});

test('every shared Input usage supplies a visible label', () => {
  for (const file of vueFiles()) {
    const template = parse(fs.readFileSync(file, 'utf8')).descriptor.template?.content || '';
    for (const match of template.matchAll(/<Input\b[^>]*>/g)) {
      assert.match(match[0], /(?:^|\s)(?::?label)="[^"]+"/, `${path.relative(src, file)} Input is missing a label`);
      assert.match(match[0], /(?:^|\s)(?::?name)="[^"]+"/, `${path.relative(src, file)} Input is missing a stable control name`);
    }
  }
});

test('standalone search and file inputs expose accessible names', () => {
  const list = parse(fs.readFileSync(path.join(src, 'views/RecordList.vue'), 'utf8')).descriptor.template.content;
  const lookup = parse(fs.readFileSync(path.join(src, 'components/RecordLookup.vue'), 'utf8')).descriptor.template.content;
  const lostFound = parse(fs.readFileSync(path.join(src, 'views/LostFound.vue'), 'utf8')).descriptor.template.content;
  assert.match(list, /<input[^>]*:aria-label="'Search all permitted '/);
  assert.match(lookup, /<input[^>]*:aria-label="'Search '\+label/);
  assert.match(lostFound, /<label[^>]*>Optional photo[^<]*<input[^>]*type="file"/);
});
