// @vitest-environment node
import { it } from 'vite-plus/test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const builder = createRequire(new URL('../package.json', import.meta.url));
const testUtils = createRequire(builder.resolve('@vue/test-utils'));
const beautifyPath = testUtils.resolve('js-beautify/package.json');
const beautify = createRequire(beautifyPath);
const editorconfig = beautify('editorconfig');

it('real js-beautify CLI selects nested globs and excludes node_modules and .git', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'builder-beautify-'));
  for (const sub of ['src', 'node_modules', '.git']) await mkdir(path.join(dir, sub));
  const source = 'function demo(){return {a:1,b:2};}';
  for (const name of ['root.js', 'src/nested.js', 'node_modules/ignored.js', '.git/ignored.js']) {
    await writeFile(path.join(dir, name), source);
  }
  await writeFile(
    path.join(dir, '.editorconfig'),
    'root = true\n[*.js]\nindent_style = space\nindent_size = 2\n',
  );
  const cli = path.join(path.dirname(beautifyPath), 'js/bin/js-beautify.js');
  const result = spawnSync(process.execPath, [cli, '--replace', '--editorconfig', '**/*.js'], {
    cwd: dir,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  for (const name of ['root.js', 'src/nested.js']) {
    const formatted = await readFile(path.join(dir, name), 'utf8');
    assert.notEqual(formatted, source);
    assert.match(formatted, /\n {2}return /);
  }
  for (const name of ['node_modules/ignored.js', '.git/ignored.js']) {
    assert.equal(await readFile(path.join(dir, name), 'utf8'), source);
  }
});

it('actual editorconfig matches braces and slash patterns with ordered and nearest precedence', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'builder-editorconfig-'));
  await mkdir(path.join(dir, 'src/nested'), { recursive: true });
  await writeFile(
    path.join(dir, '.editorconfig'),
    'root = true\n[*.{js,ts}]\nindent_style = space\nindent_size = 2\n[src/**.js]\nindent_size = 4\n',
  );
  await writeFile(path.join(dir, 'src/nested/.editorconfig'), '[special.js]\nindent_size = 6\n');
  assert.equal((await editorconfig.parse(path.join(dir, 'root.js'))).indent_size, 2);
  assert.equal((await editorconfig.parse(path.join(dir, 'root.ts'))).indent_size, 2);
  assert.equal((await editorconfig.parse(path.join(dir, 'src/plain.js'))).indent_size, 4);
  assert.equal((await editorconfig.parse(path.join(dir, 'src/nested/special.js'))).indent_size, 6);
  assert.equal((await editorconfig.parse(path.join(dir, 'other.txt'))).indent_size, undefined);
});
