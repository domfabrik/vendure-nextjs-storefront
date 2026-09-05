import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/main.yml', 'utf8');
const dockerfile = readFileSync('Dockerfile', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const apiClient = readFileSync('src/shared/api/api-client.ts', 'utf8');
const serverEnv = readFileSync('src/shared/config/env/server.ts', 'utf8');

const environmentFileStep = workflow.match(/- name: Create environment file[\s\S]*?(?=\n\s+- name:)/)?.[0];
assert.ok(environmentFileStep, 'CI environment-file step must exist');
assert.doesNotMatch(environmentFileStep, /^\s*API_URL=/m, 'TC-A1 public build URL must not be copied into the runtime environment file');
assert.match(
  workflow,
  /--build-arg "BUILD_API_URL=\$\{\{ steps\.vars\.outputs\.public_origin \}\}\/shop-api"/,
  'TC-A1 build-only sitemap API must be passed explicitly to the builder',
);

const [buildStages, runnerStage] = dockerfile.split(/FROM node:\$\{NODE_VER\}-bookworm-slim AS runner/);
assert.match(buildStages, /ARG BUILD_API_URL/, 'TC-A1 Docker builder must declare the build-only API argument');
assert.match(buildStages, /ENV API_URL=\$\{BUILD_API_URL\}/, 'TC-A1 builder must expose the API URL only while Next builds');
assert.match(buildStages, /sed -i '\/\^\[\[:space:\]\]\*API_URL=\/d' \.env\.production/, 'TC-A1 local build must remove any legacy runtime API default');
assert.match(buildStages, /test -n "\$\{BUILD_API_URL\}"/, 'TC-A1 Docker build must reject a missing build API URL');
assert.doesNotMatch(runnerStage, /(?:ARG BUILD_API_URL|ENV API_URL=)/, 'TC-A1 runner image must not contain a public API fallback');
assert.doesNotMatch(runnerStage, /\.env\.production/, 'TC-A1 runner image must not copy build-time environment defaults');
assert.equal(packageJson.scripts.postbuild, 'node scripts/strip-standalone-env.mjs', 'TC-A1 every production build must remove Next-copied dotenv files from standalone output');

assert.match(serverEnv, /API_URL: process\.env\.API_URL/, 'TC-A2 server env must read API_URL from the runtime process');
assert.match(apiClient, /envServer\.API_URL/, 'TC-A2 server GraphQL client must consume the runtime API_URL');
assert.doesNotMatch(apiClient, /NEXT_PUBLIC_|VENDURE_SERVER_URL/, 'TC-A3 server GraphQL client must not use public browser URL variables');

console.log('TC-A1 build/runtime API separation and TC-A2/A3 server consumer contract passed');
