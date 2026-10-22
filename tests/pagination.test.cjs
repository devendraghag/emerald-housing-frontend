const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PAGE_SIZE, pageCount, clampPage, pageItems } = require('../src/util/pagination.cjs');
test('lists contain ten items per page with a partial last page', () => {
 const items = Array.from({length: 23}, (_, i) => i + 1);
 assert.equal(PAGE_SIZE, 10);
 assert.equal(pageCount(items.length), 3);
 assert.deepEqual(pageItems(items, 0), items.slice(0,10));
 assert.deepEqual(pageItems(items, 1), items.slice(10,20));
 assert.deepEqual(pageItems(items, 2), [21,22,23]);
});
test('empty and exact-size lists do not add an extra page', () => {
 assert.equal(pageCount(0),0);
 assert.equal(pageCount(10),1);
 assert.equal(pageCount(20),2);
 assert.deepEqual(pageItems([],0),[]);
});
test('navigation stays within bounds when records are removed', () => {
 assert.equal(clampPage(-1,3),0);
 assert.equal(clampPage(99,3),2);
 assert.equal(clampPage(2,1),0);
 assert.equal(clampPage(0,0),0);
 assert.deepEqual(pageItems([1,2],9),[1,2]);
});
