const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

execFileSync('cmd.exe', ['/c', 'cd desktop && npx tsc -p tsconfig.json'], { stdio: 'pipe' });

test('release asset allowlist is populated only from latest release assets', () => {
  const {
    createReleaseAssetAllowlist,
    rememberReleaseAssetUrls,
    isAllowedReleaseAssetUrl,
  } = require('../desktop/dist/main/release-assets');

  const allowlist = createReleaseAssetAllowlist();
  const firstUrl = 'https://github.com/AIMFllyYS/0-1-CLI/releases/download/v1/Zero-One.exe';
  const secondUrl = 'https://github.com/AIMFllyYS/0-1-CLI/releases/download/v2/Zero-One.dmg';

  rememberReleaseAssetUrls(allowlist, {
    ok: true,
    assets: [
      { name: 'Zero-One.exe', browserDownloadUrl: firstUrl, size: 1024 },
      { name: 'empty-url.zip', browserDownloadUrl: '', size: 0 },
    ],
  });

  assert.equal(isAllowedReleaseAssetUrl(allowlist, firstUrl), true);
  assert.equal(isAllowedReleaseAssetUrl(allowlist, secondUrl), false);
  assert.equal(isAllowedReleaseAssetUrl(allowlist, 42), false);

  rememberReleaseAssetUrls(allowlist, {
    ok: true,
    assets: [{ name: 'Zero-One.dmg', browserDownloadUrl: secondUrl, size: 2048 }],
  });

  assert.equal(isAllowedReleaseAssetUrl(allowlist, firstUrl), false);
  assert.equal(isAllowedReleaseAssetUrl(allowlist, secondUrl), true);

  rememberReleaseAssetUrls(allowlist, { ok: false, error: 'GitHub API 404' });
  assert.equal(isAllowedReleaseAssetUrl(allowlist, secondUrl), false);
});
