const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

test('api provider registry includes required platforms and official links', () => {
  execFileSync('cmd.exe', ['/c', 'npm run build --silent'], { stdio: 'pipe' });
  const { API_PROVIDERS } = require('../dist/modules/api');
  const keys = API_PROVIDERS.map((provider) => provider.key);

  for (const key of ['glm', 'kimi', 'deepseek', 'mimo', 'doubao', 'bailian', 'openai', 'google', 'grok', 'claude', 'minimax']) {
    assert.ok(keys.includes(key), `missing ${key}`);
  }

  assert.equal(API_PROVIDERS.find((provider) => provider.key === 'google').url, 'https://aistudio.google.com/');
  assert.match(API_PROVIDERS.find((provider) => provider.key === 'claude').topModel, /Claude/);
});

test('pay registry includes requested payment and relay links', () => {
  const { PAY_RESOURCES } = require('../dist/modules/pay');
  const urls = PAY_RESOURCES.map((resource) => resource.url);

  assert.ok(urls.includes('https://www.supaycard.com/landingView?ref=vggONf'));
  assert.ok(urls.includes('https://www.recode.cat/?aff=YH6TPFDV'));
  assert.ok(urls.includes('https://aisou.pro/'));
  assert.ok(urls.includes('https://apikey.fun/register?aff=N3FM3989JUX8'));
});

test('install registry includes Clash Verge and CC Switch links', () => {
  const { ENV_INSTALL_TARGETS, IDE_INSTALL_TARGETS } = require('../dist/modules/install');
  const all = [...ENV_INSTALL_TARGETS, ...IDE_INSTALL_TARGETS];
  const urls = all.map((target) => target.installUrl || target.sourceUrl);

  assert.ok(urls.includes('https://www.sibker.com/client/Clash.Verge_2.4.7_x64-setup.exe'));
  assert.ok(urls.includes('https://www.sibker.com/client/Clash.Verge_2.4.7_x64.dmg'));
  assert.ok(urls.includes('https://www.sibker.com/client/Clash.Verge_2.4.7_aarch64.dmg'));
  assert.ok(urls.includes('https://github.com/farion1231/cc-switch/releases/download/v3.16.2/CC-Switch-v3.16.2-Windows.msi'));
  assert.ok(urls.includes('https://github.com/farion1231/cc-switch/releases/download/v3.16.2/CC-Switch-v3.16.2-macOS.dmg'));
});
