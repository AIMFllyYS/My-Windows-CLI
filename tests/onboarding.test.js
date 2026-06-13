const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

test('default guide explains CLI onboarding in plain Chinese', () => {
  execFileSync('cmd.exe', ['/c', 'npm run build --silent'], { stdio: 'pipe' });
  const { DEFAULT_GUIDE_KEY, GUIDE_CHAPTERS, renderGuideChapter } = require('../dist/modules/guide');

  const intro = renderGuideChapter(DEFAULT_GUIDE_KEY);
  const keys = GUIDE_CHAPTERS.map((chapter) => chapter.key);

  assert.match(intro, /Claude Code/);
  assert.match(intro, /hi --install -cc/);
  assert.match(intro, /不要害怕/);
  assert.ok(keys.includes('cc-switch'));
  assert.ok(keys.includes('vpn'));
  assert.ok(keys.includes('community'));
});

test('help exposes state, api, and pay routes', () => {
  const help = execFileSync('node', ['dist/index.js', '--help'], { encoding: 'utf8' });

  assert.match(help, /--state/);
  assert.match(help, /--api/);
  assert.match(help, /--pay/);
});
