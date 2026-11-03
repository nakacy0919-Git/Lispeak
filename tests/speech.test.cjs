const { test } = require('node:test');
const assert = require('node:assert/strict');

class FakeRecognition {
  start() { this.started = true; }
  stop() { queueMicrotask(() => this.onend()); }
  abort() { queueMicrotask(() => this.onend()); }
  emit(...parts) {
    this.onresult({ resultIndex: 0, results: parts.map(([transcript, isFinal]) => ({
      0: { transcript }, isFinal
    })) });
  }
}
global.window = { SpeechRecognition: FakeRecognition };
const SpeechHandler = require('../js/speech.js');

test('recognition accumulates finalized transcript and waits for end', async () => {
  const speech = new SpeechHandler();
  const seen = [];
  assert.equal(speech.start(t => seen.push(t)), true);
  assert.equal(speech.start(() => {}), false);
  speech.recognition.emit(['The girl', true], [' is', false]);
  assert.equal(seen.at(-1), 'The girl  is');
  speech.recognition.emit(['The girl', true], [' is running', true]);
  const transcript = await speech.stop();
  assert.equal(transcript, 'The girl  is running');
  assert.equal(speech.isRecording, false);
  assert.equal(speech.isStopping, false);
});

test('recognition errors and unexpected end notify caller', () => {
  const speech = new SpeechHandler();
  const errors = [], endings = [];
  speech.start(() => {}, e => errors.push(e), e => endings.push(e));
  speech.recognition.onerror({ error: 'not-allowed' });
  speech.recognition.onend();
  assert.deepEqual(errors, ['not-allowed']);
  assert.equal(endings.length, 1);
  assert.equal(endings[0].unexpected, true);
  assert.equal(endings[0].error, 'not-allowed');
});

test('aborting a recording does not deliver stale completion callback', () => {
  const speech = new SpeechHandler();
  let calls = 0;
  speech.start(() => {}, () => {}, () => calls++);
  speech.abort();
  assert.equal(speech.isRecording, false);
  assert.equal(calls, 0);
});
