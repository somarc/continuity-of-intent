/* eslint-env node */
/* eslint-disable no-console, global-require */

const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} = require('node:fs');
const { homedir } = require('node:os');
const { extname, join, resolve, sep } = require('node:path');

const STAGE = resolve('.da/media-staging');
const RAW = resolve(STAGE, 'raw');

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8' }).trim();
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function sessionEvidence(receiptFile, toolName, extensions, managedFolders) {
  if (!existsSync(receiptFile) || statSync(receiptFile).size === 0) {
    throw new Error(`Missing Grok receipt: ${receiptFile}`);
  }
  const receipt = JSON.parse(readFileSync(receiptFile, 'utf8'));
  if (!receipt.sessionId) throw new Error(`Grok receipt has no sessionId: ${receiptFile}`);
  const sessionDir = join(
    homedir(), '.grok', 'sessions', encodeURIComponent(process.cwd()), receipt.sessionId,
  );
  const updatesFile = join(sessionDir, 'updates.jsonl');
  if (!existsSync(updatesFile)) throw new Error(`Missing Grok session updates: ${updatesFile}`);
  const transcript = readFileSync(updatesFile, 'utf8');
  const toolObserved = transcript.includes(`\"name\":\"${toolName}\"`)
    || transcript.includes(`\"name\": \"${toolName}\"`);
  if (!toolObserved) throw new Error(`Grok session ${receipt.sessionId} did not record ${toolName}`);

  const escapedSession = sessionDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const extensionPattern = extensions.map((extension) => extension.replace('.', '\\.')).join('|');
  const folderPattern = managedFolders.join('|');
  const outputPattern = new RegExp(
    `${escapedSession}/(?:${folderPattern})/[^"\\\\]+(?:${extensionPattern})`, 'gi',
  );
  const candidates = [...new Set(transcript.match(outputPattern) || [])]
    .filter((candidate) => existsSync(candidate));
  if (!candidates.length) throw new Error(`No managed ${toolName} output found in ${updatesFile}`);

  const source = realpathSync(candidates[candidates.length - 1]);
  const managedRoots = managedFolders
    .map((folder) => join(sessionDir, folder))
    .filter((folder) => existsSync(folder))
    .map((folder) => realpathSync(folder));
  if (!managedRoots.some((root) => source.startsWith(`${root}${sep}`))) {
    throw new Error(`Refusing output outside Grok session managed media directories: ${source}`);
  }
  return { receipt, sessionDir, updatesFile, source, toolName };
}

function collectPoster(evidence) {
  const extension = extname(evidence.source).toLowerCase() || '.jpg';
  const rawTarget = resolve(RAW, `continuity-hero-source${extension}`);
  const target = resolve(STAGE, 'continuity-hero-poster.webp');
  copyFileSync(evidence.source, rawTarget);
  run('magick', [
    rawTarget,
    '-auto-orient',
    '-resize', '2400x1350^',
    '-gravity', 'center',
    '-extent', '2400x1350',
    '-quality', '86',
    target,
  ]);
  return { rawTarget, target, normalizedWith: 'ImageMagick 2400x1350 WebP q86' };
}

function collectVideo(evidence) {
  const rawTarget = resolve(RAW, 'continuity-hero-source.mp4');
  const target = resolve(STAGE, 'continuity-hero-loop.mp4');
  copyFileSync(evidence.source, rawTarget);
  const probe = JSON.parse(run('ffprobe', [
    '-v', 'error', '-show_streams', '-show_format', '-of', 'json', rawTarget,
  ]));
  const stream = probe.streams.find((candidate) => candidate.codec_type === 'video');
  if (!stream) throw new Error('Imagine video output has no video stream');

  if (stream.codec_name === 'h264' && stream.pix_fmt === 'yuv420p') {
    run('ffmpeg', [
      '-y', '-i', rawTarget, '-map', '0:v:0', '-an', '-c:v', 'copy',
      '-movflags', '+faststart', target,
    ]);
    return { rawTarget, target, normalizedWith: 'FFmpeg stream copy, audio removed, fast-start' };
  }

  run('ffmpeg', [
    '-y', '-i', rawTarget, '-map', '0:v:0', '-an', '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '20',
    '-movflags', '+faststart', target,
  ]);
  return { rawTarget, target, normalizedWith: 'FFmpeg H.264 yuv420p CRF20, audio removed, fast-start' };
}

function main() {
  const [kind, receiptArg] = process.argv.slice(2).filter((arg) => arg !== '--optional');
  const optional = process.argv.includes('--optional');
  if (!['poster', 'video'].includes(kind) || !receiptArg) {
    throw new Error('Usage: node tools/collect-grok-media.cjs <poster|video> <receipt.json> [--optional]');
  }
  mkdirSync(RAW, { recursive: true });

  const toolName = kind === 'poster' ? 'image_gen' : 'image_to_video';
  const extensions = kind === 'poster'
    ? ['.jpg', '.jpeg', '.png', '.webp']
    : ['.mp4', '.mov', '.webm'];
  const managedFolders = kind === 'poster' ? ['images'] : ['videos', 'images'];
  let evidence;
  try {
    evidence = sessionEvidence(resolve(receiptArg), toolName, extensions, managedFolders);
  } catch (error) {
    if (optional) {
      console.log(`Optional ${kind} not collected: ${error.message}`);
      return;
    }
    throw error;
  }

  const collected = kind === 'poster' ? collectPoster(evidence) : collectVideo(evidence);
  const result = {
    kind,
    tool: evidence.toolName,
    sessionId: evidence.receipt.sessionId,
    managedSource: evidence.source,
    managedSourceSha256: sha256(evidence.source),
    rawCopy: collected.rawTarget.replace(`${process.cwd()}/`, ''),
    output: collected.target.replace(`${process.cwd()}/`, ''),
    outputSha256: sha256(collected.target),
    normalizedWith: collected.normalizedWith,
  };
  writeFileSync(resolve(STAGE, `collector-${kind}.json`), `${JSON.stringify(result, null, 2)}\n`, {
    mode: 0o600,
  });
  console.log(JSON.stringify(result, null, 2));
}

try {
  main();
} catch (error) {
  console.error(`Grok media collection failed: ${error.message}`);
  process.exitCode = 1;
}
