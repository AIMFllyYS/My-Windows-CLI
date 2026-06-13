const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const test = require('node:test');

execFileSync('cmd.exe', ['/c', 'npm run build --silent'], { stdio: 'pipe' });

test('slash typeahead filters commands by query and keeps stable command width', () => {
  const { createSlashTypeaheadState, renderSlashTypeahead } = require('../dist/chat/typeahead');

  const state = createSlashTypeaheadState('/mo', 'agent');
  const output = renderSlashTypeahead(state);

  assert.equal(state.active, true);
  assert.deepEqual(state.suggestions.map((item) => item.command), ['/model', '/model info']);
  assert.ok(state.commandWidth >= '/agent spawn <task>'.length);
  assert.match(output, /\/model/);
  assert.match(output, /Choose a configured model/);
  assert.doesNotMatch(output, /\/chat\s+Switch/);
});

test('slash typeahead selection cycles and applies tab versus enter actions', () => {
  const { createSlashTypeaheadState, moveSlashSelection, applySlashSelection } = require('../dist/chat/typeahead');

  const state = createSlashTypeaheadState('/', 'agent');
  const movedUp = moveSlashSelection(state, -1);
  assert.equal(movedUp.selectedIndex, state.suggestions.length - 1);

  const movedDown = moveSlashSelection(movedUp, 1);
  assert.equal(movedDown.selectedIndex, 0);

  assert.deepEqual(applySlashSelection(movedDown, 'tab'), {
    action: 'complete',
    input: movedDown.suggestions[0].command + ' ',
  });
  assert.deepEqual(applySlashSelection(movedDown, 'enter'), {
    action: 'execute',
    input: movedDown.suggestions[0].command,
  });
});

test('slash typeahead dismisses before global exit confirmation', () => {
  const { createSlashTypeaheadState, dismissSlashTypeahead } = require('../dist/chat/typeahead');
  const state = createSlashTypeaheadState('/agent', 'agent');
  const dismissed = dismissSlashTypeahead(state);

  assert.equal(state.active, true);
  assert.equal(dismissed.active, false);
  assert.equal(dismissed.suggestions.length, 0);
});

test('chat runtime references slash typeahead prompt controller', () => {
  const source = fs.readFileSync('src/chat/index.ts', 'utf8');

  assert.match(source, /promptWithSlashTypeahead/);
  assert.match(source, /onOverlayChange/);
  assert.match(source, /session\.inSubmenu/);
});

test('slash prompt reports overlay active while suggestions are visible', async () => {
  const { promptWithSlashTypeahead } = require('../dist/chat/typeahead');
  const input = new EventEmitter();
  input.isRaw = false;
  input.setRawMode = () => undefined;
  input.resume = () => undefined;
  const output = { write: () => undefined };
  const overlay = [];

  const pending = promptWithSlashTypeahead({
    prompt: '> ',
    mode: 'agent',
    input,
    output,
    onOverlayChange: (active) => overlay.push(active),
  });

  input.emit('keypress', '/', { name: undefined });
  input.emit('keypress', undefined, { name: 'escape' });
  input.emit('keypress', undefined, { name: 'return' });

  await pending;
  assert.deepEqual(overlay.slice(0, 2), [true, false]);
});

test('slash prompt lets ctrl-c dismiss suggestions before exit handling', async () => {
  const { promptWithSlashTypeahead } = require('../dist/chat/typeahead');
  const input = new EventEmitter();
  input.isRaw = false;
  input.setRawMode = () => undefined;
  input.resume = () => undefined;
  const output = { write: () => undefined };
  const overlay = [];

  const pending = promptWithSlashTypeahead({
    prompt: '> ',
    mode: 'agent',
    input,
    output,
    onOverlayChange: (active) => overlay.push(active),
  });

  input.emit('keypress', '/', { name: undefined });
  input.emit('keypress', undefined, { name: 'c', ctrl: true });
  input.emit('keypress', undefined, { name: 'return' });

  const value = await pending;
  assert.equal(value, '/');
  assert.deepEqual(overlay.slice(0, 2), [true, false]);
});

test('slash prompt abort cleans up keypress listener and resolves pending input', async () => {
  const { promptWithSlashTypeahead } = require('../dist/chat/typeahead');
  const input = new EventEmitter();
  input.isRaw = false;
  input.setRawMode = () => undefined;
  input.resume = () => undefined;
  const output = { write: () => undefined };
  const controller = new AbortController();

  const pending = promptWithSlashTypeahead({
    prompt: '> ',
    mode: 'agent',
    input,
    output,
    signal: controller.signal,
  });

  assert.equal(input.listenerCount('keypress'), 1);
  controller.abort();
  assert.equal(await pending, '');
  assert.equal(input.listenerCount('keypress'), 0);
});
