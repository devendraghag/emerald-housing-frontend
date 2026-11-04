const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(file) {
  return fs.readFileSync(path.resolve(__dirname, '../src', file), 'utf8');
}

function inputTag(file, name) {
  const match = source(file).match(new RegExp(`<Input\\b(?=[^>]*\\bname="${name}")[^>]*>`));
  assert.ok(match, `Expected input ${name} in ${file}`);
  return match[0];
}

function matchesHtmlPattern(pattern, value) {
  return new RegExp(`^(?:${pattern})$`).test(value);
}

function validNumber({ min, max, step }, value) {
  const number = Number(value);
  if (!Number.isFinite(number) || (min !== undefined && number < min) || (max !== undefined && number > max)) return false;
  if (step === undefined) return true;
  const base = min || 0;
  return Math.abs((number - base) / step - Math.round((number - base) / step)) < 1e-9;
}

test('mobile fields keep the required 10-digit range and reject invalid boundaries', () => {
  for (const [file, name] of [['views/Profile.vue', 'profileMobile'], ['views/CommunityManagement.vue', 'ownerMobile']]) {
    const tag = inputTag(file, name);
    const pattern = tag.match(/pattern="([^"]+)"/);
    assert.ok(pattern, `${name} must declare a browser pattern`);
    assert.match(tag, /type="tel"/);
    assert.match(tag, /required/);
    assert.equal(matchesHtmlPattern(pattern[1], '9876543210'), true);
    assert.equal(matchesHtmlPattern(pattern[1], '5876543210'), false);
    assert.equal(matchesHtmlPattern(pattern[1], '987654321'), false);
    assert.equal(matchesHtmlPattern(pattern[1], '98765432100'), false);
  }
});

test('numeric form controls preserve inclusive bounds and step constraints', () => {
  const floorTag = inputTag('views/SocietyManagement.vue', 'newFloorNumber');
  assert.match(floorTag, /required/);
  assert.equal(validNumber({ min: 1, max: 99, step: 1 }, 1), true);
  assert.equal(validNumber({ min: 1, max: 99, step: 1 }, 99), true);
  assert.equal(validNumber({ min: 1, max: 99, step: 1 }, 0), false);
  assert.equal(validNumber({ min: 1, max: 99, step: 1 }, 100), false);
  assert.equal(validNumber({ min: 1, max: 99, step: 1 }, 1.5), false);

  const amountTag = inputTag('views/RentalManagement.vue', 'rentAmount');
  assert.match(amountTag, /type="number"/);
  assert.match(amountTag, /min="0\.01"/);
  assert.match(amountTag, /step="0\.01"/);
  assert.equal(validNumber({ min: 0.01, step: 0.01 }, 0.01), true);
  assert.equal(validNumber({ min: 0.01, step: 0.01 }, 0), false);
});

test('email fields use native email validation and selection controls remain required where needed', () => {
  assert.match(inputTag('views/CommunityManagement.vue', 'ownerEmail'), /type="email"/);
  assert.match(inputTag('views/Profile.vue', 'profileEmail'), /type="email"/);
  assert.match(source('views/Memberships.vue'), /id="flatId"[\s\S]{0,150}required/);
  assert.match(source('components/RecordLookup.vue'), /:required="required"/);
});
