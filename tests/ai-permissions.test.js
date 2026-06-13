const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const test = require('node:test');

execFileSync('cmd.exe', ['/c', 'npm run build --silent'], { stdio: 'pipe' });

const workspaceRoot = path.resolve('D:/new_project/My-CLI');

function request(overrides) {
  return {
    mode: 'chat',
    permissionMode: 'ask',
    tool: { name: 'read_file', kind: 'read' },
    input: { path: path.join(workspaceRoot, 'README.md') },
    workspaceRoot,
    ...overrides,
  };
}

test('chat mode allows read tools', () => {
  const { decidePermission } = require('../dist/chat/permissions/engine');

  const decision = decidePermission(request());

  assert.deepEqual(decision, { decision: 'allow', reason: 'read tool allowed in chat mode' });
});

test('chat mode denies write and shell tools', () => {
  const { decidePermission } = require('../dist/chat/permissions/engine');

  assert.equal(decidePermission(request({ tool: { name: 'write_file', kind: 'write' } })).decision, 'deny');
  assert.equal(decidePermission(request({ tool: { name: 'shell', kind: 'shell' } })).decision, 'deny');
});

test('permission engine enforces registry metadata over request kind', () => {
  const { decidePermission } = require('../dist/chat/permissions/engine');

  const decision = decidePermission(request({
    mode: 'chat',
    permissionMode: 'ask',
    tool: { name: 'shell', kind: 'read' },
  }));

  assert.equal(decision.decision, 'deny');
});

test('plan mode denies write tools', () => {
  const { decidePermission } = require('../dist/chat/permissions/engine');

  const decision = decidePermission(request({
    mode: 'plan',
    permissionMode: 'plan',
    tool: { name: 'write_file', kind: 'write' },
  }));

  assert.equal(decision.decision, 'deny');
});

test('agent ask mode asks for write and shell tools', () => {
  const { decidePermission } = require('../dist/chat/permissions/engine');

  assert.equal(decidePermission(request({
    mode: 'agent',
    permissionMode: 'ask',
    tool: { name: 'write_file', kind: 'write' },
  })).decision, 'ask');
  assert.equal(decidePermission(request({
    mode: 'agent',
    permissionMode: 'ask',
    tool: { name: 'shell', kind: 'shell' },
  })).decision, 'ask');
});

test('agent bypass allows workspace writes but denies dangerous outside paths', () => {
  const { decidePermission } = require('../dist/chat/permissions/engine');

  assert.equal(decidePermission(request({
    mode: 'agent',
    permissionMode: 'bypass',
    tool: { name: 'write_file', kind: 'write' },
    input: { path: path.join(workspaceRoot, 'tmp.txt') },
  })).decision, 'allow');
  assert.equal(decidePermission(request({
    mode: 'agent',
    permissionMode: 'bypass',
    tool: { name: 'write_file', kind: 'write' },
    input: { path: 'C:/Users/AIMFl/.ssh/id_rsa' },
  })).decision, 'deny');
});

test('session decisions can allow a repeated ask tool', () => {
  const { decidePermission, rememberSessionDecision } = require('../dist/chat/permissions/engine');
  const state = { allowedTools: new Set(), deniedTools: new Set() };
  rememberSessionDecision(state, { toolName: 'shell', decision: 'allow' });

  const decision = decidePermission(request({
    mode: 'agent',
    permissionMode: 'ask',
    tool: { name: 'shell', kind: 'shell' },
    session: state,
  }));

  assert.equal(decision.decision, 'allow');
});

test('session allow cannot bypass paths outside workspace', () => {
  const { decidePermission, rememberSessionDecision } = require('../dist/chat/permissions/engine');
  const state = { allowedTools: new Set(), deniedTools: new Set() };
  rememberSessionDecision(state, { toolName: 'write_file', decision: 'allow' });

  const decision = decidePermission(request({
    mode: 'agent',
    permissionMode: 'ask',
    tool: { name: 'write_file', kind: 'write' },
    input: { path: 'C:/Users/AIMFl/.ssh/id_rsa' },
    session: state,
  }));

  assert.equal(decision.decision, 'deny');
});

test('session allow cannot bypass chat or plan mode restrictions', () => {
  const { decidePermission, rememberSessionDecision } = require('../dist/chat/permissions/engine');
  const state = { allowedTools: new Set(), deniedTools: new Set() };
  rememberSessionDecision(state, { toolName: 'shell', decision: 'allow' });

  assert.equal(decidePermission(request({
    mode: 'chat',
    permissionMode: 'ask',
    tool: { name: 'shell', kind: 'shell' },
    session: state,
  })).decision, 'deny');

  assert.equal(decidePermission(request({
    mode: 'plan',
    permissionMode: 'plan',
    tool: { name: 'shell', kind: 'shell' },
    session: state,
  })).decision, 'deny');
});

test('relative permission paths are resolved against workspace root', () => {
  const { decidePermission } = require('../dist/chat/permissions/engine');
  const originalCwd = process.cwd();
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'hi-permission-workspace-'));
  const other = fs.mkdtempSync(path.join(os.tmpdir(), 'hi-permission-other-'));

  try {
    process.chdir(other);
    const decision = decidePermission({
      mode: 'agent',
      permissionMode: 'bypass',
      tool: { name: 'write_file', kind: 'write' },
      input: { path: 'relative.txt' },
      workspaceRoot: workspace,
    });

    assert.equal(decision.decision, 'allow');
  } finally {
    process.chdir(originalCwd);
  }
});
