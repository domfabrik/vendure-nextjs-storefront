import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = process.env.SEO_DIST_DIR || '.next';
const standaloneDir = resolve(process.cwd(), distDir, 'standalone');
assert.equal(existsSync(standaloneDir), true, `standalone output is missing: ${standaloneDir}`);

for (const filename of ['.env', '.env.production']) {
  const runtimeEnvPath = resolve(standaloneDir, filename);
  rmSync(runtimeEnvPath, { force: true });
  assert.equal(existsSync(runtimeEnvPath), false, `standalone runtime env was not removed: ${runtimeEnvPath}`);
}

console.log(`Removed build dotenv defaults from ${standaloneDir}`);
