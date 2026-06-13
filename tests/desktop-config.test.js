const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

test('root package exposes desktop scripts', () => {
  const pkg = readJson('package.json');

  assert.equal(pkg.scripts['desktop:install'], 'npm install --prefix desktop');
  assert.equal(pkg.scripts['desktop:build'], 'npm run build && npm run build --prefix desktop');
  assert.match(pkg.scripts['desktop:dist:win'], /dist:win --prefix desktop/);
  assert.match(pkg.scripts['desktop:dist:mac'], /dist:mac --prefix desktop/);
});

test('desktop package uses electron vite react and electron-builder targets', () => {
  const pkg = readJson(path.join('desktop', 'package.json'));
  const builder = fs.readFileSync(path.join('desktop', 'electron-builder.yml'), 'utf8');

  assert.ok(pkg.dependencies.react);
  assert.ok(pkg.devDependencies.electron);
  assert.ok(pkg.devDependencies['electron-builder']);
  assert.ok(pkg.devDependencies.vite);
  assert.match(pkg.scripts.build, /copy:cli/);
  assert.match(builder, /nsis/);
  assert.match(builder, /dmg/);
});

test('desktop main preload and renderer entry files exist', () => {
  [
    'desktop/index.html',
    'desktop/src/main/main.ts',
    'desktop/src/main/cli-runner.ts',
    'desktop/src/main/permissions.ts',
    'desktop/src/preload/index.ts',
    'desktop/src/renderer/App.tsx',
    'desktop/src/renderer/styles.css',
    'desktop/scripts/copy-cli.cjs',
  ].forEach((file) => assert.equal(fs.existsSync(file), true, `${file} missing`));
});

test('desktop release workflow uploads windows and mac artifacts', () => {
  const workflow = fs.readFileSync(path.join('.github', 'workflows', 'desktop-release.yml'), 'utf8');

  assert.match(workflow, /windows-latest/);
  assert.match(workflow, /macos-latest/);
  assert.match(workflow, /npm install/);
  assert.doesNotMatch(workflow, /cache:\s*npm/);
  assert.match(workflow, /upload-artifact/);
  assert.match(workflow, /softprops\/action-gh-release/);
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /desktop:dist:win/);
  assert.match(workflow, /desktop:dist:mac/);
});

test('desktop runner supports packaged CLI resource path', () => {
  const runner = fs.readFileSync(path.join('desktop', 'src', 'main', 'cli-runner.ts'), 'utf8');
  const copyScript = fs.readFileSync(path.join('desktop', 'scripts', 'copy-cli.cjs'), 'utf8');

  assert.match(runner, /app\.isPackaged/);
  assert.match(runner, /dist['"], ['"]cli/);
  assert.match(runner, /ELECTRON_RUN_AS_NODE/);
  assert.match(copyScript, /pkg\.dependencies/);
  assert.match(copyScript, /--omit=dev/);
});

test('desktop IPC bridge restricts renderer origin and noninteractive commands', () => {
  const main = fs.readFileSync(path.join('desktop', 'src', 'main', 'main.ts'), 'utf8');
  const permissions = fs.readFileSync(path.join('desktop', 'src', 'main', 'permissions.ts'), 'utf8');
  const renderer = fs.readFileSync(path.join('desktop', 'src', 'renderer', 'App.tsx'), 'utf8');

  assert.match(main, /isAllowedRendererUrl/);
  assert.match(main, /senderFrame\?\.url/);
  assert.match(permissions, /'install'/);
  assert.match(permissions, /'skills'/);
  assert.match(permissions, /'clear'/);
  assert.match(renderer, /hi --clear/);
  assert.match(renderer, /hi --skills/);
  assert.match(renderer, /hi --install/);
});

test('desktop builder is wired for GitHub release publishing', () => {
  const builder = fs.readFileSync(path.join('desktop', 'electron-builder.yml'), 'utf8');

  assert.match(builder, /provider: github/);
  assert.match(builder, /releaseType: release/);
});
