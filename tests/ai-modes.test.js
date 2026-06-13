const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

execFileSync('cmd.exe', ['/c', 'npm run build --silent'], { stdio: 'pipe' });

test('session starts in chat ask mode by default', () => {
  const { createSessionState } = require('../dist/chat/session');
  const state = createSessionState({ modelId: 'deepseek-v4-flash', autoAccept: false });

  assert.equal(state.mode, 'chat');
  assert.equal(state.permissionMode, 'ask');
  assert.equal(state.currentModelId, 'deepseek-v4-flash');
});

test('auto accept starts in agent bypass mode', () => {
  const { createSessionState } = require('../dist/chat/session');
  const state = createSessionState({ modelId: 'custom-model', autoAccept: true });

  assert.equal(state.mode, 'agent');
  assert.equal(state.permissionMode, 'bypass');
  assert.equal(state.currentModelId, 'custom-model');
});

test('mode transitions update permission mode without losing model', () => {
  const { createSessionState, setMode } = require('../dist/chat/session');
  const state = createSessionState({ modelId: 'model-a', autoAccept: false });

  setMode(state, 'plan');
  assert.equal(state.mode, 'plan');
  assert.equal(state.permissionMode, 'plan');
  assert.equal(state.currentModelId, 'model-a');

  setMode(state, 'agent');
  assert.equal(state.mode, 'agent');
  assert.equal(state.permissionMode, 'ask');

  setMode(state, 'chat');
  assert.equal(state.mode, 'chat');
  assert.equal(state.permissionMode, 'ask');
});

test('auto accept only keeps bypass in agent mode', () => {
  const { createSessionState, setMode } = require('../dist/chat/session');
  const state = createSessionState({ modelId: 'model-a', autoAccept: true });

  setMode(state, 'chat');
  assert.equal(state.mode, 'chat');
  assert.equal(state.permissionMode, 'ask');

  setMode(state, 'plan');
  assert.equal(state.mode, 'plan');
  assert.equal(state.permissionMode, 'plan');

  setMode(state, 'agent');
  assert.equal(state.mode, 'agent');
  assert.equal(state.permissionMode, 'bypass');
});

test('resolveModeCommand supports slash mode commands', () => {
  const { resolveModeCommand } = require('../dist/chat/modes');

  assert.deepEqual(resolveModeCommand('/chat'), { mode: 'chat' });
  assert.deepEqual(resolveModeCommand('/agent'), { mode: 'agent' });
  assert.deepEqual(resolveModeCommand('/plan'), { mode: 'plan' });
  assert.equal(resolveModeCommand('/model'), null);
});
