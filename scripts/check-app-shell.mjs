import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import ts from 'typescript';
import { execFileSync } from 'node:child_process';

const releasePath = 'data/app-shell-release.json';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function tokens(text) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text);
  const result = [];
  while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) result.push(scanner.getTokenText());
  return result.join(' ');
}
export function shellFingerprint() {
  const files = { 'app/manifest.ts': tokens(fs.readFileSync('app/manifest.ts', 'utf8')) };
  const source = ts.createSourceFile('layout.tsx', fs.readFileSync('app/layout.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const fields = new Set(['appleWebApp', 'icons', 'manifest', 'applicationName', 'other']);
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'metadata' && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      for (const item of node.initializer.properties) {
        if (item.name && fields.has(item.name.getText(source))) files[`metadata.${item.name.getText(source)}`] = tokens(item.getText(source));
        if (ts.isSpreadAssignment(item)) throw new Error('Shell audit needs explicit metadata fields; review the metadata spread.');
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  function walk(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, item.name).replaceAll('\\', '/');
      if (item.isDirectory() && directory !== 'public') walk(filename);
      else if (/^(apple-icon|apple-touch-icon|icon|favicon|startup|splash)([.\-]|$)/i.test(item.name)) files[filename] = digest(fs.readFileSync(filename));
    }
  }
  walk('app'); walk('public');
  // Explicitly include every referenced local icon, including custom asset names.
  for (const match of Object.values(files).join('\n').matchAll(/["'](\/[^"']+\.(?:png|webp|svg|ico|jpg))["']/g)) {
    const asset = `public${match[1]}`;
    if (fs.existsSync(asset)) files[asset] = digest(fs.readFileSync(asset));
  }
  return digest(JSON.stringify(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))));
}

const release = JSON.parse(fs.readFileSync(releasePath, 'utf8'));
const fingerprint = shellFingerprint();
const reasonIndex = process.argv.indexOf('--release');
if (reasonIndex >= 0) {
  const reason = process.argv[reasonIndex + 1]?.trim();
  if (!reason || reason.startsWith('--')) throw new Error('Provide a concise user-facing reinstall reason.');
  if (fingerprint === release.fingerprint) throw new Error('No shell metadata changed; ordinary deploys do not need a reinstall release.');
  fs.writeFileSync(releasePath, JSON.stringify({ version: release.version + 1, reinstallRequired: true, reason, fingerprint }, null, 2) + '\n');
  console.log('Reinstall-required release recorded. Review the reason and commit it with the shell changes.');
} else {
  if (!Number.isInteger(release.version) || release.version < 1 || typeof release.reinstallRequired !== 'boolean' || (release.reinstallRequired && !release.reason?.trim())) throw new Error('Invalid shell release state.');
  if (fingerprint !== release.fingerprint) {
    console.error('::error title=ASOFAB reinstall review required::Install-time shell metadata or icon bytes changed. Run npm run shell:release -- "Reason shown to members" and review before deploying.');
    process.exitCode = 1;
  }
  if (process.env.SHELL_BASE_SHA && !/^0+$/.test(process.env.SHELL_BASE_SHA)) {
    let previous;
    try { previous = JSON.parse(execFileSync('git', ['show', `${process.env.SHELL_BASE_SHA}:${releasePath}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); } catch { /* Initial adoption has no release file. */ }
    if (previous && (release.version < previous.version || (previous.fingerprint !== release.fingerprint && (release.version <= previous.version || !release.reinstallRequired)))) {
      console.error('::error::Changed shell requires an increased version and explicit reinstallRequired=true.');
      process.exitCode = 1;
    }
  }
  const message = process.exitCode ? 'ASOFAB shell changed: reinstall review required before deployment.' : `ASOFAB shell v${release.version}: ${release.reinstallRequired ? `reinstall release — ${release.reason}` : 'ordinary deployment; no reinstall required'}.`;
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, message + '\n');
}
