import fs from 'node:fs';
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

function propName(node, source) {
  if (!node?.name) return null;
  return node.name.getText(source).replace(/^['"]|['"]$/g, '');
}

function objectPropertyMap(object, source) {
  const map = new Map();
  for (const item of object.properties) {
    if (ts.isSpreadAssignment(item)) throw new Error('Shell audit needs explicit shell metadata fields; review the spread.');
    if (!ts.isPropertyAssignment(item) && !ts.isShorthandPropertyAssignment(item)) continue;
    const name = propName(item, source);
    if (name) map.set(name, item);
  }
  return map;
}

function findManifestObject() {
  const source = ts.createSourceFile(
    'manifest.ts',
    fs.readFileSync('app/manifest.ts', 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let result = null;
  function visit(node) {
    if (result) return;
    if (ts.isReturnStatement(node) && node.expression && ts.isObjectLiteralExpression(node.expression)) result = { source, object: node.expression };
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!result) throw new Error('Could not locate the manifest object for shell audit.');
  return result;
}

function literalString(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
}

function collectManifestIconSources(iconNode) {
  if (!iconNode || !ts.isPropertyAssignment(iconNode) || !ts.isArrayLiteralExpression(iconNode.initializer)) return [];
  const sources = new Set();
  for (const element of iconNode.initializer.elements) {
    if (!ts.isObjectLiteralExpression(element)) continue;
    const props = objectPropertyMap(element, element.getSourceFile());
    const srcProp = props.get('src');
    if (!srcProp || !ts.isPropertyAssignment(srcProp)) continue;
    const src = literalString(srcProp.initializer);
    if (src?.startsWith('/')) sources.add(src);
  }
  return [...sources].sort();
}

export function shellFingerprint() {
  const files = {};

  // Only fields that iOS may effectively cache as installation identity/shell
  // are reinstall-sensitive. Android-only conveniences such as shortcuts,
  // maskable purpose, categories, or prefer_related_applications are ignored.
  const reinstallManifestFields = new Set([
    'id',
    'name',
    'short_name',
    'start_url',
    'scope',
    'display',
    'display_override',
  ]);

  const { source: manifestSource, object: manifestObject } = findManifestObject();
  const manifestProps = objectPropertyMap(manifestObject, manifestSource);
  for (const field of reinstallManifestFields) {
    const item = manifestProps.get(field);
    if (item) files[`manifest.${field}`] = tokens(item.getText(manifestSource));
  }

  // Track the actual app icon files, but not Android-only icon metadata such as
  // purpose="maskable". Duplicating the same icon for maskable support should
  // therefore not force iOS users to reinstall.
  const manifestIconSources = collectManifestIconSources(manifestProps.get('icons'));
  files['manifest.iconSources'] = JSON.stringify(manifestIconSources);
  for (const src of manifestIconSources) {
    const asset = `public${src}`;
    if (fs.existsSync(asset)) files[asset] = digest(fs.readFileSync(asset));
  }

  const layoutSource = ts.createSourceFile(
    'layout.tsx',
    fs.readFileSync('app/layout.tsx', 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const layoutFields = new Set(['appleWebApp', 'icons', 'manifest', 'applicationName']);
  function visitLayout(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(layoutSource) === 'metadata' &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const item of node.initializer.properties) {
        if (ts.isSpreadAssignment(item)) throw new Error('Shell audit needs explicit metadata fields; review the metadata spread.');
        const name = propName(item, layoutSource);
        if (name && layoutFields.has(name)) files[`metadata.${name}`] = tokens(item.getText(layoutSource));
      }
    }
    ts.forEachChild(node, visitLayout);
  }
  visitLayout(layoutSource);

  // Include any local icon assets directly referenced by reinstall-sensitive
  // metadata. This catches apple-touch-icon changes even if the filename stays
  // the same.
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
  if (fingerprint === release.fingerprint) throw new Error('No reinstall-sensitive shell metadata changed; ordinary deploys do not need a reinstall release.');
  fs.writeFileSync(
    releasePath,
    JSON.stringify({ version: release.version + 1, reinstallRequired: true, reason, fingerprint }, null, 2) + '\n',
  );
  console.log('Reinstall-required release recorded. Review the reason and commit it with the shell changes.');
} else {
  if (
    !Number.isInteger(release.version) ||
    release.version < 1 ||
    typeof release.reinstallRequired !== 'boolean' ||
    (release.reinstallRequired && !release.reason?.trim())
  ) throw new Error('Invalid shell release state.');

  if (fingerprint !== release.fingerprint) {
    console.error('::error title=ASOFAB reinstall review required::Reinstall-sensitive iOS/Home Screen metadata or app icon bytes changed. Run npm run shell:release -- "Reason shown to members" and review before deploying.');
    process.exitCode = 1;
  }

  if (process.env.SHELL_BASE_SHA && !/^0+$/.test(process.env.SHELL_BASE_SHA)) {
    let previous;
    try {
      previous = JSON.parse(execFileSync('git', ['show', `${process.env.SHELL_BASE_SHA}:${releasePath}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
    } catch { /* Initial adoption has no release file. */ }
    if (
      previous &&
      (release.version < previous.version ||
        (previous.fingerprint !== release.fingerprint &&
          (release.version <= previous.version || !release.reinstallRequired)))
    ) {
      console.error('::error::Changed reinstall-sensitive shell requires an increased version and explicit reinstallRequired=true.');
      process.exitCode = 1;
    }
  }

  const message = process.exitCode
    ? 'ASOFAB shell changed: reinstall review required before deployment.'
    : `ASOFAB shell v${release.version}: ${release.reinstallRequired ? `reinstall release — ${release.reason}` : 'ordinary deployment; no reinstall required'}.`;
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, message + '\n');
}
