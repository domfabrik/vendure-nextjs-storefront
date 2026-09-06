/** Start the pinned Vendure lead-test worker for the CI isolated-write job. */
import { fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const backendDir = resolve(process.env.LEAD_BACKEND_DIR ?? '../vendure');
const { Client } = createRequire(resolve(backendDir, 'package.json'))('pg');

const database = {
  host: process.env.PGHOST ?? '127.0.0.1',
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? 'lead_e2e',
  user: process.env.PGUSER ?? 'lead_fixture',
  password: process.env.PGPASSWORD ?? 'lead_fixture_password',
};
const port = Number(process.env.LEAD_TEST_PORT ?? 31910);
const schema = `lead_test_ci_${randomUUID().replaceAll('-', '')}`;
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('LEAD_TEST_PORT must be a valid local port');
const db = new Client(database);
await db.connect();
await db.query(`CREATE SCHEMA "${schema}"`);
await db.end();
const worker = fork(resolve(backendDir, 'packages/fabric-server/lead/lead-test-server.ts'), [], {
  cwd: backendDir,
  env: {
    ...process.env,
    DB_HOST: '127.0.0.1',
    DB_PORT: String(database.port),
    DB_NAME: database.database,
    DB_USERNAME: database.user,
    DB_PASSWORD: database.password,
    DB_SCHEMA: schema,
    LEAD_TEST_WORKER: 'true',
    LEAD_TEST_SEED: 'true',
    LEAD_TEST_PORT: String(port),
    TS_NODE_PROJECT: 'tsconfig.docker-runtime.json',
  },
  execArgv: ['-r', resolve(backendDir, 'node_modules/ts-node/register/transpile-only')],
  stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
});
worker.on('message', (message) => {
  if (!message.ready) return;
  const api = `http://127.0.0.1:${port}/shop-api`;
  if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `LEAD_TEST_API_URL=${api}\n`);
  process.stdout.write(`Owned isolated Vendure fixture ready at 127.0.0.1:${port}\n`);
});
worker.on('exit', (code) => process.exit(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => worker.send({ id: 990001, action: 'close' }));
