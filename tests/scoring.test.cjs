const { test } = require('node:test');
const assert = require('node:assert/strict');
const SpeakingScorer = require('../js/scoring.js');

test('exact reading receives full coverage', () => {
  assert.equal(SpeakingScorer.compare('The girl has a bike.', 'The girl has a bike').accuracy, 100);
});
test('repeated expected words require repeated recognized words', () => {
  const r = SpeakingScorer.compare('go go home', 'go home');
  assert.equal(r.accuracy, 67);
  assert.deepEqual(r.matchedIndices, [0, 2]);
});
test('word order matters', () => {
  assert.equal(SpeakingScorer.compare('cat dog bird', 'bird dog cat').accuracy, 33);
});
test('empty reading is zero', () => {
  assert.equal(SpeakingScorer.compare('hello world', '').accuracy, 0);
  assert.equal(SpeakingScorer.compare('', '').accuracy, 0);
});
test('contractions and punctuation normalize', () => {
  assert.equal(SpeakingScorer.compare("I can't believe it.", 'I can’t believe it').accuracy, 100);
});
test('extra recognized words do not inflate score above 100', () => {
  assert.equal(SpeakingScorer.compare('I see it', 'I see it and more words').accuracy, 100);
});
