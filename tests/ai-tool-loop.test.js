const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

execFileSync('cmd.exe', ['/c', 'npm run build --silent'], { stdio: 'pipe' });

function toolCall(id, name, args) {
  return {
    id,
    type: 'function',
    function: {
      name,
      arguments: JSON.stringify(args),
    },
  };
}

test('tool call runner executes read tools in chat mode', async () => {
  const { executeToolCall } = require('../dist/chat/tools/runner');
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hi-tool-runner-read-'));
  fs.writeFileSync(path.join(workspaceRoot, 'note.txt'), 'hello UTF-8 中文', 'utf8');

  const result = await executeToolCall({
    toolCall: toolCall('call-read', 'read_file', { path: 'note.txt' }),
    mode: 'chat',
    permissionMode: 'ask',
    workspaceRoot,
  });

  assert.equal(result.permission.decision, 'allow');
  assert.equal(result.permissionRequired, false);
  assert.equal(result.message.role, 'tool');
  assert.equal(result.message.tool_call_id, 'call-read');
  assert.match(result.message.content, /hello UTF-8 中文/);
});

test('tool call runner denies write tools in chat mode without writing', async () => {
  const { executeToolCall } = require('../dist/chat/tools/runner');
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hi-tool-runner-deny-'));
  const target = path.join(workspaceRoot, 'out.txt');

  const result = await executeToolCall({
    toolCall: toolCall('call-write', 'write_file', { path: 'out.txt', content: 'nope' }),
    mode: 'chat',
    permissionMode: 'ask',
    workspaceRoot,
  });

  assert.equal(result.permission.decision, 'deny');
  assert.equal(result.message.role, 'tool');
  assert.equal(result.message.tool_call_id, 'call-write');
  assert.match(result.message.content, /denied/i);
  assert.equal(fs.existsSync(target), false);
});

test('tool call runner executes workspace writes in agent bypass mode', async () => {
  const { executeToolCall } = require('../dist/chat/tools/runner');
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hi-tool-runner-write-'));

  const result = await executeToolCall({
    toolCall: toolCall('call-write', 'write_file', { path: 'nested/out.txt', content: 'created' }),
    mode: 'agent',
    permissionMode: 'bypass',
    workspaceRoot,
  });

  assert.equal(result.permission.decision, 'allow');
  assert.equal(result.message.content, 'OK');
  assert.equal(fs.readFileSync(path.join(workspaceRoot, 'nested', 'out.txt'), 'utf8'), 'created');
});

test('tool call runner returns permission required in agent ask mode', async () => {
  const { executeToolCall } = require('../dist/chat/tools/runner');
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hi-tool-runner-ask-'));

  const result = await executeToolCall({
    toolCall: toolCall('call-write', 'write_file', { path: 'out.txt', content: 'wait' }),
    mode: 'agent',
    permissionMode: 'ask',
    workspaceRoot,
  });

  assert.equal(result.permission.decision, 'ask');
  assert.equal(result.permissionRequired, true);
  assert.match(result.message.content, /permission required/i);
  assert.equal(fs.existsSync(path.join(workspaceRoot, 'out.txt')), false);
});
