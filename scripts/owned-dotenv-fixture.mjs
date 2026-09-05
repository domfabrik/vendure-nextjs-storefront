import assert from 'node:assert/strict';
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function ownedProductionDotenvFixture(workspaceRoot, contents) {
  const target = resolve(workspaceRoot, '.env.production');
  const backup = resolve(workspaceRoot, `.env.production.seo-http-${process.pid}.backup`);
  const fixtureBytes = Buffer.from(contents);
  let backupOwned = false;
  let fixtureOwned = false;

  return {
    install() {
      assert.equal(backupOwned || fixtureOwned, false, 'dotenv fixture is already installed');
      assert.equal(existsSync(backup), false, 'refusing to overwrite an existing dotenv fixture backup');
      if (existsSync(target)) {
        renameSync(target, backup);
        backupOwned = true;
      }
      try {
        writeFileSync(target, fixtureBytes, { flag: 'wx', mode: 0o600 });
        fixtureOwned = true;
      } catch (error) {
        if (backupOwned && !existsSync(target)) {
          renameSync(backup, target);
          backupOwned = false;
        }
        throw error;
      }
    },

    restore() {
      if (fixtureOwned) {
        assert.equal(readFileSync(target).equals(fixtureBytes), true, 'refusing to remove a changed dotenv fixture');
        rmSync(target);
        fixtureOwned = false;
      }
      if (backupOwned) {
        assert.equal(existsSync(target), false, 'refusing to overwrite a changed dotenv target during restore');
        renameSync(backup, target);
        backupOwned = false;
      }
    },
  };
}
