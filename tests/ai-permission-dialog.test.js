const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

execFileSync('cmd.exe', ['/c', 'npm run build --silent'], { stdio: 'pipe' });

function writeCall(id = 'call-write') {
  return {
    id,
    type: 'function',
    function: {
      name: 'write_file',
      arguments: JSON.stringify({ path: 'out.txt', content: 'created 中文' }),
    },
  };
}

test('permission prompt choice parser supports allow once deny and session allow', () => {
  const { parsePermissionPromptChoice } = require('../dist/chat/permissions/prompts');

  assert.deepEqual(parsePermissionPromptChoice('1'), { kind: 'allow_once' });
  assert.deepEqual(parsePermissionPromptChoice('allow'), { kind: 'allow_once' });
  assert.deepEqual(parsePermissionPromptChoice('2'), { kind: 'allow_session' });
  assert.deepEqual(parsePermissionPromptChoice('3'), { kind: 'deny' });
  assert.deepEqual(parsePermissionPromptChoice('session'), { kind: 'allow_session' });
  assert.deepEqual(parsePermissionPromptChoice('no'), { kind: 'deny' });
  assert.deepEqual(parsePermissionPromptChoice('wat'), { kind: 'invalid' });
});

test('allow once executes pending tool then resumes the agent turn', async () => {
  const { runAgentTurn } = require('../dist/chat/agent/loop');
  const { applyPermissionPromptChoice } = require('../dist/chat/permissions/prompts');
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hi-permission-dialog-'));
  const messages = [{ role: 'user', content: 'write out.txt' }];
  let completionCount = 0;
  const complete = async () => {
    completionCount += 1;
    if (completionCount === 1) {
      return { role: 'assistant', content: '', tool_calls: [writeCall()] };
    }
    return { role: 'assistant', content: 'Wrote the file.' };
  };

  const pending = await runAgentTurn({
    messages,
    workspaceRoot,
    mode: 'agent',
    permissionMode: 'ask',
    complete,
  });
  assert.equal(pending.status, 'permission_required');

  const session = {};
  const resumed = await applyPermissionPromptChoice({
    choice: { kind: 'allow_once' },
    pending,
    messages,
    workspaceRoot,
    mode: 'agent',
    permissionMode: 'ask',
    session,
    complete,
  });

  assert.equal(resumed.status, 'completed');
  assert.equal(resumed.finalMessage.content, 'Wrote the file.');
  assert.equal(fs.readFileSync(path.join(workspaceRoot, 'out.txt'), 'utf8'), 'created 中文');
  assert.equal(messages.at(-2).role, 'tool');
  assert.equal(messages.at(-1).content, 'Wrote the file.');
  assert.equal(session.allowedTools, undefined);
  assert.equal(session.allowedRules, undefined);
});

test('allow session remembers the tool while deny never executes it', async () => {
  const { runAgentTurn } = require('../dist/chat/agent/loop');
  const { applyPermissionPromptChoice } = require('../dist/chat/permissions/prompts');
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hi-permission-session-'));
  const session = {};

  const denied = await applyPermissionPromptChoice({
    choice: { kind: 'deny' },
    pending: {
      status: 'permission_required',
      pendingToolCall: writeCall('deny-call'),
      permission: { decision: 'ask', reason: 'agent mode requires confirmation' },
      assistantMessage: { role: 'assistant', content: '', tool_calls: [writeCall('deny-call')] },
      toolMessage: { role: 'tool', tool_call_id: 'deny-call', content: 'Permission required' },
      toolResults: [],
    },
    messages: [{ role: 'assistant', content: '', tool_calls: [writeCall('deny-call')] }],
    workspaceRoot,
    mode: 'agent',
    permissionMode: 'ask',
    session,
    complete: async () => ({ role: 'assistant', content: 'Denied.' }),
  });
  assert.equal(denied.status, 'denied');
  assert.equal(fs.existsSync(path.join(workspaceRoot, 'out.txt')), false);

  const pending = await runAgentTurn({
    messages: [{ role: 'user', content: 'write again' }],
    workspaceRoot,
    mode: 'agent',
    permissionMode: 'ask',
    session,
    complete: async () => ({ role: 'assistant', content: '', tool_calls: [writeCall('session-call')] }),
  });
  assert.equal(pending.status, 'permission_required');

  await applyPermissionPromptChoice({
    choice: { kind: 'allow_session' },
    pending,
    messages: [{ role: 'assistant', content: '', tool_calls: [writeCall('session-call')] }],
    workspaceRoot,
    mode: 'agent',
    permissionMode: 'ask',
    session,
    complete: async () => ({ role: 'assistant', content: 'Session allowed.' }),
  });

  assert.equal(session.allowedTools, undefined);
  assert.equal(session.allowedRules[0].toolName, 'write_file');
  assert.ok(session.allowedRules[0].pathPrefix.endsWith('out.txt'));
});
