import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PGlite } from '@electric-sql/pglite';

// Isolated fixtures verify the audit against actual file changes, not its own hash formula.
const root = process.cwd();
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'asofab-shell-'));
assert.equal(path.dirname(path.resolve(fixture)), path.resolve(os.tmpdir()));
assert.ok(path.basename(fixture).startsWith('asofab-shell-'));
try {
  for (const dir of ['app', 'public', 'data']) fs.mkdirSync(path.join(fixture, dir));
  for (const file of ['app/layout.tsx','app/manifest.ts','public/icon.png','public/apple-icon.png','data/app-shell-release.json']) fs.copyFileSync(file, path.join(fixture, file));
  const run = (...args) => spawnSync(process.execPath, [path.join(root, 'scripts/check-app-shell.mjs'), ...args], { cwd: fixture, encoding: 'utf8' });
  assert.equal(run().status, 0, 'baseline accepts unchanged install metadata');
  fs.appendFileSync(path.join(fixture, 'app/layout.tsx'), '\n// normal feature edit\n');
  fs.writeFileSync(path.join(fixture, 'app/globals.css'), 'body {color: gold}');
  assert.equal(run().status, 0, 'CSS and ordinary layout changes do not require reinstall');
  fs.appendFileSync(path.join(fixture, 'public/icon.png'), 'changed icon bytes');
  assert.equal(run().status, 1, 'changed icon bytes require explicit release');
  assert.equal(run('--release', 'A new raven seal awaits.').status, 0);
  assert.equal(run().status, 0);
  const next = JSON.parse(fs.readFileSync(path.join(fixture, 'data/app-shell-release.json')));
  assert.equal(next.version, 2); assert.equal(next.reinstallRequired, true);
  assert.equal(run('--release', 'Unnecessary release').status, 1);
  const manifest = path.join(fixture, 'app/manifest.ts');
  fs.writeFileSync(manifest, fs.readFileSync(manifest, 'utf8').replace('scope: "/"', 'scope: "/new/"'));
  assert.equal(run().status, 1, 'scope change requires release');
} finally {
  // This path is produced directly by mkdtemp within the system temp directory.
  fs.rmSync(fixture, { recursive: true, force: true });
}

const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role;
create schema auth; create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
await db.exec(fs.readFileSync('supabase/migrations/20260913213000_mascot_notifications.sql', 'utf8'));
await db.exec(fs.readFileSync('supabase/migrations/20260914000000_app_shell_installations.sql', 'utf8'));
const a='00000000-0000-4000-8000-000000000001', b='00000000-0000-4000-8000-000000000002';
await db.query('insert into auth.users values ($1),($2)',[a,b]);
await db.query('insert into app_shell_installations(user_id,installation_id,acknowledged_version) values ($1,$1,1),($1,$2,2),($2,$2,1)',[a,b]);
assert.equal((await db.query('select * from pending_shell_recipients(2)')).rows.length,2,'another current device must not hide the older device');
await db.query(`insert into site_notifications(user_id,kind,source,mascot,title,body,dedupe_key) values ($1,'realm_notice','realm','mara','Seal','Guide',$2)`,[a,`shell:2:${a}`]);
assert.equal((await db.query('select * from pending_shell_recipients(2)')).rows.length,1,'delivery deduplicates per release/account');
await db.query(`insert into notification_preferences(user_id,preferences) values ($1,'{"realm_notices":false}')`,[b]);
assert.equal((await db.query('select * from pending_shell_recipients(2)')).rows.length,0,'respects notification preferences');
await db.exec('grant usage on schema public,auth to authenticated; grant select on app_shell_installations to authenticated; set role authenticated;');
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);
assert.equal((await db.query('select * from app_shell_installations')).rows.length,1,'account isolation');
await assert.rejects(db.query('select * from pending_shell_recipients(2)'), /permission denied/);
await db.close();
console.log('Shell audit, version transition, per-device state, delivery dedupe, preferences and RLS checks passed.');
