import test from 'node:test';
import assert from 'node:assert/strict';
import { ratingAt, starsLabel, reaverage } from '../src/forum/rating.js';
import { moved } from '../src/forum/reorder.js';
import { read, keyOf, clear } from '../src/forum/topStore.js';

test('the half star under the pointer', () => {
  assert.equal(ratingAt(0, 100), 1);
  assert.equal(ratingAt(9, 100), 1);
  assert.equal(ratingAt(11, 100), 2);
  assert.equal(ratingAt(55, 100), 6);
  assert.equal(ratingAt(100, 100), 10);
  assert.equal(ratingAt(140, 100), 10);
  assert.equal(ratingAt(5, 0), 0);
});

test('ratings read as stars', () => {
  assert.equal(starsLabel(9), '4.5');
  assert.equal(starsLabel(8), '4');
});

test('the average follows the viewer’s own rating', () => {
  // Two ratings: 8 and 5 → 3.25 stars.
  const shelf = { average: 3.25, count: 2 };
  assert.deepEqual(reaverage(shelf, null, 10), { average: 3.83, count: 3 });
  assert.deepEqual(reaverage(shelf, 5, 9), { average: 4.25, count: 2 });
  assert.deepEqual(reaverage(shelf, 5, null), { average: 4, count: 1 });
  assert.deepEqual(reaverage({ average: 4, count: 1 }, 8, null), { average: null, count: 0 });
  assert.deepEqual(reaverage({ average: null, count: 0 }, null, 7), { average: 3.5, count: 1 });
});

test('dragging moves one item', () => {
  assert.deepEqual(moved(['a', 'b', 'c', 'd'], 0, 2), ['b', 'c', 'a', 'd']);
  assert.deepEqual(moved(['a', 'b', 'c', 'd'], 3, 0), ['d', 'a', 'b', 'c']);
});

test('the top-rated store asks once per query, however often it is drawn', async () => {
  clear();
  let calls = 0;
  let redraws = 0;
  const fetch = () => {
    calls++;
    return Promise.resolve({ data: [{ id: 1 }] });
  };

  // A widget re-created on every redraw reads again and again.
  const first = read({ period: 'month', limit: 5 }, fetch, () => redraws++);
  for (let i = 0; i < 20; i++) read({ period: 'month', limit: 5 }, fetch, () => redraws++);
  assert.equal(first.items, null);
  assert.equal(calls, 1);

  await new Promise((r) => setTimeout(r));
  assert.deepEqual(read({ period: 'month', limit: 5 }, fetch, () => {}).items, [{ id: 1 }]);
  assert.equal(redraws, 1);

  read({ period: 'all', limit: 5 }, fetch, () => {});
  assert.equal(calls, 2);
  assert.notEqual(keyOf({ period: 'month' }), keyOf({ period: 'all' }));
});

test('a failed request settles instead of retrying on every draw', async () => {
  clear();
  let calls = 0;
  const fetch = () => {
    calls++;
    return Promise.reject(new Error('down'));
  };
  read({}, fetch, () => {});
  await new Promise((r) => setTimeout(r));
  const state = read({}, fetch, () => {});
  assert.equal(state.failed, true);
  assert.deepEqual(state.items, []);
  assert.equal(calls, 1);
});
